import { Router } from 'express';
import { asyncHandler } from '../errors';
import { authLimiter, codeLimiter } from '../rateLimit';
import { sanitizeAuthor, sanitizeEmail, parseVerificationCode } from '../validation';
import {
    requestVerification,
    verifyCode,
    getPendingVerification,
    getVerifiedUser,
    logout,
    renameUser,
    deviceTokenCookieOptions,
    pendingVerificationCookieOptions,
    DEVICE_TOKEN_COOKIE,
    PENDING_VERIFICATION_COOKIE,
} from '../services/authService';

const router = Router();

/**
 * POST /api/auth/request-verification
 * Envoie par email un code à 6 chiffres pour protéger un pseudo, et pose le
 * cookie qui rattache la demande à ce navigateur. Fortement rate-limité :
 * cette route envoie un vrai email à une adresse arbitraire.
 */
router.post('/auth/request-verification', authLimiter, asyncHandler(async (req, res) => {
    const username = sanitizeAuthor(req.body.username);
    const email = sanitizeEmail(req.body.email);

    if (!username || !email) {
        res.status(400).json({ error: 'Pseudo et email valides requis' });
        return;
    }

    const requestToken = await requestVerification(username, email, req.cookies?.[PENDING_VERIFICATION_COOKIE]);
    res.cookie(PENDING_VERIFICATION_COOKIE, requestToken, pendingVerificationCookieOptions);
    res.json({ success: true });
}));

/**
 * POST /api/auth/verify-code
 * Saisie du code reçu par email. Il n'est accepté que dans le navigateur
 * qui l'a demandé (cookie de demande) : c'est cet appareil qui est vérifié.
 */
router.post('/auth/verify-code', codeLimiter, asyncHandler(async (req, res) => {
    const code = parseVerificationCode(req.body.code);
    if (!code) {
        res.status(400).json({ error: 'Le code de vérification fait 6 chiffres.' });
        return;
    }

    const { username, deviceToken } = await verifyCode(req.cookies?.[PENDING_VERIFICATION_COOKIE], code);

    res.cookie(DEVICE_TOKEN_COOKIE, deviceToken, deviceTokenCookieOptions);
    res.clearCookie(PENDING_VERIFICATION_COOKIE, { path: pendingVerificationCookieOptions.path });
    res.json({ username });
}));

/**
 * GET /api/auth/me
 * Indique si l'appareil courant est vérifié, pour quel pseudo, et si ce
 * compte est administrateur (le front s'en sert pour afficher les actions
 * d'admin — l'autorisation réelle est revérifiée à chaque appel côté serveur).
 * Signale aussi une demande de code en cours dans ce navigateur, pour que le
 * front puisse rouvrir l'écran de saisie après un rechargement.
 */
router.get('/auth/me', asyncHandler(async (req, res) => {
    const [user, pendingVerification] = await Promise.all([
        getVerifiedUser(req.cookies?.[DEVICE_TOKEN_COOKIE]),
        getPendingVerification(req.cookies?.[PENDING_VERIFICATION_COOKIE]),
    ]);
    res.json({ username: user?.username ?? null, isAdmin: user?.isAdmin ?? false, pendingVerification });
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
