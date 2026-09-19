# Feuille de route — application mobile production-grade en local

Dernière mise à jour : 19 septembre 2026

## Statut du plan

Exécution. Le principe d'authentification progressive avec informations réelles est confirmé. La matrice authentifiée backend a été certifiée le 19 septembre 2026 (voir `progress.md`). Les décisions produit de la Passe 1 restent à verrouiller ; les recommandations par défaut du Sprint 1 ci-dessous s'appliquent faute de décision contraire.

## Baseline vérifiée au 19 septembre 2026

- `npm run check` vert : TypeScript, ESLint, 31 tests.
- Parcours authentifiés certifiés contre le backend réel : login (rate limit actif), rotation du cookie de refresh, logout avec invalidation de session, historique paginé, prévalidation (politique géo), création de commande avec montants serveur et idempotence réelle, détail de commande.
- Mood branché sur `POST /public/discovery/mood` ; contrat OpenAPI aligné avec un test de contrat (`tests/backend-alignment.test.mjs`).
- Builds natifs du 1er août antérieurs au moteur Mood et au checkout actuel : recette native fraîche requise.
- 102 chemins Git non commités (57 modifiés, 6 supprimés, 39 non suivis).
- Endpoints absents du contrat backend actuel : édition de profil, changement de mot de passe, suppression de compte (dépendance backend à planifier).

## Plan d'exécution — du stade actuel au gate « production-grade local »

Sept sprints séquencés, chacun avec un critère de sortie mesurable. Les numéros de passe de la feuille de route détaillée (ci-dessous) restent la référence du contenu.

### Sprint 0 — Sécuriser la base (Passe 0) — ~1 jour — URGENT

1. Commettre les 102 chemins en points de contrôle logiques : docs (progress/findings/task_plan), moteur Mood + discovery, checkout/panier, résidences/activité/itinéraire, tests + contrat OpenAPI, composants UI.
2. Vérifier qu'aucun secret n'est suivi (`.env` exclu, mots de passe de test hors sources).
3. Poser un tag de baseline (`baseline-2026-09-19`).
4. Reproduire l'export Android et iOS sur la baseline commitée.

**Sortie : `git status` propre, contrôles verts, tag posé, exports reproductibles.**

### Sprint 1 — Décisions V1 et masquage des trous (Passes 1 et 5 partielle) — ~2 jours

- Trancher les décisions Passe 1. Recommandations par défaut : masquer Paiement et Support (règle : aucun placeholder visible) ; garder favoris et adresses locaux en V1 ; maintenir `sur_place` si le backend le supporte réellement ; Événements hors V1.
- Supprimer le code mort OAuth/Google résiduel.
- Recette native fraîche sur le code actuel : builds Debug et Release iOS + Android, parcours critiques manuels (auth, Mood → détail → commande cash E2E, résidence → devis → réservation → annulation).

**Sortie : aucun écran statique exposé, builds natifs du code courant validés sur simulateur et émulateur.**

### Sprint 2 — Cycle de vie du compte (Passe 5) — 3 à 5 jours + dépendance backend

- Obtenir du backend : édition de profil, changement de mot de passe, suppression de compte (absents du contrat actuel).
- Implémenter côté mobile avec réauthentification pour la suppression, et politique de rétention affichée.
- Fiabiliser enregistrement/désenregistrement push (`/client/push/expo`) lors du changement de compte.
- Tester la reprise de session après expiration réelle de l'access token.

**Sortie : un utilisateur peut créer, modifier, sécuriser et supprimer son compte de bout en bout.**

### Sprint 3 — Système UI et accessibilité (Passes 6 et 7) — 2 à 3 semaines

- Figer tokens (couleur, typographie, espacement, rayon, mouvement) et créer les primitives partagées : Screen, Header/Back, Button, Input, Card, Badge, Section, Dialog, Toast, Skeleton, Empty, Error, Offline.
- Migrer parcours par parcours (auth, découverte/Mood, commande, résidence, activité, profil) en réduisant les 100+ couleurs hexadécimales locales.
- Accessibilité : zones 44 pt, libellés complets, VoiceOver/TalkBack, tailles de texte, réduction des animations, formats français/FCFA/dates.

**Sortie : un motif visuel = une implémentation de référence ; parcours critiques réalisables au lecteur d'écran.**

### Sprint 4 — Tests et CI (Passe 8) — 1 à 2 semaines, partiellement parallélisable au Sprint 3

- Tests composants (React Native Testing Library) sur les primitives et écrans critiques, fixtures déterministes.
- Maestro : onboarding, Mood, connexion, commande cash, réservation, annulation, deep link.
- CI distante (GitHub Actions) bloquante sur : typecheck, lint, tests, contrat OpenAPI, build smoke Android.

**Sortie : principaux parcours rejouables sans intervention manuelle ; toute régression bloque la branche.**

### Sprint 5 — Observabilité et performance (Passe 11) — ~1 semaine

- Intégrer le crash reporting JS + natif (Sentry ou équivalent stable) avec symbolication par version et sans PII.
- Métriques produit/techniques minimales et alertes ; profiler un Android modeste ; budgets démarrage et recherche.

**Sortie : un crash ou une régression de performance est détectable, attribuable et actionnable.**

### Sprint 6 — Intégrations réelles et sécurité (Passes 9 et 10) — 1 à 2 semaines

- Paystack réel en sandbox : webhooks signés, idempotence, réconciliation, remboursement.
- Push validé sur appareils physiques (reçus, jetons invalides, changement de compte).
- Threat model, inventaire des données, CGU / confidentialité / mentions légales, permissions natives justifiées, scan de secrets.

**Sortie : intégrations critiques prouvées sur staging avec mode de reprise documenté.**

### Sprint 7 — Recette finale et gate (Passe 13) — ~1 semaine

- Matrice complète : installation neuve, mise à jour, hors-ligne, réseau lent, permissions refusées, faible stockage, deep links, sur simulateur, émulateur et appareils physiques.
- Corriger tout P0/P1 ; produire le dossier de preuves et la liste des prérequis différés.

**Sortie : gate « production-grade local » atteint — l'application est opérationnelle pour diffusion contrôlée (testeurs).**

### Gate différé — publication stores (hors chemin critique)

Quand les comptes Apple Developer et Google Play existeront : certificats et keystore définitifs, TestFlight et Play Internal, déclarations Apple Privacy / Google Data Safety, métadonnées, déploiement progressif.

### Dépendances et risques

- **Backend** : les endpoints de compte (Sprint 2) doivent être livrés et versionnés à l'identique (contrat + tests). À commander tôt.
- **Décisions produit** : si Paiement ou Support doivent être réels en V1 plutôt que masqués, ajouter 1 à 2 semaines au Sprint 3.
- **Durée totale estimée** : 6 à 9 semaines de travail effectif jusqu'au gate production-grade local, hors publication stores.

## Objectif actif

Amener l'application iOS et Android au niveau production sur le plan logiciel, tout en restant dans un cycle de développement local :

- chaque fonctionnalité exposée est réelle, testée et reliée à un contrat backend stable, ou retirée/masquée ;
- chaque parcours gère chargement, vide, erreur, hors-ligne, permissions refusées et reprise ;
- l'interface est cohérente, accessible et vérifiée sur iOS et Android ;
- paiements, notifications, géolocalisation, suppression de compte et observabilité sont validés localement ou sur un backend de test ;
- les builds pour simulateur iOS et émulateur Android sont reproductibles et réversibles.

## Contraintes confirmées

- aucun compte Apple Developer Program n'est disponible actuellement ;
- aucun compte Google Play Console n'est disponible actuellement ;
- le développement et la recette se font localement sur simulateur iOS et émulateur Android ;
- Sign in with Apple et Google Sign-In sont retirés du périmètre ;
- aucune dépendance, configuration, interface ou tâche ne doit être ajoutée pour ces connexions sociales ;
- signature de distribution, TestFlight, Play Internal et soumission aux stores sont reportés à une phase ultérieure.

## Règle d'identité et de données

- aucun pseudonyme utilisateur n'est créé ou affiché ;
- aucun profil anonyme ou pseudonyme persistant n'est constitué avant connexion ;
- avant connexion, Mood utilise uniquement le contexte nécessaire à la requête courante : texte, position autorisée, heure et filtres ;
- panier et préférences temporaires peuvent rester localement sur l'appareil sans constituer une identité utilisateur ;
- l'inscription/connexion classique reste requise avant commande, réservation, paiement, historique synchronisé et opérations de compte ;
- une fois inscrit, l'utilisateur fournit des informations réelles et validées selon les besoins du service ;
- les identifiants techniques courts éventuellement nécessaires au transport, à l'idempotence ou à la sécurité ne sont ni des pseudonymes publics ni des profils marketing, et ne doivent pas servir à créer un historique anonyme durable.

Cette contrainte ne bloque pas la qualité applicative. Elle bloque uniquement la certification sur appareils/services de distribution qui exigent ces comptes.

## Objectif différé — publication publique

Lorsque les comptes développeur existeront, un chantier séparé couvrira certificats, keystore de distribution, identifiants définitifs, TestFlight, Play Console, métadonnées, déclarations stores et déploiement progressif. Il ne fait pas partie du chemin critique actuel.

## Invariant produit — Mood est le cœur de la découverte

Mood n'est ni un filtre décoratif, ni un écran secondaire, ni une recherche classique renommée.

Il constitue l'entrée principale de découverte de l'application :

- l'utilisateur peut chercher explicitement un établissement, une cuisine, un quartier ou un type de logement ;
- il peut aussi exprimer une intention : « un endroit calme ce soir », « bien manger avec un petit budget », « dormir près d'ici », « une belle sortie en couple » ;
- Mood interprète cette intention avec le contexte utile : position, moment, budget, nombre de personnes, préférences et disponibilités ;
- il propose et classe des opportunités issues de plusieurs verticales, au minimum restaurants et résidences pour cette version ;
- chaque proposition indique pourquoi elle est pertinente et mène directement à une action réelle : consulter, réserver, commander ou s'y rendre ;
- l'architecture reste extensible à d'autres opportunités, comme les événements, sans les rendre obligatoires pour le premier lancement.

La recherche exacte et la recommandation intelligente partagent donc le même parcours, le même état et le même contrat de découverte. Le résultat attendu n'est plus « un annuaire filtré », mais une sélection utile et contextualisée.

## État de départ

### Fonctionnel et déjà relié au backend

- authentification native avec stockage sécurisé ;
- découverte cartographique des restaurants et recherche API sous-jacente ;
- fiches restaurant, menus, panier, commande, paiement et suivi ;
- recherche de résidences, disponibilité, devis, réservation, paiement et annulation ;
- activité consolidée commandes/séjours ;
- boîte de notifications et enregistrement des notifications push ;
- favoris et adresses en local.

### Partiel ou masqué

- l'entrée principale ouvre Mood et le champ soumet désormais des requêtes : recherche textuelle (`/public/etablissements/search`) et intentions Mood (`/public/discovery/mood`) sont branchées et validées par le test de contrat ;
- le champ texte séparé du composant de carte ne doit pas devenir un second parcours concurrent ;
- l'annulation de commande n'est pas implémentée côté mobile ; le `PATCH /client/commandes/{id}` n'a pas de corps documenté dans l'OpenAPI client ;
- favoris et adresses ne sont pas synchronisés avec le compte ;
- le suivi de commande repose sur du polling ; l'URL SSE existe dans le contrat sans être consommée par le mobile ;
- édition de profil, changement de mot de passe et suppression de compte : absents du contrat backend actuel.

### Statique ou absent

- Paiement et Support sont des écrans « Bientôt » ;
- suppression de compte absente ;
- connexions sociales Apple/Google volontairement hors périmètre ; tout code ou affordance résiduel doit être retiré ;
- verticale Événements non implémentée.

### Risques immédiats

- 102 chemins modifiés/non suivis dans le chantier local (Passe 0 non exécutée) ;
- forte dérive visuelle : couleurs, contrôles, en-têtes, retours, états et animations sont souvent locaux aux écrans ;
- accessibilité incomplète et aucune prise en charge explicite de la réduction des animations ;
- recette native antérieure aux derniers changements (Mood, checkout) ;
- endpoints de compte absents du backend (édition profil, mot de passe, suppression) ;
- conformité stores, données légales et intégrations de production non encore closes.

## Principes d'exécution

1. Une passe se termine par une preuve : test, capture, build, contrat ou vérification sur appareil.
2. Une fonctionnalité incomplète n'est pas laissée visible en production.
3. Le backend et le mobile évoluent avec un contrat versionné et testé ensemble.
4. La cohérence UI est construite par composants partagés, puis validée parcours par parcours.
5. Chaque passe conserve les vérifications déjà vertes.

## Passe 0 — Protéger et figer la base actuelle

But : rendre le chantier réversible avant toute nouvelle modification.

- créer une branche dédiée et inventorier les 92 chemins locaux ;
- séparer le travail existant en points de contrôle logiques ;
- figer les commandes de référence : types, lint, tests, contrat API et export Expo ;
- documenter les environnements dev, test, staging et production ;
- vérifier qu'aucun secret ni artefact généré sensible n'est suivi.

Critère de sortie : état Git explicite et récupérable, contrôles actuels verts, exports Android/iOS reproductibles.

## Passe 1 — Verrouiller le périmètre de la première production

Décisions produit à prendre une seule fois :

- confirmer restaurants + résidences comme verticales obligatoires de Mood au lancement ;
- maintenir, implémenter ou masquer le mode `sur_place` ;
- rendre Paiement et Support réels ou les retirer ;
- garder favoris/adresses locaux ou les synchroniser ;
- règles d'annulation, remboursement et livraison ;
- profondeur de la personnalisation Mood : contexte de la requête courante avant connexion, puis historique/préférences uniquement avec compte et consentement ;
- conserver Événements hors de cette version.

Livrable : une matrice « fonctionnalité → écran → endpoint → persistance → états → preuve attendue ».

## Passe 2 — Rendre le contrat API exécutable

But : supprimer les faux positifs où les vérifications passent alors que l'application échoue.

- corriger immédiatement le désaccord `query` / `search` ;
- produire OpenAPI depuis les schémas runtime, ou tester OpenAPI contre ces mêmes validateurs ;
- préciser requêtes, réponses, erreurs, pagination, valeurs nulles et capacités ;
- générer ou centraliser les types mobile pour éliminer les contrats dupliqués ;
- définir versionnement et compatibilité descendante ;
- ajouter des tests de contrat mobile ↔ backend en CI.

Critère de sortie : une requête construite par le mobile est acceptée par le vrai validateur serveur, pour chaque endpoint critique.

## Passe 3 — Construire le moteur de découverte Mood

- définir le langage produit de Mood :
  - intentions : calme, rapide, romantique, famille, travail, découverte, petit budget, premium ;
  - contraintes : où, quand, budget, personnes, cuisine, équipements et disponibilité ;
  - verticales : restaurant et résidence dès la première production ;
- enrichir et indexer les attributs permettant de répondre à ces intentions ;
- créer un contrat de découverte unifié et versionné comprenant :
  - requête libre et intentions structurées ;
  - contexte de localisation et de moment ;
  - contraintes explicites et préférences consenties ;
  - résultats typés restaurant/résidence dans une même réponse ;
  - score, raison de recommandation et actions disponibles ;
  - disponibilité/fraîcheur de la donnée ;
  - placement sponsorisé clairement séparé ;
  - jeton d'attribution, pagination et capacités ;
- servir les inspirations Mood depuis le backend selon la zone, l'heure et les opportunités réellement disponibles ;
- bâtir d'abord un classement déterministe, mesurable et explicable ; le composant sémantique/IA interprète l'intention mais ne doit pas inventer de disponibilité ni contourner les règles métier ;
- prévoir une stratégie de repli vers la recherche/facettes classiques lorsque l'interprétation ou le moteur de recommandation échoue ;
- mesurer impression, intention, clic, ouverture et conversion sans conserver le texte personnel brut ni construire un profil pseudonyme persistant ;
- ajouter cache, limitation de débit, timeouts, sécurité et tests de charge.

Critère de sortie : une même requête peut retourner de façon stable et explicable des restaurants et des résidences pertinents, avec des actions réalisables et un repli fiable.

## Passe 4 — Faire de Mood l'expérience principale côté mobile

- conserver la barre principale comme lanceur de Mood plutôt que créer une recherche concurrente ;
- transformer le champ Mood en vraie entrée universelle : nom précis, catégorie, lieu ou phrase d'intention ;
- charger les inspirations depuis le serveur et réserver les constantes locales aux tests/replis ;
- permettre d'ajuster le contexte sans formulaire lourd : zone, moment, budget, personnes et type d'opportunité ;
- afficher un flux de résultats multi-vertical avec cartes typées mais cohérentes ;
- permettre de passer de la sélection Mood à la carte, à la liste, au détail, puis à la commande/réservation ;
- conserver requête, contexte, résultats et position lors des changements de vue et des allers-retours ;
- gérer soumission, debounce si nécessaire, annulation des requêtes obsolètes et courses réseau ;
- afficher chargement, vide, erreur, hors-ligne, repli et nouvelle tentative ;
- expliquer « Pourquoi cette proposition ? » et identifier clairement le sponsorisé ;
- envoyer les événements d'attribution sans bloquer l'expérience ;
- protéger le lancement par feature flag et fallback.

Critère de sortie : un utilisateur peut exprimer ce qu'il veut sans connaître le catalogue, recevoir restaurants et résidences pertinents, comprendre les choix et agir de bout en bout sur iOS et Android.

## Passe 5 — Fermer les écarts fonctionnels existants

- utiliser la prévalidation serveur avant commande et exposer l'annulation ;
- terminer édition de profil et changement de mot de passe ;
- implémenter suppression de compte côté backend, web et mobile avec réauthentification et politique de rétention ;
- fiabiliser enregistrement/désenregistrement push et changement de compte ;
- implémenter ou retirer Paiement et Support ;
- trancher et appliquer la stratégie favoris/adresses ;
- couvrir callback paiement, reprise, double validation, remboursement et hors-ligne ;
- supprimer le code OAuth/social Apple et Google ainsi que toute affordance associée ; ne pas préparer leur retour dans ce chantier.

Critère de sortie : aucune action visible ne mène à un placeholder ou à un flux sans issue.

## Passe 6 — Standardiser le système d'interface

- capturer la base sur petit Android et petit/grand iPhone ;
- figer tokens de couleur, typographie, espacement, rayon, ombre et mouvement ;
- créer les primitives partagées : Screen, Header/Back, Button, Input, Card, Badge, Section, Dialog, Toast, Skeleton, Empty, Error et Offline ;
- réduire les couleurs hexadécimales et Pressable ad hoc ;
- migrer par parcours complet : onboarding/auth, exploration, commande, résidence, activité, profil ;
- normaliser safe areas, navigation, CTA, textes, prix, dates et retours d'action ;
- maintenir une galerie de composants et d'états.

Critère de sortie : un même motif visuel/comportemental a une seule implémentation de référence.

## Passe 7 — Accessibilité et résilience d'usage

- zones tactiles d'au moins 44 pt et libellés accessibles partout ;
- parcours VoiceOver et TalkBack ;
- tailles de texte, troncature, clavier, focus et formulaires ;
- réduction des animations ;
- contraste et dépendance à la couleur ;
- petit écran, grand texte et tablette ;
- français, FCFA, dates, nombres et fuseaux horaires cohérents.

Critère de sortie : parcours critiques réalisables au lecteur d'écran et avec texte agrandi sans blocage.

## Passe 8 — Automatiser les tests et la CI

- conserver les tests métier actuels et étendre activité, itinéraire, notifications, stockage et hooks ;
- ajouter des tests de composants avec React Native Testing Library ;
- créer des fixtures déterministes pour restaurants, menus, commandes, réservations, notifications et livraison ;
- automatiser avec Maestro : onboarding, recherche, Mood, connexion, paiement cash, paiement en ligne, annulation, réservation, activité, push, deep link et suppression de compte ;
- exécuter la matrice localement sur simulateur iOS et émulateur Android ;
- bloquer les changements sur types, lint, tests, contrat, export/build local et smoke E2E ;
- garder l'exécution EAS hors du chemin critique tant qu'aucun compte de distribution n'est disponible.

Critère de sortie : les principaux parcours sont rejouables sans intervention manuelle.

## Passe 9 — Valider les intégrations et l'exploitation backend

- disposer d'un staging isolé ;
- tester Paystack réel : webhooks signés, idempotence, réconciliation et remboursement ;
- tester Expo Push sur appareils physiques : reçus, jetons invalides et changement de compte ;
- vérifier géocodage, cartes, stockage objet, cache, base de données, e-mail, quotas et pannes ;
- valider sauvegarde/restauration, migrations, jobs, santé et alertes ;
- injecter pannes réseau, rate limits et webhooks dupliqués ;
- écrire les runbooks opératoires.

Critère de sortie : les intégrations critiques ont été prouvées sur staging et ont un mode de reprise documenté.

## Passe 10 — Sécurité et confidentialité applicatives

- threat model : session, SecureStore, IDOR, deep links, paiement, logs et localisation ;
- minimiser les permissions natives et justifier chacune ;
- dresser l'inventaire des données et leur rétention ;
- finaliser CGU, confidentialité et mentions légales ;
- fournir suppression de compte dans l'app et sur le web ;
- préparer l'inventaire qui alimentera plus tard Apple Privacy et Google Data Safety sans bloquer le chantier local ;
- scanner secrets et dépendances, protéger logs et source maps.

Critère de sortie : aucune donnée sensible non maîtrisée et documentation prête à être réutilisée lors du futur chantier stores.

## Passe 11 — Observabilité et performance

- intégrer un outil stable de crash reporting JavaScript + natif ; garder EAS Observe en complément si utile ;
- symboliquer par version, canal et route sans PII ;
- définir métriques produit et techniques, tableaux de bord et alertes ;
- profiler un Android modeste et un iPhone supporté ;
- fixer des budgets : démarrage, recherche, transitions, mémoire et taille ;
- tester réseau lent, arrière-plan, reprise et démarrage à froid.

Critère de sortie : un crash ou une régression de performance en production est détectable, attribuable et actionnable.

## Passe 12 — Industrialiser les builds locaux

- vérifier identifiants, icônes, splash, versioning, permissions et deep links ;
- stabiliser les commandes de builds Debug et Release pour simulateur/émulateur ;
- séparer les configurations dev, test et staging ;
- produire des builds locaux sans Metro et conserver les informations de diagnostic ;
- documenter ce qui nécessitera ultérieurement comptes, certificats et accès stores ;
- ne pas lancer de configuration de soumission ou de signature de distribution dans cette phase.

Critère de sortie : les variantes locales reproductibles s'installent et démarrent sans Metro sur simulateur iOS et émulateur Android.

## Passe 13 — Recette locale et gate production-grade

- matrice simulateur/émulateur : installation neuve, mise à jour, hors-ligne, réseau lent, permissions refusées, faible stockage et deep links ;
- pilote local contrôlé avec backend de test et opérations réelles en mode sandbox ;
- bloquer sur tout P0/P1, crash critique, défaut de paiement ou suppression de compte ;
- produire le dossier de preuves et la liste exacte des prérequis différés avant publication.

## Gate actif « production-grade local »

- parcours critiques verts sur iOS et Android ;
- aucun P0/P1 et aucun écran statique exposé ;
- contrats, migrations, builds locaux et rollback reproductibles ;
- paiement sandbox, localisation et suppression de compte validés ; limites des push sur simulateur explicitement documentées ;
- support, alertes, sauvegardes et runbooks opérationnels ;
- sécurité, confidentialité et mentions légales applicatives traitées ;
- aucun compte développeur Apple/Google requis pour satisfaire ce gate.

## Gate différé « publiable sur les stores »

- comptes Apple Developer Program et Google Play Console disponibles ;
- identifiants, certificats et keystore de distribution définitifs ;
- push validé sur appareils physiques ;
- déclarations Apple Privacy et Google Data Safety soumises ;
- builds TestFlight et Play Internal validés ;
- métadonnées, captures, support, revue stores et déploiement progressif.

## Ordre recommandé

1. Passe 0 : sécuriser l'état actuel.
2. Passes 1–2 : périmètre et contrat.
3. Passes 3–5 : fonctionnalités réelles.
4. Passes 6–8 : cohérence, accessibilité et automatisation.
5. Passes 9–12 : production technique, sécurité et builds locaux.
6. Passe 13 : recette locale et dossier de préparation à la future publication.

## Rythme de collaboration

Pour chaque passe :

1. confirmer le périmètre et le critère de sortie ;
2. implémenter un lot vertical de petite taille ;
3. vérifier sur iOS et Android quand le lot touche l'interface ou le natif ;
4. consigner preuves, écarts et décisions ;
5. ne passer à la suite qu'après fermeture des blocages critiques.

## Prochaine action

Commencer par terminer les décisions produit de la Passe 1, puis exécuter la Passe 0 et traiter le désaccord `query` / `search` en premier élément de la Passe 2. Enfin, spécifier le contrat unifié Mood avant de modifier davantage son interface : la coque visuelle actuelle donne la bonne place au produit, mais elle n'a pas encore le moteur qui doit l'alimenter.
