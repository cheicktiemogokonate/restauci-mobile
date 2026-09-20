import {
  ProfileMenuSection,
  type ProfileMenuItem,
} from "@/components/profil/profile-menu-section";
import { useClientNotifications } from "@/hooks/useClientNotifications";
import { useCommandesClient } from "@/hooks/useCommandesClient";
import { useStore } from "@/store";
import { Link, type Href } from "expo-router";
import {
  Bell,
  Check,
  Info,
  LogOut,
  MapPin
} from "lucide-react-native";
import { useMemo } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  useReducedMotion,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";

interface ProfileStatProps {
  label: string;
  route: Href;
  value: number | null;
}

function ProfileStat({ label, route, value }: ProfileStatProps) {
  const displayValue = value === null ? "—" : String(value);

  return (
    <Link href={route} asChild>
      <Pressable
        accessibilityLabel={`${label}, ${displayValue}`}
        accessibilityRole="button"
        style={styles.stat}
      >
        <Text style={styles.statValue}>{displayValue}</Text>
        <Text numberOfLines={1} style={styles.statLabel}>
          {label}
        </Text>
      </Pressable>
    </Link>
  );
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "TC";
  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const client = useStore((state) => state.client);
  const logout = useStore((state) => state.logout);
  const favorites = useStore((state) => state.favorites);
  const addresses = useStore((state) => state.adresses);
  const orders = useCommandesClient({ limit: 1 });
  const notifications = useClientNotifications();

  const orderCount = orders.isPending
    ? null
    : (orders.meta?.total ?? orders.data.length);
  const unreadCount = notifications.data?.unreadCount ?? 0;
  const initials = getInitials(client?.nom ?? "ToutCi");

  const accountItems = useMemo<ProfileMenuItem[]>(
    () => [
      {
        description: `${addresses.length} lieu${addresses.length === 1 ? "" : "x"} enregistré${addresses.length === 1 ? "" : "s"}`,
        icon: MapPin,
        label: "Mes adresses",
        route: "/(tabs)/profil/adresses",
      },
      {
        description: "Informations et engagements de l’application",
        icon: Info,
        label: "À propos",
        route: "/(tabs)/profil/a-propos",
      },
    ],
    [addresses.length],
  );

  const handleLogout = () => {
    Alert.alert(
      "Se déconnecter ?",
      "Vous devrez vous identifier à nouveau pour accéder à votre profil.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Se déconnecter",
          style: "destructive",
          onPress: () => void logout(),
        },
      ],
    );
  };

  if (!client) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header Bar — positionnement soigné sous la Dynamic Island / encoche */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.topBarTitle}>Profil</Text>
        <Link href="/(tabs)/profil/notifications" asChild>
          <Pressable
            accessibilityLabel={
              unreadCount > 0
                ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`
                : "Ouvrir les notifications"
            }
            accessibilityRole="button"
            style={styles.notificationButton}
          >
            <Bell color={theme.brandDark} size={19} strokeWidth={2} />
            {unreadCount > 0 && <View style={styles.notificationDot} />}
          </Pressable>
        </Link>
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: insets.bottom + 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
        style={styles.page}
      >
        {/* Hero Section — profil épuré, avatar proportionné */}
        <Animated.View entering={reduceMotion ? undefined : FadeInDown.duration(260)} style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
            {client.actif === true && (
              <View style={styles.verifiedBadge}>
                <Check color="#FFFFFF" size={11} strokeWidth={2.8} />
              </View>
            )}
          </View>

          <Text selectable style={styles.name}>
            {client.nom}
          </Text>

          <View style={styles.contactPill}>
            <Text numberOfLines={1} selectable style={styles.contactText}>
              {client.telephone || client.email}
            </Text>
          </View>
        </Animated.View>

        {/* Statistiques clés */}
        <Animated.View
          entering={reduceMotion ? undefined : FadeInDown.delay(50).duration(260)}
          style={styles.statsSurface}
        >
          <ProfileStat
            label="Commandes"
            route="/(tabs)/activite"
            value={orderCount}
          />
          <View style={styles.statSeparator} />
          <ProfileStat
            label="Favoris"
            route="/(tabs)/profil/favoris"
            value={favorites.length}
          />
          <View style={styles.statSeparator} />
          <ProfileStat
            label="Adresses"
            route="/(tabs)/profil/adresses"
            value={addresses.length}
          />
        </Animated.View>

        {/* Sections de navigation */}
        <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(130).duration(260)}>
          <ProfileMenuSection items={accountItems} title="" />
        </Animated.View>

        {/* Déconnexion */}
        <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(210).duration(260)}>
          <Pressable
            accessibilityLabel="Se déconnecter"
            accessibilityRole="button"
            onPress={handleLogout}
            style={styles.logoutButton}
          >
            <LogOut color={theme.danger700} size={17} strokeWidth={2} />
            <Text style={styles.logoutLabel}>Se déconnecter</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  topBarTitle: {
    color: theme.ink900,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  notificationButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(0,0,0,0.06)",
    borderRadius: 999,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    position: "relative",
    width: 42,
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  notificationDot: {
    backgroundColor: "#E11D48",
    borderColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 2,
    height: 10,
    position: "absolute",
    right: 8,
    top: 8,
    width: 10,
  },
  page: {
    flex: 1,
  },
  content: {
    gap: 16,
    paddingHorizontal: 18,
    paddingTop: 2,
  },
  hero: {
    alignItems: "center",
    paddingVertical: 8,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: "#EAF2EC",
    borderColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 3,
    height: 84,
    justifyContent: "center",
    position: "relative",
    width: 84,
    boxShadow: "0 2px 6px rgba(24,60,42,0.08)",
  },
  avatarText: {
    color: theme.brandDark,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  verifiedBadge: {
    alignItems: "center",
    backgroundColor: theme.brandDark,
    borderColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 2,
    bottom: 0,
    height: 22,
    justifyContent: "center",
    position: "absolute",
    right: 0,
    width: 22,
  },
  name: {
    color: theme.ink900,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginTop: 10,
    textAlign: "center",
  },
  contactPill: {
    backgroundColor: "rgba(24,60,42,0.05)",
    borderRadius: 999,
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  contactText: {
    color: theme.ink600,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  statsSurface: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(0,0,0,0.06)",
    borderRadius: 18,
    borderWidth: 1,
    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
    flexDirection: "row",
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  stat: {
    alignItems: "center",
    flex: 1,
    gap: 3,
    justifyContent: "center",
    minWidth: 0,
    paddingVertical: 10,
  },
  statValue: {
    color: theme.brandDark,
    fontSize: 20,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  statLabel: {
    color: theme.ink500,
    fontSize: 12,
    fontWeight: "500",
  },
  statSeparator: {
    backgroundColor: theme.ink100,
    height: 26,
    width: 1,
  },
  logoutButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#FEE2E2",
    borderRadius: 16,
    borderWidth: 1,
    boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 20,
    marginTop: 2,
  },
  logoutLabel: {
    color: theme.danger700,
    fontSize: 14,
    fontWeight: "600",
  },
});
