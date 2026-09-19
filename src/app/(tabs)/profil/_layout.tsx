import { NavigationBackButton } from "@/components/navigation/navigation-back-button";
import { useStore } from "@/store";
import { Redirect, useRouter } from "expo-router";
import { Stack } from "expo-router/stack";

export default function ProfilLayout() {
  const router = useRouter();
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
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: "transparent" },
        headerBackVisible: false,
        headerLeft: () => (
          <NavigationBackButton
            accessibilityLabel="Revenir au profil"
            onPress={() => router.back()}
          />
        ),
        headerShadowVisible: false,
        headerShown: true,
        headerStyle: { backgroundColor: "rgba(248,250,247,0.78)" },
        headerTitleAlign: "center",
        headerTitleStyle: {
          color: "#141714",
          fontSize: 17,
          fontWeight: "800",
        },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="historique" options={{ title: "Historique" }} />
      <Stack.Screen name="favoris" options={{ title: "Mes favoris" }} />
      <Stack.Screen name="adresses" options={{ title: "Mes adresses" }} />
      <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
      <Stack.Screen name="a-propos" options={{ title: "À propos" }} />
    </Stack>
  );
}
