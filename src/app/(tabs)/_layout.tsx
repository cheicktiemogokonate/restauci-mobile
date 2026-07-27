import { useStore } from "@/store";
import { Tabs, useRouter } from "expo-router";
import { List, Map, ShoppingBag, User } from "lucide-react-native";
import { useCallback } from "react";
import { StatusBar, Text, TouchableOpacity, View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const client = useStore((s) => s.client);
  const router = useRouter();

  return (
    <View
      style={{
        position: "absolute",
        bottom: insets.bottom > 0 ? insets.bottom : 20,
        left: 20,
        right: 20,
        flexDirection: "row",
        backgroundColor: "#f9fafb",
        borderRadius: 40,
        padding: 6,
        justifyContent: "space-between",
        alignItems: "center",
        shadowColor: "#111827",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 8,
      }}
    >
      {state.routes.map((route: any, index: any) => {
        const { options } = descriptors[route.key];

        // Seuls ces écrans apparaîtront dans la tab bar
        const allowedRoutes = ["index", "commandes/index", "panier", "profil"];
        if (!allowedRoutes.includes(route.name)) {
          return null;
        }

        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            if (route.name === "profil" && !client) {
              router.push("/auth/login");
            } else {
              navigation.navigate(route.name, route.params);
            }
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={{ flex: isFocused ? 1 : 0.6, alignItems: "center" }}
            activeOpacity={0.8}
          >
            <Animated.View
              layout={LinearTransition.springify().damping(15).stiffness(150)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isFocused ? "#14532d" : "transparent",
                borderRadius: 30,
                paddingVertical: 10,
                paddingHorizontal: isFocused ? 16 : 10,
                borderWidth: isFocused ? 1 : 0,
                borderColor: "#14532d",
              }}
            >
              {options.tabBarIcon
                ? options.tabBarIcon({
                    focused: isFocused,
                    color: isFocused ? "#ffffff" : "#14532d",
                    size: 20,
                  })
                : null}
              {isFocused && (
                <Animated.Text
                  style={{
                    color: "#ffffff",
                    marginLeft: 6,
                    fontWeight: "600",
                    fontSize: 13,
                  }}
                  numberOfLines={1}
                >
                  {label}
                </Animated.Text>
              )}
              {/* Optional: Add badge if required by design. Right now keeping it minimal or handling via a small dot. */}
              {options.tabBarBadge !== undefined && (
                <View
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    backgroundColor: "#DC2626",
                    borderRadius: 10,
                    width: 14,
                    height: 14,
                    justifyContent: "center",
                    alignItems: "center",
                    borderWidth: 1.5,
                    borderColor: isFocused ? "#386b2a" : "#14532d",
                  }}
                >
                  <Text
                    style={{ color: "white", fontSize: 8, fontWeight: "bold" }}
                  >
                    {options.tabBarBadge}
                  </Text>
                </View>
              )}
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const nombre = useStore((s) =>
    s.items.reduce((sum, i) => sum + i.quantite, 0),
  );

  // Mémoriser la prop tabBar pour éviter de re-monter les écrans
  // (dont la carte) à chaque re-rendu déclenché par le store.
  const renderTabBar = useCallback(
    (props: any) => <CustomTabBar {...props} />,
    [],
  );

  return (
    <>
      <StatusBar barStyle={"dark-content"} />

      <Tabs
        tabBar={renderTabBar}
        detachInactiveScreens={false} // Empêche la destruction de la vue native de l'onglet sur Android
        screenOptions={{
          headerShown: false,
          // On peut aussi éviter que la vue soit freeze en arrière-plan
          freezeOnBlur: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Carte",
            tabBarIcon: ({ color, size }) => (
              <Map color={color} size={size} strokeWidth={2.5} />
            ),
          }}
        />

        <Tabs.Screen
          name="commandes"
          options={{
            title: "Commandes",
            tabBarIcon: ({ color, size }) => (
              <List color={color} size={size} strokeWidth={2.5} />
            ),
          }}
        />
        <Tabs.Screen
          name="panier"
          options={{
            title: "Panier",
            tabBarBadge: nombre > 0 ? nombre : undefined,
            tabBarIcon: ({ color, size }) => (
              <ShoppingBag color={color} size={size} strokeWidth={2.5} />
            ),
          }}
        />
        <Tabs.Screen
          name="itineraire/[id]"
          options={{
            title: "Itinéraire",
            href: null,
          }}
        />
        <Tabs.Screen
          name="profil"
          options={{
            title: "Profil",
            tabBarIcon: ({ color, size }) => (
              <User color={color} size={size} strokeWidth={2.5} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
