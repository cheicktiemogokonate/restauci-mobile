/**
 * Type d'établissement.
 *
 * L'API n'expose aujourd'hui qu'un seul type (`restaurant`). Le type est
 * néanmoins nommé et centralisé ici pour que l'ajout des verticales
 * résidences / événements ne demande qu'une extension de l'union et une
 * entrée dans `LIBELLES_TYPE_ETABLISSEMENT` — pas une réécriture des écrans.
 *
 * 🔗 étendre quand l'API expose un champ `type` sur les établissements.
 */
export type TypeEtablissement = "restaurant" | "residence";

export const TYPE_ETABLISSEMENT_DEFAUT: TypeEtablissement = "restaurant";

export const LIBELLES_TYPE_ETABLISSEMENT: Record<
  TypeEtablissement,
  { singulier: string; pluriel: string }
> = {
  restaurant: { singulier: "restaurant", pluriel: "restaurants" },
  residence: { singulier: "résidence", pluriel: "résidences" },
};

/**
 * Coordonnées géographiques de découverte d'établissements.
 * Type transversal utilisé pour toutes les verticales (restaurants, résidences, événements).
 */
export interface DiscoveryLocation {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  capturedAt: string;
}

/** Alias génériques et rétro-compatibilité */
export type EtablissementDiscoveryLocation = DiscoveryLocation;
export type RestaurantDiscoveryLocation = DiscoveryLocation;

export interface Etablissement {
  id: string;
  type: TypeEtablissement;
  nom: string;
  slug: string;
  description: string | null;
  adresse: string;
  ville: string | null;
  latitude: number;
  longitude: number;
  distanceKm?: number | null;
  imageUrl?: string | null;
  banniereUrl?: string | null;
  noteMoyenne?: number | null;
  nombreAvis?: number;
  enLigne: boolean;
  prixAffiche?: string | null;
  prixFcfa?: number | null;
  tags?: string[];
  placement?: "promoted" | "organic";
  partnerBadgeEnabled?: boolean;
  discoveryToken?: string;
  recommendationReason?: string | null;
}
