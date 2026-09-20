import { getLegalPageUrl, LEGAL_PAGES } from "@/constants/urls";
import { ChevronRight } from "lucide-react-native";
import { Alert, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { theme } from "@/constants/theme";

const LEGAL_PAGE_IDS = [
  "cgu",
  "mentions",
  "confidentialite",
  "cookies",
] as const;

function openLegalPage(id: (typeof LEGAL_PAGE_IDS)[number]) {
  void Linking.openURL(getLegalPageUrl(id)).catch(() => {
    Alert.alert(
      "Lien indisponible",
      "Impossible d’ouvrir ce document pour le moment.",
    );
  });
}

export default function AProposScreen() {
  return (
    <ScrollView
      className="flex-1"
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

      <View className="overflow-hidden rounded-3xl bg-white">
        <Text className="px-5 pt-5 text-lg font-bold text-ink-900">
          Documents légaux
        </Text>
        {LEGAL_PAGE_IDS.map((id, index) => (
          <Pressable
            key={id}
            accessibilityRole="link"
            className={`min-h-14 flex-row items-center justify-between px-5 py-4 ${
              index < LEGAL_PAGE_IDS.length - 1 ? "border-b border-ink-100" : ""
            }`}
            onPress={() => openLegalPage(id)}
          >
            <Text className="text-base text-ink-900">{LEGAL_PAGES[id].label}</Text>
            <ChevronRight color={theme.ink400} size={18} strokeWidth={2} />
          </Pressable>
        ))}
      </View>

      <Text className="text-center text-sm text-ink-400">
        Toutci · Version 1.0.0
      </Text>
    </ScrollView>
  );
}
