import { useQuery } from '@tanstack/react-query';
import { ENDPOINTS } from '@/constants/api';
import { apiFetch } from '@/lib/api';
import type { Restaurant } from '@/types';

export function useRestaurantsProches(
  lat: number | undefined,
  lon: number | undefined,
  rayon: number = 5
) {
  return useQuery<Restaurant[]>({
    queryKey: ['restaurants-proches', lat, lon, rayon],
    queryFn: async () => {
      const response = await apiFetch<{ success: boolean; data: Restaurant[] }>(
        `${ENDPOINTS.restaurantsProches}?lat=${lat}&lon=${lon}&rayon=${rayon}`
      );
      return response.data;
    },
    enabled: typeof lat === 'number' && typeof lon === 'number',
  });
}