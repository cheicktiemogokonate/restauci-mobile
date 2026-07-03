import { ENDPOINTS } from "@/constants/api";
import { apiFetch } from "@/lib/api";
import type { Categorie, Restaurant } from "@/types";
import { useQuery } from "@tanstack/react-query";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

/**
 * Récupère le menu d'un restaurant (catégories et plats).
 * La réponse API est {success: true, data: Categorie[]}
 * On retourne directement Categorie[] sans reconstruction.
 */
export function useMenuRestaurant(slug: string | null) {
  return useQuery({
    queryKey: ["menu-restaurant", slug],
    queryFn: async () => {
      const result = await apiFetch<ApiResponse<Categorie[]>>(
        ENDPOINTS.restaurantMenu(slug!),
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
export function useRestaurant(slug: string | null) {
  return useQuery({
    queryKey: ["restaurant", slug],
    queryFn: async () => {
      const result = await apiFetch<ApiResponse<Restaurant>>(
        ENDPOINTS.restaurantDetail(slug!),
      );
      return result.data;
    },
    enabled: !!slug,
  });
}
