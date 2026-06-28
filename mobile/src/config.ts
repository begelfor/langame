import Constants from "expo-constants";

/**
 * Resolves the backend API base URL.
 *
 * Priority:
 *  1. EXPO_PUBLIC_API_BASE_URL env var (handy for physical devices on a LAN,
 *     e.g. http://192.168.1.20:8000/api/v1)
 *  2. app.json -> expo.extra.apiBaseUrl (default for web / simulators)
 */
const extra = (Constants.expoConfig?.extra ?? {}) as { apiBaseUrl?: string };

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  extra.apiBaseUrl ??
  "http://127.0.0.1:8000/api/v1";
