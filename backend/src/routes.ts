import { Router } from 'express';
import { getPool } from './db';
import multer from 'multer';
import { processImage } from './imageUtils';
import { TEMP_DIR } from './config';

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
                u.username as author
            FROM panneaux p
            LEFT JOIN images i ON p.id = i.panneau_id AND i.main_image = 1
            LEFT JOIN users u ON p.author_id = u.id
            ORDER BY p.createdAt DESC
        `);

        const panneaux = rows.map((row: any) => ({
            id: row.id,
            lat: row.lat,
            lng: row.lng,
            comment: row.comment,
            createdAt: row.createdAt,
            author: row.username,
            imageUrl: row.fileNameSmall ? `/photos/small/${row.fileNameSmall}` : null
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
 * 
 * @returns {Object} The created billboard object with ID and image URL
 */
router.post('/panneaux', upload.single('image'), async (req, res) => {
    let conn;
    try {
        const { lat, lng, comment } = req.body;
        const file = req.file;

        if (!file || !lat || !lng) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        // Process image (save original and small versions)
        const { fileNameOriginal, fileNameSmall } = await processImage(file);

        conn = await getPool().getConnection();
        await conn.beginTransaction();

        // 2. Insert panneau
        const panneauRes = await conn.query('INSERT INTO panneaux (lat, lng, comment) VALUES (?, ?, ?)',
            [lat, lng, comment]);
        const panneauId = panneauRes.insertId;

        // 3. Insert image (one row with both versions)
        await conn.query(
            'INSERT INTO images (fileNameOriginal, fileNameSmall, panneau_id, main_image) VALUES (?, ?, ?, ?)',
            [fileNameOriginal, fileNameSmall, panneauId, true]
        );

        await conn.commit();

        const imageUrl = `/photos/small/${fileNameSmall}`;
        res.status(201).json({ id: parseInt(panneauId.toString()), lat, lng, imageUrl, comment });

    } catch (error) {
        if (conn) await conn.rollback();
        console.error(error);
        res.status(500).json({ error: 'Failed to create panneau' });
    } finally {
        if (conn) conn.release();
    }
});

export default router;
