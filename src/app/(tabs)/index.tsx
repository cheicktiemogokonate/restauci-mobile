import { CarteView, type CarteViewRef } from "@/components/carte/CarteView";
import { SearchBar } from "@/components/carte/SearchBar";
import { usePosition } from "@/hooks/usePosition";
import { useRestaurantsProches } from "@/hooks/useRestaurantsProches";
import { LocateFixed } from "lucide-react-native";

import { useCallback, useRef, useState } from "react";
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
  coordsRef.current = coords;

  const restaurantsQuery = useRestaurantsProches(
    coords?.latitude,
    coords?.longitude,
    10, // rayon (augmenté un peu pour avoir plus de choix)
    selectedCuisine
  );
  const { data: restaurants = [], isLoading: restaurantsLoading } =
    restaurantsQuery;

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

  const showEmptyState =
    !positionLoading &&
    !restaurantsLoading &&
    coords &&
    restaurants.length === 0;

  if (positionError) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-8">
        <View className="mb-4">
          <LocateFixed size={48} color="black" />
        </View>
        <Text className="mb-2 text-xl font-bold text-gray-900">
          Localisation requise
        </Text>
        <Text className="mb-6 text-center text-sm leading-5 text-gray-500">
          {positionError.message}
        </Text>
        <TouchableOpacity
          className="rounded-xl bg-[green-500] px-6 py-3"
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
      />

      <TouchableOpacity
        className="absolute bottom-[100px] left-4 z-10 h-12 w-12 items-center justify-center rounded-full bg-white shadow-md"
        onPress={handleRecentrer}
        activeOpacity={0.7}
      >
        <LocateFixed size={22} color="black" />
      </TouchableOpacity>

      {showEmptyState && (
        <View className="absolute bottom-20 left-4 right-4 items-center rounded-2xl bg-white p-6 shadow-sm">
          <Text className="mb-3 text-[40px]">🍽</Text>
          <Text className="mb-1.5 text-[17px] font-bold text-gray-900">
            Aucun restaurant ici
          </Text>
          <Text className="mb-4 text-center text-[13px] leading-[18px] text-gray-500">
            Essayez de vous déplacer ou d'agrandir le rayon de recherche
          </Text>
          <TouchableOpacity
            className="rounded-[10px] bg-[green-500] px-5 py-2.5"
            onPress={handleRecentrer}
          >
            <Text className="text-sm font-bold text-white">Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}

      {isLoading && (
        <View className="absolute inset-0 items-center justify-center bg-white/50">
          <ActivityIndicator size="large" color="green-500" />
        </View>
      )}

      {/* Restaurant details opened as modal screen via router */}
    </View>
  );
}
