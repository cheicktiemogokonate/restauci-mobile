import { useStore } from "@/store";
import type { CommandeItem } from "@/types";
import * as Haptics from "expo-haptics";
import React, { useCallback, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

interface ItemPanierProps {
  item: CommandeItem;
}

export const ItemPanier: React.FC<ItemPanierProps> = ({ item }) => {
  const [translateX, setTranslateX] = useState(0);
  const ajouterItem = useStore((s) => s.ajouterItem);
  const retirerItem = useStore((s) => s.retirerItem);

  const prixTotal = item.prix * item.quantite;
  const prixFormate =
    new Intl.NumberFormat("fr-FR").format(prixTotal) + " FCFA";
  const prixUnitaire =
    new Intl.NumberFormat("fr-FR").format(item.prix) + " FCFA";

  const handleAjouter = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    ajouterItem({ id: item.platId, nom: item.nom, prix: item.prix });
  }, [ajouterItem, item.platId, item.nom, item.prix]);

  const handleRetirer = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    retirerItem(item.platId);
  }, [retirerItem, item.platId]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      if (e.translationX < 0) {
        setTranslateX(Math.max(e.translationX, -100));
      }
    })
    .onEnd((e) => {
      if (e.translationX < -60) {
        setTranslateX(-100);
      } else {
        setTranslateX(0);
      }
    });

  const handleDelete = () => {
    setTranslateX(0);
    handleRetirer();
  };

  return (
    <View style={styles.wrapper}>
      <Pressable style={styles.deleteAction} onPress={handleDelete}>
        <Text style={styles.deleteText}>🗑</Text>
        <Text style={styles.deleteLabel}>Supprimer</Text>
      </Pressable>

      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.container,
            { transform: [{ translateX: translateX }] },
          ]}
        >
          <View style={styles.info}>
            <Text style={styles.nom} numberOfLines={2}>
              {item.nom}
            </Text>
            <Text style={styles.prixUnitaire}>{prixUnitaire} / unité</Text>
          </View>

          <View style={styles.actions}>
            <Text style={styles.prixTotal}>{prixFormate}</Text>
            <View style={styles.quantiteRow}>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={handleRetirer}
                activeOpacity={0.6}
              >
                <Text style={styles.qtyButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.quantite}>{item.quantite}</Text>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={handleAjouter}
                activeOpacity={0.6}
              >
                <Text style={styles.qtyButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    backgroundColor: "#ef4444",
  },
  deleteAction: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteText: {
    fontSize: 20,
  },
  deleteLabel: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  nom: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  prixUnitaire: {
    fontSize: 12,
    color: "#9ca3af",
  },
  actions: {
    alignItems: "flex-end",
    gap: 6,
  },
  prixTotal: {
    fontSize: 14,
    fontWeight: "700",
    color: "#22c55e",
  },
  quantiteRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderRadius: 20,
    paddingHorizontal: 2,
    gap: 4,
  },
  qtyButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#22c55e",
    justifyContent: "center",
    alignItems: "center",
  },
  qtyButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    lineHeight: 20,
  },
  quantite: {
    fontSize: 14,
    fontWeight: "700",
    color: "#16a34a",
    minWidth: 20,
    textAlign: "center",
  },
});

export default ItemPanier;
