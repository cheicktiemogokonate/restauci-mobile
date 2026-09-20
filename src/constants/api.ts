const API_V1_PATH = "/api/v1";
const DEFAULT_DEV_API_ORIGIN = "http://localhost:3000";

function normalizeApiUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  return trimmed.endsWith(API_V1_PATH)
    ? trimmed
    : `${trimmed}${API_V1_PATH}`;
}

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

if (!configuredApiUrl && !__DEV__) {
  throw new Error(
    "EXPO_PUBLIC_API_URL doit être définie pour un build hors développement.",
  );
}

/** URL de base du contrat mobile, toujours terminée par `/api/v1`. */
export const API_URL = normalizeApiUrl(
  configuredApiUrl || DEFAULT_DEV_API_ORIGIN,
);

export const ENDPOINTS = {
  publicRestaurantsSearch: "/public/restaurants/search",
  restaurantMenu: (slug: string) =>
    `/client/restaurants/${encodeURIComponent(slug)}/menu`,
  restaurantDetail: (slug: string) =>
    `/client/restaurants/${encodeURIComponent(slug)}`,
  geoGeocode: "/client/geo/geocode",
  clientCommandes: "/client/commandes",
  clientCommandesPrevalidate: "/client/commandes/prevalidate",
  clientCommande: (id: string) =>
    `/client/commandes/${encodeURIComponent(id)}`,
  clientCommandeStream: (id: string) =>
    `/client/commandes/${encodeURIComponent(id)}/stream`,
  clientCommandePayment: (id: string) =>
    `/client/commandes/${encodeURIComponent(id)}/paiement`,
  clientCommandeLivraison: (id: string) =>
    `/client/commandes/${encodeURIComponent(id)}/livraison`,
  clientCommandeLivraisonConfirmation: (id: string) =>
    `/client/commandes/${encodeURIComponent(id)}/livraison/confirmation`,
  authClientLogin: "/client/auth/login",
  authClientRegister: "/client/auth/register",
  authClientMe: "/client/auth/me",
  authClientRefresh: "/client/auth/refresh",
  authClientLogout: "/client/auth/logout",
  clientNotifications: "/client/notifications",
  clientPushExpo: "/client/push/expo",
  publicResidencesSearch: "/public/residences/search",
  publicResidence: (slug: string) =>
    `/public/residences/${encodeURIComponent(slug)}`,
  publicResidenceAvailability: (id: string) =>
    `/public/residences/${encodeURIComponent(id)}/availability`,
  publicResidenceQuote: (id: string) =>
    `/public/residences/${encodeURIComponent(id)}/quote`,
  publicDiscoveryEvents: "/public/discovery/events",
  clientReservations: "/client/reservations",
  clientReservation: (id: string) =>
    `/client/reservations/${encodeURIComponent(id)}`,
  clientReservationCancel: (id: string) =>
    `/client/reservations/${encodeURIComponent(id)}/cancel`,
  clientReservationPayment: (id: string) =>
    `/client/reservations/${encodeURIComponent(id)}/payment`,
  publicEtablissementsSearch: "/public/etablissements/search",
  publicDiscoveryMood: "/public/discovery/mood",
} as const;
