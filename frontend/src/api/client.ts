import type { Panneau, PanelType } from '@shared/types';
import { get, post, postJson } from './apiClient.ts';

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

// Demande la protection d'un pseudo : envoie un email de vérification.
export const requestPseudoVerification = async (username: string, email: string): Promise<void> => {
    await postJson<{ success: boolean }>('/api/auth/request-verification', { username, email });
};

// Indique si cet appareil est vérifié, et pour quel pseudo (null sinon).
export const fetchVerifiedIdentity = async (): Promise<{ username: string | null }> => {
    return get<{ username: string | null }>('/api/auth/me');
};

// Déconnecte l'appareil courant (invalide le token, efface le cookie).
export const logoutDevice = async (): Promise<void> => {
    await post<{ success: boolean }>('/api/auth/logout');
};

// Renomme le pseudo protégé de l'appareil courant.
export const renamePseudo = async (username: string): Promise<{ username: string }> => {
    return postJson<{ username: string }>('/api/auth/rename', { username });
};
