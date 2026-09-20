# Journal d’exécution — Stabilisation de ToutCi

## Session 20 septembre 2026 — Phase 1 cash + Paystack

Décision produit : V1 = **espèces + Paystack** (mobile money et carte), pas cash-only.

Fait :

- Checkout restaurant : sélection cash / mobile money / carte ; `paymentReturnChannel: mobile` inchangé ; ouverture de `authorizationUrl` Paystack après POST, reprise depuis le détail si le lien échoue.
- Légal : constantes `LEGAL_PAGES` ; À propos ouvre les 4 URLs web ; inscription bloquée sans case d’acceptation (CGU + confidentialité).
- Fallback GPS : `DEFAULT_COORDS` = Bouaké.
- Tests Node : acceptation légale, URL CGU, payload `mobile_money`.
- `npm run check` : typecheck, lint (2 warnings préexistants hors périmètre), 34 tests Node verts. Les `*.test.tsx` Jest restent exclus de `tsc`.

Commit utilisateur : `b9f48b7` (cash + Paystack, légal, Jest). Phase 1 close.

Pas fait : login simulateur ; mise à jour du texte CGU sur le site web (hors repo mobile).

---

## Session 20 septembre 2026 — Phase 2 parcours commande

Objectif : prevalidate avant POST, annulation si `recue`, `sur_place` hors checkout V1, pas de POST/écran sans issue.

Fait :

- `useEnvoyerCommande` appelle `POST /client/commandes/prevalidate` puis la création ; GPS réel obligatoire (`readForegroundLocation`).
- Détail commande : bouton d’annulation si statut `recue` (`PATCH /client/commandes/{id}`).
- `sur_place` filtré du checkout ; restaurant uniquement sur place bloqué au panier ; libellé historique conservé.
- Aucun écran « Bientôt » restant dans `src/`.
- `npm run check` : typecheck, lint (2 warnings préexistants), 37 tests Node verts.

Pas fait : recette native simulateur (Phase 3) ; login avec le compte test.

Prochaine action : Phase 3 — builds Debug + matrice manuelle avec le compte recette.

---

## Session 20 septembre 2026 — plan production

Objectif : remplacer la feuille de route éclatée par un plan exécutable jusqu’au gate A, en intégrant le compte test et les pages légales.

Fait :

- Réécrit `task_plan.md` (phases 1–8, gates A/B, matrice de preuves).
- Enrichi `findings.md` (écart CGU/Paystack, annulation, mentions gabarit, GPS, prevalidate).
- Vérifié les 4 URLs légales (HTTP contenu réel ; mentions encore incomplètes).

Pas fait (volontaire) : aucun changement applicatif dans cette session.

Prochaine action concrète (Phase 1) :

1. Constantes d’URLs légales + liens À propos + acceptation inscription.
2. Fallback GPS Bouaké.
3. Ranger le lot UI/Jest (commit ou stash) et relancer `npm run check`.
4. Login simulateur avec `0777945714` (mot de passe hors git).

---

## Sprint 0 — base protégée — 19 septembre 2026

Exécution de la Passe 0 du plan (Sprint 0 de la feuille de route production).

| Contrôle | Résultat |
|---|---|
| Commit des chemins locaux | 103 chemins répartis en 12 commits logiques (contrat, domaine, itinéraire, Mood, checkout, résidences, activité, restaurant/menu, profil/auth, UI, config, docs) |
| Scan de secrets | Aucun secret suivi ; `.env` ignoré ; les fichiers signalés ne contiennent que des bornes de validation et fixtures de test |
| Tag de baseline | `baseline-2026-09-19` posé sur l'état final |
| `npm run check` sur la baseline commitée | TypeScript, ESLint, 31/31 tests verts |
| Export Android | Réussi, bundle HBC 7,8 Mo |
| Export iOS | Réussi, bundle HBC 7,6 Mo |

Le working tree est propre ; l'état est récupérable via le tag. Prochain sprint : Sprint 1 (décisions V1, masquage Paiement/Support, recette native fraîche).

## Certification des parcours authentifiés — 19 septembre 2026

Un compte client de test a été fourni (`+2250777945714`). La matrice authentifiée déclarée incertaine depuis le 1er août a été exécutée contre le backend réel via HTTP, sans modifier le code.

| Parcours | Résultat |
|---|---|
| `POST /client/auth/login` | HTTP 200 ; access token JSON + refresh en cookie HTTP-only `__Secure-toutci_client_refresh` |
| `GET /client/auth/me` | HTTP 200 ; profil complet, compteurs commande/dépense présents |
| `POST /client/auth/refresh` | HTTP 200 ; rotation du cookie observée, nouveau token |
| `GET /client/commandes` | HTTP 200 ; historique réel paginé (14 commandes, statuts variés) |
| `POST /client/commandes/prevalidate` | HTTP 200 ; `valid:true` avec politique géo (`serviceMarketId`, `geoPolicyVersion`) ; position exigée sinon 422 `CURRENT_LOCATION_REQUIRED` |
| `POST /client/commandes` | HTTP 201 ; montants calculés serveur (`sousTotal`, `fraisLivraison`, `total`) ; cash → `authorizationUrl:null` |
| Idempotence du POST | Confirmée : même clé → même commande, `replayed:true`, HTTP 200 au lieu de 201 |
| `GET /client/commandes/{id}` | HTTP 200 ; détail complet |
| `POST /client/auth/logout` | HTTP 200 ; refresh post-logout rejeté 401 `Session expirée` |

Observations complémentaires :

- Le login applique un rate limit réel (429 avec `retryAfter` ~240 s) — comportement de sécurité validé de fait.
- L'annulation de commande reste non implémentée côté mobile et le `PATCH /client/commandes/{id}` n'a pas de corps documenté dans l'OpenAPI client.
- Deux commandes de test (plat « validation E2E », 12 000 FCFA, cash, emporter) subsistent dans l'historique du compte, créées sur le restaurant de test E2E.

**Conclusion : les risques « testables uniquement avec un compte client » listés dans `findings.md` sont désormais certifiés côté backend.** Les limites restantes relèvent du backend/produit : push client, observabilité, publication stores.

## Bilan du 1er août 2026

### Statut

- Audit complet : terminé.
- Adaptation au contrat API transmis : terminée.
- Corrections P0/P1 accessibles sans compte backend : terminées.
- Vérification Android locale Debug et Release : terminée.
- Vérification iOS Debug : terminée.
- Vérification iOS Release : terminée.
- Parcours authentifiés réels : en attente d’un compte client de test.

### Protection de la base de travail

- Branche `main` en avance de 28 commits avec de nombreux changements locaux préexistants.
- Aucun reset, checkout destructif, commit ou push effectué.
- `android/` et `ios/` sont générés localement et ignorés par Git.
- Sauvegarde native préalable au prebuild : `/private/tmp/toutci-native-prebuild.mQHzqY`.
- `docs/openapi.json` n’a servi à aucune décision ou validation.

## Travaux réalisés

### Contrat API

- URL normalisée autour de `/api/v1/client` sans double préfixe.
- Types et appels alignés sur le contrat mobile transmis : auth, restaurants, menu, géocodage et commandes.
- Enveloppes et payloads critiques validés avec Zod dans `src/lib/apiValidation.ts`.
- `ApiClientError` expose statut, code, détails et `Retry-After`.
- Réponses 204/non-JSON, timeout de lecture, annulation et retry unique gérés.
- Refresh 401 mutualisé entre requêtes concurrentes.
- Endpoint push restaurateur/admin retiré du parcours client.
- Itinéraire lu dans le détail restaurant au lieu d’un appel OSRM direct.

### Authentification et réseau

- Snapshot client validé dans SecureStore et restauration de session hors ligne.
- Une panne transitoire ne supprime plus immédiatement une session locale utilisable.
- Courses logout/login/refresh protégées par l’identité de la session courante.
- Cache React Query isolé lors du changement d’utilisateur.
- Redirections après auth centralisées, normalisées et limitées aux routes internes prévues.
- Ancienne route `/(tabs)/panier` migrée vers `/panier`.

### Checkout et panier

- Frais d’emballage entièrement supprimés.
- Seuil frontend fictif de livraison gratuite supprimé.
- Frais de livraison liés au mode réellement choisi.
- Quantités agrégées et bornées ; suppression complète distincte de la décrémentation.
- Modes, minimum de commande, disponibilité et coordonnées vérifiés avant POST.
- Double soumission bloquée par un verrou synchrone.
- Clé d’idempotence renouvelée avec l’intention et conservée pour le retry identique.
- Transfert du panier invité avec rollback si la suppression de la source échoue.

### Géolocalisation et recherche

- `TEST_MODE` forcé supprimé ; géolocalisation réelle activée.
- Repli produit placé à Bouaké.
- Permission refusée, service désactivé, timeout et dernière position récente distingués.
- Recentrage corrigé pour attendre les nouvelles coordonnées.
- Plugin `expo-location` et libellé iOS français ajoutés à `app.json`.
- Restaurants non interrogés tant que la position n’est pas résolue.
- Recherche restaurants et cuisines synchronisée sur la même zone ; filtre actif toujours visible.

### Persistance locale

- Formats versionnés et validés pour panier, favoris et adresses.
- JSON absent, ancien, partiel ou corrompu traité sans injecter de forme arbitraire dans le store.
- Rollback des favoris et du panier en cas d’échec d’écriture.
- Adresses migrées d’un gros JSON unique vers un index et une entrée SecureStore par adresse.

### Commandes et notifications

- Statuts et états terminaux centralisés dans `src/domain/orderStatus.ts`.
- Pagination infinie réelle pour les commandes et l’historique.
- Une erreur réseau ne ressemble plus à une liste vide.
- Les pages déjà chargées restent visibles si une page suivante échoue.
- Polling arrêté sur statuts terminaux et erreurs non récupérables.
- Payload notification contrôlé avant navigation ; un utilisateur déconnecté n’est pas envoyé sur un détail protégé.

### Nettoyage et bundle

- Suppression du slice carte, du helper géographique et de l’ancien helper créneaux sans consommateurs.
- Imports applicatifs `@expo/vector-icons` supprimés, dépendance directe retirée.
- Types risqués et casts de navigation supprimés des parcours critiques.
- README, `.env.example` et scripts de contrôle local ajoutés.
- Bundle Android réduit d’environ 4 080 à 4 020 modules et de 7,9 à 7,5 Mo HBC.
- La police Material Symbols de 956 Ko reste transitivement importée par `expo-router`/`expo-symbols`, pas par le code applicatif.

## Résultats de validation

| Contrôle | Résultat final |
|---|---|
| TypeScript | Succès |
| ESLint | Succès, aucun avertissement |
| Tests | 12/12 réussis |
| `git diff --check` | Succès |
| `npx expo install --check` | Dépendances compatibles selon la carte locale |
| `npm audit --offline` | 0 vulnérabilité connue |
| Backend public | HTTP 200 et schémas valides pour liste, détail, menu et géocodage |
| Expo Prebuild | Succès ; régénération native examinée |
| Android Debug | Build, installation et exécution réussies |
| Android Release | Build réussi, 681 tâches ; APK installé et lancé directement sans Metro |
| Android runtime | Activity `RESUMED`, premier rendu visible, carte Bouaké et trois onglets contrôlés |
| iOS Debug | Build et installation sur iPhone 17 Simulator réussis, 0 erreur |
| iOS Release | Build final réussi, 0 erreur et 1 warning natif ; installation et lancement direct réussis |
| Export Android | 4 020 modules, 40 assets, HBC 7,5 Mo |
| Export iOS | 3 923 modules, 36 assets, HBC 7,3 Mo |
| Export Web | 3 544 modules, JS principal 5,1 Mo, 28 routes statiques |

## Tests automatisés ajoutés

Douze tests Node couvrent :

- agrégation et bornes des quantités ;
- modes de commande et tarification ;
- payload et idempotence du checkout ;
- statuts de commande ;
- migration/validation des données locales ;
- validation des réponses API ;
- normalisation des redirections après authentification.

## Erreurs rencontrées et résolution

| Incident | Résolution |
|---|---|
| ADB interdit dans le bac à sable (`smartsocket: Operation not permitted`) | Commandes émulateur relancées avec autorisation système ciblée |
| Services CoreSimulator inaccessibles dans le bac à sable | Build et installation iOS lancées avec autorisation ciblée |
| Expo SDK 57 recrée les dossiers natifs même sans `--clean` | Sauvegarde préalable, diff examiné et documentation corrigée |
| Android Release à froid très long | Build complet laissé terminer ; build incrémental final réussi en 15 s |
| L’onglet Commandes absent au premier contrôle Release | Le nom runtime est `commandes/index`; filtre corrigé puis rebuild et capture validés |
| Trois exports Metro parallèles sans sortie pendant environ 140 s | Ils ont tous terminé correctement ; lenteur due à trois reconstructions de cache simultanées |
| Cache Metro Web non désérialisable | Fallback automatique vers un crawl complet ; export réussi |
| Invite système iOS « Ouvrir dans ToutCi ? » | Build validé ; interaction runtime complète limitée tant que le Mac reste verrouillé |
| Warnings Gradle 10 futurs | Provenance dépendances/toolchain, aucune erreur source applicative ; à surveiller lors des montées de SDK |

## Limites restantes

- Aucun compte client de test n’a été fourni : login réel, rotation du cookie de refresh, POST de commande idempotent et historique authentifié ne peuvent pas être certifiés de bout en bout.
- Aucun endpoint push backend n’accepte un token de client final.
- Le SSE authentifié avec Bearer n’est pas implémenté ; le polling sûr est conservé.
- Crash reporting, CI distante, signature et distribution stores appartiennent au chantier de mise en production publique.

## Reprise recommandée

1. obtenir un compte backend de test ;
2. exécuter la matrice authentifiée du `task_plan.md` ;
3. choisir l’observabilité avant diffusion publique.

---

## Audit de préparation production — 13 septembre 2026

### Contrôles actuels

- `npm run check` : TypeScript, ESLint et 27 tests réussis.
- `npm run api:check` : réussi, mais ne détecte pas encore l'écart entre OpenAPI et le validateur runtime.
- `npx expo install --check` : versions compatibles selon la carte locale.
- `npm audit --offline` : aucune vulnérabilité connue.
- `git diff --check` : réussi.
- Export Android courant : réussi, 4 081 modules, 38 assets, bundle HBC 7,8 Mo.
- Arbre local : 53 fichiers modifiés, 6 supprimés et 33 non suivis.

### Constats fonctionnels

- La recherche restaurants appelle bien le backend.
- Le champ texte est toutefois masqué par le bouton Mood dans le parcours principal.
- Le mobile envoie `query`, tandis que le schéma backend strict attend `search` ; OpenAPI annonce encore `query`.
- Mood est entièrement local : quatre suggestions codées en dur, sans soumission ni endpoint de recommandation.
- Le backend possède recherche, ranking organique/sponsorisé et attribution, mais aucun contrat Mood/sémantique.
- Paiement et Support restent des placeholders ; suppression de compte absente.
- Prévalidation, annulation de commande, édition de profil et changement de mot de passe ne sont pas exploités côté mobile.

### Constats d'interface

- 19 fichiers utilisent `StyleSheet` et 37 utilisent des classes NativeWind.
- Plus de 100 couleurs hexadécimales sont définies localement.
- 107 contrôles Pressable/Touchable ont été relevés pour 79 libellés d'accessibilité.
- 15 fichiers contiennent des animations sans prise en charge explicite de la réduction des mouvements.
- Les en-têtes, retours, états de chargement/vide/erreur et CTA ne reposent pas encore sur une seule famille de composants.

### Limites de cette passe

- CoreSimulatorService et ADB ne sont pas accessibles depuis la session actuelle ; aucune nouvelle preuve runtime native n'a été produite.
- Les documents historiques du backend ne suffisent pas à certifier ses intégrations de production ; elles doivent être retestées sur staging.

### Livrables

- `findings.md` enrichi avec l'état dynamique/statique précis.
- `task_plan.md` remplacé par une feuille de route production en quatorze passes avec critères de sortie.

### Prochaine reprise

1. Passe 0 : protéger l'état Git actuel et figer la baseline.
2. Passe 1 : décider le périmètre public de la V1.
3. Premier correctif fonctionnel : réparer et tester le contrat `query` / `search`.

---

## Recentrage produit Mood — 13 septembre 2026

- Vision clarifiée avec le porteur du produit : Mood est le cœur de la découverte et doit remplacer la logique de simple annuaire.
- `task_plan.md` a été réorganisé pour traiter Mood comme une recherche universelle et une recommandation multi-verticale.
- Restaurants et résidences sont désormais considérés comme le socle Mood du lancement.
- La recherche exacte devient un cas d'usage de Mood et son fallback, pas un écran concurrent.
- Le prochain travail produit est la spécification du contrat unifié Mood ; le prochain travail technique reste la protection de la base puis la correction `query` / `search`.

---

## Recentrage du plan sur le développement local — 13 septembre 2026

- Authentifications sociales Apple et Google retirées du périmètre.
- Absence de comptes Apple Developer Program et Google Play Console enregistrée comme contrainte, pas comme blocage du développement local.
- Le plan distingue désormais le gate actif « production-grade local » du gate différé « publiable sur les stores ».
- EAS Submit, TestFlight, Play Internal et signatures de distribution ne font plus partie du chemin critique.
- Les passes de tests et de build ciblent d'abord le simulateur iOS et l'émulateur Android locaux.
- L'inscription/connexion classique est conservée selon un modèle progressif ; aucune connexion sociale n'est prévue.

---

## Clarification sur l'identité — 13 septembre 2026

- Toute notion de pseudonyme utilisateur a été retirée.
- Aucun profil anonyme persistant ne sera construit avant connexion.
- Mood pré-connexion fonctionnera avec le seul contexte de la requête courante.
- Les opérations transactionnelles et synchronisées utiliseront un compte classique avec informations réelles.
- `task_plan.md` et `findings.md` ont été alignés sur cette règle.

---

## Audit visuel et fonctionnel de la refonte — 13 septembre 2026

- Audit demandé avant le démarrage des passes production-grade.
- Périmètre : inventorier les écrans, lancer les parcours sur simulateur/émulateur, qualifier les écrans terminés, partiels ou manquants, puis évaluer la cohérence visuelle et fonctionnelle.
- Aucun code applicatif ne doit être modifié pendant cette phase de diagnostic.

### Incidents de préparation

- Une commande de lecture contenait par erreur le motif shell `tail?` ; zsh l'a rejeté avant cette portion. Les fichiers demandés avaient déjà été lus dans la même commande.
- Le chemin supposé `references/design-audit-framework.md` n'existe pas à la racine du plugin Product Design ; le fichier doit être localisé avant de poursuivre au lieu de répéter la même lecture.
