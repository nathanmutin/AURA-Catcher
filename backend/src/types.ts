export interface PanelType {
    id: number;
    name: string;
    points: number;
}

export interface LeaderboardEntry {
    username: string;
    // Rang « sportif » : les ex æquo partagent le même rang et le suivant
    // saute d'autant (1, 2, 2, 4).
    rank: number;
    count: number;
    totalPanels: number;
}

export interface Panneau {
    id: number;
    lat: number;
    lng: number;
    imageIds: number[];
    comment?: string;
    author?: string;
    typeIds: number[];
    createdAt: string; // ISO date string
}

// Champs modifiables d'un panneau, tels qu'ils apparaissent dans l'historique.
export type EditableField = 'position' | 'comment' | 'types';

export interface PanneauRevision {
    id: number;
    author?: string;
    createdAt: string; // ISO date string
    // Vide = révision de création (le panneau n'existait pas avant).
    fields: EditableField[];
    // Renseigné quand cette révision est le résultat d'une restauration :
    // id de la révision qui a été remise en place.
    restoredFrom?: number;
}

