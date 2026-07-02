import { CarteView, type CarteViewRef } from "@/components/carte/CarteView";
import { SearchBar } from "@/components/carte/SearchBar";
import { usePosition } from "@/hooks/usePosition";
import { useRestaurantsProches } from "@/hooks/useRestaurantsProches";
import type { Restaurant } from "@/types";
import { useRouter } from "expo-router";
import { useCallback, useRef } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

// ============================================
// Écran Carte — assemblage principal
// ============================================
export default function CarteScreen() {
  const router = useRouter();
  const {
    coords,
    loading: positionLoading,
    error: positionError,
    recentrer,
  } = usePosition();
  // no local bottom-sheet state: use modal screen navigation instead
  const carteRef = useRef<CarteViewRef>(null);

  const { data: restaurants = [], isLoading: restaurantsLoading } =
    useRestaurantsProches(coords?.latitude, coords?.longitude);

  const handleSelectRestaurant = useCallback(
    (restaurant: Restaurant) => {
      router.push(`/restaurant/${restaurant.slug}`);
    },
    [router],
  );

  const handleVoirMenu = useCallback(
    (restaurantSlug: string) => {
      router.push(`/restaurant/${restaurantSlug}`);
    },
    [router],
  );

  const handleSuggestionSelect = useCallback((lat: number, lon: number) => {
    carteRef.current?.flyTo([lon, lat], 15);
  }, []);

  const handleRecentrer = useCallback(() => {
    recentrer();
    if (coords) {
      carteRef.current?.flyTo([coords.longitude, coords.latitude], 14);
    }
  }, [recentrer, coords]);

  const isLoading =
    positionLoading || (restaurantsLoading && !restaurants.length);

  const showEmptyState =
    !positionLoading &&
    !restaurantsLoading &&
    coords &&
    restaurants.length === 0;

  if (positionError) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorIcon}>📍</Text>
        <Text style={styles.errorTitle}>Localisation requise</Text>
        <Text style={styles.errorMessage}>{positionError.message}</Text>
        <TouchableOpacity style={styles.errorButton} onPress={recentrer}>
          <Text style={styles.errorButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (showEmptyState) {
    return (
      <SafeAreaView style={styles.flex}>
        <CarteView
          ref={carteRef}
          restaurants={restaurants}
          userLocation={coords}
        />
        <View style={styles.emptyOverlay}>
          <Text style={styles.emptyEmoji}>🍽</Text>
          <Text style={styles.emptyTitle}>Aucun restaurant ici</Text>
          <Text style={styles.emptyMessage}>
            Essayez de vous déplacer ou d'agrandir le rayon de recherche
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={handleRecentrer}
          >
            <Text style={styles.emptyButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.locationButton}
          onPress={handleRecentrer}
          activeOpacity={0.7}
        >
          <Text style={styles.locationIcon}>📍</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <View style={styles.flex}>
        <CarteView
          ref={carteRef}
          restaurants={restaurants}
          //   onSelectRestaurant={handleSelectRestaurant}
          userLocation={coords}
        />

        <SearchBar onSelectSuggestion={handleSuggestionSelect} />

        <TouchableOpacity
          style={styles.locationButton}
          onPress={handleRecentrer}
          activeOpacity={0.7}
        >
          <Text style={styles.locationIcon}>📍</Text>
        </TouchableOpacity>

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#22c55e" />
          </View>
        )}

        {/* Restaurant details opened as modal screen via router */}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 32,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  errorButton: {
    backgroundColor: "#22c55e",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  locationButton: {
    position: "absolute",
    bottom: 32,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 5,
  },
  locationIcon: {
    fontSize: 22,
  },
  emptyOverlay: {
    position: "absolute",
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  emptyMessage: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: "#22c55e",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  emptyButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
});
