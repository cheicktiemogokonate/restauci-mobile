# ToutCi — application mobile client

Application Expo/React Native destinée aux clients ToutCi. Le projet est lié à EAS sous `@tobias_whale/toutci`; les émulateurs restent utilisables sans compte Store.

## Prérequis

- Node.js compatible avec Expo SDK 57 (une version LTS est recommandée)
- npm
- Android Studio avec un émulateur et Java 17 pour Android
- Xcode et CocoaPods pour iOS Simulator

## Installation

```bash
npm ci
cp .env.example .env
```

Définir `EXPO_PUBLIC_API_URL` avec l’origine du backend. Le client ajoute automatiquement `/api/v1` lorsque l’URL ne le contient pas déjà.

Exemples pour un backend local :

- iOS Simulator : `http://127.0.0.1:3000`
- Android Emulator : `http://10.0.2.2:3000`
- appareil physique : URL HTTPS ou adresse IP accessible sur le réseau local

Ne placer aucun secret dans une variable `EXPO_PUBLIC_*` : ces valeurs sont incluses dans l’application.

## Développement local

```bash
npm start
```

Pour régénérer les projets natifs :

```bash
npm run prebuild
```

Expo SDK 57 régénère les dossiers natifs pendant le prebuild, même sans l’option `--clean`. Sauvegarder ou reporter toute personnalisation native dans un config plugin avant d’exécuter cette commande. Ne pas utiliser `npx expo prebuild --clean` sans sauvegarde supplémentaire.

Compiler et lancer sur les émulateurs :

```bash
npm run android
npm run ios
```

Les dossiers `android/` et `ios/` sont générés localement et ignorés par Git dans ce dépôt.

## Contrôles qualité

```bash
npm run check
```

Cette commande exécute TypeScript, ESLint et les tests des règles critiques : checkout, tarification, statuts de commande, persistance locale, validation API et redirections d’authentification. Les contrôles peuvent aussi être lancés séparément avec `npm run typecheck`, `npm run lint` et `npm test`.

Vérifier la résolution des dépendances Expo avec :

```bash
npx expo install --check
```

Créer un export Metro local :

```bash
npx expo export --platform android --output-dir /tmp/toutci-android
npx expo export --platform ios --output-dir /tmp/toutci-ios
```

## Builds locaux proches de la production

Après un prebuild vérifié :

```bash
npx expo run:android --variant release --no-bundler
npx expo run:ios --configuration Release --no-bundler
```

Ces commandes valident le code natif localement. Les comptes développeur seront nécessaires plus tard pour signer et distribuer l’application sur les stores, pas pour les Simulators/émulateurs.

## Contrat backend

Le client utilise les routes versionnées `/api/v1`. Le backend génère la source de vérité OpenAPI et le mobile en conserve une copie synchronisée :

```bash
npm run api:sync
```

Cette commande régénère `openapi/openapi-v1.json` et `src/generated/api-v1.ts` depuis le dépôt backend frère. Les montants envoyés par le mobile ne sont jamais autoritaires : le backend recalcule tous les totaux.

## Authentification, paiements et notifications

- L’access token et le refresh token natifs sont transportés en JSON puis stockés avec SecureStore. Le refresh est renouvelé en rotation et la déconnexion révoque la session distante.
- Les paiements Paystack utilisent le canal `mobile` et reviennent vers `toutci://payments/callback`. L’application relit ensuite la commande ou la réservation depuis l’API ; le deep link seul n’est jamais une preuve de paiement.
- Le token Expo Push est enregistré sur l’API après authentification et retiré lors de la déconnexion. Un development build ou un build EAS est requis pour valider les push réelles.
- Les commandes en attente et les réservations permettent de reprendre un paiement interrompu.

## Builds EAS

```bash
npx eas-cli build --profile development --platform android
npx eas-cli build --profile preview --platform all
```

Les profils sont définis dans `eas.json`. La publication Store nécessite toujours les comptes Apple/Google et leurs informations de signature.

Le suivi de commande conserve volontairement le polling authentifié tant qu’un transport SSE natif n’a pas été adopté comme contrat officiel.
