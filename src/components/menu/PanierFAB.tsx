import { useStore } from "@/store";
import { selectNombreArticles } from "@/store/selectors";
import { useRouter } from "expo-router";
import { ShoppingBag } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

// Les frais de livraison viennent maintenant de l'API directement depuis
// panier.tsx (useRestaurant). PanierFAB n'a plus besoin de les transmettre.
interface PanierFABProps {
  bottomOffset?: number;
}

export const PanierFAB: React.FC<PanierFABProps> = ({ bottomOffset = 32 }) => {
  const router = useRouter();
  const nombre = useStore(selectNombreArticles);

  if (nombre === 0) return null;

  const handlePress = () => {
    router.push("/panier");
  };

  return (
    <TouchableOpacity
      className="absolute right-4 w-14 h-14 rounded-full bg-brand-900 justify-center items-center shadow-lg z-20"
      onPress={handlePress}
      activeOpacity={0.8}
      style={{ bottom: bottomOffset }}
    >
      <ShoppingBag color="white" />
      <View className="absolute -top-2 -right-1">
        <View className="bg-danger-600 min-w-5 h-5 px-1 rounded-full justify-center items-center">
          <Text className="text-white text-sm font-bold text-center leading-5">
            {nombre}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default PanierFAB;
