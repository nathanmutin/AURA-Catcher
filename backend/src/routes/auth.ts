import { Router } from 'express';
import { asyncHandler } from '../errors';
import { authLimiter } from '../rateLimit';
import { sanitizeAuthor, sanitizeEmail } from '../validation';
import { requestVerification, verifyToken, getVerifiedUsername, logout, renameUser, deviceTokenCookieOptions, DEVICE_TOKEN_COOKIE } from '../services/authService';
import { escapeHtml } from '../htmlEscape';

const router = Router();

/**
 * POST /api/auth/request-verification
 * Envoie un email de vérification pour protéger un pseudo. Fortement
 * rate-limité : cette route envoie un vrai email à une adresse arbitraire.
 */
router.post('/auth/request-verification', authLimiter, asyncHandler(async (req, res) => {
    const username = sanitizeAuthor(req.body.username);
    const email = sanitizeEmail(req.body.email);

    if (!username || !email) {
        res.status(400).json({ error: 'Pseudo et email valides requis' });
        return;
    }

    await requestVerification(username, email, req.ip || 'unknown');
    res.json({ success: true });
}));

/**
 * GET /api/auth/verify?token=...
 * Lien cliqué depuis l'email : consomme le token, pose le cookie
 * d'appareil, et affiche une page de confirmation minimaliste (pas besoin
 * de router ça côté frontend pour une page qu'on voit une seule fois).
 */
router.get('/auth/verify', asyncHandler(async (req, res) => {
    const token = typeof req.query.token === 'string' ? req.query.token : '';
    if (!token) {
        res.status(400).send('Lien de vérification invalide.');
        return;
    }

    const { username, deviceToken } = await verifyToken(token);

    res.cookie(DEVICE_TOKEN_COOKIE, deviceToken, deviceTokenCookieOptions);

    const safeUsername = escapeHtml(username);
    res.send(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Pseudo confirmé — AURA Catcher</title>
        </head>
        <body style="font-family: sans-serif; text-align: center; padding: 60px 20px; color: #1f2937;">
            <h1>✅ Pseudo confirmé</h1>
            <p>Le pseudo <strong>${safeUsername}</strong> est maintenant protégé sur cet appareil.</p>
            <p>Vous pouvez fermer cette page et retourner sur AURA Catcher.</p>
        </body>
        </html>
    `);
}));

/**
 * GET /api/auth/me
 * Indique si l'appareil courant est vérifié, et pour quel pseudo.
 */
router.get('/auth/me', asyncHandler(async (req, res) => {
    const username = await getVerifiedUsername(req.cookies?.[DEVICE_TOKEN_COOKIE]);
    res.json({ username });
}));

/**
 * POST /api/auth/logout
 * Déconnecte l'appareil courant (invalide le token côté serveur, efface le
 * cookie). Toujours un succès du point de vue du client, même si l'appareil
 * n'était pas connecté.
 */
router.post('/auth/logout', asyncHandler(async (req, res) => {
    await logout(req.cookies?.[DEVICE_TOKEN_COOKIE]);
    res.clearCookie(DEVICE_TOKEN_COOKIE, { path: deviceTokenCookieOptions.path });
    res.json({ success: true });
}));

/**
 * POST /api/auth/rename
 * Renomme le pseudo protégé de l'appareil courant. Ne nécessite pas de
 * nouvelle vérification par email : le token d'appareil prouve déjà la
 * propriété du compte.
 */
router.post('/auth/rename', authLimiter, asyncHandler(async (req, res) => {
    const newUsername = sanitizeAuthor(req.body.username);
    if (!newUsername) {
        res.status(400).json({ error: 'Nouveau pseudo requis' });
        return;
    }

    const username = await renameUser(req.cookies?.[DEVICE_TOKEN_COOKIE], newUsername);
    res.json({ username });
}));

export default router;
