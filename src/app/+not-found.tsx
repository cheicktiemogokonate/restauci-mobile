import { Link, Stack } from "expo-router";
import { View, Text } from "react-native";

/**
 * Route de secours : affiché par Expo Router quand aucune route
 * ne correspond à l'URL demandée (deep link invalide, lien cassé…).
 */
export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Page introuvable" }} />
      <View className="flex-1 items-center justify-center bg-white px-8">
        <Text className="mb-2 text-[48px]">🔍</Text>
        <Text className="mb-2 text-xl font-bold text-ink-900">
          Page introuvable
        </Text>
        <Text className="mb-6 text-center text-sm leading-5 text-ink-500">
          Cette adresse n&apos;existe pas ou le lien est expiré.
        </Text>
        <Link
          href="/(tabs)"
          className="rounded-xl bg-green-900 px-6 py-3 text-sm font-bold text-white"
        >
          Retour à l&apos;accueil
        </Link>
      </View>
    </>
  );
}
