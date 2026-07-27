import { Stack } from "expo-router";
import { useStore } from "@/store";

export default function CommandesLayout() {
  const client = useStore((s) => s.client);
  const isLoading = useStore((s) => s.isLoading);

  if (isLoading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Protected guard={!!client}>
        <Stack.Screen name="historique" options={{ title: "Historique" }} />
      </Stack.Protected>
    </Stack>
  );
}
