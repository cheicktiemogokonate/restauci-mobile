import { RestaurantDetailContent } from "@/components/restaurant-detail/restaurant-detail-content";
import { PanierFAB } from "@/components/menu/PanierFAB";
import { RestaurantMenuSheet } from "@/components/restaurant-menu/restaurant-menu-sheet";
import { ErrorView } from "@/components/ui/ErrorView";
import { SkeletonCardList } from "@/components/ui/SkeletonCard";
import { useRestaurant } from "@/hooks/useMenuRestaurant";
import { usePosition } from "@/hooks/usePosition";
import { useItineraryRequestStore } from "@/store/itinerary-request-store";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useRef } from "react";
import { Alert, ScrollView, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

export default function RestaurantScreen() {
  const { slug, lat, lng } = useLocalSearchParams<{
    slug: string;
    lat?: string;
    lng?: string;
  }>();
  const router = useRouter();
  const menuSheetRef = useRef<BottomSheetModal>(null);
  const requestItinerary = useItineraryRequestStore(
    (state) => state.requestItinerary,
  );
  const {
    coords,
    loading: positionLoading,
    error: positionError,
  } = usePosition();

  const restaurantCoordinates = useMemo(() => {
    const routeLatitude = Number(lat);
    const routeLongitude = Number(lng);

    if (Number.isFinite(routeLatitude) && Number.isFinite(routeLongitude)) {
      return { latitude: routeLatitude, longitude: routeLongitude };
    }

    if (!positionLoading && !positionError) {
      return {
        latitude: coords.latitude,
        longitude: coords.longitude,
      };
    }

    return undefined;
  }, [coords.latitude, coords.longitude, lat, lng, positionError, positionLoading]);
  // const [showQuickPreview, setShowQuickPreview] = useState(true);

  const {
    data: restaurant,
    isLoading: isRestaurantLoading,
    refetch: refetchRestaurant,
    error: restaurantError,
  } = useRestaurant(slug ?? null, restaurantCoordinates);

  const isLoading = isRestaurantLoading;
  const error = restaurantError;

  const refetch = async () => {
    await refetchRestaurant();
  };
  const handleVoirMenu = useCallback(() => {
    // setShowQuickPreview(false);
    menuSheetRef.current?.present();
  }, []);

  const handleCloseMenu = useCallback(() => {
    // rien de spécial à faire : le BottomSheet gère déjà son propre index
  }, []);

  const handleItineraire = useCallback(() => {
    if (!restaurant) return;

    if (!restaurantCoordinates) {
      Alert.alert(
        "Position requise",
        "Une position est nécessaire pour tracer l’itinéraire sur la carte.",
      );
      return;
    }

    requestItinerary({
      geometry: restaurant.geo?.itineraire?.geometrie,
      origin: restaurantCoordinates,
      restaurant: {
        id: restaurant.id,
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
        nom: restaurant.nom,
        slug: restaurant.slug,
      },
    });
    router.back();
  }, [requestItinerary, restaurant, restaurantCoordinates, router]);

  if (isLoading) {
    return (
      <View className="flex-1 pt-10">
        <View className="flex-row items-center px-4 py-3 bg-white border-b border-ink-100">
          <View className="w-14 h-14 rounded-[14px] bg-ink-200" />
          <View className="flex-1 ml-3">
            <View className="w-[70%] h-4 rounded-xl bg-ink-200 mb-2" />
            <View className="w-[50%] h-3.5 rounded-xl bg-ink-200" />
          </View>
        </View>
        <View className="flex-row px-4 py-3 bg-white border-b border-ink-100">
          <View className="w-[70px] h-8 rounded-full bg-ink-200" />
          <View className="w-[90px] h-8 rounded-full bg-ink-200 ml-2" />
          <View className="w-[80px] h-8 rounded-full bg-ink-200 ml-2" />
        </View>
        <View style={{ paddingBottom: 32 }}>
          <SkeletonCardList count={4} />
        </View>
      </View>
    );
  }

  if (error || !restaurant) {
    return (
      <View className="flex-1">
        <ErrorView
          message={error?.message}
          onRetry={refetch}
          title="Établissement introuvable"
        />
      </View>
    );
  }

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      className="flex-1"
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 72 }}
        // refreshControl={
        //   <RefreshControl refreshing={isFetching} onRefresh={refetch} />
        // }
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <RestaurantDetailContent
          restaurant={restaurant}
          onItineraire={handleItineraire}
          onVoirMenu={handleVoirMenu}
        />
      </ScrollView>

      <PanierFAB />

      <RestaurantMenuSheet
        ref={menuSheetRef}
        slug={slug ?? ""}
        restaurant={restaurant}
        onClose={handleCloseMenu}
      />
    </Animated.View>
  );
}
