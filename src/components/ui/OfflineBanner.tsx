import { useConnectivite } from "@/hooks/useConnectivite";
import React from "react";
import { Text, View } from "react-native";

export const OfflineBanner: React.FC = () => {
  const { isConnected } = useConnectivite();

  if (isConnected !== false) return null;

  return (
    <View className="absolute top-0 left-0 right-0 z-50 bg-danger-600 py-2 px-4 items-center">
      <Text className="text-white text-xs font-semibold">
        Pas de connexion internet
      </Text>
    </View>
  );
};

export default OfflineBanner;
