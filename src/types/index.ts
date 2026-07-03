// ============================================
// Types partagés — exactement comme le backend
// Régénérés d'après les réponses API réelles
// ============================================

// --- Temps d'attente et détails du restaurant ---
export interface RestaurantTempsAttenteDetail {
  preparation: number;
  chargeActuelle: number;
  trajet: number;
}

export interface RestaurantTempsAttente {
  totalMinutes: number;
  label: string;
  detail: RestaurantTempsAttenteDetail;
}

// --- Restaurant (GET /api/v1/client/restaurants?lat=...&lng=...&rayon=...) ---
export interface Restaurant {
  id: string;
  nom: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  banniereUrl: string | null;
  adresse: string;
  ville: string;
  latitude: number;
  longitude: number;
  cuisines: string[];
  modesCommande: string[]; // ["sur_place", "livraison", "emporter"] ou ["takeout", "delivery"]
  fraisLivraison: number;
  commandeMinimum: number;
  tempsPreparationMoyen: number; // en minutes
  noteMoyenne: number;
  nombreAvis: number;
  enLigne: boolean;
  accepteCommandes: boolean;
  distanceKm: number;
  // Champs optionnels (endpoint détail vs liste)
  actif?: boolean;
  pays?: string | null;
  telephone?: string | null;
  email?: string | null;
  siteWeb?: string | null;
  nombreCommandes?: number;
  tempsAttente?: RestaurantTempsAttente;
  commandesEnCours?: number;
  geo?: { latitude: number; longitude: number };
}

// --- Plat (dans Categorie.plats du menu GET /api/v1/client/restaurants/{slug}/menu) ---
export interface Nutrition {
  lipides?: number | null;
  calories?: number | null;
  glucides?: number | null;
  proteines?: number | null;
}

export interface Plat {
  id: string;
  restaurantId: string;
  categorieId: string;
  creneauId: string | null;
  nom: string;
  description: string | null;
  prix: number;
  photoUrl: string | null;
  disponible: boolean;
  ordre: number;
  tags: string[];
  allergenes: string[];
  nutrition: Nutrition | null;
  nombreCommandes: number;
  noteMoyenne: number;
  nombreAvis: number;
  createdAt: string;
  updatedAt: string;
}

// --- Catégorie (GET /api/v1/client/restaurants/{slug}/menu retourne Categorie[]) ---
export interface Categorie {
  id: string;
  restaurantId: string;
  creneauId: string | null;
  nom: string;
  description: string | null;
  imageUrl: string | null;
  ordre: number;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
  plats: Plat[];
}

// --- Créneaux (n'apparaît pas dans les réponses réelles, à valider) ---
export interface CreneauHoraire {
  id: string;
  restaurantId: string;
  nom: string;
  heureOuverture: string;
  heureFermeture: string;
  joursActifs: string[];
  actif: boolean;
}

// --- Menu (réponse de GET /api/v1/client/restaurants/{slug}/menu) ---
// IMPORTANT : La réponse réelle est {success: true, data: Categorie[]}
// Le restaurant n'est PAS inclus dans le menu — il doit venir des params de navigation
export type Menu = Categorie[];

// --- Géolocalisation (GET /api/v1/client/geo/geocode?q=...) ---
export interface GeocodeResult {
  adresse: string;
  lat: number;
  lng: number;
  ville: string;
  pays: string;
}

export interface Suggestion {
  label: string;
  lat: number;
  lon: number;
}

// --- Authentification Client ---
// GET /api/v1/client/auth/me retourne :
export interface Client {
  id: string;
  nom: string;
  telephone: string;
  email: string | null;
  adresseDefaut: string | null;
  latitudeDefaut: number | null;
  longitudeDefaut: number | null;
  nombreCommandes: number;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // en secondes
}

export interface AuthResponse {
  client: Omit<
    Client,
    | "adresseDefaut"
    | "latitudeDefaut"
    | "longitudeDefaut"
    | "nombreCommandes"
    | "createdAt"
  > & {
    actif?: boolean;
  };
  tokens: AuthTokens;
}

// Ancien alias, à supprimer
export interface ClientSession {
  id: string;
  nom: string;
  telephone: string;
  email?: string;
}

// --- Commandes ---

// Item d'une commande (POST et GET)
export interface CommandeItem {
  platId: string;
  nom: string;
  prix: number;
  quantite: number;
}

// Payload pour créer une commande (POST /api/v1/client/commandes)
export interface CommandePayload {
  restaurantSlug: string; // Pas restaurantId !
  modeCommande: string; // "emporter", "livraison", "sur_place" ou "takeout", "delivery"
  items: Array<{
    platId: string;
    quantite: number;
  }>;
  adresseLivraison?: string;
  numeroTable?: string;
  notes?: string;
}

// Réponse POST /api/v1/client/commandes
export interface CommandeCreatedResponse {
  id: string;
  numero: string; // ex: "CMD-20260703-QGTC"
  statut: string;
  total: number;
  fraisLivraison: number;
  sousTotal: number;
  items: CommandeItem[];
  modeCommande: string;
  createdAt: string;
}

// Résumé d'une commande dans la liste (GET /api/v1/client/commandes)
export interface CommandeSummary {
  id: string;
  numero: string;
  statut: string;
  total: number;
  fraisLivraison: number;
  sousTotal: number;
  items: CommandeItem[];
  modeCommande: string;
  createdAt: string;
}

// Timeline event pour CommandeDetail
export interface TimelineEvent {
  etape: string; // "recue", "en_preparation", "prete", "servie"
  label: string;
  fait: boolean;
  actif: boolean;
  timestamp: string | null;
}

// Détail complet d'une commande (GET /api/v1/client/commandes/{id})
export interface CommandeDetail {
  id: string;
  numero: string;
  statut: string;
  modeCommande: string;
  items: CommandeItem[];
  sousTotal: number;
  fraisLivraison: number;
  total: number;
  noteClient: string | null;
  adresseLivraison: string | null;
  numeroTable: string | null;
  createdAt: string;
  heureAcceptee: string | null;
  heurePrete: string | null;
  heureServie: string | null;
  restaurantId: string;
  clientId: string;
  restaurant: {
    nom: string;
    logoUrl: string | null;
  };
  statutLabel: string;
  estAnnulee: boolean;
  timeline: TimelineEvent[];
}

// --- Pagination ---
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// --- Enveloppes API génériques ---
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

// --- Autres ---
export interface RegionVisible {
  latitude: number;
  longitude: number;
  zoom: number;
}
