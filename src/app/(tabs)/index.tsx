import { CarteView, type CarteViewRef } from "@/components/carte/CarteView";
import { SearchBar } from "@/components/carte/SearchBar";
import { useCuisinesDisponibles } from "@/hooks/useCuisinesDisponibles";
import { usePosition } from "@/hooks/usePosition";
import { useRestaurantsProches } from "@/hooks/useRestaurantsProches";
import { LocateFixed } from "lucide-react-native";

import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ============================================
// Écran Carte — assemblage principal
// ============================================
export default function CarteScreen() {
  const {
    coords,
    loading: positionLoading,
    error: positionError,
    recentrer,
  } = usePosition();

  const carteRef = useRef<CarteViewRef>(null);
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);

  // Ref stable pour coords afin d'éviter de recréer handleRecentrer
  // à chaque changement de coordonnées, ce qui causerait des re-renders.
  const coordsRef = useRef(coords);
  useEffect(() => {
    coordsRef.current = coords;
  }, [coords]);

  const restaurantsQuery = useRestaurantsProches(
    coords?.latitude,
    coords?.longitude,
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
    coords?.latitude,
    coords?.longitude,
    10,
  );

  const handleSuggestionSelect = useCallback((lat: number, lon: number) => {
    carteRef.current?.flyTo([lon, lat], 15);
  }, []);

  const handleFilterChange = useCallback((cuisine: string | null) => {
    setSelectedCuisine(cuisine);
  }, []);

  // Utilise coordsRef pour éviter que coords soit dans les dépendances
  // et ne provoque pas la recréation de la fonction à chaque position.
  const handleRecentrer = useCallback(() => {
    recentrer();
    const c = coordsRef.current;
    if (c) {
      carteRef.current?.flyTo([c.longitude, c.latitude], 14);
    }
  }, [recentrer]);

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
          onPress={recentrer}
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
      />

      <SearchBar
        onSelectSuggestion={handleSuggestionSelect}
        onFilterChange={handleFilterChange}
        cuisines={cuisines}
      />

      <TouchableOpacity
        className="absolute bottom-24 left-4 z-10 h-12 w-12 items-center justify-center rounded-full bg-white shadow-md"
        onPress={handleRecentrer}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Recentrer la carte sur ma position"
      >
        <LocateFixed size={22} color="black" />
      </TouchableOpacity>

      {showErrorState && (
        <View className="absolute bottom-20 left-4 right-4 items-center rounded-2xl bg-white p-6 shadow-sm">
          <Text className="mb-3 text-[40px]">📡</Text>
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
          <Text className="mb-3 text-[40px]">🍽</Text>
          <Text className="mb-2 text-[17px] font-bold text-ink-900">
            Aucun établissement ici
          </Text>
          <Text className="mb-4 text-center text-[13px] leading-[18px] text-ink-600">
            Essayez de vous déplacer ou d&apos;agrandir le rayon de recherche
          </Text>
          <TouchableOpacity
            className="min-h-[44px] justify-center rounded-[10px] bg-green-900 px-5 py-3"
            onPress={handleRecentrer}
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
