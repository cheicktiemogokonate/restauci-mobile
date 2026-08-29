import type { StatutCommande } from "../types";

export type OrderFilter = "toutes" | "en_cours" | "livrees" | "annulees";

const ORDER_STATUSES = new Set<StatutCommande>([
  "en_attente_paiement",
  "recue",
  "en_preparation",
  "prete",
  "servie",
  "annulee",
]);

const TERMINAL_STATUSES = new Set<StatutCommande>(["servie", "annulee"]);

const SHORT_LABELS: Record<StatutCommande, string> = {
  en_attente_paiement: "Paiement attendu",
  recue: "Reçue",
  en_preparation: "En préparation",
  prete: "Prête",
  servie: "Livrée",
  annulee: "Annulée",
};

const DETAIL_LABELS: Record<StatutCommande, string> = {
  en_attente_paiement: "Paiement en attente",
  recue: "Commande reçue",
  en_preparation: "En préparation",
  prete: "Prête",
  servie: "Livrée",
  annulee: "Annulée",
};

export function isKnownOrderStatus(value: string): value is StatutCommande {
  return ORDER_STATUSES.has(value as StatutCommande);
}

export function isTerminalOrderStatus(value: string): boolean {
  return isKnownOrderStatus(value) && TERMINAL_STATUSES.has(value);
}

export function getOrderStatusLabel(
  value: string,
  variant: "short" | "detail" = "short",
): string {
  if (!isKnownOrderStatus(value)) return "Statut à confirmer";
  return variant === "detail" ? DETAIL_LABELS[value] : SHORT_LABELS[value];
}

export function categorizeOrderStatus(value: string): OrderFilter {
  if (value === "servie") return "livrees";
  if (value === "annulee") return "annulees";
  return "en_cours";
}

export function getOngoingOrderMessage(value: string): string {
  if (value === "en_attente_paiement") return "Paiement en attente";
  if (value === "recue") return "Commande reçue";
  if (value === "en_preparation") return "Commande en préparation";
  if (value === "prete") return "Commande prête";
  return "Statut de la commande à confirmer";
}
