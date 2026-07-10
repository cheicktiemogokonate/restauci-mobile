import { CartePlatMobile } from "@/components/menu/CartePlatMobile";
import { FiltreCategoriesMobile } from "@/components/menu/FiltreCategoriesMobile";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorView } from "@/components/ui/ErrorView";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { useMenuRestaurant } from "@/hooks/useMenuRestaurant";
import { useStore } from "@/store";
import type { Categorie, CreneauHoraire, Plat, Restaurant } from "@/types";
import { isPlatDisponible } from "@/utils/creneaux";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetScrollView } from "@gorhom/bottom-sheet";
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

    const creneaux: CreneauHoraire[] = [];

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
        <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          <View className="px-4 pb-8">
            {isMenuLoading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            ) : menuError || !categories.length ? (
              <ErrorView
                message={menuError?.message}
                onRetry={refetchMenu}
                title="Menu indisponible"
              />
            ) : platsAffiches.length > 0 ? (
              platsAffiches.map((item) => (
                <CartePlatMobile
                  key={item.plat.id}
                  plat={item.plat}
                  onAjouter={handleAjouter}
                  onRetirer={handleRetirer}
                />
              ))
            ) : (
              <EmptyState
                emoji="📋"
                title="Aucun plat disponible"
                message="Aucun plat disponible dans cette catégorie"
              />
            )}
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);

MenuBottomSheet.displayName = "MenuBottomSheet";
