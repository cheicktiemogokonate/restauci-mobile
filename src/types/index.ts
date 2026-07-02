// ============================================
// Types partagés — même structure que le backend
// ============================================

export interface Restaurant {
  id: string;
  nom: string;
  slug: string;
  latitude: number;
  longitude: number;
  description?: string;
  logoUrl?: string;
  fraisLivraison: number;
  modesCommande: string[];
}

export interface Plat {
  id: string;
  nom: string;
  description?: string;
  prix: number;
  photoUrl?: string;
  categorieId: string;
  creneauId?: string | null;
  disponible: boolean;
}

export interface CommandeItem {
  platId: string;
  nom: string;
  prix: number;
  quantite: number;
}

export interface ClientSession {
  id: string;
  nom: string;
  telephone: string;
  email?: string;
}

export interface RegionVisible {
  latitude: number;
  longitude: number;
  zoom: number;
}

// --- Types créneaux ---

export interface CreneauHoraire {
  id: string;
  restaurantId: string;
  nom: string;
  heureOuverture: string;
  heureFermeture: string;
  joursActifs: string[];
  actif: boolean;
}

// --- Types catégories (pour le menu) ---

export interface Categorie {
  id: string;
  restaurantId: string;
  creneauId: string | null;
  nom: string;
  description?: string;
  imageUrl?: string;
  ordre: number;
  visible: boolean;
}

export interface CategorieAvecPlats extends Categorie {
  plats: Plat[];
  creneau?: CreneauHoraire | null;
}

// --- Types API ---

export interface Suggestion {
  label: string;
  lat: number;
  lon: number;
}

export interface CommandePayload {
  restaurantId: string;
  items: CommandeItem[];
  adresseLivraison: string;
  telephone: string;
  notes?: string;
}

export interface ApiError {
  error: string;
}
