import crypto from 'crypto';
import { withConnection, withTransaction, getOrCreateUser } from '../db';
import { sendVerificationCode } from '../email';
import { logAction } from '../logger';
import { AppError } from '../errors';
import { COOKIE_SECURE } from '../config';

// Nom du cookie qui porte le token d'appareil, partagé entre les routes
// d'auth (qui le posent) et les routes panneaux/photos (qui le lisent).
export const DEVICE_TOKEN_COOKIE = 'device_token';

// Cookie qui rattache une demande de code au navigateur qui l'a faite : le
// code n'est accepté que là, c'est ce qui garantit que l'appareil vérifié
// est bien celui de la demande.
export const PENDING_VERIFICATION_COOKIE = 'pending_verification';

const VERIFICATION_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_CODE_ATTEMPTS = 5;
const DEVICE_TOKEN_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000; // 1 an

// On ne stocke jamais un token en clair en base (voir db.ts) : seulement le
// hash de ce qui a été posé en cookie. Un accès en lecture seule à la base
// ne suffit donc pas à usurper un pseudo.
function hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
}

// Un code à 6 chiffres n'a qu'un million de valeurs : haché seul, il se
// retrouverait instantanément à partir de son hash. Haché avec le jeton de
// la demande, qui n'est jamais stocké en clair, il reste introuvable.
function hashCode(requestToken: string, code: string): string {
    return crypto.createHash('sha256').update(`${requestToken}:${code}`).digest('hex');
}

/**
 * Étape 1 : quelqu'un veut protéger un pseudo. On vérifie qu'il n'est pas
 * déjà revendiqué par une autre adresse, puis on envoie un code à 6 chiffres
 * par email.
 *
 * Renvoie le jeton de la demande, à poser en cookie : seul ce navigateur
 * pourra saisir le code. `previousRequestToken` est le cookie d'une demande
 * précédente du même navigateur (« Renvoyer le code ») : elle est annulée,
 * pour qu'un seul code soit valable à la fois.
 */
export async function requestVerification(username: string, email: string, previousRequestToken: string | undefined): Promise<string> {
    const requestToken = crypto.randomBytes(32).toString('hex');
    const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');

    // Transaction plutôt que simple connexion : si l'envoi d'email échoue,
    // l'insertion de la demande doit être annulée elle aussi (pas de demande
    // orpheline dont le code n'est jamais arrivé).
    await withTransaction(async (conn) => {
        // Balaie au passage les demandes expirées : beaucoup ne sont jamais
        // menées à terme, donc sans ça la table grossirait indéfiniment sans
        // qu'aucun autre code n'y touche jamais.
        await conn.query('DELETE FROM email_verifications WHERE expiresAt < NOW()');

        if (previousRequestToken) {
            await conn.query('DELETE FROM email_verifications WHERE requestHash = ?', [hashToken(previousRequestToken)]);
        }

        const rows = await conn.query('SELECT email FROM users WHERE username = ?', [username]);
        const existingEmail: string | null = rows[0]?.email ?? null;

        if (existingEmail && existingEmail !== email) {
            throw new AppError(409, `Le pseudo "${username}" est déjà protégé par une autre adresse email.`);
        }

        await conn.query(
            'INSERT INTO email_verifications (requestHash, username, email, codeHash, expiresAt) VALUES (?, ?, ?, ?, ?)',
            [hashToken(requestToken), username, email, hashCode(requestToken, code), new Date(Date.now() + VERIFICATION_TTL_MS)]
        );

        await sendVerificationCode(email, username, code);
    });

    logAction(`[AUTH] Code de vérification envoyé pour le pseudo "${username}" (${email})`);
    return requestToken;
}

type CodeCheck =
    | { status: 'missing' | 'expired' }
    | { status: 'wrong'; remainingAttempts: number }
    | { status: 'verified'; username: string; deviceToken: string };

/**
 * Étape 2 : l'utilisateur saisit le code reçu, dans le navigateur qui l'a
 * demandé. Si le code est bon, la demande est consommée, le pseudo
 * revendiqué, et l'appareil reçoit un token longue durée.
 *
 * Un mauvais code consomme un essai ; au 5e, la demande est supprimée et il
 * faut en refaire une. Avec au plus 5 demandes par heure et par adresse IP
 * (authLimiter), deviner un code reste de l'ordre d'une chance sur 40 000
 * par heure.
 */
export async function verifyCode(requestToken: string | undefined, code: string): Promise<{ username: string; deviceToken: string }> {
    if (!requestToken) {
        throw new AppError(400, 'Aucun code en attente sur cet appareil. Demandez un nouveau code.');
    }

    // Le compteur d'essais doit être enregistré même quand le code est faux :
    // la transaction renvoie donc un résultat au lieu de lever une erreur (ce
    // qui l'annulerait), et les erreurs sont levées une fois validée.
    // FOR UPDATE : deux essais simultanés ne peuvent pas lire le même
    // compteur et dépasser la limite.
    const check = await withTransaction(async (conn): Promise<CodeCheck> => {
        const rows = await conn.query(
            'SELECT id, username, email, codeHash, attempts, expiresAt FROM email_verifications WHERE requestHash = ? FOR UPDATE',
            [hashToken(requestToken)]
        );
        const pending = rows[0];
        if (!pending) return { status: 'missing' };

        if (new Date(pending.expiresAt).getTime() < Date.now()) {
            await conn.query('DELETE FROM email_verifications WHERE id = ?', [pending.id]);
            return { status: 'expired' };
        }

        if (hashCode(requestToken, code) !== pending.codeHash) {
            const attempts = Number(pending.attempts) + 1;
            if (attempts >= MAX_CODE_ATTEMPTS) {
                await conn.query('DELETE FROM email_verifications WHERE id = ?', [pending.id]);
            } else {
                await conn.query('UPDATE email_verifications SET attempts = ? WHERE id = ?', [attempts, pending.id]);
            }
            return { status: 'wrong', remainingAttempts: MAX_CODE_ATTEMPTS - attempts };
        }

        await conn.query('DELETE FROM email_verifications WHERE id = ?', [pending.id]);

        const userId = await getOrCreateUser(conn, pending.username);
        if (userId === null) {
            throw new AppError(400, 'Pseudo invalide.');
        }

        // Revendique le pseudo s'il ne l'est pas encore. S'il l'a été entre
        // la demande et la saisie par une autre adresse, on refuse : le code
        // prouve la possession de cette boîte-ci, pas de celle qui protège
        // désormais le pseudo.
        await conn.query('UPDATE users SET email = ? WHERE id = ? AND email IS NULL', [pending.email, userId]);
        const [owner] = await conn.query('SELECT email FROM users WHERE id = ?', [userId]);
        if (owner.email !== pending.email) {
            throw new AppError(409, `Le pseudo "${pending.username}" est déjà protégé par une autre adresse email.`);
        }

        const deviceToken = crypto.randomBytes(32).toString('hex');
        await conn.query(
            'INSERT INTO device_tokens (user_id, tokenHash) VALUES (?, ?)',
            [userId, hashToken(deviceToken)]
        );

        return { status: 'verified', username: pending.username, deviceToken };
    });

    switch (check.status) {
        case 'missing':
            throw new AppError(400, 'Aucun code en attente sur cet appareil. Demandez un nouveau code.');
        case 'expired':
            throw new AppError(400, 'Ce code a expiré. Demandez-en un nouveau.');
        case 'wrong':
            throw new AppError(400, check.remainingAttempts > 0
                ? `Code incorrect. Il vous reste ${check.remainingAttempts} essai${check.remainingAttempts > 1 ? 's' : ''}.`
                : 'Code incorrect. Trop d\'essais : demandez un nouveau code.');
        case 'verified':
            logAction(`[AUTH] Pseudo "${check.username}" vérifié sur un nouvel appareil`);
            return { username: check.username, deviceToken: check.deviceToken };
    }
}

/**
 * Demande de code en cours dans ce navigateur, s'il y en a une. Permet au
 * front de rouvrir l'écran de saisie après un rechargement : sur mobile,
 * passer dans l'appli Mail suffit parfois à recharger l'onglet.
 *
 * L'expiration est comparée en JS, comme dans verifyCode : `expiresAt` est
 * écrit depuis Node, dont le fuseau peut différer de celui de NOW() côté
 * base.
 */
export async function getPendingVerification(requestToken: string | undefined): Promise<{ username: string; email: string } | null> {
    if (!requestToken) return null;

    const rows = await withConnection((conn) => conn.query(
        'SELECT username, email, expiresAt FROM email_verifications WHERE requestHash = ?',
        [hashToken(requestToken)]
    ));
    const pending = rows[0];
    if (!pending || new Date(pending.expiresAt).getTime() < Date.now()) return null;

    return { username: pending.username, email: pending.email };
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

export interface VerifiedUser {
    username: string;
    isAdmin: boolean;
}

async function getUserFromDeviceToken(rawToken: string): Promise<VerifiedUser | null> {
    const tokenHash = hashToken(rawToken);

    return withConnection(async (conn) => {
        const rows = await conn.query(
            'SELECT u.username, u.is_admin FROM device_tokens dt JOIN users u ON u.id = dt.user_id WHERE dt.tokenHash = ?',
            [tokenHash]
        );
        if (rows.length === 0) return null;

        // Best-effort : trace du dernier usage, ne doit pas faire échouer la requête.
        conn.query('UPDATE device_tokens SET lastUsedAt = NOW() WHERE tokenHash = ?', [tokenHash]).catch(() => {});

        return { username: rows[0].username, isAdmin: Boolean(rows[0].is_admin) };
    });
}

async function getUsernameFromDeviceToken(rawToken: string): Promise<string | null> {
    const user = await getUserFromDeviceToken(rawToken);
    return user?.username ?? null;
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

export async function getVerifiedUser(deviceTokenRaw: string | undefined): Promise<VerifiedUser | null> {
    if (!deviceTokenRaw) return null;
    return getUserFromDeviceToken(deviceTokenRaw);
}

/**
 * Exige un appareil vérifié appartenant à un admin, et renvoie son pseudo.
 *
 * Point important : on part du token d'appareil (preuve de possession d'une
 * boîte mail vérifiée), jamais du pseudo envoyé dans le corps de la requête —
 * celui-ci est auto-déclaré et peut être n'importe quoi (voir resolveAuthor).
 *
 * Le droit admin ne s'accorde qu'en base :
 *   UPDATE users SET is_admin = true WHERE username = '...';
 */
export async function requireAdmin(deviceTokenRaw: string | undefined): Promise<string> {
    const user = deviceTokenRaw ? await getUserFromDeviceToken(deviceTokenRaw) : null;
    if (!user || !user.isAdmin) {
        throw new AppError(403, 'Action réservée aux administrateurs.');
    }
    return user.username;
}

export const deviceTokenCookieOptions = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: COOKIE_SECURE,
    maxAge: DEVICE_TOKEN_MAX_AGE_MS,
    path: '/',
};

// Limité aux routes d'auth : le reste de l'API n'a pas à le recevoir.
export const pendingVerificationCookieOptions = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: COOKIE_SECURE,
    maxAge: VERIFICATION_TTL_MS,
    path: '/api/auth',
};
