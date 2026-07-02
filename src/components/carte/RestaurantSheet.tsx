import { haversineDistance } from "@/lib/geo";
import type { Restaurant } from "@/types";
import BottomSheet, {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import React, { useCallback, useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// ============================================
// Composant RestaurantSheet — BottomSheet
// ============================================
interface RestaurantSheetProps {
  restaurant: Restaurant | null;
  userLocation: { latitude: number; longitude: number } | null;
  onVoirMenu: (restaurantSlug: string) => void;
  onClose: () => void;
}

const MODE_LABELS: Record<string, string> = {
  livraison: "Livraison",
  emporter: "Emporter",
  surplace: "Sur place",
};

const MODE_COLORS: Record<string, string> = {
  livraison: "#3b82f6",
  emporter: "#f59e0b",
  surplace: "#22c55e",
};

export const RestaurantSheet: React.FC<RestaurantSheetProps> = ({
  restaurant,
  userLocation,
  onVoirMenu,
  onClose,
}) => {
  React.useEffect(() => {
    console.log("[RestaurantSheet] restaurant changed:", restaurant);
  }, [restaurant]);
  const snapPoints = useMemo(() => [220], []);

  const distance = useMemo(() => {
    if (!restaurant || !userLocation) return null;
    const km = haversineDistance(
      userLocation.latitude,
      userLocation.longitude,
      restaurant.latitude,
      restaurant.longitude,
    );
    return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
  }, [restaurant, userLocation]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.3}
      />
    ),
    [],
  );

  if (!restaurant) return null;

  return (
    <BottomSheet
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleStyle={styles.handleStyle}
      handleIndicatorStyle={styles.handleIndicator}
      style={styles.bottomSheet}
    >
      <View style={styles.content}>
        <View style={styles.row}>
          {restaurant.logoUrl ? (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoEmoji}>🍽</Text>
            </View>
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoEmoji}>🍽</Text>
            </View>
          )}
          <View style={styles.info}>
            <Text style={styles.nom} numberOfLines={1}>
              {restaurant.nom}
            </Text>
            {restaurant.description && (
              <Text style={styles.description} numberOfLines={2}>
                {restaurant.description}
              </Text>
            )}
            <View style={styles.metaRow}>
              {distance && <Text style={styles.distance}>📍 {distance}</Text>}
            </View>
          </View>
        </View>

        <View style={styles.modesRow}>
          {restaurant.modesCommande.map((mode) => (
            <View
              key={mode}
              style={[
                styles.badge,
                { backgroundColor: `${MODE_COLORS[mode] ?? "#6b7280"}18` },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: MODE_COLORS[mode] ?? "#6b7280" },
                ]}
              >
                {MODE_LABELS[mode] ?? mode}
              </Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => onVoirMenu(restaurant.slug)}
          activeOpacity={0.7}
        >
          <Text style={styles.menuButtonText}>Voir le menu</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  handleStyle: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  handleIndicator: {
    backgroundColor: "#d1d5db",
    width: 40,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  logoPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  logoEmoji: {
    fontSize: 24,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  nom: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  description: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  distance: {
    fontSize: 12,
    color: "#9ca3af",
  },
  modesRow: {
    flexDirection: "row",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  menuButton: {
    backgroundColor: "#22c55e",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  menuButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  bottomSheet: {
    zIndex: 50,
    elevation: 50,
  },
});

export default RestaurantSheet;
