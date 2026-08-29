import { ENDPOINTS } from "@/constants/api";
import { apiFetch } from "@/lib/api";
import {
  categorieSchema,
  parseApiSuccess,
  restaurantSchema,
} from "@/lib/apiValidation";
import { useQuery } from "@tanstack/react-query";

import type { Categorie, Restaurant } from "@/types";

interface RestaurantCoordinates {
  latitude: number;
  longitude: number;
}

export async function fetchRestaurant(
  slug: string,
  coordinates?: RestaurantCoordinates,
  signal?: AbortSignal,
): Promise<Restaurant> {
  const params = coordinates
    ? new URLSearchParams({
        lat: String(coordinates.latitude),
        lng: String(coordinates.longitude),
      })
    : null;
  const query = params ? `?${params.toString()}` : "";
  const payload = await apiFetch<unknown>(
    `${ENDPOINTS.restaurantDetail(slug)}${query}`,
    { skipAuth: true, signal },
  );
  const result = parseApiSuccess<Restaurant>(
    payload,
    restaurantSchema,
    "restaurants/detail",
  );
  return result.data;
}

/**
 * Récupère le menu d'un restaurant (catégories et plats).
 * La réponse API est {success: true, data: Categorie[]}
 * On retourne directement Categorie[] sans reconstruction.
 */
export function useMenuRestaurant(slug: string | null) {
  return useQuery({
    queryKey: ["menu-restaurant", slug],
    queryFn: async ({ signal }) => {
      const payload = await apiFetch<unknown>(
        ENDPOINTS.restaurantMenu(slug!),
        { skipAuth: true, signal },
      );
      const result = parseApiSuccess<Categorie[]>(
        payload,
        categorieSchema.array(),
        "restaurants/menu",
      );
      return result.data;
    },
    enabled: !!slug,
  });
}

/**
 * Récupère les détails complets d'un restaurant (données statiques, horaires, etc.)
 * Utilisé pour le deep linking et pour obtenir les données restaurant pas incluses dans /menu.
 * La réponse API est {success: true, data: Restaurant}
 */
export function useRestaurant(
  slug: string | null,
  coordinates?: RestaurantCoordinates,
) {
  return useQuery({
    queryKey: [
      "restaurant",
      slug,
      coordinates?.latitude,
      coordinates?.longitude,
    ],
    queryFn: ({ signal }) => fetchRestaurant(slug!, coordinates, signal),
    enabled: !!slug,
  });
}
