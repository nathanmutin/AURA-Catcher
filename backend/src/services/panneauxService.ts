import path from 'path';
import fs from 'fs';
import { withConnection, withTransaction, getOrCreateUser } from '../db';
import { processImage } from '../imageUtils';
import { logAction } from '../logger';
import { AppError } from '../errors';
import { SMALL_DIR, ORIGINAL_DIR } from '../config';
import { Panneau } from '../types';

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

export async function listPanneaux(): Promise<Panneau[]> {
    return withConnection(async (conn) => {
        const panelRows: PanelRow[] = await conn.query(`
            SELECT
                p.id,
                p.lat,
                p.lng,
                p.comment,
                p.createdAt,
                u.username
            FROM panneaux p
            LEFT JOIN users u ON p.author_id = u.id
            ORDER BY p.createdAt DESC
        `);

        const imageRows: ImageRow[] = await conn.query(`
            SELECT id, panneau_id
            FROM images
            ORDER BY panneau_id, main_image DESC, createdAt DESC, id DESC
        `);

        const typeRows: TypeRow[] = await conn.query(`
            SELECT panneau_id, type_id
            FROM panneau_types_mapping
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

interface CreatePanneauInput {
    file: Express.Multer.File;
    lat: number;
    lng: number;
    comment: string | null;
    author: string | undefined;
    typeIds: number[];
    ip: string;
}

export async function createPanneau(input: CreatePanneauInput): Promise<Panneau> {
    const { file, lat, lng, comment, author, typeIds, ip } = input;

    // Traite l'image (versions originale + réduite) avant d'ouvrir la transaction :
    // pas la peine de garder une connexion DB occupée pendant le traitement sharp.
    const { fileNameOriginal, fileNameSmall } = await processImage(file);

    const { panneauId, imageId } = await withTransaction(async (conn) => {
        const authorId = await getOrCreateUser(conn, author);

        const panneauRes = await conn.query(
            'INSERT INTO panneaux (lat, lng, comment, author_id) VALUES (?, ?, ?, ?)',
            [lat, lng, comment, authorId]
        );
        const panneauId = panneauRes.insertId;

        for (const tid of typeIds) {
            await conn.query(
                'INSERT INTO panneau_types_mapping (panneau_id, type_id) VALUES (?, ?)',
                [panneauId, tid]
            );
        }

        const imageRes = await conn.query(
            'INSERT INTO images (fileNameOriginal, fileNameSmall, panneau_id, main_image, author_id) VALUES (?, ?, ?, ?, ?)',
            [fileNameOriginal, fileNameSmall, panneauId, true, authorId]
        );

        return {
            panneauId: parseInt(panneauId.toString()),
            imageId: parseInt(imageRes.insertId.toString()),
        };
    });

    logAction(`[NEW PANEL] ID: ${panneauId}, Lat: ${lat}, Lng: ${lng}, Author: ${author || 'Anonymous'}, Image: ${fileNameOriginal}, Types: ${typeIds.join(', ')}, IP: ${ip}`);

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
    ip: string;
}

export async function addPhotoToPanneau(input: AddPhotoInput): Promise<{ imageId: number }> {
    const { panneauId, file, author, ip } = input;

    const panelExists = await withConnection(async (conn) => {
        const rows = await conn.query('SELECT id FROM panneaux WHERE id = ?', [panneauId]);
        return rows.length > 0;
    });
    if (!panelExists) {
        throw new AppError(404, 'Panneau not found');
    }

    const { fileNameOriginal, fileNameSmall } = await processImage(file);

    const imageId = await withTransaction(async (conn) => {
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

    logAction(`[NEW PHOTO] Panel ID: ${panneauId}, Author: ${author || 'Anonymous'}, Image: ${fileNameOriginal}, IP: ${ip}`);

    return { imageId };
}

export async function getGlobalStats(): Promise<{ totalPanels: number; totalContributors: number }> {
    return withConnection(async (conn) => {
        const [panelsCount] = await conn.query('SELECT COUNT(*) as count FROM panneaux');
        const [contributorsCount] = await conn.query('SELECT COUNT(DISTINCT author_id) as count FROM panneaux WHERE author_id IS NOT NULL');

        return {
            totalPanels: Number(panelsCount.count),
            totalContributors: Number(contributorsCount.count),
        };
    });
}

export async function getLeaderboard(): Promise<Array<{ username: string; count: number; totalPanels: number }>> {
    return withConnection(async (conn) => {
        const rows = await conn.query(`
            SELECT
                u.username,
                SUM(t.points) as count,
                COUNT(DISTINCT p.id) as total_panels
            FROM panneaux p
            JOIN users u ON p.author_id = u.id
            JOIN panneau_types_mapping ptm ON p.id = ptm.panneau_id
            JOIN panel_types t ON ptm.type_id = t.id
            GROUP BY u.id
            ORDER BY count DESC
            LIMIT 10
        `);

        return rows.map((row: { username: string; count: number | null; total_panels: number | null }) => ({
            username: row.username,
            count: Number(row.count || 0),
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
        throw new AppError(404, 'Image not found');
    }

    const filePath = size === 'original'
        ? path.join(ORIGINAL_DIR, row.fileNameOriginal)
        : path.join(SMALL_DIR, row.fileNameSmall);

    if (!fs.existsSync(filePath)) {
        throw new AppError(404, 'File not found on disk');
    }

    return filePath;
}
