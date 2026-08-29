import { Router } from 'express';
import { asyncHandler } from '../errors';
import { uploadSingleImage } from '../upload';
import { writeLimiter } from '../rateLimit';
import { parseLatLng, sanitizeComment, sanitizeAuthor, parseTypeIds } from '../validation';
import { listPanneaux, createPanneau } from '../services/panneauxService';

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
    const author = sanitizeAuthor(req.body.author);

    if (!file || !coords || !typeIds) {
        res.status(400).json({ error: 'Champs requis manquants ou invalides' });
        return;
    }

    const panneau = await createPanneau({
        file,
        lat: coords.lat,
        lng: coords.lng,
        comment,
        author,
        typeIds,
        ip: req.ip || 'unknown',
    });

    res.status(201).json(panneau);
}));

export default router;
