import { useCommandesClient } from "@/hooks/useCommandesClient";
import { useStore } from "@/store";
import { useRouter } from "expo-router";
import type { Href } from "expo-router";
import {
  ChevronRight,
  Bell,
  Heart,
  Info,
  LogOut,
  MapPin,
  ShoppingBag,
} from "lucide-react-native";
import React from "react";
import { Image, Pressable, ScrollView, StatusBar, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Stat = {
  icon: React.ReactNode;
  value: number;
  label: string;
  route: Href;
};
type MenuItem = { icon: React.ReactNode; label: string; route: Href };

function StatBlock({ icon, value, label, route }: Stat) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(route)}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${value}`}
      className="flex-1 items-center gap-1 rounded-xl py-1 active:bg-ink-50"
    >
      {icon}
      <Text className="text-lg font-bold text-ink-900">{value}</Text>
      <Text className="text-xs text-ink-500">{label}</Text>
    </Pressable>
  );
}

function MenuRow({ icon, label, route }: MenuItem) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(route)}
      className="flex-row items-center justify-between py-4 px-5 border-b border-ink-100 active:bg-ink-50"
    >
      <View className="flex-row items-center gap-4">
        {icon}
        <Text className="text-base text-ink-900">{label}</Text>
      </View>
      <ChevronRight size={18} color="#9ca3af" />
    </Pressable>
  );
}

export default function ProfilScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const client = useStore((s) => s.client);
  const logout = useStore((s) => s.logout);
  const favorites = useStore((s) => s.favorites);
  const adresses = useStore((s) => s.adresses);

  const handleLogout = () => {
    void logout();
  };

  const { data: commandes, meta: commandesMeta } = useCommandesClient({
    limit: 1,
  });

  const stats: Stat[] = [
    {
      icon: <ShoppingBag size={20} color="#14532d" />,
      value: commandesMeta?.total ?? commandes.length,
      label: "Commandes",
      route: "/(tabs)/commandes",
    },
    {
      icon: (
        <Heart size={20} color={favorites.length > 0 ? "#ef4444" : "#14532d"} fill={favorites.length > 0 ? "#ef4444" : "none"} />
      ),
      value: favorites.length,
      label: "Favoris",
      route: "/(tabs)/profil/favoris",
    },
    {
      icon: <MapPin size={20} color="#14532d" />,
      value: adresses.length,
      label: "Adresses",
      route: "/(tabs)/profil/adresses",
    },
  ];

  const menuItems: MenuItem[] = [
    { icon: <Bell size={20} color="#374151" />, label: "Notifications", route: "/profil/notifications" },
    { icon: <MapPin size={20} color="#374151" />, label: "Mes adresses", route: "/profil/adresses" },
    { icon: <Info size={20} color="#374151" />, label: "À propos", route: "/profil/a-propos" },
  ];

  return (
    <View className="flex-1 bg-ink-50">
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={{ paddingTop: insets.top }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 70 }}
      >
        <View className="items-center justify-center h-20 w-full">
          <Image
            source={require("@/assets/images/toutci-logo-transparent.png")}
            resizeMode="contain"
            style={{ width: "100%", height: "100%" }}
          />
        </View>

        <View className="px-4">
          <View className="rounded-3xl bg-green-900 px-5 pt-6 pb-14">
            <View className="flex-row items-center gap-4">
              <Image
                source={require("@/assets/images/utilisateur.png")}
                className="h-16 w-16 rounded-full border-2 border-white/40"
              />
              <View className="flex-1">
                <Text className="text-xl font-bold text-white">
                  {client ? `Salut, ${client.nom} ! 👋` : "Bienvenue sur ToutCi"}
                </Text>
                {client ? (
                  <Text className="mt-1 text-sm text-white/80">
                    {client.telephone} {client.email && `• ${client.email}`}
                  </Text>
                ) : (
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: "/auth/login",
                        params: { redirectTo: "/(tabs)" },
                      })
                    }
                    accessibilityRole="button"
                    className="mt-2 self-start rounded-full bg-white/15 px-3 py-2"
                  >
                    <Text className="text-sm font-bold text-white">
                      Se connecter
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          </View>

          <View className="-mt-10 mx-2 flex-row rounded-2xl bg-white px-2 py-4 shadow-sm shadow-black/10 elevation-2">
            {stats.map((s) => (
              <StatBlock key={s.label} {...s} />
            ))}
          </View>
        </View>

        <View className="mx-4 mt-5 rounded-2xl bg-white overflow-hidden">
          {menuItems.map((item) => (
            <MenuRow key={item.label} {...item} />
          ))}
        </View>

        {client && (
          <Pressable
            onPress={handleLogout}
            className="mx-4 mt-5 flex-row items-center justify-center gap-2 rounded-2xl bg-white py-4 border border-ink-100 active:bg-danger-50"
          >
            <LogOut size={18} color="#ef4444" />
            <Text className="text-base font-semibold text-danger-600">
              Se déconnecter
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}
