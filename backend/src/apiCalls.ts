import { Router } from 'express';
import { getPool } from './db';
import multer from 'multer';
import { processImage } from './imageUtils';
import { TEMP_DIR } from './config';
import type { Panneau } from '@aura-catcher/shared/api/types';
import fs from 'fs';
import path from 'path';

const router = Router();

// Configure Multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, TEMP_DIR);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

async function logAction(message: string) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    try {
        await fs.promises.appendFile(path.join(__dirname, '../logs/activity.log'), logMessage + '\n');
    } catch (err) {
        console.error('Failed to write to log file:', err);
    }
}

/**
 * GET /api/panneaux
 * Retrieves a list of all billboards (panneaux) ordered by creation date (descending).
 * Joins with images and users to provide full details.
 * @returns {Array<Object>} JSON array of billboard objects
 */
router.get('/panneaux', async (req, res) => {
    let conn;
    try {
        conn = await getPool().getConnection();
        const rows = await conn.query(`
            SELECT 
                p.id, p.lat, p.lng, p.comment, p.createdAt,
                i.fileNameSmall,
                u.username
            FROM panneaux p
            LEFT JOIN images i ON p.id = i.panneau_id AND i.main_image = 1
            LEFT JOIN users u ON p.author_id = u.id
            ORDER BY p.createdAt DESC
        `);

        interface Row {
            id: number;
            lat: number;
            lng: number;
            comment: string | null;
            createdAt: Date;
            fileNameSmall: string | null;
            username: string | null;
        }

        const panneaux: Panneau[] = rows.map((row: Row) => ({
            id: row.id,
            lat: row.lat,
            lng: row.lng,
            comment: row.comment || undefined,
            createdAt: row.createdAt.toISOString(),
            author: row.username || undefined,
            imageUrl: row.fileNameSmall ? `/photos/small/${row.fileNameSmall}` : ''
        }));

        res.json(panneaux);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch panneaux' });
    } finally {
        if (conn) conn.release();
    }
});

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
 * 
 * @returns {Object} The created billboard object with ID and image URL
 */
router.post('/panneaux', upload.single('image'), async (req, res) => {
    let conn;
    try {
        const { lat, lng, comment, author } = req.body;
        const file = req.file;

        if (!file || !lat || !lng) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        // Process image (save original and small versions)
        const { fileNameOriginal, fileNameSmall } = await processImage(file);

        conn = await getPool().getConnection();
        await conn.beginTransaction();

        let authorId: number | null = null;
        if (author && typeof author === 'string' && author.trim()) {
            const username = author.trim();
            // Check if user exists
            const userRows = await conn.query('SELECT id FROM users WHERE username = ?', [username]);
            if (userRows.length > 0) {
                authorId = userRows[0].id;
            } else {
                // Create user
                const userRes = await conn.query(
                    'INSERT INTO users (username, password) VALUES (?, ?)',
                    [username, 'placeholder_password'] // No auth yet
                );
                authorId = parseInt(userRes.insertId.toString());
            }
        }

        // 2. Insert panneau
        const panneauRes = await conn.query('INSERT INTO panneaux (lat, lng, comment, author_id) VALUES (?, ?, ?, ?)',
            [lat, lng, comment, authorId]);
        const panneauId = panneauRes.insertId;

        // 3. Insert image (one row with both versions)
        await conn.query(
            'INSERT INTO images (fileNameOriginal, fileNameSmall, panneau_id, main_image, author_id) VALUES (?, ?, ?, ?, ?)',
            [fileNameOriginal, fileNameSmall, panneauId, true, authorId]
        );

        await conn.commit();

        const imageUrl = `/photos/small/${fileNameSmall}`;

        // Log the action
        logAction(`[NEW PANEL] ID: ${panneauId}, Lat: ${lat}, Lng: ${lng}, Author: ${author || 'Anonymous'}, Image: ${fileNameOriginal}, IP: ${req.ip || 'unknown'}`);

        res.status(201).json({ id: parseInt(panneauId.toString()), lat, lng, imageUrl, comment, author: author || null });

    } catch (error) {
        if (conn) await conn.rollback();
        logAction(`[ERROR] Failed to create panneau: ${error}`);
        res.status(500).json({ error: 'Failed to create panneau' });
    } finally {
        if (conn) conn.release();
    }
});


/**
 * GET /api/stats/global
 * Retrieves global statistics: total panels and total contributors.
 */
router.get('/stats/global', async (req, res) => {
    let conn;
    try {
        conn = await getPool().getConnection();

        const [panelsCount] = await conn.query('SELECT COUNT(*) as count FROM panneaux');
        const [contributorsCount] = await conn.query('SELECT COUNT(DISTINCT author_id) as count FROM panneaux WHERE author_id IS NOT NULL');

        res.json({
            totalPanels: Number(panelsCount.count),
            totalContributors: Number(contributorsCount.count)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch global stats' });
    } finally {
        if (conn) conn.release();
    }
});

/**
 * GET /api/stats/leaderboard
 * Retrieves the leaderboard of contributors.
 */
router.get('/stats/leaderboard', async (req, res) => {
    let conn;
    try {
        conn = await getPool().getConnection();
        const rows = await conn.query(`
            SELECT 
                u.username,
                COUNT(p.id) as count
            FROM panneaux p
            JOIN users u ON p.author_id = u.id
            GROUP BY u.id
            ORDER BY count DESC
            LIMIT 10
        `);

        res.json(rows.map((row: any) => ({
            username: row.username,
            count: Number(row.count)
        })));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    } finally {
        if (conn) conn.release();
    }
});

export default router;
