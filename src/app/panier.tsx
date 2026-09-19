import { PanierItemRow } from "@/components/panier/panier-item-row";
import { NavigationBackButton } from "@/components/navigation/navigation-back-button";
import { getSupportedCheckoutModes } from "@/domain/checkout";
import { useRestaurant } from "@/hooks/useMenuRestaurant";
import { formatPrix } from "@/lib/format";
import { calculerDetailPanier } from "@/lib/tarification";
import { useStore } from "@/store";
import { selectSousTotal } from "@/store/selectors";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowRight, ShoppingBag } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function PanierToolbar({
  articleCount,
  onBack,
  topInset,
}: {
  articleCount: number;
  onBack: () => void;
  topInset: number;
}) {
  return (
    <View style={[styles.toolbar, { paddingTop: topInset + 4 }]}>
      <NavigationBackButton
        accessibilityLabel="Revenir à l’écran précédent"
        onPress={onBack}
      />

      <Text style={styles.toolbarTitle}>Panier</Text>

      <View style={styles.toolbarCartButton}>
        <ShoppingBag color="#111111" size={21} strokeWidth={1.9} />
        {articleCount > 0 && <View style={styles.toolbarCartDot} />}
      </View>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

export default function PanierScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { resumeCheckout } = useLocalSearchParams<{
    resumeCheckout?: string;
  }>();

  const items = useStore((state) => state.items);
  const client = useStore((state) => state.client);
  const restaurantSlug = useStore((state) => state.restaurantSlug);
  const ajouterItem = useStore((state) => state.ajouterItem);
  const retirerItem = useStore((state) => state.retirerItem);
  const supprimerItem = useStore((state) => state.supprimerItem);
  const viderPanier = useStore((state) => state.viderPanier);
  const sousTotal = useStore(selectSousTotal);

  const hasResumedCheckout = useRef(false);

  const restaurantQuery = useRestaurant(restaurantSlug);
  const restaurant = restaurantQuery.data;
  const supportedModes = useMemo(
    () => getSupportedCheckoutModes(restaurant?.modesCommande ?? []),
    [restaurant?.modesCommande],
  );
  const effectiveMode = supportedModes[0] ?? "livraison";

  const nombreArticles = useMemo(
    () => items.reduce((total, item) => total + item.quantite, 0),
    [items],
  );
  const detail = calculerDetailPanier({
    sousTotal,
    fraisLivraisonBase: restaurant?.fraisLivraison ?? 0,
    modeLivraison: effectiveMode === "livraison",
  });
  const tarifConnu = Boolean(restaurant);
  const totalLabel = tarifConnu ? formatPrix(detail.total) : "À confirmer";

  const handleCommander = useCallback(() => {
    if (restaurantQuery.isPending) return;
    if (restaurantQuery.isError || !restaurant) {
      Alert.alert(
        "Établissement indisponible",
        "Impossible de vérifier les conditions de commande. Réessayez après avoir vérifié votre connexion.",
      );
      return;
    }
    if (!restaurant.enLigne || !restaurant.accepteCommandes) {
      Alert.alert(
        "Commande indisponible",
        "Cet établissement n’accepte pas de commande pour le moment.",
      );
      return;
    }
    if (supportedModes.length === 0) {
      Alert.alert(
        "Mode indisponible",
        "Aucun mode de commande compatible n’est disponible pour cet établissement.",
      );
      return;
    }
    if (!client) {
      router.push({
        pathname: "/auth/login",
        params: { redirectTo: "/panier", resumeCheckout: "1" },
      });
      return;
    }
    router.push("/checkout");
  }, [
    client,
    restaurant,
    restaurantQuery.isError,
    restaurantQuery.isPending,
    router,
    supportedModes.length,
  ]);

  useEffect(() => {
    if (
      resumeCheckout !== "1" ||
      !client ||
      !restaurantSlug ||
      items.length === 0 ||
      restaurantQuery.isPending ||
      hasResumedCheckout.current
    ) {
      return;
    }

    hasResumedCheckout.current = true;
    const frame = requestAnimationFrame(() => {
      handleCommander();
      router.setParams({ resumeCheckout: "" });
    });

    return () => cancelAnimationFrame(frame);
  }, [
    client,
    handleCommander,
    items.length,
    restaurantQuery.isPending,
    restaurantSlug,
    resumeCheckout,
    router,
  ]);

  const handleClearCart = useCallback(() => {
    Alert.alert(
      "Vider le panier ?",
      "Tous les plats seront retirés du panier.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Tout retirer", style: "destructive", onPress: viderPanier },
      ],
      { cancelable: true },
    );
  }, [viderPanier]);

  if (items.length === 0) {
    return (
      <View style={styles.page}>
        <StatusBar barStyle="dark-content" />
        <PanierToolbar
          articleCount={0}
          onBack={() => router.back()}
          topInset={insets.top}
        />

        <Animated.View entering={FadeIn.duration(220)} style={styles.emptyState}>
          <View style={styles.emptyIconFrame}>
            <ShoppingBag color="theme.green900" size={34} strokeWidth={1.8} />
          </View>
          <Text style={styles.emptyTitle}>Votre panier est vide</Text>
          <Text style={styles.emptyMessage}>
            Parcourez un menu et ajoutez ce qui vous fait envie.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace("/(tabs)")}
            style={[styles.emptyAction]}
          >
            <Text style={styles.emptyActionLabel}>Explorer les restaurants</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <StatusBar barStyle="dark-content" />

      <PanierToolbar
        articleCount={nombreArticles}
        onBack={() => router.back()}
        topInset={insets.top}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(220)}>
          <View style={styles.orderIntro}>
            <Text numberOfLines={1} style={styles.restaurantName}>
              {restaurant?.nom ?? "Votre restaurant"}
            </Text>
          </View>

          <View style={styles.cartPanel}>
            <View style={styles.cartPanelHeader}>
              <Text style={styles.cartCount}>
                {nombreArticles} ARTICLE{nombreArticles > 1 ? "S" : ""} DANS LE
                PANIER
              </Text>
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={handleClearCart}
                style={[styles.clearCartButton]}
              >
                <Text style={styles.clearCartLabel}>Tout retirer</Text>
              </Pressable>
            </View>

            <View>
              {items.map((item, index) => (
                <PanierItemRow
                  key={item.platId}
                  article={item}
                  index={index}
                  isLast={index === items.length - 1}
                  onDecrement={() => retirerItem(item.platId)}
                  onIncrement={() =>
                    ajouterItem({
                      id: item.platId,
                      nom: item.nom,
                      prix: item.prix,
                      photoUrl: item.photoUrl,
                    })
                  }
                  onRemove={() => supprimerItem(item.platId)}
                />
              ))}
            </View>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Récapitulatif</Text>
            <View style={styles.summaryLines}>
              <SummaryRow label="Sous-total" value={formatPrix(sousTotal)} />
              {effectiveMode === "livraison" && (
                <SummaryRow
                  label="Livraison"
                  value={
                    tarifConnu
                      ? detail.fraisLivraison === 0
                        ? "Gratuite"
                        : formatPrix(detail.fraisLivraison)
                      : "À confirmer"
                  }
                />
              )}
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{totalLabel}</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <View
        style={[
          styles.checkoutBar,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}
      >
        <Pressable
          accessibilityLabel="Continuer pour finaliser la commande"
          accessibilityRole="button"
          accessibilityState={{ disabled: restaurantQuery.isPending }}
          disabled={restaurantQuery.isPending}
          onPress={handleCommander}
          style={[
            styles.checkoutButton,
            restaurantQuery.isPending && styles.checkoutButtonDisabled,
          ]}
        >
          {restaurantQuery.isPending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text style={styles.checkoutButtonLabel}>Continuer</Text>
              <ArrowRight color="#FFFFFF" size={19} strokeWidth={2.1} />
            </>
          )}
        </Pressable>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  cartCount: {
    color: "#7A7A75",
    flex: 1,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.45,
    lineHeight: 15,
  },
  cartPanel: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderCurve: "continuous",
    borderRadius: 26,
    boxShadow: "0 14px 34px rgba(57, 67, 57, 0.08)",
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cartPanelHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingBottom: 4,
    paddingHorizontal: 2,
  },
  clearCartButton: {
    minHeight: 32,
    justifyContent: "center",
  },
  clearCartLabel: {
    color: "#D7352E",
    fontSize: 12.5,
    fontWeight: "700",
  },
  checkoutBar: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderColor: "#ECECE8",
    borderTopWidth: 1,
    bottom: 0,
    boxShadow: "0 -10px 30px rgba(17, 17, 17, 0.08)",
    flexDirection: "row",
    left: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    position: "absolute",
    right: 0,
  },
  checkoutButton: {
    alignItems: "center",
    backgroundColor: "theme.green900",
    borderCurve: "continuous",
    borderRadius: 999,
    flexDirection: "row",
    gap: 9,
    height: 54,
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  checkoutButtonDisabled: { opacity: 0.48 },
  checkoutButtonLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  emptyAction: {
    alignItems: "center",
    backgroundColor: "theme.green900",
    borderCurve: "continuous",
    borderRadius: 999,
    justifyContent: "center",
    marginTop: 8,
    minHeight: 52,
    paddingHorizontal: 24,
  },
  emptyActionLabel: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  emptyIconFrame: {
    alignItems: "center",
    backgroundColor: "#F1F4EF",
    borderCurve: "continuous",
    borderRadius: 28,
    height: 84,
    justifyContent: "center",
    width: 84,
  },
  emptyMessage: {
    color: "#737376",
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 280,
    textAlign: "center",
  },
  emptyState: {
    alignItems: "center",
    flex: 1,
    gap: 12,
    justifyContent: "center",
    paddingBottom: 72,
    paddingHorizontal: 28,
  },
  emptyTitle: {
    color: "#111111",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.45,
    lineHeight: 28,
    marginTop: 6,
  },
  orderIntro: { paddingBottom: 14, paddingHorizontal: 4 },
  page: { backgroundColor: "transparent", flex: 1 },
  restaurantName: {
    color: "#111111",
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.35,
    lineHeight: 24,
  },
  scrollContent: { paddingHorizontal: 16, paddingTop: 10 },
  summaryCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderColor: "#ECECE8",
    borderCurve: "continuous",
    borderRadius: 26,
    boxShadow: "0 10px 30px rgba(17, 17, 17, 0.045)",
    marginTop: 16,
    padding: 20,
  },
  summaryDivider: {
    backgroundColor: "#EAEAE6",
    height: 1,
    marginVertical: 12,
  },
  summaryLabel: { color: "#737376", fontSize: 13.5, lineHeight: 19 },
  summaryLines: { gap: 9, marginTop: 14 },
  summaryRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryTitle: {
    color: "#111111",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.25,
    lineHeight: 22,
  },
  summaryValue: {
    color: "#3F3F42",
    fontSize: 13.5,
    fontVariant: ["tabular-nums"],
    fontWeight: "600",
    lineHeight: 19,
  },
  toolbar: {
    alignItems: "center",
    backgroundColor: "transparent",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 70,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  toolbarCartButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.76)",
    borderColor: "rgba(17,17,17,0.1)",
    borderCurve: "continuous",
    borderRadius: 999,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    position: "relative",
    width: 48,
  },
  toolbarCartDot: {
    backgroundColor: "#D7352E",
    borderColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 2,
    height: 11,
    position: "absolute",
    right: 5,
    top: 4,
    width: 11,
  },
  toolbarTitle: {
    color: "#111111",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.35,
    lineHeight: 22,
  },
  totalLabel: {
    color: "#111111",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  totalRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalValue: {
    color: "theme.green900",
    fontSize: 18,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
    letterSpacing: -0.3,
  },
});
