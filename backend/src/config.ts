import path from 'path';

export const DATA_DIR = path.join(__dirname, '../../data');
export const LOGS_DIR = path.join(DATA_DIR, 'logs');
export const PHOTOS_DIR = path.join(DATA_DIR, 'photos');
export const TEMP_DIR = path.join(PHOTOS_DIR, 'temp');
export const ORIGINAL_DIR = path.join(PHOTOS_DIR, 'original');
export const SMALL_DIR = path.join(PHOTOS_DIR, 'small');

// URL publique du site, utilisée pour les liens absolus du flux RSS (doit
// être joignable depuis un lecteur de flux, donc jamais "localhost" en
// production) et pour savoir si le site est servi en HTTPS.

export const PUBLIC_URL = process.env.PUBLIC_URL || 'http://localhost:5173';

// Le cookie de vérification d'appareil n'est marqué "Secure" (envoyé
// uniquement en HTTPS) que si le site est effectivement servi en HTTPS.
export const COOKIE_SECURE = PUBLIC_URL.startsWith('https://');

// Adresse d'expédition des emails de vérification. La valeur par défaut
// (onboarding@resend.dev) est l'adresse de test de Resend : elle ne peut
// envoyer qu'à l'adresse du compte Resend lui-même, pas à de vrais
// utilisateurs — à remplacer par une adresse sur un domaine vérifié en prod.
export const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';

// Nombre de proxys devant le backend, dont Express doit croire l'en-tête
// X-Forwarded-For pour connaître l'IP du visiteur (les limites de débit sont
// comptées par IP). Sans ça, derrière un proxy, tout le monde a l'IP du
// proxy et partage les mêmes limites.
//
// 0 par défaut : sans proxy devant lui, le backend ne doit croire aucun
// X-Forwarded-For, sinon chacun pourrait choisir l'IP qu'il déclare. La
// valeur de production est fixée dans compose.yaml.
const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS ?? 0);
export const TRUST_PROXY_HOPS = Number.isInteger(trustProxyHops) && trustProxyHops > 0 ? trustProxyHops : 0;
