import { Router } from 'express';
import { asyncHandler } from '../errors';
import { uploadSingleImage } from '../upload';
import { writeLimiter } from '../rateLimit';
import { sanitizeAuthor, sanitizeComment, parseId } from '../validation';
import { listGaleriePhotos, addGaleriePhoto, updateGalerieCaption, getGalerieFilePath } from '../services/galerieService';
import { resolveAuthor, DEVICE_TOKEN_COOKIE } from '../services/authService';

const router = Router();

/**
 * GET /api/galerie
 * La galerie, du plus récent au plus ancien.
 */
router.get('/galerie', asyncHandler(async (req, res) => {
    res.json(await listGaleriePhotos());
}));

/**
 * POST /api/galerie
 * Ajoute une photo à la galerie.
 *
 * Attend un multipart/form-data avec :
 * - image : le fichier (obligatoire)
 * - caption : légende (facultative)
 * - author : pseudo (facultatif)
 */
router.post('/galerie', writeLimiter, uploadSingleImage, asyncHandler(async (req, res) => {
    const file = req.file;
    const caption = sanitizeComment(req.body.caption);
    const requestedAuthor = sanitizeAuthor(req.body.author);

    if (!file) {
        res.status(400).json({ error: 'Image manquante' });
        return;
    }

    const author = await resolveAuthor(req.cookies?.[DEVICE_TOKEN_COOKIE], requestedAuthor);

    res.status(201).json(await addGaleriePhoto({ file, caption, author }));
}));

/**
 * PATCH /api/galerie/:id
 * Modifie la légende d'une photo. Ouvert à tous, comme la modification d'un
 * panneau : la photo elle-même n'est jamais remplacée.
 */
router.patch('/galerie/:id', writeLimiter, asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) {
        res.status(400).json({ error: 'Identifiant invalide' });
        return;
    }

    const caption = sanitizeComment(req.body.caption);
    const requestedAuthor = sanitizeAuthor(req.body.author);
    const author = await resolveAuthor(req.cookies?.[DEVICE_TOKEN_COOKIE], requestedAuthor);

    res.json(await updateGalerieCaption(id, caption, author));
}));

/**
 * GET /api/galerie/:id/photo?size=small|original
 * Sert le fichier d'une photo de la galerie.
 */
router.get('/galerie/:id/photo', asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) {
        res.status(400).json({ error: 'Identifiant invalide' });
        return;
    }

    const size = req.query.size === 'original' ? 'original' : 'small';
    res.sendFile(await getGalerieFilePath(id, size));
}));

export default router;
