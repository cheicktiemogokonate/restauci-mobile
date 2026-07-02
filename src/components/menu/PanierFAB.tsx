import { useStore } from "@/store";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
      style={styles.fab}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Text style={styles.icon}>🛒</Text>
      <View style={styles.badgeContainer}>
        <Text style={styles.badge}>{nombre}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 32,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#22c55e",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 20,
  },
  icon: {
    fontSize: 22,
  },
  badgeContainer: {
    position: "absolute",
    top: -2,
    right: -4,
  },
  badge: {
    backgroundColor: "#ef4444",
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    textAlign: "center",
    lineHeight: 20,
    overflow: "hidden",
  },
});

export default PanierFAB;