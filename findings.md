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
