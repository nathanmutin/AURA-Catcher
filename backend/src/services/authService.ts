import crypto from 'crypto';
import { withConnection, withTransaction, getOrCreateUser } from '../db';
import { sendVerificationEmail } from '../email';
import { logAction } from '../logger';
import { AppError } from '../errors';
import { PUBLIC_URL, COOKIE_SECURE } from '../config';

// Nom du cookie qui porte le token d'appareil, partagé entre les routes
// d'auth (qui le posent) et les routes panneaux/photos (qui le lisent).
export const DEVICE_TOKEN_COOKIE = 'device_token';

const VERIFICATION_TTL_MS = 15 * 60 * 1000; // 15 minutes
const DEVICE_TOKEN_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000; // 1 an

// On ne stocke jamais un token en clair en base (voir db.ts) : seulement le
// hash de ce qui a été envoyé par email / posé en cookie. Un accès en
// lecture seule à la base ne suffit donc pas à usurper un pseudo.
function hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Étape 1 : quelqu'un veut protéger un pseudo. On vérifie qu'il n'est pas
 * déjà revendiqué par une autre adresse, puis on envoie un lien à usage
 * unique par email.
 */
export async function requestVerification(username: string, email: string, ip: string): Promise<void> {
    // Transaction plutôt que simple connexion : si l'envoi d'email échoue,
    // l'insertion du token doit être annulée elle aussi (pas de token orphelin
    // qui ne sera jamais utilisable).
    await withTransaction(async (conn) => {
        // Balaie au passage les demandes expirées et jamais cliquées : la
        // plupart des liens ne sont jamais ouverts, donc sans ça la table
        // grossirait indéfiniment sans qu'aucun autre code n'y touche jamais.
        await conn.query('DELETE FROM email_verifications WHERE expiresAt < NOW()');

        const rows = await conn.query('SELECT email FROM users WHERE username = ?', [username]);
        const existingEmail: string | null = rows[0]?.email ?? null;

        if (existingEmail && existingEmail !== email) {
            throw new AppError(409, `Le pseudo "${username}" est déjà protégé par une autre adresse email.`);
        }

        const rawToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);

        await conn.query(
            'INSERT INTO email_verifications (username, email, tokenHash, expiresAt) VALUES (?, ?, ?, ?)',
            [username, email, hashToken(rawToken), expiresAt]
        );

        const verifyUrl = `${PUBLIC_URL}/api/auth/verify?token=${rawToken}`;
        await sendVerificationEmail(email, username, verifyUrl);
    });

    logAction(`[AUTH] Vérification demandée pour le pseudo "${username}" (${email}), IP: ${ip}`);
}

/**
 * Étape 2 : l'utilisateur a cliqué sur le lien reçu par email. On consomme
 * le token (usage unique), on revendique le pseudo si ce n'est pas déjà
 * fait, et on délivre un nouveau token d'appareil longue durée.
 */
export async function verifyToken(rawToken: string): Promise<{ username: string; deviceToken: string }> {
    const tokenHash = hashToken(rawToken);

    // Recherche + suppression du token à usage unique, volontairement HORS
    // de la transaction ci-dessous
    const verification = await withConnection(async (conn) => {
        const rows = await conn.query(
            'SELECT id, username, email, expiresAt FROM email_verifications WHERE tokenHash = ?',
            [tokenHash]
        );
        const row = rows[0];
        if (row) {
            await conn.query('DELETE FROM email_verifications WHERE id = ?', [row.id]);
        }
        return row;
    });

    if (!verification || new Date(verification.expiresAt).getTime() < Date.now()) {
        throw new AppError(400, 'Ce lien de vérification est invalide ou a expiré.');
    }

    return withTransaction(async (conn) => {
        const userId = await getOrCreateUser(conn, verification.username);
        if (userId === null) {
            throw new AppError(400, 'Pseudo invalide.');
        }

        // Revendique le pseudo uniquement s'il ne l'est pas déjà (ne écrase
        // jamais un email existant — requestVerification a déjà vérifié la
        // cohérence, mais on ne fait confiance qu'à la base ici).
        await conn.query('UPDATE users SET email = ? WHERE id = ? AND email IS NULL', [verification.email, userId]);

        const deviceTokenRaw = crypto.randomBytes(32).toString('hex');
        await conn.query(
            'INSERT INTO device_tokens (user_id, tokenHash) VALUES (?, ?)',
            [userId, hashToken(deviceTokenRaw)]
        );

        return { username: verification.username, deviceToken: deviceTokenRaw };
    });
}

/**
 * Résout le pseudo à utiliser pour une soumission (création de panneau /
 * ajout de photo) :
 * - pas de pseudo demandé : poste sous l'identité vérifiée de l'appareil
 *   s'il y en a une, sinon anonyme (comportement historique) ;
 * - poste sous son propre pseudo vérifié : toujours autorisé ;
 * - poste sous un pseudo protégé par quelqu'un d'autre : refusé (c'est le
 *   scénario d'usurpation à empêcher) ;
 * - poste sous un pseudo libre, jamais revendiqué (le sien ou un autre) :
 *   autorisé, que l'appareil soit vérifié ou non — un compte vérifié n'oblige
 *   pas à toujours poster sous ce même nom.
 */
export async function resolveAuthor(deviceTokenRaw: string | undefined, requestedAuthor: string | undefined): Promise<string | undefined> {
    const verifiedUsername = deviceTokenRaw ? await getUsernameFromDeviceToken(deviceTokenRaw) : null;

    if (!requestedAuthor) {
        return verifiedUsername ?? undefined;
    }

    if (verifiedUsername && requestedAuthor === verifiedUsername) {
        return requestedAuthor;
    }

    const claimed = await isUsernameClaimed(requestedAuthor);
    if (claimed) {
        throw new AppError(409, `Le pseudo "${requestedAuthor}" est protégé. Vérifiez votre email pour l'utiliser, ou choisissez un autre pseudo.`);
    }

    return requestedAuthor;
}

/**
 * Déconnecte l'appareil courant : invalide le token côté serveur (le cookie
 * lui-même est effacé par la route). Ne fait rien si le token est déjà
 * invalide/absent — la déconnexion doit toujours "réussir" du point de vue
 * de l'utilisateur.
 */
export async function logout(deviceTokenRaw: string | undefined): Promise<void> {
    if (!deviceTokenRaw) return;
    const tokenHash = hashToken(deviceTokenRaw);
    await withConnection((conn) => conn.query('DELETE FROM device_tokens WHERE tokenHash = ?', [tokenHash]));
}

/**
 * Renomme le pseudo de l'appareil actuellement vérifié. Ne nécessite pas une
 * nouvelle vérification par email : posséder un token d'appareil valide
 * prouve déjà qu'on est le propriétaire du compte.
 */
export async function renameUser(deviceTokenRaw: string | undefined, newUsername: string): Promise<string> {
    if (!deviceTokenRaw) {
        throw new AppError(401, 'Vous devez être vérifié pour renommer votre pseudo.');
    }

    const tokenHash = hashToken(deviceTokenRaw);

    return withConnection(async (conn) => {
        const rows = await conn.query(
            'SELECT u.id, u.username FROM device_tokens dt JOIN users u ON u.id = dt.user_id WHERE dt.tokenHash = ?',
            [tokenHash]
        );
        const current = rows[0];
        if (!current) {
            throw new AppError(401, 'Vous devez être vérifié pour renommer votre pseudo.');
        }

        if (current.username === newUsername) {
            return newUsername;
        }

        // Le nom d'utilisateur est unique sur toute la table (y compris les
        // pseudos jamais "revendiqués" par email) : deux lignes ne peuvent
        // jamais porter le même username.
        const existing = await conn.query('SELECT id FROM users WHERE username = ?', [newUsername]);
        if (existing.length > 0) {
            throw new AppError(409, `Le pseudo "${newUsername}" est déjà utilisé.`);
        }

        await conn.query('UPDATE users SET username = ? WHERE id = ?', [newUsername, current.id]);
        return newUsername;
    });
}

async function getUsernameFromDeviceToken(rawToken: string): Promise<string | null> {
    const tokenHash = hashToken(rawToken);

    return withConnection(async (conn) => {
        const rows = await conn.query(
            'SELECT u.username FROM device_tokens dt JOIN users u ON u.id = dt.user_id WHERE dt.tokenHash = ?',
            [tokenHash]
        );
        if (rows.length === 0) return null;

        // Best-effort : trace du dernier usage, ne doit pas faire échouer la requête.
        conn.query('UPDATE device_tokens SET lastUsedAt = NOW() WHERE tokenHash = ?', [tokenHash]).catch(() => {});

        return rows[0].username;
    });
}

async function isUsernameClaimed(username: string): Promise<boolean> {
    return withConnection(async (conn) => {
        const rows = await conn.query('SELECT id FROM users WHERE username = ? AND email IS NOT NULL', [username]);
        return rows.length > 0;
    });
}

export async function getVerifiedUsername(deviceTokenRaw: string | undefined): Promise<string | null> {
    if (!deviceTokenRaw) return null;
    return getUsernameFromDeviceToken(deviceTokenRaw);
}

export const deviceTokenCookieOptions = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: COOKIE_SECURE,
    maxAge: DEVICE_TOKEN_MAX_AGE_MS,
    path: '/',
};
