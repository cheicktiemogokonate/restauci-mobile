import { useEffect } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useCommandeTracking } from "@/hooks/useCommandeTracking";

const ETAPES = ["recue", "en_preparation", "prete", "servie"] as const;

const STATUT_ICONS: Record<string, string> = {
  recue: "📨",
  en_preparation: "👨‍🍳",
  prete: "✅",
  servie: "🎉",
  annulee: "❌",
};

const STATUT_LABELS: Record<string, string> = {
  recue: "Commande reçue",
  en_preparation: "En préparation",
  prete: "Prête pour la livraison",
  servie: "Livrée",
  annulee: "Annulée",
};

export default function CommandeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { commande, statut, isLoading, error } = useCommandeTracking(id ?? null);

  const currentIndex = commande ? ETAPES.indexOf(commande.statut as typeof ETAPES[number]) : -1;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#22c55e" />
      </SafeAreaView>
    );
  }

  if (error || !commande) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center px-8">
        <Text className="text-4xl mb-4">❌</Text>
        <Text className="text-lg font-bold text-gray-900 mb-2">
          Commande introuvable
        </Text>
        <Text className="text-gray-500 text-center mb-6">
          {error?.message ?? "Cette commande n'existe pas ou a été supprimée."}
        </Text>
        <TouchableOpacity
          className="bg-brand-500 rounded-xl px-6 py-3"
          onPress={() => router.back()}
        >
          <Text className="text-white font-bold">Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const totalFormate =
    new Intl.NumberFormat("fr-FR").format(commande.total / 100) + " FCFA";
  const dateFormatee = new Date(commande.createdAt).toLocaleDateString(
    "fr-FR",
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  const estAnnulee = commande.estAnnulee;
  const statutIcon = STATUT_ICONS[commande.statut] ?? "📋";
  const statutLabel = STATUT_LABELS[commande.statut] ?? commande.statut;

  return (
    <>
      <Stack.Screen options={{ title: `Commande ${commande.numero}`, headerShown: true }} />
      <SafeAreaView className="flex-1 bg-gray-50">
        <ScrollView
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Card */}
          <View className="bg-white mx-4 mt-4 rounded-2xl p-5 shadow-sm border border-gray-100">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-3">
                <Text className="text-3xl">{statutIcon}</Text>
                <View>
                  <Text className="text-lg font-bold text-gray-900">
                    {commande.restaurant?.nom ?? "Restaurant"}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    {dateFormatee}
                  </Text>
                </View>
              </View>
              <View className="bg-gray-100 rounded-lg px-3 py-1.5">
                <Text className="font-bold text-brand-600">
                  #{commande.numero}
                </Text>
              </View>
            </View>

            <View className="bg-gray-50 rounded-xl p-4 mt-2">
              <Text className="font-bold text-gray-900 mb-1">{statutLabel}</Text>
              {!estAnnulee && currentIndex >= 0 && (
                <Text className="text-sm text-gray-500">
                  {ETAPES.indexOf(commande.statut as typeof ETAPES[number]) <
                  ETAPES.length - 1
                    ? `${ETAPES.length - currentIndex - 1} étape${
                        ETAPES.length - currentIndex - 1 > 1 ? "s" : ""
                      } restante${ETAPES.length - currentIndex - 1 === 1 ? "" : "s"}`
                    : "Dernière étape"}
                </Text>
              )}
            </View>
          </View>

          {/* Timeline */}
          {!estAnnulee && commande.timeline.length > 0 && (
            <View className="bg-white mx-4 mt-4 rounded-2xl p-5 shadow-sm border border-gray-100">
              <Text className="font-bold text-gray-900 mb-5">
                Suivi de commande
              </Text>

              {commande.timeline.map((etape, index) => {
                const isLast = index === commande.timeline.length - 1;
                const icon = STATUT_ICONS[etape.etape] ?? "📋";

                return (
                  <View key={etape.etape} className="flex-row">
                    {/* Timeline connector */}
                    <View className="items-center mr-3">
                      <View
                        className={`w-10 h-10 rounded-full justify-center items-center ${
                          etape.actif
                            ? "bg-green-500"
                            : etape.fait
                            ? "bg-green-100"
                            : "bg-gray-100"
                        }`}
                      >
                        <Text className="text-lg">{icon}</Text>
                      </View>
                      {!isLast && (
                        <View
                          className={`w-0.5 flex-1 my-1 ${
                            etape.fait ? "bg-green-300" : "bg-gray-200"
                          }`}
                        />
                      )}
                    </View>

                    {/* Content */}
                    <View className="flex-1 pb-6">
                      <Text
                        className={`font-semibold text-base ${
                          etape.actif
                            ? "text-green-600"
                            : etape.fait
                            ? "text-gray-900"
                            : "text-gray-400"
                        }`}
                      >
                        {etape.label}
                      </Text>
                      {etape.timestamp && (
                        <Text className="text-sm text-gray-400 mt-0.5">
                          {new Date(etape.timestamp).toLocaleTimeString(
                            "fr-FR",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Annulation */}
          {estAnnulee && (
            <View className="bg-white mx-4 mt-4 rounded-2xl p-5 shadow-sm border border-red-100">
              <Text className="text-3xl mb-2">❌</Text>
              <Text className="font-bold text-red-600 text-lg">
                Commande annulée
              </Text>
              <Text className="text-gray-500 mt-1">
                Cette commande a été annulée. Contactez le restaurant pour plus
                d'informations.
              </Text>
            </View>
          )}

          {/* Order Details */}
          <View className="bg-white mx-4 mt-4 rounded-2xl p-5 shadow-sm border border-gray-100">
            <Text className="font-bold text-gray-900 mb-4">
              Détails de la commande
            </Text>

            {/* Mode */}
            <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-gray-100">
              <Text className="text-gray-600">Mode</Text>
              <Text className="font-medium text-gray-900">
                {commande.modeCommande === "livraison"
                  ? "🚚 Livraison"
                  : "📦 Emporter"}
              </Text>
            </View>

            {commande.modeCommande === "livraison" &&
              commande.adresseLivraison && (
                <View className="flex-row justify-between items-start mb-4 pb-4 border-b border-gray-100">
                  <Text className="text-gray-600">Adresse</Text>
                  <Text className="font-medium text-gray-900 text-right flex-1 ml-4">
                    {commande.adresseLivraison}
                  </Text>
                </View>
              )}

            {/* Items */}
            {commande.items.map((item, i) => (
              <View
                key={`${item.platId}-${i}`}
                className="flex-row justify-between items-center mb-3"
              >
                <View className="flex-row items-center flex-1">
                  <Text className="font-semibold text-gray-900 mr-2">
                    {item.quantite}×
                  </Text>
                  <Text className="text-gray-800 flex-1" numberOfLines={2}>
                    {item.nom}
                  </Text>
                </View>
                <Text className="font-medium text-gray-700">
                  {new Intl.NumberFormat("fr-FR").format(item.prix * item.quantite)}{" "}
                  FCFA
                </Text>
              </View>
            ))}

            {/* Totals */}
            <View className="mt-4 pt-4 border-t border-gray-100">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-500">Sous-total</Text>
                <Text className="text-gray-700">
                  {new Intl.NumberFormat("fr-FR").format(
                    commande.sousTotal / 100
                  )}{" "}
                  FCFA
                </Text>
              </View>
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-500">Livraison</Text>
                <Text className="text-gray-700">
                  {new Intl.NumberFormat("fr-FR").format(
                    commande.fraisLivraison / 100
                  )}{" "}
                  FCFA
                </Text>
              </View>
              <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-gray-200">
                <Text className="font-bold text-gray-900 text-base">Total</Text>
                <Text className="font-bold text-green-600 text-lg">
                  {totalFormate}
                </Text>
              </View>
            </View>
          </View>

          {/* Notes */}
          {commande.noteClient && (
            <View className="bg-white mx-4 mt-4 rounded-2xl p-5 shadow-sm border border-gray-100">
              <Text className="font-bold text-gray-900 mb-2">Note</Text>
              <Text className="text-gray-600">{commande.noteClient}</Text>
            </View>
          )}

          {/* Actions */}
          <View className="mx-4 mt-5 gap-3">
            <TouchableOpacity
              className="bg-brand-500 rounded-xl py-4 items-center"
              onPress={() => router.push("/(tabs)")}
            >
              <Text className="text-white font-bold text-base">
                Commander à nouveau
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-gray-100 rounded-xl py-4 items-center"
              onPress={() => router.push("/(tabs)/profil")}
            >
              <Text className="text-gray-700 font-semibold text-base">
                Mes autres commandes
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}