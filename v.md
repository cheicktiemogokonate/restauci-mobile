# Prompt de remédiation complète — Application mobile Toutci

> À coller dans Pi (via OpenRouter). Modèle recommandé : `anthropic/claude-sonnet-5`, `--thinking-level medium`.
> Ne restreins pas les outils cette fois (`read`, `write`, `edit`, `bash` — les 4 par défaut sont nécessaires).

---

## RÈGLES D'EXÉCUTION — NON NÉGOCIABLES

Tu vas corriger, un par un, tous les problèmes listés dans le rapport d'audit en annexe de ce prompt. Applique strictement ce protocole pour chaque point :

1. **Un fichier, une préoccupation, un commit.** Ne mélange jamais deux corrections différentes dans le même commit. `git add <fichier exact>` uniquement — jamais `git add .` ni `git add -A`.
2. **Valide avant de committer.** Après chaque modification : lance `tsc --noEmit` et le lint du projet. Si l'un des deux échoue à cause de ta modification, corrige uniquement ce que tu viens de casser — ne touche à rien d'autre en cascade sans le signaler.
3. **Si un point est ambigu ou si la validation échoue deux fois de suite sur le même fichier : ARRÊTE-TOI**, n'essaie pas de deviner une troisième fois. Ajoute une entrée dans le journal (voir point 6) expliquant précisément le blocage, et passe au point suivant.
4. **Ne supprime jamais de code potentiellement réactivable.** Si le rapport recommande une suppression de code mort, remplace-le par un commentaire `// 🔗 réintégrer quand [condition précise]` plutôt que de l'effacer, sauf si le rapport dit explicitement "supprimer" pour du code réellement mort et non ambigu (imports inutilisés, variables jamais lues).
5. **Respecte l'ordre des phases ci-dessous.** Ne saute pas à la Phase 5 avant d'avoir terminé et validé la Phase 3, même si ça te semble plus rapide — plusieurs corrections dépendent de celles qui les précèdent.
6. **Tiens un journal de progression** dans un fichier `REMEDIATION_LOG.md` à la racine (crée-le s'il n'existe pas) : une ligne par point traité, avec le statut (✅ fait / ⏭️ ignoré et pourquoi / 🛑 bloqué et pourquoi).
7. **N'invente aucune nouvelle dépendance, aucune nouvelle bibliothèque.** Utilise uniquement ce qui existe déjà dans `package.json`.
8. **Ne touche à aucun fichier non mentionné** dans le rapport d'audit ou dans les instructions ci-dessous.

---

## À NE PAS TOUCHER (exclusions explicites)

- `src/hooks/usePosition.ts` : **NE PAS** modifier `TEST_MODE` ni `DEFAULT_COORDS`. C'est intentionnel — l'environnement de test actuel utilise des établissements enregistrés à Abidjan. Tout le reste de ce fichier (gestion d'erreur, typage `Coords`) reste à corriger normalement.
- `src/store/slices/carteSlice.ts` (`DEFAULT_REGION`) et `src/components/carte/CarteView.tsx` (`INITIAL_VIEW_STATE`) : même exclusion, ne pas changer la ville par défaut.
- N'intègre aucune logique de paiement réel — le paiement n'est pas encore branché sur ce projet.

---

## ORDRE DE TRAITEMENT

### Phase 2 — Réorganisation de la navigation (Commandes/Profil sous `(tabs)`)

Applique exactement cette restructuration (déjà validée, pas de place à l'interprétation) :

```bash
mkdir -p "src/app/(tabs)/profil"
git mv "src/app/(tabs)/profil.tsx" "src/app/(tabs)/profil/index.tsx"
git mv "src/app/profil/_layout.tsx" "src/app/(tabs)/profil/_layout.tsx"
git mv "src/app/profil/adresses.tsx" "src/app/(tabs)/profil/adresses.tsx"
git mv "src/app/profil/paiement.tsx" "src/app/(tabs)/profil/paiement.tsx"
git mv "src/app/profil/coupons.tsx" "src/app/(tabs)/profil/coupons.tsx"
git mv "src/app/profil/support.tsx" "src/app/(tabs)/profil/support.tsx"
git mv "src/app/profil/a-propos.tsx" "src/app/(tabs)/profil/a-propos.tsx"
git mv "src/app/commandes/historique.tsx" "src/app/(tabs)/profil/historique.tsx"
git rm "src/app/commandes/_layout.tsx"
```

Puis remplace le contenu de `src/app/(tabs)/profil/_layout.tsx` par :

```tsx
import { Redirect, Stack } from "expo-router";
import { useStore } from "@/store";

export default function ProfilLayout() {
  const client = useStore((s) => s.client);
  const isLoading = useStore((s) => s.isLoading);

  if (isLoading) {
    return null;
  }

  if (!client) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="historique" options={{ title: "Historique" }} />
      <Stack.Screen name="adresses" options={{ title: "Mes adresses" }} />
      <Stack.Screen name="paiement" options={{ title: "Paiement" }} />
      <Stack.Screen name="coupons" options={{ title: "Coupons" }} />
      <Stack.Screen name="support" options={{ title: "Support" }} />
      <Stack.Screen name="a-propos" options={{ title: "À propos" }} />
    </Stack>
  );
}
```

Puis remplace le contenu de `src/app/(tabs)/profil/index.tsx` par :

```tsx
import { useCommandesClient } from "@/hooks/useCommandesClient";
import { useStore } from "@/store";
import { useRouter } from "expo-router";
import {
  ChevronRight,
  CreditCard,
  Headphones,
  Heart,
  Info,
  LogOut,
  MapPin,
  ShoppingBag,
  Ticket,
} from "lucide-react-native";
import React, { useEffect } from "react";
import { Image, Pressable, ScrollView, StatusBar, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

type Stat = { icon: React.ReactNode; value: number; label: string };
type MenuItem = { icon: React.ReactNode; label: string; route: string };

function StatBlock({ icon, value, label }: Stat) {
  return (
    <View className="flex-1 items-center gap-1">
      {icon}
      <Text className="text-lg font-bold text-ink-900">{value}</Text>
      <Text className="text-xs text-ink-500">{label}</Text>
    </View>
  );
}

function MenuRow({ icon, label, route }: MenuItem) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(route as any)}
      className="flex-row items-center justify-between py-4 px-5 border-b border-ink-100 active:bg-ink-50"
    >
      <View className="flex-row items-center gap-4">
        {icon}
        <Text className="text-base text-ink-900">{label}</Text>
      </View>
      <ChevronRight size={18} color="#9ca3af" />
    </Pressable>
  );
}

export default function ProfilScreen() {
  const insets = useSafeAreaInsets();
  const client = useStore((s) => s.client);
  const logout = useStore((s) => s.logout);
  const favorites = useStore((s) => s.favorites);
  const adresses = useStore((s) => s.adresses);
  const loadAdresses = useStore((s) => s.loadAdresses);

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    loadAdresses();
  }, [loadAdresses]);

  const { data: commandes } = useCommandesClient();

  const stats: Stat[] = [
    { icon: <ShoppingBag size={20} color="#14532d" />, value: commandes?.length ?? 0, label: "Commandes" },
    {
      icon: (
        <Heart size={20} color={favorites.length > 0 ? "#ef4444" : "#14532d"} fill={favorites.length > 0 ? "#ef4444" : "none"} />
      ),
      value: favorites.length,
      label: "Favoris",
    },
    { icon: <MapPin size={20} color="#14532d" />, value: adresses.length, label: "Adresses" },
  ];

  const menuItems: MenuItem[] = [
    { icon: <ShoppingBag size={20} color="#374151" />, label: "Historique de commandes", route: "/profil/historique" },
    { icon: <MapPin size={20} color="#374151" />, label: "Mes adresses", route: "/profil/adresses" },
    { icon: <CreditCard size={20} color="#374151" />, label: "Modes de paiement", route: "/profil/paiement" },
    { icon: <Ticket size={20} color="#374151" />, label: "Coupons & Offres", route: "/profil/coupons" },
    { icon: <Headphones size={20} color="#374151" />, label: "Aide & Support", route: "/profil/support" },
    { icon: <Info size={20} color="#374151" />, label: "À propos", route: "/profil/a-propos" },
  ];

  return (
    <View className="flex-1 bg-ink-50">
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={{ paddingTop: insets.top }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 70 }}
      >
        <View className="items-center justify-center h-10 w-full mb-10">
          <Image
            source={require("@/assets/images/logo-restauci2.png")}
            resizeMode="contain"
            style={{ width: "100%", height: "100%" }}
          />
        </View>

        <View className="px-4">
          <View className="rounded-3xl bg-green-900 px-5 pt-6 pb-14">
            <View className="flex-row items-center gap-4">
              <Image
                source={require("@/assets/images/utilisateur.png")}
                className="h-16 w-16 rounded-full border-2 border-white/40"
              />
              <View className="flex-1">
                <Text className="text-xl font-bold text-white">Salut, {client?.nom} ! 👋</Text>
                <Text className="mt-1 text-sm text-white/80">
                  {client?.telephone} {client?.email && `• ${client.email}`}
                </Text>
              </View>
            </View>
          </View>

          <View className="-mt-10 mx-2 flex-row rounded-2xl bg-white px-2 py-4 shadow-sm shadow-black/10 elevation-2">
            {stats.map((s) => (
              <StatBlock key={s.label} {...s} />
            ))}
          </View>
        </View>

        <View className="mx-4 mt-5 rounded-2xl bg-white overflow-hidden">
          {menuItems.map((item) => (
            <MenuRow key={item.label} {...item} />
          ))}
        </View>

        <Pressable
          onPress={handleLogout}
          className="mx-4 mt-5 flex-row items-center justify-center gap-2 rounded-2xl bg-white py-4 border border-ink-100 active:bg-danger-50"
        >
          <LogOut size={18} color="#ef4444" />
          <Text className="text-base font-semibold text-danger-600">Se déconnecter</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
```

Puis dans `src/app/(tabs)/_layout.tsx` :
- Remplace `import { Tabs, useRouter } from "expo-router";` par `import { Tabs } from "expo-router";`
- Supprime la ligne `const router = useRouter();` dans `CustomTabBar`
- Supprime la ligne `const client = useStore((s) => s.client);` dans `CustomTabBar` (garde `useStore` importé, il sert encore plus bas pour le compteur du panier)
- Remplace le bloc :
  ```javascript
  if (!isFocused && !event.defaultPrevented) {
    if (route.name === "profil" && !client) {
      router.push("/auth/login");
    } else {
      navigation.navigate(route.name, route.params);
    }
  }
  ```
  par :
  ```javascript
  if (!isFocused && !event.defaultPrevented) {
    navigation.navigate(route.name, route.params);
  }
  ```

**Validation Phase 2** : `tsc --noEmit` + lint. Puis vérifie manuellement (ou laisse une note dans le journal pour que l'humain vérifie) : navigation vers Profil déconnecté → redirige vers login ; les 6 lignes du menu Profil naviguent ; deep link direct vers `/profil/adresses` déconnecté → redirige vers login.

---

### Phase 3 — Performance

Traite chaque point du domaine "8. Performance" du rapport en annexe, fichier par fichier :
- Images non optimisées et non référencées dans `assets/images/`
- Migration de `Image` (React Native) vers `expo-image` dans `src/app/(tabs)/panier.tsx`
- Dépendances non utilisées dans `package.json` (vérifie chaque occurrence avec `grep -r` avant de retirer)
- `FlatList` imbriquées dans `ScrollView` (panier, `HeaderRestaurant`)
- Skeleton animé × 6 dans `MenuBottomSheet`/`SkeletonCard`
- `detachInactiveScreens`/`freezeOnBlur` limité au seul onglet carte
- Store Zustand monolithique : sélecteurs dérivés stables pour le compteur du panier (utiliser `nombreArticles()` déjà présent dans `panierSlice.ts` au lieu des `reduce` inline dupliqués dans `_layout.tsx` et `PanierFAB.tsx`)

---

### Phase 5 — Affichage établissement réel

- Introduire un type `typeEtablissement` (valeur unique `"restaurant"` pour l'instant, extensible) à la place de la constante `CATEGORIES` codée en dur dans `SearchBar.tsx` — sans construire d'UI pour résidences/événements.
- Alimenter les catégories de cuisine depuis l'API plutôt qu'en dur.
- Brancher réellement `creneaux` depuis l'API dans `MenuBottomSheet.tsx`, ou marquer `// 🔗 réintégrer quand l'API expose les créneaux` et neutraliser l'appel mort dans `src/utils/creneaux.ts`.
- Distinguer état d'erreur et état vide sur l'écran d'accueil (`src/app/(tabs)/index.tsx`) — actuellement les deux affichent "Aucun établissement ici".

---

### Phase 6 — Tunnel de commande

Traite chaque point Bloquant/Critique du domaine "1. Friction utilisateur / UX" et "3. Gestion d'erreurs" lié au panier et à la commande :
- Frais d'emballage cachés dans le récapitulatif du panier
- Livraison offerte annoncée mais jamais appliquée au calcul
- Frais de livraison passés par paramètre d'URL au lieu d'une donnée serveur
- Fallback `id: ""` sur échec d'envoi de commande, bloquant l'écran de suivi en spinner infini
- Deep link de notification vers une route inexistante (corriger après la Phase 2, la route cible a changé)
- Absence de protection contre la double soumission de commande
- Panier non persisté entre les sessions
- Ajout d'un plat d'un autre établissement échouant silencieusement (ajouter une confirmation)

---

### Phase 7 — Robustesse réseau, sécurité, et reste du rapport

Traite dans l'ordre :
1. Timeout + `AbortController` dans `src/lib/api.ts` (`apiFetch`) et dans la séquence `loadToken` de `authSlice.ts`
2. `defaultOptions` du `QueryClient` (retry borné, `staleTime`, `gcTime`)
3. Error boundary racine + route `+not-found.tsx`
4. Retrait des logs de token JWT et de payload PII (`console.log`/`warn`/`error` dans `api.ts` et `FormulaireCommande.tsx`), conditionnés à `__DEV__` si un log de debug reste utile
5. Suppression de l'`alert()` brut au login (garder uniquement `serverError` stylé)
6. Normalisation de `API_URL` (retrait du slash final et des guillemets dans `.env`)
7. Remplacement des références visuelles "RestauCi" par "Toutci" (écran de suivi, logos, assets)
8. Tous les autres points Majeur/Mineur/Amélioration du rapport non couverts ci-dessus (classes Tailwind invalides, tokens sémantiques manquants, code mort restant, accessibilité — libellés et zones tactiles, etc.), dans l'ordre où ils apparaissent dans le rapport.

---

## ANNEXE — Rapport d'audit complet

# Audit de pré-production — Application mobile Toutci (annexe condensée pour exécution)

Chaque point ci-dessous est isolé pour devenir un commit unique. Les statuts "déjà traité"/"NE PAS TOUCHER" doivent être respectés strictement.

---

## [Bloquant] TEST_MODE dans usePosition.ts — NE PAS TOUCHER (exclusion explicite)
## [Bloquant] DEFAULT_COORDS Abidjan (usePosition.ts, carteSlice.ts, CarteView.tsx) — NE PAS TOUCHER (exclusion explicite)

## [Bloquant] Identité d'application non configurée
- **Fichier :** `app.json` — `name/slug/scheme` = "test", bundle id `com.tobias-whale.test`, splash bleu `#208AEF`, pas de `eas.json`/`projectId`.
- **Action :** renseigner nom/slug/scheme/bundle id Toutci, aligner splash/icône sur palette Banko, créer `eas.json` avec `extra.eas.projectId`.

## [Bloquant] projectId push absent
- **Fichier :** `src/hooks/usePushNotifications.ts` (`getProjectId()`), `app.json`
- **Action :** ajouter `extra.eas.projectId`, faire remonter l'échec au lieu de l'avaler dans le `catch {}`.

## [Bloquant] Démarrage à froid bloqué sans timeout
- **Fichier :** `src/store/slices/authSlice.ts` (`loadToken` : GET /auth/me, POST /auth/refresh, GET /auth/me, sans AbortController)
- **Action :** timeout global (5s) sur la séquence, bascule en session anonyme au-delà.

## [Bloquant] Aucun appel réseau n'a de timeout/AbortController
- **Fichier :** `src/lib/api.ts` (`apiFetch`, `tryRefreshToken`) — point d'entrée de tous les hooks
- **Action :** timeout paramétrable + passage du `signal` TanStack Query, une seule fois dans cette fonction.

## [Bloquant] Total panier ≠ somme affichée (frais d'emballage cachés)
- **Fichier :** `src/app/(tabs)/panier.tsx` (lignes ~33, 227, 329-341) — `FRAIS_EMBALLAGE` (200F) inclus dans le total mais jamais affiché.
- **Action :** afficher une ligne "Frais d'emballage" ou retirer ce montant du calcul.

## [Bloquant] Frais de livraison calculés côté client via paramètre d'URL
- **Fichiers :** `panier.tsx` (lignes 187-201), `src/components/menu/PanierFAB.tsx` (lignes 22-27)
- **Action :** rendre la tarification serveur, supprimer le passage des frais par paramètre d'URL.

## [Bloquant] Redirection post-commande vers id vide
- **Fichiers :** `src/components/panier/FormulaireCommande.tsx`, `src/hooks/useEnvoyerCommande.ts`, `panier.tsx` (`handleCommandeSuccess`)
- **Action :** traiter l'absence d'id comme erreur explicite (pas de fallback `""`), n'appeler `onSuccess` qu'avec id non vide.

## [Bloquant] Deep link notification vers route inexistante
- **Fichier :** `src/hooks/usePushNotifications.ts` (`router.push('/commandes/'+id)`)
- **Action :** corriger vers `/(tabs)/commandes/[id]`.

---

## [Critique] Panier non persisté
- **Fichiers :** `src/store/slices/panierSlice.ts`, `src/store/index.ts` — aucun middleware `persist`.
- **Action :** persister uniquement `panierSlice` (items + restaurantSlug), stockage asynchrone non chiffré.

## [Critique] Ajout d'un plat d'un autre établissement échoue silencieusement
- **Fichier :** `src/components/menu/MenuBottomSheet.tsx` (`handleAjouter`, lignes 88-97)
- **Action :** afficher confirmation "Vider le panier et commander ici ?".

## [Critique] Menu Profil inerte — STATUT : déjà traité par la Phase 2, ne pas refaire.

## [Critique] Aucun error boundary / route +not-found
- **Fichier :** `src/app/_layout.tsx`
- **Action :** ajouter un `ErrorBoundary` racine avec écran de récupération.

## [Critique] TanStack Query sans defaultOptions
- **Fichier :** `src/app/_layout.tsx` (`new QueryClient()`)
- **Action :** définir `defaultOptions` (retry borné, staleTime, gcTime).

## [Critique] Polling tracking 5s sans dégradation
- **Fichier :** `src/hooks/useCommandeTracking.ts` (`POLL_INTERVAL_MS`)
- **Action :** back-off progressif, suspension hors connexion.

## [Critique] positionError toujours null (écran erreur localisation inatteignable)
- **Fichier :** `src/hooks/usePosition.ts` — renseigner `error` pour permission refusée/service désactivé (ne change PAS DEFAULT_COORDS, autorisé dans ce run).

## [Critique] 5 occurrences de conventions de coordonnées incompatibles
- **Fichiers :** `usePosition.ts` ({latitude,longitude} local non partagé), `useRestaurantsProches.ts` (scalaires lat/lon + URL lat/lng), `useGeoSearch.ts` (backend lat/lng → Suggestion lat/lon), `SearchBar.tsx`+`(tabs)/index.tsx` (flyTo inversion manuelle dupliquée), `useRestaurantSearch.ts` (mapping latitude/longitude→lat/lon sans garde nullité)
- **Action :** unifier sur un seul type `Coords {latitude,longitude}` dans `src/types`, centraliser la conversion tuple MapLibre uniquement dans `CarteView`, supprimer tous mappings manuels dupliqués. NE CHANGE PAS la valeur par défaut (Abidjan), uniquement la structure/typage.

## [Critique] Token JWT et PII dans les logs
- **Fichiers :** `src/lib/api.ts` (5 console.*), `FormulaireCommande.tsx` (console.log payload complet)
- **Action :** retirer ou conditionner à `__DEV__`.

## [Critique] alert() brut au login
- **Fichier :** `src/app/auth/login.tsx` (ligne 74) — supprimer, garder `serverError` stylé.

## [Critique] URL de base avec slash final
- **Fichiers :** `.env` (EXPO_PUBLIC_API_URL), `src/constants/api.ts` — normaliser (retirer slash final).

## [Critique] Branding RestauCi résiduel
- **Fichiers :** `commandes/[id].tsx` (lignes 106-116), `(tabs)/profil/index.tsx` (déplacé Phase 2), `auth/*` (logos restauci) — remplacer par logo/nom Toutci.

## [Critique] Livraison offerte 2000F jamais appliquée
- **Fichier :** `panier.tsx` (`SEUIL_LIVRAISON_OFFERTE`) — appliquer la règle ou retirer la bannière.

---

## [Majeur] Classes Tailwind invalides écran carte
- **Fichier :** `(tabs)/index.tsx` (`bg-[green-500]`, `color="green-500"`) → tokens Banko.

## [Majeur] Classes invalides onboarding
- **Fichier :** `src/app/index.tsx` (`bg-[ink-100]`, `text-[green-900]`, `text-[#457b3b]`) → tokens.

## [Majeur] Tokens danger/warning opacité invalide
- **Fichiers :** `badge.tsx`, `CommandeCard.tsx` — STATUT : `danger.DEFAULT` déjà ajouté Phase 1, vérifier seulement l'usage.

## [Majeur] Hex bruts comme classes CSS dans CommandeCard
- **Fichier :** `CommandeCard.tsx` (`getBadgeStyle()`) → homogénéiser en classes de tokens.

## [Majeur] Classes dynamiques non compilables (FormulaireCommande)
- **Fichier :** `FormulaireCommande.tsx` (`MODE_COLORS`, `border-[${...}]`) → classes statiques conditionnelles.

## [Majeur] HSL malformées — STATUT : déjà corrigé Phase 1, ne pas refaire.
## [Majeur] Tokens card/card-foreground manquants — STATUT : déjà corrigé Phase 1, ne pas refaire.

## [Majeur] Classes espacement/rayon inexistantes
- **Fichiers :** `SkeletonCard.tsx`, `CartePlatMobile.tsx` → valeurs valides (`w-[72px]`, `rounded-xl`).

## [Majeur] Compteur panier dupliqué ×3 — traiter en Phase 3 (utiliser `nombreArticles()` existant).
## [Majeur] useStore monolithique — traiter en Phase 3 (sélecteurs dérivés stables/useShallow).

## [Majeur] Sources de vérité dupliquées commandes/tracking
- **Fichiers :** `useCommandesClient.ts`, `useCommandeTracking.ts` — invalider la liste depuis le tracking au changement de statut.

## [Majeur] Onboarding rejoué à chaque lancement
- **Fichier :** `src/app/index.tsx` — persister flag "vu", rediriger vers `/(tabs)`.

## [Majeur] router.back() après login/register
- **Fichiers :** `auth/login.tsx`, `auth/register.tsx` — redirection explicite via paramètre `redirect`.

## [Majeur] Alert.alert doublon de Zod
- **Fichier :** `FormulaireCommande.tsx` — supprimer revalidations redondantes.

## [Majeur] Regex téléphone incohérentes (3 versions différentes)
- **Fichiers :** `FormulaireCommande.tsx`, `auth/login.tsx`, `auth/register.tsx` — schéma "téléphone CI" unique centralisé dans `src/lib`.

## [Majeur] Pas de protection double soumission commande
- **Fichiers :** `FormulaireCommande.tsx`, `useEnvoyerCommande.ts` — clé d'idempotence, bloquer fermeture pendant isPending.

## [Majeur] SecureStore utilisé comme DB (favoris/adresses)
- **Fichiers :** `favorisSlice.ts`, `adressesSlice.ts` — déplacer vers stockage async non chiffré.

## [Majeur] Favoris jamais chargés hors écran restaurant
- **Fichiers :** `(tabs)/profil/index.tsx`, `HeaderRestaurant.tsx` — hydrater au démarrage (layout racine).

## [Majeur] Images non optimisées (~6Mo) — traiter en Phase 3.
## [Majeur] Image RN au lieu d'expo-image dans panier — traiter en Phase 3.
## [Majeur] Dépendances lourdes inutilisées — traiter en Phase 3.

## [Majeur] Aucun libellé accessibilité actions icône seule
- **Fichiers :** `CarteView.tsx`, `(tabs)/index.tsx`, `HeaderRestaurant.tsx`, `PanierFAB.tsx`, `panier.tsx` — ajouter accessibilityLabel, parcours de commande en premier.

## [Majeur] Zones tactiles < 44px
- **Fichiers :** `panier.tsx`, `CartePlatMobile.tsx`, `CarteView.tsx` — porter à 44px ou hitSlop.

## [Majeur] Permission notifications trop tôt
- **Fichier :** `usePushNotifications.ts` — différer au premier passage de commande (ne pas toucher la partie localisation).

---

## [Mineur] Écran Itinéraire placeholder dev en prod
- **Fichier :** `(tabs)/itineraire/[id].tsx` — marqueur `// 🔗 réintégrer quand la verticale itinéraire est spécifiée`, masquer route.

## [Mineur] Écrans "bientôt disponible" — préciser condition dans marqueurs existants (déplacés Phase 2).
## [Mineur] Créneaux toujours vides — traiter Phase 5.
## [Mineur] Code mort (carteSlice regionVisible/setRegion, haversineDistance, helpers non utilisés) — signaler suppression. `nombreArticles` = RÉUTILISER (Phase 3), pas supprimer.
## [Mineur] Blocs commentés sans marqueur — annoter `// 🔗` ou supprimer si mort avéré, fichiers : commandes/[id].tsx, panier.tsx, CommandeCard.tsx, login.tsx, restaurant/[slug]/index.tsx.
## [Mineur] Bouton filtres non fonctionnel (commandes/index.tsx) — retirer ou brancher.
## [Mineur] Écran non auth Profil inatteignable — STATUT déjà résolu Phase 2.
## [Mineur] setTimeout non nettoyé (SearchBar, FormulaireCommande) — remplacer par keyboardShouldPersistTaps.
## [Mineur] useGeoSearch une seule suggestion — faire évoluer vers liste.
## [Mineur] Catégories cuisine en dur — traiter Phase 5.
## [Mineur] Statut "prete" traduit différemment — table de libellés unique partagée (CommandeCard.tsx, commandes/[id].tsx).
## [Mineur] FlatList imbriquées — traiter Phase 3.
## [Mineur] Skeleton ×6 boucles — traiter Phase 3.
## [Mineur] Contraste insuffisant textes secondaires (SearchBar, EmptyState, commandes/[id].tsx, (tabs)/index.tsx) — relever à ink-500/600, 13px min.
## [Mineur] Tailwind v3 vs doc v4 — NE RIEN FAIRE, note documentation seulement.
## [Mineur] Bloc .dark alors que dark mode non prévu — app.json: forcer userInterfaceStyle "light".
## [Mineur] handleNotification vide, handler tardif — usePushNotifications.ts: invalider caches à réception, déplacer setNotificationHandler au niveau module.
## [Mineur] apiFetch logout sur tout 401 — distinguer échec auth/réseau, vider cache Query au logout.
## [Mineur] Requêtes recherche non annulées — propager signal (useDebounce, useGeoSearch, useRestaurantSearch) après correction apiFetch.
## [Mineur] Pas de distinction erreur/vide accueil — traiter Phase 5.
## [Mineur] Menu restaurant chargé 2x — dériver popularPlats depuis même sélection filtrée.
## [Mineur] Button hauteur/rayon fixes écrasent variantes — button.tsx: déplacer dans variantes cva.
## [Mineur] Button link avec Text RN au lieu du Text custom — panier.tsx, CommandeListEmpty.tsx.
## [Mineur] Input/Badge livrés mais jamais utilisés — adopter ou signaler.
## [Mineur] elevation-2 et shadow-* mélangés — (tabs)/profil/index.tsx, _layout.tsx, CarteView.tsx: convention unique.
## [Mineur] Stack.Protected sans redirection — STATUT déjà résolu Phase 2.
## [Mineur] isFavorite appelé comme sélecteur mal formé — HeaderRestaurant.tsx.
## [Mineur] Bouton Partager sans action — HeaderRestaurant.tsx: brancher Share ou masquer.
## [Mineur] Pressables suivi vers routes neutres — commandes/[id].tsx: cibler /restaurant/[slug], masquer bandeau avis.
## [Mineur] Numéro support fictif — commandes/[id].tsx: masquer bouton si pas de vrai numéro, signaler dans journal.
## [Mineur] Image Unsplash distante dans panier — remplacer par asset local.

---

## [Amélioration] Pas de mise en file commandes hors ligne — chantier de conception, noter si trop large.
## [Amélioration] OfflineBanner ignore isInternetReachable — utiliser isInternetReachable, respecter insets, action "Réessayer".
## [Amélioration] Pas de télémétrie crash/perf — ne pas ajouter de dépendance sans validation humaine, noter dans journal.
## [Amélioration] Pas de tests automatisés — même remarque.
## [Amélioration] Textes en dur non préparés multi-verticale — STATUT : ignorer, chantier séparé.
## [Amélioration] Compilateur React + mémoïsation redondante — traiter Phase 3.
## [Amélioration] detachInactiveScreens/freezeOnBlur global — traiter Phase 3.
## [Amélioration] Types API/UI mélangés dans src/types/index.ts — séparer en deux fichiers.
## [Amélioration] Réponses API en `any` dans 6 hooks — typer avec ApiResponse<T> existant.