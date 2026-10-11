import { Router } from 'express';
import { asyncHandler } from '../errors';
import { uploadSingleImage } from '../upload';
import { writeLimiter } from '../rateLimit';
import { sanitizeAuthor } from '../validation';
import { addPhotoToPanneau, getImageFilePath } from '../services/panneauxService';
import { renderShareImage } from '../imageUtils';
import { resolveAuthor, DEVICE_TOKEN_COOKIE } from '../services/authService';
import { logAction } from '../logger';

const router = Router();

/**
 * GET /api/photo/:id?size=small|original
 * Serves the image for a specific image id.
 */
router.get('/photo/:id', asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const size = req.query.size === 'original' ? 'original' : 'small';
    const filePath = await getImageFilePath(id, size);
    res.sendFile(filePath);
}));

/**
 * GET /api/photo/:id/apercu.jpg
 * L'aperçu de partage : la photo recadrée en JPEG, pour les balises Open
 * Graph de /panneau/:id. Une adresse à part plutôt qu'un paramètre de
 * taille, pour qu'un lecteur de lien garde le bon fichier en cache.
 */
router.get('/photo/:id/apercu.jpg', asyncHandler(async (req, res) => {
    const filePath = await getImageFilePath(String(req.params.id), 'original');

    res.type('jpeg')
        // Une photo ne change jamais : seul un nouvel identifiant produit
        // une nouvelle image.
        .set('Cache-Control', 'public, max-age=31536000, immutable')
        .send(await renderShareImage(filePath));
}));

/**
 * POST /api/panneaux/:id/photos
 * Adds a new photo to an existing billboard.
 *
 * Expects multipart/form-data with:
 * - image: The image file (required)
 * - author: Optional username/author name
 */
router.post('/panneaux/:id/photos', writeLimiter, uploadSingleImage, asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const file = req.file;
    const requestedAuthor = sanitizeAuthor(req.body.author);

    if (!file) {
        res.status(400).json({ error: 'Image manquante' });
        return;
    }

    const author = await resolveAuthor(req.cookies?.[DEVICE_TOKEN_COOKIE], requestedAuthor);

    const { imageId } = await addPhotoToPanneau({
        panneauId: id,
        file,
        author,
    });

    await logAction(`[UPLOAD END] success=photo, panelId=${id}, imageId=${imageId}, file=${file.filename}`);

    res.status(201).json({
        success: true,
        imageId,
        message: 'Photo added successfully',
    });
}));

export default router;
