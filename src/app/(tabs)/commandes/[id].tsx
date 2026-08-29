import { Button } from "@/components/ui/button";
import { Text as ButtonText } from "@/components/ui/text";
import { useCommandeTracking } from "@/hooks/useCommandeTracking";
import { useRetryCommandePayment } from "@/hooks/useRetryCommandePayment";
import { getOrderStatusLabel } from "@/domain/orderStatus";
import { formatPrix } from "@/lib/format";
import { useStore } from "@/store";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  CircleCheckBig,
  ShoppingBag,
  Truck,
} from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const STATUT_ICONS: Record<string, typeof Check> = {
  recue: Check,
  en_preparation: ShoppingBag,
  prete: Truck,
  servie: CircleCheckBig,
};

export default function CommandeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const client = useStore((state) => state.client);
  const { commande, isLoading, error } = useCommandeTracking(
    id ?? null,
  );
  const retryPayment = useRetryCommandePayment();

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#166534" />
      </SafeAreaView>
    );
  }

  if (!client) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-8">
        <ShoppingBag size={40} color="#9CA3AF" />
        <Text className="mt-4 text-lg font-bold text-black">
          Connexion requise
        </Text>
        <Text className="mt-2 mb-6 text-center text-gray-500">
          Connectez-vous pour consulter cette commande.
        </Text>
        <Button
          className="px-6 py-4"
          onPress={() =>
            router.push({
              pathname: "/auth/login",
              params: { redirectTo: `/(tabs)/commandes/${id}` },
            })
          }
        >
          <ButtonText className="font-bold text-white">Se connecter</ButtonText>
        </Button>
      </SafeAreaView>
    );
  }

  if (error || !commande) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center px-8">
        <AlertCircle size={40} color="#DC2626" />
        <Text className="text-lg font-bold text-black mt-4 mb-2">
          Commande introuvable
        </Text>
        <Text className="text-gray-500 text-center mb-6">
          {error?.message ?? "Cette commande n'existe pas ou a été supprimée."}
        </Text>
        <Button className="px-6 py-4" onPress={() => router.back()}>
          <ButtonText className="text-white font-bold">Retour</ButtonText>
        </Button>
      </SafeAreaView>
    );
  }

  const estAnnulee = commande.estAnnulee;
  const statutLabel = getOrderStatusLabel(commande.statut, "detail");
  const dateFormatee = new Date(commande.createdAt).toLocaleDateString(
    "fr-FR",
    { day: "2-digit", month: "long", year: "numeric" },
  );
  const heureFormatee = new Date(commande.createdAt).toLocaleTimeString(
    "fr-FR",
    { hour: "2-digit", minute: "2-digit" },
  );
  const totalFormate = formatPrix(commande.total);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 bg-white pb-14">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <Pressable
            onPress={() => router.push("/(tabs)/commandes")}
            hitSlop={10}
            className="w-9"
          >
            <ChevronLeft size={26} color="#111111" />
          </Pressable>

          <View className="items-center justify-center h-16 w-40 ">
            <Image
              source={require("@/assets/images/toutci-logo-transparent.png")}
              resizeMode="contain"
              style={{ width: "100%", height: "100%" }}
            />
          </View>

          <View className="w-9" />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          className="px-4"
        >
          {/* Carte statut */}
          {!estAnnulee ? (
            <View className="bg-green-50 rounded-3xl p-5 mt-2 flex-row items-center justify-between overflow-hidden">
              <View className="flex-1 pr-2">
                <Text className="text-gray-600">
                  {commande.restaurant?.nom ?? "Votre commande"}
                </Text>
                <Text className="text-green-900 text-2xl font-extrabold mt-1">
                  {statutLabel}
                </Text>
                <Text className="text-black mt-3 leading-5">
                  Commande #{commande.numero}
                </Text>
              </View>
              {commande.modeCommande === "livraison" && (
                <Image
                  source={require("@/assets/images/livreur-profile.png")}
                  style={{ width: 110, height: 110, borderRadius: 999 }}
                  resizeMode="contain"
                />
              )}
            </View>
          ) : (
            <View className="bg-red-50 rounded-3xl p-5 mt-2 border border-red-100">
              <View className="flex-row items-center gap-2">
                <AlertCircle size={28} color="#DC2626" />
                <Text className="font-bold text-red-600 text-lg mt-2">
                  Commande annulée
                </Text>
              </View>
              <Text className="text-gray-500 mt-1">
                Cette commande a été annulée. Contactez l&rsquo;établissement pour
                plus d&apos;informations.
              </Text>
            </View>
          )}

          {commande.statut === "en_attente_paiement" && commande.payment ? (
            <View className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-5">
              <Text className="text-lg font-bold text-ink-900">Paiement requis</Text>
              <Text className="mt-1 text-sm leading-5 text-ink-600">
                Votre commande reste réservée mais ne sera transmise au restaurant qu’après confirmation du paiement.
              </Text>
              <Button
                className="mt-4"
                disabled={retryPayment.isPending}
                onPress={() => retryPayment.mutate(
                  { id: commande.id, method: commande.payment!.method },
                  {
                    onSuccess: ({ authorizationUrl }) => void Linking.openURL(authorizationUrl).catch(() => Alert.alert("Lien indisponible", "Réessayez dans quelques instants.")),
                    onError: (paymentError) => Alert.alert("Paiement impossible", paymentError.message),
                  },
                )}
              >
                {retryPayment.isPending ? <ActivityIndicator color="white" /> : <ButtonText>Reprendre le paiement</ButtonText>}
              </Button>
            </View>
          ) : null}

          {/* Timeline horizontale, pilotée par les données réelles du hook */}
          {!estAnnulee && commande.timeline.length > 0 && (
            <View className="flex-row items-start mt-6 px-1">
              {commande.timeline.map((etape, index) => {
                const Icon = STATUT_ICONS[etape.etape] ?? Check;
                const estAtteinte = etape.fait || etape.actif;

                return (
                  <React.Fragment key={etape.etape}>
                    <View className="items-center" style={{ width: 64 }}>
                      <View
                        className={`w-9 h-9 rounded-full items-center justify-center ${estAtteinte ? "bg-green-900" : "bg-gray-200"
                          }`}
                      >
                        <Icon
                          size={16}
                          color={estAtteinte ? "#FFFFFF" : "#9CA3AF"}
                        />
                      </View>
                      <Text
                        className={`text-xs mt-2 text-center ${etape.actif
                          ? "text-green-800 font-semibold"
                          : etape.fait
                            ? "text-black"
                            : "text-gray-400"
                          }`}
                      >
                        {etape.etape === "en_route"
                          ? "En route"
                          : etape.label}
                      </Text>
                      {etape.timestamp && (
                        <Text className="text-[11px] text-gray-400 mt-1">
                          {new Date(etape.timestamp).toLocaleTimeString(
                            "fr-FR",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </Text>
                      )}
                    </View>
                    {index < commande.timeline.length - 1 && (
                      <View
                        className={`flex-1 h-0.5 mt-4 ${etape.fait ? "bg-green-900" : "bg-gray-200"
                          }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          )}

          {/* Détails de la commande */}
          <View className="border border-gray-100 rounded-3xl p-5 mt-8">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-black">
                Détails de la commande
              </Text>
            </View>
            <Text className="text-gray-400 text-sm mt-1">
              Commande #{commande.numero}
            </Text>
            <Text className="text-gray-400 text-sm">
              {dateFormatee} • {heureFormatee}
            </Text>

            <View className="h-px bg-gray-100 my-4" />

            {/* Mode + adresse (conservés depuis la version précédente) */}
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-gray-500">Mode</Text>
              <Text className="font-medium text-black">
                {commande.modeCommande === "livraison"
                  ? "Livraison"
                  : "À emporter"}
              </Text>
            </View>
            {commande.modeCommande === "livraison" &&
              commande.adresseLivraison && (
                <View className="flex-row justify-between items-start mb-3">
                  <Text className="text-gray-500">Adresse</Text>
                  <Text className="font-medium text-black text-right flex-1 ml-4">
                    {commande.adresseLivraison}
                  </Text>
                </View>
              )}

            <View className="h-px bg-gray-100 my-4" />

            {/* Items */}
            {commande.items.map((item, i) => (
              <View
                key={`${item.platId}-${i}`}
                className="flex-row justify-between items-center mb-3"
              >
                <View className="flex-row items-center flex-1">
                  <Text className="font-semibold text-black mr-2">
                    {item.quantite}×
                  </Text>
                  <Text className="text-black flex-1" numberOfLines={2}>
                    {item.nom}
                  </Text>
                </View>
                <Text className="font-medium text-gray-600">
                  {formatPrix(item.prix * item.quantite)}
                </Text>
              </View>
            ))}

            <View className="h-px bg-gray-100 my-4" />

            {/* Totaux */}
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-500">Sous-total</Text>
              <Text className="text-black">
                {formatPrix(commande.sousTotal)}
              </Text>
            </View>
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-500">Frais de livraison</Text>
              <Text className="text-black">
                {formatPrix(commande.fraisLivraison)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-black font-bold text-base">
                Total à payer
              </Text>
              <Text className="text-green-800 font-bold text-base">
                {totalFormate}
              </Text>
            </View>
          </View>

          {/* Note du client */}
          {commande.noteClient && (
            <View className="border border-gray-100 rounded-3xl p-5 mt-6">
              <Text className="font-bold text-black mb-2">Note</Text>
              <Text className="text-gray-600">{commande.noteClient}</Text>
            </View>
          )}

          {/* Actions */}
          <View className="mt-6 gap-3">
            <Button
              className="py-4 items-center"
              onPress={() => router.push("/(tabs)")}
            >
              <ButtonText className="text-white font-bold text-base">
                Explorer d’autres établissements
              </ButtonText>
            </Button>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
