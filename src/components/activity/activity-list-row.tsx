import type { ActivityItem } from "@/domain/activity";
import { formatPrix } from "@/lib/format";
import { Image } from "expo-image";
import { ChevronRight, UserRound } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

const ORDER_FALLBACK = require("../../../assets/images/food2.jpeg");
const STAY_FALLBACK = require("../../../assets/images/default_hero_bg.jpg");
const BLUR_HASH = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";

interface ActivityListRowProps {
  index: number;
  isLast: boolean;
  item: ActivityItem;
  onPress: () => void;
  variant: "history" | "upcoming" | "recent";
}

function formatDate(value: string, includeYear = false): string {
  const source = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T12:00:00`
    : value;
  const date = new Date(source);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    ...(includeYear ? { year: "numeric" as const } : {}),
  });
}

function rowDetails(item: ActivityItem): {
  amount: string | null;
  meta: string;
  secondary: string | null;
} {
  if (item.kind === "order") {
    return {
      amount: formatPrix(item.amount),
      meta: `${item.status} · ${formatDate(item.sortAt)}`,
      secondary: null,
    };
  }

  return {
    amount:
      item.phase === "recent" || item.phase === "history"
        ? formatPrix(item.amount)
        : null,
    meta: `${formatDate(item.checkIn)} – ${formatDate(item.checkOut)}`,
    secondary:
      item.phase === "upcoming"
        ? `${item.guests} voyageur${item.guests > 1 ? "s" : ""}`
        : item.status,
  };
}

export function ActivityListRow({
  index,
  isLast,
  item,
  onPress,
  variant,
}: ActivityListRowProps) {
  const details = rowDetails(item);
  const source = item.imageUrl
    ? { uri: item.imageUrl }
    : item.kind === "order"
      ? ORDER_FALLBACK
      : STAY_FALLBACK;

  return (
    <Animated.View entering={FadeInDown.delay(index * 32).duration(210)}>
      <Pressable
        accessibilityLabel={`${item.title}, ${item.status}`}
        accessibilityRole="button"
        onPress={onPress}
        style={[styles.row, !isLast && styles.rowDivider]}
      >
        <Image
          accessibilityLabel={`Visuel de ${item.title}`}
          cachePolicy="memory-disk"
          contentFit="cover"
          placeholder={{ blurhash: BLUR_HASH }}
          placeholderContentFit="cover"
          source={source}
          style={[
            styles.image,
            variant === "upcoming" && styles.upcomingImage,
          ]}
          transition={150}
        />

        <View style={styles.copy}>
          <Text numberOfLines={1} style={styles.title}>
            {item.title}
          </Text>
          <Text numberOfLines={1} style={styles.meta}>
            {details.meta}
          </Text>
          {details.secondary && (
            <View style={styles.secondaryRow}>
              {item.kind === "stay" && item.phase === "upcoming" && (
                <UserRound color="#5F605C" size={15} strokeWidth={1.9} />
              )}
              <Text numberOfLines={1} style={styles.secondary}>
                {details.secondary}
              </Text>
            </View>
          )}
          {details.amount && (
            <Text numberOfLines={1} style={styles.amount}>
              {details.amount}
            </Text>
          )}
        </View>

        {variant === "upcoming" && (
          <ChevronRight color="#94A3B8" size={20} strokeWidth={2} />
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  amount: {
    color: "#111111",
    fontSize: 14.5,
    fontVariant: ["tabular-nums"],
    fontWeight: "600",
    paddingTop: 2,
  },
  copy: {
    flex: 1,
    gap: 4,
    justifyContent: "center",
    minWidth: 0,
  },
  image: {
    backgroundColor: "#F1F5F9",
    borderCurve: "continuous",
    borderRadius: 14,
    height: 68,
    width: 68,
  },
  meta: {
    color: "theme.slate500",
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    fontWeight: "500",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    minHeight: 92,
    paddingVertical: 12,
  },
  rowDivider: {
    borderBottomColor: "rgba(0,0,0,0.06)",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  secondary: {
    color: "theme.slate500",
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
  },
  secondaryRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  title: {
    color: "#111111",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  upcomingImage: {
    height: 72,
    width: 72,
  },
});
