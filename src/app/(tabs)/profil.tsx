import { useStore } from "@/store";
import { useCommandesClient, type CommandeSummary } from "@/hooks/useCommandesClient";
import { Link, useRouter } from "expo-router";
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

export default function ProfilScreen() {
  const client = useStore((s) => s.client);
  const isLoading = useStore((s) => s.isLoading);
  const logout = useStore((s) => s.logout);
  const router = useRouter();

  const {
    data: commandes,
    isLoading: isLoadingCommandes,
    refetch,
    isRefetching,
  } = useCommandesClient();

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    );
  }

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
        </View>

        <View className="mt-auto pb-8">
          <TouchableOpacity
            className="items-center"
            onPress={() => router.back()}
          >
            <Text className="text-gray-400 text-sm underline">
              Continuer sans compte
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleLogout = () => {
    logout();
  };

  const renderCommande = ({
    item,
  }: {
    item: CommandeSummary;
  }) => {
    const statutColor = STATUT_COLORS[item.statut] ?? "text-gray-500";
    const statutLabel =
      STATUT_LABELS[item.statut] ?? item.statut;
    const totalFormate = new Intl.NumberFormat("fr-FR").format(item.total / 100) + " FCFA";
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
        className="bg-gray-50 rounded-xl p-4 mb-3 border border-gray-100 active-opacity-70"
        onPress={() => router.push(`/commandes/${item.id}`)}
      >
        <View className="flex-row justify-between items-start mb-2">
          <View>
            <Text className="font-semibold text-gray-900">
              {item.restaurantNom ?? `Commande ${item.numero}`}
            </Text>
            <Text className="text-sm text-gray-500">{dateFormatee}</Text>
          </View>
          <Text className={`font-semibold ${statutColor}`}>
            {statutLabel}
          </Text>
        </View>
        <View className="flex-row justify-between items-center">
          <Text className="text-sm text-gray-600">
            {item.modeCommande === "livraison" ? "Livraison" : "Retrait"}
          </Text>
          <Text className="font-bold text-gray-900">{totalFormate}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 pt-8 pb-4 border-b border-gray-100">
        <View className="flex-row justify-between items-center">
          <Text className="text-3xl font-bold text-brand-600">Profil</Text>
          <TouchableOpacity
            className="bg-gray-100 px-4 py-2 rounded-lg"
            onPress={handleLogout}
          >
            <Text className="text-gray-600 font-medium text-sm">Déconnexion</Text>
          </TouchableOpacity>
        </View>

        <View className="mt-4 bg-gray-50 rounded-xl p-4">
          <Text className="text-lg font-semibold text-gray-900">
            {client.nom}
          </Text>
          <Text className="text-gray-600 mt-1">{client.telephone}</Text>
          {client.email && (
            <Text className="text-gray-500 text-sm mt-0.5">
              {client.email}
            </Text>
          )}
        </View>
      </View>

      <View className="px-6 pt-5 flex-1">
        <Text className="text-lg font-bold text-gray-900 mb-4">
          Mes commandes
        </Text>

        {isLoadingCommandes ? (
          <View className="flex-1 justify-center items-center py-12">
            <ActivityIndicator size="small" color="#3b82f6" />
          </View>
        ) : commandes && commandes.length > 0 ? (
          <FlatList
            data={commandes}
            keyExtractor={(item) => item.id}
            renderItem={renderCommande}
            contentContainerStyle={{ paddingBottom: 24 }}
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
          <View className="flex-1 justify-center items-center py-12">
            <Text className="text-4xl mb-3">🛒</Text>
            <Text className="text-gray-500 text-center">
              Vous n'avez pas encore de commande
            </Text>
            <Link href="/(tabs)" className="mt-4">
              <Text className="text-brand-500 font-medium underline">
                Découvrir les restaurants
              </Text>
            </Link>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}