import { useDebounce } from "@/hooks/useDebounce";
import { apiFetch } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

interface GeocodeResult {
  adresse: string;
  lat: number;
  lng: number;
  ville?: string;
  pays?: string;
}

interface Suggestion {
  label: string;
  lat: number;
  lon: number;
}

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
    queryFn: async () => {
      const response = await apiFetch<{ success: boolean; data?: GeocodeResult }>(
        `/api/v1/client/geo/geocode?q=${encodeURIComponent(debouncedQ)}`,
      );
      if (!response || !response.data) return [];
      return [mapToSuggestion(response.data)];
    },
    enabled: debouncedQ.trim().length > 2,
  });
}
