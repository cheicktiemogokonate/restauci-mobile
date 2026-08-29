import { useRouter } from "expo-router";
import { ClipboardList } from "lucide-react-native";
import { Text, View } from "react-native";
import { Button } from "../ui/button";
import { Filtre } from "./CommandeCard";

interface CommandeListEmptyProps {
  filtre: Filtre;
  contexte?: "commandes" | "historique";
}

export function CommandeListEmpty({
  filtre,
  contexte = "commandes",
}: CommandeListEmptyProps) {
  const router = useRouter();
  const historique = contexte === "historique";
  const message =
    filtre === "toutes"
      ? "Vos commandes apparaîtront ici"
      : filtre === "en_cours"
        ? "Vous n’avez aucune commande en cours"
        : filtre === "livrees"
          ? "Vous n’avez aucune commande livrée"
          : "Vous n’avez aucune commande annulée";

  return (
    <View className="flex-1 justify-center items-center px-8">
      <ClipboardList size={44} color="#D1D5DB" />
      <Text className="text-lg font-bold text-black mt-4 mb-2">
        Aucune commande
      </Text>
      <Text className="text-gray-500 text-center">
        {message}
      </Text>
      {(!historique || filtre === "toutes") && (
        <Button
          variant="link"
          onPress={() => router.push("/(tabs)")}
          className="mt-6"
        >
          <Text className="text-brand-800 font-semibold underline">
            Découvrir les établissements
          </Text>
        </Button>
      )}
    </View>
  );
}
