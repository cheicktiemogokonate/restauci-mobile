import type {
  DiscoveryLocation,
  TypeEtablissement,
} from "@/types/etablissement";

export type {
  DiscoveryLocation,
  EtablissementDiscoveryLocation,
  RestaurantDiscoveryLocation,
} from "@/types/etablissement";

export interface EtablissementSearchRequest {
  currentLocation: {
    lat: number;
    lng: number;
    accuracyMeters: number;
    capturedAt: string;
  };
  type?: "tous" | TypeEtablissement;
  search?: string;
  radiusKm?: number;
  page?: number;
  limit?: number;
}

export function buildEtablissementSearchRequest({
  location,
  type = "tous",
  search,
  radiusKm = 50,
  page = 1,
  limit = 50,
}: {
  location: DiscoveryLocation;
  type?: "tous" | TypeEtablissement;
  search?: string | null;
  radiusKm?: number;
  page?: number;
  limit?: number;
}): EtablissementSearchRequest {
  const normalizedSearch = search?.trim() || undefined;

  return {
    currentLocation: {
      lat: location.latitude,
      lng: location.longitude,
      accuracyMeters: location.accuracyMeters,
      capturedAt: location.capturedAt,
    },
    type,
    ...(normalizedSearch ? { search: normalizedSearch } : {}),
    radiusKm: Math.max(1, Math.min(200, Math.trunc(radiusKm))),
    page: Math.max(1, Math.trunc(page)),
    limit: Math.min(100, Math.max(1, Math.trunc(limit))),
  };
}
