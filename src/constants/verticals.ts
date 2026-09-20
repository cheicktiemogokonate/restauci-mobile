import type { TypeEtablissement } from "@/types/etablissement";
import { theme } from "@/constants/theme";

export type VerticalId = TypeEtablissement;

export interface VerticalDefinition {
  id: VerticalId;
  labelPlural: string;
  labelSingular: string;
  actionLabel: string;
  markerIcon: string;
  markerAsset: number;
  accentColor: string;
  emptyMessage: string;
  formatSummary: (item: {
    adresse?: string | null;
    tags?: string[] | null;
    cuisines?: string[] | null;
  }) => string;
  formatPrice: (item: {
    prixAffiche?: string | null;
    prixFcfa?: number | null;
    fraisLivraison?: number;
  }) => string | null;
  getRoute: (
    slug: string,
    location?: { latitude: number; longitude: number } | null,
  ) => {
    pathname: string;
    params: Record<string, string>;
  };
}

export const VERTICALS: Record<VerticalId, VerticalDefinition> = {
  restaurant: {
    id: "restaurant",
    labelPlural: "Restaurants",
    labelSingular: "Restaurant",
    actionLabel: "Voir le menu",
    markerIcon: "restaurant-marker",
    markerAsset: require("../../assets/images/restaurant-marker.png"),
    accentColor: "theme.green900",
    emptyMessage: "Aucun restaurant n'est référencé autour de cette position.",
    formatSummary: (item) => {
      const cuisines = item.cuisines?.filter(Boolean) ?? item.tags?.filter(Boolean) ?? [];
      const cuisineStr = cuisines.slice(0, 2).join(" · ");
      return [cuisineStr, item.adresse].filter(Boolean).join(" • ");
    },
    formatPrice: (item) => {
      if (typeof item.fraisLivraison === "number") {
        return item.fraisLivraison === 0
          ? "Livraison gratuite"
          : `Livraison ${item.fraisLivraison.toLocaleString("fr-FR")} FCFA`;
      }
      return item.prixAffiche ?? "Commande en ligne";
    },
    getRoute: (slug, loc) => ({
      pathname: "/restaurant/[slug]",
      params: {
        slug,
        ...(loc ? { lat: String(loc.latitude), lng: String(loc.longitude) } : {}),
      },
    }),
  },
  residence: {
    id: "residence",
    labelPlural: "Résidences",
    labelSingular: "Résidence",
    actionLabel: "Réserver",
    markerIcon: "residence-marker",
    markerAsset: require("../../assets/images/residence-marker.png"),
    accentColor: "#C2410C",
    emptyMessage: "Aucune résidence n'est référencée autour de cette position.",
    formatSummary: (item) => {
      const tags = item.tags?.filter(Boolean) ?? [];
      const tagStr = tags.slice(0, 2).join(" · ");
      return [tagStr, item.adresse].filter(Boolean).join(" • ");
    },
    formatPrice: (item) => {
      if (item.prixAffiche) return item.prixAffiche;
      if (typeof item.prixFcfa === "number") {
        return `${item.prixFcfa.toLocaleString("fr-FR")} FCFA / nuit`;
      }
      return null;
    },
    getRoute: (slug) => ({
      pathname: "/residences/[slug]",
      params: { slug },
    }),
  },
};

export const ALL_VERTICAL_IDS: readonly VerticalId[] = [
  "restaurant",
  "residence",
] as const;

export type VerticalFilter = "tous" | VerticalId;

export const VERTICAL_FILTER_OPTIONS: readonly {
  id: VerticalFilter;
  label: string;
}[] = [
  { id: "tous", label: "Tous" },
  ...ALL_VERTICAL_IDS.map((id) => ({
    id,
    label: VERTICALS[id].labelPlural,
  })),
];

export function getVerticalDefinition(
  type?: string | null,
): VerticalDefinition {
  if (type && type in VERTICALS) {
    return VERTICALS[type as VerticalId];
  }
  return VERTICALS.restaurant;
}
