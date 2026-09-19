import {
  categorizeOrderStatus,
  getOrderStatusLabel,
} from "@/domain/orderStatus";
import type {
  CommandeSummary,
  StatutCommande,
} from "@/types";
import type { ResidenceReservation } from "@/types/residences";

export type ActivityPhase = "now" | "upcoming" | "recent" | "history";

interface ActivityBase {
  id: string;
  imageUrl: string | null;
  phase: ActivityPhase;
  route: `/(tabs)/commandes/${string}` | `/reservations/${string}`;
  sortAt: string;
  title: string;
}

export interface OrderActivityItem extends ActivityBase {
  amount: number;
  articleCount: number;
  kind: "order";
  numero: string;
  progressIndex: number;
  status: string;
  statusCode: StatutCommande;
}

export interface StayActivityItem extends ActivityBase {
  amount: number;
  checkIn: string;
  checkOut: string;
  city: string;
  guests: number;
  kind: "stay";
  status: string;
}

export type ActivityItem = OrderActivityItem | StayActivityItem;

export interface ActivityFeed {
  now: ActivityItem[];
  upcoming: ActivityItem[];
  recent: ActivityItem[];
  history: ActivityItem[];
}

export const ACTIVITY_RECENT_DAYS = 7;
export const ORDER_ACTIVE_HOURS = 24;

const DAY_MS = 24 * 60 * 60 * 1000;

const ORDER_PROGRESS: Record<StatutCommande, number> = {
  annulee: 0,
  en_attente_paiement: 0,
  en_preparation: 1,
  prete: 2,
  recue: 0,
  servie: 2,
};

function safeTime(value: string): number {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function orderImage(order: CommandeSummary): string | null {
  return order.restaurant?.logoUrl ?? null;
}

function orderTitle(order: CommandeSummary): string {
  return order.restaurant?.nom?.trim() || `Commande ${order.numero}`;
}

function isRecent(value: string, now: number): boolean {
  const time = safeTime(value);
  return time > 0 && time <= now && now - time <= ACTIVITY_RECENT_DAYS * DAY_MS;
}

function orderToActivity(
  order: CommandeSummary,
  now: number,
): OrderActivityItem {
  const createdAt = safeTime(order.createdAt);
  const activeStatus = categorizeOrderStatus(order.statut) === "en_cours";
  const active =
    activeStatus &&
    createdAt > 0 &&
    createdAt <= now &&
    now - createdAt <= ORDER_ACTIVE_HOURS * 60 * 60 * 1000;
  const phase: ActivityPhase = active
    ? "now"
    : isRecent(order.createdAt, now)
      ? "recent"
      : "history";

  return {
    amount: order.total,
    articleCount: order.items.reduce(
      (total, item) => total + item.quantite,
      0,
    ),
    id: `order-${order.id}`,
    imageUrl: orderImage(order),
    kind: "order",
    numero: order.numero,
    phase,
    progressIndex: ORDER_PROGRESS[order.statut] ?? 0,
    route: `/(tabs)/commandes/${order.id}`,
    sortAt: order.createdAt,
    status: getOrderStatusLabel(order.statut),
    statusCode: order.statut,
    title: orderTitle(order),
  };
}

function stayStatus(reservation: ResidenceReservation): string {
  if (reservation.status === "annulee") return "Séjour annulé";
  if (reservation.status === "en_attente_paiement") {
    return "Paiement attendu";
  }
  if (reservation.temporalStatus === "en_cours") return "Séjour en cours";
  if (reservation.temporalStatus === "a_venir") return "Séjour confirmé";
  return "Séjour terminé";
}

function stayToActivity(
  reservation: ResidenceReservation,
  now: number,
): StayActivityItem {
  const completed =
    reservation.status === "annulee" ||
    reservation.temporalStatus === "terminee";
  const completedAt = reservation.cancelledAt ?? reservation.checkOut;
  const phase: ActivityPhase = completed
    ? isRecent(completedAt, now)
      ? "recent"
      : "history"
    : reservation.temporalStatus === "en_cours"
      ? "now"
      : "upcoming";

  return {
    amount: reservation.totalFcfa,
    checkIn: reservation.checkIn,
    checkOut: reservation.checkOut,
    city: reservation.residenceCity,
    guests: reservation.guests,
    id: `stay-${reservation.id}`,
    imageUrl: reservation.residenceCoverUrl,
    kind: "stay",
    phase,
    route: `/reservations/${reservation.id}`,
    sortAt: completed ? completedAt : reservation.checkIn,
    status: stayStatus(reservation),
    title: reservation.residenceTitle,
  };
}

function sortDescending(a: ActivityItem, b: ActivityItem): number {
  return safeTime(b.sortAt) - safeTime(a.sortAt);
}

function sortAscending(a: ActivityItem, b: ActivityItem): number {
  return safeTime(a.sortAt) - safeTime(b.sortAt);
}

export function buildActivityFeed(
  orders: readonly CommandeSummary[],
  reservations: readonly ResidenceReservation[],
  now = new Date(),
): ActivityFeed {
  const nowTime = now.getTime();
  const items: ActivityItem[] = [
    ...orders.map((order) => orderToActivity(order, nowTime)),
    ...reservations.map((reservation) =>
      stayToActivity(reservation, nowTime),
    ),
  ];

  return {
    now: items.filter((item) => item.phase === "now").sort(sortDescending),
    upcoming: items
      .filter((item) => item.phase === "upcoming")
      .sort(sortAscending),
    recent: items
      .filter((item) => item.phase === "recent")
      .sort(sortDescending),
    history: items
      .filter((item) => item.phase === "history")
      .sort(sortDescending),
  };
}
