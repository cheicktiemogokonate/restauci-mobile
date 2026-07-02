import type { StateCreator } from "zustand";
import type { RegionVisible } from "@/types";

export interface CarteSlice {
  regionVisible: RegionVisible;
  setRegion: (region: RegionVisible) => void;
}

const DEFAULT_REGION: RegionVisible = {
  latitude: 5.3599515,
  longitude: -4.0082563,
  zoom: 12,
};

export const createCarteSlice: StateCreator<CarteSlice> = (set) => ({
  regionVisible: DEFAULT_REGION,

  setRegion(region) {
    set({ regionVisible: region });
  },
});
