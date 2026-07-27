import { useCommandesClient } from "@/hooks/useCommandesClient";
import { useStore } from "@/store";
import { Link } from "expo-router";
import {
  ChevronRight,
  CreditCard,
  Headphones,
  Heart,
  Info,
  LogOut,
  MapPin,
  ShoppingBag,
  Ticket,
} from "lucide-react-native";
import React, { useEffect } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Stat = {
  icon: React.ReactNode;
  value: number;
  label: string;
};

type MenuItem = {
  icon: React.ReactNode;
  label: string;
  route?: string;
  onPress?: () => void;
};

// ---------------------------------------------------------------------------
// Sous-composants
// ---------------------------------------------------------------------------

function StatBlock({ icon, value, label }: Stat) {
  return (
    <View className="flex-1 items-center gap-1">
      {icon}
      <Text className="text-lg font-bold text-ink-900">{value}</Text>
      <Text className="text-xs text-ink-500">{label}</Text>
    </View>
  );
}

function MenuRow({ icon, label, route, onPress }: MenuItem) {
  return (
    <Pressable
      //   onPress={onPress ?? (() => route && router.push(route as any))}
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

// ---------------------------------------------------------------------------
// Écran principal
// ---------------------------------------------------------------------------

export default function ProfilScreen() {
  const insets = useSafeAreaInsets();

  const client = useStore((s) => s.client);
  const logout = useStore((s) => s.logout);
  const favorites = useStore((s) => s.favorites);
  const adresses = useStore((s) => s.adresses);
  const loadAdresses = useStore((s) => s.loadAdresses);

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    loadAdresses();
  }, [loadAdresses]);

  const {
    data: commandes,
  } = useCommandesClient();

  const stats: Stat[] = [
    {
      icon: <ShoppingBag size={20} color="#14532d" />,
      value: commandes?.length ?? 0,
      label: "Commandes",
    },
    {
      icon: (
        <Heart
          size={20}
          color={favorites.length > 0 ? "#ef4444" : "#14532d"}
          fill={favorites.length > 0 ? "#ef4444" : "none"}
        />
      ),
      value: favorites.length,
      label: "Favoris",
    },
    {
      icon: <MapPin size={20} color="#14532d" />,
      value: adresses.length,
      label: "Adresses",
    },
  ];

  const menuItems: MenuItem[] = [
    {
      icon: <ShoppingBag size={20} color="#374151" />,
      label: "Historique de commandes",
      route: "/commandes/historique",
    },
    {
      icon: <MapPin size={20} color="#374151" />,
      label: "Mes adresses",
      route: "/profil/adresses",
    },
    {
      icon: <CreditCard size={20} color="#374151" />,
      label: "Modes de paiement",
      route: "/profil/paiement",
    },
    {
      icon: <Ticket size={20} color="#374151" />,
      label: "Coupons & Offres",
      route: "/profil/coupons",
    },
    {
      icon: <Headphones size={20} color="#374151" />,
      label: "Aide & Support",
      route: "/profil/support",
    },
    {
      icon: <Info size={20} color="#374151" />,
      label: "À propos",
      route: "/profil/a-propos",
    },
  ];

  if (!client) {
    return (
      <SafeAreaView className="flex-1 bg-white px-6 pt-8">
        <Text className="text-3xl font-bold text-brand-600 mb-2">
          Mon profil
        </Text>
        <Text className="text-gray-500 mb-10">
          Connectez-vous pour accéder à vos informations et commandes
        </Text>

        <View className="gap-4">
          <Link href="/auth/login" asChild>
            <TouchableOpacity className="bg-brand-500 rounded-xl p-4">
              <Text className="text-white font-bold text-center text-lg">
                Se connecter
              </Text>
            </TouchableOpacity>
          </Link>
          <Link href="/auth/register" asChild>
            <TouchableOpacity className="bg-white border-2 border-brand-500 rounded-xl p-4">
              <Text className="text-brand-500 font-bold text-center text-lg">
                Créer un compte
              </Text>
            </TouchableOpacity>
          </Link>
          {/* <Link href="/(tabs)" asChild>
            <TouchableOpacity className="mt-2 self-center">
              <Text className="text-ink-500 text-sm">
                Continuer sans compte
              </Text>
            </TouchableOpacity>
          </Link> */}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-ink-50">
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={{ paddingTop: insets.top }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 70 }}
      >
        {/* Header */}
        <View className="items-center justify-center h-10 w-full mb-10">
          <Image
            source={require("@/assets/images/logo-restauci2.png")}
            resizeMode="contain"
            style={{ width: "100%", height: "100%" }}
          />
        </View>

        {/* Bannière verte + stats qui chevauchent */}
        <View className="px-4">
          <View className="rounded-3xl bg-green-900 px-5 pt-6 pb-14">
            <View className="flex-row items-center gap-4">
              <Image
                source={require("@/assets/images/utilisateur.png")}
                className="h-16 w-16 rounded-full border-2 border-white/40"
              />
              <View className="flex-1">
                <Text className="text-xl font-bold text-white">
                  Salut, {client.nom} ! 👋
                </Text>
                <Text className="mt-1 text-sm text-white/80">
                  {client.telephone} {client.email && `• ${client.email}`}
                </Text>
              </View>
            </View>
          </View>

          {/* Carte stats — remonte sur la bannière */}
          <View className="-mt-10 mx-2 flex-row rounded-2xl bg-white px-2 py-4 shadow-sm shadow-black/10 elevation-2">
            {stats.map((s) => (
              <StatBlock key={s.label} {...s} />
            ))}
          </View>
        </View>

        {/* Carte Premium */}
        {/* <View className="mx-4 mt-5 rounded-3xl bg-green-50 px-5 py-6 overflow-hidden">
          <View className="flex-row items-center gap-2">
            <Crown size={20} color="warning" />
            <Text className="text-lg font-bold text-#14532d">
              Toutci Premium
            </Text>
          </View>
          <Text className="mt-2 text-sm leading-5 text-ink-600 pr-16">
            Profitez de la livraison offerte, d'offres exclusives et bien plus
            encore.
          </Text>
          <Pressable className="mt-4 self-start flex-row items-center gap-1 rounded-full bg-#14532d px-5 py-3 active:opacity-80">
            <Text className="text-sm font-semibold text-white">
              Passer Premium
            </Text>
            <ChevronRight size={58} />
          </Pressable>
        </View> */}

        {/* Liste de menu */}
        <View className="mx-4 mt-5 rounded-2xl bg-white overflow-hidden">
          {menuItems.map((item, i) => (
            <MenuRow key={item.label} {...item} />
          ))}
        </View>

        {/* Déconnexion */}
        <Pressable
          onPress={handleLogout}
          className="mx-4 mt-5 flex-row items-center justify-center gap-2 rounded-2xl bg-white py-4 border border-ink-100 active:bg-danger-50"
        >
          <LogOut size={18} color="#ef4444" />
          <Text className="text-base font-semibold text-danger-600">
            Se déconnecter
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
