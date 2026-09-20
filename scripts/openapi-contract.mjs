const REQUIRED_OPERATIONS = [
  ["/client/auth/register", "post", "clientRegister"],
  ["/client/commandes/prevalidate", "post", "prevalidateClientOrder"],
  ["/client/commandes/{id}", "patch", "cancelClientOrder"],
  ["/client/commandes/{id}/livraison", "get", "getClientDelivery"],
  [
    "/client/commandes/{id}/livraison/confirmation",
    "post",
    "confirmClientDelivery",
  ],
  ["/public/restaurants/search", "post", "searchPublicRestaurants"],
  ["/public/residences/search", "post", "searchPublicResidences"],
  ["/public/residences/{id}", "get", "getPublicResidence"],
  [
    "/public/residences/{id}/availability",
    "get",
    "getPublicResidenceAvailability",
  ],
  ["/public/residences/{id}/quote", "post", "quotePublicResidence"],
  ["/client/reservations", "get", "listClientReservations"],
  ["/client/reservations", "post", "createClientReservation"],
  ["/client/reservations/{id}", "get", "getClientReservation"],
  [
    "/client/reservations/{id}/cancel",
    "post",
    "cancelClientReservation",
  ],
  [
    "/client/reservations/{id}/payment",
    "post",
    "retryClientReservationPayment",
  ],
  ["/public/discovery/events", "post", "recordDiscoveryEvent"],
];

function invariant(condition, message) {
  if (!condition) throw new Error(`Contrat OpenAPI mobile invalide: ${message}`);
}

export function assertMobileOpenApiContract(document) {
  invariant(document?.openapi === "3.1.0", "OpenAPI 3.1.0 attendu");

  for (const [path, method, operationId] of REQUIRED_OPERATIONS) {
    const operation = document?.paths?.[path]?.[method];
    invariant(operation, `${method.toUpperCase()} ${path} absent`);
    invariant(
      operation.operationId === operationId,
      `${method.toUpperCase()} ${path}: operationId ${operationId} attendu`,
    );
  }

  const password =
    document?.components?.schemas?.ClientRegisterRequest?.properties?.password;
  invariant(password?.minLength === 12, "mot de passe client minLength=12 attendu");
  invariant(password?.maxLength === 128, "mot de passe client maxLength=128 attendu");

  const restaurantSearch =
    document?.components?.schemas?.RestaurantSearchRequest;
  invariant(
    restaurantSearch?.additionalProperties === false,
    "RestaurantSearchRequest doit rester strict",
  );
  invariant(
    restaurantSearch?.properties?.currentLocation?.$ref ===
      "#/components/schemas/LocationSample",
    "RestaurantSearchRequest.currentLocation doit référencer LocationSample",
  );

  const residenceSearch =
    document?.components?.schemas?.ResidenceSearchRequest;
  invariant(
    residenceSearch?.additionalProperties === false,
    "ResidenceSearchRequest doit rester strict",
  );
  invariant(
    residenceSearch?.properties?.destination?.maxLength === 100,
    "ResidenceSearchRequest.destination maxLength=100 attendu",
  );
  invariant(
    residenceSearch?.properties?.guests?.minimum === 1 &&
      residenceSearch?.properties?.guests?.maximum === 100,
    "ResidenceSearchRequest.guests doit rester borné de 1 à 100",
  );
  invariant(
    residenceSearch?.properties?.limit?.maximum === 48,
    "ResidenceSearchRequest.limit maximum=48 attendu",
  );
  invariant(
    residenceSearch?.properties?.checkIn?.format === "date" &&
      residenceSearch?.properties?.checkOut?.format === "date",
    "ResidenceSearchRequest doit exposer les dates du séjour",
  );

  const residenceQuote =
    document?.components?.schemas?.ResidenceQuoteRequest;
  invariant(
    ["checkIn", "checkOut", "guests"].every((field) =>
      residenceQuote?.required?.includes(field),
    ),
    "ResidenceQuoteRequest doit exiger dates et voyageurs",
  );

  const residenceReservation =
    document?.components?.schemas?.ResidenceReservationRequest;
  invariant(
    residenceReservation?.allOf?.[0]?.$ref ===
      "#/components/schemas/ResidenceQuoteRequest",
    "ResidenceReservationRequest doit réutiliser ResidenceQuoteRequest",
  );
  invariant(
    ["residenceId", "paymentMethod"].every((field) =>
      residenceReservation?.allOf?.[1]?.required?.includes(field),
    ),
    "ResidenceReservationRequest doit exiger résidence et paiement",
  );

  const residencePayment =
    document?.paths?.["/client/reservations/{id}/payment"]?.post
      ?.requestBody?.content?.["application/json"]?.schema;
  invariant(
    residencePayment?.additionalProperties === false &&
      residencePayment?.required?.includes("method"),
    "le paiement de résidence doit exiger un body strict avec method",
  );
  invariant(
    residencePayment?.properties?.method?.enum?.join(",") ===
      "mobile_money,card",
    "les méthodes de paiement résidence ont dérivé",
  );

  const discoveryEvent =
    document?.components?.schemas?.DiscoveryEventRequest;
  invariant(
    discoveryEvent?.additionalProperties === false &&
      discoveryEvent?.properties?.eventType?.const === "detail_open",
    "DiscoveryEventRequest doit rester strict et limité à detail_open",
  );
  invariant(
    discoveryEvent?.properties?.token?.minLength === 20 &&
      discoveryEvent?.properties?.token?.maxLength === 2_000,
    "DiscoveryEventRequest.token doit rester borné de 20 à 2000",
  );
}

export function renderOpenApiDocument(document) {
  return `${JSON.stringify(document, null, 2)}\n`;
}

export function renderGeneratedApiDocument(document) {
  return (
    "// Généré par npm run api:sync. Ne pas modifier manuellement.\n" +
    `export const apiV1Document = ${JSON.stringify(document, null, 2)} as const;\n\n` +
    "export type ApiV1Path = keyof typeof apiV1Document.paths;\n" +
    "export type ApiV1Method<Path extends ApiV1Path> = keyof typeof apiV1Document.paths[Path];\n"
  );
}
