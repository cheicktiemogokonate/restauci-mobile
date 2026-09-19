import { RestaurantMenuCategoryFilter } from "@/components/restaurant-menu/restaurant-menu-category-filter";
import { RestaurantMenuItemCard } from "@/components/restaurant-menu/restaurant-menu-item-card";
import { useMenuRestaurant } from "@/hooks/useMenuRestaurant";
import { useStore } from "@/store";
import type { Categorie, Plat, Restaurant } from "@/types";
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import regular from "expo-symbols/androidWeights/regular";
import {
  forwardRef,
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface RestaurantMenuSheetProps {
  slug: string;
  restaurant: Restaurant;
  onClose: () => void;
}

type MenuListRow =
  | { type: "category"; category: Categorie }
  | { type: "dish"; categoryId: string; plat: Plat };

const stateIcons = {
  empty: { ios: "fork.knife", android: "restaurant" },
  error: { ios: "arrow.clockwise", android: "refresh" },
} satisfies Record<string, SymbolViewProps["name"]>;

function MenuBackdrop(props: BottomSheetBackdropProps) {
  return (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      opacity={0.32}
      pressBehavior="close"
    />
  );
}

function MenuState({
  actionLabel,
  icon,
  message,
  onAction,
  title,
}: {
  actionLabel?: string;
  icon: SymbolViewProps["name"];
  message: string;
  onAction?: () => void;
  title: string;
}) {
  return (
    <View style={styles.state}>
      <View style={styles.stateIcon}>
        <SymbolView
          name={icon}
          resizeMode="scaleAspectFit"
          scale="medium"
          size={28}
          tintColor="#111111"
          weight={{ ios: "regular", android: regular }}
        />
      </View>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateMessage}>{message}</Text>
      {!!actionLabel && !!onAction && (
        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.8}
          onPress={onAction}
          style={[styles.stateAction]}
        >
          <Text style={styles.stateActionLabel}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export const RestaurantMenuSheet = forwardRef<
  BottomSheetModal,
  RestaurantMenuSheetProps
>(({ slug, restaurant, onClose }, ref) => {
  const insets = useSafeAreaInsets();
  const {
    data: categories = [],
    isLoading,
    error,
    refetch,
  } = useMenuRestaurant(slug || null);
  const ajouterItem = useStore((state) => state.ajouterItem);
  const retirerItem = useStore((state) => state.retirerItem);
  const viderPanier = useStore((state) => state.viderPanier);
  const restaurantSlugDuPanier = useStore((state) => state.restaurantSlug);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const commandesDisponibles =
    restaurant.enLigne && restaurant.accepteCommandes;

  const visibleCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          category.visible !== false &&
          category.plats.length > 0,
      ),
    [categories],
  );

  const categoryOptions = useMemo(
    () =>
      visibleCategories.map((category) => ({
        id: category.id,
        nom: category.nom,
      })),
    [visibleCategories],
  );

  const activeCategory = categoryOptions.some(
    (category) => category.id === selectedCategory,
  )
    ? selectedCategory
    : null;

  const rows = useMemo<MenuListRow[]>(() => {
    const source = activeCategory
      ? visibleCategories.filter(
          (category) => category.id === activeCategory,
        )
      : visibleCategories;

    return source.flatMap<MenuListRow>((category) => [
      { type: "category", category },
      ...category.plats.map<MenuListRow>((plat) => ({
          type: "dish",
          categoryId: category.id,
          plat,
        })),
    ]);
  }, [activeCategory, visibleCategories]);

  const handleAjouter = useCallback(
    async (plat: Plat) => {
      if (!commandesDisponibles) return;

      if (
        restaurantSlugDuPanier &&
        restaurantSlugDuPanier !== restaurant.slug
      ) {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning,
        );
        Alert.alert(
          "Nouveau panier",
          "Votre panier contient des plats d’un autre établissement. Voulez-vous le vider et commander ici ?",
          [
            { text: "Annuler", style: "cancel" },
            {
              text: "Vider et continuer",
              style: "destructive",
              onPress: () => {
                viderPanier();
                ajouterItem(
                  {
                    id: plat.id,
                    nom: plat.nom,
                    prix: plat.prix,
                    photoUrl: plat.photoUrl,
                  },
                  1,
                  restaurant.slug,
                );
              },
            },
          ],
        );
        return;
      }

      ajouterItem(
        {
          id: plat.id,
          nom: plat.nom,
          prix: plat.prix,
          photoUrl: plat.photoUrl,
        },
        1,
        restaurant.slug,
      );
    },
    [
      ajouterItem,
      commandesDisponibles,
      restaurant.slug,
      restaurantSlugDuPanier,
      viderPanier,
    ],
  );

  const handleRetirer = useCallback(
    (platId: string) => retirerItem(platId),
    [retirerItem],
  );

  const snapPoints = useMemo(() => ["92%"], []);

  return (
    <BottomSheetModal
      ref={ref}
      backdropComponent={MenuBackdrop}
      backgroundStyle={styles.sheetBackground}
      enableDynamicSizing={false}
      enableOverDrag={false}
      enablePanDownToClose
      handleIndicatorStyle={styles.handleIndicator}
      handleStyle={styles.handle}
      onDismiss={onClose}
      snapPoints={snapPoints}
      topInset={insets.top + 6}
    >
      <View style={styles.header}>
        <Text numberOfLines={1} style={styles.restaurantName}>
          {restaurant.nom}
        </Text>
        <Text style={styles.title}>Le menu</Text>
        <Text style={styles.subtitle}>
          {commandesDisponibles
            ? "Choisissez ce qui vous fait envie."
            : "Menu consultable · commandes actuellement fermées"}
        </Text>
      </View>

      {categoryOptions.length > 0 && (
        <RestaurantMenuCategoryFilter
          categories={categoryOptions}
          onSelect={setSelectedCategory}
          selectedCategory={activeCategory}
        />
      )}

      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color="theme.green900" size="large" />
          <Text style={styles.loadingLabel}>Le menu se prépare…</Text>
        </View>
      ) : error ? (
        <MenuState
          actionLabel="Réessayer"
          icon={stateIcons.error}
          message={error.message || "Le menu ne peut pas être chargé pour le moment."}
          onAction={() => void refetch()}
          title="Menu indisponible"
        />
      ) : rows.length === 0 ? (
        <MenuState
          icon={stateIcons.empty}
          message="Cet établissement n’a encore aucun plat disponible."
          title="Le menu est vide"
        />
      ) : (
        <BottomSheetFlatList<MenuListRow>
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 40 },
          ]}
          data={rows}
          keyExtractor={(row) =>
            row.type === "category"
              ? `category-${row.category.id}`
              : `dish-${row.plat.id}`
          }
          renderItem={({ item, index }) =>
            item.type === "category" ? (
              <View style={styles.sectionHeader}>
                <Text numberOfLines={1} style={styles.sectionTitle}>
                  {item.category.nom}
                </Text>
                {!!item.category.description && (
                  <Text numberOfLines={1} style={styles.sectionDescription}>
                    {item.category.description}
                  </Text>
                )}
              </View>
            ) : (
              <RestaurantMenuItemCard
                commandesDisponibles={
                  commandesDisponibles && item.plat.disponible
                }
                index={index}
                onAjouter={handleAjouter}
                onRetirer={handleRetirer}
                plat={item.plat}
              />
            )
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </BottomSheetModal>
  );
});

RestaurantMenuSheet.displayName = "RestaurantMenuSheet";

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: "#F8F8F5",
    borderCurve: "continuous",
    borderRadius: 32,
  },
  handle: {
    paddingBottom: 3,
    paddingTop: 11,
  },
  handleIndicator: {
    backgroundColor: "#C8C8C4",
    height: 4,
    width: 38,
  },
  header: {
    alignItems: "center",
    paddingBottom: 20,
    paddingHorizontal: 28,
    paddingTop: 7,
  },
  restaurantName: {
    color: "#77777B",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.1,
    lineHeight: 18,
    maxWidth: "90%",
  },
  title: {
    color: "#101010",
    fontSize: 29,
    fontWeight: "700",
    letterSpacing: -0.7,
    lineHeight: 36,
    marginTop: 3,
  },
  subtitle: {
    color: "#6D6D71",
    fontSize: 13.5,
    lineHeight: 19,
    marginTop: 5,
    textAlign: "center",
  },
  loadingState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingBottom: 80,
  },
  loadingLabel: {
    color: "#737377",
    fontSize: 14,
    marginTop: 14,
  },
  listContent: {
    gap: 11,
    paddingHorizontal: 18,
  },
  sectionHeader: {
    paddingBottom: 2,
    paddingHorizontal: 4,
    paddingTop: 13,
  },
  sectionTitle: {
    color: "#111111",
    fontSize: 21,
    fontWeight: "700",
    letterSpacing: -0.4,
    lineHeight: 27,
  },
  sectionDescription: {
    color: "#77777B",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  state: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingBottom: 72,
    paddingHorizontal: 42,
  },
  stateIcon: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderCurve: "continuous",
    borderRadius: 22,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  stateTitle: {
    color: "#111111",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
    lineHeight: 26,
    marginTop: 18,
    textAlign: "center",
  },
  stateMessage: {
    color: "#747478",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 7,
    textAlign: "center",
  },
  stateAction: {
    backgroundColor: "theme.green900",
    borderCurve: "continuous",
    borderRadius: 999,
    marginTop: 20,
    minHeight: 44,
    paddingHorizontal: 22,
    justifyContent: "center",
  },
  stateActionLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
