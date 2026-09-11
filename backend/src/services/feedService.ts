import fs from 'fs-extra';
import path from 'path';
import { withConnection } from '../db';
import { distanceMeters, formatDistance } from '../geo';
import { PUBLIC_URL, SMALL_DIR } from '../config';

// Une valeur avant/après, pour détailler une modification dans le flux.
export interface FeedChange {
    label: string;
    before: string;
    after: string;
}

export interface FeedItem {
    guid: string;
    title: string;
    link: string;
    // Absente plutôt qu'un texte générique ("Un nouveau panneau a été
    // ajouté...") quand le panneau n'a pas de description renseignée.
    description?: string;
    pubDate: Date;
    changes?: FeedChange[];
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

interface RevisionRow {
    id: number;
    panneau_id: number;
    lat: number;
    lng: number;
    comment: string | null;
    changedFields: string;
    restoredFrom: number | null;
    createdAt: Date;
    username: string | null;
    imageId: number | null;
    fileNameSmall: string | null;
}

// Libellés lisibles des champs modifiés, pour le titre de l'événement.
const FIELD_LABELS: Record<string, string> = {
    position: 'position',
    comment: 'commentaire',
    types: 'types',
};

// État d'une révision, réduit à ce qui sert à calculer un diff.
interface RevisionState {
    id: number;
    panneau_id: number;
    lat: number;
    lng: number;
    comment: string | null;
}

const EMPTY_VALUE = '(vide)';
const formatCoords = (lat: number, lng: number): string => `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

/**
 * Compare une révision à la précédente pour en tirer les couples
 * avant → après affichés dans le flux.
 *
 * C'est la contrepartie du choix de stocker des états complets plutôt que des
 * deltas : le diff se recalcule, mais il reste toujours cohérent avec ce qui
 * est réellement en base — impossible d'avoir un "changement" enregistré qui
 * ne corresponde plus aux valeurs.
 */
function diffRevisions(
    previous: RevisionState,
    current: RevisionState,
    previousTypes: string[],
    currentTypes: string[]
): FeedChange[] {
    const changes: FeedChange[] = [];

    if (Math.abs(previous.lat - current.lat) > 1e-9 || Math.abs(previous.lng - current.lng) > 1e-9) {
        const moved = distanceMeters(previous.lat, previous.lng, current.lat, current.lng);
        changes.push({
            label: 'Position',
            before: formatCoords(previous.lat, previous.lng),
            after: `${formatCoords(current.lat, current.lng)} (déplacé de ${formatDistance(moved)})`,
        });
    }

    if ((previous.comment ?? '') !== (current.comment ?? '')) {
        changes.push({
            label: 'Commentaire',
            before: previous.comment || EMPTY_VALUE,
            after: current.comment || EMPTY_VALUE,
        });
    }

    if (previousTypes.join(', ') !== currentTypes.join(', ')) {
        changes.push({
            label: 'Types',
            before: previousTypes.join(', ') || EMPTY_VALUE,
            after: currentTypes.join(', ') || EMPTY_VALUE,
        });
    }

    return changes;
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
 * Rassemble les 4 types d'événements récents (nouveau panneau, nouvelle
 * photo ajoutée à un panneau existant, modification d'un panneau, nouveau
 * contributeur) en une seule liste chronologique, pour le flux RSS.
 */
export async function getRecentActivity(): Promise<FeedItem[]> {
    return withConnection(async (conn) => {
        const panneauRows: PanneauRow[] = await conn.query(`
            SELECT p.id, first.comment, first.createdAt, u.username, img.id AS imageId, img.fileNameSmall
            FROM panneaux p
            JOIN panneau_revisions first ON first.id = p.first_revision_id
            LEFT JOIN users u ON u.id = first.editor_id
            LEFT JOIN images img ON img.id = (SELECT MIN(id) FROM images WHERE panneau_id = p.id)
            ORDER BY first.createdAt DESC
            LIMIT ?
        `, [FEED_ITEM_LIMIT]);

        // Seules les photos ajoutées APRÈS la création du panneau comptent :
        // la toute première photo d'un panneau (id minimum pour ce
        // panneau_id) est déjà couverte par l'événement "nouveau panneau"
        // ci-dessus, elle ne doit pas apparaître une deuxième fois.
        const photoRows: PhotoRow[] = await conn.query(`
            SELECT i.id, i.panneau_id, i.createdAt, i.fileNameSmall, u.username, cur.comment
            FROM images i
            LEFT JOIN users u ON i.author_id = u.id
            JOIN panneaux p ON p.id = i.panneau_id
            JOIN panneau_revisions cur ON cur.id = p.current_revision_id
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

        // Les révisions de création (changedFields NULL) sont exclues : elles
        // font déjà l'objet de l'événement "nouveau panneau" ci-dessus.
        const revisionRows: RevisionRow[] = await conn.query(`
            SELECT r.id, r.panneau_id, r.lat, r.lng, r.comment, r.changedFields, r.restoredFrom, r.createdAt,
                   u.username, img.id AS imageId, img.fileNameSmall
            FROM panneau_revisions r
            LEFT JOIN users u ON u.id = r.editor_id
            LEFT JOIN images img ON img.id = (SELECT MIN(id) FROM images WHERE panneau_id = r.panneau_id)
            WHERE r.changedFields IS NOT NULL
            ORDER BY r.createdAt DESC
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

        // Pour détailler chaque modification il faut la révision qui précède.
        // Deux requêtes plates puis fusion en JS, comme listPanneaux : plus
        // lisible qu'une fenêtre SQL, et sans sous-requête corrélée nichée.
        const panelIds = [...new Set(revisionRows.map((row) => Number(row.panneau_id)))];
        const previousByRevision = new Map<number, RevisionState>();
        const typeNamesByRevision = new Map<number, string[]>();

        if (panelIds.length > 0) {
            const panelPlaceholders = panelIds.map(() => '?').join(',');
            const stateRows: RevisionState[] = await conn.query(`
                SELECT id, panneau_id, lat, lng, comment
                FROM panneau_revisions
                WHERE panneau_id IN (${panelPlaceholders})
                ORDER BY panneau_id, id
            `, panelIds);

            const statesByPanel = new Map<number, RevisionState[]>();
            stateRows.forEach((row) => {
                const panelId = Number(row.panneau_id);
                const states = statesByPanel.get(panelId) ?? [];
                states.push({ ...row, id: Number(row.id), lat: Number(row.lat), lng: Number(row.lng) });
                statesByPanel.set(panelId, states);
            });

            revisionRows.forEach((row) => {
                const states = statesByPanel.get(Number(row.panneau_id)) ?? [];
                const index = states.findIndex((state) => state.id === Number(row.id));
                if (index > 0) {
                    previousByRevision.set(Number(row.id), states[index - 1]);
                }
            });

            // Noms des types (pas les ids : « Commune » plutôt que « 2 ») pour
            // la révision affichée et celle qui la précède.
            const revisionIds = [
                ...revisionRows.map((row) => Number(row.id)),
                ...[...previousByRevision.values()].map((state) => state.id),
            ];
            const revisionPlaceholders = revisionIds.map(() => '?').join(',');
            const typeRows: Array<{ revision_id: number; name: string }> = await conn.query(`
                SELECT rt.revision_id, t.name
                FROM panneau_revision_types rt
                JOIN panel_types t ON t.id = rt.type_id
                WHERE rt.revision_id IN (${revisionPlaceholders})
                ORDER BY t.name
            `, revisionIds);

            typeRows.forEach((row) => {
                const revisionId = Number(row.revision_id);
                const names = typeNamesByRevision.get(revisionId) ?? [];
                names.push(row.name);
                typeNamesByRevision.set(revisionId, names);
            });
        }

        const revisionItems = await Promise.all(revisionRows.map(async (row): Promise<FeedItem> => {
            const author = row.username || 'Anonyme';
            const revisionId = Number(row.id);
            const previous = previousByRevision.get(revisionId);

            const changes = previous
                ? diffRevisions(
                    previous,
                    { id: revisionId, panneau_id: Number(row.panneau_id), lat: Number(row.lat), lng: Number(row.lng), comment: row.comment },
                    typeNamesByRevision.get(previous.id) ?? [],
                    typeNamesByRevision.get(revisionId) ?? []
                )
                : [];

            // Les libellés du titre viennent du diff réel ; changedFields ne
            // sert de repli que si la révision précédente est introuvable.
            const fields = changes.length > 0
                ? changes.map((change) => change.label.toLowerCase()).join(', ')
                : row.changedFields.split(',').map((field) => FIELD_LABELS[field] ?? field).join(', ');

            return {
                guid: `revision-${revisionId}`,
                // Une restauration est une action d'admin : elle se distingue
                // d'une modification ordinaire dans le flux.
                title: row.restoredFrom
                    ? `Version restaurée par ${author} (${fields})`
                    : `Panneau modifié par ${author} (${fields})`,
                link: `${PUBLIC_URL}/?panneauId=${row.panneau_id}`,
                // Le détail avant/après remplace le commentaire brut : c'est
                // ce qui rend la modification lisible dans un lecteur de flux.
                changes: changes.length > 0 ? changes : undefined,
                pubDate: row.createdAt,
                image: await resolveImageEnclosure(row.imageId, row.fileNameSmall),
            };
        }));

        const items = [...panneauItems, ...photoItems, ...revisionItems, ...userItems];
        items.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
        return items.slice(0, FEED_ITEM_LIMIT);
    });
}
