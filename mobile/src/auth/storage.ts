import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

/**
 * Token storage that uses SecureStore on native platforms and falls back to
 * localStorage on web (SecureStore is not available in the browser).
 */
const ACCESS_KEY = "langame.access";
const REFRESH_KEY = "langame.refresh";

const isWeb = Platform.OS === "web";

async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (isWeb) {
    return globalThis.localStorage?.getItem(key) ?? null;
  }
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export interface Tokens {
  access: string;
  refresh: string;
}

export async function saveTokens(tokens: Tokens): Promise<void> {
  await setItem(ACCESS_KEY, tokens.access);
  await setItem(REFRESH_KEY, tokens.refresh);
}

export async function loadTokens(): Promise<Tokens | null> {
  const access = await getItem(ACCESS_KEY);
  const refresh = await getItem(REFRESH_KEY);
  if (!access || !refresh) {
    return null;
  }
  return { access, refresh };
}

export async function clearTokens(): Promise<void> {
  await deleteItem(ACCESS_KEY);
  await deleteItem(REFRESH_KEY);
}
