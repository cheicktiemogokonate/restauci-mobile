# Product

## Register

product

## Platform

unified

## Users

The primary users are **particuliers ivoiriens** — individual residents who open the app on their phone to discover, order, and track from local vendors. The app launches first in **Bouaké**, with rapid expansion to other Ivorian cities (including Abidjan) planned early. Their context is mobile-first, often on mobile data networks, frequently on entry-level Android devices with modest RAM and CPU. The job to be done: find what's nearby, place an order with confidence, follow it to completion, and come back next time.

The **vendor side** (restaurants, and later residences/events) exists in a separate back-office dashboard — order management, operations, listings — and is deliberately out of scope for this mobile app. This surface is customer-facing only.

## Product Purpose

RestauCI is a **local marketplace for Ivorian cities**, launching in **Bouaké** with rapid multi-city expansion planned. It starts with the restaurant vertical — discovery, ordering, real-time tracking — with planned expansion toward residences and events. The product exists because global delivery apps don't know local neighborhoods, cuisines, or vendors city by city, and Ivorians deserve a platform that does — wherever they are. Success is a completed order followed by a reorder: a user discovers a restaurant, places an order, tracks it to delivery, and returns to order again.

## Positioning

Toutci — une app pour tout. The vertical expansion is the point — one app for everything a city offers, starting with food, starting with Bouaké, built to travel to the next city.

## Brand Personality

**Fier, généreux, sûr.** Proud — celebrates Ivorian identity broadly (not one city's identity), not a generic global template. Generous — in UX (clear, giving, not stingy with information or delight) and in spirit. Safe — trustworthy for transactions, transparent in pricing, reliable in tracking and stability. The interface should feel like it belongs to the country, not imported into it.

## Anti-references

- **Generic Uber Eats / Deliveroo** — no local soul, no sense of place. A global food-delivery template applied to any Ivorian city is the opposite of what this is.
- **Saturated / cluttered apps** — too many banners, promo carousels, dark patterns. Visually noisy interfaces that overwhelm rather than guide.
- **Fake premium / elitist** — luxury or exclusive feel that alienates everyday users. The app must be accessible to the whole market, not a privileged subset.
- **Unstable / unreliable feel** — visuals that signal the app might crash, lose the order, or leak data. Anything that undermines trust in the transaction.

## Design Principles

- **Local intelligence over generic convenience.** Every surface should know exactly which city it's in — neighborhoods, cuisines, vendors, distances that make sense locally. No global-template shortcuts, and no hardcoded assumption that the city is Bouaké forever — the pattern must travel.
- **Generosity in clarity.** Show the user what they need to decide: open status, distance, time, price, rating. Don't hide or bury. Generous UX is transparent UX.
- **Performance is trust.** Smooth on a low-end Android over mobile data is not a nice-to-have — it's how the app earns confidence. Jank reads as unreliability. Optimize RAM, CPU, and bandwidth as design decisions, not afterthoughts.
- **One city at a time, many verticals, many cities to come.** Design patterns that can carry the app from food to residences to events — and from Bouaké to the next city — without rebuilding the visual language. The architecture and component system should anticipate both kinds of expansion, even if only food-in-Bouaké is live today.
- **Proud, not loud.** Ivorian identity in the brand should be carried with confidence, not decoration. Cultural texture belongs in content and voice, not in every visual flourish.

## Accessibility & Inclusion

**WCAG AA** compliance (4.5:1 text contrast, large touch targets ≥44pt, screen reader labels on all interactive elements, visible focus states). Beyond standard a11y: optimize for **low-end Android devices** (entry-level RAM and CPU), making performance and fluidity on modest hardware a design constraint. Optimize for **mobile data bandwidth** — image loading, list virtualization, and payload efficiency matter for users on cellular networks. Support `prefers-reduced-motion` for all animations.
