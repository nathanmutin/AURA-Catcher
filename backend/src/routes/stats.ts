import { Router } from 'express';
import { asyncHandler } from '../errors';
import { getGlobalStats, getLeaderboard } from '../services/panneauxService';

const router = Router();

/**
 * GET /api/stats/global
 * Retrieves global statistics: total panels and total contributors.
 */
router.get('/stats/global', asyncHandler(async (req, res) => {
    res.json(await getGlobalStats());
}));

/**
 * GET /api/stats/leaderboard
 * Retrieves the leaderboard of contributors based on points.
 */
router.get('/stats/leaderboard', asyncHandler(async (req, res) => {
    res.json(await getLeaderboard());
}));

export default router;
