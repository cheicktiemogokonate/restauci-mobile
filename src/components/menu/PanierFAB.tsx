import { useStore } from "@/store";
import { useRouter } from "expo-router";
import { ShoppingBag } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface PanierFABProps {
  fraisLivraison?: number;
  restaurantNom?: string;
}

export const PanierFAB: React.FC<PanierFABProps> = ({
  fraisLivraison = 0,
  restaurantNom,
}) => {
  const router = useRouter();
  const nombre = useStore((s) => s.nombreArticles());

  if (nombre === 0) return null;

  const handlePress = () => {
    const params = new URLSearchParams();
    params.set("frais", String(fraisLivraison));
    if (restaurantNom) params.set("nom", restaurantNom);
    router.push(`/(tabs)/panier?${params.toString()}`);
  };

  return (
    <TouchableOpacity
      className="absolute bottom-8 right-4 w-14 h-14 rounded-full bg-green-700 justify-center items-center shadow-lg z-20"
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <ShoppingBag color="white" />
      <View className="absolute -top-2 -right-1">
        <View className="bg-danger-600 px-1 py-1 rounded-full">
          <Text className="text-white text-base font-bold w-5 h-5 text-center leading-5 overflow-hidden bg-danger-600 rounded-full">
            {nombre}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default PanierFAB;
