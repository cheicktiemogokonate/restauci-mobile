import { DEFAULT_COORDS, DEFAULT_ZOOM } from "@/hooks/usePosition";
import type { Restaurant } from "@/types";
import {
  Camera,
  GeoJSONSource,
  Images,
  Layer,
  Map,
  type CameraRef
} from "@maplibre/maplibre-react-native";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { NativeSyntheticEvent, Text, TouchableOpacity, View } from "react-native";

// ============================================
// Constantes stables — hors composant pour ne jamais être recréées
// ============================================
const INITIAL_VIEW_STATE = {
  zoom: DEFAULT_ZOOM,
  center: [DEFAULT_COORDS.longitude, DEFAULT_COORDS.latitude] as [
    number,
    number,
  ],
};

const MARKER_IMAGES = {
  "restaurant-marker": require("../../../assets/images/restaurant-marker.png"),
};

// ============================================
// Styles de couches (objets stables, hors rendu)
// ============================================
const restaurantSymbolLayout: Record<string, any> = {
  "icon-image": "restaurant-marker",
  "icon-size": 0.13,
  "icon-allow-overlap": true,
  "icon-ignore-placement": true,
};

const restaurantSymbolPaint: Record<string, any> = {
  "icon-color": "#457b3b",
};

const userOuterCirclePaint: Record<string, any> = {
  "circle-radius": 14,
  "circle-color": "rgba(56, 107, 42, 0.25)",
};

const userInnerCirclePaint: Record<string, any> = {
  "circle-radius": 7,
  "circle-color": "#386b2a",
  "circle-stroke-color": "#ffffff",
  "circle-stroke-width": 2,
};

// ============================================
// Types
// ============================================
interface CarteViewProps {
  restaurants: Restaurant[];
  userLocation: { latitude: number; longitude: number } | null;
}

export interface CarteViewRef {
  flyTo: (lngLat: [number, number], zoom?: number) => void;
}

// ============================================
// Helpers GeoJSON — fonctions pures hors composant
// ============================================
function toRestaurantsGeoJSON(restaurants: Restaurant[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: restaurants.map((r) => ({
      type: "Feature",
      id: r.id,
      geometry: {
        type: "Point",
        coordinates: [r.longitude, r.latitude],
      },
      properties: { id: r.id, slug: r.slug },
    })),
  };
}

function toUserLocationGeoJSON(
  userLocation: { latitude: number; longitude: number } | null,
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: userLocation
      ? [
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [userLocation.longitude, userLocation.latitude],
          },
          properties: {},
        },
      ]
      : [],
  };
}

// ============================================
// Composant principal
// ============================================
export const CarteView = React.forwardRef<CarteViewRef, CarteViewProps>(
  ({ restaurants, userLocation }, ref) => {
    const cameraRef = useRef<CameraRef>(null);
    const router = useRouter();

    // useRef pour le zoom courant : évite tout setState pendant les gestes
    // de déplacement de la carte → aucun re-render, 100% fluide.
    const currentZoomRef = useRef(DEFAULT_ZOOM);

    useImperativeHandle(ref, () => ({
      flyTo: (lngLat: [number, number], zoom = DEFAULT_ZOOM) => {
        cameraRef.current?.flyTo({
          center: lngLat,
          zoom,
          duration: 1500,
        });
      },
    }));

    // GeoJSON mémorisé — recalculé uniquement si les données changent
    const restaurantsGeoJSON = useMemo(
      () => toRestaurantsGeoJSON(restaurants),
      [restaurants],
    );

    const userLocationGeoJSON = useMemo(
      () => toUserLocationGeoJSON(userLocation),
      [userLocation],
    );

    // Gestion des taps sans re-render du composant
    const handleRestaurantPress = useCallback(
      (e: NativeSyntheticEvent<any>) => {
        const feature = (e.nativeEvent as any)?.features?.[0];
        const slug = feature?.properties?.slug;
        if (slug) {
          router.push(`/restaurant/${slug}`);
        }
      },
      [router],
    );

    // Suivi du zoom via ref uniquement (pas de setState)
    const handleRegionChange = useCallback((e: any) => {
      const zoom = e?.properties?.zoomLevel ?? e?.nativeEvent?.zoom;
      if (typeof zoom === "number") {
        currentZoomRef.current = zoom;
      }
    }, []);

    return (
      <View
        style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
      >
        <Map
          style={{ flex: 1 }}
          mapStyle="https://tiles.openfreemap.org/styles/liberty"
          attribution={false}
          compass={false}
          scaleBar={false}
          logo={false}
          onRegionDidChange={handleRegionChange}
        >
          <Camera ref={cameraRef} initialViewState={INITIAL_VIEW_STATE} />

          {/* Enregistrement de l'image du marqueur */}
          <Images images={MARKER_IMAGES} />

          <GeoJSONSource
            id="restaurants-source"
            data={restaurantsGeoJSON}
            onPress={handleRestaurantPress}
          >
            <Layer
              id="restaurant-icons"
              type="symbol"
              layout={restaurantSymbolLayout}
              paint={restaurantSymbolPaint}
            />
          </GeoJSONSource>

          <GeoJSONSource id="user-location-source" data={userLocationGeoJSON}>
            <Layer
              id="user-location-outer"
              type="circle"
              paint={userOuterCirclePaint}
            />
            <Layer
              id="user-location-inner"
              type="circle"
              paint={userInnerCirclePaint}
            />
          </GeoJSONSource>
        </Map>

        {/* Contrôles de zoom */}
        <View
          style={{ position: "absolute", right: 16, bottom: 120 }}
          className="overflow-hidden rounded-2xl bg-white shadow-md"
        >
          <TouchableOpacity
            className="h-11 w-11 items-center justify-center"
            onPress={() =>
              cameraRef.current?.zoomTo(currentZoomRef.current + 1, {
                duration: 300,
              })
            }
            activeOpacity={0.7}
          >
            <Text className="text-2xl font-light text-ink-700">+</Text>
          </TouchableOpacity>
          <View className="h-px w-8 self-center bg-ink-200" />
          <TouchableOpacity
            className="h-11 w-11 items-center justify-center"
            onPress={() =>
              cameraRef.current?.zoomTo(currentZoomRef.current - 1, {
                duration: 300,
              })
            }
            activeOpacity={0.7}
          >
            <Text className="text-2xl font-light text-ink-700">−</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  },
);

CarteView.displayName = "CarteView";

export default CarteView;
