import type { Panneau } from '../../../backend/src/types';

/**
 * Calculate distance between two geographic coordinates using Haversine formula
 * @param lat1 Latitude of first point
 * @param lng1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lng2 Longitude of second point
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find nearby panels within a given radius
 * @param userLocation Current user location with lat/lng
 * @param allPanneaux All available panels
 * @param radiusMeters Search radius in meters
 * @returns Array of nearby panels with distance calculated, sorted by distance ascending
 */
export function getNearbyPanels(
  userLocation: { lat: number; lng: number },
  allPanneaux: Panneau[],
  radiusMeters: number = 150
): Array<Panneau & { distance: number }> {
  return allPanneaux
    .map((panneau) => ({
      ...panneau,
      distance: calculateDistance(
        userLocation.lat,
        userLocation.lng,
        panneau.lat,
        panneau.lng
      ),
    }))
    .filter((panneau) => panneau.distance <= radiusMeters)
    .sort((a, b) => a.distance - b.distance);
}
