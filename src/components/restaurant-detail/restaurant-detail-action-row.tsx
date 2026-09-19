import {
  RestaurantDetailIcon,
  restaurantDetailIcons,
} from "@/components/restaurant-detail/restaurant-detail-icon";
import type { SymbolViewProps } from "expo-symbols";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface RestaurantDetailActionRowProps {
  icon: SymbolViewProps["name"];
  title: string;
  subtitle: string;
  onPress: () => void;
}

export function RestaurantDetailActionRow({
  icon,
  title,
  subtitle,
  onPress,
}: RestaurantDetailActionRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      onPress={onPress}
      style={[styles.row]}
    >
      <RestaurantDetailIcon frameSize={48} name={icon} size={29} />

      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        <Text numberOfLines={1} style={styles.subtitle}>
          {subtitle}
        </Text>
      </View>

      <RestaurantDetailIcon
        frameSize={26}
        name={restaurantDetailIcons.next}
        size={18}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 78,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 12,
  },
  title: {
    color: "#111111",
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 23,
  },
  subtitle: {
    color: "#6E6E72",
    fontSize: 15,
    lineHeight: 21,
    marginTop: 2,
  },
});
