import { ITINERARY_VISUAL_CONFIG } from "@/constants/itinerary-style";
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
  type LineLayerSpecification,
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
import { LocateFixed, Minus, Plus } from "lucide-react-native";
import {
  Linking,
  NativeSyntheticEvent,
  Pressable,
  Text,
  View,
} from "react-native";

// ============================================
// Constantes stables — hors composant pour ne jamais être recréées
// ============================================
import type { Etablissement } from "@/types/etablissement";

import { getVerticalDefinition, VERTICALS } from "@/constants/verticals";

const INITIAL_VIEW_STATE = {
  zoom: DEFAULT_ZOOM,
  center: [DEFAULT_COORDS.longitude, DEFAULT_COORDS.latitude] as [
    number,
    number,
  ],
};

const MARKER_IMAGES: Record<string, number> = Object.fromEntries(
  Object.values(VERTICALS).map((v) => [v.markerIcon, v.markerAsset]),
);

// ============================================
// Styles de couches (objets stables, hors rendu)
// ============================================
const etablissementSymbolLayout: NonNullable<
  SymbolLayerSpecification["layout"]
> = {
  "icon-image": ["get", "markerIcon"],
  "icon-size": 0.115,
  "icon-allow-overlap": true,
  "icon-ignore-placement": true,
};

const userOuterCirclePaint: NonNullable<
  CircleLayerSpecification["paint"]
> = {
  "circle-radius": 14,
  "circle-color": "rgba(17, 17, 17, 0.16)",
};

const userInnerCirclePaint: NonNullable<
  CircleLayerSpecification["paint"]
> = {
  "circle-radius": 7,
  "circle-color": "#111111",
  "circle-stroke-color": "#ffffff",
  "circle-stroke-width": 2,
};

const itineraryDashPaint =
  ITINERARY_VISUAL_CONFIG.strokeStyle === "dashed"
    ? { "line-dasharray": ITINERARY_VISUAL_CONFIG.dashArray }
    : {};

const itineraryCasingPaint: NonNullable<
  LineLayerSpecification["paint"]
> = {
  "line-color": "#ffffff",
  "line-width": ITINERARY_VISUAL_CONFIG.casingWidth,
  "line-opacity": 0.9,
  ...itineraryDashPaint,
};

const itineraryLinePaint: NonNullable<LineLayerSpecification["paint"]> = {
  "line-color": ITINERARY_VISUAL_CONFIG.color,
  "line-width": ITINERARY_VISUAL_CONFIG.width,
  "line-opacity": ITINERARY_VISUAL_CONFIG.opacity,
  ...itineraryDashPaint,
};

interface CarteViewProps {
  restaurants?: Restaurant[];
  etablissements?: Etablissement[];
  userLocation: { latitude: number; longitude: number } | null;
  itineraireGeoJSON?: GeoJSON.FeatureCollection<GeoJSON.LineString> | null;
  selectedRestaurantId?: string | null;
  selectedEtablissementId?: string | null;
  controlsBottom?: number;
  onRecenter?: () => void;
  onRestaurantSelect?: (restaurant: Restaurant) => void;
  onEtablissementSelect?: (etablissement: Etablissement) => void;
  onMapPress?: () => void;
  onViewportChange?: (center: [number, number]) => void;
}

export interface CarteViewRef {
  flyTo: (lngLat: [number, number], zoom?: number) => void;
  fitBounds: (
    bounds: [number, number, number, number],
    padding?: number,
    duration?: number,
  ) => void;
}

// ============================================
// Helpers GeoJSON — fonctions pures hors composant
// ============================================
function toMarkersGeoJSON(
  items: (Etablissement | Restaurant)[],
  selectedId: string | null,
): GeoJSON.FeatureCollection {
  const selectedItem = items.find((item) => item.id === selectedId);

  return {
    type: "FeatureCollection",
    features: items.map((r) => {
      const type = "type" in r ? r.type : "restaurant";
      const markerIcon = getVerticalDefinition(type).markerIcon;
      const isAvailable =
        "accepteCommandes" in r
          ? Boolean(r.enLigne && r.accepteCommandes)
          : Boolean(r.enLigne);

      return {
        type: "Feature",
        id: r.id,
        geometry: {
          type: "Point",
          coordinates: [r.longitude, r.latitude],
        },
        properties: {
          id: r.id,
          slug: r.slug,
          type,
          markerIcon,
          isAvailable,
          isHiddenBySelection:
            Boolean(selectedItem) &&
            r.id !== selectedId &&
            r.latitude === selectedItem?.latitude &&
            r.longitude === selectedItem?.longitude,
        },
      };
    }),
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
      etablissements,
      userLocation,
      itineraireGeoJSON,
      selectedRestaurantId = null,
      selectedEtablissementId = null,
      controlsBottom = 120,
      onRecenter,
      onRestaurantSelect,
      onEtablissementSelect,
      onMapPress,
      onViewportChange,
    },
    ref,
  ) => {
    const cameraRef = useRef<CameraRef>(null);
    const currentZoomRef = useRef(DEFAULT_ZOOM);

    useImperativeHandle(ref, () => ({
      flyTo: (lngLat: [number, number], zoom = DEFAULT_ZOOM) => {
        currentZoomRef.current = zoom;
        cameraRef.current?.flyTo({
          center: lngLat,
          zoom,
          duration: 1500,
        });
      },
      fitBounds: (
        bounds: [number, number, number, number],
        padding = 40,
        duration = 850,
      ) => {
        cameraRef.current?.fitBounds(bounds, {
          padding: { top: padding, right: padding, bottom: padding, left: padding },
          duration,
        });
      },
    }));


    const effectiveSelectedId =
      selectedEtablissementId ?? selectedRestaurantId ?? null;

    // GeoJSON mémorisé — recalculé uniquement si les données changent
    const markersGeoJSON = useMemo(() => {
      const items = etablissements ?? restaurants ?? [];
      return toMarkersGeoJSON(items, effectiveSelectedId);
    }, [effectiveSelectedId, etablissements, restaurants]);

    const userLocationGeoJSON = useMemo(
      () => toUserLocationGeoJSON(userLocation),
      [userLocation],
    );

    // Gestion des taps sans re-render du composant
    const handleMarkerPress = useCallback(
      (e: NativeSyntheticEvent<PressEventWithFeatures>) => {
        e.stopPropagation();
        const feature = e.nativeEvent.features[0];
        const id = feature?.properties?.id;
        if (!id) return;

        if (etablissements && onEtablissementSelect) {
          const etablissement = etablissements.find((item) => item.id === id);
          if (etablissement) {
            onEtablissementSelect(etablissement);
            return;
          }
        }

        if (restaurants && onRestaurantSelect) {
          const restaurant = restaurants.find((item) => item.id === id);
          if (restaurant) {
            onRestaurantSelect(restaurant);
          }
        }
      },
      [etablissements, onEtablissementSelect, onRestaurantSelect, restaurants],
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

    const handleRegionChange = useCallback(
      (e: NativeSyntheticEvent<ViewStateChangeEvent>) => {
        if (typeof e.nativeEvent.zoom === "number") {
          currentZoomRef.current = e.nativeEvent.zoom;
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
          touchZoom
          doubleTapZoom
          doubleTapHoldZoom
          onPress={handleMapPress}
          onRegionDidChange={handleRegionChange}
        >
          <Camera ref={cameraRef} initialViewState={INITIAL_VIEW_STATE} />

          {/* Enregistrement de l'image du marqueur */}
          <Images images={MARKER_IMAGES} />

          <GeoJSONSource
            id="etablissements-source"
            data={markersGeoJSON}
            onPress={handleMarkerPress}
          >
            <Layer
              id="etablissement-icons"
              type="symbol"
              layout={{
                ...etablissementSymbolLayout,
                "icon-size": [
                  "case",
                  ["==", ["get", "id"], effectiveSelectedId ?? ""],
                  0.16,
                  0.115,
                ],
              }}
              paint={{
                "icon-opacity": [
                  "case",
                  ["==", ["get", "isHiddenBySelection"], true],
                  0,
                  1,
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
                id="itineraire-contour"
                type="line"
                layout={{ "line-cap": "round", "line-join": "round" }}
                paint={itineraryCasingPaint}
              />
              <Layer
                id="itineraire-layer"
                type="line"
                layout={{ "line-cap": "round", "line-join": "round" }}
                paint={itineraryLinePaint}
              />
            </GeoJSONSource>
          )}
        </Map>

        <View
          className="overflow-hidden rounded-2xl bg-white"
          style={{
            position: "absolute",
            right: 16,
            bottom: controlsBottom + 34,
            boxShadow: "0 5px 16px rgba(17, 24, 39, 0.16)",
          }}
        >
          <Pressable
            onPress={() => {
              const zoom = Math.min(20, currentZoomRef.current + 1);
              currentZoomRef.current = zoom;
              cameraRef.current?.zoomTo(zoom, { duration: 260 });
            }}
            accessibilityRole="button"
            accessibilityLabel="Zoomer"
            className="h-10 w-10 items-center justify-center"
          >
            <Plus size={19} color="#111827" strokeWidth={2} />
          </Pressable>
          <View className="h-px w-6 self-center bg-ink-200" />
          <Pressable
            onPress={() => {
              const zoom = Math.max(2, currentZoomRef.current - 1);
              currentZoomRef.current = zoom;
              cameraRef.current?.zoomTo(zoom, { duration: 260 });
            }}
            accessibilityRole="button"
            accessibilityLabel="Dézoomer"
            className="h-10 w-10 items-center justify-center"
          >
            <Minus size={19} color="#111827" strokeWidth={2} />
          </Pressable>
          {onRecenter && (
            <>
              <View className="h-px w-6 self-center bg-ink-200" />
              <Pressable
                onPress={onRecenter}
                accessibilityRole="button"
                accessibilityLabel="Recentrer sur ma position"
                className="h-10 w-10 items-center justify-center"
              >
                <LocateFixed size={18} color="#111827" strokeWidth={2} />
              </Pressable>
            </>
          )}
        </View>

        <View
          style={{
            position: "absolute",
            right: 12,
            bottom: controlsBottom + 8,
          }}
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
