const MAX_COMMENT_LENGTH = 500;
const MAX_AUTHOR_LENGTH = 100;

export function parseCoordinate(value: unknown, min: number, max: number): number | null {
    const num = typeof value === 'string' || typeof value === 'number' ? Number(value) : NaN;
    if (!Number.isFinite(num) || num < min || num > max) {
        return null;
    }
    return num;
}

export function parseLatLng(lat: unknown, lng: unknown): { lat: number; lng: number } | null {
    const parsedLat = parseCoordinate(lat, -90, 90);
    const parsedLng = parseCoordinate(lng, -180, 180);
    if (parsedLat === null || parsedLng === null) {
        return null;
    }
    return { lat: parsedLat, lng: parsedLng };
}

export function sanitizeComment(comment: unknown): string | null {
    if (typeof comment !== 'string') return null;
    const trimmed = comment.trim().slice(0, MAX_COMMENT_LENGTH);
    return trimmed.length > 0 ? trimmed : null;
}

export function sanitizeAuthor(author: unknown): string | undefined {
    if (typeof author !== 'string') return undefined;
    const trimmed = author.trim().slice(0, MAX_AUTHOR_LENGTH);
    return trimmed.length > 0 ? trimmed : undefined;
}

export function parseTypeIds(typeId: unknown): number[] | null {
    const raw = Array.isArray(typeId) ? typeId : [typeId ?? 1];
    const parsed: number[] = [];
    for (const value of raw) {
        const num = Number(value);
        if (!Number.isInteger(num) || num <= 0) {
            return null;
        }
        parsed.push(num);
    }
    return parsed.length > 0 ? parsed : null;
}
