import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useConnectivite } from "@/hooks/useConnectivite";

export const OfflineBanner: React.FC = () => {
  const { isConnected } = useConnectivite();

  if (isConnected !== false) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>Pas de connexion internet</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: "#ef4444",
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  text: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
});

export default OfflineBanner;