import {
  FloatingTabBar,
  type FloatingTabBarProps,
} from "@/components/navigation/floating-tab-bar";
import { Tabs } from "expo-router";
import { Clock3, Compass, User } from "lucide-react-native";
import { useCallback } from "react";
import { StatusBar, View } from "react-native";

export default function TabLayout() {
  // Mémoriser la prop tabBar pour éviter de re-monter les écrans
  // (dont la carte) à chaque re-rendu déclenché par le store.
  const renderTabBar = useCallback(
    (props: FloatingTabBarProps) => <FloatingTabBar {...props} />,
    [],
  );

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle={"dark-content"} />

      <Tabs
        tabBar={renderTabBar}
        // Prop de navigateur (non déclinable par écran) : nécessaire pour que la
        // vue native MapLibre de l'onglet Carte ne soit pas détruite sur Android.
        detachInactiveScreens={false}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: "transparent" },
          // Par défaut on gèle les onglets inactifs ; seule la Carte est exemptée.
          freezeOnBlur: true,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Explorer",
            // La carte conserve son état natif (caméra, tuiles) hors focus.
            freezeOnBlur: false,
            tabBarIcon: ({ color, size }) => (
              <Compass color={color} size={size} strokeWidth={2.1} />
            ),
          }}
        />

        <Tabs.Screen
          name="activite"
          options={{
            title: "Activité",
            tabBarIcon: ({ color, size }) => (
              <Clock3 color={color} size={size} strokeWidth={2.1} />
            ),
          }}
        />
        <Tabs.Screen
          name="profil"
          options={{
            title: "Profil",
            tabBarIcon: ({ color, size }) => (
              <User color={color} size={size} strokeWidth={2.1} />
            ),
          }}
        />

        <Tabs.Screen name="commandes" options={{ href: null }} />
        <Tabs.Screen name="residences" options={{ href: null }} />
      </Tabs>
    </View>
  );
}
