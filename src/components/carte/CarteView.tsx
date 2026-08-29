import { DEFAULT_COORDS, DEFAULT_ZOOM } from "@/hooks/usePosition";
import type { Restaurant } from "@/types";
import {
  Camera,
  GeoJSONSource,
  Images,
  Layer,
  Map,
  type CameraRef,
  type CircleLayerSpecification,
  type PressEvent,
  type PressEventWithFeatures,
  type SymbolLayerSpecification,
  type ViewStateChangeEvent,
} from "@maplibre/maplibre-react-native";
import React, {
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import {
  Linking,
  NativeSyntheticEvent,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
const restaurantSymbolLayout: NonNullable<
  SymbolLayerSpecification["layout"]
> = {
  "icon-image": "restaurant-marker",
  "icon-size": 0.13,
  "icon-allow-overlap": true,
  "icon-ignore-placement": true,
};

const restaurantSymbolPaint: NonNullable<
  SymbolLayerSpecification["paint"]
> = {
  "icon-color": "#457b3b",
};

const userOuterCirclePaint: NonNullable<
  CircleLayerSpecification["paint"]
> = {
  "circle-radius": 14,
  "circle-color": "rgba(56, 107, 42, 0.25)",
};

const userInnerCirclePaint: NonNullable<
  CircleLayerSpecification["paint"]
> = {
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
  itineraireGeoJSON?: GeoJSON.FeatureCollection<GeoJSON.LineString> | null;
  selectedRestaurantId?: string | null;
  controlsBottom?: number;
  onRestaurantSelect?: (restaurant: Restaurant) => void;
  onMapPress?: () => void;
  onViewportChange?: (center: [number, number]) => void;
}

export interface CarteViewRef {
  flyTo: (lngLat: [number, number], zoom?: number) => void;
  fitBounds: (bounds: [number, number, number, number], padding?: number) => void;
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
      properties: {
        id: r.id,
        slug: r.slug,
        isAvailable: r.enLigne && r.accepteCommandes,
      },
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
  (
    {
      restaurants,
      userLocation,
      itineraireGeoJSON,
      selectedRestaurantId = null,
      controlsBottom = 120,
      onRestaurantSelect,
      onMapPress,
      onViewportChange,
    },
    ref,
  ) => {
    const cameraRef = useRef<CameraRef>(null);

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
      fitBounds: (bounds: [number, number, number, number], padding = 40) => {
        cameraRef.current?.fitBounds(bounds, {
          padding: { top: padding, right: padding, bottom: padding, left: padding },
          duration: 1500
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
      (e: NativeSyntheticEvent<PressEventWithFeatures>) => {
        e.stopPropagation();
        const feature = e.nativeEvent.features[0];
        const id = feature?.properties?.id;
        const restaurant = restaurants.find((item) => item.id === id);
        if (restaurant) {
          onRestaurantSelect?.(restaurant);
        }
      },
      [onRestaurantSelect, restaurants],
    );

    const handleMapPress = useCallback(
      (
        e: NativeSyntheticEvent<PressEvent | PressEventWithFeatures>,
      ) => {
        if ("features" in e.nativeEvent && e.nativeEvent.features.length) return;
        onMapPress?.();
      },
      [onMapPress],
    );

    // Suivi du zoom via ref uniquement (pas de setState)
    const handleRegionChange = useCallback(
      (e: NativeSyntheticEvent<ViewStateChangeEvent>) => {
        const zoom = e.nativeEvent.zoom;
        if (typeof zoom === "number") {
          currentZoomRef.current = zoom;
        }
        if (e.nativeEvent.userInteraction) {
          onViewportChange?.(e.nativeEvent.center);
        }
      },
      [onViewportChange],
    );

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
          onPress={handleMapPress}
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
              layout={{
                ...restaurantSymbolLayout,
                "icon-size": [
                  "case",
                  ["==", ["get", "id"], selectedRestaurantId ?? ""],
                  0.18,
                  0.13,
                ],
              }}
              paint={{
                ...restaurantSymbolPaint,
                "icon-opacity": [
                  "case",
                  ["==", ["get", "isAvailable"], true],
                  1,
                  0.45,
                ],
              }}
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

          {itineraireGeoJSON && (
            <GeoJSONSource id="itineraire-source" data={itineraireGeoJSON}>
              <Layer
                id="itineraire-layer"
                type="line"
                paint={{
                  "line-color": "#14532d",
                  "line-width": 4,
                  "line-opacity": 0.8,
                }}
              />
            </GeoJSONSource>
          )}
        </Map>

        {/* Contrôles de zoom */}
        <View
          style={{ position: "absolute", right: 16, bottom: controlsBottom }}
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
            accessibilityRole="button"
            accessibilityLabel="Zoomer"
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
            accessibilityRole="button"
            accessibilityLabel="Dézoomer"
          >
            <Text className="text-2xl font-light text-ink-700">−</Text>
          </TouchableOpacity>
        </View>

        <View
          style={{ position: "absolute", right: 16, bottom: 90 }}
          className="flex-row items-center rounded-md bg-white/90 px-2 py-1"
        >
          <Pressable
            onPress={() => Linking.openURL("https://openmaptiles.org/")}
            accessibilityRole="link"
            accessibilityLabel="Crédits cartographiques OpenMapTiles"
            hitSlop={6}
          >
            <Text className="text-[10px] text-ink-600">© OpenMapTiles</Text>
          </Pressable>
          <Text className="text-[10px] text-ink-400"> · </Text>
          <Pressable
            onPress={() =>
              Linking.openURL("https://www.openstreetmap.org/copyright")
            }
            accessibilityRole="link"
            accessibilityLabel="Crédits et licence OpenStreetMap"
            hitSlop={6}
          >
            <Text className="text-[10px] text-ink-600">© OpenStreetMap</Text>
          </Pressable>
        </View>
      </View>
    );
  },
);

CarteView.displayName = "CarteView";

export default CarteView;
