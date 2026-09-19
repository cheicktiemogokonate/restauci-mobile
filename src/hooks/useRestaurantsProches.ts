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
import type { Restaurant } from "@/types";
import { useQuery } from "@tanstack/react-query";

export function useRestaurantsProches(
  location: RestaurantDiscoveryLocation | null,
  cuisine?: string | null,
) {
  return useQuery<Restaurant[]>({
    queryKey: [
      "restaurants-proches",
      location?.latitude,
      location?.longitude,
      location?.accuracyMeters,
      location?.capturedAt,
      cuisine,
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
              cuisine,
              page: 1,
              limit: 100,
            }),
          ),
        },
      );
      const response = parseApiSuccess<{ items: Restaurant[] }>(
        payload,
        restaurantSearchDataSchema,
        "restaurants/proches",
      );
      return response.data.items;
    },
    enabled: Boolean(location),
  });
}
