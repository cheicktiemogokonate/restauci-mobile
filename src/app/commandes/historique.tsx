import { EmptyState } from "@/components/ui/EmptyState";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Pressable, SafeAreaView, Text, View } from "react-native";

export default function HistoriqueCommandesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-ink-50">
      <View className="flex-row items-center border-b border-ink-200 px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-ink-100"
        >
          <ChevronLeft size={20} color="green-900" />
        </Pressable>
        <Text className="flex-1 text-center text-lg font-bold text-green-900">
          Historique des commandes
        </Text>
        <View className="h-10 w-10" />
      </View>

      <View className="mx-4 mt-4 rounded-2xl border border-ink-200 bg-green-700 p-4">
        <Text className="text-sm font-semibold text-ink-50">
          Retrouvez l’historique de vos commandes ici.
        </Text>
      </View>

      {/* 🔗 Brancher sur l'API quand l'endpoint est disponible */}
      <EmptyState
        emoji="🧾"
        title="Cette section arrive bientôt"
        message="Votre historique de commandes sera bientôt disponible."
      />
    </SafeAreaView>
  );
}
