import {
  CommandeCard,
  categoriser,
  type Filtre,
} from "@/components/commandes/CommandeCard";
import { CommandeFiltres } from "@/components/commandes/CommandeFiltres";
import { CommandeListEmpty } from "@/components/commandes/CommandeListEmpty";
import { useCommandesInfinies } from "@/hooks/useCommandesClient";
import { useStore } from "@/store";
import { useRouter } from "expo-router";
import { AlertCircle, ClipboardList } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CommandesScreen() {
  const router = useRouter();
  const client = useStore((s) => s.client);
  const [filtre, setFiltre] = useState<Filtre>("en_cours");
  const {
    data: commandes,
    error,
    isLoading,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCommandesInfinies();

  const commandesFiltrees = useMemo(() => {
    const toutes = commandes ?? [];
    if (filtre === "toutes") return toutes;
    return toutes.filter(
      (commande) => categoriser(commande.statut) === filtre,
    );
  }, [commandes, filtre]);

  const handlePress = useCallback(
    (id: string) => {
      router.push(`/(tabs)/commandes/${id}`);
    },
    [router],
  );

  if (!client) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center px-8">
        <ClipboardList size={36} color="#9CA3AF" />
        <Text className="text-lg font-bold text-black mt-3 mb-2">
          Vos commandes
        </Text>
        <Text className="text-gray-500 text-center">
          Connectez-vous pour voir vos commandes
        </Text>
        <TouchableOpacity
          className="mt-6 bg-brand-900 rounded-2xl px-6 py-4"
          onPress={() =>
            router.push({
              pathname: "/auth/login",
              params: { redirectTo: "/(tabs)/commandes" },
            })
          }
        >
          <Text className="text-white font-bold">Se connecter</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#166534" />
      </SafeAreaView>
    );
  }

  if (error && commandes.length === 0) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-8">
        <AlertCircle size={42} color="#DC2626" />
        <Text className="mt-4 text-lg font-bold text-black">
          Chargement impossible
        </Text>
        <Text className="mt-2 text-center text-gray-500">
          {error instanceof Error
            ? error.message
            : "Impossible de récupérer vos commandes pour le moment."}
        </Text>
        <TouchableOpacity
          className="mt-6 rounded-2xl bg-brand-900 px-6 py-4"
          onPress={() => void refetch()}
          accessibilityRole="button"
          accessibilityLabel="Réessayer le chargement des commandes"
        >
          <Text className="font-bold text-white">Réessayer</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-5 pt-4 pb-2 flex-row items-start justify-between">
        <View>
          <Text className="text-3xl font-extrabold text-black">
            Vos commandes
          </Text>
          <Text className="text-gray-400 mt-1">
            Suivez les commandes en cours et retrouvez votre historique
          </Text>
        </View>
      </View>

      <CommandeFiltres
        filtreActif={filtre}
        onSelectFiltre={setFiltre}
      />

      <FlatList
        data={commandesFiltrees}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CommandeCard item={item} onPress={handlePress} />
        )}
        ListEmptyComponent={
          <CommandeListEmpty
            filtre={filtre}
            contexte={filtre === "en_cours" ? undefined : "historique"}
          />
        }
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 100,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#166534"
          />
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          hasNextPage ? (
            <TouchableOpacity
              onPress={() => void fetchNextPage()}
              disabled={isFetchingNextPage}
              className="my-3 items-center py-3"
            >
              {isFetchingNextPage ? (
                <ActivityIndicator color="#166534" />
              ) : (
                <Text className="font-semibold text-brand-800">
                  Charger plus
                </Text>
              )}
            </TouchableOpacity>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
