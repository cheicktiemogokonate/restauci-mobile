import { CheckoutForm } from "@/components/panier/checkout-form";
import { NavigationBackButton } from "@/components/navigation/navigation-back-button";
import {
  getSupportedCheckoutModes,
  type CheckoutMode,
} from "@/domain/checkout";
import { useRestaurant } from "@/hooks/useMenuRestaurant";
import { calculerDetailPanier } from "@/lib/tarification";
import { useStore } from "@/store";
import { selectSousTotal } from "@/store/selectors";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";

function CheckoutHeader({
  onBack,
  topInset,
}: {
  onBack: () => void;
  topInset: number;
}) {
  return (
    <View style={[styles.header, { paddingTop: topInset + 4 }]}>
      <NavigationBackButton
        accessibilityLabel="Revenir au panier"
        onPress={onBack}
      />
      <Text style={styles.headerTitle}>Paiement</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const items = useStore((state) => state.items);
  const restaurantSlug = useStore((state) => state.restaurantSlug);
  const viderPanier = useStore((state) => state.viderPanier);
  const sousTotal = useStore(selectSousTotal);
  const [selectedMode, setSelectedMode] = useState<CheckoutMode>("livraison");

  const restaurantQuery = useRestaurant(restaurantSlug);
  const restaurant = restaurantQuery.data;
  const supportedModes = useMemo(
    () => getSupportedCheckoutModes(restaurant?.modesCommande ?? []),
    [restaurant?.modesCommande],
  );
  const effectiveMode = supportedModes.includes(selectedMode)
    ? selectedMode
    : supportedModes[0] ?? "livraison";
  const detail = calculerDetailPanier({
    sousTotal,
    fraisLivraisonBase: restaurant?.fraisLivraison ?? 0,
    modeLivraison: effectiveMode === "livraison",
  });

  useEffect(() => {
    if (!restaurantSlug || items.length === 0) {
      router.replace("/panier");
    }
  }, [items.length, restaurantSlug, router]);

  const handleSuccess = (commandeId: string, paymentUrl: string | null) => {
    viderPanier();

    const destination = commandeId
      ? (`/(tabs)/commandes/${commandeId}` as const)
      : ("/(tabs)/activite" as const);

    if (paymentUrl) {
      void Linking.openURL(paymentUrl).catch(() => {
        Alert.alert(
          "Paiement à reprendre",
          "La commande est enregistrée. Reprenez le paiement Paystack depuis le suivi.",
        );
      });
    }

    router.replace(destination);
  };

  if (!restaurantSlug || items.length === 0) return null;

  return (
    <View style={styles.page}>
      <StatusBar barStyle="dark-content" />
      <CheckoutHeader onBack={() => router.back()} topInset={insets.top} />

      {restaurantQuery.isPending ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={theme.green900} size="large" />
          <Text style={styles.stateMessage}>Préparation du paiement…</Text>
        </View>
      ) : restaurantQuery.isError || !restaurant ? (
        <Animated.View entering={FadeIn.duration(180)} style={styles.centerState}>
          <Text style={styles.stateTitle}>Paiement indisponible</Text>
          <Text style={styles.stateMessage}>
            Impossible de vérifier les conditions du restaurant.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={[styles.returnButton]}
          >
            <Text style={styles.returnButtonLabel}>Retour au panier</Text>
          </Pressable>
        </Animated.View>
      ) : (
        <CheckoutForm
          commandeMinimum={restaurant.commandeMinimum}
          modesCommande={restaurant.modesCommande}
          onModeChange={setSelectedMode}
          onSuccess={handleSuccess}
          restaurantDisponible={Boolean(
            restaurant.enLigne && restaurant.accepteCommandes,
          )}
          restaurantSlug={restaurantSlug}
          sousTotal={sousTotal}
          total={detail.total}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centerState: {
    alignItems: "center",
    flex: 1,
    gap: 10,
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 70,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  headerSpacer: {
    height: 48,
    width: 48,
  },
  headerTitle: {
    color: "#111111",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.35,
  },
  page: {
    backgroundColor: "transparent",
    flex: 1,
  },
  returnButton: {
    alignItems: "center",
    backgroundColor: theme.green900,
    borderCurve: "continuous",
    borderRadius: 999,
    justifyContent: "center",
    marginTop: 8,
    minHeight: 50,
    paddingHorizontal: 24,
  },
  returnButtonLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  stateMessage: {
    color: "#74746F",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  stateTitle: {
    color: "#111111",
    fontSize: 20,
    fontWeight: "800",
  },
});
