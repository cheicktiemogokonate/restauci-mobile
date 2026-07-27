import { useDebounce } from "@/hooks/useDebounce";
import { apiFetch } from "@/lib/api";
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
    queryFn: async () => {
      // Assuming ENDPOINTS.restaurants is the generic listing endpoint
      // that we can filter
      let url = `/api/v1/client/restaurants?search=${encodeURIComponent(debouncedQ)}`;
      if (cuisine) {
        url += `&cuisine=${encodeURIComponent(cuisine)}`;
      }

      const response = await apiFetch<any>(url, { skipAuth: true });
      
      let restaurants: Restaurant[] = [];
      if (response?.data) {
        if (Array.isArray(response.data)) {
          restaurants = response.data;
        } else if (typeof response.data === "object") {
          restaurants = [response.data];
        }
      }

      return restaurants.map((r) => ({
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
