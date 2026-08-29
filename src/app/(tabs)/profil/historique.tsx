import {
  CommandeCard,
  categoriser,
  estCommandeTerminee,
  type Filtre,
} from "@/components/commandes/CommandeCard";
import {
  CommandeFiltres,
  FILTRES_HISTORIQUE,
} from "@/components/commandes/CommandeFiltres";
import { CommandeListEmpty } from "@/components/commandes/CommandeListEmpty";
import { ErrorView } from "@/components/ui/ErrorView";
import { useCommandesInfinies } from "@/hooks/useCommandesClient";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HistoriqueCommandesScreen() {
  const router = useRouter();
  const [filtre, setFiltre] = useState<Filtre>("toutes");
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

  const commandesTerminees = useMemo(() => {
    const historique =
      commandes?.filter((commande) =>
        estCommandeTerminee(commande.statut),
      ) ?? [];

    if (filtre === "toutes") return historique;
    return historique.filter(
      (commande) => categoriser(commande.statut) === filtre,
    );
  }, [commandes, filtre]);

  const handlePress = useCallback(
    (id: string) => {
      router.push(`/(tabs)/commandes/${id}`);
    },
    [router],
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#166534" />
      </View>
    );
  }

  if (error && commandes.length === 0) {
    return (
      <View className="flex-1 bg-white">
        <ErrorView
          title="Historique indisponible"
          message={
            error instanceof Error
              ? error.message
              : "Impossible de charger l’historique pour le moment."
          }
          onRetry={() => void refetch()}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="px-5 pb-2 pt-4">
        <Text className="text-2xl font-extrabold text-ink-900">
          Commandes terminées
        </Text>
        <Text className="mt-1 text-sm text-ink-500">
          Retrouvez vos commandes livrées et annulées
        </Text>
      </View>

      <CommandeFiltres
        filtreActif={filtre}
        onSelectFiltre={setFiltre}
        filtres={FILTRES_HISTORIQUE}
      />

      <FlatList
        data={commandesTerminees}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CommandeCard item={item} onPress={handlePress} />
        )}
        ListEmptyComponent={
          <CommandeListEmpty
            filtre={filtre}
            contexte="historique"
          />
        }
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 80,
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
    </View>
  );
}
