import { ENDPOINTS } from "@/constants/api";
import { apiFetch } from "@/lib/api";
import { parseApiSuccess, restaurantSchema } from "@/lib/apiValidation";
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
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({
        lat: String(lat),
        lng: String(lon),
        rayon: String(Math.min(50, Math.max(0.5, rayon))),
        page: "1",
        limit: "100",
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
        "restaurants/proches",
      );
      return response.data;
    },
    enabled: typeof lat === "number" && typeof lon === "number",
  });
}
