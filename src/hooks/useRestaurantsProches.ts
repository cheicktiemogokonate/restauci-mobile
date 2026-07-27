import { ENDPOINTS } from "@/constants/api";
import { apiFetch } from "@/lib/api";
import type { Restaurant } from "@/types";
import { useQuery } from "@tanstack/react-query";

export function useRestaurantsProches(
  lat: number | undefined,
  lon: number | undefined,
  rayon: number = 5,
  cuisine?: string | null,
) {
  return useQuery<Restaurant[]>({
    queryKey: ["restaurants-proches", lat, lon, rayon, cuisine],
    queryFn: async () => {
      let url = `${ENDPOINTS.restaurantsProches}?lat=${lat}&lng=${lon}&rayon=${rayon}`;
      if (cuisine) {
        url += `&cuisine=${encodeURIComponent(cuisine)}`;
      }

      const response = await apiFetch<any>(url, { skipAuth: true });

      // L'API structure: {success: true, data: Restaurant | Restaurant[] | any, meta: {...}}
      let restaurants: Restaurant[] = [];

      if (response?.data) {
        if (Array.isArray(response.data)) {
          restaurants = response.data;
        } else if (typeof response.data === "object") {
          // Si c'est un objet unique, le mettre dans un array
          restaurants = [response.data];
        }
      }

      return restaurants;
    },
    enabled: typeof lat === "number" && typeof lon === "number",
  });
}
