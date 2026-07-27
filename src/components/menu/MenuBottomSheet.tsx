import { CartePlatMobile } from "@/components/menu/CartePlatMobile";
import { FiltreCategoriesMobile } from "@/components/menu/FiltreCategoriesMobile";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorView } from "@/components/ui/ErrorView";
import { SkeletonCardList } from "@/components/ui/SkeletonCard";
import { useMenuRestaurant } from "@/hooks/useMenuRestaurant";
import { useStore } from "@/store";
import type { Categorie, Plat, Restaurant } from "@/types";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetFlatList } from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import { forwardRef, useCallback, useMemo, useState } from "react";
import { Text, View } from "react-native";

type Props = {
  slug: string;
  restaurant: Restaurant;
  onClose: () => void;
};

const CustomBackdrop = (props: BottomSheetBackdropProps) => {
  return (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      opacity={0.5}
      pressBehavior="close"
    />
  );
};

export const MenuBottomSheet = forwardRef<BottomSheetModal, Props>(
  ({ slug, restaurant, onClose }, ref) => {
    const {
      data: categories = [],
      isLoading: isMenuLoading,
      refetch: refetchMenu,
      error: menuError,
    } = useMenuRestaurant(slug ?? null);

    const ajouterItem = useStore((s) => s.ajouterItem);
    const retirerItem = useStore((s) => s.retirerItem);
    const storeRestaurantSlug = useStore((s) => s.restaurantSlug);

    const visibleCategories = useMemo(
      () => categories.filter((category) => category.visible !== false),
      [categories],
    );

    const categoryNames = useMemo(
      () => visibleCategories.map((c) => ({ id: c.id, nom: c.nom })),
      [visibleCategories],
    );

    const [selectedCategory, setSelectedCategory] = useState<string | null>(
      null,
    );

    const platsAffiches = useMemo(() => {
      // 🔗 réintégrer `isPlatDisponible(plat, cat, creneaux)` quand l'API
      // exposera les créneaux horaires (absents de docs/openapi.json à ce
      // jour). Avec un tableau vide, l'appel retournait toujours `true` :
      // c'était un filtre mort qui masquait l'absence de la donnée.
      // En attendant, on s'appuie sur le seul champ réellement servi par
      // l'API : `plat.disponible`.
      let source: Categorie[] = visibleCategories;
      if (selectedCategory) {
        source = source.filter((c) => c.id === selectedCategory);
      }
      const result: { plat: Plat; categorie: Categorie }[] = [];
      for (const cat of source) {
        const plats = Array.isArray(cat.plats) ? cat.plats : [];
        for (const plat of plats) {
          if (plat.disponible) {
            result.push({ plat, categorie: cat });
          }
        }
      }
      return result;
    }, [visibleCategories, selectedCategory]);

    const handleCategorySelect = useCallback((catId: string | null) => {
      setSelectedCategory(catId);
    }, []);

    const handleAjouter = useCallback(
      async (plat: Plat) => {
        const cartRestaurantId = slug ?? "";
        if (storeRestaurantSlug && storeRestaurantSlug !== cartRestaurantId) {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Warning,
          );
          return;
        }
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        ajouterItem(
          {
            id: plat.id,
            nom: plat.nom,
            prix: plat.prix,
            photoUrl: plat.photoUrl,
          },
          1,
          cartRestaurantId,
        );
      },
      [ajouterItem, slug, storeRestaurantSlug],
    );

    const handleRetirer = useCallback(
      async (platId: string) => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        retirerItem(platId);
      },
      [retirerItem],
    );

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={["70%"]}
        enableDynamicSizing={false} // 👈 ajoute cette ligne
        enablePanDownToClose
        enableOverDrag={false}
        onDismiss={onClose}
        backgroundStyle={{ backgroundColor: "#ffffff" }}
        handleIndicatorStyle={{ backgroundColor: "#D1D5DB" }}
        backdropComponent={(props) => (<CustomBackdrop {...props} />)}
      >
        <Text className="text-xl text-center font-bold text-ink-900 mb-2">
          Menu {restaurant.nom}
        </Text>
        {categoryNames.length > 0 && (
          <FiltreCategoriesMobile
            categories={categoryNames}
            selectedCategory={selectedCategory}
            onSelect={handleCategorySelect}
          />
        )}
        {isMenuLoading ? (
          <View className="px-4 pb-8">
            <SkeletonCardList count={6} />
          </View>
        ) : menuError || !categories.length ? (
          <View className="px-4 pb-8">
            <ErrorView
              message={menuError?.message}
              onRetry={refetchMenu}
              title="Menu indisponible"
            />
          </View>
        ) : (
          <BottomSheetFlatList
            data={platsAffiches}
            keyExtractor={(item) => item.plat.id}
            renderItem={({ item }) => (
              <CartePlatMobile
                plat={item.plat}
                onAjouter={handleAjouter}
                onRetirer={handleRetirer}
              />
            )}
            ListEmptyComponent={
              <EmptyState
                emoji="📋"
                title="Aucun plat disponible"
                message="Aucun plat disponible dans cette catégorie"
              />
            }
            contentContainerStyle={{ paddingBottom: 32 }}
          />
        )}
      </BottomSheetModal>
    );
  },
);

MenuBottomSheet.displayName = "MenuBottomSheet";
