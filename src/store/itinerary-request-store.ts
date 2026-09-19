import { create } from "zustand";

export interface ItineraryDestination {
  id: string;
  latitude: number;
  longitude: number;
  nom: string;
  slug: string;
  type?: string;
}

export interface ItineraryRequest {
  geometry?: number[][];
  id: string;
  origin: {
    latitude: number;
    longitude: number;
  };
  etablissement: ItineraryDestination;
  /** @deprecated Utiliser etablissement pour supporter toutes les verticales */
  restaurant?: ItineraryDestination;
}

export type NewItineraryRequest =
  | (Omit<ItineraryRequest, "id" | "restaurant"> & {
      restaurant?: ItineraryDestination;
    })
  | (Omit<ItineraryRequest, "id" | "etablissement"> & {
      restaurant: ItineraryDestination;
    });

interface ItineraryRequestState {
  pendingRequest: ItineraryRequest | null;
  clearRequest: () => void;
  requestItinerary: (request: NewItineraryRequest) => void;
}

export const useItineraryRequestStore = create<ItineraryRequestState>()(
  (set) => ({
    pendingRequest: null,
    requestItinerary: (request) => {
      const etablissement =
        "etablissement" in request && request.etablissement
          ? request.etablissement
          : request.restaurant!;

      set({
        pendingRequest: {
          ...request,
          etablissement,
          restaurant: request.restaurant ?? etablissement,
          id: `${Date.now()}-${etablissement.id}`,
        },
      });
    },
    clearRequest: () => set({ pendingRequest: null }),
  }),
);
