import type { Panneau } from '@aura-catcher/shared/api/types';

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

export const fetchGlobalStats = async (): Promise<{ totalPanels: number; totalContributors: number }> => {
    const response = await fetch(`${BASE_URL}/api/stats/global`);
    if (!response.ok) {
        throw new Error('Failed to fetch global stats');
    }
    return response.json();
};

export const fetchLeaderboard = async (): Promise<Array<{ username: string; count: number }>> => {
    const response = await fetch(`${BASE_URL}/api/stats/leaderboard`);
    if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
    }
    return response.json();
};
