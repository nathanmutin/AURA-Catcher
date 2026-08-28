import { Request, Response, NextFunction, RequestHandler } from 'express';

// Erreur "métier" volontaire (ex: ressource introuvable) : porte son propre
// code HTTP, contrairement à une erreur inattendue qui devient un 500 générique.
export class AppError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

// Évite de répéter un try/catch dans chaque route : si le handler async rejette,
// l'erreur est transmise à errorHandler via next(err) au lieu de crasher le process.
export function asyncHandler(handler: AsyncRouteHandler): RequestHandler {
    return (req, res, next) => {
        handler(req, res, next).catch(next);
    };
}

// Middleware d'erreur centralisé. La signature à 4 paramètres est ce qui
// indique à Express qu'il s'agit d'un error handler (le paramètre `next`
// doit rester présent même s'il n'est pas utilisé ici).
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Express exige 4 paramètres pour reconnaître un error handler
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
    if (err instanceof AppError) {
        res.status(err.status).json({ error: err.message });
        return;
    }

    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
}
