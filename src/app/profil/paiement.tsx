import { EmptyState } from "@/components/ui/EmptyState";
import { Text, View } from "react-native";

export default function PaiementScreen() {
  return (
    <View className="flex-1 bg-ink-50">
      <View className="mx-4 mt-4 rounded-2xl border border-ink-200 bg-info p-4">
        <Text className="text-sm font-semibold text-ink-50">
          Ajoutez ou gérez vos moyens de paiement ici.
        </Text>
      </View>

      {/* 🔗 Brancher sur l'API quand l'endpoint est disponible */}
      <EmptyState
        emoji="💳"
        title="Cette section arrive bientôt"
        message="La gestion de vos moyens de paiement sera disponible prochainement."
      />
    </View>
  );
}
