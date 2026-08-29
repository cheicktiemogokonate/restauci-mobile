# Plan d’exécution — Stabilisation et préparation production de ToutCi

## Objectif et limites

Rendre l’application Expo/React Native fiable, maintenable et vérifiable localement, sans modifier son interface et sans dépendre d’EAS ni d’un compte développeur.

- Le contrat mobile transmis et les réponses backend observées sont les sources de vérité.
- `docs/openapi.json` est historique et n’est utilisé pour aucune décision.
- Les frais de livraison existent ; aucun frais d’emballage n’existe.
- Les projets natifs sont régénérés avec Expo Prebuild puis testés sur émulateurs.
- Les changements locaux antérieurs sont conservés ; aucun reset Git n’est autorisé.

## État au 1er août 2026

L’exécution technique principale est terminée. Les contrôles statiques, les tests, le contrat public, les exports et les builds Release Android/iOS sont validés. Les seuls scénarios non exécutables sans nouvel accès sont les parcours authentifiés contre le backend et les capacités que le backend client ne fournit pas encore.

## Lots exécutés

### 1. Contrat API et couche réseau — terminé

- [x] Base URL normalisée avec `/api/v1` ajouté exactement une fois.
- [x] Routes `/client`, enveloppes, pagination, nullabilité, modes et statuts alignés sur le contrat transmis.
- [x] Validation Zod des réponses critiques avant exposition aux écrans.
- [x] Erreur HTTP structurée, prise en charge de 204/non-JSON, 429 et `Retry-After`.
- [x] Timeout étendu à la lecture du corps et signaux d’annulation préservés.
- [x] Refresh single-flight et une seule répétition après 401.
- [x] Routes publiques sans Bearer inutile.
- [x] Appel push restaurateur/admin supprimé du client final.

### 2. Authentification et isolation des comptes — terminé localement

- [x] Restauration hors ligne depuis un snapshot client minimal validé.
- [x] Les erreurs réseau temporaires ne déconnectent plus arbitrairement l’utilisateur.
- [x] Les courses login/logout/refresh ne peuvent plus écraser une session plus récente.
- [x] Cache React Query nettoyé lors d’un changement d’utilisateur.
- [x] Redirections post-authentification normalisées et protégées contre les routes externes.
- [x] Transfert du panier invité transactionnel avec rollback en cas d’échec.
- [ ] Valider le cookie HTTP-only de refresh sur Android et iOS avec un compte client de test.

### 3. Panier, checkout et tarification — terminé

- [x] Frais d’emballage et seuil local fictif de livraison gratuite supprimés.
- [x] Frais de livraison appliqués uniquement au mode livraison.
- [x] Modes limités à ceux annoncés par le restaurant et acceptés par le backend.
- [x] Quantités agrégées et bornées de 1 à 20.
- [x] Suppression complète d’une ligne distincte de la décrémentation.
- [x] Disponibilité, minimum et coordonnées contrôlés avant envoi.
- [x] Protection synchrone contre le double clic et clé d’idempotence stable uniquement pour le même payload.
- [x] Le backend reste autoritaire sur tous les montants finaux.

### 4. Géolocalisation, carte et recherche — terminé

- [x] Mode test forcé retiré et repli produit placé à Bouaké.
- [x] Permission refusée, service indisponible, timeout et dernière position gérés explicitement.
- [x] Recentrage basé sur les nouvelles coordonnées, sans course avec la caméra.
- [x] Plugin `expo-location` et message iOS français ajoutés à la configuration.
- [x] Itinéraire consommé depuis le détail backend ; appel OSRM direct retiré du mobile.
- [x] Les requêtes restaurants attendent la résolution de la position.
- [x] Recherche et cuisines partagent les mêmes coordonnées et conservent le filtre visible.

### 5. Persistance locale — terminé

- [x] Panier, favoris et adresses versionnés et validés à la lecture.
- [x] Données corrompues rejetées ou récupérées de manière contrôlée.
- [x] Rollback de l’état optimiste si l’écriture durable échoue.
- [x] Adresses migrées vers un index et une entrée chiffrée par adresse pour éviter la limite d’une grosse valeur SecureStore.
- [x] Migration automatique du format historique.

### 6. Commandes et notifications — terminé dans les capacités actuelles

- [x] Statuts, libellés et états terminaux centralisés.
- [x] Pagination réelle et chargement incrémental de l’historique.
- [x] Erreur initiale distincte d’une liste vide ; données conservées en cas d’erreur de page suivante.
- [x] Polling arrêté sur statut terminal ou erreur non récupérable.
- [x] Payload de notification vérifié à l’exécution et navigation protégée lorsque la session est absente.
- [x] Demande et enregistrement d’un token push client désactivés, faute d’endpoint backend compatible.
- [ ] Remplacer le polling par SSE uniquement lorsqu’un transport React Native authentifié aura été validé.

### 7. Architecture, qualité et bundle — terminé pour ce lot

- [x] Règles pures extraites dans `src/domain` : checkout, statuts, stockage et redirection auth.
- [x] Code mort confirmé supprimé : slice carte, helper géographique et anciens créneaux.
- [x] Imports applicatifs racine `@expo/vector-icons` supprimés ; onboarding migré vers Lucide.
- [x] Types `any` et casts de routes risqués retirés des parcours critiques.
- [x] Scripts `typecheck`, `test` et `check` ajoutés ; ancien script cassé supprimé.
- [x] README remplacé par le workflow réel Expo Prebuild local.
- [x] Douze tests unitaires couvrent les invariants métier et les validateurs critiques.
- [ ] Continuer le découpage des gros composants seulement lorsqu’une modification fonctionnelle les touche ; éviter un refactor cosmétique global.

### 8. Validation locale — presque terminé

- [x] TypeScript vert.
- [x] ESLint vert sans avertissement.
- [x] Douze tests sur douze réussissent.
- [x] `git diff --check` vert.
- [x] Dépendances Expo compatibles selon le contrôle local.
- [x] Audit npm hors ligne : aucune vulnérabilité connue dans le lockfile local.
- [x] Backend public : liste/détail/menu/géocodage validés en HTTP 200 avec les enveloppes prévues.
- [x] `npx expo prebuild --no-install` réussi et diff natif contrôlé.
- [x] Android Debug compilé et exécuté.
- [x] Android Release compilé, installé et lancé directement sans Metro.
- [x] iOS Debug compilé et installé sur iPhone 17 Simulator.
- [x] iOS Release compilé, installé et lancé directement sur iPhone 17 Simulator.
- [x] Exports Android, iOS et Web réussis.

## Prochaines étapes nécessitant une décision ou un accès

### A. Tests backend authentifiés — priorité haute

Fournir un compte client de test non sensible ou autoriser sa création, puis exécuter :

1. login, restauration à froid et refresh après expiration ;
2. hors-ligne puis retour réseau ;
3. logout puis reconnexion immédiate ;
4. création de commande en livraison et à emporter ;
5. répétition du même POST avec la même clé d’idempotence ;
6. historique paginé, détail, annulation et statuts terminaux.

### B. Capacités backend — priorité produit

1. définir un endpoint push destiné au client final avant de réactiver l’enregistrement Expo ;
2. décider si le suivi SSE avec Bearer est nécessaire ou si le polling reste le contrat officiel ;
3. confirmer une stratégie de refresh native qui ne dépend pas d’un comportement de cookie implicite.

### C. Exploitation — avant diffusion publique

1. choisir et configurer une observabilité/crash reporting sans exposer de données personnelles ;
2. ajouter une CI `typecheck + lint + tests + export` lorsque le dépôt distant doit l’exécuter ;
3. profiler carte et listes sur un appareil Android modeste avant toute micro-optimisation ;
4. traiter signature, EAS et comptes stores dans un chantier de distribution séparé.

## Porte de non-régression

Avant chaque lot futur :

```bash
npm run check
npx expo install --check
npx expo export --platform android --output-dir /tmp/toutci-android
npx expo export --platform ios --output-dir /tmp/toutci-ios
```

Pour une étape native importante : sauvegarder les dossiers natifs, exécuter `npm run prebuild`, examiner la régénération, puis compiler sur les deux simulateurs. Expo SDK 57 recrée `android/` et `ios/` même sans `--clean`.

## Critère de sortie

Le lot local est clos lorsque tous les contrôles accessibles sont verts et qu’aucun défaut P0/P1 reproductible sans compte backend ne reste ouvert. La mise en production publique restera conditionnée aux tests authentifiés, à l’observabilité et à la signature store.
