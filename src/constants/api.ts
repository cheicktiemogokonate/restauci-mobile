export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export const ENDPOINTS = {
  restaurantsProches: "/api/v1/client/restaurants",
  restaurantMenu: (slug: string) => `/api/v1/client/restaurants/${slug}/menu`,
  restaurantDetail: (slug: string) => `/api/v1/client/restaurants/${slug}`,
  clientCommandes: "/api/v1/client/commandes",
  geoSearch: "/api/v1/client/geo/geocode",
  geoItineraire: "/api/v1/client/geo/itineraire",
  authClientLogin: "/api/v1/client/auth/login",
  authClientRegister: "/api/v1/client/auth/register",
  authClientMe: "/api/v1/client/auth/me",
  pushExpoRegister: "/api/v1/push/expo/register",
} as const;
