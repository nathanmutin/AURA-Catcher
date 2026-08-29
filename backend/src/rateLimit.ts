import rateLimit from 'express-rate-limit';

// Limite le nombre de créations de panneaux / ajouts de photos par IP,
// pour limiter le spam sur les routes d'écriture.
export const writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
});

// Beaucoup plus strict : demander une vérification envoie un vrai email à
// une adresse arbitraire. Sans cette limite, la route serait un vecteur de
// spam (harceler une boîte mail qui n'a rien demandé).
export const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
});
