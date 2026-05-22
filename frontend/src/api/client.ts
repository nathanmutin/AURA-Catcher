import type { Panneau, PanelType } from '../../../backend/src/types.ts';
import { get, post } from './apiClient.ts';

const BASE_URL = import.meta.env.VITE_API_URL || '';

export const fetchPanneaux = async (): Promise<Panneau[]> => {
    return get<Panneau[]>('/api/panneaux');
};

export const photoUrl = (imageId: number, isSmall: boolean = true): string => {
    const params = new URLSearchParams({ size: isSmall ? 'small' : 'original' });

    return `${BASE_URL}/api/photo/${imageId}?${params.toString()}`;
};

export const createPanneau = async (formData: FormData): Promise<Panneau> => {
    return post<Panneau>('/api/panneaux', formData);
};

export const fetchGlobalStats = async (): Promise<{ totalPanels: number; totalContributors: number }> => {
    return get<{ totalPanels: number; totalContributors: number }>('/api/stats/global');
};

export const fetchLeaderboard = async (): Promise<Array<{ username: string; count: number; totalPanels: number }>> => {
    return get<Array<{ username: string; count: number; totalPanels: number }>>('/api/stats/leaderboard');
};

export const fetchTypes = async (): Promise<PanelType[]> => {
    return get<PanelType[]>('/api/types');
};

export const uploadPhotoToPanel = async (panneauId: number, formData: FormData): Promise<{ success: boolean; imageId: number; message: string }> => {
    return post<{ success: boolean; imageId: number; message: string }>(`/api/panneaux/${panneauId}/photos`, formData);
};
