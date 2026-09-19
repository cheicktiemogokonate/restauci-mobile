import { MAX_ITEM_QUANTITY } from "@/domain/checkout";
import { formatPrix } from "@/lib/format";
import type { PanierItem } from "@/types";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { Minus, Plus, Trash2 } from "lucide-react-native";
import { memo, useCallback } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  FadeInDown,
  LinearTransition,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

const FALLBACK_IMAGE = require("../../../assets/images/plat-placeholder.jpg");
const BLUR_HASH = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";

interface PanierItemRowProps {
  article: PanierItem;
  index: number;
  isLast: boolean;
  onDecrement: () => void;
  onIncrement: () => void;
  onRemove: () => void;
}

function lightHaptic() {
  if (process.env.EXPO_OS === "ios") {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

function DeleteAction({
  progress,
  swipeable,
  onRemove,
}: {
  progress: SharedValue<number>;
  swipeable: SwipeableMethods;
  onRemove: () => void;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.35, 1], [0, 0.65, 1]),
    transform: [
      { scale: interpolate(progress.value, [0, 1], [0.86, 1]) },
    ],
  }));

  return (
    <Animated.View style={[styles.deleteFrame, animatedStyle]}>
      <Pressable
        accessibilityLabel="Supprimer cet article"
        accessibilityRole="button"
        onPress={() => {
          swipeable.close();
          onRemove();
        }}
        style={[styles.deleteButton]}
      >
        <Trash2 color="#FFFFFF" size={20} strokeWidth={2.1} />
        <Text style={styles.deleteLabel}>Supprimer</Text>
      </Pressable>
    </Animated.View>
  );
}

export const PanierItemRow = memo(function PanierItemRow({
  article,
  index,
  isLast,
  onDecrement,
  onIncrement,
  onRemove,
}: PanierItemRowProps) {
  const isMinimum = article.quantite <= 1;
  const isMaximum = article.quantite >= MAX_ITEM_QUANTITY;

  const handleRemove = useCallback(() => {
    lightHaptic();
    Alert.alert(
      "Retirer cet article ?",
      `« ${article.nom} » sera supprimé du panier.`,
      [
        { text: "Annuler", style: "cancel" },
        { text: "Retirer", style: "destructive", onPress: onRemove },
      ],
      { cancelable: true },
    );
  }, [article.nom, onRemove]);

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 5) * 35).duration(220)}
      layout={LinearTransition.duration(180)}
    >
      <ReanimatedSwipeable
        childrenContainerStyle={styles.swipeContent}
        friction={1.5}
        overshootRight={false}
        renderRightActions={(progress, _translation, swipeable) => (
          <DeleteAction
            onRemove={handleRemove}
            progress={progress}
            swipeable={swipeable}
          />
        )}
        rightThreshold={38}
      >
        <View style={[styles.row, !isLast && styles.rowDivider]}>
          <Image
            cachePolicy="memory-disk"
            contentFit="cover"
            placeholder={{ blurhash: BLUR_HASH }}
            placeholderContentFit="cover"
            source={article.photoUrl || FALLBACK_IMAGE}
            style={styles.image}
            transition={140}
          />

          <View style={styles.copy}>
            <Text numberOfLines={1} style={styles.name}>
              {article.nom}
            </Text>
            <Text numberOfLines={1} style={styles.price}>
              {formatPrix(article.prix)}
            </Text>
          </View>

          <View style={styles.quantityControl}>
            <Pressable
              accessibilityLabel={`Retirer une unité de ${article.nom}`}
              accessibilityRole="button"
              accessibilityState={{ disabled: isMinimum }}
              disabled={isMinimum}
              hitSlop={5}
              onPress={() => {
                lightHaptic();
                onDecrement();
              }}
              style={[
                styles.quantityButton,
                isMinimum && styles.quantityButtonDisabled,
              ]}
            >
              <Minus color="#111111" size={15} strokeWidth={2.1} />
            </Pressable>

            <Text style={styles.quantity}>{article.quantite}</Text>

            <Pressable
              accessibilityLabel={`Ajouter une unité de ${article.nom}`}
              accessibilityRole="button"
              accessibilityState={{ disabled: isMaximum }}
              disabled={isMaximum}
              hitSlop={5}
              onPress={() => {
                lightHaptic();
                onIncrement();
              }}
              style={[
                styles.quantityButton,
                isMaximum && styles.quantityButtonDisabled,
              ]}
            >
              <Plus color="#111111" size={15} strokeWidth={2.1} />
            </Pressable>
          </View>
        </View>
      </ReanimatedSwipeable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  copy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  deleteButton: {
    alignItems: "center",
    backgroundColor: "#D7352E",
    borderCurve: "continuous",
    borderRadius: 18,
    flex: 1,
    gap: 5,
    justifyContent: "center",
  },
  deleteFrame: {
    paddingLeft: 8,
    width: 88,
  },
  deleteLabel: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  image: {
    backgroundColor: "#F0F0EC",
    borderColor: "rgba(17,17,17,0.06)",
    borderCurve: "continuous",
    borderRadius: 16,
    borderWidth: 1,
    height: 62,
    width: 62,
  },
  name: {
    color: "#111111",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  price: {
    color: "#74746F",
    fontSize: 12.5,
    fontVariant: ["tabular-nums"],
    fontWeight: "500",
    lineHeight: 17,
  },
  quantity: {
    color: "#111111",
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    fontWeight: "700",
    minWidth: 22,
    textAlign: "center",
  },
  quantityButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.96)",
    borderCurve: "continuous",
    borderRadius: 999,
    boxShadow: "0 2px 7px rgba(17,17,17,0.07)",
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  quantityButtonDisabled: {
    opacity: 0.34,
  },
  quantityControl: {
    alignItems: "center",
    backgroundColor: "#F3F3EF",
    borderCurve: "continuous",
    borderRadius: 999,
    flexDirection: "row",
    gap: 3,
    padding: 3,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 11,
    minHeight: 82,
    paddingHorizontal: 2,
    paddingVertical: 10,
  },
  rowDivider: {
    borderBottomColor: "rgba(17,17,17,0.07)",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  swipeContent: {
    backgroundColor: "transparent",
  },
});
