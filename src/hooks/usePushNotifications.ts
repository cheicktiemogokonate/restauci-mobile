import { useStore } from "@/store";
import { ENDPOINTS } from "@/constants/api";
import { apiFetch } from "@/lib/api";
import { storeExpoPushToken } from "@/lib/pushTokenStorage";
import Constants from "expo-constants";
import type { NotificationResponse } from "expo-notifications";
import { router } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";

export function usePushNotifications() {
  const isAuthLoading = useStore((s) => s.isLoading);
  const clientId = useStore((s) => s.client?.id ?? null);
  const accessToken = useStore((s) => s.token);
  const lastHandledResponseId = useRef<string | null>(null);
  const registeredOwnerRef = useRef<string | null>(null);

  const handleNotificationResponse = useCallback(
    (response: NotificationResponse) => {
      // La navigation n'est disponible qu'après la restauration de la session.
      // La réponse initiale sera relue lorsque `isAuthLoading` passera à false.
      if (isAuthLoading) return;

      const responseId = response.notification.request.identifier;
      if (lastHandledResponseId.current === responseId) return;
      lastHandledResponseId.current = responseId;

      const data = response.notification.request.content.data;

      const linkType = data?.lienType;
      const linkId = data?.lienId;
      if (
        clientId &&
        linkType === "reservation_residence" &&
        typeof linkId === "string" &&
        linkId.trim()
      ) {
        router.push(`/reservations/${linkId}`);
        return;
      }

      // Compatibilité avec les anciens et nouveaux payloads commande.
      const rawCommandeId =
        linkType === "commande" ? linkId : data?.commandeId ?? data?.id ?? data?.orderId;
      const commandeId =
        typeof rawCommandeId === "string" && rawCommandeId.trim()
          ? rawCommandeId
          : null;

      if (clientId && commandeId) {
        // Route absolue Expo Router vers l'onglet commandes
        router.push(`/(tabs)/commandes/${commandeId}`);
      } else {
        // Pas d'id : on atterrit sur la liste des commandes
        router.push("/(tabs)/commandes");
      }
    },
    [clientId, isAuthLoading],
  );

  useEffect(() => {
    let isActive = true;
    let responseListener: { remove: () => void } | null = null;

    import("expo-notifications")
      .then((Notifications) => {
        if (!isActive) return;

        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });

        responseListener =
          Notifications.addNotificationResponseReceivedListener(
            handleNotificationResponse,
          );

        const initialResponse = Notifications.getLastNotificationResponse();
        if (initialResponse) {
          handleNotificationResponse(initialResponse);
        }
      })
      .catch(() => {
        // expo-notifications indisponible (ex. Expo Go sans build dev)
      });

    return () => {
      isActive = false;
      responseListener?.remove();
    };
  }, [handleNotificationResponse]);

  useEffect(() => {
    if (isAuthLoading || !clientId || !accessToken) {
      registeredOwnerRef.current = null;
      return;
    }
    if (registeredOwnerRef.current === clientId) return;

    let cancelled = false;
    void import("expo-notifications")
      .then(async (Notifications) => {
        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ??
          Constants.easConfig?.projectId;
        if (typeof projectId !== "string" || !projectId) {
          throw new Error("ProjectId Expo manquant");
        }

        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "Notifications ToutCi",
            importance: Notifications.AndroidImportance.HIGH,
          });
        }

        const current = await Notifications.getPermissionsAsync();
        const permission =
          current.status === "granted"
            ? current
            : await Notifications.requestPermissionsAsync();
        if (permission.status !== "granted" || cancelled) return;

        const expoToken = (
          await Notifications.getExpoPushTokenAsync({ projectId })
        ).data;
        if (cancelled) return;

        await apiFetch(ENDPOINTS.clientPushExpo, {
          method: "POST",
          body: JSON.stringify({ expoToken }),
        });
        await storeExpoPushToken(expoToken);
        if (!cancelled) registeredOwnerRef.current = clientId;
      })
      .catch((error: unknown) => {
        if (__DEV__ && !cancelled) {
          console.warn(
            "[push] Enregistrement Expo différé",
            error instanceof Error ? error.message : "Erreur inconnue",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, clientId, isAuthLoading]);
}
