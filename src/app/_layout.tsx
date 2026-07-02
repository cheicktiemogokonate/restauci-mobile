import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router/stack";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";
import { useStore } from "../store";

const queryClient = new QueryClient();

function NotificationSetup() {
  usePushNotifications();
  return null;
}

export default function RootLayout() {
  const loadToken = useStore((s) => s.loadToken);

  useEffect(() => {
    loadToken();
  }, [loadToken]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <NotificationSetup />
          <OfflineBanner />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="auth" options={{ presentation: "modal" }} />
            <Stack.Screen
              name="restaurant"
              options={{ presentation: "modal" }}
            />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
