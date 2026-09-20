import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { getLegalPageUrl, WEB_APP_URL } from "../src/constants/urls.ts";
import {
  CLIENT_PASSWORD_MAX_LENGTH,
  CLIENT_PASSWORD_MIN_LENGTH,
  clientRegisterSchema,
} from "../src/domain/clientRegistration.ts";
import { buildRestaurantSearchRequest } from "../src/domain/restaurantSearch.ts";
import {
  clientDeliveryConfirmationSchema,
  clientDeliverySchema,
  commandeCancellationDataSchema,
  commandeDetailSchema,
  orderPrevalidationDataSchema,
} from "../src/lib/apiValidation.ts";
import { COMMANDE_QUERY_ROOTS } from "../src/lib/commandeQueryCache.ts";
import {
  assertMobileOpenApiContract,
  renderGeneratedApiDocument,
} from "../scripts/openapi-contract.mjs";

function registrationWith(password, acceptedLegal = true) {
  return {
    nom: "Awa Koné",
    telephone: "07 01 02 03 04",
    email: "",
    password,
    confirmPassword: password,
    acceptedLegal,
  };
}

test("l'inscription applique exactement la borne backend 12 à 128", () => {
  assert.equal(
    clientRegisterSchema.safeParse(
      registrationWith("a".repeat(CLIENT_PASSWORD_MIN_LENGTH - 1)),
    ).success,
    false,
  );
  assert.equal(
    clientRegisterSchema.safeParse(
      registrationWith("a".repeat(CLIENT_PASSWORD_MIN_LENGTH)),
    ).success,
    true,
  );
  assert.equal(
    clientRegisterSchema.safeParse(
      registrationWith("a".repeat(CLIENT_PASSWORD_MAX_LENGTH)),
    ).success,
    true,
  );
  assert.equal(
    clientRegisterSchema.safeParse(
      registrationWith("a".repeat(CLIENT_PASSWORD_MAX_LENGTH + 1)),
    ).success,
    false,
  );
});

test("l'inscription exige l'acceptation des documents légaux", () => {
  assert.equal(
    clientRegisterSchema.safeParse(
      registrationWith("a".repeat(CLIENT_PASSWORD_MIN_LENGTH), false),
    ).success,
    false,
  );
});

test("les pages légales pointent vers le site web, pas un texte embarqué", () => {
  assert.equal(
    getLegalPageUrl("cgu"),
    `${WEB_APP_URL}/conditions-generales`,
  );
  assert.equal(
    getLegalPageUrl("mentions"),
    `${WEB_APP_URL}/mentions-legales`,
  );
});

test("la prévalidation exige un booléen valid", () => {
  assert.equal(
    orderPrevalidationDataSchema.safeParse({
      valid: true,
      serviceMarketId: "bouake",
      geoPolicyVersion: "2026-09",
    }).success,
    true,
  );
  assert.equal(
    orderPrevalidationDataSchema.safeParse({ valid: "oui" }).success,
    false,
  );
});

test("l'annulation mobile accepte une réponse minimale", () => {
  assert.equal(
    commandeCancellationDataSchema.safeParse({ statut: "annulee" }).success,
    true,
  );
});

test("les validateurs mobiles acceptent une livraison annulée", () => {
  assert.equal(
    clientDeliverySchema.safeParse({
      id: "delivery-1",
      status: "annulee",
      driver: null,
      proofRequired: false,
      proofCode: null,
      assignedAt: null,
      startedAt: null,
      completedAt: null,
    }).success,
    true,
  );
  assert.equal(
    commandeDetailSchema.shape.livraisonStatut.safeParse("annulee").success,
    true,
  );
  assert.equal(
    clientDeliveryConfirmationSchema.safeParse({ verified: true }).success,
    true,
  );
});

test("la recherche publique envoie le body strict accepté par le runtime", () => {
  const body = buildRestaurantSearchRequest({
    location: {
      latitude: 7.6906,
      longitude: -5.0305,
      accuracyMeters: 15,
      capturedAt: "2026-08-31T01:10:12Z",
    },
    query: "  maquis  ",
    cuisine: " Ivoirienne ",
    page: 0,
    limit: 200,
  });

  assert.deepEqual(body, {
    currentLocation: {
      lat: 7.6906,
      lng: -5.0305,
      accuracyMeters: 15,
      capturedAt: "2026-08-31T01:10:12Z",
    },
    query: "maquis",
    cuisine: "Ivoirienne",
    page: 1,
    limit: 100,
  });
  assert.equal("legacyRadiusKm" in body, false);
});

test("une mutation commande invalide toutes les projections dépendantes", () => {
  assert.deepEqual(
    COMMANDE_QUERY_ROOTS.map(([root]) => root),
    ["commandes", "commande-tracking", "livraison", "notifications"],
  );
});

test("l'artefact TypeScript est une génération exacte de l'OpenAPI validé", () => {
  const document = JSON.parse(
    readFileSync(new URL("../openapi/openapi-v1.json", import.meta.url), "utf8"),
  );
  assert.doesNotThrow(() => assertMobileOpenApiContract(document));
  assert.equal(
    readFileSync(
      new URL("../src/generated/api-v1.ts", import.meta.url),
      "utf8",
    ),
    renderGeneratedApiDocument(document),
  );
});
