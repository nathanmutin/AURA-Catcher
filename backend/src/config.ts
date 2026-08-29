import path from 'path';

export const DATA_DIR = path.join(__dirname, '../../data');
export const LOGS_DIR = path.join(DATA_DIR, 'logs');
export const PHOTOS_DIR = path.join(DATA_DIR, 'photos');
export const TEMP_DIR = path.join(PHOTOS_DIR, 'temp');
export const ORIGINAL_DIR = path.join(PHOTOS_DIR, 'original');
export const SMALL_DIR = path.join(PHOTOS_DIR, 'small');

// URL publique du site, utilisée pour construire le lien de vérification
// envoyé par email (doit être joignable depuis la boîte mail du visiteur,
// donc jamais "localhost" en production).

export const PUBLIC_URL = process.env.PUBLIC_URL || 'http://localhost:5173';

// Le cookie de vérification d'appareil n'est marqué "Secure" (envoyé
// uniquement en HTTPS) que si le site est effectivement servi en HTTPS.
export const COOKIE_SECURE = PUBLIC_URL.startsWith('https://');

// Adresse d'expédition des emails de vérification. La valeur par défaut
// (onboarding@resend.dev) est l'adresse de test de Resend : elle ne peut
// envoyer qu'à l'adresse du compte Resend lui-même, pas à de vrais
// utilisateurs — à remplacer par une adresse sur un domaine vérifié en prod.
export const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';
