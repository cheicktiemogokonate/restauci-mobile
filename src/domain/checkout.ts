import type {
  CommandePayload,
  ModeCommande,
  PanierItem,
} from "../types";

export type CheckoutMode = Extract<ModeCommande, "livraison" | "emporter">;

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
}): Omit<CommandePayload, "idempotencyKey"> {
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
  logicalOrder: Omit<CommandePayload, "idempotencyKey">,
  pendingOrder: PendingOrder | null,
  createKey: () => string,
): { pendingOrder: PendingOrder; payload: CommandePayload } {
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
