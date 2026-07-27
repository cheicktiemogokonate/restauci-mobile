import type { CreneauHoraire, Categorie, Plat } from '@/types';

// ============================================
// Logique créneaux horaires — identique backend
// ============================================

const DAYS_SHORT = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];

function getJourCourt(): string {
  return DAYS_SHORT[new Date().getDay()] || '';
}

function parseTimeToMinutes(time: string) {
  const [hours = '0', minutes = '0'] = time.split(':');
  return Number(hours) * 60 + Number(minutes);
}

function isHeureActive(
  heureOuverture: string,
  heureFermeture: string,
  currentMinutes: number
) {
  const ouverture = parseTimeToMinutes(heureOuverture);
  const fermeture = parseTimeToMinutes(heureFermeture);

  if (fermeture === ouverture) return true;

  if (fermeture > ouverture) {
    return currentMinutes >= ouverture && currentMinutes < fermeture;
  }

  return currentMinutes >= ouverture || currentMinutes < fermeture;
}

function isCreneauActif(creneau: CreneauHoraire) {
  if (creneau.actif === false) return false;

  const jour = getJourCourt();
  if (!creneau.joursActifs.includes(jour)) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return isHeureActive(creneau.heureOuverture, creneau.heureFermeture, currentMinutes);
}

/**
 * 🔗 réintégrer quand l'API expose les créneaux horaires.
 *
 * Aucun endpoint de `docs/openapi.json` ne renvoie de `CreneauHoraire` : cette
 * fonction était appelée avec un tableau vide et retournait donc toujours
 * `true`. Elle est conservée telle quelle (la logique est alignée sur le
 * backend) mais n'est plus appelée depuis `MenuBottomSheet`. Dès que l'API
 * servira les créneaux d'un établissement, rebrancher l'appel ici.
 *
 * Détermine si un plat est disponible selon son créneau horaire.
 *
 * Règles :
 * - Si plat.disponible === false → indisponible
 * - Si plat.creneauId → vérifier ce créneau
 * - Sinon si categorie.creneauId → vérifier le créneau de la catégorie
 * - Sinon → toujours disponible
 */
export function isPlatDisponible(
  plat: Plat,
  categorie: Categorie | undefined,
  creneaux: CreneauHoraire[]
): boolean {
  if (!plat.disponible) return false;

  const creneauId = plat.creneauId ?? categorie?.creneauId;
  if (!creneauId) return true;

  const creneau = creneaux.find((item) => item.id === creneauId);
  if (!creneau) return true;

  return isCreneauActif(creneau);
}