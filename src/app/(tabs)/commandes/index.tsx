import { CommandeCard, categoriser, type Filtre } from "@/components/commandes/CommandeCard";
import { CommandeFiltres } from "@/components/commandes/CommandeFiltres";
import { CommandeListEmpty } from "@/components/commandes/CommandeListEmpty";
import { useCommandesClient } from "@/hooks/useCommandesClient";
import { useStore } from "@/store";
import { useRouter } from "expo-router";
import { ClipboardList, SlidersHorizontal } from "lucide-react-native";
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
  const {
    data: commandes,
    isLoading,
    refetch,
    isRefetching,
  } = useCommandesClient();

  const [filtre, setFiltre] = useState<Filtre>("toutes");

  const commandesFiltrees = useMemo(() => {
    if (!commandes) return [];
    if (filtre === "toutes") return commandes;
    return commandes.filter((c) => categoriser(c.statut) === filtre);
  }, [commandes, filtre]);

  const handlePress = useCallback(
    (id: string) => {
      router.push(`/(tabs)/commandes/${id}`);
    },
    [router],
  );

  const handleActionLivreeOuAnnulee = useCallback(() => {
    router.push("/(tabs)");
  }, [router]);

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
        <ActivityIndicator size="large" color="#1B4D1E" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-5 pt-4 pb-2 flex-row items-start justify-between">
        <View>
          <Text className="text-3xl font-extrabold text-black">
            Mes commandes
          </Text>
          <Text className="text-gray-400 mt-1">
            Retrouvez toutes vos commandes
          </Text>
        </View>
        <TouchableOpacity hitSlop={10} className="mt-1">
          <SlidersHorizontal size={22} color="#111111" />
        </TouchableOpacity>
      </View>

      <CommandeFiltres filtreActif={filtre} onSelectFiltre={setFiltre} />

      {commandesFiltrees.length > 0 ? (
        <FlatList
          data={commandesFiltrees}
          keyExtractor={(item) => item.id}
          className="mb-14"
          renderItem={({ item }) => (
            <CommandeCard
              item={item}
              onPress={handlePress}
              onActionLivreeOuAnnulee={handleActionLivreeOuAnnulee}
            />

          )}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 24,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#1B4D1E"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <CommandeListEmpty filtre={filtre} />
      )}
    </SafeAreaView>
  );
}