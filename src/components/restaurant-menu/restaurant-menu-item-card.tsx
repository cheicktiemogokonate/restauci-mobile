import { MAX_ITEM_QUANTITY } from "@/domain/checkout";
import { formatPrix } from "@/lib/format";
import { useStore } from "@/store";
import type { Plat } from "@/types";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import regular from "expo-symbols/androidWeights/regular";
import { memo, useCallback, useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

interface RestaurantMenuItemCardProps {
  commandesDisponibles: boolean;
  index: number;
  plat: Plat;
  onAjouter: (plat: Plat) => void;
  onRetirer: (platId: string) => void;
}

const BLUR_HASH = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";
const FALLBACK_IMAGE = require("../../../assets/images/plat-placeholder.jpg");
const quantityIcons = {
  add: { ios: "plus", android: "add" },
  remove: { ios: "minus", android: "remove" },
} satisfies Record<string, SymbolViewProps["name"]>;

function QuantityIcon({
  name,
}: {
  name: SymbolViewProps["name"];
}) {
  return (
    <SymbolView
      name={name}
      resizeMode="scaleAspectFit"
      scale="medium"
      size={18}
      tintColor="#FFFFFF"
      weight={{ ios: "semibold", android: regular }}
    />
  );
}

export const RestaurantMenuItemCard = memo(function RestaurantMenuItemCard({
  commandesDisponibles,
  index,
  plat,
  onAjouter,
  onRetirer,
}: RestaurantMenuItemCardProps) {
  const quantite = useStore(
    (state) =>
      state.items.find((item) => item.platId === plat.id)?.quantite ?? 0,
  );
  const prixFormate = useMemo(() => formatPrix(plat.prix), [plat.prix]);
  const quantiteMaxAtteinte = quantite >= MAX_ITEM_QUANTITY;

  const handleAdd = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAjouter(plat);
  }, [onAjouter, plat]);

  const handleRemove = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRetirer(plat.id);
  }, [onRetirer, plat.id]);

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 7) * 36)
        .duration(260)
        .springify()
        .damping(20)}
      style={styles.card}
    >
      <Image
        cachePolicy="memory-disk"
        contentFit="cover"
        placeholder={{ blurhash: BLUR_HASH }}
        placeholderContentFit="cover"
        source={plat.photoUrl || FALLBACK_IMAGE}
        style={styles.image}
        transition={180}
      />

      <View style={styles.content}>
        <View style={styles.copy}>
          <Text numberOfLines={1} style={styles.name}>
            {plat.nom}
          </Text>
          {!!plat.description && (
            <Text numberOfLines={2} style={styles.description}>
              {plat.description}
            </Text>
          )}
        </View>

        <View style={styles.footer}>
          <Text numberOfLines={1} style={styles.price}>
            {prixFormate}
          </Text>

          {commandesDisponibles &&
            (quantite > 0 ? (
              <View style={styles.quantityControl}>
                <TouchableOpacity
                  accessibilityLabel={`Retirer une unité de ${plat.nom}`}
                  accessibilityRole="button"
                  activeOpacity={0.78}
                  hitSlop={5}
                  onPress={handleRemove}
                  style={[styles.quantityButton]}
                >
                  <QuantityIcon name={quantityIcons.remove} />
                </TouchableOpacity>
                <Text style={styles.quantity}>{quantite}</Text>
                <TouchableOpacity
                  accessibilityLabel={`Ajouter une unité de ${plat.nom}`}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: quantiteMaxAtteinte }}
                  activeOpacity={0.78}
                  disabled={quantiteMaxAtteinte}
                  hitSlop={5}
                  onPress={handleAdd}
                  style={[
                    styles.quantityButton,
                    quantiteMaxAtteinte && styles.quantityButtonDisabled,
                  ]}
                >
                  <QuantityIcon name={quantityIcons.add} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                accessibilityLabel={`Ajouter ${plat.nom} au panier`}
                accessibilityRole="button"
                activeOpacity={0.78}
                hitSlop={6}
                onPress={handleAdd}
                style={[styles.addButton]}
              >
                <QuantityIcon name={quantityIcons.add} />
              </TouchableOpacity>
            ))}
        </View>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#ECECE8",
    borderCurve: "continuous",
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    minHeight: 120,
    padding: 11,
  },
  image: {
    aspectRatio: 1,
    backgroundColor: "#F1F1ED",
    borderCurve: "continuous",
    borderRadius: 18,
    height: 98,
    width: 98,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    minWidth: 0,
    paddingBottom: 2,
    paddingTop: 3,
  },
  copy: {
    minWidth: 0,
    paddingRight: 2,
  },
  name: {
    color: "#111111",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
    lineHeight: 21,
  },
  description: {
    color: "#747478",
    fontSize: 12.5,
    lineHeight: 17,
    marginTop: 4,
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 38,
  },
  price: {
    color: "theme.green900",
    flexShrink: 1,
    fontSize: 14,
    fontVariant: ["tabular-nums"],
    fontWeight: "700",
    lineHeight: 19,
    paddingRight: 5,
  },
  addButton: {
    alignItems: "center",
    backgroundColor: "theme.green900",
    borderCurve: "continuous",
    borderRadius: 999,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  quantityControl: {
    alignItems: "center",
    backgroundColor: "#F1F4EF",
    borderCurve: "continuous",
    borderRadius: 999,
    flexDirection: "row",
    gap: 7,
    padding: 3,
  },
  quantityButton: {
    alignItems: "center",
    backgroundColor: "theme.green900",
    borderCurve: "continuous",
    borderRadius: 999,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  quantityButtonDisabled: {
    opacity: 0.38,
  },
  quantity: {
    color: "#111111",
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    fontWeight: "700",
    minWidth: 14,
    textAlign: "center",
  },
});
