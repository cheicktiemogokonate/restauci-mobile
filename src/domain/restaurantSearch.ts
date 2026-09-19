import type {
  DiscoveryLocation,
  RestaurantDiscoveryLocation,
} from "@/types/etablissement";

export type {
  DiscoveryLocation,
  RestaurantDiscoveryLocation,
};

export interface RestaurantSearchRequest {
  currentLocation: {
    lat: number;
    lng: number;
    accuracyMeters: number;
    capturedAt: string;
  };
  query?: string;
  cuisine?: string;
  page: number;
  limit: number;
}

export function buildRestaurantSearchRequest({
  location,
  query,
  cuisine,
  page = 1,
  limit = 20,
}: {
  location: RestaurantDiscoveryLocation;
  query?: string | null;
  cuisine?: string | null;
  page?: number;
  limit?: number;
}): RestaurantSearchRequest {
  const normalizedQuery = query?.trim().slice(0, 100);
  const normalizedCuisine = cuisine?.trim().slice(0, 100);

  return {
    currentLocation: {
      lat: location.latitude,
      lng: location.longitude,
      accuracyMeters: location.accuracyMeters,
      capturedAt: location.capturedAt,
    },
    ...(normalizedQuery ? { query: normalizedQuery } : {}),
    ...(normalizedCuisine ? { cuisine: normalizedCuisine } : {}),
    page: Math.max(1, Math.trunc(page)),
    limit: Math.min(100, Math.max(1, Math.trunc(limit))),
  };
}
