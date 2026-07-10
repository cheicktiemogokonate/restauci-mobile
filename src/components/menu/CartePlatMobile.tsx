import { useStore } from "@/store";
import type { Plat } from "@/types";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import React, { useCallback, useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";

// ============================================
// Composant CartePlatMobile — carte menu
// ============================================
interface CartePlatMobileProps {
  plat: Plat;
  onAjouter: (plat: Plat) => void;
  onRetirer: (platId: string) => void;
}

const BLUR_HASH = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";

export const CartePlatMobile: React.FC<CartePlatMobileProps> = ({
  plat,
  onAjouter,
  onRetirer,
}) => {
  const items = useStore((s) => s.items);
  const cartItem = useMemo(
    () => items.find((item) => item.platId === plat.id),
    [items, plat.id],
  );
  const quantite = cartItem?.quantite ?? 0;

  const prixFormate = useMemo(() => {
    return new Intl.NumberFormat("fr-FR").format(plat.prix) + " FCFA";
  }, [plat.prix]);

  const handleAdd = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAjouter(plat);
  }, [onAjouter, plat]);

  const handleRemove = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRetirer(plat.id);
  }, [onRetirer, plat.id]);

  const estIndisponible = !plat.disponible;

  return (
    <View
      className={`flex-row bg-white my-2 rounded-2xl  mx-4 mb-2.5 p-4 shadow-sm ${estIndisponible ? "opacity-55" : ""}`}
    >
      <View className="w-18  h-18 rounded-2.5 overflow-hidden bg-ink-100 mr-3">
        {plat.photoUrl ? (
          <Image
            source={plat.photoUrl}
            style={{ width: 72, height: 72, borderRadius: 10 }}
            placeholder={{ blurhash: BLUR_HASH }}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View className="flex-1 justify-center items-center ">
            <Text className="text-3xl">🍽</Text>
          </View>
        )}
      </View>

      <View className="flex-1 justify-center">
        <View className="flex-row items-center">
          <View className="flex-1 mr-2 gap-0.5">
            <Text
              className={`text-base font-semibold ${estIndisponible ? "text-ink-400" : "text-ink-900"}`}
              numberOfLines={1}
            >
              {plat.nom}
            </Text>
            {plat.description && (
              <Text
                className={`text-xs leading-4 ${estIndisponible ? "text-ink-400" : "text-ink-500"}`}
                numberOfLines={1}
              >
                {plat.description}
              </Text>
            )}
            <Text
              className={`text-sm font-bold mt-0.5 ${estIndisponible ? "text-ink-400" : "text-green-500"}`}
            >
              {prixFormate}
            </Text>
          </View>

          {estIndisponible ? (
            <View className="bg-danger-50 px-2.5 py-1.5 rounded-2xl border border-danger-200">
              <Text className="text-xs font-semibold text-danger-600">
                Indisponible
              </Text>
            </View>
          ) : quantite > 0 ? (
            <View className="flex-row items-center bg-green-50 rounded-full px-0.5 gap-1">
              <TouchableOpacity
                className="w-6 h-6 rounded-full bg-green-500 justify-center items-center"
                onPress={handleRemove}
                activeOpacity={0.6}
              >
                <Text className="text-lg font-bold text-white leading-5">
                  −
                </Text>
              </TouchableOpacity>
              <Text className="text-sm font-bold text-green-700 w-5 text-center">
                {quantite}
              </Text>
              <TouchableOpacity
                className="w-6 h-6 rounded-full bg-green-500 justify-center items-center"
                onPress={handleAdd}
                activeOpacity={0.6}
              >
                <Text className="text-lg font-bold text-white leading-5">
                  +
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              className="w-9 h-9 rounded-full bg-green-500 justify-center items-center"
              onPress={handleAdd}
              activeOpacity={0.6}
            >
              <Text className="text-xl font-bold text-white leading-5.5">
                +
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

export default CartePlatMobile;
