import * as SecureStore from "expo-secure-store";

const EXPO_PUSH_TOKEN_KEY = "expo_push_token_v1";

export function readStoredExpoPushToken() {
  return SecureStore.getItemAsync(EXPO_PUSH_TOKEN_KEY);
}

export function storeExpoPushToken(token: string) {
  return SecureStore.setItemAsync(EXPO_PUSH_TOKEN_KEY, token);
}

export function clearStoredExpoPushToken() {
  return SecureStore.deleteItemAsync(EXPO_PUSH_TOKEN_KEY);
}
