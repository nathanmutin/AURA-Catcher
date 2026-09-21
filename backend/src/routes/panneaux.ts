import { Router } from 'express';
import { asyncHandler } from '../errors';
import { uploadSingleImage } from '../upload';
import { writeLimiter } from '../rateLimit';
import { parseLatLng, sanitizeComment, sanitizeAuthor, parseTypeIds, parseId } from '../validation';
import { listPanneaux, createPanneau, updatePanneau, getPanneauHistory, restorePanneauRevision } from '../services/panneauxService';
import { resolveAuthor, requireAdmin, DEVICE_TOKEN_COOKIE } from '../services/authService';
import { logAction } from '../logger';

const router = Router();

/**
 * GET /api/panneaux
 * Retrieves a list of all billboards (panneaux) ordered by creation date (descending).
 */
router.get('/panneaux', asyncHandler(async (req, res) => {
    const panneaux = await listPanneaux();
    res.json(panneaux);
}));

/**
 * POST /api/panneaux
 * Creates a new billboard entry with an uploaded image.
 *
 * Expects multipart/form-data with:
 * - image: The image file (required)
 * - lat: Latitude (required)
 * - lng: Longitude (required)
 * - comment: Optional comment
 * - author: Optional username
 * - typeId: One or more panel type ids
 */
router.post('/panneaux', writeLimiter, uploadSingleImage, asyncHandler(async (req, res) => {
    const file = req.file;

    const coords = parseLatLng(req.body.lat, req.body.lng);
    const typeIds = parseTypeIds(req.body.typeId);
    const comment = sanitizeComment(req.body.comment);
    const requestedAuthor = sanitizeAuthor(req.body.author);
    if (!file || !coords || !typeIds) {
        await logAction(`[UPLOAD END] failure=validation, file=${file?.filename ?? 'missing'}`);
        res.status(400).json({ error: 'Champs requis manquants ou invalides' });
        return;
    }

    // Refuse seulement si le pseudo demandé est protégé par quelqu'un
    // d'autre — sinon, pseudo libre ou pseudo vérifié de l'appareil, les
    // deux sont acceptés (voir authService.resolveAuthor).
    let author: string | undefined;
    try {
        author = await resolveAuthor(req.cookies?.[DEVICE_TOKEN_COOKIE], requestedAuthor);
    } catch (err) {
        throw err;
    }
    const panneau = await createPanneau({
        file,
        lat: coords.lat,
        lng: coords.lng,
        comment,
        author,
        typeIds,
    });
    await logAction(`[UPLOAD END] success=panel, panelId=${panneau.id}, file=${file.filename}`);
    res.status(201).json(panneau);
}));

/**
 * PATCH /api/panneaux/:id
 * Modifie un panneau existant. Chaque champ est optionnel : seuls ceux
 * présents dans le corps JSON sont modifiés (et historisés).
 *
 * - lat / lng : nouvelle position (déplacement borné côté service)
 * - comment : nouveau commentaire ("" pour l'effacer)
 * - typeId : nouvelle liste de types
 * - author : pseudo de la personne qui modifie
 */
router.patch('/panneaux/:id', writeLimiter, asyncHandler(async (req, res) => {
    const panneauId = parseId(req.params.id);
    if (panneauId === null) {
        res.status(400).json({ error: 'Identifiant de panneau invalide' });
        return;
    }

    const hasPosition = req.body.lat !== undefined || req.body.lng !== undefined;
    const coords = hasPosition ? parseLatLng(req.body.lat, req.body.lng) : null;
    if (hasPosition && !coords) {
        res.status(400).json({ error: 'Coordonnées invalides' });
        return;
    }

    const typeIds = req.body.typeId !== undefined ? parseTypeIds(req.body.typeId) : undefined;
    if (typeIds === null) {
        res.status(400).json({ error: 'Types invalides' });
        return;
    }

    const requestedAuthor = sanitizeAuthor(req.body.author);
    const editor = await resolveAuthor(req.cookies?.[DEVICE_TOKEN_COOKIE], requestedAuthor);

    const panneau = await updatePanneau({
        panneauId,
        lat: coords?.lat,
        lng: coords?.lng,
        // Distingue "champ absent" (inchangé) de "champ vidé" (commentaire effacé).
        comment: req.body.comment === undefined ? undefined : sanitizeComment(req.body.comment),
        typeIds,
        editor,
    });

    res.json(panneau);
}));

/**
 * GET /api/panneaux/:id/history
 * Historique public d'un panneau (qui, quand, quels champs).
 */
router.get('/panneaux/:id/history', asyncHandler(async (req, res) => {
    const panneauId = parseId(req.params.id);
    if (panneauId === null) {
        res.status(400).json({ error: 'Identifiant de panneau invalide' });
        return;
    }

    res.json(await getPanneauHistory(panneauId));
}));

/**
 * POST /api/panneaux/:id/restore
 * Remet un panneau dans l'état d'une révision antérieure. Réservé aux admins :
 * l'autorisation vient du token d'appareil vérifié, jamais du pseudo envoyé
 * dans le corps de la requête.
 */
router.post('/panneaux/:id/restore', writeLimiter, asyncHandler(async (req, res) => {
    const panneauId = parseId(req.params.id);
    const revisionId = parseId(req.body.revisionId);
    if (panneauId === null || revisionId === null) {
        res.status(400).json({ error: 'Identifiant invalide' });
        return;
    }

    const admin = await requireAdmin(req.cookies?.[DEVICE_TOKEN_COOKIE]);

    const panneau = await restorePanneauRevision(panneauId, revisionId, admin);
    res.json(panneau);
}));

export default router;
