import { useRouter } from "expo-router";
import { ClipboardList } from "lucide-react-native";
import { Text, View } from "react-native";
import { Button } from "../ui/button";
import { Filtre } from "./CommandeCard";

interface CommandeListEmptyProps {
  filtre: Filtre;
}

export function CommandeListEmpty({ filtre }: CommandeListEmptyProps) {
  const router = useRouter();

  return (
    <View className="flex-1 justify-center items-center px-8">
      <ClipboardList size={44} color="#D1D5DB" />
      <Text className="text-lg font-bold text-black mt-4 mb-2">
        Aucune commande
      </Text>
      <Text className="text-gray-500 text-center">
        {filtre === "toutes"
          ? "Vos commandes apparaîtront ici une fois passées"
          : "Aucune commande ne correspond à ce filtre"}
      </Text>
      {/* <TouchableOpacity className="mt-6" onPress={() => router.back()}>
        <Text className="text-brand-800 font-semibold underline">
          Retour à la carte
        </Text>
      </TouchableOpacity> */}

      <Button variant={"link"} onPress={() => router.back()} className="mt-6">
        <Text className="text-brand-800 font-semibold underline">
          Retour à la carte
        </Text>
      </Button>
    </View>
  );
}
