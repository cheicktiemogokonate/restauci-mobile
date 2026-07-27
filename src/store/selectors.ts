import type { UnifiedStore } from "./index";

/**
 * Sélecteurs dérivés partagés.
 *
 * Ils renvoient des primitives : la comparaison par référence de zustand
 * suffit à éviter tout re-render inutile, contrairement aux `reduce` inline
 * dupliqués dans chaque composant.
 */
export const selectNombreArticles = (s: UnifiedStore) => s.nombreArticles();

export const selectSousTotal = (s: UnifiedStore) => s.sousTotal();
