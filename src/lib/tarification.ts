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

export interface DetailPanier {
  sousTotal: number;
  fraisLivraison: number;
  total: number;
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
  const fraisLivraison =
    livraisonApplicable ? fraisLivraisonBase : 0;

  return {
    sousTotal,
    fraisLivraison,
    total: sousTotal + fraisLivraison,
  };
}
