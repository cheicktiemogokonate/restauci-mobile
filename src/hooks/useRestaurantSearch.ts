import { useDebounce } from "@/hooks/useDebounce";
import { ENDPOINTS } from "@/constants/api";
import {
  buildRestaurantSearchRequest,
  type RestaurantDiscoveryLocation,
} from "@/domain/restaurantSearch";
import { apiFetch } from "@/lib/api";
import {
  parseApiSuccess,
  restaurantSearchDataSchema,
} from "@/lib/apiValidation";
import { useQuery } from "@tanstack/react-query";

import type { Restaurant, Suggestion } from "@/types";

export interface RestaurantSuggestion extends Suggestion {
  id: string;
  type: "restaurant";
}

export function useRestaurantSearch(
  q: string,
  cuisine: string | null | undefined,
  location: RestaurantDiscoveryLocation | null,
) {
  const debouncedQ = useDebounce(q, 400);

  return useQuery<RestaurantSuggestion[]>({
    queryKey: [
      "restaurant-search",
      debouncedQ,
      cuisine,
      location?.latitude,
      location?.longitude,
      location?.accuracyMeters,
      location?.capturedAt,
    ],
    queryFn: async ({ signal }) => {
      const payload = await apiFetch<unknown>(
        ENDPOINTS.publicRestaurantsSearch,
        {
          method: "POST",
          skipAuth: true,
          signal,
          body: JSON.stringify(
            buildRestaurantSearchRequest({
              location: location!,
              query: debouncedQ,
              cuisine,
              page: 1,
              limit: 20,
            }),
          ),
        },
      );
      const response = parseApiSuccess<{ items: Restaurant[] }>(
        payload,
        restaurantSearchDataSchema,
        "restaurants/recherche",
      );

      return response.data.items.map((r) => ({
        id: r.id,
        label: r.nom,
        lat: r.latitude,
        lon: r.longitude,
        type: "restaurant",
      }));
    },
    enabled: debouncedQ.trim().length > 1 && Boolean(location),
  });
}
