import * as SecureStore from "expo-secure-store";

export const AUTH_ACCESS_TOKEN_KEY = "auth_access_token";
export const AUTH_REFRESH_TOKEN_KEY = "auth_refresh_token";
export const AUTH_CLIENT_KEY = "auth_client_v1";

export async function storeNativeTokens(input: {
  accessToken: string;
  refreshToken: string;
}) {
  // Le refresh est écrit avant l'access token : une interruption ne doit pas
  // laisser croire qu'une rotation est complète avec l'ancien refresh.
  await SecureStore.setItemAsync(AUTH_REFRESH_TOKEN_KEY, input.refreshToken);
  await SecureStore.setItemAsync(AUTH_ACCESS_TOKEN_KEY, input.accessToken);
}

export async function readNativeTokens() {
  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(AUTH_ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(AUTH_REFRESH_TOKEN_KEY),
  ]);
  return { accessToken, refreshToken };
}

export async function clearNativeSessionStorage() {
  await Promise.allSettled([
    SecureStore.deleteItemAsync(AUTH_ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(AUTH_REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(AUTH_CLIENT_KEY),
  ]);
}
