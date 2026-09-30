import path from 'path';
import fs from 'fs';
import { withConnection, withTransaction, getOrCreateUser } from '../db';
import { processImage, restoreFailedImage } from '../imageUtils';
import { logAction } from '../logger';
import { AppError } from '../errors';
import { SMALL_DIR, ORIGINAL_DIR } from '../config';
import { GaleriePhoto } from '../types';

/**
 * La galerie : des photos de logos de la Région sur des supports qui
 * n'ont pas de position — trains, cars, goodies.
 *
 * Volontairement plus simple que les panneaux : une entrée est une photo,
 * sa seule donnée modifiable est sa légende, et il n'y a donc pas
 * d'historique en révisions à tenir.
 */

interface GalerieRow {
    id: number;
    caption: string | null;
    createdAt: Date;
    username: string | null;
}

const toPhoto = (row: GalerieRow): GaleriePhoto => ({
    id: Number(row.id),
    caption: row.caption ?? undefined,
    author: row.username ?? undefined,
    createdAt: new Date(row.createdAt).toISOString(),
});

// Une photo masquée n'est plus listée ni servie. C'est le seul geste de
// retrait possible, et il ne s'accorde qu'en SQL, comme le droit admin :
//   UPDATE galerie SET hidden = true WHERE id = ...;
const VISIBLE = 'g.hidden = false';

export async function listGaleriePhotos(): Promise<GaleriePhoto[]> {
    const rows: GalerieRow[] = await withConnection((conn) => conn.query(`
        SELECT g.id, g.caption, g.createdAt, u.username
        FROM galerie g
        LEFT JOIN users u ON u.id = g.author_id
        WHERE ${VISIBLE}
        ORDER BY g.createdAt DESC, g.id DESC
    `));

    return rows.map(toPhoto);
}

async function loadPhoto(id: number): Promise<GaleriePhoto> {
    const rows: GalerieRow[] = await withConnection((conn) => conn.query(`
        SELECT g.id, g.caption, g.createdAt, u.username
        FROM galerie g
        LEFT JOIN users u ON u.id = g.author_id
        WHERE g.id = ? AND ${VISIBLE}
    `, [id]));

    if (rows.length === 0) {
        throw new AppError(404, 'Photo introuvable');
    }
    return toPhoto(rows[0]);
}

interface AddGaleriePhotoInput {
    file: Express.Multer.File;
    caption: string | null;
    author: string | undefined;
}

export async function addGaleriePhoto(input: AddGaleriePhotoInput): Promise<GaleriePhoto> {
    const { file, caption, author } = input;

    const { fileNameOriginal, fileNameSmall } = await processImage(file);

    let id: number;
    try {
        id = await withTransaction(async (conn) => {
            const authorId = await getOrCreateUser(conn, author);
            const result = await conn.query(
                'INSERT INTO galerie (fileNameOriginal, fileNameSmall, caption, author_id) VALUES (?, ?, ?, ?)',
                [fileNameOriginal, fileNameSmall, caption, authorId]
            );
            return parseInt(result.insertId.toString());
        });
    } catch (err) {
        // Le fichier traité ne doit pas survivre à une ligne qui n'existe pas.
        await restoreFailedImage(file, fileNameOriginal, fileNameSmall);
        throw err;
    }

    logAction(`[NEW GALLERY PHOTO] ID: ${id}, Author: ${author || 'Anonymous'}, Image: ${fileNameOriginal}`);

    return loadPhoto(id);
}

/**
 * Modifie la légende. Comme pour les panneaux, tout le monde peut corriger
 * celle des autres ; sans révisions, seul le journal d'activité en garde
 * la trace.
 */
export async function updateGalerieCaption(id: number, caption: string | null, author: string | undefined): Promise<GaleriePhoto> {
    const result = await withConnection((conn) => conn.query(
        'UPDATE galerie SET caption = ? WHERE id = ? AND hidden = false',
        [caption, id]
    ));

    if (result.affectedRows === 0) {
        throw new AppError(404, 'Photo introuvable');
    }

    logAction(`[EDIT GALLERY CAPTION] ID: ${id}, Author: ${author || 'Anonymous'}`);

    return loadPhoto(id);
}

export async function getGalerieFilePath(id: number, size: 'small' | 'original'): Promise<string> {
    const row = await withConnection(async (conn) => {
        const rows = await conn.query(
            'SELECT fileNameOriginal, fileNameSmall FROM galerie WHERE id = ? AND hidden = false',
            [id]
        );
        return rows[0];
    });

    if (!row) {
        throw new AppError(404, 'Photo introuvable');
    }

    const filePath = size === 'original'
        ? path.join(ORIGINAL_DIR, row.fileNameOriginal)
        : path.join(SMALL_DIR, row.fileNameSmall);

    if (!fs.existsSync(filePath)) {
        throw new AppError(404, 'Fichier introuvable sur le disque');
    }

    return filePath;
}
