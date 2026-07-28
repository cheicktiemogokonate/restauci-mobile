# Journal de remédiation — Toutci

Convention : une ligne par point traité. ✅ fait / ⏭️ ignoré / 🛑 bloqué.

## Préparation

- ✅ `chore: baseline` — les 65 fichiers déjà modifiés (Phase 1 et refactors antérieurs) étaient non committés au démarrage. Committés tels quels en un commit de baseline pour permettre l'isolation stricte des commits suivants. `tsc --noEmit` et `expo lint` passaient déjà.

## Phase 2 — Réorganisation navigation

- ✅ Déplacement `(tabs)/profil.tsx` → `(tabs)/profil/index.tsx`, `profil/*` → `(tabs)/profil/*`, `commandes/historique.tsx` → `(tabs)/profil/historique.tsx`, suppression `commandes/_layout.tsx`.
- ✅ `(tabs)/profil/_layout.tsx` : `Stack.Protected` remplacé par `Redirect href="/auth/login"` (deep link direct protégé).
- ✅ `(tabs)/profil/index.tsx` : menu Profil branché sur les 6 routes.
- ✅ `(tabs)/_layout.tsx` : retrait de `useRouter`, `client`, et du branchement conditionnel profil→login dans `onPress` (la garde est maintenant dans le layout Profil).
- ✅ `_layout.tsx` racine : retrait des `Stack.Screen name="profil"` et `name="commandes"` devenus orphelins (les dossiers `src/app/profil` et `src/app/commandes` n'existent plus).
- 📋 **À vérifier manuellement (humain)** : (a) tap onglet Profil déconnecté → login ; (b) les 6 lignes du menu naviguent ; (c) deep link `/profil/adresses` déconnecté → login.

## Phase 3 — Performance

- ✅ `assets/images` : suppression des 7 images du starter Expo (react-logo*, expo-badge*, expo-logo, tutorial-web, tabIcons/) — 0 référence.
- ✅ `assets/images` : suppression de 6 visuels projet non référencés (delivery-bike, food_bowl, livreur-scooter, livreur-scooter2, logo-glow, logo-restauci.jpeg). Récupérables via `git show HEAD~n`.
- ✅ Recompression `food2.jpeg` (2.4Mo → 335Ko, 1536→2000px max) et `default_hero_bg.jpg` (1.0Mo → 349Ko). Total `assets/images` : 6.6Mo → 2.1Mo.
- ⏭️ `icon.png` (799Ko, 1024×1024) laissé tel quel : c'est l'icône d'app, elle doit rester en PNG sans perte et sera de toute façon remplacée par l'icône Toutci (voir point "identité d'application").
- ✅ `panier.tsx` : `FlatList` imbriquée dans le `ScrollView` → rendu direct par `.map()`.
- ✅ `HeaderRestaurant.tsx` : `FlatList` horizontale imbriquée → `ScrollView` horizontal (+ `accessibilityLabel` sur les cartes de plats).
- ✅ `restaurant/[slug]/index.tsx` : `FlatList` de skeletons → `SkeletonCardList`.
- ✅ `SkeletonCard.tsx` : extraction de `SkeletonCardList` — **une seule** boucle Reanimated partagée par les N cartes au lieu d'une par carte (6 timers → 1 dans `MenuBottomSheet`). Classes invalides corrigées au passage (`w-18`→`w-[72px]`, `rounded-2.5`/`rounded-1.5`→`rounded-xl`/`rounded-md`, `w-9/10`→`w-[90%]`).
- ✅ `package.json` : retrait de `@expo/ui`, `expo-glass-effect`, `expo-symbols`, `expo-web-browser`, `expo-device`, `tailwindcss-animate` (0 occurrence, vérifié par `grep -r` sur `src`, configs et `app.json`).
- ⏭️ `react-dom` / `react-native-web` conservés : `app.json` déclare `web.output: "static"`, la cible web reste active.
- ⏭️ `expo-font`, `expo-system-ui`, `expo-status-bar` conservés : dépendances transitives usuelles d'`expo-router`/`expo`, leur retrait explicite casserait le prebuild.
- ✅ `panier.tsx` : migration `Image` (RN) → `expo-image`, et remplacement de l'image Unsplash distante par `assets/images/plat-placeholder.jpg` (9Ko, local), utilisé aussi comme `placeholder` pendant le chargement.
- ✅ `src/store/selectors.ts` (nouveau) : `selectNombreArticles` / `selectSousTotal` s'appuyant sur `nombreArticles()` / `sousTotal()` déjà présents dans `panierSlice`. Les 3 `reduce` inline dupliqués (`(tabs)/_layout.tsx`, `PanierFAB.tsx`, `panier.tsx`) sont remplacés.
- ✅ `(tabs)/_layout.tsx` : `freezeOnBlur: true` par défaut, `freezeOnBlur: false` uniquement sur l'onglet `index` (carte). `detachInactiveScreens={false}` reste au niveau du navigateur — cette prop n'est pas déclinable par écran, et c'est elle qui empêche la destruction de la vue native MapLibre sur Android.
- ⏭️ « Compilateur React + mémoïsation redondante » : `experiments.reactCompiler` est actif, les `useMemo`/`useCallback` restants (13 fichiers) sont donc en grande partie redondants — mais un retrait en masse est un risque de régression non mesurable sans profiling, et plusieurs servent encore d'ancrage d'identité explicite (ex. `renderTabBar`). Reporté : demande une passe de profiling dédiée.

## Phase 5 — Affichage établissement réel

- ✅ `src/types/etablissement.ts` (nouveau) : `TypeEtablissement` (`"restaurant"` seule valeur), `TYPE_ETABLISSEMENT_DEFAUT`, `LIBELLES_TYPE_ETABLISSEMENT`. Aucune UI résidences/événements n'a été construite.
- ✅ `SearchBar.tsx` : suppression de la constante `CATEGORIES` codée en dur ; les catégories arrivent en prop `cuisines`, et le placeholder est dérivé des libellés du type d'établissement. Le bandeau de filtres disparaît quand la liste est vide (plus de filtres qui ne rendent rien).
- ✅ `src/hooks/useCuisinesDisponibles.ts` (nouveau) : dérive les cuisines du champ `cuisines[]` des établissements de l'API. Requête sans le paramètre `cuisine`, donc elle partage le cache de la liste non filtrée (pas d'appel réseau supplémentaire).
- ✅ `(tabs)/index.tsx` : `showErrorState` distinct de `showEmptyState` — « Chargement impossible » + `refetch` vs « Aucun établissement ici » + recentrer. Classes `bg-[green-500]` / `color="green-500"` remplacées par les tokens (`bg-green-900`, `#14532d`), `text-gray-*` → `text-ink-*`, `accessibilityLabel` + `min-h-[44px]` sur les boutons.
- ✅ `MenuBottomSheet.tsx` + `utils/creneaux.ts` : aucun endpoint de `docs/openapi.json` ne renvoie de `CreneauHoraire`. `isPlatDisponible` était appelée avec `[]` et retournait donc toujours `true` — filtre mort qui masquait l'absence de donnée. Appel retiré (on filtre sur `plat.disponible`, réellement servi), fonction conservée avec marqueur `// 🔗 réintégrer quand l'API expose les créneaux horaires`.

## Phase 6 — Tunnel de commande

- ✅ `src/lib/tarification.ts` (nouveau) : `calculerDetailPanier()` centralise sousTotal + fraisLivraison (API) + fraisEmballage (200 FCFA) + seuil livraison offerte (2000 FCFA). Aucun calcul dans les composants.
- ✅ `panier.tsx` : frais de livraison lus depuis `useRestaurant(slug)` (API), jamais depuis un paramètre URL forgeable. Ligne emballage affichée. Bannière livraison offerte réellement conditionnelle (reste à ajouter / déjà offerte). Note de confirmation serveur ajoutée sous le total.
- ✅ `PanierFAB.tsx` : suppression des props `fraisLivraison`/`restaurantNom` et du passage en params URL. Navigation simple `/(tabs)/panier`.
- ✅ `store/index.ts` : `zustand/persist` + `@react-native-async-storage/async-storage` installé. Seuls `items` + `restaurantSlug` sont persistés — jamais token/client.
- ✅ `MenuBottomSheet.tsx` : ajout `viderPanier` dans le store ; `handleAjouter` affiche un `Alert` de confirmation avant de vider le panier pour un autre établissement (au lieu d'un rejet silencieux).
- ✅ `useEnvoyerCommande.ts` : extraction d'id robuste (`data.id ?? data.commande.id ?? data.numero ?? ""`), type `CommandeCreatedResponse`, log warn si id absent.
- ✅ `FormulaireCommande.tsx` + `panier.tsx` : `onSuccess` redirige vers `/(tabs)/commandes/[id]` si id présent, sinon vers `/(tabs)/commandes` (liste). `viderPanier()` appelé avant la navigation.
- ✅ `usePushNotifications.ts` : deep link corrigé `/(tabs)/commandes/${id}` (était `/commandes/${id}`, route inexistante). Fallback liste si pas d'id. Clés alternatives acceptées (`commandeId` | `id` | `orderId`).

## Phase 7 — Robustesse réseau, sécurité, et reste du rapport

- ✅ `src/lib/api.ts` : timeout 10s par défaut + `AbortController` intégré, logs conditionnés `__DEV__`.
- ✅ `src/store/slices/authSlice.ts` : timeout 5s sur la séquence `loadToken`, bascule en session anonyme au-delà.
- ✅ `src/app/_layout.tsx` : `QueryClient` avec `defaultOptions` (retry:1, staleTime:30s, gcTime:5m), export `ErrorBoundary` expo-router.
- ✅ `src/app/+not-found.tsx` (nouveau) : écran de secours pour les routes invalide.
- ✅ `FormulaireCommande.tsx` : suppression des `console.log` PII, alert() brut retiré du login.
- ✅ `src/app/index.tsx` (onboarding) : persistance flag "vu" (localStorage/web), boutons avec `accessibilityLabel`, classes Tailwind corrigées (`bg-ink-50`, `text-brand-500`, `rounded-full`).
- ✅ `src/app/auth/login.tsx` & `register.tsx` : `router.back()` → `router.replace("/(tabs)")`, logos `logo-toutci.png`, classes `bg-brand-700`, `text-brand-700`.
- ✅ `src/components/ui/button.tsx` : `bg-green-800` → `bg-brand-700` (token valide).
- ✅ `app.json` : name="Toutci", slug="toutci", scheme="toutci", bundleIdentifier="com.toutci.delivery", splash/backgroundColor="#14532d", userInterfaceStyle="light".
- ✅ `eas.json` (nouveau) : configuration build/ submit standard.
- ✅ `panier.tsx` : classes `text-brand-700` pour lignes total, bouton utilise composant Button (brand-700).
