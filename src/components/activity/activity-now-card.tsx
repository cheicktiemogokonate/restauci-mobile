import type { ActivityItem } from "@/domain/activity";
import { Image } from "expo-image";
import { ChefHat, ChevronRight, Clock3 } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

const ORDER_FALLBACK = require("../../../assets/images/food2.jpeg");
const STAY_FALLBACK = require("../../../assets/images/default_hero_bg.jpg");
const BLUR_HASH = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";

interface ActivityNowCardProps {
  item: ActivityItem;
  onPress: () => void;
  width: number;
}

function formatStayDate(value: string): string {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
      });
}

function OrderProgress({ activeIndex }: { activeIndex: number }) {
  return (
    <View
      accessibilityLabel={`Progression de la commande, étape ${activeIndex + 1} sur 3`}
      style={styles.progress}
    >
      {[0, 1, 2].map((index) => (
        <View
          key={index}
          style={[
            styles.progressSegment,
            index <= activeIndex && styles.progressSegmentReached,
          ]}
        />
      ))}
    </View>
  );
}

export function ActivityNowCard({
  item,
  onPress,
  width,
}: ActivityNowCardProps) {
  const isOrder = item.kind === "order";
  const source = item.imageUrl
    ? { uri: item.imageUrl }
    : isOrder
      ? ORDER_FALLBACK
      : STAY_FALLBACK;
  const rawDetail = isOrder
    ? `Commande ${item.numero}`
    : `${formatStayDate(item.checkIn)} – ${formatStayDate(item.checkOut)}`;

  // Éviter la répétition quand le titre et le détail sont identiques
  const orderDate = new Date(item.sortAt);
  const formattedTime = !Number.isNaN(orderDate.getTime())
    ? orderDate.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;
  const detail =
    isOrder && item.title.trim() === rawDetail.trim() && formattedTime
      ? formattedTime
      : rawDetail;

  const secondary = isOrder
    ? item.articleCount > 1
      ? `${item.articleCount} articles`
      : "1 article"
    : `${item.guests} voyageur${item.guests > 1 ? "s" : ""}`;

  return (
    <Animated.View entering={FadeInDown.duration(240)} style={{ width }}>
      <Pressable
        accessibilityLabel={`${item.title}, ${item.status}`}
        accessibilityRole="button"
        onPress={onPress}
        style={styles.card}
      >
        <View style={styles.mainRow}>
          <Image
            accessibilityLabel={`Visuel de ${item.title}`}
            cachePolicy="memory-disk"
            contentFit="cover"
            placeholder={{ blurhash: BLUR_HASH }}
            placeholderContentFit="cover"
            source={source}
            style={styles.image}
            transition={160}
          />

          <View style={styles.copy}>
            <Text numberOfLines={1} style={styles.title}>
              {item.title}
            </Text>
            <Text numberOfLines={1} style={styles.detail}>
              {detail}
            </Text>
            <View style={styles.statusRow}>
              {isOrder ? (
                <ChefHat color="#F04B2F" size={17} strokeWidth={2} />
              ) : (
                <Clock3 color="#183C2A" size={17} strokeWidth={2} />
              )}
              <Text
                numberOfLines={1}
                style={[styles.status, !isOrder && styles.stayStatus]}
              >
                {item.status}
              </Text>
            </View>
          </View>
        </View>

        {isOrder ? (
          <OrderProgress activeIndex={item.progressIndex} />
        ) : (
          <View style={styles.stayDivider} />
        )}

        <View style={styles.footer}>
          <Text numberOfLines={1} style={styles.secondary}>
            {secondary}
          </Text>
          <View style={styles.actionRow}>
            <Text style={styles.actionLabel}>{isOrder ? "Suivre" : "Voir"}</Text>
            <ChevronRight color="#183C2A" size={18} strokeWidth={2.4} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  actionLabel: {
    color: "#183C2A",
    fontSize: 15,
    fontWeight: "700",
  },
  actionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 2,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(0,0,0,0.06)",
    borderCurve: "continuous",
    borderRadius: 22,
    borderWidth: 1,
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    minHeight: 204,
    padding: 16,
  },
  copy: {
    flex: 1,
    gap: 5,
    justifyContent: "center",
    minWidth: 0,
  },
  detail: {
    color: "#6F706D",
    fontSize: 14,
    fontVariant: ["tabular-nums"],
    fontWeight: "500",
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 32,
    paddingTop: 12,
  },
  image: {
    backgroundColor: "#EFEFEA",
    borderCurve: "continuous",
    borderRadius: 20,
    height: 86,
    width: 86,
  },
  mainRow: {
    alignItems: "stretch",
    flexDirection: "row",
    gap: 14,
  },
  progress: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    paddingTop: 20,
  },
  progressSegment: {
    backgroundColor: "#DDDED9",
    borderRadius: 999,
    flex: 1,
    height: 4,
  },
  progressSegmentReached: {
    backgroundColor: "#F04B2F",
  },
  secondary: {
    color: "#666762",
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
  },
  status: {
    color: "#F04B2F",
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingTop: 7,
  },
  stayDivider: {
    backgroundColor: "rgba(17,17,17,0.09)",
    height: StyleSheet.hairlineWidth,
    marginTop: 20,
  },
  stayStatus: {
    color: "#14532D",
  },
  title: {
    color: "#111111",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.35,
  },
});
