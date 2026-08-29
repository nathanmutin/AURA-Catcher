const BASE_URL = import.meta.env.VITE_API_URL || '';

// Distingue une vraie erreur serveur (avec message exploitable renvoyé par
// l'API) d'un échec réseau générique, pour afficher un message clair.
export class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

async function fetchJson<T>(
    url: string,
    options?: RequestInit
): Promise<T> {
    let response: Response;
    try {
        response = await fetch(url, options);
    } catch {
        throw new ApiError(0, 'Impossible de contacter le serveur. Vérifiez votre connexion.');
    }

    if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new ApiError(response.status, body?.error || `Erreur serveur (${response.status})`);
    }

    return response.json();
}

export async function get<T>(path: string): Promise<T> {
    return fetchJson<T>(`${BASE_URL}${path}`);
}

export async function post<T>(
    path: string,
    body?: BodyInit
): Promise<T> {
    return fetchJson<T>(`${BASE_URL}${path}`, {
        method: 'POST',
        body,
    });
}
