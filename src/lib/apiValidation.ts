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
    visible: z.boolean(),
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
    .enum(["en_attente", "assignee", "en_route", "livree", "echouee"])
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
