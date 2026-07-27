import { EmptyState } from "@/components/ui/EmptyState";
import { Text, View } from "react-native";

export default function AdressesScreen() {
  return (
    <View className="flex-1 bg-ink-50">
      <View className="mx-4 mt-4 rounded-2xl border border-ink-200 bg-green-900 p-4">
        <Text className="text-sm font-semibold text-ink-50">
          Gérez vos adresses de livraison ici.
        </Text>
      </View>

      {/* 🔗 Brancher sur l'API quand l'endpoint est disponible */}
      <EmptyState
        emoji="📍"
        title="Cette section arrive bientôt"
        message="L’ajout et la gestion de vos adresses seront disponibles très prochainement."
      />
    </View>
  );
}
