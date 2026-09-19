import { z } from "zod";

import type { ApiSuccess } from "../types";

const finiteNumber = z.number().finite();
const integer = finiteNumber.int();
const money = integer.nonnegative();
const nullableString = z.string().nullable();

export const modeCommandeSchema = z.enum([
  "sur_place",
  "livraison",
  "emporter",
]);

export const paginationMetaSchema = z
  .object({
    total: integer.nonnegative(),
    page: integer.positive(),
    limit: integer.positive(),
    totalPages: integer.nonnegative(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  })
  .passthrough();

export const clientSessionSchema = z
  .object({
    id: z.string().min(1),
    nom: z.string().min(1),
    telephone: z.string().min(1),
    email: z.string().nullable().optional(),
    actif: z.boolean().optional(),
  })
  .passthrough();

export const authDataSchema = z
  .object({
    client: clientSessionSchema,
    tokens: z
      .object({
        accessToken: z.string().min(1),
        refreshToken: z.string().min(1),
        expiresIn: finiteNumber.positive(),
      })
      .passthrough(),
  })
  .passthrough();

export const refreshDataSchema = z
  .object({
    accessToken: z.string().min(1),
    refreshToken: z.string().min(1),
    expiresIn: finiteNumber.positive(),
  })
  .passthrough();

export const restaurantSchema = z
  .object({
    id: z.string().min(1),
    nom: z.string().min(1),
    slug: z.string().min(1),
    description: nullableString,
    logoUrl: nullableString,
    banniereUrl: nullableString,
    adresse: z.string(),
    ville: nullableString,
    latitude: finiteNumber,
    longitude: finiteNumber,
    cuisines: z.array(z.string()).nullable(),
    modesCommande: z.array(modeCommandeSchema),
    fraisLivraison: money,
    commandeMinimum: money,
    tempsPreparationMoyen: integer.nonnegative().nullable(),
    noteMoyenne: finiteNumber.nonnegative().nullable(),
    nombreAvis: integer.nonnegative(),
    enLigne: z.boolean(),
    accepteCommandes: z.boolean(),
    distanceKm: finiteNumber.nonnegative().optional(),
    placement: z.enum(["promoted", "organic"]).optional(),
    partnerBadgeEnabled: z.boolean().optional(),
    discoveryToken: z.string().optional(),
    actif: z.boolean().optional(),
    pays: nullableString.optional(),
    telephone: nullableString.optional(),
    email: nullableString.optional(),
    siteWeb: nullableString.optional(),
    nombreCommandes: integer.nonnegative().optional(),
    tempsAttente: z
      .object({
        totalMinutes: finiteNumber.nonnegative(),
        label: z.string(),
        detail: z
          .object({
            preparation: finiteNumber.nonnegative(),
            chargeActuelle: finiteNumber.nonnegative(),
            trajet: finiteNumber.nonnegative(),
          })
          .passthrough(),
      })
      .passthrough()
      .optional(),
    commandesEnCours: integer.nonnegative().optional(),
    geo: z
      .object({
        distanceKm: finiteNumber.nonnegative(),
        itineraire: z
          .object({
            distanceKm: finiteNumber.nonnegative(),
            dureeMinutes: finiteNumber.nonnegative(),
            geometrie: z.array(z.array(finiteNumber).length(2)).optional(),
          })
          .passthrough()
          .nullable(),
      })
      .passthrough()
      .nullable()
      .optional(),
  })
  .passthrough();

const nutritionSchema = z
  .object({
    lipides: finiteNumber,
    calories: finiteNumber,
    glucides: finiteNumber,
    proteines: finiteNumber,
  })
  .passthrough();

const platSchema = z
  .object({
    id: z.string().min(1),
    restaurantId: z.string().min(1),
    categorieId: z.string().min(1),
    creneauId: nullableString,
    nom: z.string().min(1),
    description: nullableString,
    prix: money,
    photoUrl: nullableString,
    disponible: z.boolean(),
    ordre: integer,
    tags: z.array(z.string()).nullable(),
    allergenes: z.array(z.string()).nullable(),
    nutrition: nutritionSchema.nullable(),
    nombreCommandes: integer.nonnegative(),
    noteMoyenne: finiteNumber.nonnegative().nullable(),
    nombreAvis: integer.nonnegative(),
    createdAt: z.string().min(1),
    updatedAt: z.string().min(1),
  })
  .passthrough();

export const categorieSchema = z
  .object({
    id: z.string().min(1),
    restaurantId: z.string().min(1),
    creneauId: nullableString,
    nom: z.string().min(1),
    description: nullableString,
    imageUrl: nullableString,
    ordre: integer,
    // Certaines versions déployées du menu client omettent ce champ.
    // Une catégorie renvoyée par cet endpoint est visible par défaut.
    visible: z.boolean().optional().default(true),
    createdAt: z.string().min(1),
    updatedAt: z.string().min(1),
    plats: z.array(platSchema),
  })
  .passthrough();

export const geocodeResultSchema = z
  .object({
    adresse: z.string().min(1),
    lat: finiteNumber,
    lng: finiteNumber,
    ville: z.string().optional(),
    pays: z.string().optional(),
  })
  .passthrough();

const commandeItemSchema = z
  .object({
    platId: z.string().min(1),
    nom: z.string().min(1),
    prix: money,
    quantite: integer.positive(),
    note: z.string().optional(),
  })
  .passthrough();

const commandeBaseSchema = z
  .object({
    id: z.string().min(1),
    numero: z.string().min(1),
    // Une nouvelle valeur backend reste affichable avec le fallback local.
    statut: z.string().min(1),
    total: money,
    items: z.array(commandeItemSchema),
    modeCommande: modeCommandeSchema,
    createdAt: z.string().min(1),
  })
  .passthrough();

export const commandeCreatedSchema = commandeBaseSchema.extend({
  fraisLivraison: money,
  sousTotal: money,
});

export const commandeCreationDataSchema = z
  .object({
    commande: commandeCreatedSchema,
    replayed: z.boolean(),
    payment: z.object({
      authorizationUrl: z.string().url().nullable(),
      reference: z.string().nullable(),
    }),
  })
  .passthrough();

export const commandeSummarySchema = commandeBaseSchema.extend({
  restaurantId: z.string().min(1),
  restaurant: z
    .object({
      nom: z.string().min(1),
      logoUrl: z.string().url().nullable(),
    })
    .passthrough()
    .nullable()
    .optional(),
});

const timelineEventSchema = z
  .object({
    etape: z.enum([
      "en_attente_paiement",
      "recue",
      "en_preparation",
      "prete",
      "en_route",
      "servie",
    ]),
    label: z.string(),
    fait: z.boolean(),
    actif: z.boolean(),
    timestamp: nullableString,
  })
  .passthrough();

export const commandeDetailSchema = commandeBaseSchema.extend({
  sousTotal: money,
  fraisLivraison: money,
  noteClient: nullableString,
  adresseLivraison: nullableString,
  numeroTable: nullableString,
  heureAcceptee: nullableString,
  heurePrete: nullableString,
  heureServie: nullableString,
  restaurantId: z.string().min(1),
  clientId: z.string().min(1),
  restaurant: z
    .object({ nom: z.string().min(1), logoUrl: nullableString })
    .passthrough()
    .nullable(),
  statutLabel: z.string(),
  livraisonStatut: z
    .enum([
      "en_attente",
      "assignee",
      "en_route",
      "livree",
      "echouee",
      "annulee",
    ])
    .nullable(),
  estAnnulee: z.boolean(),
  timeline: z.array(timelineEventSchema),
  payment: z
    .object({
      provider: z.literal("paystack"),
      method: z.enum(["mobile_money", "card"]),
      status: z.enum(["pending", "confirmed", "failed", "cancelled"]),
      checkoutUrl: z.string().url().nullable(),
    })
    .passthrough()
    .nullable(),
});

export const clientDeliverySchema = z
  .object({
    id: z.string().min(1),
    status: z.enum([
      "en_attente",
      "assignee",
      "en_route",
      "livree",
      "echouee",
      "annulee",
    ]),
    driver: z
      .object({
        name: z.string().min(1),
        phone: z.string().min(1),
        photoUrl: nullableString,
        vehicle: z.string().min(1),
        vehicleNumber: nullableString,
        restaurantName: z.string().min(1),
      })
      .passthrough()
      .nullable(),
    proofRequired: z.boolean(),
    proofCode: z.string().regex(/^\d{6}$/).nullable(),
    assignedAt: nullableString,
    startedAt: nullableString,
    completedAt: nullableString,
  })
  .passthrough();

export const clientDeliveryConfirmationSchema = z
  .object({ verified: z.literal(true) })
  .passthrough();

export const restaurantSearchDataSchema = z
  .object({
    items: z.array(restaurantSchema),
    market: z.unknown().nullable(),
    capability: z.unknown().nullable(),
    policyMode: z.enum(["off", "shadow", "enforce"]),
  })
  .passthrough();

export const etablissementItemSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(["restaurant", "residence"]),
    nom: z.string().min(1),
    slug: z.string().min(1),
    description: nullableString.optional(),
    adresse: z.string(),
    ville: nullableString.optional(),
    latitude: finiteNumber,
    longitude: finiteNumber,
    distanceKm: finiteNumber.nonnegative().nullable().optional(),
    imageUrl: nullableString.optional(),
    banniereUrl: nullableString.optional(),
    noteMoyenne: finiteNumber.nonnegative().nullable().optional(),
    nombreAvis: integer.nonnegative().optional(),
    enLigne: z.boolean(),
    prixAffiche: nullableString.optional(),
    prixFcfa: finiteNumber.nullable().optional(),
    tags: z.array(z.string()).optional(),
    placement: z.enum(["promoted", "organic"]).optional(),
    partnerBadgeEnabled: z.boolean().optional(),
    discoveryToken: z.string().optional(),
    recommendationReason: nullableString.optional(),
  })
  .passthrough();

export const etablissementSearchDataSchema = z
  .object({
    items: z.array(etablissementItemSchema),
    meta: z
      .object({
        total: integer.nonnegative(),
        page: integer.positive(),
        limit: integer.positive(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export const paymentInitializationSchema = z.object({
  authorizationUrl: z.string().url(),
  reference: z.string().min(1),
}).passthrough();

export const clientNotificationSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  title: z.string().min(1),
  message: z.string(),
  linkType: z.string().nullable(),
  linkId: z.string().nullable(),
  read: z.boolean(),
  readAt: z.string().nullable(),
  createdAt: z.string().min(1),
}).passthrough();

export const clientNotificationListSchema = z.object({
  items: z.array(clientNotificationSchema),
  unreadCount: z.number().int().nonnegative(),
}).passthrough();

export class ApiPayloadError extends Error {
  readonly context: string;
  readonly issues: readonly z.ZodIssue[];

  constructor(context: string, issues: readonly z.ZodIssue[]) {
    super(`Réponse API invalide (${context})`);
    this.name = "ApiPayloadError";
    this.context = context;
    this.issues = issues;
  }
}

/** Valide une enveloppe 2xx sans exposer son contenu dans les logs. */
export function parseApiSuccess<T>(
  value: unknown,
  dataSchema: z.ZodTypeAny,
  context: string,
): ApiSuccess<T> {
  const result = z
    .object({
      success: z.literal(true),
      data: dataSchema,
      meta: paginationMetaSchema.optional(),
    })
    .passthrough()
    .safeParse(value);

  if (!result.success) {
    throw new ApiPayloadError(context, result.error.issues);
  }

  return result.data as ApiSuccess<T>;
}
