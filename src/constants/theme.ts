/**
 * Source unique de la palette applicative pour les StyleSheet et icônes.
 * Miroir des tokens Tailwind de `tailwind.config.js` : toute nouvelle couleur
 * doit être ajoutée ici ET dans la configuration Tailwind, jamais en ligne.
 */
export const theme = {
  green900: "#14532d",
  green800: "#166534",
  green700: "#386B2A",
  green500: "#457B3B",
  brandDark: "#183C2A",
  ink900: "#111827",
  ink600: "#4B5563",
  ink500: "#6B7280",
  ink400: "#9CA3AF",
  ink100: "#F3F4F6",
  ink700: "#374151",
  inkMuted: "#777772",
  slate500: "#64748B",
  green50: "#F0FDF4",
  warning600: "#CA8A04",
  danger700: "#DC2626",
  danger600: "#E51818",
  info: "#3b82f6",
  warning: "#f59e0b",
} as const;

export type ThemeColor = keyof typeof theme;
