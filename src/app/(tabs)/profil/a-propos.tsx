import { ScrollView, Text, View } from "react-native";

export default function AProposScreen() {
  return (
    <ScrollView
      className="flex-1 bg-ink-50"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 16 }}
    >
      <View className="rounded-3xl bg-green-900 p-6">
        <Text className="text-2xl font-extrabold text-white">Toutci</Text>
        <Text className="mt-2 text-base leading-6 text-white/80">
          Une application locale pour découvrir ce que votre ville a de
          meilleur, tout près d’ici.
        </Text>
      </View>

      <View className="rounded-3xl bg-white p-5">
        <Text className="text-lg font-bold text-ink-900">
          Pensée pour les villes ivoiriennes
        </Text>
        <Text className="mt-2 text-base leading-6 text-ink-600">
          Toutci commence par la restauration et met la proximité au centre :
          établissements autour de vous, informations claires, commande simple
          et suivi jusqu’à la livraison.
        </Text>
      </View>

      <View className="rounded-3xl bg-white p-5">
        <Text className="text-lg font-bold text-ink-900">Notre engagement</Text>
        <Text className="mt-2 text-base leading-6 text-ink-600">
          Une expérience fière, généreuse et sûre, conçue pour rester fluide
          sur mobile et transparente sur les prix comme sur le suivi.
        </Text>
      </View>

      <Text className="text-center text-sm text-ink-400">
        Toutci · Version 1.0.0
      </Text>
    </ScrollView>
  );
}
