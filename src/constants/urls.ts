const DEFAULT_WEB_APP_URL = "https://restauci.vercel.app";

export const WEB_APP_URL = (
  process.env.EXPO_PUBLIC_WEB_APP_URL ?? DEFAULT_WEB_APP_URL
).replace(/\/+$/, "");

export const LEGAL_PAGES = {
  cgu: {
    label: "Conditions générales",
    path: "/conditions-generales",
  },
  mentions: {
    label: "Mentions légales",
    path: "/mentions-legales",
  },
  confidentialite: {
    label: "Politique de confidentialité",
    path: "/confidentialite",
  },
  cookies: {
    label: "Politique cookies",
    path: "/cookies",
  },
} as const;

export type LegalPageId = keyof typeof LEGAL_PAGES;

export function getLegalPageUrl(id: LegalPageId): string {
  return `${WEB_APP_URL}${LEGAL_PAGES[id].path}`;
}

export function getRestaurantWebUrl(slug: string): string {
  return `${WEB_APP_URL}/restaurant/${encodeURIComponent(slug)}`;
}
