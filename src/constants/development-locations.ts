import type { RestaurantDiscoveryLocation } from "@/domain/restaurantSearch";

export type DevelopmentLocationId = "abidjan" | "bouake";

export interface DevelopmentLocation {
  id: DevelopmentLocationId;
  label: string;
  latitude: number;
  longitude: number;
}

export const DEVELOPMENT_LOCATIONS: readonly DevelopmentLocation[] = [
  {
    id: "abidjan",
    label: "Abidjan",
    latitude: 5.3599517,
    longitude: -4.0082563,
  },
  {
    id: "bouake",
    label: "Bouaké",
    latitude: 7.6906,
    longitude: -5.0305,
  },
] as const;

export function getDevelopmentLocation(
  id: DevelopmentLocationId,
): DevelopmentLocation {
  return DEVELOPMENT_LOCATIONS.find((location) => location.id === id)!;
}

export function createDevelopmentCoords(
  id: DevelopmentLocationId,
): RestaurantDiscoveryLocation {
  const location = getDevelopmentLocation(id);

  return {
    latitude: location.latitude,
    longitude: location.longitude,
    accuracyMeters: 0,
    capturedAt: new Date().toISOString(),
  };
}

export function findClosestDevelopmentLocation(
  coords: Pick<RestaurantDiscoveryLocation, "latitude" | "longitude">,
): DevelopmentLocation {
  return DEVELOPMENT_LOCATIONS.reduce((closest, candidate) => {
    const closestDistance =
      (closest.latitude - coords.latitude) ** 2 +
      (closest.longitude - coords.longitude) ** 2;
    const candidateDistance =
      (candidate.latitude - coords.latitude) ** 2 +
      (candidate.longitude - coords.longitude) ** 2;

    return candidateDistance < closestDistance ? candidate : closest;
  });
}
