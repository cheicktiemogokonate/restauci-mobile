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
