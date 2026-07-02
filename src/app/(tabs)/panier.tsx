import {
  FormulaireCommande,
  type FormulaireCommandeRef,
} from "@/components/panier/FormulaireCommande";
import { ItemPanier } from "@/components/panier/ItemPanier";
import { RecapPanier } from "@/components/panier/RecapPanier";
import { useStore } from "@/store";
import type { CommandeItem } from "@/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PanierScreen() {
  const { frais: fraisStr, nom: restaurantNom } = useLocalSearchParams<{
    frais?: string;
    nom?: string;
  }>();

  const items = useStore((s) => s.items);
  const restaurantId = useStore((s) => s.restaurantId);
  const viderPanier = useStore((s) => s.viderPanier);
  const router = useRouter();

  const [confirmationId, setConfirmationId] = useState<string | null>(null);
  const formulaireRef = useRef<FormulaireCommandeRef>(null);

  const fraisLivraison = Number(fraisStr ?? 0);

  const handleCommander = () => {
    formulaireRef.current?.open();
  };

  const handleCommandeSuccess = (commandeId: string) => {
    setConfirmationId(commandeId);
  };

  const handleConfirmationClose = () => {
    setConfirmationId(null);
    router.back();
  };

  if (confirmationId) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center px-8">
        <Text className="text-6xl mb-4">✅</Text>
        <Text className="text-2xl font-extrabold text-ink-900 mb-2">
          Commande confirmée !
        </Text>
        <Text className="text-base text-ink-500 text-center mb-1">
          Votre commande a été envoyée au restaurant
        </Text>
        {restaurantNom && (
          <Text className="text-base text-ink-700 font-medium mb-6">
            chez {restaurantNom}
          </Text>
        )}
        <TouchableOpacity
          className="bg-brand-500 rounded-xl py-3.5 px-8"
          onPress={handleConfirmationClose}
        >
          <Text className="text-white text-base font-bold">
            Retour à la carte
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center px-8">
        <Text className="text-6xl mb-4">🛒</Text>
        <Text className="text-xl font-bold text-ink-900 mb-2">
          Votre panier est vide
        </Text>
        <Text className="text-ink-500 text-center mb-6">
          Ajoutez des plats depuis le menu d'un restaurant
        </Text>
        <TouchableOpacity
          className="bg-brand-500 rounded-xl py-3.5 px-6"
          onPress={() => router.back()}
        >
          <Text className="text-white text-[15px] font-semibold">
            Découvrir les restaurants
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const renderItem = ({ item }: { item: CommandeItem }) => (
    <ItemPanier item={item} />
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-ink-100">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-2xl text-ink-700">←</Text>
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-bold text-ink-900">Panier</Text>
          {restaurantNom && (
            <Text className="text-[13px] text-ink-500 mt-0.5" numberOfLines={1}>
              {restaurantNom}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={viderPanier}>
          <Text className="text-sm font-medium text-danger-600">Vider</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.platId}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      />

      <RecapPanier
        fraisLivraison={fraisLivraison}
        onCommander={handleCommander}
      />

      {restaurantId && (
        <FormulaireCommande
          ref={formulaireRef}
          restaurantId={restaurantId}
          fraisLivraison={fraisLivraison}
          onSuccess={handleCommandeSuccess}
        />
      )}
    </SafeAreaView>
  );
}
