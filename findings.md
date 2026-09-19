# Constats et décisions — Stabilisation de ToutCi

## Règles confirmées

- L’interface visuelle reste inchangée, sauf correction d’un comportement cassé ou trompeur.
- Le développement natif repose sur Expo Prebuild et les émulateurs locaux.
- EAS et les comptes Google Play/Apple Developer ne sont pas requis pour ce chantier.
- `docs/openapi.json` est obsolète et n’est pas une source de vérité.
- Le contrat mobile transmis, les handlers audités qui y sont décrits et les réponses backend observées guident le client.
- Les frais de livraison existent ; aucun frais d’emballage n’existe.
- Le backend calcule tous les montants de commande et reste autoritaire.

## Constats initiaux majeurs

L’audit a identifié des risques réels et non cosmétiques : géolocalisation forcée en mode test, redirections obsolètes, suppression panier incorrecte, tarification inventée, races de session, réponses backend non validées, persistance locale silencieusement corruptible, pagination ignorée, polling non borné, endpoint push incompatible et code mort augmentant le bundle.

Ces défauts accessibles localement ont été corrigés. Les gros composants n’ont pas été découpés uniquement pour réduire leur nombre de lignes : les extractions réalisées isolent des règles métier testables ou des frontières à effets de bord.

## Décisions d’architecture appliquées

| Décision | Résultat |
|---|---|
| Une seule couche HTTP pour auth, timeout, retry et erreurs | Comportement réseau centralisé et testable |
| Validation runtime aux frontières critiques | Un payload invalide ne traverse plus directement jusqu’aux écrans métier |
| Règles pures dans `src/domain` | Checkout, statuts, redirections et stockage testables sans React Native |
| Session locale validée et cache isolé par utilisateur | Meilleure continuité hors ligne, sans fuite de données inter-comptes |
| Backend autoritaire sur la commande | Aucun montant ou seuil métier fictif envoyé par le mobile |
| Une entrée SecureStore par adresse | Évite la croissance d’un JSON monolithique chiffré |
| Polling conservé | Fallback compatible tant que SSE Bearer n’est pas validé sur React Native |
| Push client désactivé | L’endpoint actuel est réservé aux restaurateurs/admins |
| Prebuild considéré comme régénérant | Les personnalisations durables doivent vivre dans `app.json` ou un config plugin |

## Contrat backend effectivement utilisé

- Base : `/api/v1`, routes mobiles : `/client`.
- Succès : généralement `{ success: true, data, meta? }`.
- Erreurs 429 : interprétation prioritaire du statut et de `error`, avec `Retry-After`.
- Register/login : access token JSON, refresh token en cookie HTTP-only.
- Refresh : body JSON valide au minimum `{}`, rotation du cookie.
- Logout : tenté côté backend puis nettoyage local garanti.
- Restaurants et commandes : pagination dans `meta`.
- Détail restaurant : peut fournir itinéraire et temps d’attente selon les coordonnées.
- Création commande : aucun montant client accepté ; recalcul serveur.
- Statuts connus : `recue`, `en_preparation`, `prete`, `servie`, `annulee`.
- Push Expo actuel : non destiné au token d’un client final.

## Vérifications backend publiques

Le backend HTTPS configuré a été interrogé sans exposer son URL dans les journaux de synthèse. Les routes publiques suivantes ont répondu en HTTP 200 et ont passé les schémas du client :

- liste de restaurants avec pagination ;
- détail d’un restaurant ;
- menu ;
- géocodage.

Les routes authentifiées n’ont pas été appelées faute de compte de test et afin de ne pas créer de donnée persistante sans autorisation explicite.

## Constats natifs et performance

- Expo SDK 57 régénère `android/` et `ios/` lors de `prebuild --no-install` ; `--no-clean` ne protège pas les fichiers manuels.
- Android Debug et Release compilent et s’installent sur l’émulateur.
- L’APK Release démarre directement depuis le launcher sans Metro.
- Le contrôle visuel final montre la carte, la recherche, les contrôles de zoom et les trois onglets attendus.
- iOS Debug et Release compilent et s’installent sans erreur applicative ; les warnings relevés sont natifs, dont `-lc++` dupliqué dans la chaîne de liens.
- Les exports finaux pèsent 7,5 Mo HBC sur Android, 7,3 Mo sur iOS et 5,1 Mo de JS principal sur Web.
- Android embarque encore 956 Ko de Material Symbols via la chaîne transitive `expo-router` → `expo-symbols` ; la retirer depuis l’application casserait ou détournerait la dépendance du framework.
- Les images actives les plus lourdes restent autour de 335–349 Ko. Une compression supplémentaire est possible mais non prioritaire sans mesure visuelle sur les écrans concernés.

## Risques résiduels réels

### Testables uniquement avec un compte client

- persistance et rotation du cookie HTTP-only de refresh sur chaque plateforme ;
- reprise de session après expiration réelle ;
- création de commande et autorité des montants ;
- idempotence réelle du POST ;
- historique, détail et annulation authentifiés.

### Dépendants du backend ou du produit

- endpoint push pour le client final ;
- choix officiel entre polling et SSE authentifié ;
- politique d’observabilité et de conservation des données ;
- signature et publication sur les stores.

### Dette raisonnablement différée

- plusieurs composants restent volumineux, mais un découpage global maintenant augmenterait le risque sans bénéfice fonctionnel immédiat ;
- le profilage carte/listes doit être réalisé sur un appareil Android modeste avant d’ajouter des mémorisations ;
- une CI distante et le crash reporting doivent précéder la diffusion publique, pas le développement local.

## Références

- Plan : `task_plan.md`
- Journal de preuves : `progress.md`
- Workflow local : `README.md`
- Client HTTP : `src/lib/api.ts`
- Validation des payloads : `src/lib/apiValidation.ts`
- Règles checkout : `src/domain/checkout.ts`
- Statuts commande : `src/domain/orderStatus.ts`
- Persistance versionnée : `src/domain/localData.ts`
- Redirections auth : `src/domain/authRedirect.ts`

## Audit complémentaire — recherche, Mood et préparation production (13 septembre 2026)

### État réel de la recherche mobile

- La liste de restaurants visible sur la carte est dynamique : elle appelle `POST /api/v1/public/restaurants/search` avec position, précision, horodatage et filtre cuisine.
- Les filtres de cuisine ne sont pas codés en dur : ils sont dérivés des restaurants renvoyés par l'API pour la zone courante.
- Le code de recherche textuelle restaurant est branché sur le même endpoint et le géocodage est branché sur `GET /api/v1/client/geo/geocode`.
- Dans le parcours principal, `SearchBar` reçoit toujours `onMoodPress`. Cette prop remplace le champ de recherche réel par un bouton ouvrant Mood : la recherche textuelle backend existe donc dans le code mais n'est pas accessible depuis l'interface affichée.

### État réel de Mood

- Les quatre suggestions sont une constante locale `MOOD_SUGGESTIONS`.
- La saisie Mood n'est reliée à aucun hook, endpoint, bouton de soumission ou écran de résultats.
- Choisir une suggestion ne fait que recopier son titre dans le champ.
- La ligne « Quoi / Peu importe » est purement visuelle.
- Les emplacements Abidjan/Bouaké sont un sélecteur de développement exposé uniquement en mode `__DEV__`; en production, Mood s'appuie sur la position réelle ou son actualisation.

### Capacités backend disponibles

- Le backend canonique sait déjà filtrer les restaurants visibles par marché, texte, cuisine et mode de commande.
- Il classe les candidats via le module Discovery, avec placements organiques/promotionnels, rotation, badges partenaire et jetons d'attribution.
- Le backend expose des endpoints de recherche séparés pour restaurants et résidences ainsi qu'un endpoint d'événement `detail_open`.
- Il n'existe actuellement aucun contrat Mood, recherche sémantique, suggestion de requête, facette unifiée multi-verticale ou explication de recommandation dans l'OpenAPI mobile.

## Décision produit — rôle central de Mood (13 septembre 2026)

- Mood est la fonctionnalité phare de découverte, pas un filtre secondaire.
- Il doit réunir dans une seule entrée :
  - la recherche précise par établissement, cuisine, lieu ou type ;
  - la recherche par intention exprimée en langage naturel ;
  - les inspirations proposées par l'application ;
  - des résultats multi-verticaux, au minimum restaurants et résidences.
- Le bouton/barre principal qui ouvre Mood est cohérent avec cette vision. Le défaut actuel est fonctionnel : le champ interne ne soumet rien et les suggestions sont statiques.
- Le résultat doit être une sélection classée et contextualisée, pas seulement un annuaire filtré.
- L'intelligence doit exploiter les données réelles de disponibilité, distance, horaires, budget et qualité. Elle peut interpréter l'intention, mais ne doit jamais inventer une disponibilité.
- Chaque résultat devra exposer une raison de recommandation et une action réalisable.
- La recherche classique doit rester un mode compris par Mood et un fallback technique, pas un parcours produit concurrent.
- Les événements restent une extension future possible ; restaurants et résidences appartiennent au socle du lancement.

## Contraintes de développement et d'identité (13 septembre 2026)

- « Sign in with Apple » et « Google Sign-In » relèvent de l'authentification sociale/fédérée.
- Ces deux fournisseurs sont explicitement hors périmètre du chantier actuel.
- Le bloc Google commenté dans `src/app/auth/login.tsx` est donc du code mort à retirer, pas une fonctionnalité à terminer.
- Aucun compte Apple Developer Program ni Google Play Console n'est disponible.
- La cible immédiate est une application production-grade développée et vérifiée localement sur simulateur iOS et émulateur Android.
- Les comptes stores ne sont pas nécessaires pour les tests Android sur émulateur.
- Sur Apple, le simulateur reste utilisable localement ; un Apple Account gratuit avec Personal Team permet aussi des essais limités sur appareil physique, mais ne permet pas une soumission App Store.
- Signature de distribution, TestFlight, Play Internal et publication doivent être séparés dans un gate différé.
- L'authentification progressive est retenue : exploration possible avant connexion, compte classique requis avant une opération transactionnelle ou synchronisée.

## Décision produit — aucune identité pseudonyme (13 septembre 2026)

- Aucun pseudonyme public, alias inventé ou profil anonyme persistant ne doit exister dans l'application.
- Avant connexion, l'utilisateur n'a simplement pas d'identité applicative.
- Mood peut répondre avec les données de la requête courante sans attacher ces données à un profil durable.
- Le panier et les préférences temporaires peuvent rester sur l'appareil ; ils ne constituent pas un compte.
- Lors de l'inscription classique, les informations nécessaires au service doivent être réelles et validées.
- Les identifiants purement techniques de requête, d'idempotence ou de sécurité doivent rester courts, internes et non réutilisés comme profil marketing.

### Autres façades ou fonctions incomplètes

- Paiement dans le profil : écran « Bientôt », sans API de moyens de paiement.
- Assistance : écran « Bientôt », sans centre d'aide ni contact opérationnel.
- OAuth Google : code commenté et contrat non confirmé.
- Favoris et adresses : fonctionnels mais locaux à l'appareil, sans synchronisation de compte.
- Événements : annoncés par la vision produit mais absents du mobile et du type d'établissement courant.
- Le suivi de commande utilise le polling ; l'URL SSE existe mais n'est pas consommée par le mobile.

### Risques de qualification

- Le lot actuel compte 92 chemins locaux non enregistrés dans Git (53 modifiés, 6 supprimés, 33 non suivis).
- Les tests couvrent 27 invariants métier/contrat mais aucun composant ou parcours mobile E2E.
- L'export Android courant réussit, mais une recette native fraîche et complète des changements actuels reste nécessaire sur iOS et Android.
- `task_plan.md`, `progress.md` et certaines décisions de `findings.md` sont antérieurs aux résidences, à Activité, au push client réactivé et aux 27 tests ; ils doivent être remplacés comme source de statut par le nouveau plan production.
