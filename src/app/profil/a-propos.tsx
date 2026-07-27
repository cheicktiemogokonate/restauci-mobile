import { EmptyState } from "@/components/ui/EmptyState";
import { Text, View } from "react-native";

export default function AProposScreen() {
  return (
    <View className="flex-1 bg-ink-50">
      <View className="mx-4 mt-4 rounded-2xl border border-ink-200 bg-green-800 p-4">
        <Text className="text-sm font-semibold text-ink-50">
          Toutci vous accompagne pour commander simplement.
        </Text>
      </View>

      {/* 🔗 Brancher sur l'API quand l'endpoint est disponible */}
      <EmptyState
        emoji="ℹ️"
        title="Cette section arrive bientôt"
        message="Les informations sur l’application et son équipe seront bientôt disponibles."
      />
    </View>
  );
}
