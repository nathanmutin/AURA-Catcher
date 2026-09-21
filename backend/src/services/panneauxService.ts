import path from 'path';
import fs from 'fs';
import mariadb from 'mariadb';
import { withConnection, withTransaction, getOrCreateUser } from '../db';
import { processImage, restoreFailedImage } from '../imageUtils';
import { logAction } from '../logger';
import { AppError } from '../errors';
import { SMALL_DIR, ORIGINAL_DIR } from '../config';
import { Panneau, PanneauRevision, EditableField, LeaderboardEntry } from '../types';

interface PanelRow {
    id: number;
    lat: number;
    lng: number;
    comment: string | null;
    createdAt: Date;
    username: string | null;
}

interface ImageRow {
    id: number;
    panneau_id: number;
}

interface TypeRow {
    panneau_id: number;
    type_id: number;
}

interface RevisionRow {
    id: number;
    panneau_id: number;
    changedFields: string | null;
    restoredFrom: number | null;
    createdAt: Date;
    username: string | null;
}

// L'état complet de chaque révision reste en base (c'est ce qui permet de
// restaurer) ; l'API n'expose que de quoi lire l'historique.
function toRevision(row: RevisionRow): PanneauRevision {
    return {
        id: Number(row.id),
        author: row.username || undefined,
        createdAt: row.createdAt.toISOString(),
        // changedFields NULL = révision de création : aucun champ "modifié".
        fields: row.changedFields ? (row.changedFields.split(',') as EditableField[]) : [],
        restoredFrom: row.restoredFrom === null ? undefined : Number(row.restoredFrom),
    };
}

// Écrit une révision (état complet + types) et renvoie son id. Appelé à la
// création, à chaque modification et à chaque restauration : c'est le seul
// endroit qui insère dans panneau_revisions.
async function insertRevision(
    conn: mariadb.Connection,
    panneau: { id: number; lat: number; lng: number; comment: string | null; typeIds: number[] },
    meta: { changedFields: EditableField[] | null; editorId: number | null; restoredFrom?: number }
): Promise<number> {
    const result = await conn.query(
        'INSERT INTO panneau_revisions (panneau_id, lat, lng, comment, changedFields, restoredFrom, editor_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
            panneau.id,
            panneau.lat,
            panneau.lng,
            panneau.comment,
            meta.changedFields ? meta.changedFields.join(',') : null,
            meta.restoredFrom ?? null,
            meta.editorId,
        ]
    );
    const revisionId = parseInt(result.insertId.toString());

    for (const typeId of panneau.typeIds) {
        await conn.query(
            'INSERT INTO panneau_revision_types (revision_id, type_id) VALUES (?, ?)',
            [revisionId, typeId]
        );
    }

    return revisionId;
}

export async function listPanneaux(): Promise<Panneau[]> {
    return withConnection(async (conn) => {
        // L'état courant vient de la révision pointée par current_revision_id,
        // l'auteur et la date de celle pointée par first_revision_id : deux
        // jointures sur clé primaire, aucun agrégat.
        const panelRows: PanelRow[] = await conn.query(`
            SELECT
                p.id,
                cur.lat,
                cur.lng,
                cur.comment,
                first.createdAt,
                u.username
            FROM panneaux p
            JOIN panneau_revisions cur ON cur.id = p.current_revision_id
            JOIN panneau_revisions first ON first.id = p.first_revision_id
            LEFT JOIN users u ON u.id = first.editor_id
            ORDER BY first.createdAt DESC
        `);

        const imageRows: ImageRow[] = await conn.query(`
            SELECT id, panneau_id
            FROM images
            ORDER BY panneau_id, main_image DESC, createdAt DESC, id DESC
        `);

        const typeRows: TypeRow[] = await conn.query(`
            SELECT p.id AS panneau_id, rt.type_id
            FROM panneaux p
            JOIN panneau_revision_types rt ON rt.revision_id = p.current_revision_id
        `);

        const imageIdsByPanel = new Map<number, number[]>();
        imageRows.forEach((row) => {
            const panneauId = Number(row.panneau_id);
            const imageIds = imageIdsByPanel.get(panneauId) ?? [];
            imageIds.push(Number(row.id));
            imageIdsByPanel.set(panneauId, imageIds);
        });

        const typeIdsByPanel = new Map<number, number[]>();
        typeRows.forEach((row) => {
            const panneauId = Number(row.panneau_id);
            const typeIds = typeIdsByPanel.get(panneauId) ?? [];
            typeIds.push(Number(row.type_id));
            typeIdsByPanel.set(panneauId, typeIds);
        });

        return panelRows.map((row) => ({
            id: row.id,
            lat: row.lat,
            lng: row.lng,
            comment: row.comment || undefined,
            createdAt: row.createdAt.toISOString(),
            author: row.username || undefined,
            imageIds: imageIdsByPanel.get(row.id) ?? [],
            typeIds: typeIdsByPanel.get(row.id) ?? [],
        }));
    });
}

// Recharge un panneau complet depuis une connexion déjà ouverte : sert à
// renvoyer l'état à jour juste après une modification, dans la même
// transaction (donc cohérent avec ce qui vient d'être écrit).
async function loadPanneau(conn: mariadb.Connection, panneauId: number): Promise<Panneau | null> {
    const rows: PanelRow[] = await conn.query(`
        SELECT p.id, cur.lat, cur.lng, cur.comment, first.createdAt, u.username
        FROM panneaux p
        JOIN panneau_revisions cur ON cur.id = p.current_revision_id
        JOIN panneau_revisions first ON first.id = p.first_revision_id
        LEFT JOIN users u ON u.id = first.editor_id
        WHERE p.id = ?
    `, [panneauId]);

    const row = rows[0];
    if (!row) return null;

    const imageRows: ImageRow[] = await conn.query(
        'SELECT id FROM images WHERE panneau_id = ? ORDER BY main_image DESC, createdAt DESC, id DESC',
        [panneauId]
    );
    const typeRows = await conn.query(`
        SELECT rt.type_id
        FROM panneaux p
        JOIN panneau_revision_types rt ON rt.revision_id = p.current_revision_id
        WHERE p.id = ?
    `, [panneauId]);
    return {
        id: Number(row.id),
        lat: Number(row.lat),
        lng: Number(row.lng),
        comment: row.comment || undefined,
        createdAt: row.createdAt.toISOString(),
        author: row.username || undefined,
        imageIds: imageRows.map((image) => Number(image.id)),
        typeIds: typeRows.map((type: { type_id: number }) => Number(type.type_id)),
    };
}

interface CreatePanneauInput {
    file: Express.Multer.File;
    lat: number;
    lng: number;
    comment: string | null;
    author: string | undefined;
    typeIds: number[];
}

export async function createPanneau(input: CreatePanneauInput): Promise<Panneau> {
    const { file, lat, lng, comment, author, typeIds } = input;

    // Traite l'image (versions originale + réduite) avant d'ouvrir la transaction :
    // pas la peine de garder une connexion DB occupée pendant le traitement sharp.
    const { fileNameOriginal, fileNameSmall } = await processImage(file);

    let panneauId: number;
    let imageId: number;
    try {
        ({ panneauId, imageId } = await withTransaction(async (conn) => {
            const authorId = await getOrCreateUser(conn, author);

            // En trois temps, la dépendance étant circulaire : le panneau ne
            // porte que son identité, sa révision de création le référence,
            // puis les deux pointeurs désignent cette révision.
            const panneauRes = await conn.query('INSERT INTO panneaux () VALUES ()');
            const panneauId = parseInt(panneauRes.insertId.toString());

            const imageRes = await conn.query(
                'INSERT INTO images (fileNameOriginal, fileNameSmall, panneau_id, main_image, author_id) VALUES (?, ?, ?, ?, ?)',
                [fileNameOriginal, fileNameSmall, panneauId, true, authorId]
            );

            // Révision de création (changedFields NULL) : elle porte l'état
            // initial, mais aussi l'auteur et la date de création du panneau.
            const revisionId = await insertRevision(
                conn,
                { id: panneauId, lat, lng, comment, typeIds },
                { changedFields: null, editorId: authorId }
            );

            await conn.query(
                'UPDATE panneaux SET first_revision_id = ?, current_revision_id = ? WHERE id = ?',
                [revisionId, revisionId, panneauId]
            );

            return {
                panneauId,
                imageId: parseInt(imageRes.insertId.toString()),
            };
        }));
    } catch (err) {
        await restoreFailedImage(file, fileNameOriginal, fileNameSmall);
        throw err;
    }

    logAction(`[NEW PANEL] ID: ${panneauId}, Lat: ${lat}, Lng: ${lng}, Author: ${author || 'Anonymous'}, Image: ${fileNameOriginal}, Types: ${typeIds.join(', ')}`);

    return {
        id: panneauId,
        lat,
        lng,
        imageIds: [imageId],
        comment: comment ?? undefined,
        author: author ?? undefined,
        typeIds,
        createdAt: new Date().toISOString(),
    };
}

interface AddPhotoInput {
    panneauId: string;
    file: Express.Multer.File;
    author: string | undefined;
}

export async function addPhotoToPanneau(input: AddPhotoInput): Promise<{ imageId: number }> {
    const { panneauId, file, author } = input;

    const panelExists = await withConnection(async (conn) => {
        const rows = await conn.query('SELECT id FROM panneaux WHERE id = ?', [panneauId]);
        return rows.length > 0;
    });
    if (!panelExists) {
        throw new AppError(404, 'Panneau introuvable');
    }

    const { fileNameOriginal, fileNameSmall } = await processImage(file);

    let imageId: number;
    try {
        imageId = await withTransaction(async (conn) => {
            const authorId = await getOrCreateUser(conn, author);

            // Le nouvel ajout devient la photo principale du panneau.
            await conn.query(
                'UPDATE images SET main_image = false WHERE panneau_id = ? AND main_image = true',
                [panneauId]
            );

            const imageRes = await conn.query(
                'INSERT INTO images (fileNameOriginal, fileNameSmall, panneau_id, main_image, author_id) VALUES (?, ?, ?, ?, ?)',
                [fileNameOriginal, fileNameSmall, panneauId, true, authorId]
            );

            return parseInt(imageRes.insertId.toString());
        });
    } catch (err) {
        await restoreFailedImage(file, fileNameOriginal, fileNameSmall);
        throw err;
    }

    logAction(`[NEW PHOTO] Panel ID: ${panneauId}, Author: ${author || 'Anonymous'}, Image: ${fileNameOriginal}`);

    return { imageId };
}

interface UpdatePanneauInput {
    panneauId: number;
    // Champ absent (undefined) = inchangé. Pour le commentaire, null = effacé.
    lat?: number;
    lng?: number;
    comment?: string | null;
    typeIds?: number[];
    editor: string | undefined;
}

// Lit l'état courant d'un panneau (celui de sa révision courante) en
// verrouillant la ligne du panneau : deux écritures concurrentes sur le même
// panneau s'exécutent alors l'une après l'autre.
async function lockCurrentState(
    conn: mariadb.Connection,
    panneauId: number
): Promise<{ revisionId: number; lat: number; lng: number; comment: string | null; typeIds: number[] }> {
    const rows = await conn.query(`
        SELECT cur.id AS revisionId, cur.lat, cur.lng, cur.comment
        FROM panneaux p
        JOIN panneau_revisions cur ON cur.id = p.current_revision_id
        WHERE p.id = ?
        FOR UPDATE
    `, [panneauId]);

    const current = rows[0];
    if (!current) {
        throw new AppError(404, 'Panneau introuvable');
    }

    const typeRows = await conn.query(
        'SELECT type_id FROM panneau_revision_types WHERE revision_id = ?',
        [current.revisionId]
    );

    return {
        revisionId: Number(current.revisionId),
        lat: Number(current.lat),
        lng: Number(current.lng),
        comment: current.comment ?? null,
        typeIds: typeRows.map((row: { type_id: number }) => Number(row.type_id)).sort((a: number, b: number) => a - b),
    };
}

/**
 * Modifie un panneau existant (position, commentaire, types) : écrit une
 * nouvelle révision et fait pointer le panneau dessus.
 *
 * Le parti pris : l'édition reste ouverte à tout le monde, comme la création,
 * mais rien n'est destructif — chaque version précédente reste intacte, donc
 * une dégradation se répare, et l'auteur de chaque modification est affiché
 * dans l'app. Les photos, elles, ne sont jamais supprimées ici.
 */
export async function updatePanneau(input: UpdatePanneauInput): Promise<Panneau> {
    const { panneauId, editor } = input;

    const { panneau, changedFields } = await withTransaction(async (conn) => {
        const current = await lockCurrentState(conn, panneauId);

        const changedFields: EditableField[] = [];

        const nextLat = input.lat ?? current.lat;
        const nextLng = input.lng ?? current.lng;
        // Epsilon ~0.1 mm : évite d'enregistrer une "modification" pour un
        // simple aller-retour d'arrondi sur les flottants.
        // Aucune limite de distance : un GPS de photo peut se tromper de très
        // loin, et un déplacement abusif se répare depuis l'historique.
        if (Math.abs(nextLat - current.lat) > 1e-9 || Math.abs(nextLng - current.lng) > 1e-9) {
            changedFields.push('position');
        }

        const nextComment = input.comment === undefined ? current.comment : input.comment;
        if (nextComment !== current.comment) {
            changedFields.push('comment');
        }

        let nextTypeIds = current.typeIds;
        if (input.typeIds) {
            nextTypeIds = [...new Set(input.typeIds)].sort((a, b) => a - b);
            const placeholders = nextTypeIds.map(() => '?').join(',');
            const knownTypes = await conn.query(`SELECT id FROM panel_types WHERE id IN (${placeholders})`, nextTypeIds);
            if (knownTypes.length !== nextTypeIds.length) {
                throw new AppError(400, 'Type de panneau inconnu.');
            }

            if (nextTypeIds.join(',') !== current.typeIds.join(',')) {
                changedFields.push('types');
            }
        }

        // Pas de révision si rien n'a bougé : l'historique ne se remplit pas
        // d'entrées vides quand on ouvre le formulaire sans rien changer.
        if (changedFields.length > 0) {
            const editorId = await getOrCreateUser(conn, editor);
            const revisionId = await insertRevision(
                conn,
                { id: panneauId, lat: nextLat, lng: nextLng, comment: nextComment, typeIds: nextTypeIds },
                { changedFields, editorId }
            );
            await conn.query('UPDATE panneaux SET current_revision_id = ? WHERE id = ?', [revisionId, panneauId]);
        }

        const updated = await loadPanneau(conn, panneauId);
        if (!updated) {
            throw new AppError(404, 'Panneau introuvable');
        }

        return { panneau: updated, changedFields };
    });

    if (changedFields.length > 0) {
        logAction(`[EDIT PANEL] ID: ${panneauId}, Editor: ${editor || 'Anonymous'}, Fields: ${changedFields.join(', ')}`);
    }

    return panneau;
}

/**
 * Historique public d'un panneau : qui a écrit quoi, et quand. L'état complet
 * de chaque révision reste en base (c'est ce qui permet de restaurer) mais
 * n'est pas exposé ici.
 */
export async function getPanneauHistory(panneauId: number): Promise<PanneauRevision[]> {
    return withConnection(async (conn) => {
        const rows: RevisionRow[] = await conn.query(`
            SELECT r.id, r.panneau_id, r.changedFields, r.restoredFrom, r.createdAt, u.username
            FROM panneau_revisions r
            LEFT JOIN users u ON u.id = r.editor_id
            WHERE r.panneau_id = ?
            ORDER BY r.id DESC
            LIMIT 20
        `, [panneauId]);

        return rows.map(toRevision);
    });
}

/**
 * Restaure un panneau dans l'état d'une révision antérieure (réservé aux
 * admins, voir requireAdmin côté route).
 *
 * La restauration n'efface pas l'historique : elle ajoute une révision de
 * plus, marquée `restoredFrom`. Réparer est donc une action tracée comme une
 * autre — y compris si c'est l'admin qui abuse.
 */
export async function restorePanneauRevision(panneauId: number, revisionId: number, adminUsername: string): Promise<Panneau> {
    const panneau = await withTransaction(async (conn) => {
        const current = await lockCurrentState(conn, panneauId);

        const revisionRows = await conn.query(
            'SELECT id, panneau_id, lat, lng, comment FROM panneau_revisions WHERE id = ?',
            [revisionId]
        );
        const revision = revisionRows[0];
        // Vérifie aussi l'appartenance : sans ça, on pourrait appliquer à un
        // panneau l'état d'un autre en devinant un id de révision.
        if (!revision || Number(revision.panneau_id) !== panneauId) {
            throw new AppError(404, 'Révision introuvable pour ce panneau.');
        }

        const revisionTypeRows = await conn.query(
            'SELECT type_id FROM panneau_revision_types WHERE revision_id = ?',
            [revisionId]
        );
        const revisionTypeIds: number[] = revisionTypeRows.map((row: { type_id: number }) => Number(row.type_id)).sort((a: number, b: number) => a - b);

        const changedFields: EditableField[] = [];
        const revisionLat = Number(revision.lat);
        const revisionLng = Number(revision.lng);
        const revisionComment: string | null = revision.comment ?? null;

        if (Math.abs(revisionLat - current.lat) > 1e-9 || Math.abs(revisionLng - current.lng) > 1e-9) {
            changedFields.push('position');
        }
        if (revisionComment !== current.comment) {
            changedFields.push('comment');
        }
        if (revisionTypeIds.join(',') !== current.typeIds.join(',')) {
            changedFields.push('types');
        }

        if (changedFields.length === 0) {
            throw new AppError(400, 'Le panneau est déjà dans cet état.');
        }

        // Restaurer, c'est recopier un ancien état dans une nouvelle
        // révision : l'ancienne reste intacte, et le panneau pointe sur la
        // nouvelle.
        const adminId = await getOrCreateUser(conn, adminUsername);
        const newRevisionId = await insertRevision(
            conn,
            { id: panneauId, lat: revisionLat, lng: revisionLng, comment: revisionComment, typeIds: revisionTypeIds },
            { changedFields, editorId: adminId, restoredFrom: revisionId }
        );
        await conn.query('UPDATE panneaux SET current_revision_id = ? WHERE id = ?', [newRevisionId, panneauId]);

        const restored = await loadPanneau(conn, panneauId);
        if (!restored) {
            throw new AppError(404, 'Panneau introuvable');
        }
        return restored;
    });

    logAction(`[RESTORE PANEL] ID: ${panneauId}, Revision: ${revisionId}, Admin: ${adminUsername}`);

    return panneau;
}

export async function getGlobalStats(): Promise<{ totalPanels: number; totalContributors: number }> {
    return withConnection(async (conn) => {
        const [panelsCount] = await conn.query('SELECT COUNT(*) as count FROM panneaux');
        // L'auteur d'un panneau est celui de sa révision de création.
        const [contributorsCount] = await conn.query(`
            SELECT COUNT(DISTINCT first.editor_id) as count
            FROM panneaux p
            JOIN panneau_revisions first ON first.id = p.first_revision_id
            WHERE first.editor_id IS NOT NULL
        `);

        return {
            totalPanels: Number(panelsCount.count),
            totalContributors: Number(contributorsCount.count),
        };
    });
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
    return withConnection(async (conn) => {
        // Les points reviennent à l'auteur du panneau (révision de création),
        // calculés sur les types de sa version courante.
        //
        // Tout le classement est renvoyé : c'est le front qui choisit quoi
        // replier, et il a besoin de toutes les lignes pour situer le
        // visiteur. Le rang est calculé ici avec RANK() plutôt que déduit de
        // la position de la ligne, sinon deux scores égaux recevraient deux
        // rangs différents selon l'ordre de sortie. Le tri par pseudo ne sert
        // qu'à rendre l'ordre des ex æquo stable d'un chargement à l'autre.
        const rows = await conn.query(`
            SELECT
                u.username,
                SUM(t.points) AS score,
                COUNT(DISTINCT p.id) AS total_panels,
                RANK() OVER (ORDER BY SUM(t.points) DESC) AS leaderboard_rank
            FROM panneaux p
            JOIN panneau_revisions first ON first.id = p.first_revision_id
            JOIN users u ON u.id = first.editor_id
            JOIN panneau_revision_types rt ON rt.revision_id = p.current_revision_id
            JOIN panel_types t ON t.id = rt.type_id
            GROUP BY u.id
            ORDER BY score DESC, u.username
        `);

        return rows.map((row: { username: string; score: number | null; total_panels: number | null; leaderboard_rank: number | bigint }) => ({
            username: row.username,
            rank: Number(row.leaderboard_rank),
            count: Number(row.score || 0),
            totalPanels: Number(row.total_panels || 0),
        }));
    });
}

export async function listTypes() {
    return withConnection((conn) => conn.query('SELECT * FROM panel_types ORDER BY points DESC'));
}

export async function getImageFilePath(imageId: string, size: 'small' | 'original'): Promise<string> {
    const row = await withConnection(async (conn) => {
        const rows = await conn.query(
            'SELECT fileNameOriginal, fileNameSmall FROM images WHERE id = ?',
            [imageId]
        );
        return rows[0];
    });

    if (!row) {
        throw new AppError(404, 'Image introuvable');
    }

    const filePath = size === 'original'
        ? path.join(ORIGINAL_DIR, row.fileNameOriginal)
        : path.join(SMALL_DIR, row.fileNameSmall);

    if (!fs.existsSync(filePath)) {
        throw new AppError(404, 'Fichier introuvable sur le disque');
    }

    return filePath;
}
