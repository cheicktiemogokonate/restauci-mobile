import type {
  CommandePayload,
  ModeCommande,
  PanierItem,
} from "../types";
import type { DiscoveryLocation } from "../types/etablissement";

export type CheckoutMode = Extract<ModeCommande, "livraison" | "emporter">;

export interface LocationSample {
  lat: number;
  lng: number;
  accuracyMeters: number;
  capturedAt: string;
}

const CHECKOUT_MODES: readonly CheckoutMode[] = ["livraison", "emporter"];
export const MAX_ITEM_QUANTITY = 20;

export interface DeliveryCoordinates {
  latitude: number;
  longitude: number;
}

export interface PendingOrder {
  fingerprint: string;
  idempotencyKey: string;
}

export function getSupportedCheckoutModes(
  modes: readonly ModeCommande[],
): CheckoutMode[] {
  return CHECKOUT_MODES.filter((mode) => modes.includes(mode));
}

export function getOrderModeLabel(mode: ModeCommande): string {
  if (mode === "livraison") return "Livraison";
  if (mode === "emporter") return "À emporter";
  return "Sur place";
}

export function toLocationSample(
  location: DiscoveryLocation,
): LocationSample {
  return {
    lat: location.latitude,
    lng: location.longitude,
    accuracyMeters: location.accuracyMeters,
    capturedAt: location.capturedAt,
  };
}

export function buildOrderPrevalidationRequest(
  payload: Pick<
    CommandePayload,
    | "restaurantSlug"
    | "modeCommande"
    | "currentLocation"
    | "adresseLivraison"
    | "latitudeLivraison"
    | "longitudeLivraison"
  >,
): {
  restaurantSlug: string;
  modeCommande: CheckoutMode;
  currentLocation: LocationSample;
  adresseLivraison?: string;
  latitudeLivraison?: number;
  longitudeLivraison?: number;
} {
  if (
    payload.modeCommande !== "livraison" &&
    payload.modeCommande !== "emporter"
  ) {
    throw new Error(
      "La commande sur place n’est pas proposée depuis l’application.",
    );
  }

  const isDelivery = payload.modeCommande === "livraison";
  return {
    restaurantSlug: payload.restaurantSlug,
    modeCommande: payload.modeCommande,
    currentLocation: payload.currentLocation,
    ...(isDelivery
      ? {
          adresseLivraison: payload.adresseLivraison,
          latitudeLivraison: payload.latitudeLivraison,
          longitudeLivraison: payload.longitudeLivraison,
        }
      : {}),
  };
}

export function aggregateCartItems(
  items: readonly Pick<PanierItem, "platId" | "quantite">[],
): CommandePayload["items"] {
  return Array.from(
    items.reduce((byPlat, item) => {
      byPlat.set(item.platId, (byPlat.get(item.platId) ?? 0) + item.quantite);
      return byPlat;
    }, new Map<string, number>()),
    ([platId, quantite]) => ({ platId, quantite }),
  );
}

export function hasInvalidItemQuantity(
  items: readonly CommandePayload["items"][number][],
): boolean {
  return items.some(
    (item) => item.quantite < 1 || item.quantite > MAX_ITEM_QUANTITY,
  );
}

export function clampItemQuantity(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(MAX_ITEM_QUANTITY, Math.max(1, Math.trunc(value)));
}

export type LogicalOrder = Omit<
  CommandePayload,
  "idempotencyKey" | "currentLocation"
>;

export function buildLogicalOrder({
  restaurantSlug,
  mode,
  items,
  adresse,
  coordinates,
  notes,
  paymentMethod,
}: {
  restaurantSlug: string;
  mode: CheckoutMode;
  items: CommandePayload["items"];
  adresse?: string;
  coordinates?: DeliveryCoordinates | null;
  notes?: string;
  paymentMethod: CommandePayload["paymentMethod"];
}): LogicalOrder {
  const isDelivery = mode === "livraison";
  return {
    restaurantSlug,
    modeCommande: mode,
    items,
    adresseLivraison: isDelivery ? adresse?.trim() : undefined,
    latitudeLivraison: isDelivery ? coordinates?.latitude : undefined,
    longitudeLivraison: isDelivery ? coordinates?.longitude : undefined,
    noteClient: notes?.trim() || undefined,
    paymentMethod,
    paymentReturnChannel: "mobile",
  };
}

export function prepareIdempotentOrder(
  logicalOrder: LogicalOrder,
  pendingOrder: PendingOrder | null,
  createKey: () => string,
): { pendingOrder: PendingOrder; payload: LogicalOrder & { idempotencyKey: string } } {
  const fingerprint = JSON.stringify(logicalOrder);
  const nextPendingOrder =
    pendingOrder?.fingerprint === fingerprint
      ? pendingOrder
      : { fingerprint, idempotencyKey: createKey() };

  return {
    pendingOrder: nextPendingOrder,
    payload: {
      ...logicalOrder,
      idempotencyKey: nextPendingOrder.idempotencyKey,
    },
  };
}
