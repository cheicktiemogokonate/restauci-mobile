import type { AdresseLocale } from "@/types";

export const MAX_ADRESSES_LOCALES = 10;

export function normaliserAdresses(
  adresses: AdresseLocale[],
  adresseParDefautId?: string,
): AdresseLocale[] {
  if (adresses.length === 0) return [];

  const idParDefaut =
    (adresseParDefautId &&
    adresses.some((adresse) => adresse.id === adresseParDefautId)
      ? adresseParDefautId
      : undefined) ??
    adresses.find((adresse) => adresse.estParDefaut)?.id ??
    adresses[0].id;

  return adresses.map((adresse) => ({
    ...adresse,
    estParDefaut: adresse.id === idParDefaut,
  }));
}

export function formaterAdresse(adresse: AdresseLocale): string {
  return [
    adresse.adresse,
    adresse.ville,
    adresse.codePostal,
    adresse.pays,
  ]
    .map((partie) => partie?.trim())
    .filter((partie): partie is string => Boolean(partie))
    .join(", ");
}
