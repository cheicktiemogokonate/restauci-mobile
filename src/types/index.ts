// ============================================
// Types partagés — exactement comme le backend
// Régénérés d'après les réponses API réelles
// ============================================

export type ModeCommande = "sur_place" | "livraison" | "emporter";

export type StatutCommande =
  | "en_attente_paiement"
  | "recue"
  | "en_preparation"
  | "prete"
  | "servie"
  | "annulee";

export type StatutLivraison =
  | "en_attente"
  | "assignee"
  | "en_route"
  | "livree"
  | "echouee";

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
  ville: string | null;
  latitude: number;
  longitude: number;
  cuisines: string[] | null;
  modesCommande: ModeCommande[];
  fraisLivraison: number;
  commandeMinimum: number;
  tempsPreparationMoyen: number | null; // en minutes
  noteMoyenne: number | null;
  nombreAvis: number;
  enLigne: boolean;
  accepteCommandes: boolean;
  distanceKm?: number;
  // Champs optionnels (endpoint détail vs liste)
  actif?: boolean;
  pays?: string | null;
  telephone?: string | null;
  email?: string | null;
  siteWeb?: string | null;
  nombreCommandes?: number;
  tempsAttente?: RestaurantTempsAttente;
  commandesEnCours?: number;
  geo?: null | {
    distanceKm: number;
    itineraire: null | {
      distanceKm: number;
      dureeMinutes: number;
      geometrie?: number[][];
    };
  };
}

// --- Plat (dans Categorie.plats du menu GET /api/v1/client/restaurants/{slug}/menu) ---
export interface Nutrition {
  lipides: number;
  calories: number;
  glucides: number;
  proteines: number;
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
  tags: string[] | null;
  allergenes: string[] | null;
  nutrition: Nutrition | null;
  nombreCommandes: number;
  noteMoyenne: number | null;
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

// --- Menu (réponse de GET /api/v1/client/restaurants/{slug}/menu) ---
// IMPORTANT : La réponse réelle est {success: true, data: Categorie[]}
// Le restaurant n'est PAS inclus dans le menu — il doit venir des params de navigation
export type Menu = Categorie[];

// --- Géolocalisation (GET /api/v1/client/geo/geocode?q=...) ---
export interface GeocodeResult {
  adresse: string;
  lat: number;
  lng: number;
  ville?: string;
  pays?: string;
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

export interface FavoriteRestaurant {
  id: string;
  nom: string;
  slug: string;
  logoUrl?: string | null;
  banniereUrl?: string | null;
}

export interface AdresseLocale {
  id: string;
  libelle: string;
  adresse: string;
  ville?: string | null;
  codePostal?: string | null;
  pays?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  estParDefaut?: boolean;
}

export interface AuthResponse {
  success: true;
  data: {
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
  };
}

// Snapshot minimal conservé localement pour restaurer la session hors ligne.
export interface ClientSession {
  id: string;
  nom: string;
  telephone: string;
  email?: string | null;
  actif?: boolean;
}

// --- Commandes ---

// Item d'une commande (POST et GET)
export interface CommandeItem {
  platId: string;
  nom: string;
  prix: number;
  quantite: number;
  note?: string;
}

/** Article enrichi localement pour l'affichage du panier. */
export interface PanierItem extends CommandeItem {
  photoUrl: string | null;
}

// Payload pour créer une commande (POST /api/v1/client/commandes)
export interface CommandePayload {
  restaurantSlug: string;
  modeCommande: ModeCommande;
  items: {
    platId: string;
    quantite: number;
  }[];
  idempotencyKey: string;
  paymentMethod: "cash" | "mobile_money" | "card";
  paymentReturnChannel: "mobile";
  adresseLivraison?: string;
  latitudeLivraison?: number;
  longitudeLivraison?: number;
  numeroTable?: string;
  noteClient?: string;
}

// Réponse POST /api/v1/client/commandes
export interface CommandeCreatedResponse {
  id: string;
  numero: string; // ex: "CMD-20260703-QGTC"
  statut: StatutCommande;
  total: number;
  fraisLivraison: number;
  sousTotal: number;
  items: CommandeItem[];
  modeCommande: ModeCommande;
  createdAt: string;
}

export interface CommandePaymentResponse {
  authorizationUrl: string | null;
  reference: string | null;
}

// Résumé d'une commande dans la liste (GET /api/v1/client/commandes)
export interface CommandeSummary {
  id: string;
  numero: string;
  statut: StatutCommande;
  total: number;
  items: CommandeItem[];
  modeCommande: ModeCommande;
  createdAt: string;
  restaurantId: string;
}

// Timeline event pour CommandeDetail
export interface TimelineEvent {
  etape: "en_attente_paiement" | "recue" | "en_preparation" | "prete" | "en_route" | "servie";
  label: string;
  fait: boolean;
  actif: boolean;
  timestamp: string | null;
}

// Détail complet d'une commande (GET /api/v1/client/commandes/{id})
export interface CommandeDetail {
  id: string;
  numero: string;
  statut: StatutCommande;
  modeCommande: ModeCommande;
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
  restaurant: null | {
    nom: string;
    logoUrl: string | null;
  };
  statutLabel: string;
  livraisonStatut: StatutLivraison | null;
  estAnnulee: boolean;
  timeline: TimelineEvent[];
  payment: null | {
    provider: "paystack";
    method: "mobile_money" | "card";
    status: "pending" | "confirmed" | "failed" | "cancelled";
    checkoutUrl: string | null;
  };
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
export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "RATE_LIMIT_EXCEEDED"
  | "INTERNAL_ERROR"
  | "CONFLICT"
  | "BAD_REQUEST"
  | "SERVICE_UNAVAILABLE";

export interface ApiError {
  success: false;
  error: string;
  code?: ApiErrorCode;
  details?: Record<string, string[]>;
  retryAfter?: number;
}

// --- Autres ---
export interface ErrorViewProps {
  message?: string;
  onRetry?: () => void;
  title?: string;
  showRetry?: boolean;
}
