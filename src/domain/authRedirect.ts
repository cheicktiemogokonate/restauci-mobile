export type AuthRedirectPath =
  | "/(tabs)"
  | "/panier"
  | "/(tabs)/commandes"
  | `/(tabs)/commandes/${string}`;

/** N'autorise que les destinations internes réellement utilisées après auth. */
export function resolveAuthRedirect(value: unknown): AuthRedirectPath {
  if (value === "/panier" || value === "/(tabs)/panier") {
    return "/panier";
  }
  if (value === "/(tabs)/commandes") {
    return value;
  }
  if (typeof value === "string") {
    const match = value.match(/^\/\(tabs\)\/commandes\/([A-Za-z0-9-]+)$/);
    if (match?.[1]) {
      return `/(tabs)/commandes/${match[1]}`;
    }
  }
  return "/(tabs)";
}
