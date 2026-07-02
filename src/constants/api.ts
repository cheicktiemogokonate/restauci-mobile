export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export const ENDPOINTS = {
  restaurantsProches: '/api/v1/client/restaurants',
  restaurantMenu: (slug: string) => `/api/v1/client/restaurants/${slug}/menu`,
  clientCommandes: '/api/v1/client/commandes',
  geoSearch: '/api/v1/client/geo/search',
  geoItineraire: '/api/v1/client/geo/itineraire',
  authClientLogin: '/api/v1/client/auth/login',
  authClientRegister: '/api/v1/client/auth/register',
  authClientMe: '/api/v1/client/auth/me',
  clientDeviceToken: '/api/v1/client/auth/device-token',
} as const;