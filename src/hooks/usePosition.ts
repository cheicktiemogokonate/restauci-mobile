import * as ExpoLocation from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

export const DEFAULT_ZOOM = 13;
export const RESTAURANT_DETAIL_ZOOM = 15;

// ============================================
// Hook géolocalisation — expo-location
// ============================================
export interface Coords {
  latitude: number;
  longitude: number;
}

interface UsePositionReturn {
  coords: Coords;
  loading: boolean;
  error: Error | null;
  recentrer: () => void;
}

export const DEFAULT_COORDS: Coords = {
  latitude: 5.3599,
  longitude: -4.0083, // Centre d'Abidjan
};

export function usePosition(): UsePositionReturn {
  const [coords, setCoords] = useState<Coords>(DEFAULT_COORDS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const requestPermission = useCallback(async () => {
    const { status: existingStatus } = await ExpoLocation.getForegroundPermissionsAsync();
    if (existingStatus !== 'granted') {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      return status;
    }
    return existingStatus;
  }, []);

  const fetchPosition = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const serviceEnabled = await ExpoLocation.getProviderStatusAsync().then(
        (status) => status.locationServicesEnabled
      );

      if (!serviceEnabled) {
        setLoading(false);
        // Fallback silently to Abidjan
        return;
      }

      const permissionResult = await requestPermission();

      if (permissionResult !== 'granted') {
        setLoading(false);
        // Fallback silently to Abidjan
        return;
      }

      let location: ExpoLocation.LocationObject | null = null;

      try {
        location = await ExpoLocation.getCurrentPositionAsync({
          accuracy: ExpoLocation.Accuracy.Balanced,
        });
      } catch {
        // Fallback: last known position (useful on emulators)
        location = await ExpoLocation.getLastKnownPositionAsync();
      }

      if (location?.coords) {
        setCoords({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } else {
        // Fallback to Abidjan
      }
    } catch (err) {
      // Fallback silently to Abidjan on error
    } finally {
      setLoading(false);
    }
  }, [requestPermission]);

  // Initial fetch on mount
  useEffect(() => {
    fetchPosition();
  }, [fetchPosition]);

  return {
    coords,
    loading,
    error,
    recentrer: fetchPosition,
  };
}
