import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  aggregateCartItems,
  buildLogicalOrder,
  clampItemQuantity,
  getSupportedCheckoutModes,
  hasInvalidItemQuantity,
  prepareIdempotentOrder,
} from "../src/domain/checkout.ts";
import { calculerDetailPanier } from "../src/lib/tarification.ts";
import {
  categorizeOrderStatus,
  getOrderStatusLabel,
  isTerminalOrderStatus,
} from "../src/domain/orderStatus.ts";
import {
  parseStoredAddressIndex,
  parseStoredAddresses,
  parseStoredCart,
  parseStoredFavorites,
} from "../src/domain/localData.ts";
import {
  ApiPayloadError,
  authDataSchema,
  commandeCreationDataSchema,
  parseApiSuccess,
  restaurantSchema,
} from "../src/lib/apiValidation.ts";
import { residenceCreationSchema, residenceReservationSchema } from "../src/lib/residenceValidation.ts";
import { resolveAuthRedirect } from "../src/domain/authRedirect.ts";

test("agrège les lignes identiques avant l'envoi", () => {
  assert.deepEqual(
    aggregateCartItems([
      { platId: "attiéké", quantite: 2 },
      { platId: "alloco", quantite: 1 },
      { platId: "attiéké", quantite: 3 },
    ]),
    [
      { platId: "attiéké", quantite: 5 },
      { platId: "alloco", quantite: 1 },
    ],
  );
});

test("refuse les quantités hors de la limite backend", () => {
  assert.equal(
    hasInvalidItemQuantity([{ platId: "a", quantite: 0 }]),
    true,
  );
  assert.equal(
    hasInvalidItemQuantity([{ platId: "a", quantite: 20 }]),
    false,
  );
  assert.equal(
    hasInvalidItemQuantity([{ platId: "a", quantite: 21 }]),
    true,
  );
  assert.equal(clampItemQuantity(Number.NaN), 1);
  assert.equal(clampItemQuantity(-2), 1);
  assert.equal(clampItemQuantity(25), 20);
});

test("n'autorise que les modes pris en charge par le checkout mobile", () => {
  assert.deepEqual(
    getSupportedCheckoutModes(["sur_place", "emporter"]),
    ["emporter"],
  );
  assert.deepEqual(
    getSupportedCheckoutModes(["livraison", "emporter"]),
    ["livraison", "emporter"],
  );
});

test("le mode emporter n'envoie ni adresse ni coordonnées", () => {
  assert.deepEqual(
    buildLogicalOrder({
      restaurantSlug: "chez-nous",
      mode: "emporter",
      items: [{ platId: "a", quantite: 1 }],
      adresse: "Bouaké",
      coordinates: { latitude: 7.69, longitude: -5.03 },
      notes: "  sans piment  ",
      paymentMethod: "cash",
    }),
    {
      restaurantSlug: "chez-nous",
      modeCommande: "emporter",
      items: [{ platId: "a", quantite: 1 }],
      adresseLivraison: undefined,
      latitudeLivraison: undefined,
      longitudeLivraison: undefined,
      noteClient: "sans piment",
      paymentMethod: "cash",
      paymentReturnChannel: "mobile",
    },
  );
});

test("un retry du même payload conserve la clé d'idempotence", () => {
  const logicalOrder = buildLogicalOrder({
    restaurantSlug: "chez-nous",
    mode: "livraison",
    items: [{ platId: "a", quantite: 1 }],
    adresse: "Quartier Commerce",
    paymentMethod: "cash",
  });
  let keyIndex = 0;
  const createKey = () => `key-${++keyIndex}`;
  const first = prepareIdempotentOrder(logicalOrder, null, createKey);
  const retry = prepareIdempotentOrder(
    logicalOrder,
    first.pendingOrder,
    createKey,
  );

  assert.equal(first.payload.idempotencyKey, "key-1");
  assert.equal(retry.payload.idempotencyKey, "key-1");
  assert.equal(keyIndex, 1);
});

test("une intention modifiée reçoit une nouvelle clé d'idempotence", () => {
  const firstOrder = buildLogicalOrder({
    restaurantSlug: "chez-nous",
    mode: "emporter",
    items: [{ platId: "a", quantite: 1 }],
    paymentMethod: "cash",
  });
  const secondOrder = buildLogicalOrder({
    restaurantSlug: "chez-nous",
    mode: "emporter",
    items: [{ platId: "a", quantite: 2 }],
    paymentMethod: "cash",
  });
  let keyIndex = 0;
  const createKey = () => `key-${++keyIndex}`;
  const first = prepareIdempotentOrder(firstOrder, null, createKey);
  const second = prepareIdempotentOrder(
    secondOrder,
    first.pendingOrder,
    createKey,
  );

  assert.equal(first.payload.idempotencyKey, "key-1");
  assert.equal(second.payload.idempotencyKey, "key-2");
});

test("la tarification n'ajoute que la livraison lorsqu'elle s'applique", () => {
  assert.deepEqual(
    calculerDetailPanier({
      sousTotal: 2_500,
      fraisLivraisonBase: 500,
      modeLivraison: true,
    }),
    { sousTotal: 2_500, fraisLivraison: 500, total: 3_000 },
  );
  assert.deepEqual(
    calculerDetailPanier({
      sousTotal: 2_500,
      fraisLivraisonBase: 500,
      modeLivraison: false,
    }),
    { sousTotal: 2_500, fraisLivraison: 0, total: 2_500 },
  );
});

test("centralise les statuts terminaux et leurs catégories", () => {
  assert.equal(isTerminalOrderStatus("servie"), true);
  assert.equal(isTerminalOrderStatus("annulee"), true);
  assert.equal(isTerminalOrderStatus("en_preparation"), false);
  assert.equal(categorizeOrderStatus("servie"), "livrees");
  assert.equal(categorizeOrderStatus("inconnu"), "en_cours");
  assert.equal(getOrderStatusLabel("inconnu"), "Statut à confirmer");
});

test("la persistance locale rejette les enregistrements corrompus", () => {
  assert.deepEqual(parseStoredFavorites("not-json"), []);
  assert.deepEqual(
    parseStoredFavorites(
      JSON.stringify({
        version: 2,
        data: [
          { id: "1", nom: "Chez nous", slug: "chez-nous" },
          { id: "", nom: "Invalide", slug: "invalide" },
        ],
      }),
    ),
    [{ id: "1", nom: "Chez nous", slug: "chez-nous" }],
  );
  assert.deepEqual(parseStoredAddresses(JSON.stringify({ data: [{}] })), []);
  assert.deepEqual(
    parseStoredAddressIndex(
      JSON.stringify({ version: 3, ids: ["maison", "maison", "bureau"] }),
    ),
    ["maison", "bureau"],
  );
  assert.equal(
    parseStoredAddressIndex(JSON.stringify({ version: 2, ids: [] })),
    null,
  );
});

test("la migration du panier tolère l'ancien format et assainit les lignes", () => {
  const cart = parseStoredCart(
    JSON.stringify({
      items: [
        {
          platId: "a",
          nom: "Alloco",
          prix: 1_000,
          quantite: 2,
          photoUrl: null,
        },
        {
          platId: "b",
          nom: "Invalide",
          prix: 500,
          quantite: 21,
          photoUrl: null,
        },
      ],
      restaurantSlug: "chez-nous",
    }),
  );

  assert.equal(cart.items.length, 1);
  assert.equal(cart.restaurantSlug, "chez-nous");
  assert.deepEqual(parseStoredCart(JSON.stringify({ state: { items: [] } })), {
    items: [],
    restaurantSlug: null,
  });
});

test("une réponse API 2xx mal formée est rejetée à la frontière", () => {
  assert.throws(
    () =>
      parseApiSuccess(
        { success: true, data: [{ id: "incomplet" }] },
        restaurantSchema.array(),
        "test/restaurants",
      ),
    ApiPayloadError,
  );
});

test("les redirections post-auth restent dans les routes autorisées", () => {
  assert.equal(resolveAuthRedirect("/(tabs)/panier"), "/panier");
  assert.equal(
    resolveAuthRedirect("/(tabs)/commandes/123e4567-e89b-12d3-a456"),
    "/(tabs)/commandes/123e4567-e89b-12d3-a456",
  );
  assert.equal(resolveAuthRedirect("//site-externe.test"), "/(tabs)");
  assert.equal(resolveAuthRedirect("/(tabs)/profil"), "/(tabs)");
});

test("la session native exige un refresh token JSON", () => {
  const base = {
    client: { id: "client-1", nom: "Awa", telephone: "+2250102030405" },
    tokens: { accessToken: "access", expiresIn: 900 },
  };
  assert.equal(authDataSchema.safeParse(base).success, false);
  assert.equal(
    authDataSchema.safeParse({
      ...base,
      tokens: { ...base.tokens, refreshToken: "refresh" },
    }).success,
    true,
  );
});

test("la création de commande expose toujours le résultat Paystack", () => {
  const parsed = commandeCreationDataSchema.safeParse({
    commande: {
      id: "commande-1",
      numero: "CMD-1",
      statut: "en_attente_paiement",
      total: 3000,
      fraisLivraison: 500,
      sousTotal: 2500,
      items: [],
      modeCommande: "livraison",
      createdAt: new Date().toISOString(),
    },
    replayed: false,
    payment: {
      authorizationUrl: "https://checkout.paystack.com/test",
      reference: "reference-1",
    },
  });
  assert.equal(parsed.success, true);
});

test("les réponses de réservation critiques sont validées", () => {
  assert.equal(
    residenceCreationSchema.safeParse({
      reservationId: "reservation-1",
      paymentId: "payment-1",
      checkoutUrl: "https://checkout.paystack.com/test",
    }).success,
    true,
  );
  assert.equal(
    residenceReservationSchema.safeParse({ id: "incomplet" }).success,
    false,
  );
});

test("l’artefact OpenAPI mobile contient les parcours consommateurs requis", () => {
  const document = JSON.parse(
    readFileSync(new URL("../openapi/openapi-v1.json", import.meta.url), "utf8"),
  );
  for (const path of [
    "/client/auth/refresh",
    "/client/commandes/{id}/paiement",
    "/client/notifications",
    "/client/push/expo",
    "/client/reservations",
    "/public/residences/search",
  ]) {
    assert.ok(document.paths[path], `route OpenAPI absente: ${path}`);
  }
});
