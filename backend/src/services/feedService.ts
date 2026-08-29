import fs from 'fs-extra';
import path from 'path';
import { withConnection } from '../db';
import { PUBLIC_URL, SMALL_DIR } from '../config';

export interface FeedItem {
    guid: string;
    title: string;
    link: string;
    // Absente plutôt qu'un texte générique ("Un nouveau panneau a été
    // ajouté...") quand le panneau n'a pas de description renseignée.
    description?: string;
    pubDate: Date;
    image?: {
        url: string;
        type: string;
        length: number;
    };
}

const FEED_ITEM_LIMIT = 50;

interface PanneauRow {
    id: number;
    comment: string | null;
    createdAt: Date;
    username: string | null;
    imageId: number | null;
    fileNameSmall: string | null;
}

interface PhotoRow {
    id: number;
    panneau_id: number;
    createdAt: Date;
    username: string | null;
    fileNameSmall: string;
    comment: string | null;
}

interface UserRow {
    id: number;
    username: string;
    createdAt: Date;
}

function mimeTypeForFile(fileName: string): string {
    const ext = fileName.slice(fileName.lastIndexOf('.') + 1).toLowerCase();
    switch (ext) {
        case 'webp': return 'image/webp';
        case 'jpg':
        case 'jpeg': return 'image/jpeg';
        case 'png': return 'image/png';
        case 'gif': return 'image/gif';
        default: return 'application/octet-stream';
    }
}

// La taille exacte du fichier est nécessaire pour l'attribut "length" d'une
// <enclosure> RSS. Si le fichier a disparu du disque, on omet simplement
// l'image plutôt que de faire échouer tout le flux pour un seul événement.
async function resolveImageEnclosure(imageId: number | null, fileNameSmall: string | null): Promise<FeedItem['image']> {
    if (!imageId || !fileNameSmall) return undefined;
    try {
        const stats = await fs.stat(path.join(SMALL_DIR, fileNameSmall));
        return {
            url: `${PUBLIC_URL}/api/photo/${imageId}?size=small`,
            type: mimeTypeForFile(fileNameSmall),
            length: stats.size,
        };
    } catch {
        return undefined;
    }
}

/**
 * Rassemble les 3 types d'événements récents (nouveau panneau, nouvelle
 * photo ajoutée à un panneau existant, nouveau contributeur) en une seule
 * liste chronologique, pour le flux RSS.
 */
export async function getRecentActivity(): Promise<FeedItem[]> {
    return withConnection(async (conn) => {
        const panneauRows: PanneauRow[] = await conn.query(`
            SELECT p.id, p.comment, p.createdAt, u.username, img.id AS imageId, img.fileNameSmall
            FROM panneaux p
            LEFT JOIN users u ON p.author_id = u.id
            LEFT JOIN images img ON img.id = (SELECT MIN(id) FROM images WHERE panneau_id = p.id)
            ORDER BY p.createdAt DESC
            LIMIT ?
        `, [FEED_ITEM_LIMIT]);

        // Seules les photos ajoutées APRÈS la création du panneau comptent :
        // la toute première photo d'un panneau (id minimum pour ce
        // panneau_id) est déjà couverte par l'événement "nouveau panneau"
        // ci-dessus, elle ne doit pas apparaître une deuxième fois.
        const photoRows: PhotoRow[] = await conn.query(`
            SELECT i.id, i.panneau_id, i.createdAt, i.fileNameSmall, u.username, p.comment
            FROM images i
            LEFT JOIN users u ON i.author_id = u.id
            JOIN panneaux p ON p.id = i.panneau_id
            WHERE i.id > (SELECT MIN(id) FROM images WHERE panneau_id = i.panneau_id)
            ORDER BY i.createdAt DESC
            LIMIT ?
        `, [FEED_ITEM_LIMIT]);

        const userRows: UserRow[] = await conn.query(`
            SELECT id, username, createdAt
            FROM users
            ORDER BY createdAt DESC
            LIMIT ?
        `, [FEED_ITEM_LIMIT]);

        const panneauItems = await Promise.all(panneauRows.map(async (row): Promise<FeedItem> => {
            const author = row.username || 'Anonyme';
            return {
                guid: `panneau-${row.id}`,
                title: `Nouveau panneau ajouté par ${author}`,
                link: `${PUBLIC_URL}/?panneauId=${row.id}`,
                description: row.comment || undefined,
                pubDate: row.createdAt,
                image: await resolveImageEnclosure(row.imageId, row.fileNameSmall),
            };
        }));

        const photoItems = await Promise.all(photoRows.map(async (row): Promise<FeedItem> => {
            const author = row.username || 'Anonyme';
            return {
                guid: `photo-${row.id}`,
                title: `Nouvelle photo ajoutée par ${author}`,
                link: `${PUBLIC_URL}/?panneauId=${row.panneau_id}`,
                // Les photos n'ont pas de description propre : celle du
                // panneau auquel elles appartiennent sert de contexte.
                description: row.comment || undefined,
                pubDate: row.createdAt,
                image: await resolveImageEnclosure(row.id, row.fileNameSmall),
            };
        }));

        const userItems: FeedItem[] = userRows.map((row) => ({
            guid: `user-${row.id}`,
            title: `Nouveau contributeur : ${row.username}`,
            link: PUBLIC_URL,
            description: undefined,
            pubDate: row.createdAt,
        }));

        const items = [...panneauItems, ...photoItems, ...userItems];
        items.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
        return items.slice(0, FEED_ITEM_LIMIT);
    });
}
