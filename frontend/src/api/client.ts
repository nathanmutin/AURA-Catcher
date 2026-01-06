export interface Panneau {
    id: number;
    lat: number;
    lng: number;
    imageUrl: string;
    comment?: string;
    author?: string;
    createdAt: string;
}


const BASE_URL = import.meta.env.VITE_API_URL || '';

export const fetchPanneaux = async (): Promise<Panneau[]> => {
    const response = await fetch(`${BASE_URL}/api/panneaux`);
    if (!response.ok) {
        throw new Error('Failed to fetch panneaux');
    }
    return response.json();
};

export const createPanneau = async (formData: FormData): Promise<Panneau> => {
    const response = await fetch(`${BASE_URL}/api/panneaux`, {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) {
        throw new Error('Failed to create panneau');
    }
    return response.json();
};
