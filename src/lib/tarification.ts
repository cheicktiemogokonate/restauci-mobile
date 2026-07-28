/**
 * Règles de tarification du panier.
 *
 * ⚠️ Le montant final facturé est celui calculé par le serveur à la création
 * de la commande. Ce module ne sert qu'à afficher au client une estimation
 * cohérente avec ce qu'il paiera : chaque ligne affichée doit correspondre à
 * une ligne du total, sans frais caché.
 *
 * `fraisLivraisonBase` provient de l'établissement (`Restaurant.fraisLivraison`,
 * servi par l'API) et jamais d'un paramètre d'URL.
 */

/** Seuil de sous-total à partir duquel la livraison est offerte. */
export const SEUIL_LIVRAISON_OFFERTE = 2000;

/** Frais d'emballage, appliqués quel que soit le mode de commande. */
export const FRAIS_EMBALLAGE = 200;

export interface DetailPanier {
  sousTotal: number;
  fraisLivraison: number;
  fraisEmballage: number;
  livraisonOfferte: boolean;
  total: number;
  /** Montant restant à ajouter pour bénéficier de la livraison offerte. */
  resteAvantLivraisonOfferte: number;
}

export function calculerDetailPanier({
  sousTotal,
  fraisLivraisonBase,
  modeLivraison = true,
}: {
  sousTotal: number;
  fraisLivraisonBase: number;
  modeLivraison?: boolean;
}): DetailPanier {
  const livraisonApplicable = modeLivraison && sousTotal > 0;
  const livraisonOfferte =
    livraisonApplicable && sousTotal >= SEUIL_LIVRAISON_OFFERTE;

  const fraisLivraison =
    !livraisonApplicable || livraisonOfferte ? 0 : fraisLivraisonBase;

  const fraisEmballage = sousTotal > 0 ? FRAIS_EMBALLAGE : 0;

  return {
    sousTotal,
    fraisLivraison,
    fraisEmballage,
    livraisonOfferte,
    total: sousTotal + fraisLivraison + fraisEmballage,
    resteAvantLivraisonOfferte: Math.max(
      0,
      SEUIL_LIVRAISON_OFFERTE - sousTotal,
    ),
  };
}
