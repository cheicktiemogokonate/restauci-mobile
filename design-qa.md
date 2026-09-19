# Design QA — Activité

- Source visual truth: `/Users/apple/.codex/generated_images/01a05c18-39c9-7310-ae24-56bf962a7e21/exec-6ca45d96-2ce1-4531-844f-ed67997bfb46.png`
- Implementation screenshot: `/private/tmp/toutci-activity-mood-background.png`
- Source pixels: `853 × 1844`
- Implementation pixels: `1206 × 2622`
- Device: iPhone 17 simulator, portrait, native scale
- State: source populated; implementation populated with real client activity

## Full-view comparison evidence

The route, three-item dock, selected Activity state, multi-zone blurred gradient backdrop, title hierarchy, spacing, and unauthenticated state render correctly on iOS. The background now covers the full viewport, including the status-bar region, and preserves subdued blue, green, and warm fields through the blur. A fidelity comparison of the active, upcoming, and recent sections is not valid yet because the simulator has no authenticated client session, while the source visual is populated.

## Focused region comparison evidence

The navigation region was visually checked: it has exactly `Explorer`, `Activité`, and `Profil`, with the same rounded floating surface and a selected Activity pill. Populated content regions could not be compared without fabricating application data, which was intentionally avoided.

## Findings

- [Blocked] Populated activity state cannot be visually compared.
  - Location: active, upcoming, and recent sections.
  - Evidence: the reference contains one active order, one future stay, and two recent activities; the simulator displays the real unauthenticated state.
  - Impact: typography, image crops, row density, progress alignment, and section rhythm cannot receive a valid same-state visual pass.
  - Resolution: authenticate in the simulator with an account that has real orders or reservations, then capture and compare the populated state.
- [Blocked] Android visual capture is unavailable.
  - Evidence: `adb devices` reports no connected emulator.
  - Impact: Android rendering of the shared React Native layout has not been visually inspected.
  - Resolution: boot an Android emulator and capture the same route.

## Required fidelity surfaces

- Fonts and typography: login-state hierarchy checked; populated text remains unverified.
- Spacing and layout rhythm: header, empty state, and dock checked; populated sections remain unverified.
- Colors and visual tokens: blurred blue/green/warm fields, off-white surface, green CTA, and selected dock state checked.
- Image quality and asset fidelity: not verifiable in the unauthenticated state.
- Copy and content: French login-state copy checked; real activity copy remains data-dependent.

## Comparison history

- Pass 1: route and dock rendered successfully. No visual fixes were made because the populated comparison state is unavailable.
- Pass 2: replaced the flat Activity gradient with separate color fields under one native blur; the first capture was too saturated.
- Pass 3: reduced color opacity, increased diffusion, and restored a light veil. The colors remain visible while the overall surface matches the pale reference more closely.
- Pass 4: moved the Activity backdrop above the tab scene so it fills the complete device viewport, made the Activity scene transparent, and reduced the color-field intensity again. Full-height coverage and the softer palette were verified on iOS.
- Pass 5: removed the Activity-only color fields and constants. Activity now shares Mood's blur intensity, light tint, Android reduction factor, translucent veil, and subdued map-toned static gradient. The full-height result was verified on the populated iOS route.
- Pass 6: bounded the main feed, moved 31 stale activities into a dedicated monthly history, added the upcoming/history selector, and verified both routes with real iOS data. The active carousel cannot be visually exercised with the current account because it has no order less than 24 hours old.
- Pass 7: moved History out of the tab navigator into a dedicated root stack, removed the dock from that screen, replaced the one-off arrow with the shared navigation back button, and verified that pressing it returns deterministically to Activity.

## Implementation checklist

- Log in on the iOS simulator with real activity data.
- Capture the populated Activity screen.
- Compare the populated source and implementation at matching state.
- Boot Android and repeat the route-level visual check.

final result: blocked
