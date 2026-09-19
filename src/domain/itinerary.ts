export type ItineraryCoordinate = [number, number];

export function normalizeItineraryCoordinates(
  geometry: number[][] | undefined,
): ItineraryCoordinate[] {
  if (!geometry) return [];

  const result: ItineraryCoordinate[] = [];
  for (const pair of geometry) {
    if (
      Array.isArray(pair) &&
      pair.length >= 2 &&
      Number.isFinite(pair[0]) &&
      Number.isFinite(pair[1])
    ) {
      result.push([pair[0], pair[1]]);
    }
  }
  return result;
}

/**
 * Calcule l'itinéraire routier réel entre une origine et une destination via OSRM.
 * Retourne la liste des coordonnées géographiques [lng, lat] suivant les voies de circulation.
 */
export async function calculerItineraireRoutier(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  signal?: AbortSignal,
): Promise<ItineraryCoordinate[] | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;
    const response = await fetch(url, {
      signal,
      headers: { "User-Agent": "Toutci/1.0" },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      code: string;
      routes?: {
        geometry?: {
          coordinates?: [number, number][];
        };
      }[];
    };
    if (data.code !== "Ok" || !data.routes?.[0]?.geometry?.coordinates) {
      return null;
    }
    const coords = data.routes[0].geometry.coordinates;
    const normalized = normalizeItineraryCoordinates(coords);
    return normalized.length >= 2 ? normalized : null;
  } catch {
    return null;
  }
}


export function createItineraryGeoJSON(
  coordinates: ItineraryCoordinate[],
): GeoJSON.FeatureCollection<GeoJSON.LineString> {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates,
        },
      },
    ],
  };
}

export function getItineraryBounds(
  coordinates: ItineraryCoordinate[],
): [number, number, number, number] {
  const longitudes = coordinates.map(([longitude]) => longitude);
  const latitudes = coordinates.map(([, latitude]) => latitude);

  return [
    Math.min(...longitudes),
    Math.min(...latitudes),
    Math.max(...longitudes),
    Math.max(...latitudes),
  ];
}

export function getPartialItineraryGeoJSON(
  itinerary: GeoJSON.FeatureCollection<GeoJSON.LineString>,
  progress: number,
): GeoJSON.FeatureCollection<GeoJSON.LineString> {
  const coordinates = itinerary.features[0]?.geometry.coordinates ?? [];
  if (coordinates.length < 2 || progress >= 1) return itinerary;

  const boundedProgress = Math.max(0, progress);
  const cursor = boundedProgress * (coordinates.length - 1);
  const completedIndex = Math.floor(cursor);
  const interpolation = cursor - completedIndex;
  const visibleCoordinates = coordinates.slice(
    0,
    completedIndex + 1,
  ) as ItineraryCoordinate[];
  const current = coordinates[completedIndex] as ItineraryCoordinate;
  const next = (coordinates[completedIndex + 1] ?? current) as ItineraryCoordinate;

  visibleCoordinates.push([
    current[0] + (next[0] - current[0]) * interpolation,
    current[1] + (next[1] - current[1]) * interpolation,
  ]);

  if (visibleCoordinates.length === 1) {
    visibleCoordinates.push([...visibleCoordinates[0]]);
  }

  return createItineraryGeoJSON(visibleCoordinates);
}
