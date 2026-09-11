// Distance en mètres entre deux points (formule de Haversine).
// Sert uniquement à formuler un déplacement de façon lisible dans le flux RSS
// ("déplacé de 320 km") : il n'y a aucune limite de distance à l'édition.
export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // rayon de la Terre en mètres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// "320 km" / "250 m" selon l'ordre de grandeur.
export function formatDistance(meters: number): string {
    return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}
