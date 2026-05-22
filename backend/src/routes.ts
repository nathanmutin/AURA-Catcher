import { Router } from 'express';
import { getPool, getOrCreateUser } from './db';
import multer from 'multer';
import { processImage } from './imageUtils';
import { TEMP_DIR, LOGS_DIR, SMALL_DIR, ORIGINAL_DIR } from './config';
import { Panneau } from './types';
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
        await fs.promises.appendFile(path.join(LOGS_DIR, 'activity.log'), logMessage + '\n');
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
        const panelRows = await conn.query(`
            SELECT
                p.id,
                p.lat,
                p.lng,
                p.comment,
                p.createdAt,
                p.type_id,
                u.username
            FROM panneaux p
            LEFT JOIN users u ON p.author_id = u.id
            ORDER BY p.createdAt DESC
        `);

        const imageRows = await conn.query(`
            SELECT id, panneau_id
            FROM images
            ORDER BY panneau_id, main_image DESC, createdAt DESC, id DESC
        `);

        interface PanelRow {
            id: number;
            lat: number;
            lng: number;
            comment: string | null;
            createdAt: Date;
            username: string | null;
            type_id: number | null;
        }

        interface ImageRow {
            id: number;
            panneau_id: number;
        }

        const imageIdsByPanel = new Map<number, number[]>();
        imageRows.forEach((row: ImageRow) => {
            const panneauId = Number(row.panneau_id);
            const imageIds = imageIdsByPanel.get(panneauId) ?? [];
            imageIds.push(Number(row.id));
            imageIdsByPanel.set(panneauId, imageIds);
        });

        const panneaux: Panneau[] = panelRows.map((row: PanelRow) => ({
            id: row.id,
            lat: row.lat,
            lng: row.lng,
            comment: row.comment || undefined,
            createdAt: row.createdAt.toISOString(),
            author: row.username || undefined,
            imageIds: imageIdsByPanel.get(row.id) ?? [],
            typeId: row.type_id || undefined,
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
        const { lat, lng, comment, author, typeId } = req.body;
        const file = req.file;

        if (!file || !lat || !lng) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        // Process image (save original and small versions)
        const { fileNameOriginal, fileNameSmall } = await processImage(file);

        conn = await getPool().getConnection();
        await conn.beginTransaction();

        const authorId = await getOrCreateUser(conn, author);

        // 2. Insert panneau
        const panneauRes = await conn.query('INSERT INTO panneaux (lat, lng, comment, author_id, type_id) VALUES (?, ?, ?, ?, ?)',
            [lat, lng, comment, authorId, typeId || 1]);
        const panneauId = panneauRes.insertId;

        // 3. Insert image (one row with both versions)
        const imageRes = await conn.query(
            'INSERT INTO images (fileNameOriginal, fileNameSmall, panneau_id, main_image, author_id) VALUES (?, ?, ?, ?, ?)',
            [fileNameOriginal, fileNameSmall, panneauId, true, authorId]
        );

        const imageId = parseInt(imageRes.insertId.toString());

        await conn.commit();

        // Log the action
        logAction(`[NEW PANEL] ID: ${panneauId}, Lat: ${lat}, Lng: ${lng}, Author: ${author || 'Anonymous'}, Image: ${fileNameOriginal}, IP: ${req.ip || 'unknown'}`);

        res.status(201).json({ 
            id: parseInt(panneauId.toString()), 
            lat, 
            lng, 
            imageIds: [imageId],
            comment, 
            author: author || null, 
            typeId: typeId || 1 
        });


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
 * Retrieves the leaderboard of contributors based on points.
 */
router.get('/stats/leaderboard', async (req, res) => {
    let conn;
    try {
        conn = await getPool().getConnection();
        const rows = await conn.query(`
            SELECT 
                u.username,
                SUM(t.points) as count,
                COUNT(p.id) as total_panels
            FROM panneaux p
            JOIN users u ON p.author_id = u.id
            LEFT JOIN panel_types t ON p.type_id = t.id
            GROUP BY u.id
            ORDER BY count DESC
            LIMIT 10
        `);

        res.json(rows.map((row: any) => ({
            username: row.username,
            count: Number(row.count || 0),
            totalPanels: Number(row.total_panels || 0)
        })));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    } finally {
        if (conn) conn.release();
    }
});

/**
 * GET /api/types
 * Retrieves a list of all panel types.
 */
router.get('/types', async (req, res) => {
    let conn;
    try {
        conn = await getPool().getConnection();
        const rows = await conn.query('SELECT * FROM panel_types ORDER BY points DESC');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch types' });
    } finally {
        if (conn) conn.release();
    }
});

/**
 * GET /api/photo/:id?size=small|original
 * Serves the image for a specific image id.
 */
router.get('/photo/:id', async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        const { size } = req.query;
        const isSmall = size !== 'original';

        conn = await getPool().getConnection();
        const rows = await conn.query(
            'SELECT fileNameOriginal, fileNameSmall FROM images WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            res.status(404).json({ error: 'Image not found' });
            return;
        }

        let filePath = "";
        if (isSmall) {
            filePath = path.join(SMALL_DIR, rows[0].fileNameSmall);
        }
        else {
            filePath = path.join(ORIGINAL_DIR, rows[0].fileNameOriginal);
        }

        if (fs.existsSync(filePath)) {
            res.sendFile(filePath);
        } else {
            res.status(404).json({ error: 'File not found on disk' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch image' });
    } finally {
        if (conn) conn.release();
    }
});

/**
 * POST /api/panneaux/:id/photos
 * Adds a new photo to an existing billboard.
 * 
 * Expects multipart/form-data with:
 * - image: The image file (required)
 * - author: Optional username/author name
 * 
 * @returns {Object} The new image id and success message
 */
router.post('/panneaux/:id/photos', upload.single('image'), async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        const { author } = req.body;
        const file = req.file;

        if (!file) {
            res.status(400).json({ error: 'Missing image file' });
            return;
        }

        // Verify panneau exists
        conn = await getPool().getConnection();
        const panneauRows = await conn.query('SELECT id FROM panneaux WHERE id = ?', [id]);
        if (panneauRows.length === 0) {
            res.status(404).json({ error: 'Panneau not found' });
            return;
        }

        // Process image (save original and small versions)
        const { fileNameOriginal, fileNameSmall } = await processImage(file);

        await conn.beginTransaction();

        const authorId = await getOrCreateUser(conn, author);

        // Unset the current main image
        await conn.query(
            'UPDATE images SET main_image = false WHERE panneau_id = ? AND main_image = true',
            [id]
        );

        // Insert new image as main image
        const imageRes = await conn.query(
            'INSERT INTO images (fileNameOriginal, fileNameSmall, panneau_id, main_image, author_id) VALUES (?, ?, ?, ?, ?)',
            [fileNameOriginal, fileNameSmall, id, true, authorId]
        );
        const imageId = parseInt(imageRes.insertId.toString());

        await conn.commit();

        logAction(`[NEW PHOTO] Panel ID: ${id}, Author: ${author || 'Anonymous'}, Image: ${fileNameOriginal}, IP: ${req.ip || 'unknown'}`);

        res.status(201).json({ 
            success: true,
            imageId,
            message: 'Photo added successfully'
        });

    } catch (error) {
        if (conn) await conn.rollback();
        logAction(`[ERROR] Failed to add photo to panneau: ${error}`);
        res.status(500).json({ error: 'Failed to add photo' });
    } finally {
        if (conn) conn.release();
    }
});

export default router;

