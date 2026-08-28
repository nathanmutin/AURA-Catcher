import { Router } from 'express';
import { asyncHandler } from '../errors';
import { uploadSingleImage } from '../upload';
import { writeLimiter } from '../rateLimit';
import { sanitizeAuthor } from '../validation';
import { addPhotoToPanneau, getImageFilePath } from '../services/panneauxService';

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
    const author = sanitizeAuthor(req.body.author);

    if (!file) {
        res.status(400).json({ error: 'Missing image file' });
        return;
    }

    const { imageId } = await addPhotoToPanneau({
        panneauId: id,
        file,
        author,
        ip: req.ip || 'unknown',
    });

    res.status(201).json({
        success: true,
        imageId,
        message: 'Photo added successfully',
    });
}));

export default router;
