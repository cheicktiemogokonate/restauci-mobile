export interface ResidenceStaySelection {
  checkIn: string;
  checkOut: string;
  guests: number;
}

export interface ResidenceSearchCriteria extends ResidenceStaySelection {
  destination: string;
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoResidenceDate(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
  );
}

export function addResidenceDays(value: string, days: number): string {
  const date = new Date(`${value}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function getDefaultResidenceStay(now = new Date()): ResidenceStaySelection {
  const today = now.toISOString().slice(0, 10);
  const checkIn = addResidenceDays(today, 1);
  return { checkIn, checkOut: addResidenceDays(checkIn, 1), guests: 1 };
}

export function formatResidenceDate(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00.000Z`));
}

export function buildResidenceSearchRequest(
  criteria: ResidenceSearchCriteria,
  page: number,
  limit: number,
) {
  const destination = criteria.destination.trim().slice(0, 100);
  return {
    ...(destination ? { destination } : {}),
    checkIn: criteria.checkIn,
    checkOut: criteria.checkOut,
    guests: Math.min(100, Math.max(1, Math.trunc(criteria.guests))),
    page: Math.max(1, Math.trunc(page)),
    limit: Math.min(48, Math.max(1, Math.trunc(limit))),
  };
}
