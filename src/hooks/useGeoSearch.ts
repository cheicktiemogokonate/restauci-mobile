import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useState, useEffect } from 'react';

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
    label: [r.adresse, r.ville, r.pays].filter(Boolean).join(', '),
    lat: r.lat,
    lon: r.lng,
  };
}

export function useGeoSearch(q: string) {
  const [debouncedQ, setDebouncedQ] = useState(q);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q), 400);
    return () => clearTimeout(id);
  }, [q]);

  return useQuery<Suggestion[]>({
    queryKey: ['geo-search', debouncedQ],
    queryFn: async () => {
      const result = await apiFetch<GeocodeResult>(
        `/api/v1/client/geo/geocode?q=${encodeURIComponent(debouncedQ)}`
      );
      if (!result) return [];
      return [mapToSuggestion(result)];
    },
    enabled: debouncedQ.trim().length > 2,
  });
}