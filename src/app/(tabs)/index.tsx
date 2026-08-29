import { CarteView, type CarteViewRef } from "@/components/carte/CarteView";
import { RestaurantMapCard } from "@/components/carte/restaurant-map-card";
import { SearchBar } from "@/components/carte/SearchBar";
import { useCuisinesDisponibles } from "@/hooks/useCuisinesDisponibles";
import { fetchRestaurant } from "@/hooks/useMenuRestaurant";
import { usePosition } from "@/hooks/usePosition";
import { useRestaurantsProches } from "@/hooks/useRestaurantsProches";
import type { Restaurant } from "@/types";
import { useRouter } from "expo-router";
import { GlobeOff, Layers3, List, LocateFixed, Map, SearchX } from "lucide-react-native";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

// ============================================
// Écran Carte — assemblage principal
// ============================================
export default function CarteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    coords,
    loading: positionLoading,
    error: positionError,
    recentrer,
  } = usePosition();

  const carteRef = useRef<CarteViewRef>(null);
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [modeAffichage, setModeAffichage] = useState<"carte" | "liste">("carte");
  const [restaurantSelectionne, setRestaurantSelectionne] =
    useState<Restaurant | null>(null);
  const [itineraireGeoJSON, setItineraireGeoJSON] =
    useState<GeoJSON.FeatureCollection<GeoJSON.LineString> | null>(null);
  const [centreRecherche, setCentreRecherche] = useState<
    [number, number] | null
  >(null);
  const [centreEnAttente, setCentreEnAttente] = useState<
    [number, number] | null
  >(null);
  const restaurantRechercheId = useRef<string | null>(null);
  const positionDisponible = !positionLoading && !positionError;
  const latitudeRecherche =
    centreRecherche?.[1] ?? (positionDisponible ? coords.latitude : undefined);
  const longitudeRecherche =
    centreRecherche?.[0] ?? (positionDisponible ? coords.longitude : undefined);

  const restaurantsQuery = useRestaurantsProches(
    latitudeRecherche,
    longitudeRecherche,
    10, // rayon (augmenté un peu pour avoir plus de choix)
    selectedCuisine
  );
  const {
    data: restaurants = [],
    isLoading: restaurantsLoading,
    error: restaurantsError,
    refetch: refetchRestaurants,
  } = restaurantsQuery;

  const { cuisines } = useCuisinesDisponibles(
    latitudeRecherche,
    longitudeRecherche,
    10,
  );

  const handleSuggestionSelect = useCallback(
    (lat: number, lon: number, restaurantId?: string) => {
      const center: [number, number] = [lon, lat];
      carteRef.current?.flyTo(center, 15);
      setCentreRecherche(center);
      setCentreEnAttente(null);
      setSelectedCuisine(null);
      setModeAffichage("carte");
      setItineraireGeoJSON(null);
      restaurantRechercheId.current = restaurantId ?? null;

      if (restaurantId) {
        const restaurant = restaurants.find((item) => item.id === restaurantId);
        if (restaurant) {
          setRestaurantSelectionne(restaurant);
          restaurantRechercheId.current = null;
        }
      } else {
        setRestaurantSelectionne(null);
      }
    },
    [restaurants],
  );

  const handleFilterChange = useCallback((cuisine: string | null) => {
    setSelectedCuisine(cuisine);
  }, []);

  const handleRecentrer = useCallback(async () => {
    const nextCoords = await recentrer();
    if (nextCoords) {
      carteRef.current?.flyTo(
        [nextCoords.longitude, nextCoords.latitude],
        14,
      );
      setCentreRecherche([nextCoords.longitude, nextCoords.latitude]);
      setCentreEnAttente(null);
    }
  }, [recentrer]);

  // La carte est déjà montée pendant la recherche GPS : la déplacer lorsque
  // la première vraie position arrive au lieu de rester sur le fallback.
  useEffect(() => {
    if (positionLoading || positionError || centreRecherche) return;
    carteRef.current?.flyTo([coords.longitude, coords.latitude], 14);
  }, [centreRecherche, coords, positionError, positionLoading]);

  useEffect(() => {
    const pendingId = restaurantRechercheId.current;
    if (!pendingId) return;

    const restaurant = restaurants.find((item) => item.id === pendingId);
    if (restaurant) {
      setRestaurantSelectionne(restaurant);
      restaurantRechercheId.current = null;
    }
  }, [restaurants]);

  const handleRestaurantSelect = useCallback((restaurant: Restaurant) => {
    setRestaurantSelectionne(restaurant);
    setItineraireGeoJSON(null);
    setModeAffichage("carte");
    carteRef.current?.flyTo([restaurant.longitude, restaurant.latitude], 15);
  }, []);

  const handleVoirRestaurant = useCallback(
    (restaurant: Restaurant) => {
      router.push(`/restaurant/${restaurant.slug}`);
    },
    [router],
  );

  const handleRechercherZone = useCallback(() => {
    if (!centreEnAttente) return;
    setCentreRecherche(centreEnAttente);
    setCentreEnAttente(null);
    setRestaurantSelectionne(null);
    setItineraireGeoJSON(null);
  }, [centreEnAttente]);

  const handleItineraire = useCallback(
    async (restaurant: Restaurant) => {
      if (!coords) return;
      try {
        const detail = await fetchRestaurant(restaurant.slug, coords);
        const coordinates = detail.geo?.itineraire?.geometrie?.filter(
          (pair): pair is [number, number] =>
            Array.isArray(pair) &&
            pair.length >= 2 &&
            pair.every((value) => typeof value === "number"),
        );
        if (coordinates && coordinates.length > 1) {
          setItineraireGeoJSON({
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
          });
          const minLat = Math.min(coords.latitude, restaurant.latitude);
          const maxLat = Math.max(coords.latitude, restaurant.latitude);
          const minLon = Math.min(coords.longitude, restaurant.longitude);
          const maxLon = Math.max(coords.longitude, restaurant.longitude);
          carteRef.current?.fitBounds([minLon, minLat, maxLon, maxLat], 60);
        } else {
          setItineraireGeoJSON(null);
        }
      } catch (e) {
        if (__DEV__) {
          console.warn(
            "[Carte] itinéraire indisponible",
            e instanceof Error ? e.message : "erreur inconnue",
          );
        }
      }
    },
    [coords],
  );

  const restaurantsTries = useMemo(
    () =>
      [...restaurants].sort(
        (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity),
      ),
    [restaurants],
  );

  const isLoading =
    positionLoading || (restaurantsLoading && !restaurants.length);

  // On distingue explicitement les deux cas : « la requête a échoué » n'est
  // pas « il n'y a rien ici », et n'appelle pas la même action.
  const showErrorState =
    !positionLoading && !restaurantsLoading && !!restaurantsError;

  const showEmptyState =
    !positionLoading &&
    !restaurantsLoading &&
    !restaurantsError &&
    !!coords &&
    restaurants.length === 0;

  if (positionError) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-8">
        <View className="mb-4">
          <LocateFixed size={48} color="black" />
        </View>
        <Text className="mb-2 text-xl font-bold text-ink-900">
          Localisation requise
        </Text>
        <Text className="mb-6 text-center text-sm leading-5 text-ink-600">
          {positionError.message}
        </Text>
        <TouchableOpacity
          className="min-h-[44px] justify-center rounded-xl bg-green-900 px-6 py-3"
          onPress={() => void handleRecentrer()}
        >
          <Text className="text-[15px] font-bold text-white">Réessayer</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Rendu unifié : CarteView reste TOUJOURS montée pour éviter
  // le démontage/remontage qui recharge la carte.
  return (
    <View className="flex-1">
      <CarteView
        ref={carteRef}
        restaurants={restaurants}
        userLocation={coords}
        itineraireGeoJSON={itineraireGeoJSON}
        selectedRestaurantId={restaurantSelectionne?.id}
        controlsBottom={restaurantSelectionne ? 300 : 150}
        onRestaurantSelect={handleRestaurantSelect}
        onMapPress={() => {
          setRestaurantSelectionne(null);
          setItineraireGeoJSON(null);
        }}
        onViewportChange={setCentreEnAttente}
      />

      <SearchBar
        onSelectSuggestion={handleSuggestionSelect}
        onFilterChange={handleFilterChange}
        cuisines={cuisines}
        selectedCuisine={selectedCuisine}
        topOffset={insets.top + 12}
      />

      {modeAffichage === "liste" && (
        <View className="absolute inset-0 bg-ink-50">
          <FlatList
            data={restaurantsTries}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <RestaurantMapCard
                restaurant={item}
                onPress={handleRestaurantSelect}
                compact
              />
            )}
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={{
              paddingTop: insets.top + 126,
              paddingHorizontal: 16,
              paddingBottom: insets.bottom + 116,
              gap: 12,
            }}
            ListHeaderComponent={
              <View className="mb-1 flex-row items-center justify-between">
                <View>
                  <Text className="text-2xl font-extrabold text-ink-900">
                    Autour de vous
                  </Text>
                  <Text className="mt-1 text-sm text-ink-500">
                    {restaurants.length} établissement
                    {restaurants.length > 1 ? "s" : ""}
                  </Text>
                </View>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {modeAffichage === "carte" && !showErrorState && !showEmptyState && (
        <TouchableOpacity
          className="absolute bottom-24 left-4 z-10 h-12 w-12 items-center justify-center rounded-full bg-white shadow-md"
          onPress={() => void handleRecentrer()}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Recentrer la carte sur ma position"
        >
          <LocateFixed size={22} color="black" />
        </TouchableOpacity>
      )}

      {centreEnAttente && modeAffichage === "carte" && (
        <Pressable
          onPress={handleRechercherZone}
          accessibilityRole="button"
          accessibilityLabel="Rechercher les établissements dans cette zone"
          className="absolute left-1/2 z-10 -translate-x-1/2 flex-row items-center gap-2 rounded-full bg-green-900 px-4 py-3"
          style={{ top: insets.top + (cuisines.length > 0 ? 112 : 72) }}
        >
          <Layers3 size={16} color="#FFFFFF" />
          <Text className="text-sm font-bold text-white">
            Rechercher dans cette zone
          </Text>
        </Pressable>
      )}

      {restaurants.length > 0 && (
        <Pressable
          onPress={() =>
            setModeAffichage((mode) =>
              mode === "carte" ? "liste" : "carte",
            )
          }
          accessibilityRole="button"
          accessibilityLabel={
            modeAffichage === "carte"
              ? "Afficher les établissements en liste"
              : "Revenir à la carte"
          }
          className="absolute left-1/2 z-20 -translate-x-1/2 flex-row items-center gap-2 rounded-full bg-white px-5 py-3"
          style={{
            bottom:
              modeAffichage === "carte" && restaurantSelectionne
                ? insets.bottom + 260
                : insets.bottom + 92,
            boxShadow: "0 4px 16px rgba(17, 24, 39, 0.18)",
          }}
        >
          {modeAffichage === "carte" ? (
            <List size={18} color="#14532d" />
          ) : (
            <Map size={18} color="#14532d" />
          )}
          <Text className="font-bold text-brand-800">
            {modeAffichage === "carte"
              ? `Liste (${restaurants.length})`
              : "Carte"}
          </Text>
        </Pressable>
      )}

      {restaurantSelectionne && modeAffichage === "carte" && (
        <View
          className="absolute left-4 right-4 z-10"
          style={{ bottom: insets.bottom + 92 }}
        >
          <RestaurantMapCard
            restaurant={restaurantSelectionne}
            onPress={handleVoirRestaurant}
            onClose={() => {
              setRestaurantSelectionne(null);
              setItineraireGeoJSON(null);
            }}
            onItineraire={handleItineraire}
          />
        </View>
      )}

      {showErrorState && (
        <View className="absolute bottom-20 left-4 right-4 items-center rounded-2xl bg-white p-6 shadow-sm">

          <GlobeOff size={48} color="#7f1d1d" className="mb-3" />
          <Text className="mb-2 text-[17px] font-bold text-ink-900">
            Chargement impossible
          </Text>
          <Text className="mb-4 text-center text-[13px] leading-[18px] text-ink-600">
            Nous n&apos;avons pas pu récupérer les établissements autour de
            vous. Vérifiez votre connexion.
          </Text>
          <TouchableOpacity
            className="min-h-[44px] justify-center rounded-[10px] bg-green-900 px-5 py-3"
            onPress={() => refetchRestaurants()}
            accessibilityRole="button"
            accessibilityLabel="Réessayer le chargement des établissements"
          >
            <Text className="text-sm font-bold text-white">Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}

      {showEmptyState && (
        <View className="absolute bottom-20 left-4 right-4 items-center rounded-2xl bg-white p-6 shadow-sm">
          <SearchX size={48} color="#7f1d1d" className="mb-3" />
          <Text className="mb-2 text-[17px] font-bold text-ink-900">
            Aucun établissement ici
          </Text>
          <Text className="mb-4 text-center text-[13px] leading-[18px] text-ink-600">
            Essayez de vous déplacer ou d&apos;agrandir le rayon de recherche
          </Text>
          <TouchableOpacity
            className="min-h-[44px] justify-center rounded-[10px] bg-green-900 px-5 py-3"
            onPress={() => void handleRecentrer()}
            accessibilityRole="button"
            accessibilityLabel="Recentrer la carte sur ma position"
          >
            <Text className="text-sm font-bold text-white">Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}

      {isLoading && (
        <View className="absolute inset-0 items-center justify-center bg-white/50">
          <ActivityIndicator size="large" color="#14532d" />
        </View>
      )}

      {/* Restaurant details opened as modal screen via router */}
    </View>
  );
}
