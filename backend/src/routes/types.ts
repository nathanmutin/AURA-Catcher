import { Router } from 'express';
import { asyncHandler } from '../errors';
import { listTypes } from '../services/panneauxService';

const router = Router();

/**
 * GET /api/types
 * Retrieves a list of all panel types.
 */
router.get('/types', asyncHandler(async (req, res) => {
    res.json(await listTypes());
}));

export default router;
