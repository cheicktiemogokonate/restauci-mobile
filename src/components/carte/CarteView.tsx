import { DEFAULT_COORDS, DEFAULT_ZOOM } from "@/hooks/usePosition";
import type { Restaurant } from "@/types";
import {
  Camera,
  Map,
  Marker,
  type CameraRef,
} from "@maplibre/maplibre-react-native";
import { Link } from "expo-router";
import React, { useImperativeHandle, useRef, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// ============================================
// Composant CarteView — MapLibre + OpenFreeMap
// ============================================
interface CarteViewProps {
  restaurants: Restaurant[];
  userLocation: { latitude: number; longitude: number } | null;
}

export interface CarteViewRef {
  flyTo: (lngLat: [number, number], zoom?: number) => void;
}

export const CarteView = React.forwardRef<CarteViewRef, CarteViewProps>(
  ({ restaurants, userLocation }, ref) => {
    const cameraRef = useRef<CameraRef>(null);
    const [currentZoom, setCurrentZoom] = useState(DEFAULT_ZOOM);

    useImperativeHandle(ref, () => ({
      flyTo: (lngLat: [number, number], zoom = DEFAULT_ZOOM) => {
        cameraRef.current?.flyTo({
          center: lngLat,
          zoom,
          duration: 1500,
        });
      },
    }));

    return (
      <View style={styles.mapContainer}>
        <Map
          style={styles.map}
          mapStyle="https://tiles.openfreemap.org/styles/liberty"
          attribution={false}
          compass={false}
          scaleBar={false}
          logo={false}
          onRegionDidChange={(e) => {
            if (e.nativeEvent && typeof e.nativeEvent.zoom === "number") {
              setCurrentZoom(e.nativeEvent.zoom);
            }
          }}
        >
          <Camera
            ref={cameraRef}
            initialViewState={{
              zoom: DEFAULT_ZOOM,
              center: [DEFAULT_COORDS.longitude, DEFAULT_COORDS.latitude],
            }}
          />

          {userLocation && (
            <Marker lngLat={[userLocation.longitude, userLocation.latitude]}>
              <View style={styles.markerUserOuter}>
                <View style={styles.markerUserInner} />
              </View>
            </Marker>
          )}

          {restaurants.map((resto) => (
            <Marker
              key={resto.id}
              id={resto.id}
              lngLat={[resto.longitude, resto.latitude]}
            >
              <Link
                href={{
                  pathname: "/restaurant/[slug]",
                  params: { slug: resto.slug },
                }}
                asChild
              >
                <TouchableOpacity
                  style={{
                    width: 52,
                    height: 52,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Image
                    source={require("../../../assets/images/restaurant-marker.png")}
                    style={{
                      width: 52,
                      height: 52,
                      resizeMode: "contain",
                      tintColor: "#457b3b",
                    }}
                  />
                </TouchableOpacity>
              </Link>
            </Marker>
          ))}
        </Map>

        {/* Zoom controls */}
        <View style={styles.zoomControls}>
          <TouchableOpacity
            style={styles.zoomButton}
            onPress={() =>
              cameraRef.current?.zoomTo(currentZoom + 1, { duration: 300 })
            }
            activeOpacity={0.7}
          >
            <Text style={styles.zoomText}>+</Text>
          </TouchableOpacity>
          <View style={styles.zoomDivider} />
          <TouchableOpacity
            style={styles.zoomButton}
            onPress={() =>
              cameraRef.current?.zoomTo(currentZoom - 1, { duration: 300 })
            }
            activeOpacity={0.7}
          >
            <Text style={styles.zoomText}>−</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  mapContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  map: {
    flex: 1,
  },
  markerUserOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(59, 130, 246, 0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  markerUserInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#3b82f6",
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  customPinContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: 42,
    height: 42,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  customPinInnerIcon: {
    position: "absolute",
    top: 9,
  },
  zoomControls: {
    position: "absolute",
    right: 16,
    bottom: 120, // Positioned above the recenter button in index.tsx
    backgroundColor: "#ffffff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    overflow: "hidden",
  },
  zoomButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  zoomDivider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    width: 32,
    alignSelf: "center",
  },
  zoomText: {
    fontSize: 24,
    color: "#374151",
    fontWeight: "400",
  },
});

export default CarteView;
