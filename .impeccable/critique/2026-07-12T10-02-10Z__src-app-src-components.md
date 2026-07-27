---
target: src/app + src/components (scope complet)
total_score: 21
p0_count: 2
p1_count: 3
timestamp: 2026-07-12T10-02-10Z
slug: src-app-src-components
---
## Anti-Patterns Verdict

**LLM assessment:** The interface reads as **"AI made some of this"** — not catastrophically, but enough to fail the slop test for a brand whose bar is "earned familiarity." Three distinct tells:

1.  **Ghost-card pattern on onboarding badges** (`src/app/index.tsx:46,60,78`): The floating "3 min / Ouvert / 4.7" chips ship `border border-gray-100` + `shadow-sm` *plus* a hand-rolled `StyleSheet.shadow` — the canonical Codex ghost-card defect, and one DESIGN.md section 6 explicitly calls out as registered. Two of the three tell layers (border + shadow) on the same element.
2.  **Generic global-template onboarding**: A full-bleed food photo with floating performance-stat badges reads as imported Uber Eats / Deliveroo landing page — the exact anti-reference in PRODUCT.md. The onboarding is decorative, not local.
3.  **Hardcoded fake metrics**: "3 min à pied", "4.7 (320 avis)" are static strings, not bound to geolocated data. For a brand whose promise is **sûr**, fabricating numbers on the first screen is a self-inflicted trust wound.

What's clean: the map-first discovery avoids the carousel-of-cards template; French copy is genuinely maintained (not retro-translated); the command tracking timeline is bespoke, not boilerplate.

**Deterministic scan:** `detect.mjs` returned 6 advisory findings (3 off-palette colors, 3 off-ramp font sizes). The detector missed the strongest signals — the manual grep surfaced **5 ghost-card sites** (border + shadow on the same element), **14 hardcoded hex literals** (`#1B4D1E` / `#DC2626` / `#ff4b4b`) concentrated in `commandes/*`, **2 invalid React Native color strings** (`shadowColor: "ink-900"`, `borderColor: "green-900"` in the tab bar — token names passed where hex is required, rendering as no-ops), **3 glassmorphism sites** (`backdrop-blur-sm` in `HeaderRestaurant.tsx` — explicitly banned for low-end Android), and **4 sub-44pt touch targets**. The detector and the review agree where they overlap; the detector caught the type-ramp drift (11px/17px sizes), the review caught the structural and brand-name issues.

**Visual overlays:** No user-visible overlay is available — this is a React Native codebase with no web viewable target. Evidence was gathered via the CLI detector + manual ripgrep scan of source.

## Overall Impression

Toutci has the bones of a strong local product — map-first discovery, haptic-driven cart interactions, and a genuinely thoughtful command-tracking timeline. But it currently suffers from **brand schizophrenia** ("RestauCi" vs "Toutci" across half the screens) and **token drift** that makes the same screen render two different greens on the same CTA family. The single biggest opportunity: a one-pass token + brand-name realignment would lift the perceived trust of the entire app more than any single feature could.

## What's Working

1.  **Command tracking timeline** (`src/app/(tabs)/commandes/[id].tsx`): Converts delivery anxiety into scannable confidence with a horizontal step-through. Genuinely local-intelligent — this is the feature that distinguishes Toutci from a generic template, and it's well-built.
2.  **Haptic feedback as trust signal**: `CartePlatMobile.tsx`, `Panier.tsx`, and `FormulaireCommande.tsx` all use `Haptics.impactAsync(Light)` on quantity changes. The tactile layer invests the app with the **sûr** quality the brand promises — this is design as trust, not decoration.
3.  **Map-first discovery** (`CarteView.tsx`): Choosing MapLibre + custom markers over a list-of-cards clone avoids the Uber Eats anti-reference and is the correct positioning for a city-scale local marketplace.

## Priority Issues

**[P0] Token Drift and Brand Color Inconsistency**
- **What:** Almost every component uses a different green. `SearchBar.tsx:122` uses `bg-green-500` (#22C55E jade); `PanierFAB.tsx:30` uses `bg-green-700`; `CommandeCard.tsx` uses raw `#1B4D1E`; `badge.tsx` default resolves via `--primary` to `#21C45D`; `CartePlatMobile.tsx:100` uses `bg-green-500` for stepper buttons (should be Banko Green #457B3B). 14 hardcoded hex literals bypass the token system across `commandes/*` alone.
- **Why it matters:** "Fier, généreux, sûr" is carried by visual consistency. Two different greens on the same screen read as the app being cheap or unstable — the exact anti-reference the design system is built to avoid.
- **Fix:** Realign `global.css` `--primary` to `143 64 24` -> `#166534`. Audit every `.tsx` for `green-500`, `green-700`, `#1B4D1E`, `#21C45D`, `#ff4b4b`, `#DC2626` and replace with the documented Banko tone for that role (or `text-danger-*` / `text-brand-*` tokens).

**[P0] Invalid React Native Color Strings in Tab Bar**
- **What:** `src/app/(tabs)/_layout.tsx:27` sets `shadowColor: "ink-900"` and line 135 uses `borderColor: "green-900"` — React Native `ViewStyle` requires a real hex/color, not a Tailwind token name. These render as no-ops (invisible/unpredictable shadow and border).
- **Why it matters:** The tab bar is the most-touched chrome in the app; on low-end Android invalid styles can cause subtle rendering bugs. It must be rock-solid per PRODUCT.md's performance-is-trust principle.
- **Fix:** Replace `"ink-900"` with `"#111827"`. Replace `"green-900"` with `"#14532d"`.

**[P1] Restaurant Detail Screen Structurally Broken + Cognitively Overloaded**
- **What:** `restaurant/[slug]/index.tsx:132` sets `contentContainerStyle={{ flex: 1 }}` on the ScrollView, collapsing scrollable height to the viewport and clipping `HeaderRestaurant` content taller than the screen on smaller phones. Inside `HeaderRestaurant.tsx`, 7+ info blocks (banner, back/heart/share, logo, name, cuisines, status, modes, stats, about, contact, popular plats) compete for attention before the menu CTA. Lines 95/105/116 also use `bg-white/80 backdrop-blur-sm` (glassmorphism) — explicitly banned for low-end Android in DESIGN.md.
- **Why it matters:** The primary task on this screen is *see the menu*. The current layout buries it, and the `flex: 1` bug makes content literally unreachable on smaller phones. Glassmorphism stutters on entry-level Android and reads as "unstable."
- **Fix:** Remove `flex: 1` from `ScrollView.contentContainerStyle`. Replace `bg-white/80 backdrop-blur-sm` with solid `bg-white`. Demote non-menu sections into collapsible accordions or a tertiary overflow menu. Elevate "Voir le menu" to the primary CTA with maximum visual weight; shrink favorite/itinerary to ghost icons.

**[P1] RestauCi / Toutci Brand Schizophrenia**
- **What:** The onboarding headline, login/register copy, command detail header, and profile welcome (`"Bienvenue chez RestauCi"`) all say "RestauCi." PRODUCT.md names the product "Toutci" with positioning "Toutci — une app pour tout."
- **Why it matters:** Directly violates "Fier." An app that doesn't know its own name reads as imported, under-tested, or unstable — undermining the entire brand promise.
- **Fix:** Global find-and-replace "RestauCi" -> "Toutci" in all UI-facing strings and logo asset names.

**[P1] Onboarding Hardcodes Fake Performance Data**
- **What:** `src/app/index.tsx:51-88` presents "3 min à pied", "Ouvert maintenant", "4.7 (320 avis)" as static badges over a food photo. Not dynamic.
- **Why it matters:** For a user in a Bouaké suburb where the nearest restaurant is 15 min away, these numbers read as deception. Fake data is worse than no data; it directly contradicts the "sûr" promise and the "unreliable feel" anti-reference.
- **Fix:** Either wire the badges to real geolocated restaurant data, or replace them with static *brand* copy ("Livraison locale", "Cuisine ivoirienne") that does not pretend to be metrics.

**[P2] Touch Targets Below Accessible Minimum**
- **What:** `CartePlatMobile.tsx:100,112`: `w-6 h-6` (24px) quantity buttons. `Panier.tsx:55,68`: `h-7 w-7` (28px) decrement/increment. Both below the 44pt WCAG minimum committed in PRODUCT.md. DESIGN.md spec says steppers are 36px; the rendered code doesn't even hit 36px.
- **Why it matters:** PRODUCT.md targets entry-level Android users. Small tap targets cause mis-taps, accidental zero-quantity removals, and frustration — especially for older users or those with motor impairments.
- **Fix:** Increase all stepper buttons to `w-9 h-9` (36px) minimum, preferably `w-11 h-11` (44px). Increase touchable padding around +/- to fill the circle.

**[P2] Auth Wall Friction + Dead Promo Button**
- **What:** Tapping "Profil" when logged out throws a full-screen auth wall with no "continuer sans compte" option. In `Panier.tsx`, the "Vous avez un code promo ?" row uses `onPress={() => {}}` — a dead button.
- **Why it matters:** Both surface to a first-timer as "the app is broken." A dead button on the cart screen is especially damaging during the high-stakes checkout moment.
- **Fix:** Add a "Continuer sans compte" escape on the auth wall (or a preview of what Profil offers). Wire the promo code button to a real input sheet or remove it entirely until it ships.

## Persona Red Flags

**Aïcha — Jeune Ivoirienne, 22 ans, Android entrée de gamme (TECNO POP), forfait data 500 Mo/semaine**
- The map renders vector tiles that will stutter and burn data on a TECNO POP — she'll read the jank as the app being broken.
- `commandes/index.tsx:69-73` and `commandes/[id].tsx:54-58` render centered `ActivityIndicator` on white as *primary* content — DESIGN.md says this signals "the app might be stuck." On slow networks she'll stare for 3-5s and assume a crash.
- `SkeletonCard.tsx` shimmer has no `prefers-reduced-motion` check — on low-end hardware the shimmer itself may drop frames.
- Fallback Unsplash URLs are high-resolution remote fetches that will blow her data cap.

**Kouamé — Père de famille, 38 ans, commande groupée 4-6 plats, très attentif au prix**
- 24px stepper buttons make adding 4 portions of attiéké tedious; his thumbs miss repeatedly.
- The promo code row is a dead button (`onPress={() => {}}`) — he taps it, nothing happens, feels the app is stingy or broken.
- `FormulaireCommande.tsx` shows no order total *inside* the checkout bottom sheet. For an 8000 FCFA family order, re-confirming the price at the commit moment is missing — a critical trust gap.
- The "Supprimer" button sits right next to the quantity controls: a mis-tap deletes a line item with no confirmation and no undo.

**Fatou — Cadre, 31 ans, déjeuner rapide en 20 minutes, zéro tolérance pour la friction**
- To see the menu on a restaurant screen she must scroll past 7 info blocks (or can't, due to `flex: 1`). Not a 20-second task.
- "Commander à nouveau" on a past order routes to `/` (the map), not to the restaurant's menu — she has to search for the restaurant again.
- Tapping "Profil" unauthenticated throws a full-screen wall with no preview. She bounces.
- `SearchBar.tsx` category pills aren't pre-filtered by availability; tapping "Asiatique" in a neighborhood with zero Asian restaurants yields an empty map with no explanation — a dead end.

## Minor Observations

- `CommandeCard.tsx` uses `text-brand-800` / `bg-brand-50` — these Tailwind classes aren't defined in `tailwind.config.js`. Status bandeaus may render unstyled on some builds.
- `FormulaireCommande.tsx:308` uses dynamic template strings `` `border-[${MODE_COLORS[mode]}]` `` — NativeWind resolves at build time; dynamic strings won't work unless safelisted. The mode selector likely renders with no border color.
- `SearchBar.tsx:84` renders `<MapPin />` (a component) inside `<Text>` — on native this throws because `Text` children must be strings/numbers.
- `Panier.tsx:271`: A 🎉 emoji inside a green promotional banner. DESIGN.md's "Motif-Only Rule" reserves ochre for state, never decoration. The emoji adds decoration without state meaning.
- `CommandeListEmpty.tsx:25`: uses `underline` — not part of the design system's link vocabulary.
- `historique.tsx` and `adresses.tsx` are placeholder screens with `bg-green-900` on a card with `text-ink-50` — borderline contrast risk, and the screens do nothing when tapped.
- Two hand-rolled shadow recipes (`_layout.tsx:27-31`, `index.tsx:126-130`) reimplement the same platform-shadow config inline — should be a single shared elevation token.
- Detector advisories: `#8fa794` (`_layout.tsx:104`), `#D1D5DB`/`#d1d5db` (`MenuBottomSheet.tsx:126`, `FormulaireCommande.tsx:289`), and three off-ramp font sizes (11px in `commandes/[id].tsx:197` and `panier.tsx:116`; 17px in `(tabs)/index.tsx:114`).
- `text.tsx:29` `border-l-2` is a web-only blockquote style in a re-exported shadcn primitive — false positive, not rendered in the RN tree.

## Questions to Consider

1. **If the map is the primary discovery surface, why does onboarding show a static background image instead of the actual map around the user's location?** Dropping the user directly into their own neighborhood map would be more honest, more local, and more performant than a full-bleed photo with fake badges.
2. **Why is "Voir le menu" a bottom sheet instead of the main scrollable content?** The current pattern forces a modal context for the core task. Would an inline, filterable list (like the command history list) reduce the cognitive load of two competing scroll surfaces?
3. **Is "RestauCi" a deliberate A/B test, or is the team simply not aligned on the product name?** If it's accidental, what other surface-level inconsistencies are hidden in strings that weren't caught because the design review focused on components instead of copy audits?
