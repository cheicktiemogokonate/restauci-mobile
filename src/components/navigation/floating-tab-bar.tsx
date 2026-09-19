import { Tabs } from "expo-router";
import { useCallback, type ComponentProps } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TabsProps = ComponentProps<typeof Tabs>;
export type FloatingTabBarProps = Parameters<
  NonNullable<TabsProps["tabBar"]>
>[0];
type FloatingTabRoute = FloatingTabBarProps["state"]["routes"][number];

const VISIBLE_ROUTES = new Set(["index", "activite", "profil"]);

export function FloatingTabBar({
  state,
  descriptors,
  navigation,
}: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();
  const activeRouteName = state.routes[state.index]?.name;

  const handleTabPress = useCallback(
    (route: FloatingTabRoute, isFocused: boolean) => {
      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    },
    [navigation],
  );

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        right: 20,
        bottom: Math.max(insets.bottom, 12),
        left: 20,
      }}
    >
      <View
        style={{
          minHeight: 84,
          flexDirection: "row",
          alignItems: "stretch",
          borderRadius: 44,
          borderCurve: "continuous",
          backgroundColor: "rgba(255, 255, 255, 0.97)",
          padding: 7,
          boxShadow: "0 10px 30px rgba(17, 24, 39, 0.16)",
        }}
      >
        {state.routes.map((route, index) => {
          if (!VISIBLE_ROUTES.has(route.name)) return null;

          const { options } = descriptors[route.key];
          const label =
            typeof options.tabBarLabel === "string"
              ? options.tabBarLabel
              : typeof options.title === "string"
                ? options.title
                : route.name;
          const isCurrentRoute = state.index === index;
          const isFocused =
            isCurrentRoute ||
            (route.name === "activite" && activeRouteName === "commandes");
          const color = isFocused ? "#111827" : "#5F6368";

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              testID={options.tabBarButtonTestID}
              onPress={() => handleTabPress(route, isCurrentRoute)}
              onLongPress={() =>
                navigation.emit({
                  type: "tabLongPress",
                  target: route.key,
                })
              }
              activeOpacity={0.72}
              style={{ flex: 1, minWidth: 0 }}
            >
              <Animated.View
                layout={LinearTransition.springify().damping(18).stiffness(180)}
                style={{
                  flex: 1,
                  minHeight: 70,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                  borderRadius: 36,
                  borderCurve: "continuous",
                  backgroundColor: isFocused ? "#F1F2F3" : "transparent",
                }}
              >
                {options.tabBarIcon?.({
                  focused: isFocused,
                  color,
                  size: 25,
                })}
                <Text
                  numberOfLines={1}
                  style={{
                    color,
                    fontSize: 11.5,
                    lineHeight: 15,
                    fontWeight: isFocused ? "700" : "500",
                  }}
                >
                  {label}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
