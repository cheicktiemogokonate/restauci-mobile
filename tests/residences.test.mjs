import assert from "node:assert/strict";
import test from "node:test";

import {
  addResidenceDays,
  buildResidenceSearchRequest,
  getDefaultResidenceStay,
  isIsoResidenceDate,
} from "../src/domain/residenceSearch.ts";
import { RESIDENCE_MUTATION_QUERY_ROOTS } from "../src/lib/residenceQueryCache.ts";
import {
  discoveryDetailOpenSchema,
  residenceAvailabilitySchema,
  residenceCancellationSchema,
  residenceReservationSchema,
} from "../src/lib/residenceValidation.ts";

test("la recherche résidence transmet le séjour dans les bornes OpenAPI", () => {
  const request = buildResidenceSearchRequest(
    {
      destination: "  Grand-Bassam  ",
      checkIn: "2026-09-10",
      checkOut: "2026-09-13",
      guests: 120,
    },
    0,
    100,
  );

  assert.deepEqual(request, {
    destination: "Grand-Bassam",
    checkIn: "2026-09-10",
    checkOut: "2026-09-13",
    guests: 100,
    page: 1,
    limit: 48,
  });
});

test("les helpers de dates résidence conservent des dates calendrier", () => {
  assert.deepEqual(
    getDefaultResidenceStay(new Date("2026-08-31T08:00:00.000Z")),
    { checkIn: "2026-09-01", checkOut: "2026-09-02", guests: 1 },
  );
  assert.equal(addResidenceDays("2026-12-31", 1), "2027-01-01");
  assert.equal(isIsoResidenceDate("2026-09-01"), true);
  assert.equal(isIsoResidenceDate("01/09/2026"), false);
  assert.equal(isIsoResidenceDate("2026-02-30"), false);
});

test("la disponibilité résidence est validée à la frontière API", () => {
  const availability = {
    residenceId: "residence-1",
    unavailable: [
      {
        checkIn: "2026-09-10",
        checkOut: "2026-09-12",
        source: "owner_block",
      },
      {
        checkIn: "2026-10-01",
        checkOut: "2026-10-03",
        source: "reservation",
      },
    ],
  };
  assert.equal(residenceAvailabilitySchema.safeParse(availability).success, true);
  assert.equal(
    residenceAvailabilitySchema.safeParse({
      ...availability,
      unavailable: [{ ...availability.unavailable[0], source: "mobile" }],
    }).success,
    false,
  );
});

test("le détail réservation accepte tous les champs autoritaires du serveur", () => {
  const reservation = {
    id: "reservation-1",
    residenceId: "residence-1",
    residenceSlug: "villa-lagune",
    residenceTitle: "Villa Lagune",
    residenceCity: "Grand-Bassam",
    residenceCoverUrl: "https://images.example.test/villa.jpg",
    residenceMaxGuests: 6,
    partnerAccountId: "partner-1",
    clientId: "client-1",
    clientName: "Awa Koné",
    clientPhone: "+2250102030405",
    status: "annulee",
    temporalStatus: "a_venir",
    checkIn: "2026-09-10",
    checkOut: "2026-09-13",
    nights: 3,
    guests: 4,
    pricePerNightSnapshotFcfa: 50_000,
    subtotalFcfa: 150_000,
    totalFcfa: 150_000,
    commissionRateBpsSnapshot: 1_000,
    commissionAmountFcfa: 15_000,
    paymentMethod: "mobile_money",
    paymentStatus: "cancelled",
    checkoutUrl: null,
    confirmedAt: null,
    cancelledAt: "2026-09-01T12:00:00.000Z",
    cancellationSource: "partner",
    cancellationReason: "Travaux urgents dans la résidence",
    createdAt: "2026-08-31T12:00:00.000Z",
  };

  const parsed = residenceReservationSchema.safeParse(reservation);
  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.equal(parsed.data.totalFcfa, reservation.totalFcfa);
    assert.equal(parsed.data.cancellationSource, "partner");
  }
});

test("l'annulation idempotente et l'attribution de découverte sont validées", () => {
  assert.equal(residenceCancellationSchema.safeParse(null).success, true);
  assert.equal(
    residenceCancellationSchema.safeParse({
      id: "reservation-1",
      status: "annulee",
    }).success,
    true,
  );
  assert.equal(
    discoveryDetailOpenSchema.safeParse({ recorded: true }).success,
    true,
  );
});

test("une mutation résidence invalide toutes ses projections dépendantes", () => {
  assert.deepEqual(RESIDENCE_MUTATION_QUERY_ROOTS, [
    ["reservations"],
    ["residences", "availability"],
    ["residences", "quote"],
    ["residences", "search"],
    ["notifications"],
  ]);
});
