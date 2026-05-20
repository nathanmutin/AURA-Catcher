import { Router } from 'express';
import { getPool, getOrCreateUser } from './db';
import multer from 'multer';
import { processImage } from './imageUtils';
import { TEMP_DIR, LOGS_DIR, SMALL_DIR, ORIGINAL_DIR } from './config';
import { Panneau } from './types';
import fs from 'fs';
import path from 'path';
import constants from 'constants';


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
                const rows = await conn.query(`
            SELECT 
                p.id, p.lat, p.lng, p.comment, p.createdAt, p.type_id,
                COUNT(i.id) as imageCount,
                u.username
            FROM panneaux p
            LEFT JOIN images i ON p.id = i.panneau_id
            LEFT JOIN users u ON p.author_id = u.id
            GROUP BY p.id
            ORDER BY p.createdAt DESC
        `);

        interface Row {
            id: number;
            lat: number;
            lng: number;
            comment: string | null;
            createdAt: Date;
            imageCount: number;
            username: string | null;
            type_id: number | null;
        }

        const panneaux: Panneau[] = rows.map((row: Row) => ({
            id: row.id,
            lat: row.lat,
            lng: row.lng,
            comment: row.comment || undefined,
            createdAt: row.createdAt.toISOString(),
            author: row.username || undefined,
            imageCount: Number(row.imageCount),
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
        await conn.query(
            'INSERT INTO images (fileNameOriginal, fileNameSmall, panneau_id, main_image, author_id) VALUES (?, ?, ?, ?, ?)',
            [fileNameOriginal, fileNameSmall, panneauId, true, authorId]
        );

        await conn.commit();

        // Log the action
        logAction(`[NEW PANEL] ID: ${panneauId}, Lat: ${lat}, Lng: ${lng}, Author: ${author || 'Anonymous'}, Image: ${fileNameOriginal}, IP: ${req.ip || 'unknown'}`);

        res.status(201).json({ 
            id: parseInt(panneauId.toString()), 
            lat, 
            lng, 
            imageCount: 1, 
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
 * GET /api/panneaux/:id/photos/:index?size=small|original
 * Serves the image for a specific billboard and index.
 */
router.get('/panneaux/:id/photos/:index', async (req, res) => {
    let conn;
    try {
        const { id, index } = req.params;
        const { size } = req.query;
        const isSmall = size !== 'original';

        conn = await getPool().getConnection();
        const rows = await conn.query(
            'SELECT fileNameOriginal, fileNameSmall FROM images WHERE panneau_id = ? ORDER BY main_image DESC, createdAt ASC LIMIT 1 OFFSET ?',
            [id, parseInt(index)]
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
 * @returns {Object} Updated imageCount and success message
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
        await conn.query(
            'INSERT INTO images (fileNameOriginal, fileNameSmall, panneau_id, main_image, author_id) VALUES (?, ?, ?, ?, ?)',
            [fileNameOriginal, fileNameSmall, id, true, authorId]
        );

        // Get updated image count
        const countRows = await conn.query(
            'SELECT COUNT(*) as imageCount FROM images WHERE panneau_id = ?',
            [id]
        );
        const imageCount = Number(countRows[0].imageCount);

        await conn.commit();

        logAction(`[NEW PHOTO] Panel ID: ${id}, Author: ${author || 'Anonymous'}, Image: ${fileNameOriginal}, IP: ${req.ip || 'unknown'}`);

        res.status(201).json({ 
            success: true,
            imageCount: imageCount,
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

