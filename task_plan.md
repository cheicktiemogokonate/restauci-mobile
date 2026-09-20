# Task Plan: ToutCi — du MVP actuel à la production

Dernière mise à jour : 20 septembre 2026

## Goal

Amener l’application mobile client ToutCi à un service opérable à Bouaké : parcours réels, testés avec le compte client, documents légaux accessibles dans l’app, puis publication stores quand les comptes développeur existeront.

## Current Phase

Phase 1 — Figer V1, légal, baseline Git

## Deux gates (ne pas les confondre)

| Gate | Définition | Stores requis |
|---|---|---|
| **A — Production-grade local** | App sideloadable (APK / simulateur) pour un pilote contrôlé : cash + Paystack, Mood, commandes, résidences, légal, crash reporting, recette native | Non |
| **B — Publiable stores** | TestFlight + Play Internal, signatures, Privacy / Data Safety, suppression de compte, mentions légales complètes | Oui (Apple + Google) |

Le chemin critique actuel s’arrête au **gate A**. Le gate B est un chantier séparé.

## Compte de recette

- Téléphone local : `0777945714` (E.164 : `+2250777945714`)
- Mot de passe : **hors Git**. Fourni hors bande le 20 sept. 2026. Ne jamais le committer, ni `.env`, ni fixtures.
- Usage : login, historique, prévalidation, commande cash **et** Paystack sandbox, détail, logout. Pas de charge ni de commandes fantômes hors recette.

## Phases

### Phase 1: Figer la V1, relier le légal, protéger la base
- [x] Décisions V1 écrites (tableau ci-dessous) et appliquées dans l’UI
- [x] Liens CGU / confidentialité / mentions / cookies dans À propos + case à l’inscription
- [x] Fallback GPS = Bouaké (pas Abidjan)
- [ ] Lot UI/Jest courant commité ou reverté ; `git status` explicite
- [x] `npm run check` vert
- **Status:** in_progress

### Phase 2: Fermer les écarts fonctionnels du parcours commande
- [ ] Appeler `POST /client/commandes/prevalidate` avant création
- [ ] Annulation mobile tant que statut `recue` (exigence CGU)
- [ ] Masquer ou documenter `sur_place` selon le backend réel
- [ ] Aucun écran « Bientôt » ; aucun POST sans issue
- **Status:** pending

### Phase 3: Recette native avec le compte test
- [ ] Builds Debug iOS Simulator + Android Emulator sur le code figé
- [ ] Matrice manuelle (voir progress.md) : onboarding, Mood, login, cash E2E, suivi, résidence
- [ ] Corriger tout P0/P1 trouvé
- [ ] Export Android/iOS reproductible
- **Status:** pending

### Phase 4: Cycle de vie du compte (dépendance backend)
- [ ] Backend : `PATCH /client/auth/me`, `POST /client/auth/password`, `POST /client/account/delete` (spec `docs/backend-account-endpoints.md`)
- [ ] Mobile : édition, mot de passe, suppression + réauth
- [ ] Push : register/unregister au changement de compte
- **Status:** pending

### Phase 5: Paiements sandbox, push physique, sécurité applicative
- [ ] Aligner le texte CGU web sur cash + Paystack (une seule vérité)
- [ ] Paystack sandbox : callback, reprise, pas de preuve via deep link seul
- [ ] Push Expo sur un Android physique
- [ ] Inventaire données / permissions ; scan secrets
- **Status:** pending

### Phase 6: Observabilité, CI, cohérence UI restante
- [ ] Crash reporting JS+natif (Sentry ou équivalent) sans PII
- [ ] GitHub Actions : typecheck, lint, tests Node + Jest, `api:check`
- [ ] Brancher Jest dans `npm test` / `npm run check`
- [ ] Primitives UI + a11y sur les parcours critiques (poursuivre le lot en cours)
- **Status:** pending

### Phase 7: Gate A — pilote local
- [ ] Matrice : install neuve, hors-ligne, permission refusée, réseau lent
- [ ] Aucun P0/P1 ; dossier de preuves
- [ ] Liste des prérequis gate B
- **Status:** pending

### Phase 8: Gate B — stores (différé)
- [ ] Comptes Apple Developer + Google Play
- [ ] Mentions légales : RCCM, NCC, siège, hébergeur, contact DPO (aujourd’hui des gabarits)
- [ ] Suppression de compte in-app **et** web
- [ ] TestFlight / Play Internal, Privacy Nutrition / Data Safety
- **Status:** pending

## Décisions V1 (à confirmer ; défauts recommandés)

| Sujet | Défaut | Statut |
|---|---|---|
| Verticales | Restaurants + résidences ; événements hors V1 | Proposé |
| Paiement profil / Support | Masqués (déjà retiré du menu) | Fait |
| Règlement commande | Cash + Paystack (`mobile_money` / `card`) ; cash = réception. CGU web à aligner | Confirmé |
| Favoris / adresses | Locaux à l’appareil en V1 | Proposé |
| Mood | Entrée unique de découverte ; recherche exacte = fallback | Confirmé produit |
| Auth sociale | Hors périmètre | Confirmé |
| Fallback géo | Bouaké | Fait |
| Identité | Pas de profil anonyme / pseudonyme | Confirmé |

## Matrice parcours → preuve (gate A)

| Parcours | Écran | Endpoint | Preuve |
|---|---|---|---|
| Login | `/auth/login` | `POST /client/auth/login` | Session + `/me` |
| Mood | overlay + carte | `POST /public/discovery/mood` | Résultats restaurant+résidence |
| Commande cash | panier → checkout | prevalidate + `POST /client/commandes` | Id non vide, totaux serveur, `authorizationUrl:null` |
| Commande Paystack | panier → checkout | même POST + `mobile` | URL Paystack ouverte ; callback relit l’API |
| Annulation | détail commande | PATCH/cancel documenté | OK si `recue` |
| Suivi | détail | `GET /client/commandes/{id}` polling | Statuts jusqu’à terminal |
| Résidence | slug → devis → résa | quote + reservations | Annulation séjour |
| Légal | À propos + register | pages web | 4 URLs s’ouvrent |
| Hors-ligne | bannière | — | Pas de liste vide trompeuse |

## Pages légales (ne pas dupliquer le texte dans l’app)

Base : `EXPO_PUBLIC_WEB_APP_URL` (défaut `https://restauci.vercel.app`)

| Document | URL |
|---|---|
| CGU | `/conditions-generales` |
| Mentions légales | `/mentions-legales` |
| Confidentialité | `/confidentialite` |
| Cookies | `/cookies` |

Implémentation : constantes dans `src/constants/urls.ts`, `Linking.openURL`, case d’acceptation à l’inscription.

## Dépendances hors mobile

- Backend : endpoints compte ; corps d’annulation commande dans OpenAPI client
- Backend / juridique : remplir mentions légales avant ouverture commerciale
- Produit : CGU web à mettre à jour (cash + Paystack) — l’app V1 expose déjà les deux
- Ops : comptes stores uniquement pour le gate B

## Errors Encountered

| Error | Attempt | Resolution |
|-------|---------|------------|
|       | 1       |            |

## Notes

- Ne jamais écrire le mot de passe de recette dans ce dépôt.
- Re-lire ce fichier avant d’élargir le périmètre (pas d’événements, pas d’OAuth).
- Après chaque phase : statut, preuves dans `progress.md`, découvertes dans `findings.md`.
