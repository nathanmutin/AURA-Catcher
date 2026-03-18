export interface PanelType {
    id: number;
    name: string;
    points: number;
}

export interface Panneau {
    id: number;
    lat: number;
    lng: number;
    imageUrl: string; // The URL to the image (usually the small version)
    comment?: string;
    author?: string;
    typeId?: number;
    createdAt: string; // ISO date string
}
