import { Stack } from "expo-router";
import { useStore } from "@/store";

export default function ProfilLayout() {
  const client = useStore((s) => s.client);
  const isLoading = useStore((s) => s.isLoading);

  if (isLoading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Protected guard={!!client}>
        <Stack.Screen name="adresses" options={{ title: "Mes adresses" }} />
        <Stack.Screen name="paiement" options={{ title: "Paiement" }} />
        <Stack.Screen name="coupons" options={{ title: "Coupons" }} />
      </Stack.Protected>
      <Stack.Screen name="support" options={{ title: "Support" }} />
      <Stack.Screen name="a-propos" options={{ title: "À propos" }} />
    </Stack>
  );
}
