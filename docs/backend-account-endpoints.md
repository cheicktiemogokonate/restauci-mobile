# Spécification — endpoints de gestion de compte client

Destinée au backend (`restauci.vercel.app`). Conventions alignées sur le contrat mobile existant : préfixe `/api/v1/client`, enveloppe `{ success: true, data }`, erreurs `{ success: false, error, code, details? }`, validation stricte des entrées, JWT access 15 min + refresh en rotation.

Ces trois endpoints sont les derniers manquants pour fermer le cycle de vie du compte (Sprint 2 de la feuille de route) et préparer les exigences de suppression de compte des stores.

## 1. Édition du profil

`PATCH /client/auth/me`

Requête (tous champs optionnels, au moins un présent) :

```json
{
  "nom": "Awa Koné",
  "email": "awa@example.com",
  "adresseDefaut": "Cocody, Abidjan",
  "latitudeDefaut": 5.3599,
  "longitudeDefaut": -4.0083
}
```

Règles :

- `nom` : 2–80 caractères, trim.
- `email` : format e-mail, unique ou null (le compte actuel a `email: null`) ; si fourni, envoyer un e-mail de vérification avant de le rendre actif.
- `telephone` : non modifiable via cet endpoint (identifiant de connexion ; changement dédié plus tard).
- Réponse : le client complet, même forme que `GET /client/auth/me`.
- Erreurs : 422 `VALIDATION_ERROR` avec `details`, 409 si l'e-mail est déjà pris.

## 2. Changement de mot de passe

`POST /client/auth/password`

Requête :

```json
{
  "motDePasseActuel": "…",
  "nouveauMotDePasse": "…"
}
```

Règles :

- bornes identiques à l'inscription : 12–128 caractères (`CLIENT_PASSWORD_MIN_LENGTH` / `MAX_LENGTH` du client mobile).
- Vérifier le mot de passe actuel ; 422 `VALIDATION_ERROR` avec `details.motDePasseActuel: ["Incorrect"]` sinon.
- À la réussite : révoquer toutes les sessions du client **sauf la courante** (rotation du refresh), répondre 200 `{ success: true, data: { passwordChanged: true } }`.

## 3. Suppression de compte

`POST /client/account/delete`

Requête :

```json
{
  "motDePasse": "…",
  "confirmation": "SUPPRIMER"
}
```

Règles :

- Réauthentification obligatoire par mot de passe (422 si incorrect) ; `confirmation` littérale `SUPPRIMER` exigée.
- Le compte reste exigé par les commandes en cours : refuser avec 409 `ACTIVE_ORDERS` si une commande est dans un statut non terminal (`recue`, `en_preparation`, `prete`).
- Effet : révoquer toutes les sessions et tous les push tokens immédiatement ; anonymiser les commandes/réservations conservées pour la comptabilité (remplacer nom/téléphone par des valeurs neutres) ; supprimer le profil sous une rétention de 30 jours (poubelle réversible côté admin).
- Réponse 204 ou `{ success: true, data: { deleted: true } }`.
- Le mobile déconnectera et purgera le stockage local après la réponse, qu'elle soit 2xx ou 409 (avec message distinct).

## Critères d'acceptation backend

1. Les trois endpoints apparaissent dans l'OpenAPI mobile avec schémas stricts.
2. Un test de contrat mobile valide les bornes (12–128, formats, champs requis) comme pour l'inscription.
3. La suppression invalide le refresh token de toutes les sessions (vérifiable : refresh post-suppression → 401).
