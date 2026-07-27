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
export type TypeEtablissement = "restaurant";

export const TYPE_ETABLISSEMENT_DEFAUT: TypeEtablissement = "restaurant";

export const LIBELLES_TYPE_ETABLISSEMENT: Record<
  TypeEtablissement,
  { singulier: string; pluriel: string }
> = {
  restaurant: { singulier: "établissement", pluriel: "établissements" },
};
