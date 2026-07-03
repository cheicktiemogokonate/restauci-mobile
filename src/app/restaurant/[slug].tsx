import { CartePlatMobile } from "@/components/menu/CartePlatMobile";
import { FiltreCategoriesMobile } from "@/components/menu/FiltreCategoriesMobile";
import { HeaderRestaurant } from "@/components/menu/HeaderRestaurant";
import { PanierFAB } from "@/components/menu/PanierFAB";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorView } from "@/components/ui/ErrorView";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { useMenuRestaurant, useRestaurant } from "@/hooks/useMenuRestaurant";
import { useStore } from "@/store";
import type { Categorie, CreneauHoraire, Plat } from "@/types";
import { isPlatDisponible } from "@/utils/creneaux";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Linking,
  Platform,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CARD_HEIGHT = 92;

export default function RestaurantScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const {
    data: categories = [],
    isLoading: isMenuLoading,
    isFetching: isMenuFetching,
    refetch: refetchMenu,
    error: menuError,
  } = useMenuRestaurant(slug ?? null);

  const {
    data: restaurant,
    isLoading: isRestaurantLoading,
    isFetching: isRestaurantFetching,
    refetch: refetchRestaurant,
    error: restaurantError,
  } = useRestaurant(slug ?? null);

  const isLoading = isMenuLoading || isRestaurantLoading;
  const isFetching = isMenuFetching || isRestaurantFetching;
  const error = menuError || restaurantError;

  const refetch = async () => {
    await refetchMenu();
    await refetchRestaurant();
  };

  const ajouterItem = useStore((s) => s.ajouterItem);
  const retirerItem = useStore((s) => s.retirerItem);
  const storeRestaurantId = useStore((s) => s.restaurantId);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Le backend ne retourne pas encore de créneaux (feature en développement).
  // Cette valeur reste toujours [] pour l'instant, ce qui fait que isPlatDisponible
  // retombe sur son comportement par défaut : un plat est considéré disponible sauf
  // si plat.disponible === false (les creneauId sont ignorés faute de données).
  const creneaux: CreneauHoraire[] = [];

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

  const categoryNames = useMemo(
    () => visibleCategories.map((c) => ({ id: c.id, nom: c.nom })),
    [visibleCategories],
  );

  const platsAffiches = useMemo(() => {
    let source: Categorie[] = visibleCategories;

    if (selectedCategory) {
      source = source.filter((c) => c.id === selectedCategory);
    }

    const result: Array<{ plat: Plat; categorie: Categorie }> = [];

    for (const cat of source) {
      const plats = Array.isArray(cat.plats) ? cat.plats : [];
      for (const plat of plats) {
        const creneauIndisponible =
          !isPlatDisponible(plat, cat, creneaux) && plat.disponible;
        if (!creneauIndisponible) {
          result.push({ plat, categorie: cat });
        }
      }
    }

    return result;
  }, [visibleCategories, selectedCategory, creneaux]);

  const handleAjouter = useCallback(
    async (plat: Plat) => {
      const cartRestaurantId = slug ?? "";
      if (storeRestaurantId && storeRestaurantId !== cartRestaurantId) {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning,
        );
        return;
      }
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      ajouterItem(
        { id: plat.id, nom: plat.nom, prix: plat.prix },
        1,
        cartRestaurantId,
      );
    },
    [ajouterItem, slug, storeRestaurantId],
  );

  const handleRetirer = useCallback(
    async (platId: string) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      retirerItem(platId);
    },
    [retirerItem],
  );

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

  const handleCategorySelect = useCallback((catId: string | null) => {
    setSelectedCategory(catId);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: { plat: Plat; categorie: Categorie } }) => (
      <CartePlatMobile
        plat={item.plat}
        onAjouter={handleAjouter}
        onRetirer={handleRetirer}
      />
    ),
    [handleAjouter, handleRetirer],
  );

  const keyExtractor = useCallback(
    (_item: { plat: Plat; categorie: Categorie }) => _item.plat.id,
    [],
  );

  const getItemLayout = useCallback(
    (
      _data: ArrayLike<{ plat: Plat; categorie: Categorie }> | null | undefined,
      index: number,
    ) => ({
      length: CARD_HEIGHT,
      offset: CARD_HEIGHT * index,
      index,
    }),
    [],
  );

  const ListHeader = useMemo(() => {
    return (
      <View>
        {restaurant && (
          <HeaderRestaurant
            restaurant={restaurant}
            onItineraire={handleItineraire}
            popularPlats={popularPlats}
          />
        )}
        {categoryNames.length > 0 && (
          <FiltreCategoriesMobile
            categories={categoryNames}
            selectedCategory={selectedCategory}
            onSelect={handleCategorySelect}
          />
        )}
      </View>
    );
  }, [
    restaurant,
    categoryNames,
    selectedCategory,
    handleCategorySelect,
    handleItineraire,
  ]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.flex}>
        <View style={styles.skeletonHeader}>
          <View
            style={[
              styles.skeletonLine,
              { width: 56, height: 56, borderRadius: 14 },
            ]}
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={[styles.skeletonLine, { width: "70%", height: 18 }]} />
            <View
              style={[
                styles.skeletonLine,
                { width: "50%", height: 14, marginTop: 8 },
              ]}
            />
          </View>
        </View>
        <View style={styles.skeletonFilter}>
          <View
            style={[
              styles.skeletonLine,
              { width: 70, height: 32, borderRadius: 16 },
            ]}
          />
          <View
            style={[
              styles.skeletonLine,
              { width: 90, height: 32, borderRadius: 16, marginLeft: 8 },
            ]}
          />
          <View
            style={[
              styles.skeletonLine,
              { width: 80, height: 32, borderRadius: 16, marginLeft: 8 },
            ]}
          />
        </View>
        <FlatList
          data={Array.from({ length: 6 })}
          keyExtractor={(_, index) => `skel-${index}`}
          renderItem={() => <SkeletonCard />}
          contentContainerStyle={styles.listContent}
          scrollEnabled={false}
        />
      </SafeAreaView>
    );
  }

  if (error || !categories.length || !restaurant) {
    return (
      <SafeAreaView style={styles.flex}>
        <ErrorView
          message={error?.message}
          onRetry={refetch}
          title="Restaurant introuvable"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.flex}>
      <FlatList
        data={platsAffiches}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        stickyHeaderIndices={
          categoryNames.length > 0 ? [restaurant ? 1 : 0] : undefined
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        getItemLayout={getItemLayout}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={() => refetch()} />
        }
        ListEmptyComponent={
          <EmptyState
            emoji="📋"
            title="Aucun plat disponible"
            message="Aucun plat disponible dans cette catégorie"
          />
        }
      />

      {restaurant && (
        <PanierFAB
          fraisLivraison={restaurant.fraisLivraison}
          restaurantNom={restaurant.nom}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  listContent: {
    paddingBottom: 32,
  },
  skeletonHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
    borderBottomColor: "#f3f4f6",
    borderBottomWidth: 1,
  },
  skeletonFilter: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
    borderBottomColor: "#f3f4f6",
    borderBottomWidth: 1,
  },
  skeletonLine: {
    height: 14,
    backgroundColor: "#e5e7eb",
    borderRadius: 6,
  },
});
