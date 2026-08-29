import * as ExpoLocation from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";

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
  recentrer: () => Promise<Coords | null>;
}

export const DEFAULT_COORDS: Coords = {
  latitude: 7.6906,
  longitude: -5.0305, // Centre de Bouaké, ville de lancement.
};

const LOCATION_TIMEOUT_MS = 10_000;

async function withLocationTimeout<T>(promise: Promise<T>): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error("La localisation prend trop de temps.")),
      LOCATION_TIMEOUT_MS,
    );
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export function usePosition(): UsePositionReturn {
  const [coords, setCoords] = useState<Coords>(DEFAULT_COORDS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const requestIdRef = useRef(0);

  const requestPermission = useCallback(async () => {
    const { status: existingStatus } =
      await ExpoLocation.getForegroundPermissionsAsync();
    if (existingStatus !== "granted") {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      return status;
    }
    return existingStatus;
  }, []);

  const fetchPosition = useCallback(async (): Promise<Coords | null> => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const providerStatus = await withLocationTimeout(
        ExpoLocation.getProviderStatusAsync(),
      );

      if (!providerStatus.locationServicesEnabled) {
        throw new Error(
          "Activez la localisation de votre appareil pour voir les établissements autour de vous.",
        );
      }

      const permissionResult = await requestPermission();

      if (permissionResult !== "granted") {
        throw new Error(
          "Autorisez ToutCi à accéder à votre position dans les réglages de l’appareil.",
        );
      }

      let location: ExpoLocation.LocationObject | null = null;

      try {
        location = await withLocationTimeout(
          ExpoLocation.getCurrentPositionAsync({
            accuracy: ExpoLocation.Accuracy.Balanced,
          }),
        );
      } catch {
        // Une position récente en cache garde l'app utilisable sur réseau/GPS lent.
        location = await ExpoLocation.getLastKnownPositionAsync({
          maxAge: 5 * 60_000,
          requiredAccuracy: 5_000,
        });
      }

      if (!location?.coords) {
        throw new Error(
          "Votre position est indisponible pour le moment. Réessayez dans quelques instants.",
        );
      }

      const nextCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      if (requestId === requestIdRef.current) {
        setCoords(nextCoords);
      }
      return nextCoords;
    } catch (cause) {
      if (requestId === requestIdRef.current) {
        setError(
          cause instanceof Error
            ? cause
            : new Error("La localisation est indisponible."),
        );
      }
      return null;
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [requestPermission]);

  // Initial fetch on mount
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      void fetchPosition();
    });
    return () => {
      cancelAnimationFrame(frame);
      // Ignore la résolution tardive d'une permission/position après démontage.
      requestIdRef.current += 1;
    };
  }, [fetchPosition]);

  return {
    coords,
    loading,
    error,
    recentrer: fetchPosition,
  };
}
