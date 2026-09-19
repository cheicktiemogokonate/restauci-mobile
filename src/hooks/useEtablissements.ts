import { ENDPOINTS } from "@/constants/api";
import { apiFetch } from "@/lib/api";
import {
  etablissementSearchDataSchema,
  parseApiSuccess,
} from "@/lib/apiValidation";
import type {
  DiscoveryLocation,
  Etablissement,
  TypeEtablissement,
} from "@/types/etablissement";
import { useQuery } from "@tanstack/react-query";

export type MoodType =
  | "calme_discret"
  | "entre_amis"
  | "belle_vue"
  | "coup_de_coeur";

export interface EtablissementsFilter {
  type?: "tous" | TypeEtablissement;
  search?: string | null;
  radiusKm?: number;
}

export function useEtablissements(
  location: DiscoveryLocation | null,
  filter?: EtablissementsFilter,
) {
  const typeFilter = filter?.type ?? "tous";
  const searchFilter = filter?.search?.trim() || undefined;
  const radiusKm = filter?.radiusKm ?? 50;

  return useQuery<Etablissement[]>({
    queryKey: [
      "etablissements",
      location?.latitude,
      location?.longitude,
      location?.accuracyMeters,
      typeFilter,
      searchFilter,
      radiusKm,
    ],
    queryFn: async ({ signal }) => {
      const payload = await apiFetch<unknown>(
        ENDPOINTS.publicEtablissementsSearch,
        {
          method: "POST",
          skipAuth: true,
          signal,
          body: JSON.stringify({
            currentLocation: {
              lat: location!.latitude,
              lng: location!.longitude,
              accuracyMeters: location!.accuracyMeters ?? 15,
              capturedAt: location!.capturedAt,
            },
            type: typeFilter,
            search: searchFilter,
            radiusKm,
            page: 1,
            limit: 50,
          }),
        },
      );

      const response = parseApiSuccess<{ items: Etablissement[] }>(
        payload,
        etablissementSearchDataSchema,
        "etablissements/search",
      );
      return response.data.items;
    },
    enabled: Boolean(location),
  });
}

export interface MoodDiscoveryFilter {
  query?: string | null;
  mood?: MoodType | null;
  type?: "tous" | TypeEtablissement;
}

export function useMoodDiscovery(
  location: DiscoveryLocation | null,
  filter?: MoodDiscoveryFilter,
  enabled: boolean = true,
) {
  const query = filter?.query?.trim() || undefined;
  const mood = filter?.mood || undefined;
  const typeFilter = filter?.type ?? "tous";

  return useQuery<Etablissement[]>({
    queryKey: [
      "discovery-mood",
      location?.latitude,
      location?.longitude,
      query,
      mood,
      typeFilter,
    ],
    queryFn: async ({ signal }) => {
      const payload = await apiFetch<unknown>(
        ENDPOINTS.publicDiscoveryMood,
        {
          method: "POST",
          skipAuth: true,
          signal,
          body: JSON.stringify({
            currentLocation: {
              lat: location!.latitude,
              lng: location!.longitude,
              accuracyMeters: location!.accuracyMeters ?? 15,
              capturedAt: location!.capturedAt,
            },
            query,
            mood,
            type: typeFilter,
            page: 1,
            limit: 20,
          }),
        },
      );

      const response = parseApiSuccess<{ items: Etablissement[] }>(
        payload,
        etablissementSearchDataSchema,
        "discovery/mood",
      );
      return response.data.items;
    },
    enabled: Boolean(location) && enabled,
  });
}
