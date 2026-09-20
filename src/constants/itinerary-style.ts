import { theme } from "@/constants/theme";
export type ItineraryStrokeStyle = "solid" | "dashed";

interface ItineraryVisualConfig {
  animationDurationMs: number;
  cameraDurationMs: number;
  cameraPadding: number;
  casingColor: string;
  casingWidth: number;
  color: string;
  dashArray: [number, number];
  opacity: number;
  strokeStyle: ItineraryStrokeStyle;
  width: number;
}

/**
 * Configuration développeur du tracé affiché sur la carte.
 * Passez `strokeStyle` de "solid" à "dashed" pour obtenir des pointillés.
 * `dashArray` représente respectivement la longueur du trait et de l'espace,
 * exprimées en multiples de l'épaisseur de ligne MapLibre.
 */
export const ITINERARY_VISUAL_CONFIG: ItineraryVisualConfig = {
  strokeStyle: "solid",
  color: "theme.green900",
  width: 4,
  opacity: 0.92,
  casingColor: "rgba(255, 255, 255, 0.92)",
  casingWidth: 7,
  dashArray: [1.6, 1.4],
  animationDurationMs: 720,
  cameraDurationMs: 820,
  cameraPadding: 64,
};
