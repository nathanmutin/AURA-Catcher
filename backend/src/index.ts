import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import routes from './routes';
import { initDb } from './db';
import { LOGS_DIR, PHOTOS_DIR, TEMP_DIR, ORIGINAL_DIR, SMALL_DIR } from './config';
import path from 'path';

import compression from 'compression';

/**
 * Main application entry point.
 * Configures Express server, static file serving for uploads, and API routes.
 */
const app = express();
const PORT = process.env.PORT || 3000;

// Ensure directories exist
const dirs = [PHOTOS_DIR, TEMP_DIR, LOGS_DIR, ORIGINAL_DIR, SMALL_DIR];
dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

app.get('/', (req, res) => {
    res.send('AURA Catcher Backend is running.');
});

app.use(compression());
app.use(express.json());
app.use('/api', routes);

initDb().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Failed to init DB:', err);
});
