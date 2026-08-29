import { Redirect, Stack } from "expo-router";
import { useStore } from "@/store";

export default function ProfilLayout() {
  const client = useStore((s) => s.client);
  const isLoading = useStore((s) => s.isLoading);

  if (isLoading) {
    return null;
  }

  if (!client) {
    return (
      <Redirect
        href={{
          pathname: "/auth/login",
          params: { redirectTo: "/(tabs)/profil" },
        }}
      />
    );
  }

  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="historique" options={{ title: "Historique" }} />
      <Stack.Screen name="favoris" options={{ title: "Mes favoris" }} />
      <Stack.Screen name="adresses" options={{ title: "Mes adresses" }} />
      <Stack.Screen name="paiement" options={{ title: "Paiement" }} />
      <Stack.Screen name="coupons" options={{ title: "Coupons" }} />
      <Stack.Screen name="support" options={{ title: "Support" }} />
      <Stack.Screen name="a-propos" options={{ title: "À propos" }} />
    </Stack>
  );
}
