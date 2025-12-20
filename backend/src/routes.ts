import { Router } from 'express';
import { getDb } from './db';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configure Multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Assuming 'uploads' directory exists or we should create it
        cb(null, path.join(__dirname, '../../data/uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// GET /api/panneaux
router.get('/panneaux', async (req, res) => {
    try {
        const db = await getDb();
        const panneaux = await db.all('SELECT * FROM panneaux ORDER BY createdAt DESC');
        res.json(panneaux);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch panneaux' });
    }
});

// POST /api/panneaux
router.post('/panneaux', upload.single('image'), async (req, res) => {
    try {
        const { lat, lng, comment, author } = req.body;
        const file = req.file;

        if (!file || !lat || !lng) {
            // Allow saving? No, lat/lng required.
            // However, we need to return proper HTTP error
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        const imageUrl = `/uploads/${file.filename}`;
        const db = await getDb();

        const result = await db.run(
            'INSERT INTO panneaux (lat, lng, imageUrl, comment, author) VALUES (?, ?, ?, ?, ?)',
            [lat, lng, imageUrl, comment, author || 'Anonymous']
        );

        res.status(201).json({ id: result.lastID, lat, lng, imageUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create panneau' });
    }
});

export default router;
