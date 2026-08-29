# Journal d’exécution — Stabilisation de ToutCi

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
