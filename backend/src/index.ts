import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import routes from './routes';
import { initDb } from './db';
import { errorHandler } from './errors';
import { LOGS_DIR, PHOTOS_DIR, TEMP_DIR, ORIGINAL_DIR, SMALL_DIR, TRUST_PROXY_HOPS } from './config';

import compression from 'compression';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

/**
 * Main application entry point.
 * Configures Express server, static file serving for uploads, and API routes.
 */
const app = express();
const PORT = process.env.PORT || 3000;

// req.ip = l'IP du visiteur et non celle du dernier proxy (voir config.ts).
// Un nombre de sauts plutôt que `true` : Express ne retient que l'adresse
// ajoutée par le plus lointain proxy de confiance, jamais celles qu'un
// visiteur aurait lui-même glissées en tête de X-Forwarded-For.
app.set('trust proxy', TRUST_PROXY_HOPS);

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

// Helmet ajoute plusieurs en-têtes HTTP de sécurité (anti-clickjacking,
// anti-sniffing MIME, etc.) pour durcir les réponses du serveur par défaut.
app.use(helmet());
app.use(compression());
app.use(express.json());
// Nécessaire pour lire req.cookies (le token d'appareil) — Express ne parse
// pas l'en-tête Cookie par défaut.
app.use(cookieParser());
app.use('/api', routes);

// Doit rester après le montage des routes : Express reconnaît un middleware
// à 4 paramètres comme gestionnaire d'erreurs et l'appelle via next(err).
app.use(errorHandler);

initDb().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Failed to init DB:', err);
});
