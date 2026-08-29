import { useDebounce } from "@/hooks/useDebounce";
import { ENDPOINTS } from "@/constants/api";
import { apiFetch } from "@/lib/api";
import { geocodeResultSchema, parseApiSuccess } from "@/lib/apiValidation";
import { useQuery } from "@tanstack/react-query";

import type { GeocodeResult, Suggestion } from "@/types";

function mapToSuggestion(r: GeocodeResult): Suggestion {
  return {
    label: [r.adresse, r.ville, r.pays].filter(Boolean).join(", "),
    lat: r.lat,
    lon: r.lng,
  };
}

export function useGeoSearch(q: string) {
  const debouncedQ = useDebounce(q, 400);

  return useQuery<Suggestion[]>({
    queryKey: ["geo-search", debouncedQ],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ q: debouncedQ.trim().slice(0, 200) });
      const payload = await apiFetch<unknown>(
        `${ENDPOINTS.geoGeocode}?${params.toString()}`,
        { skipAuth: true, signal },
      );
      const response = parseApiSuccess<GeocodeResult>(
        payload,
        geocodeResultSchema,
        "geo/geocode",
      );
      return [mapToSuggestion(response.data)];
    },
    enabled: debouncedQ.trim().length > 2,
  });
}
