import type { CommandeSummary } from "@/hooks/useCommandesClient";
import { useCommandesClient } from "@/hooks/useCommandesClient";
import { useStore } from "@/store";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const STATUT_LABELS: Record<string, string> = {
  recue: "Reçue",
  en_preparation: "En préparation",
  prete: "Prête",
  servie: "Livrée",
  annulee: "Annulée",
};

const STATUT_COLORS: Record<string, string> = {
  recue: "text-yellow-600",
  en_preparation: "text-orange-600",
  prete: "text-green-600",
  servie: "text-green-700",
  annulee: "text-red-600",
};

function renderStatutBadge(statut: string) {
  const color = STATUT_COLORS[statut] ?? "text-gray-500";
  const label = STATUT_LABELS[statut] ?? statut;
  return <Text className={`font-semibold text-sm ${color}`}>{label}</Text>;
}

export default function CommandesScreen() {
  const router = useRouter();
  const client = useStore((s) => s.client);
  const {
    data: commandes,
    isLoading,
    refetch,
    isRefetching,
  } = useCommandesClient();

  const handlePress = useCallback(
    (id: string) => {
      router.push(`/commandes/${id}`);
    },
    [router]
  );

  if (!client) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center px-8">
        <Text className="text-3xl mb-3">📋</Text>
        <Text className="text-lg font-bold text-gray-900 mb-2">
          Vos commandes
        </Text>
        <Text className="text-gray-500 text-center">
          Connectez-vous pour voir vos commandes
        </Text>
        <TouchableOpacity
          className="mt-6 bg-brand-500 rounded-xl px-6 py-3"
          onPress={() => router.push("/auth/login")}
        >
          <Text className="text-white font-bold">Se connecter</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    );
  }

  const renderItem = ({ item }: { item: CommandeSummary }) => {
    const totalFormate =
      new Intl.NumberFormat("fr-FR").format(item.total / 100) + " FCFA";
    const dateFormatee = new Date(item.createdAt).toLocaleDateString(
      "fr-FR",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );

    return (
      <TouchableOpacity
        className="bg-gray-50 rounded-xl p-4 mb-3 border border-gray-100"
        onPress={() => handlePress(item.id)}
        activeOpacity={0.7}
      >
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1 mr-3">
            <Text className="font-semibold text-gray-900">
              {item.restaurantNom ?? `Commande ${item.numero}`}
            </Text>
            <Text className="text-sm text-gray-500 mt-0.5">
              {dateFormatee}
            </Text>
          </View>
          {renderStatutBadge(item.statut)}
        </View>
        <View className="flex-row justify-between items-center">
          <Text className="text-sm text-gray-600">
            {item.modeCommande === "livraison" ? "🚚 Livraison" : "📦 Emporter"}
          </Text>
          <Text className="font-bold text-gray-900">{totalFormate}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-5 pt-6 pb-4">
        <Text className="text-3xl font-bold text-gray-900">Mes commandes</Text>
        <Text className="text-gray-500 mt-1">
          {commandes?.length ?? 0} commande{(commandes?.length ?? 0) > 1 ? "s" : ""}
        </Text>
      </View>

      {commandes && commandes.length > 0 ? (
        <FlatList
          data={commandes}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#3b82f6"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View className="flex-1 justify-center items-center px-8">
          <Text className="text-5xl mb-4">📋</Text>
          <Text className="text-lg font-bold text-gray-900 mb-2">
            Aucune commande
          </Text>
          <Text className="text-gray-500 text-center">
            Vos commandes apparaîtront ici une fois passées
          </Text>
          <TouchableOpacity
            className="mt-6"
            onPress={() => router.back()}
          >
            <Text className="text-brand-500 font-semibold underline">
              Retour à la carte
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}