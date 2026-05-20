const BASE_URL = import.meta.env.VITE_API_URL || '';

async function fetchJson<T>(
    url: string,
    options?: RequestInit
): Promise<T> {
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
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
