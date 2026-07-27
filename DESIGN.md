---
name: Toutci
description: Local marketplace for Ivorian cities — food first, Bouaké first, many verticals and cities to come.
colors:
  Banko-Green: "#457B3B"
  Banko-Green-Deep: "#386B2A"
  Banko-Green-Darkest: "#166534"
  Banko-Green-Soft: "#F0FDF4"
  Banko-Ochre: "#E68412"
  Lagune-Blue: "#2F66E8"
  Piment-Red: "#E51818"
  Piment-Red-Deep: "#DC2626"
  Cayenne-Warn: "#F59E0B"
  Cayenne-Warn-Deep: "#CA8A04"
  Ink-900: "#111827"
  Ink-700: "#374151"
  Ink-500: "#6B7280"
  Ink-400: "#9CA3AF"
  Ink-200: "#E5E7EB"
  Ink-100: "#F3F4F6"
  Ink-50: "#F9FAFB"
  Paper: "#FFFFFF"
  Destructive-Soft-Bg: "#FEF2F2"
  Success-Soft-Bg: "#F0FDF4"
  Warning-Soft-Bg: "#FEF3C7"
  Drift-Token-Primary-Jade: "#21C45D"
typography:
  display:
    fontFamily: "System, -apple-system, SF Pro Display, Roboto"
    fontSize: "40px"
    fontWeight: 800
    lineHeight: 48
    letterSpacing: "normal"
  h2:
    fontFamily: "System, -apple-system, SF Pro Display, Roboto"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: 36
    letterSpacing: "-0.01em"
  h3:
    fontFamily: "System, -apple-system, SF Pro Display, Roboto"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 32
    letterSpacing: "-0.01em"
  title:
    fontFamily: "System, -apple-system, SF Pro Display, Roboto"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 28
    letterSpacing: "normal"
  body:
    fontFamily: "System, -apple-system, SF Pro Text, Roboto"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 24
    letterSpacing: "normal"
  body-small:
    fontFamily: "System, -apple-system, SF Pro Text, Roboto"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 18
    letterSpacing: "normal"
  label:
    fontFamily: "System, -apple-system, SF Pro Text, Roboto"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 16
    letterSpacing: "0"
  price:
    fontFamily: "System, -apple-system, SF Pro Display, Roboto"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 20
    letterSpacing: "normal"
rounded:
  pill: "9999px"
  card: "16px"
  input: "6px"
  chip: "12px"
  badge: "9999px"
  cta: "30px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
  card-pad: "16px"
  card-pad-l: "24px"
components:
  button-primary:
    backgroundColor: "{colors.Banko-Green-Darkest}"
    textColor: "{colors.Paper}"
    rounded: "{rounded.cta}"
    height: "56px"
    padding: "16px 24px"
  button-primary-active:
    backgroundColor: "{colors.Banko-Green-Darkest}"
    textColor: "{colors.Paper}"
  button-outline:
    backgroundColor: "{colors.Paper}"
    textColor: "{colors.Banko-Green-Darkest}"
    rounded: "{rounded.cta}"
    padding: "16px 24px"
  button-secondary:
    backgroundColor: "{colors.Ink-100}"
    textColor: "{colors.Ink-500}"
    rounded: "{rounded.cta}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.Banko-Green}"
  filter-pill:
    backgroundColor: "{colors.Banko-Green-Darkest}"
    textColor: "{colors.Paper}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
    height: "36px"
  filter-pill-inactive:
    backgroundColor: "{colors.Ink-100}"
    textColor: "{colors.Ink-500}"
    rounded: "{rounded.pill}"
  quantity-button:
    backgroundColor: "{colors.Banko-Green}"
    textColor: "{colors.Paper}"
    rounded: "{rounded.pill}"
    size: "36px"
  input-field:
    backgroundColor: "{colors.Paper}"
    textColor: "{colors.Ink-900}"
    rounded: "{rounded.input}"
    height: "40px"
    padding: "12px"
  input-field-focus:
    backgroundColor: "{colors.Paper}"
    textColor: "{colors.Ink-900}"
    rounded: "{rounded.input}"
  card:
    backgroundColor: "{colors.Paper}"
    textColor: "{colors.Ink-900}"
    rounded: "{rounded.card}"
    padding: "{spacing.card-pad}"
  chip-indisponible:
    backgroundColor: "{colors.Destructive-Soft-Bg}"
    textColor: "{colors.Piment-Red}"
    rounded: "{rounded.chip}"
  badge-status:
    backgroundColor: "{colors.Success-Soft-Bg}"
    textColor: "{colors.Banko-Green-Darkest}"
    rounded: "{rounded.badge}"
  badge-status-warning:
    backgroundColor: "{colors.Warning-Soft-Bg}"
    textColor: "{colors.Cayenne-Warn}"
    rounded: "{rounded.badge}"
  badge-status-danger:
    backgroundColor: "{colors.Destructive-Soft-Bg}"
    textColor: "{colors.Piment-Red}"
    rounded: "{rounded.badge}"
  floating-action:
    backgroundColor: "{colors.Paper}"
    textColor: "{colors.Ink-900}"
    rounded: "{rounded.pill}"
    size: "48px"
  tab-bar-active:
    backgroundColor: "{colors.Banko-Green-Deep}"
    textColor: "{colors.Paper}"
    rounded: "30px"
  tab-bar-inactive:
    backgroundColor: "transparent"
    textColor: "{colors.Banko-Green}"
---

# Design System: Toutci

## 1. Overview

**Creative North Star: "The Banko Cloth"**

Toutci's visual system is a Banko cloth: a deep moss-green weft shot through with warm ochre motifs, held together by trust-weave and generous negative space. The green is not a brand accent — it IS the surface, the same way weft is the cloth. Ochre is the cardinal motif: rare, deliberate, never decorative for its own sake. Ink carries the ledger — pricing, status, the facts a user needs to decide. Paper is the ground beneath all of it: honest white, not the cream warmth the category expects, because cream reads as imported template and this app belongs to Bouaké, not to a global delivery clone.

The system is **sûr before fier**. Soft shadows on cards would be parading — they earn their place only on floating chrome that has to escape the surface (the bottom tab bar, the cart FAB, the locate-me button), and only as lift, never as glow. Reinvented affordances, hand-drawn illustrations, glassmorphism decks, and the cream-paper body backgrounds that mark the saturated AI default are all refused on principle. The product register is the right register: the interface disappears into the task of finding, ordering, and tracking a meal.

**Platform reality.** Built in Expo (React Native 0.86) with NativeWind (Tailwind 3) and shadcn/RN primitives. Primary surfaces: entry-level Android phones on mobile data, so density is generous but payload is not — `expo-image` with blur-hash placeholders, `SkeletonCard` shimmer on list loads (never a centered spinner in content), and `prefers-reduced-motion` honored by every Reanimated transition. Light theme is live; a dark theme is declared in `src/global.css` (`.dark`) and documented in section 6 as a planned extension. Ship against the light tokens today.

**Anti-references, quoted from PRODUCT.md.** The visual system explicitly refuses: (1) _"Generic Uber Eats / Deliveroo — no local soul"_ — global food-delivery templates. (2) _"Saturated / cluttered apps — too many banners, promo carousels, dark patterns."_ (3) _"Fake premium / elitist."_ (4) _"Unstable / unreliable feel."_ Every Don't in section 6 is a direct enforcement of one of these.

**Key Characteristics:**

- One-family sans typography (system stack), weight-graded for hierarchy, never display fonts in UI labels.
- Restrained palette: moss-green primary carries ≤30% of any screen, ochre reserved for state emphasis and rare CTAs, ink for facts, paper for ground.
- Flat-by-default cards with 1px ink-200 stroke; shadows only on floating chrome.
- Pill geometry (`rounded-full`, `rounded-[30px]`) on every interactive affordance — buttons, filter pills, status badges, quantity steppers. Cards stay at 16px. Inputs at 6px. Three radii only.
- Status semantics are fixed: green = livrée, ochre = en cours, piment red = annulée/danger, cayenne amber = warning. Never invent a fifth status color.
- French-language UI copy throughout — labels, status, and empty-states are en français. The system preserves that voice; do not silently translate to English.
- Mobile-first layout. The viewport is the design. Long Ivorian restaurant names must not overflow card or button widths at any breakpoint.

## 2. Colors

A deep moss-green Banko weft with warm ochre motifs, ink ledger, and honest paper ground. The green family has three tones; each owns a distinct role. The bright jade CSS-variable primary (#21C45D) is registered drift — see the Token-Drift section at the end.

### Primary — the Banko Green family

- **Banko Green** (#457B3B, HSL 111° 35% 36%): The in-content accent — onboarding's "près d'ici" text, tab-bar inactive icon color, onboarding badge icons, outline-button text. The green you READ, never the green you press as a CTA fill.
- **Banko Green Deep** (#386B2A, HSL 107° 44% 29%): The active tab-bar pill fill. One step darker than Banko Green so the active tab reads as a deliberate pressed state against white, without the heaviness of the CTA tone.
- **Banko Green Darkest** (#166534, Tailwind `green-800`, HSL 143° 64% 24%): The CTA surface — "Commencer," the selected filter pill, every primary button fill. The deepest of the three, used where Banko Green is the brand's voice of confirmation: press this to advance the order.
- **Banko Green Soft** (#F0FDF4, Tailwind `green-50`): The success-tint background — livrée badges, the quantity-counter well, "Commander à nouveau" highlights. Moss-tinted, not Tailwind-default-jade; chroma stays <0.05.

### Secondary — Lagune Blue (info only)

- **Lagune Blue** (#2F66E8): Reserved for informational badges and the rare non-green semantic callout. Not a primary action color. Used sparingly — most "info" states in this app are handled in ink, not in hue.

### Accent

- **Banko Ochre** (#E68412): The cardinal motif. Reserved for state emphasis: the "en cours" commande banner, the warning toast, the rare prominence accent. It is NOT a button fill and NOT a hero gradient — it appears as a tinted background (`bg-warning/10`) with the ochre text on top, on the status bandeau below a CommandeCard. One ochre surface per screen maximum.
- **Cayenne Warn** (#F59E0B) / **Cayenne Warn Deep** (#CA8A04): The amber-tint variants used by `CommandeCard` for the "en cours" text and icon. Pairs with `Warning-Soft-Bg` for the bandeau fill.

### Destructive

- **Piment Red** (#E51818): Order annulée, hard errors, the destructive pill. Paired with a `Destructive-Soft-Bg` (#FEF2F2) tint — piment text on cream-pink fill, never piment as a solid button fill (use the destructive badge or pill instead, with white text).
- **Piment Red Deep** (#DC2626): The legacy deep variant still seen in `CommandeCard`'s `iconColor` for the annulée flow. Maps to the same semantic role as Piment Red; prefer Piment Red for new screens and replace Piment Red Deep at next touch.

### Neutral

- **Ink-900** (#111827): The ledger. The CSS-variable `--foreground` value. Body text, prices, restaurant names, totals. Contrast ≥7:1 against paper — the system earns its "sûr" reading here.
- **Ink-700** (#374151): Secondary body text where ink-900 would shout.
- **Ink-500** (#6B7280): Captions, timestamps, "à pied", "(320 avis)". Sits at 4.6:1 against paper — the floor of acceptable legibility, do not go lighter.
- **Ink-400** (#9CA3AF): Reserved for the lowest-priority metadata (the timestamp divider dot in `CommandeCard`). Below 4.5:1 against paper for body — use ONLY as a non-text accent or as the icon color for a small metadata icon (Calendar at 13px). NEVER as text color for readable content.
- **Ink-200** (#E5E7EB): The card stroke and divider. NEVER a background fill on content (an ink-200 fill reads as a loading skeleton, see SkeletonCard).
- **Ink-100** (#F3F4F6): Secondary surface — inactive filter pills, secondary buttons, the cart counter's neutral well, the secondary tab-bar background.
- **Ink-50** (#F9FAFB): The floating chrome ground (the tab-bar background sits on ink-50, never on streaky white). Lighter than paper, used only to make floating elements feel one step back from the content.
- **Paper** (#FFFFFF): The body ground. Pure white. NOT cream, NOT sand, NOT a warm-tinted near-white.

### Status-tint backgrounds (paired semantic fills)

- **Success-Soft-Bg** (#F0FDF4 / `green-50`): Livrée badges, the quantity-counter well, "Commander à nouveau" highlights. Moss-tinted, chroma <0.05.
- **Destructive-Soft-Bg** (#FEF2F2 / `danger-50`): Indisponible chips, annulée bandeaux.
- **Warning-Soft-Bg** (~#FEF3C7, derived from `bg-warning/10`): En-cours bandeaux, the rare warning state.

### Named rules

**The Three-Tones Rule.** Banko Green has exactly three tones — Banko Green (#457B3B, the accent you read), Banko Green Deep (#386B2A, the active tab fill), Banko Green Darkest (#166534, the CTA fill). Each owns one role. Do not mix: a CTA in Banko Green (too light) reads as a hover state, not an action; an active tab in Darkest reads as pressed-forever. Pick the tone by role, not by mood.

**The Banko Reserve Rule.** Across all three tones Banko Green carries only primary actions and confirmed-state surfaces: the main CTA, the quantity steppers, the selected filter pill, the live tab. If a green fill is not one of those four, it is wrong. ≤30% of any screen. Its rarity is the trust signal — a screen drowning in green reads as a delivery-app template, and that is exactly the anti-reference.

**The Motif-Only Rule.** Banko Ochre never decorates. It appears only on state: an "en cours" banner, a warning toast, a rare emphasis callout. If you are reaching for ochre to "add warmth" or "break up the green," you are coloring decoration. Rework the layout instead.

**The Neutral-Tint Rule.** Tinted backgrounds walk only toward the green family (success-soft-bg) or the ink family (ink-50/100). Do not tint neutrals toward warm or cool "because the brand feels that way" — the warmth is in the ochre accent, not in the background.

**The Hex-Anchor Rule.** The deep moss family (`#166534` / `#386B2A` / `#457B3B`) is the canonical Banko Green token set. `#21C45D` (the bright jade CSS-variable `--primary`) is registered drift — see the Token-Drift section at the end of this document. Any other raw green hex in the codebase (`#1B4D1E` from CommandeCard, `#4ade80` from Tailwind's green-400, etc.) is drift; replace it with the corresponding Banko tone at next touch.

## 3. Typography

**Display Font:** System sans — `-apple-system, SF Pro Display` on iOS, `Roboto` on Android, Tailwind's `font-sans` stack via NativeWind on web.
**Body Font:** Same system sans at body weight (`SF Pro Text` / `Roboto` regular).
**Label/Mono Font:** No mono. Numerals use the system sans at tabular figures where supported (`font-variant-numeric: tabular-nums`) for price alignment.

**Character:** A single well-tuned sans, weight-graded. No display pairing, no editorial serif, no headline font for the sake of one. Product UI: the type disappears into the task. Hierarchy is weight + size, not family.

### Hierarchy

- **Display** (800, 40px / 48 line-height): Onboarding hero only — "Vos meilleurs restaurants, tout près d'ici." One display per screen maximum; not a heading style for interior pages.
- **H2** (600, 30px / 36, letter-spacing -0.01em): Restaurant page headers. `text-3xl` via the `Text h2` variant, with a 1px border-b below — the underline hairline is part of the spec.
- **H3** (600, 24px / 32, -0.01em): Section headers inside a restaurant or a profile sub-page.
- **Title** (600, 20px / 28): Card titles, restaurant names in lists, profile section titles. The de-facto "heading" of an entry card.
- **Body** (400, 16px / 24): In-card description text, onboarding subtitle, restaurant description. Cap prose line length at ~65 characters per line in long-form (the home screen respects this with `pr-10` on the subtitle).
- **Body-Small** (400, 13px / 18): Tight in-card metadata — "à pied", "maintenant", timestamps. Below 13px the type drops below the ≥4.5:1 floor against paper at ink-500; do not go smaller for any readable content.
- **Label** (500, 12px / 16): Status badges, quantity counter text, tab-bar label. Always uppercase-by-pills-not-by-tracking — lowercase unless the status flow genuinely calls for caps.
- **Price** (700, 15px / 20): The single most-touched type token — every plat card displays it in Banko-Green-500 to mark the action affordance. Bold, tight, never italicized.

### Named rules

**The One-Family Rule.** Do not pair fonts for personality. The system stack IS the brand voice; pairing it with a serif or geometric display imports a global-template feel. Weight provides the hierarchy.

**The No-Clamp Rule.** Product UI: clamp-sized fluid typography is forbidden. The 40px display is a literal px; the hierarchy is fixed-rem. A shrunken headline in a sidebar (there are none in this app, but if added) would break trust more than missing the brand ever could.

**The Banko-Green-Price Rule.** Prices appear in `text-green-500` (Tailwind's mid green, the in-content mid-tone of the Banko family) bold. It is the only place green ink sits on paper without a fill — the price is the action affordance, and color signals it before the user reads the number. Do not use green ink for non-price facts (timestamps, distances, statuses, names). **Note**: `Tailwind green-500` (#22C55E) is the brighter mid green used in `text-green-500`; it is the single sanctioned bright-green appearance in the app, confined to the price. The canonical Banko Green Darkest family remains the CTA / pill fill set.

## 4. Elevation

Flat-by-default, lift on demand. Surfaces are flat at rest with a 1px ink-200 stroke; depth is conveyed by tone (paper vs ink-50 vs ink-100) and by the 1px line. The floating-tab-bar pattern earns its shadow because it has to float over the content, not because shadows look good.

### Shadow vocabulary

- **Floating chrome lift** (`shadow-md` / `shadowColor: #111827, shadowOffset: {0, 4}, shadowOpacity: 0.1-0.2, shadowRadius: 10, elevation: 5-8`): The bottom tab bar, the floating locate-me FAB, onboarding's floating "3 min" / "Ouvert" / "4.7" badges. Diffuse, low-opacity, 4px y-offset, 10px blur. Never wider blur, never darker opacity, never a colored shadow.
- **Card rest stroke:** No shadow. The 1px `border border-ink-200` IS the elevation. Adding `shadow-sm` to a rest-state Card is the canonical Codex ghost-card defect — refuse it.
- **Skeleton shimmer** (`shadow: none`; shimmer via `AnimatedLinearGradient` translateX over ink-100/200 placeholders): Load state elevation is the shimmer itself, not depth.

### Named rules

**The Flat-Rest Rule.** Cards, list rows, badge tints, status bandeaux: no drop shadow at rest. The 1px ink-200 stroke is the elevation signal. If the surface reads as "floating," it belongs to the floating-chrome lift vocabulary above — that's a different category, used only when the surface genuinely escapes content (tab bar, FAB, bottom-sheet handle, onboarding callout badges).

**The Lift-Only Shadow Rule.** Shadows are lift, never glow. They use `shadowColor: ink-900`, y-offset 4, blur 10, opacity ≤0.2. A colored shadow (green or ochre glow under a CTA) is forbidden — colored shadows are the AI-template tell, and they read as "the button might be unstable," which is exactly the anti-reference.

**The Reduced-Motion Rule.** Every Reanimated transition (LinearTransition on the tab bar, the SkeletonCard shimmer, the menu bottom-sheet) must respect `prefers-reduced-motion: reduce`. The shimmer degrades to a static ink-200 fill; the LinearTransition degrades to a snap. No animation is the only animation if reduced motion is on.

## 5. Components

Shape-first vocabulary. Three radii in the whole system — pill (`rounded-full` / `rounded-[30px]`), card (`rounded-2xl`, 16px), input (`rounded-md`, 6px). A new radius is a system bug.

### Buttons

- **Shape:** Pill, `rounded-[30px]`. Every variant. The body's `rounded-md` CVA default is overridden at the component level — see `button.tsx:104`.
- **Primary:** Banko Green Darkest (#166534) fill, white text, 56px height, 16px-24px padding, `active:opacity-80` for press feedback (no scale). CTAs: "Commencer," "Ajouter au panier," "Réessayer." The default CVA `bg-green-800` resolves here in Tailwind.
- **Outline:** Paper fill, Banko Green Darkest border + text. Reserve for the secondary action in a two-CTA pair.
- **Secondary:** Ink-100 fill, Ink-500 text. Inactive filter pills.
- **Ghost:** Transparent fill, Banko Green text ("Passer" on onboarding, in-list secondary actions). Banko Green (not Darkest) so the ghost reads as invitation rather than already-pressed.
- **Hover/focus (web only):** `focus-visible:border-ring focus-visible:ring-ring/50` — 3px ring in Banko Green at 50% opacity. Never on native — native has no hover, and shipping a hover-style scale on press is rejected (no `active:scale-95`; only `active:opacity-80`).
- **Disabled:** `opacity-50` from `button.tsx:101`. No color shift; opacity is the signal.

### Filter pills

- **Shape:** Pill (`rounded-full`), 36px height, 8px-16px padding.
- **Default (selected):** Banko Green Darkest (#166534) fill, white text — "Tout" / the active category.
- **Inactive:** Ink-100 fill, Ink-500 text. Becomes Banko Green Darkest on press.
- **Scroll behavior:** Horizontal `ScrollView` with `contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}`. No visible scroll indicator. The "Tout" option is always present and always first.

### Cards

- **Corner:** `rounded-2xl` (16px).
- **Background:** Paper (#FFFFFF). On dark theme (planned), `bg-card`. Never `bg-white/50` in light — translucent cards are forbidden; translucency reads as "unstable," an explicit anti-reference.
- **Stroke:** `border border-ink-200` (1px). The stroke is the elevation; see Elevation.
- **Internal padding:** 16px (`p-4`) for in-list plat cards; 24px (`px-6`) for the larger Card primitive's header/footer (shadcn default).
- **Status bandeau:** A full-width tinted strip (`rounded-2xl` at the bottom of the card, NOT `rounded-none`) carrying one status icon + message text + a bordered "action" pill on the right. The bandeau's fill is the status-tint (`success-soft-bg` / `warning-soft-bg` / `destructive-soft-bg`), text is the matching deep tone. NEVER a `border-l-4` stripe — that's the side-stripe ban, enforced.

### Inputs / fields

- **Style:** Paper background, 1px `border-input` stroke, `rounded-md` (6px), 40px height, 12px horizontal padding, ink-900 text.
- **Focus:** On web, a 3px ring in `--ring` (Banko Green). On native, focus state is conveyed by a Banko Green border shift (not a ring — native has no CSS ring).
- **Error:** `aria-invalid:border-destructive` plus a destructive-tinted ring at 20% opacity on web. On native, the input border becomes Piment Red `border-danger` and the helper text below turns `text-danger`.
- **Disabled:** `opacity-50`, no other change.

### Status badges

- **Shape:** Pill (`rounded-full`), 12px vertical padding, 12px horizontal padding.
- **States — three only:**
  - **Livrée (success):** `bg-success-soft-bg` + Banko Green Darkest text + a `CheckCircle2` icon at 12px in Banko Green Darkest.
  - **En cours (warning):** `bg-warning-soft-bg` + Cayenne Warn text + a `Clock` or `Bike` icon in Cayenne Warn Deep.
  - **Annulée (danger):** `bg-destructive-soft-bg` + Piment Red text + an `XCircle` icon in Piment Red Deep.
- A fourth status color (info blue, info purple) is forbidden for order status. Lagune Blue is reserved for genuinely informational, non-order flows.

### Quantity stepper

- **Shape:** Two circular `rounded-full` 36px buttons in Banko Green (#457B3B) with white "−" and "+", inside a green-50 well. NOT Darkest — the stepper uses the mid-tone so it reads as a sub-action, not the primary CTA.
- **Counter text:** Tailwind `text-green-700` (#15803D) bold, 14px, fixed 20px width, centered (`text-center`). The single sanctioned use of Tailwind's green-700; a mid-tone deeper than the stepper button, lighter than Darkest.
- **Zero state:** A single 36px circular `+` button in Banko Green replaces the stepper. Do not show a 0 counter.
- **Haptic feedback:** `Haptics.impactAsync(ImpactFeedbackStyle.Light)` on every add/remove. Required — the haptic is part of the sûr (trustworthy) signal.

### Floating chrome

- **Tab bar:** Ink-50 (#F9FAFB) fill, `rounded-[40px]` (a deliberate 40px super-pill — the only radius outside the three-radius system, justified because the bar reads as a single physical object floating over content), 6px internal padding, 4-10 0.2-opacity shadow. Active tab fills Banko Green Deep (#386B2A) and grows (`flex: 1` vs `0.6` for inactive) with a `LinearTransition.springify()` 150-stiffness spring; the label fades in beside the icon. The active-tab border is 1px Banko Green (#457B3B).
- **Floating action button (FAB):** Paper-fill circle, 48px, with `shadow-md` lift. Locate-me, cart FAB. Icon in Ink-900, never in Banko Green — the FAB is chrome, not action-color-coded, to keep the Banko Reserve Rule.
- **Locate badge callouts (onboarding):** Paper-fill `rounded-2xl` (16px), 1px ink-200 border (NOT a box-shadow alone — the onboarding badges use BOTH border AND `shadow` StyleSheet, which is a registered defect — see section 6 Don't), icon in Banko Green, label in Ink-900, sub-label in Ink-500.

### Skeletons

- **SkeletonCard:** ink-100/200 placeholder blocks with a Linear-Gradient shimmer sweeping left-to-right over 1200ms (`Easing.linear`, `withRepeat`). Image placeholder is `w-18 h-18 rounded-2.5`. Text placeholders are 14px height bars at 60%, 90%, 40% widths.
- **Rule:** Every list that fetches renders the skeleton at first load. A centered `<ActivityIndicator />` in content is forbidden — it signals "the app might be stuck," which maps directly to the unstable anti-reference. ActivityIndicator is allowed only inside an overlay `bg-white/50` when a refetch is in flight AND content already exists underneath.

### Empty states

- **Component:** `EmptyState` from `src/components/ui/EmptyState.tsx`. Centered emoji (📭, 🍽) at 60px, title in Ink-900 bold 18px, message in Ink-500 14px, optional action button in Tailwind `bg-green-500` pill (#22C55E, the single sanctioned use of Tailwind's brighter mid-green for a small EMPHASIS action). NOTE: `EmptyState` currently ships `bg-green-500`; that is the sanctioned mid-green use and aligned with the Banko-Green-Price Rule, distinct from the Banko Green Darkest CTA.
- **Voice:** French, direct, never precious. "Aucun restaurant ici" / "Essayez de vous déplacer ou d'agrandir le rayon de recherche." Never "Oops! No results found 🥺" — that energy is the saturated AI copywriting tell and it directly contradicts "Proud, not loud."

### Navigation

- **Bottom tab bar:** Custom (not Expo's default). 4 tabs (Carte, Commandes, Panier, Profil); "Itinéraire" is `href: null` (hidden). Active tab grows the pill and reveals the label; inactive tabs show icon only in Banko Green (#457B3B). Panier carries a count badge in Piment Red (`#ff4b4b`) when `nombre > 0`.
- **Stack navigator:** `headerShown: false` everywhere — headers are rendered per-screen, not at the stack level. Auth flows use `presentation: "modal"`.
- **Profil flow (unauthenticated):** Tapping Profil when logged out routes to `/auth/login`, not to the profile tab. This is Correct.

## 6. Do's and Don'ts

Concrete, forceful guardrails. Each Don't traces to either a PRODUCT.md anti-reference (named in quotes) or a shared absolute ban enforced on this surface.

### Do:

- **Do** use the three radii only — pill (`rounded-full` / `rounded-[30px]`), card (`rounded-2xl` / 16px), input (`rounded-md` / 6px). A new radius is a system bug. The 40px tab-bar pill is the lone sanctioned exception.
- **Do** use Banko Green across its three tones — Darkest (#166534) for CTAs and the selected filter pill, Deep (#386B2A) for the live tab, Banko Green (#457B3B) for ink accents and outline/ghost text — and only for primary-action surfaces. Per the Three-Tones Rule and the Banko Reserve Rule, ≤30% of any screen.
- **Do** use the status trio — green = livrée, ochre = en cours, piment red = annulée — for order status. Use ink for everything else informational.
- **Do** render `SkeletonCard` for list loads, never a centered spinner in content. An overlay `ActivityIndicator` only on top of existing content during refetch.
- **Do** carry French copy in labels, status, and empty states. The voice is part of the local soul ("Toutci — une app pour tout").
- **Do** use `expo-image` with `placeholder={{ blurhash: BLUR_HASH }}` and `contentFit="cover"` for every network food image. Payload efficiency on mobile data is a design constraint, per PRODUCT.md.
- **Do** honor `prefers-reduced-motion: reduce`: degrade shimmer to static ink-200, LinearTransition to snap, bottom-sheet translate to instant.
- **Do** apply haptic feedback (`Haptics.impactAsync(Light)`) on quantity-add/remove. The trust is in the feedback.
- **Do** respect the 4.5:1 contrast floor — Ink-500 (#6B7280) is the floor for body text against Paper; going lighter loses the "sûr" reading and risks the WCAG AA commitment in PRODUCT.md.
- **Do** prefix any future committed color or radius with a token in `src/global.css` first. Raw hexes that don't map to a documented token are drift.

### Don't:

- **Don't** use Uber Eats / Deliveroo patterns: a promo banner carousel, a coupon overlay on first launch, a "30% off everything" hero. Per PRODUCT.md: _"Saturated / cluttered apps — too many banners, promo carousels, dark patterns."_
- **Don't** use cream / sand / parchment / linen / warm-tinted-near-white body backgrounds. The body ground is Paper (#FFFFFF). Cream-warmth is the saturated AI default and reads as imported template — _"Generic Uber Eats / Deliveroo — no local soul."_
- **Don't** apply a 1px border AND a soft drop shadow ≥16px blur on the same element (the Codex ghost-card defect). Either a 1px ink-200 stroke OR a defined shadow ≤8px blur — never both. **Specifically: the onboarding "3 min" / "Ouvert" / "4.7" callout badges currently ship BOTH `border border-gray-100` AND `shadow-sm` + a StyleSheet shadow** — this is a registered defect. Fix by dropping the StyleSheet shadow; keep the 1px border and a single `shadow-sm`.
- **Don't** use `border-l-4` / `border-l-2` / any side-stripe as a colored accent on a card, list item, callout, or status badge. The shared absolute ban. Status is conveyed by the bandeau fill, not by a stripe.
- **Don't** use `background-clip: text` with a gradient on any heading, price, or label. Single solid color only. The shared ban.
- **Don't** use glassmorphism / blur decks / `backdrop-filter` as default decoration. PRODUCT.md flags "unreliable feel" — glass on a low-end Android phone stutters, and the stutter reads as instability. Reserved for rare, deliberate cases (none ship today).
- **Don't** add decorative motion that doesn't convey state. Per the product register: 150-250ms transitions, no orchestrated page-load sequences. The user is in flow; they do not want to watch the app load.
- **Don't** use display fonts in UI labels, buttons, or data. One-family sans throughout. PRODUCT.md: _"Fake premium / elitist"_ — a serif import on a "Vos meilleurs restaurants" title reads as elitist.
- **Don't** use a centered `<ActivityIndicator size="large" color="green-500" />` as the primary content of any screen (the position-error screen in `(tabs)/index.tsx:129` currently does — it overlays `bg-white/50` which is acceptable, but the pattern of "first render = spinner" anywhere else is forbidden).
- **Don't** tint neutral backgrounds warm or cool "because Bouaké feels warm." The warmth is in the ochre accent and the food imagery, not in the ground. Per the Neutral-Tint Rule and the Neutral Tint guidance for new projects.
- **Don't** invent a fourth order status color (no info-blue "en attente", no purple "en préparation spéciale"). The status trio is fixed. Lagune Blue is for genuinely informational, non-order flows only.
- **Don't** use a raw hex that doesn't appear in the frontmatter tokens. The sanctioned green hexes are `#166534` (Banko Green Darkest), `#386B2A` (Banko Green Deep), `#457B3B` (Banko Green), and Tailwind's `green-50` / `green-100` / `green-500` / `green-700` ramps from `tailwind.config.js` (sanctioned for soft backgrounds, the price, the counter text, the empty-state action button). Drift hexes to replace at next touch: `#1B4D1E` (in `CommandeCard.tsx` `iconColor` for livrée — replace with Banko Green Darkest `#166534`). Drift hexes to keep (already canonical): `#DC2626` (Piment Red Deep).
- **Don't** silently translate French UI copy to English when shipping a new screen. The app launches in Côte d'Ivoire; the language is part of the trust.
- **Don't** use `active:scale-95` or any scale-on-press animation. Press feedback is `active:opacity-80` (solidarity with the haptic) — scale reads as cartoonish on the press and as "the button might be unstable," the explicit anti-reference.
- **Don't** resolve `--primary` from `src/global.css` as-is and assume it is the brand color. The CSS variable holds HSL `142 71 45` → `#21C45D` (bright jade), which is registered drift. The rendered brand is the deep moss family. Until `--primary` is realigned to the moss tone (see Token-Drift section below), use the explicit hexes `#166534` / `#386B2A` / `#457B3B` for new screens and DO NOT rely on `hsl(var(--primary))` to render the correct brand green.

**Dark mode (planned extension).** `src/global.css` declares a `.dark` block: `--background: 221 39 11` (deep ink), `--foreground: 210 20 98` (warm near-white), Banko Green primary retained, ink-50/100 invert. No screen toggles `.dark` today. Do NOT ship dark-mode surfaces against these tokens until the toggle exists and low-end-Android contrast has been verified on a real entry-level device — PRODUCT.md flags low-end Android as a design constraint, and a half-shipped dark theme that flickers on auto-color-scheme would read as unstable (the anti-reference). When dark mode ships: invert Paper → Ink-900 for body, Banko Green stays the same, ochre shifts one step lighter for contrast against the dark ground, all 1px ink-200 strokes become 1px ink-700 strokes (NEVER 2px, NEVER a glow).

---

## Token-Drift Register

This section tracks divergences between `src/global.css` CSS variables and the rendered brand. Each entry is a known drift, not a sanctioned state. Resolution is to align the source of truth toward moss, not toward jade.

### Drift 1 — `--primary` resolves to bright jade, not Banko Green

- **Source:** `src/global.css:8` — `--primary: 142 71 45;` → `#21C45D` (HSL 142°, 71%, 45%).
- **Rendered brand:** Banko Green Darkest `#166534` (Tailwind `green-800`), used as the onboarding CTA fill, the shadcn button default-via-`bg-green-800`, the filter-pill selected state.
- **Symptom:** A shadcn/RN component that uses `bg-primary` (e.g. `badgeVariants.default: 'bg-primary border-transparent'` in `badge.tsx:18`) renders the badge in bright jade, but every other primary surface on the same screen renders in deep moss. The result is two greens in the same CTA family; the badge reads as out-of-family.
- **Resolution:** Realign `--primary` in `src/global.css` from `142 71 45` (HSL→`#21C45D`) to a moss-tuned HSL matching Banko Green Darkest. Recommended: `--primary: 143 64 24;` → `#166534`. After realignment, the drift resolvers below become no-ops. Until then, prefer explicit Tailwind classes `bg-green-800` over `bg-primary` for any CTA-pitched surface.
- **Risk if uncorrected:** Bright jade CTAs ship accidentally wherever a shadcn variant defaults to `bg-primary`. Family insecurity grows with every new shadcn/RN component added.

### Drift 2 — `--ring` inherits the jade drift

- **Source:** `src/global.css:20` — `--ring: 142 71 45;` (same as `--primary`).
- **Symptom:** Web `focus-visible:ring-ring/50` will render a 3px jade ring on focus, not a moss-green ring. On native (no CSS ring), this drift is invisible today.
- **Resolution:** Realign alongside `--primary`. Recommended: `--ring: 143 64 24;`.

### Drift 3 — `--accent` resolves to a saturated orange-pitch ochre

- **Source:** `src/global.css:14` — `--accent: 38 92 50;` → `#F59F0A` (the Tailwind `warning` yellow, NOT the deeper Banko Ochre `#E68412` the prose defines).
- **Symptom:** Shadcn components using `bg-accent` (the `ghost` button's `active:bg-accent` in `button.tsx:25`) render the gold-tint `Tailwind amber-500` on press, not Banko Ochre's deep warm-orange.
- **Resolution:** Pick one. Either (a) align `--accent` to `38 84 48` → `#E5790C` (closer to Banko Ochre `#E68412`) and accept `warning` and `accent` resolve to the same hue, or (b) keep `--accent` as is (the Tailwind amber default) and update DESIGN.md prose to call Banko Ochre `#F59F0B` instead. The drift is not the hue choice; the drift is the prose-vs-token mismatch.

### Drift 4 — `--destructive` resolves to a coral red lighter than Piment Red

- **Source:** `src/global.css:16` — `--destructive: 0 84 60;` → `#EF4343` (a lightish coral). `Piment Red` in the prose is `#E51818`.
- **Resolution:** Realign `--destructive` from `0 84 60` toward `0 84 53` → `#E51818` to match Piment Red. Or update the prose to call `Piment Red #EF4343` and demote `#E51818` to legacy. The first option is recommended — a deeper destructive red carries the "piment" name better and reads more clearly as an error against the soft-pink `Destructive-Soft-Bg` fill.

### How to clear the register

Run `$impeccable document` again after one of the realignment branches above has been applied, the PRODUCT.md product-register reviewer confirms the new tokens, and the rendered screens match the spec without raw-hex overrides. The day every screen renders Banko Green directly from `hsl(var(--primary))` — not from a hardcoded `bg-green-800` or `bg-[#457b3b]` — the register is empty and the design tokens are the live source of truth.
