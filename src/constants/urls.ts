const DEFAULT_WEB_APP_URL = "https://restauci.vercel.app";

export const WEB_APP_URL = (
  process.env.EXPO_PUBLIC_WEB_APP_URL ?? DEFAULT_WEB_APP_URL
).replace(/\/+$/, "");

export function getRestaurantWebUrl(slug: string): string {
  return `${WEB_APP_URL}/restaurant/${encodeURIComponent(slug)}`;
}
