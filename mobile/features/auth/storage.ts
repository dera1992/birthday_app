import * as SecureStore from "expo-secure-store";

export async function saveTokens(access: string, refresh: string) {
  await SecureStore.setItemAsync("access_token", access);
  await SecureStore.setItemAsync("refresh_token", refresh);
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync("access_token");
  await SecureStore.deleteItemAsync("refresh_token");
}

export async function getAccessToken() {
  return SecureStore.getItemAsync("access_token");
}
