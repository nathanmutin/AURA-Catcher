import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import apiCalls from './apiCalls'
import ogGenerator from './ogGenerator';
import { initDb } from './db';
import { PHOTOS_DIR, TEMP_DIR, ORIGINAL_DIR, SMALL_DIR } from './config';
import path from 'path';

/**
 * Main application entry point.
 * Configures Express server, static file serving for uploads, and API routes.
 */
const app = express();
const PORT = process.env.PORT || 3000;

// Ensure directories exist
const dirs = [PHOTOS_DIR, TEMP_DIR, path.join(__dirname, '../logs')];
dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

app.get('/', (req, res) => {
    res.send('AURA Catcher Backend is running.');
});

app.use(express.json());
// Serve uploads
app.use('/photos/original', express.static(ORIGINAL_DIR));
app.use('/photos/small', express.static(SMALL_DIR));
app.use('/api', apiCalls);
app.use('/og-image', ogGenerator);

initDb().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Failed to init DB:', err);
});
