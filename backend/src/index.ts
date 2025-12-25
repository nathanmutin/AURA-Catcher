import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import routes from './routes';
import { initDb } from './db';
import { PHOTOS_DIR, TEMP_DIR, ORIGINAL_DIR, SMALL_DIR } from './config';

/**
 * Main application entry point.
 * Configures Express server, static file serving for uploads, and API routes.
 */
const app = express();
const PORT = process.env.PORT || 3000;

// Ensure directories exist
if (!fs.existsSync(PHOTOS_DIR)) {
    fs.mkdirSync(PHOTOS_DIR);
}
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR);
}
// We should implies original and small dirs might be created later or here?
// imageUtils ensures them, but let's be safe or just minimal.
// Config only required Photos and Temp for basic startup or let imageUtils handle subfolders.

app.get('/', (req, res) => {
    res.send('AURA Catcher Backend is running.');
});

app.use(express.json());
// Serve uploads
app.use('/photos/original', express.static(ORIGINAL_DIR));
app.use('/photos/small', express.static(SMALL_DIR));
app.use('/api', routes);

initDb().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Failed to init DB:', err);
});
