# Audit de pré-production — Application mobile Toutci

Périmètre audité : `src/**` (67 fichiers, ~6 900 lignes), `app.json`, `tailwind.config.js`, `src/global.css`, `.env`, `package.json`, `assets/images`.
Aucun code modifié. Chaque point est isolé pour devenir un commit unique.

---

## [Bloquant] Géolocalisation désactivée par un flag de test codé en dur

- **Fichier(s) concerné(s) :** `src/hooks/usePosition.ts` (ligne 6 : `const TEST_MODE = true`)
- **Domaine :** 6. Géolocalisation et carte
- **Constat :** `fetchPosition()` retourne immédiatement `DEFAULT_COORDS` (Abidjan, 5.3599 / -4.0083) sans jamais appeler `expo-location` quand `TEST_MODE === true`. Le flag est à `true` dans le code courant.
- **Impact :** tous les utilisateurs sont géolocalisés à Abidjan. Au lancement à Bouaké, la requête `/restaurants?lat=…&lng=…&rayon=10` ne renverra aucun établissement local : l'app paraît vide le jour du lancement.
- **Recommandation :** supprimer le flag `TEST_MODE` et son branchement, et déplacer tout override de position dans une variable d'environnement de dev (`EXPO_PUBLIC_*`) non lue en build production.

## [Bloquant] Coordonnées par défaut sur Abidjan alors que la ville de lancement est Bouaké

- **Fichier(s) concerné(s) :** `src/hooks/usePosition.ts` (`DEFAULT_COORDS`), `src/store/slices/carteSlice.ts` (`DEFAULT_REGION`), `src/components/carte/CarteView.tsx` (`INITIAL_VIEW_STATE`)
- **Domaine :** 6. Géolocalisation et carte
- **Constat :** trois constantes de fallback pointent sur le centre d'Abidjan. Aucune notion de « ville active » n'existe côté client, alors que le produit est explicitement multi-ville.
- **Impact :** premier écran vide ou hors zone si la permission est refusée ou si le GPS est lent — cas fréquent à Bouaké. Aucune extensibilité multi-ville.
- **Recommandation :** introduire une constante unique de ville par défaut (Bouaké) consommée par les trois emplacements, en préparation d'un futur sélecteur de ville.

## [Bloquant] Identité d'application non configurée (nom, slug, scheme, bundle id, splash)

- **Fichier(s) concerné(s) :** `app.json`
- **Domaine :** 3. Gestion d'erreurs et production readiness
- **Constat :** `name: "test"`, `slug: "test"`, `scheme: "test"`, `bundleIdentifier: com.tobias-whale.test`, `package: com.tobias_whale.test`, splash `backgroundColor: "#208AEF"` (bleu), adaptive icon `#E6F4FE`. Aucun `eas.json` dans le dépôt, aucun `extra.eas.projectId`.
- **Impact :** impossible de publier sur les stores sous ce nom ; les deep links `test://` ne correspondent à aucune marque ; l'écran de démarrage n'est pas aux couleurs Banko Cloth ; les push Expo ne peuvent pas être émis sans `projectId`.
- **Recommandation :** renseigner nom/slug/scheme/bundle id/package Toutci, aligner les couleurs de splash et d'icône sur la palette, et créer `eas.json` avec `extra.eas.projectId`.

## [Bloquant] `projectId` push absent : les notifications ne peuvent pas être enregistrées

- **Fichier(s) concerné(s) :** `src/hooks/usePushNotifications.ts` (`getProjectId()`), `app.json`
- **Domaine :** 3. Gestion d'erreurs et production readiness
- **Constat :** `getExpoPushTokenAsync` est appelé avec `undefined` si `Constants.expoConfig.extra.eas.projectId` et `Constants.easConfig.projectId` sont absents — ce qui est le cas. L'échec est avalé par un `catch {}` qui retourne `null`.
- **Impact :** aucun token push n'est obtenu en build EAS → aucune notification de suivi de commande, silencieusement, sans trace.
- **Recommandation :** ajouter `extra.eas.projectId` et faire remonter l'échec d'enregistrement (log/telemetry) au lieu de l'avaler.

## [Bloquant] Démarrage à froid bloqué par jusqu'à trois appels réseau sans timeout

- **Fichier(s) concerné(s) :** `src/store/slices/authSlice.ts` (`loadToken`), `src/app/_layout.tsx` (`if (isLoading) return null`)
- **Domaine :** 2. Robustesse réseau et mode dégradé
- **Constat :** `loadToken()` enchaîne séquentiellement `GET /auth/me`, `POST /auth/refresh`, puis un second `GET /auth/me`, en `fetch` nu sans `AbortController` ni timeout. Le splash reste affiché tant que `isLoading` est vrai.
- **Impact :** sur une connexion 2G/EDGE instable, l'application reste bloquée sur le splash screen indéfiniment. C'est le pire scénario possible pour le contexte de lancement.
- **Recommandation :** ajouter un timeout global (ex. 5 s) à la séquence `loadToken` avec bascule en session anonyme au-delà, sans changer la logique de refresh.

## [Bloquant] Aucun appel réseau ne possède de timeout ni d'`AbortController`

- **Fichier(s) concerné(s) :** `src/lib/api.ts` (`apiFetch`, `tryRefreshToken`), `src/store/slices/authSlice.ts` (3 `fetch`)
- **Domaine :** 2. Robustesse réseau et mode dégradé
- **Constat :** `apiFetch` est le point d'entrée de tous les hooks (`useCommandesClient`, `useCommandeTracking`, `useMenuRestaurant`, `useRestaurantsProches`, `useGeoSearch`, `useRestaurantSearch`, `useEnvoyerCommande`, `syncPushToken`) et n'expose ni `signal` ni délai maximal. Note : `fetchOsrmRoute` mentionné dans le brief **n'existe pas** dans le code actuel (aucune occurrence de `osrm` / `itineraire` côté appel) — le problème est en réalité généralisé à l'ensemble des appels via `apiFetch`.
- **Impact :** un serveur lent laisse les écrans en chargement infini ; les mutations de commande peuvent rester « en cours » sans réponse ni possibilité d'annulation.
- **Recommandation :** ajouter un timeout paramétrable et le passage du `signal` de TanStack Query dans `apiFetch`, une seule fois, au niveau de cette fonction.

## [Bloquant] Le total du panier n'est pas égal à la somme affichée (frais d'emballage cachés)

- **Fichier(s) concerné(s) :** `src/app/(tabs)/panier.tsx` (lignes 33, 227, 329-341)
- **Domaine :** 1. Friction utilisateur / UX
- **Constat :** `total = sousTotal + fraisLivraison + FRAIS_EMBALLAGE` (200 F) mais le récapitulatif n'affiche que « Sous-total » et « Frais de livraison ». Les 200 F d'emballage n'apparaissent nulle part.
- **Impact :** l'utilisateur voit un total supérieur à la somme des lignes → perte de confiance immédiate, litiges au paiement. Problème de conformité commerciale.
- **Recommandation :** afficher une ligne « Frais d'emballage » dans le récapitulatif, ou retirer ce montant du calcul — un seul choix, dans ce fichier.

## [Bloquant] Les frais de livraison et le total sont calculés côté client, à partir d'un paramètre d'URL

- **Fichier(s) concerné(s) :** `src/app/(tabs)/panier.tsx` (lignes 187-201), `src/components/menu/PanierFAB.tsx` (lignes 22-27)
- **Domaine :** 10. Sécurité côté mobile
- **Constat :** les frais viennent de `useLocalSearchParams().frais`, injectés par le FAB depuis `restaurant.fraisLivraison`. `Number(fraisStr ?? 500)` renvoie `NaN` si le paramètre est malformé, et vaut 500 F en dur si l'utilisateur ouvre l'onglet Panier directement (cas le plus courant : le FAB n'est pas le seul chemin).
- **Impact :** total affiché différent du total facturé par le backend ; affichage `NaN FCFA` possible ; montant manipulable.
- **Recommandation :** faire de la tarification une donnée serveur (récupérée via le slug du panier), et supprimer le passage des frais par paramètre d'URL.

## [Bloquant] Redirection post-commande possible vers un identifiant vide

- **Fichier(s) concerné(s) :** `src/components/panier/FormulaireCommande.tsx` (`onSuccess(result?.id ?? "")`), `src/hooks/useEnvoyerCommande.ts`, `src/app/(tabs)/panier.tsx` (`handleCommandeSuccess`)
- **Domaine :** 3. Gestion d'erreurs et production readiness
- **Constat :** `useEnvoyerCommande` tente quatre formes de réponse pour extraire l'`id` et retourne `{ id: "" }` en dernier recours. `handleCommandeSuccess` navigue vers `/(tabs)/commandes/` puis vide le panier. Sur l'écran détail, `useCommandeTracking(null|"")` a `enabled: false`, donc `isLoading` reste `true` → `ActivityIndicator` permanent.
- **Impact :** commande créée mais panier vidé et écran de suivi bloqué en spinner infini : l'utilisateur croit avoir perdu sa commande. Scénario d'appel au support garanti.
- **Recommandation :** traiter l'absence d'`id` comme une erreur explicite dans `useEnvoyerCommande` (pas de fallback `""`), et n'appeler `onSuccess` qu'avec un id non vide.

## [Bloquant] Deep link de notification vers une route inexistante

- **Fichier(s) concerné(s) :** `src/hooks/usePushNotifications.ts` (`router.push(\`/commandes/${data.commandeId}\`)`)
- **Domaine :** 3. Gestion d'erreurs et production readiness
- **Constat :** le groupe `src/app/commandes/` ne contient que `historique.tsx` et un `_layout` protégé. L'écran de détail réel est `src/app/(tabs)/commandes/[id].tsx`.
- **Impact :** taper sur une notification « votre commande est prête » n'ouvre pas la commande (route introuvable) — le canal de rétention principal est cassé.
- **Recommandation :** corriger la cible de navigation vers `/(tabs)/commandes/[id]` dans ce hook.

---

## [Critique] Panier non persisté : perdu à chaque fermeture de l'app

- **Fichier(s) concerné(s) :** `src/store/slices/panierSlice.ts`, `src/store/index.ts`
- **Domaine :** 4. Cohérence de la gestion d'état
- **Constat :** aucun middleware `persist` n'est appliqué au store ; `items` et `restaurantSlug` vivent uniquement en mémoire.
- **Impact :** en contexte de connexion instable (app tuée par le système, changement d'app pour vérifier un SMS), le panier est vidé → abandon de commande. Impact direct sur le chiffre.
- **Recommandation :** ajouter la persistance du seul `panierSlice` (items + restaurantSlug) avec un stockage asynchrone non chiffré.

## [Critique] Ajout d'un plat d'un autre établissement échoue silencieusement

- **Fichier(s) concerné(s) :** `src/components/menu/MenuBottomSheet.tsx` (`handleAjouter`, lignes 88-97)
- **Domaine :** 1. Friction utilisateur / UX
- **Constat :** si `storeRestaurantSlug !== slug`, la fonction déclenche un simple haptique `Warning` et `return` — aucun message, aucune alerte, aucune proposition de vider le panier.
- **Impact :** l'utilisateur appuie sur « + » plusieurs fois sans effet visible et conclut que l'app est cassée. Perte de commande dans le cas d'usage le plus banal (changer de restaurant).
- **Recommandation :** afficher une confirmation « Vider le panier et commander ici ? » à cet endroit précis.

## [Critique] Toutes les entrées du menu Profil sont inertes (`onPress` commenté)

- **Fichier(s) concerné(s) :** `src/app/(tabs)/profil.tsx` (`MenuRow`, ligne 64)
- **Domaine :** 1. Friction utilisateur / UX
- **Constat :** `onPress={onPress ?? (() => route && router.push(route))}` est commenté ; le `Pressable` est rendu sans handler. Les six lignes (Historique, Adresses, Paiement, Coupons, Support, À propos) affichent un chevron mais ne font rien.
- **Impact :** six affordances mortes sur l'écran Profil, dont Support — l'utilisateur bloqué ne peut pas trouver d'aide.
- **Recommandation :** rebrancher la navigation dans `MenuRow`, ou masquer les entrées non branchées (une seule décision, ce fichier).

## [Critique] Aucun error boundary, aucune route `+not-found`

- **Fichier(s) concerné(s) :** `src/app/_layout.tsx`
- **Domaine :** 3. Gestion d'erreurs et production readiness
- **Constat :** aucun `ErrorBoundary` exporté par les layouts Expo Router, aucun fichier `+not-found.tsx`, aucun service de reporting de crash.
- **Impact :** toute exception de rendu provoque un écran rouge en dev et un crash silencieux en production, sans trace exploitable ni chemin de récupération.
- **Recommandation :** ajouter un `ErrorBoundary` au layout racine avec écran de récupération, dans un commit dédié.

## [Critique] TanStack Query sans politique réseau adaptée au mode dégradé

- **Fichier(s) concerné(s) :** `src/app/_layout.tsx` (`new QueryClient()`)
- **Domaine :** 2. Robustesse réseau et mode dégradé
- **Constat :** le client est instancié sans `defaultOptions` : pas de `retry` maîtrisé, pas de `staleTime` global, pas de `gcTime`, pas de persistance de cache, pas de `networkMode`.
- **Impact :** aucune donnée disponible hors ligne (menus, commandes) ; en réseau lent chaque écran repart de zéro ; les mutations ne sont pas mises en file.
- **Recommandation :** définir un `defaultOptions` unique (retry borné, staleTime, gcTime) au niveau du QueryClient.

## [Critique] Polling de suivi de commande toutes les 5 s sans dégradation

- **Fichier(s) concerné(s) :** `src/hooks/useCommandeTracking.ts` (`POLL_INTERVAL_MS = 5000`)
- **Domaine :** 2. Robustesse réseau et mode dégradé
- **Constat :** intervalle fixe de 5 s jusqu'à un statut terminal, sans back-off, sans prise en compte de l'état de connexion (`useConnectivite` n'est pas consulté), sans plafond de durée.
- **Impact :** consommation de data et de batterie significative sur forfaits prépayés ivoiriens ; empilement de requêtes en échec sur réseau instable.
- **Recommandation :** introduire un back-off progressif et une suspension du polling hors connexion dans ce hook.

## [Critique] Écran d'erreur de localisation inatteignable (`positionError` toujours `null`)

- **Fichier(s) concerné(s) :** `src/hooks/usePosition.ts` (`setError` jamais appelé), `src/app/(tabs)/index.tsx` (bloc `if (positionError)`)
- **Domaine :** 6. Géolocalisation et carte
- **Constat :** `usePosition` avale tous les cas d'échec (service désactivé, permission refusée, exception) par des `return` silencieux et ne renseigne jamais `error`. Le bloc « Localisation requise » de l'écran carte est donc du code mort.
- **Impact :** permission refusée = carte centrée sur Abidjan sans explication ni bouton pour ouvrir les réglages. L'utilisateur ne comprend pas pourquoi aucun établissement n'apparaît.
- **Recommandation :** renseigner `error` pour les cas « permission refusée » et « service désactivé » dans `usePosition`.

## [Critique] Trois conventions de coordonnées incompatibles — occurrence 1 : `usePosition`

- **Fichier(s) concerné(s) :** `src/hooks/usePosition.ts`
- **Domaine :** 6. Géolocalisation et carte
- **Constat :** expose `{ latitude, longitude }` et un type `Coords` local, non partagé avec `src/types/index.ts`. Le retour est typé `coords: Coords` (jamais `null`) alors que l'appelant fait `coords?.latitude`.
- **Impact :** typage trompeur ; `showEmptyState` de l'écran carte teste `coords` qui est toujours truthy, donc l'état vide s'affiche même sans position réelle.
- **Recommandation :** déplacer `Coords` dans `src/types` comme convention unique et corriger la nullabilité du retour.

## [Critique] Conventions de coordonnées — occurrence 2 : `useRestaurantsProches` (scalaires + `lng`)

- **Fichier(s) concerné(s) :** `src/hooks/useRestaurantsProches.ts`
- **Domaine :** 6. Géolocalisation et carte
- **Constat :** signature en arguments scalaires `(lat, lon, rayon, cuisine)`, puis construction d'URL avec `lat=…&lng=…`. Trois nommages (`lat`, `lon`, `lng`) pour deux valeurs, sans objet typé.
- **Impact :** inversion latitude/longitude trivialement possible à l'appel (aucune protection de type), donnant une liste vide ou des distances absurdes.
- **Recommandation :** remplacer les paramètres scalaires par un objet `Coords` unique dans ce hook.

## [Critique] Conventions de coordonnées — occurrence 3 : `useGeoSearch` (`lat`/`lng` → `lat`/`lon`)

- **Fichier(s) concerné(s) :** `src/hooks/useGeoSearch.ts` (`mapToSuggestion`), `src/types/index.ts` (`GeocodeResult` en `lat`/`lng`, `Suggestion` en `lat`/`lon`)
- **Domaine :** 6. Géolocalisation et carte
- **Constat :** le backend renvoie `{ lat, lng }`, le type `Suggestion` utilise `{ lat, lon }` ; la conversion est manuelle et non testée.
- **Impact :** toute évolution du type `Suggestion` casse silencieusement le centrage de carte, sans erreur TypeScript côté appelant.
- **Recommandation :** unifier `Suggestion` sur la même convention que `Coords` et supprimer le mapping manuel.

## [Critique] Conventions de coordonnées — occurrence 4 : `SearchBar` → `flyTo` (inversion manuelle)

- **Fichier(s) concerné(s) :** `src/components/carte/SearchBar.tsx` (`onSelectSuggestion(item.lat, item.lon)`), `src/app/(tabs)/index.tsx` (`carteRef.current?.flyTo([lon, lat], 15)`)
- **Domaine :** 6. Géolocalisation et carte
- **Constat :** la suggestion transmet `(lat, lon)` en scalaires, l'écran carte réinverse manuellement en `[lon, lat]` pour MapLibre, et `handleRecentrer` refait la même inversion à un autre endroit.
- **Impact :** deux inversions manuelles dupliquées : une régression sur l'une seulement enverra la carte au milieu de l'océan (bug classique lat/lng).
- **Recommandation :** faire de `flyTo` un consommateur d'objet `Coords` et centraliser la conversion en tuple MapLibre dans `CarteView`.

## [Critique] Conventions de coordonnées — occurrence 5 : `useRestaurantSearch`

- **Fichier(s) concerné(s) :** `src/hooks/useRestaurantSearch.ts` (`lat: r.latitude, lon: r.longitude`)
- **Domaine :** 6. Géolocalisation et carte
- **Constat :** troisième mapping manuel (`latitude/longitude` → `lat/lon`), sans garde si le backend renvoie `geo: { latitude, longitude }` (champ prévu dans `Restaurant`).
- **Impact :** suggestions restaurant avec coordonnées `undefined` → `flyTo([undefined, undefined])` et carte figée ou crash native.
- **Recommandation :** normaliser les coordonnées restaurant à un seul endroit et valider leur présence avant de produire une suggestion.

## [Critique] Token JWT et données PII écrits dans les logs de production

- **Fichier(s) concerné(s) :** `src/lib/api.ts` (5 `console.warn/log/error`), `src/components/panier/FormulaireCommande.tsx` (`console.log` du payload complet)
- **Domaine :** 10. Sécurité côté mobile
- **Constat :** `apiFetch` journalise l'absence de token, la récupération depuis SecureStore, les 401 et le corps d'erreur ; `FormulaireCommande` journalise le payload complet (téléphone, adresse de livraison, notes) via `JSON.stringify(payload, null, 2)`.
- **Impact :** numéros de téléphone et adresses de clients visibles dans `adb logcat` / Console iOS et dans tout SDK de crash récoltant les logs — problème de confidentialité.
- **Recommandation :** retirer les logs de payload et d'authentification, ou les conditionner à `__DEV__`, fichier par fichier.

## [Critique] `alert()` brut affichant un message serveur au login

- **Fichier(s) concerné(s) :** `src/app/auth/login.tsx` (ligne 74 : `alert(error.message)`)
- **Domaine :** 3. Gestion d'erreurs et production readiness
- **Constat :** en plus de `setServerError`, un `alert()` global affiche le message brut renvoyé par l'API (ex. « Erreur 500 »). Double affichage de la même erreur.
- **Impact :** message technique non traduit, non maîtrisé, présenté deux fois — perception d'app non finie dès le premier écran authentifié.
- **Recommandation :** supprimer l'`alert()` et ne conserver que l'affichage `serverError` déjà stylé.

## [Critique] `URL` de base avec slash final : chemins d'API en `//`

- **Fichier(s) concerné(s) :** `.env` (`EXPO_PUBLIC_API_URL="https://restauci.vercel.app/"`), `src/constants/api.ts`
- **Domaine :** 2. Robustesse réseau et mode dégradé
- **Constat :** tous les endpoints commencent par `/api/v1/…` et sont concaténés directement : `https://restauci.vercel.app//api/v1/...`. La valeur est de plus entourée de guillemets dans le `.env`.
- **Impact :** selon le routage Vercel, 404 ou redirection supplémentaire sur chaque appel — latence accrue et échecs difficiles à diagnostiquer en production.
- **Recommandation :** normaliser `API_URL` (suppression du slash final) dans `src/constants/api.ts`.

## [Critique] Le domaine API et l'identité visuelle réfèrent encore « RestauCi », pas Toutci

- **Fichier(s) concerné(s) :** `src/app/(tabs)/commandes/[id].tsx` (lignes 106-116 : « Restau » / « C » / « i » en dur), `src/app/(tabs)/profil.tsx` et `src/app/auth/*` (`logo-restauci.png`, `logo-restauci2.png`)
- **Domaine :** 7. Cohérence du design system
- **Constat :** le header de l'écran de suivi compose le mot « RestauCi » en trois `Text`, et les logos importés portent le nom `restauci`.
- **Impact :** incohérence de marque sur les écrans les plus vus (suivi de commande, connexion, profil) au moment du lancement Toutci.
- **Recommandation :** remplacer le lettrage en dur par le logo Toutci et renommer les assets, écran par écran.

## [Critique] La promesse « livraison offerte dès 2 000 F » n'est jamais appliquée

- **Fichier(s) concerné(s) :** `src/app/(tabs)/panier.tsx` (`SEUIL_LIVRAISON_OFFERTE`, calcul `total`)
- **Domaine :** 1. Friction utilisateur / UX
- **Constat :** la bannière annonce la gratuité au-delà de 2 000 F, mais `fraisLivraison` est ajouté au total sans condition sur `sousTotal`.
- **Impact :** promesse commerciale affichée puis non tenue à l'écran de paiement — motif de litige et de désinstallation.
- **Recommandation :** soit appliquer la règle dans le calcul du total, soit retirer la bannière jusqu'à ce que le backend porte la règle. Une seule décision, ce fichier.

---

## [Majeur] Classes Tailwind invalides sur l'écran carte (couleurs inexistantes)

- **Fichier(s) concerné(s) :** `src/app/(tabs)/index.tsx` (`bg-[green-500]` ×2, `ActivityIndicator color="green-500"`)
- **Domaine :** 7. Cohérence du design system
- **Constat :** `bg-[green-500]` est une valeur arbitraire invalide (attend un code couleur), et `color="green-500"` n'est pas une couleur RN valide.
- **Impact :** boutons « Réessayer » sans fond (texte blanc sur blanc, invisible) et spinner de couleur par défaut. Deux états d'erreur illisibles.
- **Recommandation :** remplacer par les tokens Banko (`bg-green-800`, couleur hex du token) dans ce fichier.

## [Majeur] Classes invalides sur l'écran d'onboarding

- **Fichier(s) concerné(s) :** `src/app/index.tsx` (`bg-[ink-100]`, `text-[green-900]` ×2, `text-[#457b3b]`)
- **Domaine :** 7. Cohérence du design system
- **Constat :** valeurs arbitraires non résolues pour les tokens, mêlées à un hex codé en dur pour le vert Palm.
- **Impact :** titres de l'écran d'accueil rendus en couleur par défaut (noir) au lieu de Banko Green ; première impression hors charte.
- **Recommandation :** convertir ces classes en tokens (`bg-ink-100`, `text-green-900`, `text-brand-500`).

## [Majeur] Tokens sémantiques `danger` / `warning` utilisés avec des modificateurs d'opacité invalides

- **Fichier(s) concerné(s) :** `src/components/ui/badge.tsx` (`bg-danger/10`, `text-danger`, `bg-warning/10`), `src/components/commandes/CommandeCard.tsx` (`bg-warning/10`, `text-warning`, `text-danger`, `bg-danger/10`, `border-danger`, `border-warning`)
- **Domaine :** 7. Cohérence du design system
- **Constat :** `danger` est défini comme une échelle (`50/200/600/700`) sans clé `DEFAULT` dans `tailwind.config.js` : `text-danger` et `bg-danger/10` ne produisent aucune règle. `warning` est un scalaire, `bg-warning/10` fonctionne mais n'est jamais utilisé ailleurs.
- **Impact :** badges de statut « Annulée » et « En cours » sans couleur de fond ni de texte : l'information de statut, cœur du suivi de commande, est illisible.
- **Recommandation :** ajouter les clés `DEFAULT` manquantes au thème, ou remplacer les classes par `danger-600` / `warning` explicites. Traiter `tailwind.config.js` d'abord, puis chaque composant.

## [Majeur] Codes hexadécimaux passés comme classes CSS dans `CommandeCard`

- **Fichier(s) concerné(s) :** `src/components/commandes/CommandeCard.tsx` (`getBadgeStyle()` : `bg: "#f0fdf4"`, `text: "#166534"`)
- **Domaine :** 7. Cohérence du design system
- **Constat :** le cas `livrees` renvoie des hex bruts, ensuite interpolés dans `className={\`… ${badge.bg}\`}` — un hex n'est pas un nom de classe. Les autres cas renvoient des classes. Le contrat de la fonction est incohérent.
- **Impact :** badge « Livrée » sans style, alors que les autres statuts en ont : incohérence visible sur la liste des commandes.
- **Recommandation :** homogénéiser `getBadgeStyle()` pour ne renvoyer que des classes de tokens.

## [Majeur] Classes de style dynamiques non compilables dans le formulaire de commande

- **Fichier(s) concerné(s) :** `src/components/panier/FormulaireCommande.tsx` (lignes 62-65 `MODE_COLORS`, lignes 290-305 `border-[${MODE_COLORS[mode]}]`, `bg-[${…}10]`, `text-[${…}]`)
- **Domaine :** 7. Cohérence du design system
- **Constat :** les classes sont construites par interpolation à l'exécution (`border-[info]`, `bg-[info10]`) : NativeWind/Tailwind ne peut pas les générer statiquement, et les valeurs (`"info"`, `"warning"`) ne sont pas des couleurs.
- **Impact :** le sélecteur Livraison / À emporter n'a aucune indication visuelle de sélection. L'utilisateur ne sait pas quel mode est actif au moment de confirmer — cause directe d'erreurs de commande.
- **Recommandation :** remplacer par deux jeux de classes statiques conditionnels dans ce composant.

## [Majeur] Variables CSS HSL malformées : tous les tokens shadcn sont cassés

- **Fichier(s) concerné(s) :** `src/global.css` (`--foreground: 221 39 11`, `--primary: 143 64 24`, etc.), `tailwind.config.js` (`hsl(var(--primary))`)
- **Domaine :** 7. Cohérence du design system
- **Constat :** les valeurs HSL omettent le `%` sur saturation et luminosité (`hsl(221 39 11)` est invalide ; seul `--background: 0 0% 100%` est correct). En conséquence `text-foreground`, `bg-primary`, `border-border`, `bg-muted`, `text-muted-foreground` ne produisent rien.
- **Impact :** tous les composants React Native Reusables (`text.tsx`, `input.tsx`, `card.tsx`, `badge.tsx`) rendent leur texte et leurs bordures en couleurs par défaut, d'où le recours généralisé à des classes de secours dans les écrans. Dérive visuelle systémique.
- **Recommandation :** corriger le format des variables HSL dans `src/global.css` en un seul commit, puis revalider les composants ui.

## [Majeur] Tokens `bg-card` / `text-card-foreground` non définis

- **Fichier(s) concerné(s) :** `src/components/ui/card.tsx`, `tailwind.config.js`
- **Domaine :** 7. Cohérence du design system
- **Constat :** `Card` applique `bg-card` et fournit `text-card-foreground` via `TextClassContext`, or ni `card` ni `card-foreground` n'existent dans le thème.
- **Impact :** toutes les cartes (menu, commandes, header restaurant) sont transparentes par défaut et compensées ailleurs par `bg-white` en dur — d'où des cartes au fond incohérent selon l'écran.
- **Recommandation :** définir les tokens `card` / `card-foreground` dans le thème.

## [Majeur] Classes d'espacement et de rayon inexistantes dans le skeleton et la carte plat

- **Fichier(s) concerné(s) :** `src/components/ui/SkeletonCard.tsx` (`w-18 h-18`, `rounded-2.5`, `rounded-1.5`, `w-9/10`), `src/components/menu/CartePlatMobile.tsx` (`w-18 h-18`, `leading-5.5`)
- **Domaine :** 7. Cohérence du design system
- **Constat :** ces utilitaires n'existent pas dans l'échelle Tailwind par défaut et ne sont pas ajoutés au thème.
- **Impact :** placeholders de chargement aux dimensions incorrectes (effet « cassé » pendant le temps de chargement, justement le moment le plus visible en réseau lent) et vignettes de plats non contraintes.
- **Recommandation :** remplacer par des valeurs valides (`w-[72px] h-[72px]`, `rounded-xl`, etc.) dans ces deux fichiers.

## [Majeur] Le compteur du panier est recalculé et dupliqué à trois endroits

- **Fichier(s) concerné(s) :** `src/app/(tabs)/_layout.tsx` (lignes 148-150), `src/components/menu/PanierFAB.tsx` (ligne 18), `src/store/slices/panierSlice.ts` (`nombreArticles()` jamais utilisé)
- **Domaine :** 4. Cohérence de la gestion d'état
- **Constat :** deux `reduce` inline dans des sélecteurs Zustand (recréant un nombre à chaque changement d'état du store, y compris auth) alors que le slice fournit déjà `nombreArticles()`, non utilisé. Vérification demandée sur les compteurs de notifications non lues : **il n'existe aucun compteur de notifications non lues dans l'app** — le doublon réel concerne le badge panier.
- **Impact :** re-render du `TabLayout` (donc de l'arbre des onglets, carte incluse) à chaque mutation du store, et risque de divergence entre badge d'onglet et badge du FAB.
- **Recommandation :** exposer un sélecteur unique de quantité totale et le consommer aux deux emplacements.

## [Majeur] `useStore` monolithique : chaque écran se réabonne à un store contenant auth + panier + carte + favoris + adresses

- **Fichier(s) concerné(s) :** `src/store/index.ts`
- **Domaine :** 4. Cohérence de la gestion d'état
- **Constat :** un seul `create()` sans `subscribeWithSelector` ni comparateurs ; plusieurs sélecteurs retournent des valeurs dérivées calculées (`items.find(...)?.quantite`, `items.reduce(...)`).
- **Impact :** re-renders en cascade sur la liste des plats et la tab bar lors de chaque ajout au panier ; ressenti de lenteur sur les appareils d'entrée de gamme visés.
- **Recommandation :** ajouter des sélecteurs dérivés stables (ou `useShallow`) au niveau du store, sans découper les slices.

## [Majeur] Sources de vérité dupliquées entre `useCommandesClient` et `useCommandeTracking`

- **Fichier(s) concerné(s) :** `src/hooks/useCommandesClient.ts` (clé `["commandes"]`), `src/hooks/useCommandeTracking.ts` (clé `["commande-tracking", id]`)
- **Domaine :** 4. Cohérence de la gestion d'état
- **Constat :** deux caches indépendants pour la même entité. Le passage à un statut terminal détecté par le tracking n'invalide jamais `["commandes"]` (`staleTime` 2 min).
- **Impact :** la liste « Mes commandes » affiche « en route » alors que l'écran de détail affiche « Livrée » : incohérence directement visible par l'utilisateur.
- **Recommandation :** invalider la liste depuis le hook de tracking lors d'un changement de statut.

## [Majeur] L'écran d'accueil et l'onboarding ne sont pas conditionnés (onboarding rejoué à chaque lancement)

- **Fichier(s) concerné(s) :** `src/app/index.tsx`
- **Domaine :** 1. Friction utilisateur / UX
- **Constat :** la route racine est l'écran d'onboarding, sans persistance d'un flag « déjà vu », et les trois points de pagination sont décoratifs (une seule page, deux liens identiques vers `/(tabs)`).
- **Impact :** un utilisateur fidèle traverse l'onboarding à chaque ouverture : une étape parasite avant chaque commande.
- **Recommandation :** persister un flag « onboarding vu » et rediriger directement vers `/(tabs)`.

## [Majeur] Session : `router.back()` après connexion/inscription

- **Fichier(s) concerné(s) :** `src/app/auth/login.tsx` (ligne 70), `src/app/auth/register.tsx` (`router.back()`)
- **Domaine :** 1. Friction utilisateur / UX
- **Constat :** le retour se fait à l'aveugle sur l'écran précédent. Depuis un deep link de notification ou depuis le tab Profil (qui pousse `/auth/login`), la pile peut être vide ou renvoyer sur un écran non pertinent.
- **Impact :** utilisateur connecté renvoyé hors de son parcours (voire fermeture de la modale sur un écran vide) juste avant de commander.
- **Recommandation :** remplacer par une redirection explicite selon l'intention d'origine (paramètre `redirect`).

## [Majeur] `Alert.alert` de validation en doublon du schéma Zod

- **Fichier(s) concerné(s) :** `src/components/panier/FormulaireCommande.tsx` (`onSubmit`, lignes 160-200)
- **Domaine :** 5. Formulaires et validation
- **Constat :** `onSubmit` n'est appelé qu'après validation Zod réussie, mais revérifie manuellement téléphone, adresse et panier avec trois `Alert.alert` — code inatteignable pour les deux premiers.
- **Impact :** logique de validation dédoublée, messages divergents entre les erreurs inline (`errors.telephone`) et les alertes ; maintenance à deux endroits.
- **Recommandation :** supprimer les revalidations redondantes et ne conserver que la vérification du panier non vide.

## [Majeur] Le schéma Zod du formulaire ne valide pas le format ivoirien réel

- **Fichier(s) concerné(s) :** `src/components/panier/FormulaireCommande.tsx` (`/^\+?[0-9\s]{8,20}$/`), `src/app/auth/login.tsx` (`/^[0-9\s]{8,20}$/`), `src/app/auth/register.tsx` (`/^[0-9\s]{8,20}$/`)
- **Domaine :** 5. Formulaires et validation
- **Constat :** trois expressions régulières différentes pour le même numéro, avec préfixe `+225` ajouté par concaténation dans deux fichiers et attendu dans le champ dans un troisième ; aucune contrainte sur les 10 chiffres du plan de numérotation ivoirien, ni `maxLength` sur les champs.
- **Impact :** numéros invalides acceptés côté client puis rejetés côté serveur, ou commandes non joignables par le livreur — cause n°1 d'échec de livraison.
- **Recommandation :** centraliser un schéma « téléphone CI » unique dans `src/lib` et le réutiliser (traiter d'abord la création du schéma, puis chaque formulaire).

## [Majeur] Aucune protection contre la double soumission de commande

- **Fichier(s) concerné(s) :** `src/components/panier/FormulaireCommande.tsx` (bouton `disabled={isPending}`), `src/hooks/useEnvoyerCommande.ts`
- **Domaine :** 5. Formulaires et validation
- **Constat :** la seule garde est `isPending`. Aucune clé d'idempotence n'est envoyée, et le `BottomSheetModal` reste ouvert et refermable/réouvrable pendant l'envoi (`enablePanDownToClose`).
- **Impact :** sur réseau lent, un utilisateur qui ferme puis rouvre la feuille et re-soumet crée deux commandes réelles → double facturation, double préparation, litige partenaire.
- **Recommandation :** ajouter une clé d'idempotence au payload et empêcher la fermeture de la feuille pendant `isPending`.

## [Majeur] `SecureStore` utilisé comme base de données locale (favoris, adresses)

- **Fichier(s) concerné(s) :** `src/store/slices/favorisSlice.ts`, `src/store/slices/adressesSlice.ts`
- **Domaine :** 10. Sécurité côté mobile
- **Constat :** des listes JSON complètes sont écrites dans `SecureStore`, dont la valeur est limitée (≈2 048 octets sur Android) et l'accès est lent (chiffrement par entrée). Les écritures ne sont pas protégées par try/catch.
- **Impact :** au-delà d'une dizaine de favoris/adresses, l'écriture échoue et lève une exception non capturée → perte de données silencieuse voire crash.
- **Recommandation :** déplacer ces deux collections vers un stockage asynchrone non chiffré, en conservant `SecureStore` uniquement pour les tokens.

## [Majeur] Favoris jamais chargés hors de l'écran restaurant

- **Fichier(s) concerné(s) :** `src/app/(tabs)/profil.tsx` (charge seulement `loadAdresses`), `src/components/menu/HeaderRestaurant.tsx` (`loadFavorites` dans un `useEffect`)
- **Domaine :** 4. Cohérence de la gestion d'état
- **Constat :** `loadFavorites()` n'est appelé que depuis le header restaurant ; le Profil affiche `favorites.length` sans avoir hydraté le slice.
- **Impact :** la statistique « Favoris » affiche 0 pour un utilisateur qui en a enregistré — donnée fausse sur l'écran de compte.
- **Recommandation :** hydrater favoris et adresses au démarrage (layout racine) au lieu d'un chargement opportuniste par écran.

## [Majeur] Assets images non optimisés embarqués dans le bundle

- **Fichier(s) concerné(s) :** `assets/images/food2.jpeg` (2,4 Mo), `default_hero_bg.jpg` (1,0 Mo), `food_bowl.png` (0,98 Mo), `icon.png` (0,8 Mo), `livreur-scooter2.jpeg` (0,4 Mo), `logo-glow.png` (0,33 Mo)
- **Domaine :** 8. Performance
- **Constat :** ~6 Mo d'images non redimensionnées, dont `food2.jpeg` utilisé en `ImageBackground` plein écran sur l'onboarding et `food_bowl.png` / `livreur-scooter*.jpeg` / `logo-glow.png` qui ne sont référencés nulle part dans `src/`.
- **Impact :** taille d'APK/IPA inutilement grande (téléchargement coûteux sur data prépayée) et pic mémoire au démarrage sur appareils d'entrée de gamme.
- **Recommandation :** redimensionner/compresser les images réellement utilisées et signaler pour suppression celles non référencées.

## [Majeur] `Image` de `react-native` utilisée pour des URLs distantes dans le panier

- **Fichier(s) concerné(s) :** `src/app/(tabs)/panier.tsx` (`ArticleRow`, lignes 91-105)
- **Domaine :** 8. Performance
- **Constat :** le reste de l'app utilise `expo-image` (cache disque, blurhash, transition) ; le panier utilise `Image` de RN, avec en fallback une image **Unsplash distante codée en dur**.
- **Impact :** pas de cache, images qui clignotent, et sur réseau coupé un placeholder distant qui ne charge jamais → panier visuellement cassé hors ligne.
- **Recommandation :** migrer ce composant sur `expo-image` avec un placeholder local.

## [Majeur] Dépendances lourdes non utilisées dans le bundle

- **Fichier(s) concerné(s) :** `package.json` (`@expo/ui`, `expo-glass-effect`, `expo-symbols`, `expo-device`, `expo-web-browser`, `expo-system-ui`, `react-dom`, `react-native-web`, `tailwindcss-animate`)
- **Domaine :** 8. Performance
- **Constat :** aucune occurrence de ces modules dans `src/` (vérifié par recherche). `react-dom`/`react-native-web` ne servent qu'à une cible web non utilisée par l'app mobile.
- **Impact :** temps de build et taille de bundle accrus, surface de maintenance et de mise à jour Expo inutile.
- **Recommandation :** signaler ces dépendances pour retrait après vérification écran par écran (aucune suppression automatique).

## [Majeur] Aucun libellé d'accessibilité sur les actions à icône seule

- **Fichier(s) concerné(s) :** `src/components/carte/CarteView.tsx` (zoom + / −), `src/app/(tabs)/index.tsx` (recentrer), `src/components/menu/HeaderRestaurant.tsx` (retour, favori, partage, itinéraire), `src/components/menu/PanierFAB.tsx`, `src/app/(tabs)/panier.tsx` (`QuantiteControl`)
- **Domaine :** 9. Accessibilité
- **Constat :** aucun `accessibilityLabel` / `accessibilityRole` sur ces `TouchableOpacity` / `Pressable` ; les boutons de zoom utilisent les caractères `+` et `−` comme seul contenu.
- **Impact :** application inutilisable au lecteur d'écran (TalkBack/VoiceOver) sur les parcours clés — commander devient impossible pour un utilisateur malvoyant.
- **Recommandation :** ajouter les libellés d'accessibilité, fichier par fichier, en commençant par le parcours de commande.

## [Majeur] Zones tactiles sous le minimum recommandé

- **Fichier(s) concerné(s) :** `src/app/(tabs)/panier.tsx` (`h-9 w-9` = 36 px, bouton « Supprimer » `px-2.5 py-1.5`), `src/components/menu/CartePlatMobile.tsx` (`w-9 h-9`), `src/components/carte/CarteView.tsx` (`h-11 w-11`)
- **Domaine :** 9. Accessibilité
- **Constat :** les contrôles de quantité mesurent 36×36 px sans `hitSlop`, sous le minimum de 44×44 (iOS HIG) / 48 dp (Android).
- **Impact :** erreurs de manipulation sur les quantités — au mieux frustration, au pire commandes erronées.
- **Recommandation :** porter ces cibles à 44 px ou ajouter `hitSlop`, dans les deux fichiers concernés.

## [Majeur] `usePosition` — permission demandée dès le premier écran de carte sans contexte

- **Fichier(s) concerné(s) :** `src/hooks/usePosition.ts` (`fetchPosition` au montage), `src/hooks/usePushNotifications.ts` (`registerForPushNotificationsAsync()` au montage du layout racine)
- **Domaine :** 1. Friction utilisateur / UX
- **Constat :** deux permissions système (localisation, notifications) sont demandées au démarrage, celle des notifications avant même que l'utilisateur ait passé une commande, et sans écran explicatif préalable.
- **Impact :** taux de refus élevé et irréversible (iOS ne redemande pas), ce qui casse durablement le suivi de commande et la pertinence géographique.
- **Recommandation :** différer la demande de permission notifications au premier passage de commande.

---

## [Mineur] Écran Itinéraire : placeholder de développement accessible en production

- **Fichier(s) concerné(s) :** `src/app/(tabs)/itineraire/[id].tsx`
- **Domaine :** 11. Dette technique et code mort
- **Constat :** écran « Fonctionnalité en cours de développement » affichant l'`id` technique brut, écrit en `StyleSheet` (seul fichier de l'app à ne pas utiliser NativeWind), commentaire « Sera développé dans le sprint E07 » sans marqueur `// 🔗 réintégrer quand …`.
- **Impact :** écran atteignable par URL/deep link montrant un identifiant interne ; incohérence de styling à maintenir.
- **Recommandation :** ajouter le marqueur `// 🔗 réintégrer quand la verticale itinéraire est spécifiée` et masquer la route en attendant.

## [Mineur] Trois écrans « bientôt disponible » atteignables depuis le Profil

- **Fichier(s) concerné(s) :** `src/app/profil/adresses.tsx`, `src/app/profil/coupons.tsx`, `src/app/profil/paiement.tsx`, `src/app/commandes/historique.tsx`
- **Domaine :** 11. Dette technique et code mort
- **Constat :** quatre écrans vides avec marqueur `// 🔗 Brancher sur l'API quand l'endpoint est disponible` (marqueur correct), mais la condition précise de réintégration n'est pas nommée.
- **Impact :** parcours en cul-de-sac (aujourd'hui masqués involontairement par les `onPress` désactivés du Profil) — deviendront visibles dès que la navigation sera rebranchée.
- **Recommandation :** préciser la condition dans chaque marqueur (`quand GET /client/adresses existe`) et décider de l'affichage ou du masquage des entrées correspondantes.

## [Mineur] Logique de créneaux horaires appelée avec une liste toujours vide

- **Fichier(s) concerné(s) :** `src/components/menu/MenuBottomSheet.tsx` (ligne 65 : `const creneaux: CreneauHoraire[] = []`), `src/utils/creneaux.ts`
- **Domaine :** 11. Dette technique et code mort
- **Constat :** `isPlatDisponible(plat, cat, [])` retourne toujours `true` car aucun créneau n'est trouvé ; les 69 lignes de `src/utils/creneaux.ts` sont donc inertes. Le type `CreneauHoraire` est lui-même annoté « n'apparaît pas dans les réponses réelles ».
- **Impact :** des plats hors créneau (petit-déjeuner à 22 h) restent commandables → commande refusée par le restaurant, mauvaise expérience et litige partenaire.
- **Recommandation :** soit alimenter `creneaux` depuis l'API, soit marquer explicitement `// 🔗 réintégrer quand l'API expose les créneaux` et retirer l'appel mort.

## [Mineur] Code mort : slice carte non consommée

- **Fichier(s) concerné(s) :** `src/store/slices/carteSlice.ts`
- **Domaine :** 11. Dette technique et code mort
- **Constat :** `regionVisible` et `setRegion` ne sont référencés nulle part dans `src/` ; `CarteView` gère le zoom via `currentZoomRef`.
- **Impact :** état global inutilisé mais documenté comme faisant partie de l'architecture — source de confusion pour toute reprise du code.
- **Recommandation :** signaler pour suppression, ou brancher réellement la persistance de la région visible.

## [Mineur] Code mort : utilitaire `haversineDistance` jamais appelé

- **Fichier(s) concerné(s) :** `src/lib/geo.ts`
- **Domaine :** 11. Dette technique et code mort
- **Constat :** aucune occurrence de `haversineDistance` hors de sa définition ; la distance affichée vient de `restaurant.distanceKm` (backend).
- **Impact :** deux sources potentielles de calcul de distance pour l'avenir, dont une non testée.
- **Recommandation :** signaler pour suppression.

## [Mineur] Code mort : helpers de panier et constantes de zoom non utilisés

- **Fichier(s) concerné(s) :** `src/store/slices/panierSlice.ts` (`nombreArticles`, `sousTotal`), `src/hooks/usePosition.ts` (`RESTAURANT_DETAIL_ZOOM`), `src/constants/api.ts` (`geoSearch`, `geoItineraire`), `src/store/slices/adressesSlice.ts` (`isLoadingAdresses`, `mettreAJourAdresse`, `supprimerAdresse`)
- **Domaine :** 11. Dette technique et code mort
- **Constat :** ces exports ne sont référencés nulle part ; `ENDPOINTS.geoSearch` est même contourné par une URL écrite en dur dans `useGeoSearch`.
- **Impact :** surface d'API interne trompeuse ; risque de divergence entre l'URL en dur et la constante.
- **Recommandation :** signaler chaque groupe pour suppression, et faire consommer `ENDPOINTS.geoSearch` par `useGeoSearch`.

## [Mineur] Gros blocs commentés sans marqueur de réintégration

- **Fichier(s) concerné(s) :** `src/app/(tabs)/commandes/[id].tsx` (lignes 90, 219-261 bloc « Livreur partenaire », 381-396 actions support), `src/app/(tabs)/profil.tsx` (241-258 bloc Premium, 183-189 « Continuer sans compte »), `src/app/(tabs)/panier.tsx` (258-266 header logo), `src/components/commandes/CommandeCard.tsx` (image d'article), `src/app/auth/login.tsx` (83-86 Google), `src/app/restaurant/[slug]/index.tsx` (`showQuickPreview`, `refreshControl`)
- **Domaine :** 11. Dette technique et code mort
- **Constat :** ~150 lignes de JSX commenté sans condition de réintégration explicite (seul le bloc Google porte un `// 🔗`).
- **Impact :** impossible de savoir ce qui est reporté volontairement et ce qui est abandonné ; risque de réactivation d'un code obsolète.
- **Recommandation :** annoter chaque bloc avec `// 🔗 réintégrer quand …` ou le supprimer, fichier par fichier.

## [Mineur] Bouton de filtres non fonctionnel sur l'écran Commandes

- **Fichier(s) concerné(s) :** `src/app/(tabs)/commandes/index.tsx` (lignes 93-95 : `TouchableOpacity` sans `onPress`)
- **Domaine :** 1. Friction utilisateur / UX
- **Constat :** l'icône `SlidersHorizontal` est rendue sans handler, alors que les filtres existent déjà en chips juste en dessous.
- **Impact :** affordance morte redondante.
- **Recommandation :** retirer l'icône ou lui donner une action.

## [Mineur] Écran non authentifié du Profil inatteignable

- **Fichier(s) concerné(s) :** `src/app/(tabs)/profil.tsx` (bloc `if (!client)`), `src/app/(tabs)/_layout.tsx` (redirection `route.name === "profil" && !client`)
- **Domaine :** 11. Dette technique et code mort
- **Constat :** la tab bar redirige vers `/auth/login` avant d'atteindre l'écran, donc le bloc « Connectez-vous pour accéder à vos informations » (35 lignes) n'est jamais rendu. Il utilise de plus `bg-brand-500` / `text-brand-600` — `brand-600` n'existe pas dans le thème.
- **Impact :** double logique d'authentification à maintenir, dont une morte et hors charte.
- **Recommandation :** choisir un seul mécanisme (garde de navigation ou état d'écran) et signaler l'autre pour suppression.

## [Mineur] `handleBlur` du champ de recherche masque les suggestions via `setTimeout`

- **Fichier(s) concerné(s) :** `src/components/carte/SearchBar.tsx` (lignes 63-65), `src/components/panier/FormulaireCommande.tsx` (`onBlur` de l'adresse)
- **Domaine :** 1. Friction utilisateur / UX
- **Constat :** un `setTimeout(200)` non nettoyé est utilisé pour laisser le temps au tap sur une suggestion ; le timer n'est pas annulé au démontage.
- **Impact :** taps de suggestion parfois perdus (réseau lent = liste qui arrive après le blur) et `setState` sur composant démonté.
- **Recommandation :** remplacer par la gestion de la pression sur la liste (`keyboardShouldPersistTaps` déjà présent) et supprimer le timer.

## [Mineur] `useGeoSearch` ne peut renvoyer qu'une seule suggestion

- **Fichier(s) concerné(s) :** `src/hooks/useGeoSearch.ts` (`return [mapToSuggestion(response.data)]`)
- **Domaine :** 1. Friction utilisateur / UX
- **Constat :** l'endpoint est typé comme renvoyant un objet unique et le hook enveloppe ce résultat dans un tableau d'un élément.
- **Impact :** pas de désambiguïsation d'adresse (fréquent en zone où l'adressage est informel) : l'utilisateur doit accepter la seule proposition ou saisir en texte libre.
- **Recommandation :** faire évoluer le contrat vers une liste de résultats côté hook, en préparation d'une API multi-résultats.

## [Mineur] Catégories de cuisine codées en dur et non alignées sur l'offre locale

- **Fichier(s) concerné(s) :** `src/components/carte/SearchBar.tsx` (`CATEGORIES = ["Halal", "Pizza", "Burger", "Asiatique", "Traditionnel", "Tacos"]`)
- **Domaine :** 1. Friction utilisateur / UX
- **Constat :** liste statique côté client, envoyée telle quelle en paramètre `cuisine` à l'API, sans possibilité de la faire varier par ville ou par verticale.
- **Impact :** filtres renvoyant zéro résultat à Bouaké (« Tacos », « Asiatique ») ; incompatible avec l'extension multi-verticale.
- **Recommandation :** alimenter ces filtres depuis l'API (facettes) plutôt que depuis une constante d'UI.

## [Mineur] Statut `prete` traduit différemment selon l'écran

- **Fichier(s) concerné(s) :** `src/components/commandes/CommandeCard.tsx` (`prete: "En route"`), `src/app/(tabs)/commandes/[id].tsx` (`prete: "Prête pour la livraison"`)
- **Domaine :** 1. Friction utilisateur / UX
- **Constat :** deux tables `STATUT_LABELS` distinctes avec des libellés différents pour le même statut backend ; le bandeau de carte affiche « Votre commande est en route » même pour le statut `recue`.
- **Impact :** message contradictoire entre la liste et le détail : l'utilisateur croit que le livreur est parti alors que la commande vient d'être reçue → appels support.
- **Recommandation :** extraire une table de libellés de statut unique partagée par les deux écrans.

## [Mineur] `FlatList` imbriquées dans des `ScrollView`

- **Fichier(s) concerné(s) :** `src/app/(tabs)/panier.tsx` (`FlatList scrollEnabled={false}` dans un `ScrollView`), `src/components/menu/HeaderRestaurant.tsx` (`FlatList` horizontale dans le `ScrollView` de l'écran restaurant)
- **Domaine :** 8. Performance
- **Constat :** listes non virtualisées de fait (avertissement RN de virtualisation imbriquée) pour un contenu de taille variable.
- **Impact :** rendu intégral de tous les articles du panier à chaque changement de quantité ; ralentissements sur gros panier.
- **Recommandation :** remplacer par un `map` explicite (panier) ou remonter la liste au niveau de la liste parente.

## [Mineur] Skeleton animé instancié six fois avec six boucles Reanimated

- **Fichier(s) concerné(s) :** `src/components/menu/MenuBottomSheet.tsx` (`Array.from({ length: 6 }).map(... <SkeletonCard/>)`), `src/components/ui/SkeletonCard.tsx`
- **Domaine :** 8. Performance
- **Constat :** chaque `SkeletonCard` lance son propre `withRepeat` infini et son propre `LinearGradient` animé (7 instances au total en comptant l'écran restaurant).
- **Impact :** charge GPU inutile pendant le chargement — précisément le moment où l'appareil doit rester réactif en réseau lent.
- **Recommandation :** partager une seule valeur animée pour l'ensemble des skeletons.

## [Mineur] Contraste insuffisant sur les textes secondaires

- **Fichier(s) concerné(s) :** `src/components/carte/SearchBar.tsx` (`text-ink-400` sur blanc), `src/components/ui/EmptyState.tsx` (`text-ink-500`), `src/app/(tabs)/commandes/[id].tsx` (`text-gray-400`, `text-[11px]`), `src/app/(tabs)/index.tsx` (`text-[13px] text-gray-500`)
- **Domaine :** 9. Accessibilité
- **Constat :** `ink-400` (#9ca3af) sur fond blanc donne un ratio ≈ 2,6:1, sous le seuil AA de 4,5:1 ; plusieurs textes descendent à 11-13 px.
- **Impact :** informations d'horaire et de statut illisibles en plein soleil — condition d'usage dominante pour une app de rue.
- **Recommandation :** relever les textes informatifs à `ink-500`/`ink-600` minimum et à 13 px minimum, écran par écran.

## [Mineur] `tailwindcss` v3 utilisé alors que l'architecture cible annonce v4 `@theme`

- **Fichier(s) concerné(s) :** `package.json` (`tailwindcss: ^3.4.17`), `tailwind.config.js`, `src/global.css` (`@tailwind base/components/utilities`)
- **Domaine :** 7. Cohérence du design system
- **Constat :** le design system est décrit comme Tailwind v4 via `@theme` CSS, mais le projet utilise la syntaxe et la version v3 avec un `tailwind.config.js` classique et des variables CSS `:root`.
- **Impact :** écart entre documentation d'architecture et code réel ; toute future migration v4 devra reprendre l'intégralité des tokens.
- **Recommandation :** aligner la documentation sur la v3 effective, ou planifier la migration `@theme` comme chantier séparé.

## [Mineur] Bloc `.dark` défini alors que le dark mode n'est pas au programme

- **Fichier(s) concerné(s) :** `src/global.css` (bloc `.dark`), `app.json` (`userInterfaceStyle: "automatic"`)
- **Domaine :** 7. Cohérence du design system
- **Constat :** `userInterfaceStyle` est en `automatic` et un jeu de variables `.dark` existe, alors que les écrans sont conçus en clair uniquement (fonds `bg-white` en dur).
- **Impact :** sur un appareil en thème sombre, certains composants RNR peuvent basculer partiellement (`dark:` présents dans `input.tsx`, `button.tsx`) → rendu hybride incohérent. Ce n'est pas une demande de dark mode, mais un verrouillage du thème clair.
- **Recommandation :** forcer `userInterfaceStyle: "light"` pour garantir le rendu voulu.

## [Mineur] `handleNotification` vide et handler de notification défini tardivement

- **Fichier(s) concerné(s) :** `src/hooks/usePushNotifications.ts` (`handleNotification = useCallback(() => {}, [])`, `setNotificationHandler` dans un `import()` dynamique)
- **Domaine :** 3. Gestion d'erreurs et production readiness
- **Constat :** le listener de réception ne fait rien (aucune invalidation du cache commandes), et `setNotificationHandler` est appelé après résolution d'un import dynamique, donc potentiellement après l'arrivée d'une notification au démarrage.
- **Impact :** une notification « commande prête » reçue app ouverte ne rafraîchit pas la liste ; risque de notification non affichée au cold start.
- **Recommandation :** invalider `["commandes"]` / `["commande-tracking", id]` à la réception, et déplacer `setNotificationHandler` au niveau module.

## [Mineur] `apiFetch` déclenche `logout()` sur tout 401, y compris transitoire

- **Fichier(s) concerné(s) :** `src/lib/api.ts` (branche `else` après échec de refresh)
- **Domaine :** 4. Cohérence de la gestion d'état
- **Constat :** si le refresh échoue pour une raison réseau (timeout, DNS), `tryRefreshToken` retourne `null` (son `catch` avale tout) et l'utilisateur est déconnecté. Le cache TanStack Query n'est par ailleurs pas vidé au `logout`.
- **Impact :** déconnexions intempestives en zone de mauvaise couverture, et données du compte précédent potentiellement encore affichées après déconnexion.
- **Recommandation :** distinguer échec d'authentification et échec réseau dans `tryRefreshToken`, et vider le cache Query au logout.

## [Mineur] Requêtes de recherche non annulées à la frappe

- **Fichier(s) concerné(s) :** `src/hooks/useDebounce.ts`, `src/hooks/useGeoSearch.ts`, `src/hooks/useRestaurantSearch.ts`
- **Domaine :** 2. Robustesse réseau et mode dégradé
- **Constat :** le debounce de 400 ms limite le nombre d'appels mais, faute de `signal` transmis à `apiFetch`, les requêtes obsolètes continuent jusqu'au bout.
- **Impact :** consommation de data inutile et résultats potentiellement affichés dans le mauvais ordre en réseau lent.
- **Recommandation :** propager le `signal` de TanStack Query dans ces deux hooks (après la correction d'`apiFetch`).

## [Mineur] `useRestaurantsProches` interroge l'API sans vérifier la connectivité ni gérer l'erreur à l'écran

- **Fichier(s) concerné(s) :** `src/app/(tabs)/index.tsx` (aucun usage de `restaurantsQuery.error`)
- **Domaine :** 3. Gestion d'erreurs et production readiness
- **Constat :** seuls `isLoading` et un état vide sont gérés ; en cas d'erreur réseau, `restaurants = []` et l'utilisateur voit « Aucun établissement ici » avec le conseil « déplacez-vous ».
- **Impact :** message trompeur : l'utilisateur croit qu'il n'y a pas de restaurant alors que la requête a échoué. Perte de commande évitable.
- **Recommandation :** distinguer l'état erreur de l'état vide sur cet écran.

## [Mineur] `restaurant/[slug]` : le menu est chargé deux fois

- **Fichier(s) concerné(s) :** `src/app/restaurant/[slug]/index.tsx` (`useMenuRestaurant`), `src/components/menu/MenuBottomSheet.tsx` (`useMenuRestaurant`)
- **Domaine :** 4. Cohérence de la gestion d'état
- **Constat :** deux appels au même hook avec la même clé — TanStack Query déduplique la requête, mais deux abonnements et deux recalculs de `visibleCategories` coexistent, avec des dérivations différentes (`popularPlats` vs `platsAffiches`).
- **Impact :** double logique de filtrage à maintenir ; risque d'incohérence entre « plats populaires » (ne filtre pas la disponibilité) et le menu réel.
- **Recommandation :** dériver `popularPlats` depuis la même sélection filtrée, à un seul endroit.

## [Mineur] `Button` impose une hauteur et un rayon fixes qui écrasent ses variantes

- **Fichier(s) concerné(s) :** `src/components/ui/button.tsx` (lignes 106-112 : `"rounded-[30px] h-14"` appliqué après `className`)
- **Domaine :** 7. Cohérence du design system
- **Constat :** les valeurs sont concaténées **après** le `className` de l'appelant dans `cn()`, donc elles gagnent systématiquement : `size="sm"`, `size="icon"` et toute hauteur personnalisée sont neutralisées. La variante `link` hérite malgré tout d'un bloc de 56 px.
- **Impact :** boutons « lien » occupant une hauteur de CTA (panier vide, liste de commandes vide) et système de tailles inopérant — dérive par rapport à la charte.
- **Recommandation :** déplacer ces valeurs dans les variantes `cva` au lieu de les forcer après `className`.

## [Mineur] `Button variant="link"` utilisé avec un `Text` de `react-native`

- **Fichier(s) concerné(s) :** `src/app/(tabs)/panier.tsx` (ligne 240), `src/components/commandes/CommandeListEmpty.tsx` (ligne 24)
- **Domaine :** 7. Cohérence du design system
- **Constat :** ces appels passent un `Text` de `react-native` en enfant, qui ignore le `TextClassContext` fourni par `Button` (contrairement au `Text` de `@/components/ui/text` utilisé ailleurs).
- **Impact :** styles de texte de bouton non appliqués, compensés par des classes manuelles → divergence progressive du composant RNR.
- **Recommandation :** utiliser systématiquement `Text` de `@/components/ui/text` dans les enfants de `Button`.

## [Mineur] Composants `Input` et `Badge` livrés mais jamais utilisés

- **Fichier(s) concerné(s) :** `src/components/ui/input.tsx`, `src/components/ui/badge.tsx`
- **Domaine :** 7. Cohérence du design system
- **Constat :** aucun écran ne les importe : tous les formulaires utilisent `TextInput` de RN avec des classes ad hoc (`border-gray-200`, `border-red-500`), et les badges de statut sont réimplémentés dans `CommandeCard`.
- **Impact :** design system contourné : les états d'erreur de champ (`border-red-500`) ne passent pas par les tokens `danger`, d'où des rouges différents selon l'écran.
- **Recommandation :** soit adopter `Input`/`Badge` dans les formulaires et les statuts, soit les signaler comme non utilisés.

## [Mineur] `elevation-2` et `shadow-*` mélangés à des `style` natifs

- **Fichier(s) concerné(s) :** `src/app/(tabs)/profil.tsx` (`shadow-sm shadow-black/10 elevation-2`), `src/app/(tabs)/_layout.tsx` (ombres en `style`), `src/components/carte/CarteView.tsx` (`shadow-md`)
- **Domaine :** 7. Cohérence du design system
- **Constat :** `elevation-2` n'est pas un utilitaire Tailwind valide ; les ombres sont exprimées de trois façons différentes selon le fichier.
- **Impact :** profondeur incohérente entre les cartes, et absence d'ombre sur Android là où seule la classe web est utilisée.
- **Recommandation :** définir une convention d'ombre unique et corriger les classes invalides.

## [Mineur] `Stack.Protected` utilisé sans redirection

- **Fichier(s) concerné(s) :** `src/app/profil/_layout.tsx`, `src/app/commandes/_layout.tsx`
- **Domaine :** 1. Friction utilisateur / UX
- **Constat :** les écrans protégés sont retirés de la pile quand `!client`, sans redirection vers `/auth/login` : la navigation vers `/profil/adresses` ne mène nulle part.
- **Impact :** taps sans effet perceptible pour un utilisateur déconnecté arrivant par deep link.
- **Recommandation :** ajouter une redirection explicite vers l'authentification pour ces groupes.

## [Mineur] `HeaderRestaurant` : `isFavorite` appelé comme sélecteur Zustand

- **Fichier(s) concerné(s) :** `src/components/menu/HeaderRestaurant.tsx` (lignes 44-52)
- **Domaine :** 4. Cohérence de la gestion d'état
- **Constat :** `useStore((s) => s.isFavorite)` récupère la fonction, appelée ensuite hors abonnement : le composant ne se réabonne pas au tableau `favorites`.
- **Impact :** le cœur peut ne pas se mettre à jour immédiatement après un tap (dépend d'un autre re-render) — feedback d'interaction non fiable.
- **Recommandation :** dériver l'état favori directement dans le sélecteur.

## [Mineur] Bouton « Partager » sans action sur la fiche établissement

- **Fichier(s) concerné(s) :** `src/components/menu/HeaderRestaurant.tsx` (`onPress={() => {}}`)
- **Domaine :** 1. Friction utilisateur / UX
- **Constat :** icône `Share` rendue avec un handler vide.
- **Impact :** canal d'acquisition organique (partage d'un restaurant) inexistant tout en étant affiché comme disponible.
- **Recommandation :** brancher `Share` de React Native ou masquer le bouton.

## [Mineur] Trois `Pressable` de l'écran suivi renvoient vers l'accueil ou une route neutre

- **Fichier(s) concerné(s) :** `src/app/(tabs)/commandes/[id].tsx` (bandeau avis `router.push("/")`, bouton « Commander à nouveau » `router.push("/(tabs)")`)
- **Domaine :** 1. Friction utilisateur / UX
- **Constat :** le bandeau « Donnez votre avis » navigue vers la racine (onboarding), et « Commander à nouveau » vers la carte plutôt que vers le restaurant de la commande.
- **Impact :** l'utilisateur qui veut laisser un avis atterrit sur l'écran d'onboarding ; le réachat demande de retrouver le restaurant manuellement.
- **Recommandation :** cibler `/restaurant/[slug]` pour le réachat et masquer le bandeau avis tant que la fonctionnalité n'existe pas.

## [Mineur] Numéro de support codé en dur et non joignable

- **Fichier(s) concerné(s) :** `src/app/(tabs)/commandes/[id].tsx` (`Linking.openURL("tel:+2250700000000")`)
- **Domaine :** 3. Gestion d'erreurs et production readiness
- **Constat :** numéro manifestement fictif, en dur dans l'écran.
- **Impact :** le bouton « Aide » du suivi de commande appelle un numéro invalide — pire que pas de bouton.
- **Recommandation :** externaliser le numéro de support en configuration et le renseigner avant lancement.

## [Mineur] Image de placeholder distante (Unsplash) dans le panier

- **Fichier(s) concerné(s) :** `src/app/(tabs)/panier.tsx` (ligne 100)
- **Domaine :** 2. Robustesse réseau et mode dégradé
- **Constat :** l'absence de `photoUrl` déclenche le chargement d'une image Unsplash externe.
- **Impact :** dépendance à un tiers non contractuel, data consommée inutilement, placeholder vide hors ligne.
- **Recommandation :** remplacer par un asset local léger.

---

## [Amélioration] Aucune mise en file des commandes hors ligne

- **Fichier(s) concerné(s) :** `src/hooks/useEnvoyerCommande.ts`
- **Domaine :** 2. Robustesse réseau et mode dégradé
- **Constat :** la mutation échoue immédiatement sans connexion ; aucun `onMutate` optimiste, aucune reprise à la reconnexion, alors que `useConnectivite` existe déjà.
- **Impact :** commande perdue en cas de coupure au moment de la confirmation — moment le plus critique du tunnel.
- **Recommandation :** étudier une mise en file persistante des commandes avec rejeu à la reconnexion.

## [Amélioration] `OfflineBanner` purement informatif et masquant le contenu

- **Fichier(s) concerné(s) :** `src/components/ui/OfflineBanner.tsx`, `src/app/_layout.tsx`
- **Domaine :** 2. Robustesse réseau et mode dégradé
- **Constat :** bandeau positionné en `absolute top-0` sans respect des `safe area insets`, sans action de reprise, et `isConnected` de NetInfo ne distingue pas « connecté » de « internet réellement accessible » (`isInternetReachable` non utilisé).
- **Impact :** bandeau sous l'encoche/barre d'état sur certains appareils, et faux négatifs sur réseaux captifs fréquents.
- **Recommandation :** utiliser `isInternetReachable`, respecter les insets et proposer une action « Réessayer ».

## [Amélioration] Aucune télémétrie de performance ni de crash

- **Fichier(s) concerné(s) :** `package.json`, `src/app/_layout.tsx`
- **Domaine :** 3. Gestion d'erreurs et production readiness
- **Constat :** aucun SDK de crash reporting ni d'analytics ; les erreurs ne subsistent que dans `console.*`.
- **Impact :** impossible de mesurer le taux d'échec de commande ni de diagnostiquer les crashes de terrain après lancement.
- **Recommandation :** intégrer un reporting de crash minimal avant la mise en production.

## [Amélioration] Aucun test automatisé

- **Fichier(s) concerné(s) :** `package.json` (scripts), absence de `__tests__`
- **Domaine :** 3. Gestion d'erreurs et production readiness
- **Constat :** aucune configuration de test ; la logique métier sensible (`creneaux.ts`, calcul du total panier, `parseClient`/`parseTokens`, normalisation des coordonnées) n'est couverte par rien.
- **Impact :** chaque correction du tunnel de commande se fait sans filet de sécurité.
- **Recommandation :** couvrir en priorité le calcul du total du panier et la normalisation des coordonnées.

## [Amélioration] Textes d'interface en dur, non préparés au multi-verticale

- **Fichier(s) concerné(s) :** l'ensemble de `src/app/**` et `src/components/**`
- **Domaine :** 1. Friction utilisateur / UX
- **Constat :** tous les libellés sont écrits en français directement dans le JSX, avec un vocabulaire propre à la restauration (« plats », « établissement », « menu »).
- **Impact :** l'extension aux verticales résidences et événements imposera une réécriture écran par écran plutôt qu'un changement de dictionnaire.
- **Recommandation :** extraire progressivement les libellés du tunnel de commande vers un dictionnaire par verticale.

## [Amélioration] Compilateur React activé alors que le code est manuellement mémoïsé

- **Fichier(s) concerné(s) :** `app.json` (`experiments.reactCompiler: true`), `src/app/(tabs)/index.tsx` (`coordsRef` pour « éviter les re-renders »), `src/components/carte/CarteView.tsx`
- **Domaine :** 8. Performance
- **Constat :** `reactCompiler` est activé, et le code contient en parallèle des contournements manuels (refs miroir de state, commentaires expliquant l'évitement de dépendances) qui rendent le comportement plus difficile à raisonner ; `usePosition` contient même un `eslint-disable react-hooks/set-state-in-effect`.
- **Impact :** optimisations redondantes et risque de bugs subtils de fraîcheur de données (`coordsRef` peut être en retard d'un rendu lors du recentrage).
- **Recommandation :** trancher entre compilateur et mémoïsation manuelle, et simplifier `handleRecentrer` en conséquence.

## [Amélioration] `detachInactiveScreens={false}` + `freezeOnBlur={false}` sur tous les onglets

- **Fichier(s) concerné(s) :** `src/app/(tabs)/_layout.tsx` (lignes 160-167)
- **Domaine :** 8. Performance
- **Constat :** tous les écrans d'onglets restent montés et actifs pour préserver l'état de la carte MapLibre.
- **Impact :** mémoire et CPU maintenus par la carte même sur les onglets Panier/Profil — risque de « low memory kill » sur les appareils d'entrée de gamme du marché cible.
- **Recommandation :** limiter ce réglage au seul onglet carte plutôt qu'à l'ensemble des écrans.

## [Amélioration] `src/types/index.ts` mêle types API et types de composants

- **Fichier(s) concerné(s) :** `src/types/index.ts` (`ErrorViewProps`, `RegionVisible`, `Suggestion`)
- **Domaine :** 11. Dette technique et code mort
- **Constat :** des props de composants et des types d'état UI cohabitent avec les contrats API « régénérés d'après les réponses réelles », ce qui rend impossible une future génération automatique depuis l'OpenAPI.
- **Impact :** friction pour maintenir l'alignement front/back au fil des évolutions multi-verticales.
- **Recommandation :** séparer les contrats API des types d'UI dans deux fichiers distincts.

## [Amélioration] Réponses API traitées en `any` dans six hooks

- **Fichier(s) concerné(s) :** `src/hooks/useCommandesClient.ts`, `useCommandeTracking.ts`, `useEnvoyerCommande.ts`, `useRestaurantsProches.ts`, `useRestaurantSearch.ts`
- **Domaine :** 3. Gestion d'erreurs et production readiness
- **Constat :** `apiFetch<any>` avec des accès en chaîne (`response.data?.commande?.id`) et des heuristiques « objet ou tableau », malgré `strict: true` dans `tsconfig.json` et des types précis disponibles dans `src/types`.
- **Impact :** aucune protection à la compilation contre un changement de contrat backend ; les erreurs apparaîtront à l'exécution chez l'utilisateur.
- **Recommandation :** typer chaque hook avec `ApiResponse<T>` existant, hook par hook.

---

## Synthèse — les 3 chantiers à traiter avant toute mise en production

1. **Rendre la géolocalisation réelle et locale.** Supprimer `TEST_MODE` dans `usePosition`, basculer les fallbacks sur Bouaké, unifier une convention `Coords` unique (5 occurrences distinctes de conversions manuelles `latitude/longitude` ↔ `lat/lng` ↔ `lat/lon` ↔ scalaires) et rendre l'état « permission refusée » visible. Sans cela, l'app est vide le jour du lancement.
2. **Sécuriser le tunnel de commande de bout en bout.** Corriger le total du panier (frais d'emballage cachés, livraison offerte non appliquée, frais passés par URL), persister le panier, donner un retour explicite au changement de restaurant, empêcher la double soumission, supprimer le fallback `id: ""` qui bloque l'écran de suivi en spinner infini, et corriger le deep link de notification. C'est là que se perd le chiffre d'affaires.
3. **Atteindre un socle de robustesse et de production readiness.** Timeout/`AbortController` dans `apiFetch` et `loadToken` (splash bloqué indéfiniment en réseau lent), `defaultOptions` TanStack Query, error boundary racine, retrait des logs de PII et du token, puis configuration réelle de `app.json` (nom, scheme, bundle id, `projectId` push, splash Banko) sans laquelle aucune publication n'est possible.

En second rideau, mais rapide à traiter : les variables HSL malformées de `global.css` et les tokens `danger`/`card` manquants, qui neutralisent silencieusement une grande partie du design system et expliquent la plupart des dérives visuelles constatées.
