import { z } from "zod";

const integer = z.number().int();
const money = integer.nonnegative();
const residenceDateSchema = z.string().refine((value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
  );
});
const residenceBookabilityBlockerSchema = z.enum([
  "not_public",
  "provider_account_missing",
]);

export const residencePhotoSchema = z.object({
  id: z.string().min(1),
  url: z.string().url(),
  altText: z.string().nullable(),
  sortOrder: integer,
}).passthrough();

export const publicResidenceSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  pricePerNightFcfa: money,
  maxGuests: integer.positive(),
  city: z.string(),
  country: z.string(),
  firstPublishedAt: z.string().min(1),
  photos: z.array(residencePhotoSchema),
  bookability: z.object({
    isBookable: z.boolean(),
    blockers: z.array(residenceBookabilityBlockerSchema),
  }).passthrough(),
  placement: z.enum(["promoted", "organic"]),
  partnerBadgeEnabled: z.boolean(),
  discoveryToken: z.string(),
}).passthrough();

export const publicResidenceSearchDataSchema = z.object({
  items: z.array(publicResidenceSchema),
}).passthrough();

export const residenceAvailabilitySchema = z
  .object({
    residenceId: z.string().min(1),
    unavailable: z.array(
      z
        .object({
          checkIn: residenceDateSchema,
          checkOut: residenceDateSchema,
          source: z.enum(["reservation", "owner_block"]),
        })
        .passthrough(),
    ),
  })
  .passthrough();

export const residenceQuoteSchema = z.object({
  residenceId: z.string().min(1),
  checkIn: residenceDateSchema,
  checkOut: residenceDateSchema,
  nights: integer.positive(),
  guests: integer.positive(),
  pricePerNightFcfa: money,
  subtotalFcfa: money,
  totalFcfa: money,
  available: z.boolean(),
  bookabilityBlockers: z.array(residenceBookabilityBlockerSchema),
}).passthrough();

export const residenceReservationSchema = z.object({
  id: z.string().min(1),
  residenceId: z.string().min(1),
  residenceSlug: z.string().min(1),
  residenceTitle: z.string().min(1),
  residenceCity: z.string(),
  residenceCoverUrl: z.string().url().nullable(),
  residenceMaxGuests: integer.positive(),
  partnerAccountId: z.string().min(1),
  clientId: z.string().min(1),
  clientName: z.string(),
  clientPhone: z.string(),
  status: z.enum(["en_attente_paiement", "confirmee", "annulee"]),
  temporalStatus: z.enum(["a_venir", "en_cours", "terminee"]),
  checkIn: residenceDateSchema,
  checkOut: residenceDateSchema,
  nights: integer.positive(),
  guests: integer.positive(),
  pricePerNightSnapshotFcfa: money,
  subtotalFcfa: money,
  totalFcfa: money,
  commissionRateBpsSnapshot: integer.nonnegative(),
  commissionAmountFcfa: money,
  paymentMethod: z.enum(["mobile_money", "card"]),
  paymentStatus: z.enum(["pending", "confirmed", "failed", "cancelled"]),
  checkoutUrl: z.string().url().nullable(),
  confirmedAt: z.string().nullable(),
  cancelledAt: z.string().nullable(),
  cancellationSource: z.string().nullable(),
  cancellationReason: z.string().nullable(),
  createdAt: z.string().min(1),
}).passthrough();

export const residenceCreationSchema = z.object({
  reservationId: z.string().min(1),
  paymentId: z.string().min(1),
  checkoutUrl: z.string().url(),
}).passthrough();

export const residencePaymentSchema = z.object({
  authorizationUrl: z.string().url(),
  reference: z.string().min(1),
}).passthrough();

export const residenceCancellationSchema = z
  .object({
    id: z.string().min(1),
    status: z.literal("annulee"),
  })
  .passthrough()
  .nullable();

export const discoveryDetailOpenSchema = z
  .object({ recorded: z.boolean() })
  .passthrough();
