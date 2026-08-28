import rateLimit from 'express-rate-limit';

// Limite le nombre de créations de panneaux / ajouts de photos par IP,
// pour limiter le spam sur les routes d'écriture.
export const writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
});
