import { useDebounce } from "@/hooks/useDebounce";
import { ENDPOINTS } from "@/constants/api";
import { apiFetch } from "@/lib/api";
import { parseApiSuccess, restaurantSchema } from "@/lib/apiValidation";
import { useQuery } from "@tanstack/react-query";

import type { Restaurant, Suggestion } from "@/types";

export interface RestaurantSuggestion extends Suggestion {
  id: string;
  type: "restaurant";
}

export function useRestaurantSearch(q: string, cuisine?: string | null) {
  const debouncedQ = useDebounce(q, 400);

  return useQuery<RestaurantSuggestion[]>({
    queryKey: ["restaurant-search", debouncedQ, cuisine],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({
        search: debouncedQ.trim().slice(0, 100),
        page: "1",
        limit: "20",
      });
      if (cuisine) {
        params.set("cuisine", cuisine.slice(0, 100));
      }

      const payload = await apiFetch<unknown>(
        `${ENDPOINTS.restaurants}?${params.toString()}`,
        { skipAuth: true, signal },
      );
      const response = parseApiSuccess<Restaurant[]>(
        payload,
        restaurantSchema.array(),
        "restaurants/recherche",
      );

      return response.data.map((r) => ({
        id: r.id,
        label: r.nom,
        lat: r.latitude,
        lon: r.longitude,
        type: "restaurant",
      }));
    },
    enabled: debouncedQ.trim().length > 1,
  });
}
