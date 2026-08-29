import { FormulaireCommande } from "@/components/panier/FormulaireCommande";
import { Button } from "@/components/ui/button";
import { Text as ButtonText } from "@/components/ui/text";
import {
  getSupportedCheckoutModes,
  MAX_ITEM_QUANTITY,
  type CheckoutMode,
} from "@/domain/checkout";
import { useRestaurant } from "@/hooks/useMenuRestaurant";
import { formatPrix } from "@/lib/format";
import { calculerDetailPanier } from "@/lib/tarification";
import { useStore } from "@/store";
import { selectSousTotal } from "@/store/selectors";
import type { PanierItem } from "@/types";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowRight,
  ChevronLeft,
  Minus,
  Plus,
  ShoppingBag,
  Ticket,
  Trash2,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PLAT_PLACEHOLDER = require("@/assets/images/plat-placeholder.jpg");

function QuantiteControl({
  quantite,
  onDecrement,
  onIncrement,
}: {
  quantite: number;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  const isQuantiteMin = quantite <= 1;
  const isQuantiteMax = quantite >= MAX_ITEM_QUANTITY;

  return (
    <View className="flex-row items-center gap-3 rounded-full bg-green-50 px-2 py-1.5">
      <Pressable
        onPress={async () => {
          if (!isQuantiteMin) {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onDecrement();
          }
        }}
        disabled={isQuantiteMin}
        className={`h-9 w-9 items-center justify-center rounded-full ${isQuantiteMin ? "opacity-40" : "active:bg-green-100"
          }`}
      >
        <Minus size={18} color="#14532d" />
      </Pressable>
      <Text className="w-6 text-center text-base font-semibold text-ink-900">
        {quantite}
      </Text>
      <Pressable
        onPress={async () => {
          if (isQuantiteMax) return;
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onIncrement();
        }}
        disabled={isQuantiteMax}
        accessibilityLabel="Ajouter une unité"
        accessibilityState={{ disabled: isQuantiteMax }}
        className={`h-9 w-9 items-center justify-center rounded-full active:bg-green-100 ${isQuantiteMax ? "opacity-40" : ""}`}
      >
        <Plus size={18} color="#14532d" />
      </Pressable>
    </View>
  );
}

function ArticleRow({
  article,
  onIncrement,
  onDecrement,
  onSupprimer,
}: {
  article: PanierItem;
  onIncrement: () => void;
  onDecrement: () => void;
  onSupprimer: () => void;
}) {
  return (
    <View className="flex-row items-center gap-4 border-b border-ink-100 px-4 py-4 last:border-b-0">
      <Image
        source={article.photoUrl ?? PLAT_PLACEHOLDER}
        placeholder={PLAT_PLACEHOLDER}
        contentFit="cover"
        transition={150}
        className="h-20 w-20 rounded-2xl"
        style={{ borderWidth: 1, borderColor: "rgba(0,0,0,0.1)" }}
      />
      <View className="flex-1">
        <View className="flex-row items-start justify-between">
          <Text className="flex-1 pr-2 text-base font-bold text-ink-900">
            {article.nom}
          </Text>
          <Pressable
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert(
                "Supprimer cet article ?",
                `« ${article.nom} » sera retiré de votre panier.`,
                [
                  { text: "Annuler", style: "cancel" },
                  {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: onSupprimer,
                  },
                ],
                { cancelable: true },
              );
            }}
            className="items-center justify-center rounded-full border border-ink-200 px-2.5 py-1.5 active:opacity-60"
          >
            <View className="flex-row items-center gap-1">
              <Trash2 size={15} color="#14532d" />
              <Text className="text-[11px] font-semibold text-ink-600">
                Supprimer
              </Text>
            </View>
          </Pressable>
        </View>
        <View className="flex-row justify-between mt-3">
          <Text className="mb-3 mt-1 text-base font-semibold text-brand-700">
            {formatPrix(article.prix)}
          </Text>
          <QuantiteControl
            quantite={article.quantite}
            onIncrement={onIncrement}
            onDecrement={onDecrement}
          />
        </View>
      </View>
    </View>
  );
}

function LigneResume({
  label,
  valeur,
  emphase,
}: {
  label: string;
  valeur: string;
  emphase?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between py-3">
      <Text
        className={
          emphase ? "text-lg font-bold text-ink-900" : "text-sm text-ink-500"
        }
      >
        {label}
      </Text>
      <Text
        className={
          emphase
            ? "text-lg font-bold text-brand-700"
            : "text-sm font-medium text-ink-700"
        }
      >
        {valeur}
      </Text>
    </View>
  );
}

export default function PanierScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { resumeCheckout } = useLocalSearchParams<{
    resumeCheckout?: string;
  }>();

  const items = useStore((s) => s.items);
  const client = useStore((s) => s.client);
  const restaurantSlug = useStore((s) => s.restaurantSlug);
  const ajouterItem = useStore((s) => s.ajouterItem);
  const retirerItem = useStore((s) => s.retirerItem);
  const supprimerItem = useStore((s) => s.supprimerItem);
  const viderPanier = useStore((s) => s.viderPanier);

  const formulaireRef = useRef<BottomSheetModal>(null);
  const hasResumedCheckout = useRef(false);
  const [selectedMode, setSelectedMode] =
    useState<CheckoutMode>("livraison");

  // Les frais de livraison viennent de l'établissement servi par l'API,
  // jamais d'un paramètre d'URL (que le client pourrait forger).
  const restaurantQuery = useRestaurant(restaurantSlug);
  const restaurant = restaurantQuery.data;
  const supportedModes = useMemo(
    () => getSupportedCheckoutModes(restaurant?.modesCommande ?? []),
    [restaurant?.modesCommande],
  );
  const effectiveMode = supportedModes.includes(selectedMode)
    ? selectedMode
    : supportedModes[0] ?? "livraison";

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
        params: {
          redirectTo: "/panier",
          resumeCheckout: "1",
        },
      });
      return;
    }
    formulaireRef.current?.present();
  }, [client, restaurant, restaurantQuery.isError, restaurantQuery.isPending, router, supportedModes.length]);

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

  const handleCommandeSuccess = (commandeId: string, paymentUrl: string | null) => {
    formulaireRef.current?.dismiss();
    viderPanier();

    if (paymentUrl) {
      void Linking.openURL(paymentUrl).catch(() => {
        Alert.alert(
          "Paiement à ouvrir",
          "La commande est enregistrée. Ouvrez-la depuis vos commandes pour reprendre le paiement.",
        );
        router.push(commandeId ? `/(tabs)/commandes/${commandeId}` : "/(tabs)/commandes");
      });
      return;
    }

    if (commandeId) {
      // id valide → on navigue vers le suivi de commande
      router.push(`/(tabs)/commandes/${commandeId}`);
    } else {
      // id absent (edge case backend) → on redirige vers la liste des commandes
      router.push("/(tabs)/commandes");
    }
  };

  const handleConfirmationClose = () => {
    formulaireRef.current?.dismiss();
  };

  const sousTotal = useStore(selectSousTotal);

  const detail = calculerDetailPanier({
    sousTotal,
    fraisLivraisonBase: restaurant?.fraisLivraison ?? 0,
    modeLivraison: effectiveMode === "livraison",
  });
  const tarifConnu = Boolean(restaurant);

  if (items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-8">
        <ShoppingBag size={78} color="#14532d" />
        <Text className="my-4 text-xl font-bold text-ink-900">
          Votre panier est vide
        </Text>
        <Text className="mb-6 text-center text-ink-500">
          Ajoutez des plats depuis le menu d&apos;un établissement
        </Text>

        <Button variant={"link"} onPress={() => router.replace("/(tabs)")}>
          <Text className="text-brand-800 font-semibold underline">
            Découvrir les établissements
          </Text>
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-ink-50">
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={{ paddingTop: insets.top }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        <View className="flex-row items-center justify-between px-4 py-3">
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            className="w-9"
          >
            <ChevronLeft size={26} color="#111111" />
          </Pressable>

          <View className="items-center justify-center w-40 ">
            <Text className="mt-2 text-center text-2xl font-extrabold text-ink-900 ">
              Votre panier
            </Text>
          </View>

          <View className="w-9" />
        </View>
        <View className="mx-4 mt-5 flex-row items-center gap-4 rounded-3xl bg-green-50 px-4 py-5">
          <Image
            source={require("@/assets/images/fast-delivery.png")}
            className="h-24 w-24"
            contentFit="contain"
            style={{
              tintColor: "#14532d",
            }}
          />
          <View className="flex-1">
            <Text className="text-sm leading-5 text-ink-700">
              Les frais de livraison affichés proviennent de l&apos;établissement.
              Le montant final est confirmé lors de la commande.
            </Text>
          </View>
        </View>

        <View className="mx-4 mt-5 overflow-hidden rounded-2xl bg-white">
          {/* Rendu direct : le panier est court et déjà dans un ScrollView.
              Une FlatList imbriquée y perdrait sa virtualisation. */}
          {items.map((item) => (
            <ArticleRow
              key={item.platId}
              article={item}
              onIncrement={() =>
                ajouterItem({
                  id: item.platId,
                  nom: item.nom,
                  prix: item.prix,
                  photoUrl: item.photoUrl,
                })
              }
              onDecrement={() => retirerItem(item.platId)}
              onSupprimer={() => supprimerItem(item.platId)}
            />
          ))}
        </View>

        {/* Bientôt disponible — ne pas présenter une affordance morte */}
        <View className="mx-4 mt-5 flex-row items-center justify-between rounded-2xl bg-ink-50 px-4 py-4">
          <View className="flex-row items-center gap-3">
            <Ticket size={20} color="#9ca3af" />
            <Text className="text-base font-medium text-ink-500">
              Code promo — bientôt disponible
            </Text>
          </View>
        </View>

        <View className="mx-4 mt-5 rounded-2xl bg-white px-4 py-3">
          <LigneResume label="Sous-total" valeur={formatPrix(sousTotal)} />
          <LigneResume
            label="Frais de livraison"
            valeur={tarifConnu ? formatPrix(detail.fraisLivraison) : "À confirmer"}
          />
          <View className="my-2 border-t border-ink-100" />
          <LigneResume
            label="Total à payer"
            valeur={tarifConnu ? formatPrix(detail.total) : "À confirmer"}
            emphase
          />
          <Text className="pb-1 text-xs text-ink-500">
            Montant définitif confirmé par l&apos;établissement à la validation
            de la commande.
          </Text>
        </View>

        <Button
          className="mx-4 mt-5 flex-row items-center justify-between rounded-full px-6 py-4"
          onPress={handleCommander}
          disabled={restaurantQuery.isPending}
        >
          <View className="flex-1 items-center">
            <ButtonText className="text-base font-bold text-white">
              Passer à la commande
            </ButtonText>
          </View>
          <ArrowRight size={20} color="#fff" />
        </Button>
      </ScrollView>

      {restaurantSlug && (
        <FormulaireCommande
          ref={formulaireRef}
          restaurantSlug={restaurantSlug}
          modesCommande={restaurant?.modesCommande ?? []}
          restaurantDisponible={Boolean(
            restaurant?.enLigne && restaurant?.accepteCommandes,
          )}
          commandeMinimum={restaurant?.commandeMinimum ?? 0}
          sousTotal={sousTotal}
          onModeChange={setSelectedMode}
          onSuccess={handleCommandeSuccess}
          onClose={handleConfirmationClose}
        />
      )}
    </View>
  );
}
