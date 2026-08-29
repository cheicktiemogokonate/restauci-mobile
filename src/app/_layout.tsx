import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { ApiClientError } from "@/lib/api";
import { useReactQueryLifecycle } from "@/hooks/useReactQueryLifecycle";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { PortalHost } from "@rn-primitives/portal";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ErrorBoundaryProps } from "expo-router";
import { Stack } from "expo-router/stack";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";
import { useStore } from "../store";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Réessayer une seule fois sur erreur réseau avant d'afficher l'état d'erreur.
      retry: (failureCount, error) => {
        if (!(error instanceof ApiClientError)) return failureCount < 1;
        if (error.status === 429 || error.status === 503) {
          return failureCount < 1;
        }
        return error.status >= 500 && failureCount < 1;
      },
      retryDelay: (attempt, error) =>
        error instanceof ApiClientError && error.retryAfter !== null
          ? error.retryAfter * 1000
          : Math.min(1000 * 2 ** attempt, 10_000),
      // Données considérées fraîches pendant 30s : évite les refetch inutiles
      // au remontage d'un composant (ex. navigation avant/arrière).
      staleTime: 30_000,
      // Données conservées en cache 5 min après que le dernier observateur
      // se désabonne (ex. naviguer hors d'un écran).
      gcTime: 5 * 60_000,
    },
    mutations: {
      // Pas de retry automatique sur les mutations : évite les doubles soumissions.
      retry: 0,
    },
  },
});

// ────────────────────────────────────────────────────────────────────────────
// Error Boundary racine — attrape les erreurs JS non gérées dans l'arbre React
// et affiche un écran de récupération au lieu d'un écran blanc.
// ────────────────────────────────────────────────────────────────────────────
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View
      style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, backgroundColor: "#fff" }}
    >
      <Text style={{ fontSize: 48, marginBottom: 8 }}>⚠️</Text>
      <Text style={{ fontSize: 20, fontWeight: "bold", color: "#111827", marginBottom: 8 }}>
        Quelque chose s&apos;est mal passé
      </Text>
      <Text style={{ fontSize: 13, color: "#6b7280", textAlign: "center", marginBottom: 24, lineHeight: 18 }}>
        {__DEV__ ? error.message : "Une erreur inattendue s'est produite. Veuillez réessayer."}
      </Text>
      <TouchableOpacity
        onPress={retry}
        style={{ backgroundColor: "#14532d", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, minHeight: 44, justifyContent: "center" }}
        accessibilityRole="button"
        accessibilityLabel="Réessayer"
      >
        <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 15 }}>Réessayer</Text>
      </TouchableOpacity>
    </View>
  );
}

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const loadToken = useStore((s) => s.loadToken);
  const isLoading = useStore((s) => s.isLoading);
  const clientId = useStore((s) => s.client?.id ?? null);
  const previousClientId = useRef<string | null | undefined>(undefined);
  useReactQueryLifecycle();
  usePushNotifications();

  useEffect(() => {
    loadToken();
  }, [loadToken]);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading]);

  useEffect(() => {
    if (previousClientId.current === undefined) {
      previousClientId.current = clientId;
      return;
    }
    if (previousClientId.current !== clientId) {
      // Évite qu'une réponse ou mutation de l'ancien compte reste observable
      // après logout/reconnexion. Les données publiques seront refetchées.
      queryClient.clear();
      previousClientId.current = clientId;
    }
  }, [clientId]);

  if (isLoading) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <BottomSheetModalProvider>
            <>
              <Stack
                screenOptions={{
                  headerShown: false,
                }}
              >
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="auth" options={{ presentation: "modal" }} />
                <Stack.Screen name="restaurant/[slug]" />
                <Stack.Screen name="residences/[slug]" />
                <Stack.Screen name="reservations/[id]" />
                <Stack.Screen name="payments/callback" />
              </Stack>
              <OfflineBanner />
              <PortalHost />
            </>
          </BottomSheetModalProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
