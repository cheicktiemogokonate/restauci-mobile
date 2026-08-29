import NetInfo from "@react-native-community/netinfo";
import {
  focusManager,
  onlineManager,
} from "@tanstack/react-query";
import { useEffect } from "react";
import {
  AppState,
  type AppStateStatus,
  Platform,
} from "react-native";

// En React Native, TanStack Query ne reçoit pas automatiquement les événements
// réseau du navigateur. setEventListener remplace et nettoie l'ancien listener,
// y compris lors d'un Fast Refresh.
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => {
    setOnline(Boolean(state.isConnected));
  }),
);

export function useReactQueryLifecycle(): void {
  useEffect(() => {
    if (Platform.OS === "web") return;

    const updateFocus = (status: AppStateStatus) => {
      focusManager.setFocused(status === "active");
    };

    updateFocus(AppState.currentState);
    const subscription = AppState.addEventListener(
      "change",
      updateFocus,
    );

    return () => {
      subscription.remove();
    };
  }, []);
}
