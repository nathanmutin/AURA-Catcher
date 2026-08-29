import { Router } from 'express';
import { asyncHandler } from '../errors';
import { getRecentActivity } from '../services/feedService';
import { renderRssFeed } from '../feedXml';

const router = Router();

/**
 * GET /api/feed.rss
 * Flux RSS des 50 derniers événements (nouveaux panneaux, nouvelles photos,
 * nouveaux contributeurs), toutes catégories mélangées et triées par date.
 */
router.get('/feed.rss', asyncHandler(async (req, res) => {
    const items = await getRecentActivity();
    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.send(renderRssFeed(items));
}));

export default router;
