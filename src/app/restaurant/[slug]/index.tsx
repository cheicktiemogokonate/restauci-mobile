import { HeaderRestaurant } from "@/components/menu/HeaderRestaurant";
import { MenuBottomSheet } from "@/components/menu/MenuBottomSheet";
import { PanierFAB } from "@/components/menu/PanierFAB";
import { Button } from "@/components/ui/button";
import { ErrorView } from "@/components/ui/ErrorView";
import { SkeletonCardList } from "@/components/ui/SkeletonCard";
import { Text as ButtonText } from "@/components/ui/text";
import { useMenuRestaurant, useRestaurant } from "@/hooks/useMenuRestaurant";
import type { Plat } from "@/types";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useRef } from "react";
import { Linking, Platform, ScrollView, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

export default function RestaurantScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const menuSheetRef = useRef<BottomSheetModal>(null);
  // const [showQuickPreview, setShowQuickPreview] = useState(true);

  const {
    data: restaurant,
    isLoading: isRestaurantLoading,
    refetch: refetchRestaurant,
    error: restaurantError,
  } = useRestaurant(slug ?? null);

  const isLoading = isRestaurantLoading;
  const error = restaurantError;

  const refetch = async () => {
    await refetchRestaurant();
  };
  const { data: categories = [] } = useMenuRestaurant(slug ?? null);

  const visibleCategories = useMemo(
    () => categories.filter((category) => category.visible !== false),
    [categories],
  );

  const popularPlats = useMemo(() => {
    const list: Plat[] = [];
    for (const cat of visibleCategories) {
      const plats = Array.isArray(cat.plats) ? cat.plats : [];
      for (const p of plats) {
        if (list.length < 3) list.push(p);
        else break;
      }
      if (list.length >= 3) break;
    }
    return list;
  }, [visibleCategories]);

  const handleVoirMenu = useCallback(() => {
    // setShowQuickPreview(false);
    menuSheetRef.current?.present();
  }, []);

  const handleCloseMenu = useCallback(() => {
    // rien de spécial à faire : le BottomSheet gère déjà son propre index
  }, []);

  const handleItineraire = useCallback(() => {
    if (!restaurant) return;
    const { latitude, longitude, nom } = restaurant;
    const url = Platform.select({
      ios: `maps:0,0?q=${nom}@${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${encodeURIComponent(nom)})`,
    });
    if (url) {
      Linking.openURL(url).catch(() => {});
    }
  }, [restaurant]);

  const ListHeader = useMemo(() => {
    return (
      <View>
        {restaurant && (
          <HeaderRestaurant
            restaurant={restaurant}
            onItineraire={handleItineraire}
            onVoirMenu={handleVoirMenu}
            popularPlats={popularPlats}
          />
        )}
      </View>
    );
  }, [restaurant, handleItineraire, handleVoirMenu, popularPlats]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-ink-50 pt-10">
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
      <View className="flex-1 bg-ink-50">
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
      className="flex-1 bg-ink-50"
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        // refreshControl={
        //   <RefreshControl refreshing={isFetching} onRefresh={refetch} />
        // }
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        {ListHeader}
      </ScrollView>
      <Button
        className="items-center w-[90%] self-center mb-4 h-12 justify-center"
        onPress={handleVoirMenu}
      >
        <ButtonText className="text-white text-lg font-semibold">
          Voir le menu
        </ButtonText>
      </Button>

      <PanierFAB
        fraisLivraison={restaurant.fraisLivraison}
        restaurantNom={restaurant.nom}
      />

      <MenuBottomSheet
        ref={menuSheetRef}
        slug={slug ?? ""}
        restaurant={restaurant}
        onClose={handleCloseMenu}
      />
    </Animated.View>
  );
}
