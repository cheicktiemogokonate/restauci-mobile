import { SymbolView, type SymbolViewProps } from "expo-symbols";
import regular from "expo-symbols/androidWeights/regular";
import { View } from "react-native";

export const restaurantDetailIcons = {
  back: { ios: "chevron.left", android: "chevron_left" },
  share: {
    ios: "point.3.connected.trianglepath.dotted",
    android: "share",
  },
  heart: { ios: "heart", android: "favorite_border" },
  heartFilled: { ios: "heart.fill", android: "favorite" },
  star: { ios: "star", android: "star" },
  menu: { ios: "book.pages", android: "menu_book" },
  directions: { ios: "location", android: "directions" },
  phone: { ios: "phone", android: "phone" },
  website: { ios: "globe", android: "language" },
  next: { ios: "chevron.right", android: "chevron_right" },
  calendar: { ios: "calendar", android: "calendar_today" },
  guests: { ios: "person.2", android: "people" },
  house: { ios: "house", android: "home" },
  shield: { ios: "checkmark.shield", android: "verified_user" },
} satisfies Record<string, SymbolViewProps["name"]>;

interface RestaurantDetailIconProps {
  frameSize: number;
  name: SymbolViewProps["name"];
  size: number;
}

export function RestaurantDetailIcon({
  frameSize,
  name,
  size,
}: RestaurantDetailIconProps) {
  return (
    <View
      pointerEvents="none"
      style={{
        alignItems: "center",
        height: frameSize,
        justifyContent: "center",
        width: frameSize,
      }}
    >
      <SymbolView
        name={name}
        resizeMode="scaleAspectFit"
        scale="medium"
        size={size}
        tintColor="#111111"
        weight={{ ios: "regular", android: regular }}
      />
    </View>
  );
}
