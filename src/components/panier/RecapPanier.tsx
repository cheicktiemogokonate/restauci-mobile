import { useStore } from "@/store";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface RecapPanierProps {
  fraisLivraison: number;
  onCommander: () => void;
  disabled?: boolean;
}

export const RecapPanier: React.FC<RecapPanierProps> = ({
  fraisLivraison,
  onCommander,
  disabled,
}) => {
  const sousTotal = useStore((s) => s.sousTotal());
  const nombreArticles = useStore((s) => s.nombreArticles());

  const total = sousTotal + fraisLivraison;

  const sousTotalFormate = new Intl.NumberFormat("fr-FR").format(sousTotal) + " FCFA";
  const fraisFormate = new Intl.NumberFormat("fr-FR").format(fraisLivraison) + " FCFA";
  const totalFormate = new Intl.NumberFormat("fr-FR").format(total) + " FCFA";

  return (
    <View style={styles.container}>
      <View style={styles.lignes}>
        <View style={styles.ligne}>
          <Text style={styles.label}>Sous-total ({nombreArticles} article{nombreArticles > 1 ? "s" : ""})</Text>
          <Text style={styles.valeur}>{sousTotalFormate}</Text>
        </View>
        <View style={styles.ligne}>
          <Text style={styles.label}>Livraison</Text>
          <Text style={styles.valeur}>{fraisFormate}</Text>
        </View>
        <View style={[styles.ligne, styles.ligneTotal]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValeur}>{totalFormate}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, disabled && styles.buttonDisabled]}
        onPress={onCommander}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>
          Commander {nombreArticles > 0 ? `(${nombreArticles})` : ""}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 12,
  },
  lignes: {
    gap: 8,
  },
  ligne: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ligneTotal: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
    marginTop: 4,
  },
  label: {
    fontSize: 14,
    color: "#6b7280",
  },
  valeur: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  totalValeur: {
    fontSize: 18,
    fontWeight: "800",
    color: "#22c55e",
  },
  button: {
    backgroundColor: "#22c55e",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#9ca3af",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default RecapPanier;