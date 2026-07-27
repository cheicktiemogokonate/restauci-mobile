import { ENDPOINTS } from "@/constants/api";
import { apiFetch } from "@/lib/api";
import { useStore } from "@/store";
import Constants from "expo-constants";
import type { Notification, NotificationResponse } from "expo-notifications";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect } from "react";

const DEVICE_TOKEN_KEY = "push_token";

function getProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId
  );
}

export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  try {
    const Notifications = await import("expo-notifications");
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return null;
    }

    const projectId = getProjectId();
    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );

    if (token) {
      await SecureStore.setItemAsync(DEVICE_TOKEN_KEY, token);
    }

    return token ?? null;
  } catch {
    return null;
  }
}

export async function getStoredPushToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(DEVICE_TOKEN_KEY);
  } catch {
    return null;
  }
}

interface NotificationData {
  commandeId?: string;
}

export function usePushNotifications() {
  const client = useStore((s) => s.client);

  const handleNotification = useCallback(
    (notification: Notification) => {},
    [],
  );

  const handleNotificationResponse = useCallback(
    (response: NotificationResponse) => {
      const data = response.notification.request.content.data as
        | NotificationData
        | undefined;

      if (data?.commandeId) {
        router.push(`/commandes/${data.commandeId}`);
      }
    },
    [],
  );

  useEffect(() => {
    let notificationListener: { remove: () => void } | null = null;
    let responseListener: { remove: () => void } | null = null;

    registerForPushNotificationsAsync().then((token) => {
      if (token && client) {
        syncPushToken(token);
      }
    });

    import("expo-notifications")
      .then((Notifications) => {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });

        notificationListener =
          Notifications.addNotificationReceivedListener(handleNotification);

        responseListener =
          Notifications.addNotificationResponseReceivedListener(
            handleNotificationResponse,
          );
      })
      .catch(() => {
        // expo-notifications indisponible (ex. Expo Go sans build dev)
      });

    return () => {
      notificationListener?.remove();
      responseListener?.remove();
    };
  }, [client, handleNotification, handleNotificationResponse]);

  useEffect(() => {
    if (!client) return;
    getStoredPushToken().then((token) => {
      if (token) syncPushToken(token);
    });
  }, [client]);
}

async function syncPushToken(token: string): Promise<void> {
  try {
    await apiFetch(ENDPOINTS.pushExpoRegister, {
      method: "POST",
      body: JSON.stringify({ expoToken: token }),
    });
  } catch {
    // Ignore token sync errors in non-critical path
  }
}
