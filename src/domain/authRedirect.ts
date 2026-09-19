export type AuthRedirectPath =
  | "/(tabs)"
  | "/panier"
  | "/(tabs)/activite"
  | "/(tabs)/commandes"
  | "/(tabs)/residences"
  | `/(tabs)/commandes/${string}`
  | `/residences/${string}`;

const RESIDENCE_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function residenceRedirect(value: string): AuthRedirectPath | null {
  if (value.length > 2_300) return null;
  const match = value.match(
    /^\/residences\/([a-z0-9]+(?:-[a-z0-9]+)*)(?:\?(.+))?$/,
  );
  if (!match) return null;
  if (!match[2]) return value as `/residences/${string}`;

  const params = new URLSearchParams(match[2]);
  const allowed = new Set([
    "checkIn",
    "checkOut",
    "guests",
    "discoveryToken",
  ]);
  if ([...params.keys()].some((key) => !allowed.has(key))) return null;
  if ([...allowed].some((key) => params.getAll(key).length > 1)) return null;

  const checkIn = params.get("checkIn");
  const checkOut = params.get("checkOut");
  const guests = params.get("guests");
  const hasStay = checkIn !== null || checkOut !== null || guests !== null;
  if (
    hasStay &&
    (!checkIn ||
      !checkOut ||
      !guests ||
      !RESIDENCE_DATE_PATTERN.test(checkIn) ||
      !RESIDENCE_DATE_PATTERN.test(checkOut) ||
      checkOut <= checkIn ||
      !/^(?:[1-9]|[1-9]\d|100)$/.test(guests))
  ) {
    return null;
  }

  const discoveryToken = params.get("discoveryToken");
  if (
    discoveryToken !== null &&
    (discoveryToken.length < 20 || discoveryToken.length > 2_000)
  ) {
    return null;
  }
  return value as `/residences/${string}`;
}

/** N'autorise que les destinations internes réellement utilisées après auth. */
export function resolveAuthRedirect(value: unknown): AuthRedirectPath {
  if (value === "/panier" || value === "/(tabs)/panier") {
    return "/panier";
  }
  if (value === "/(tabs)/commandes") {
    return value;
  }
  if (value === "/(tabs)/activite") {
    return value;
  }
  if (value === "/(tabs)/residences") {
    return value;
  }
  if (typeof value === "string") {
    const match = value.match(/^\/\(tabs\)\/commandes\/([A-Za-z0-9-]+)$/);
    if (match?.[1]) {
      return `/(tabs)/commandes/${match[1]}`;
    }
    const residence = residenceRedirect(value);
    if (residence) return residence;
  }
  return "/(tabs)";
}
