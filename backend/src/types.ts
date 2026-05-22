export interface PanelType {
    id: number;
    name: string;
    points: number;
}

export interface Panneau {
    id: number;
    lat: number;
    lng: number;
    imageIds: number[];
    comment?: string;
    author?: string;
    typeId?: number;
    createdAt: string; // ISO date string
}

