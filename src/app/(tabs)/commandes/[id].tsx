import { useCommandeTracking } from "@/hooks/useCommandeTracking";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  CircleCheckBig,
  Headphones,
  ShoppingBag,
  Smile,
  Truck
} from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const STATUT_LABELS: Record<string, string> = {
  recue: "Commande reçue",
  en_preparation: "En préparation",
  prete: "Prête pour la livraison",
  servie: "Livrée",
  annulee: "Annulée",
};

const STATUT_ICONS: Record<string, typeof Check> = {
  recue: Check,
  en_preparation: ShoppingBag,
  prete: Truck,
  servie: CircleCheckBig,
};

export default function CommandeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { commande, statut, isLoading, error } = useCommandeTracking(
    id ?? null,
  );

  const appelerSupport = () => Linking.openURL("tel:+2250700000000");

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#1B4D1E" />
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
        <TouchableOpacity
          className="bg-green-900 rounded-2xl px-6 py-4"
          onPress={() => router.back()}
        >
          <Text className="text-white font-bold">Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const estAnnulee = commande.estAnnulee;
  const statutLabel = STATUT_LABELS[commande.statut] ?? commande.statut;
  const dateFormatee = new Date(commande.createdAt).toLocaleDateString(
    "fr-FR",
    { day: "2-digit", month: "long", year: "numeric" },
  );
  const heureFormatee = new Date(commande.createdAt).toLocaleTimeString(
    "fr-FR",
    { hour: "2-digit", minute: "2-digit" },
  );
  const totalFormate =
    new Intl.NumberFormat("fr-FR").format(commande.total / 100) + " FCFA";

  // Le livreur n'est présent que si le backend l'a assigné (mode livraison, commande prise en charge)
  // const livreur = commande.livreur;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 bg-white pb-14">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <Pressable onPress={() => router.push("/(tabs)/commandes")} hitSlop={10} className="w-9">
            <ChevronLeft size={26} color="#111111" />
          </Pressable>

          <View className="flex-row items-center">
            <Text className="text-green-900 text-xl font-extrabold tracking-tight">
              Restau
            </Text>
            <Text className="text-green-800 text-xl font-extrabold">C</Text>
            <Text className="text-green-900 text-xl font-extrabold tracking-tight">
              i
            </Text>
          </View>

          <Pressable
            className="flex-row items-center"
            hitSlop={10}
            onPress={appelerSupport}
          >
            <Headphones size={18} color="#1B4D1E" />
            <Text className="text-green-800 font-medium ml-1">Aide</Text>
          </Pressable>
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
                  source={require('@/assets/images/livreur-profile.png')}
                  style={{ width: 110, height: 110, borderRadius: 999 }}
                  resizeMode="contain"
                />
              )}
            </View>
          ) : (
            <View className="bg-red-50 rounded-3xl p-5 mt-2 border border-red-100">
              <AlertCircle size={28} color="#DC2626" />
              <Text className="font-bold text-red-600 text-lg mt-2">
                Commande annulée
              </Text>
              <Text className="text-gray-500 mt-1">
                Cette commande a été annulée. Contactez le restaurant pour
                plus d'informations.
              </Text>
            </View>
          )}

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
                        {etape.label}
                      </Text>
                      {etape.timestamp && (
                        <Text className="text-[11px] text-gray-400 mt-0.5">
                          {new Date(etape.timestamp).toLocaleTimeString(
                            "fr-FR",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </Text>
                      )}
                    </View>
                    {index < commande.timeline.length - 1 && (
                      <View
                        className={`flex-1 h-0.5 mt-[18px] ${etape.fait ? "bg-green-900" : "bg-gray-200"
                          }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          )}

          {/* Livreur partenaire — uniquement si assigné par le backend */}
          {/* {!estAnnulee && livreur && (
            <View className="border border-gray-100 rounded-3xl p-5 mt-8">
              <Text className="text-lg font-bold text-black mb-4">
                Livreur partenaire
              </Text>
              <View className="flex-row items-center">
                <Image
                  source={{ uri: livreur.photo }}
                  style={{ width: 56, height: 56, borderRadius: 28 }}
                />
                <View className="flex-1 ml-3">
                  <Text className="text-black font-semibold text-base">
                    {livreur.nom}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <Star size={14} color="#F5A623" fill="#F5A623" />
                    <Text className="text-black ml-1">{livreur.note}</Text>
                    <Text className="text-gray-400 ml-1">
                      ({livreur.avis} avis)
                    </Text>
                  </View>
                  <Text className="text-gray-400 text-sm mt-0.5">
                    ID : {livreur.id}
                  </Text>
                </View>
                <Pressable
                  onPress={() => Linking.openURL(`tel:${livreur.telephone}`)}
                  className="w-11 h-11 rounded-full bg-green-50 items-center justify-center mr-2"
                >
                  <Phone size={18} color="#1B4D1E" />
                </Pressable>
                <Pressable
                  onPress={() => router.push(`/`)}
                  className="w-11 h-11 rounded-full bg-green-900 items-center justify-center"
                >
                  <MessageCircle size={18} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          )} */}

          {/* Détails de la commande */}
          <View className="border border-gray-100 rounded-3xl p-5 mt-8">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-black">
                Détails de la commande
              </Text>
              <Text className="text-gray-400 text-sm">
                {dateFormatee} • {heureFormatee}
              </Text>
            </View>
            <Text className="text-gray-400 text-sm mt-1">
              Commande #{commande.numero}
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
                  {new Intl.NumberFormat("fr-FR").format(
                    item.prix * item.quantite,
                  )}{" "}
                  FCFA
                </Text>
              </View>
            ))}

            <View className="h-px bg-gray-100 my-4" />

            {/* Totaux */}
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-500">Sous-total</Text>
              <Text className="text-black">
                {new Intl.NumberFormat("fr-FR").format(
                  commande.sousTotal / 100,
                )}{" "}
                FCFA
              </Text>
            </View>
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-500">Frais de livraison</Text>
              <Text className="text-black">
                {new Intl.NumberFormat("fr-FR").format(
                  commande.fraisLivraison / 100,
                )}{" "}
                FCFA
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

          {/* Bandeau avis — uniquement une fois la commande livrée */}
          {commande.statut === "servie" && (
            <Pressable
              onPress={() => router.push(`/`)}
              className="flex-row items-center bg-green-50 rounded-2xl p-4 mt-6"
            >
              <Smile size={26} color="#1B4D1E" />
              <View className="flex-1 ml-3">
                <Text className="text-black font-medium">
                  Vous avez aimé notre service ?
                </Text>
                <Text className="text-gray-500 text-sm mt-0.5">
                  Donnez votre avis sur votre expérience
                </Text>
              </View>
            </Pressable>
          )}

          {/* Actions */}
          <View className="mt-6 gap-3">
            <TouchableOpacity
              className="bg-green-900 rounded-2xl py-4 items-center"
              onPress={() => router.push("/(tabs)")}
            >
              <Text className="text-white font-bold text-base">
                Commander à nouveau
              </Text>
            </TouchableOpacity>
            {/* <TouchableOpacity
              className="bg-gray-100 rounded-2xl py-4 items-center"
              onPress={appelerSupport}
            >
              <Text className="text-gray-700 font-semibold text-base">
                Contacter le support
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-gray-100 rounded-2xl py-4 items-center"
              onPress={() => router.push("/(tabs)/commandes")}
            >
              <Text className="text-gray-700 font-semibold text-base">
                Mes autres commandes
              </Text>
            </TouchableOpacity> */}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}