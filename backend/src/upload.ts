import multer from 'multer';
import crypto from 'crypto';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { TEMP_DIR } from './config';

const ALLOWED_MIME_TYPES: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
};

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, TEMP_DIR);
    },
    filename: (req, file, cb) => {
        // Nom généré aléatoirement : on n'utilise jamais file.originalname
        // pour éviter toute injection de chemin (ex: "../../etc/passwd").
        const ext = ALLOWED_MIME_TYPES[file.mimetype] ?? '.jpg';
        cb(null, `${crypto.randomUUID()}${ext}`);
    }
});

const multerUpload = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZE,
    },
    fileFilter: (req, file, cb) => {
        if (!ALLOWED_MIME_TYPES[file.mimetype]) {
            cb(new Error('INVALID_FILE_TYPE'));
            return;
        }
        cb(null, true);
    }
});

/**
 * Wrap a multer middleware so upload errors (bad type, too large) return
 * a clean 400 instead of bubbling up as an unhandled 500.
 */
function wrapUpload(middleware: RequestHandler): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
        middleware(req, res, (err: unknown) => {
            if (!err) {
                next();
                return;
            }

            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    res.status(400).json({ error: `File too large (max ${MAX_FILE_SIZE / (1024 * 1024)}MB)` });
                    return;
                }
                res.status(400).json({ error: err.message });
                return;
            }

            if (err instanceof Error && err.message === 'INVALID_FILE_TYPE') {
                res.status(400).json({ error: 'Invalid file type. Allowed: jpeg, png, webp, gif' });
                return;
            }

            next(err);
        });
    };
}

export const uploadSingleImage = wrapUpload(multerUpload.single('image'));
