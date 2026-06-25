# Liste des fonctionnalités à corriger

> **Architecture** : React Navigation (pas Expo Router) — `App.jsx` → `RootNavigator` →
> `AuthNavigator` | `StudentNavigator` (bottom tabs + stacks imbriqués)
>
> **API base** : `src/config/api.js` → `http://<expo-host>:8000/api/v1/`
> (dynamique via `Constants.expoConfig.hostUri`)

---

## 🔐 Authentification

- [x] **Login** (`src/screens/auth/LoginScreen.jsx`) ✅ corrigé
  - `POST auth/login/` → payload `{ courriel, password }` ✓ (mapping dans auth.js)
  - `GET  auth/me/`   → profil après login ✓
  - Fix : message d'erreur traduit via `translateError()` (ajouté dans `apiErrors.js`)
  - Fix : logs de debug wrappés dans `__DEV__` (6 → 2 console.debug)

- [x] **Register** (`src/screens/auth/RegisterScreen.jsx`) ✅ corrigé
  - `POST auth/register/` → payload multipart `{ courriel, password, prenom, nom, role: 'Étudiant' }`
  - Fix : `email→courriel`, `first_name→prenom`, `last_name→nom`, JSON→FormData
  - Fix : timeout 10 s AbortController + logs `__DEV__` dans `src/services/auth.js`
  - Fix : messages d'erreur lisibles en français — `src/utils/apiErrors.js` (helper réutilisable)
  - Fix : erreurs affichées inline sous chaque champ via `setError` react-hook-form
  - Fix backend : `exception_handler.py` → `message` propre + `details` avec codes DRF
  - Redirige vers VerifyAccount en cas de succès

- [ ] **Vérification e-mail** (`src/screens/auth/VerifyAccountScreen.jsx`)
  - Écran statique (aucun appel API)
  - Affiche juste un message « vérifiez votre boîte mail »

- [ ] **Mot de passe oublié** (`src/screens/auth/ForgotPasswordScreen.jsx`)
  - `POST auth/password-reset/` → payload `{ email }`

- [ ] **Réinitialisation mot de passe** (`src/screens/auth/ResetPasswordScreen.jsx`)
  - `POST auth/password-reset/confirm/` → payload `{ token, password }`
  - Token reçu via param de route (lien e-mail)

---

## 🏠 Tableau de bord étudiant

- [x] **Dashboard** (`src/screens/student/DashboardScreen.jsx`) — onglet "Accueil" ✅ corrigé
  - `GET candidatures/mes-candidatures/` → stats candidatures (en attente / acceptées) ✓
  - `GET conventions/` → info stage actif ✓
  - Fix : `offre_details?.titre` → `offre_titre` (champ plat backend)
  - Fix : `offre_details?.entreprise_nom` → `entreprise_nom` (champ plat backend)

---

## 🔍 Offres de stage

- [x] **Liste des offres** (`src/screens/student/OffersScreen.jsx`) ✅ corrigé
  - Fix : `est_favori` → `is_favori`
  - Fix : `entreprise_nom` → `entreprise?.nom` (champ imbriqué)
  - Fix : `duree_mois` → `duree_semaines`

- [x] **Détail d'une offre** (`src/screens/student/OfferDetailScreen.jsx`) ✅ corrigé
  - Fix : `est_favori`, `entreprise_nom`, `duree_mois`, `remuneration`→`gratification`, `competences_requises`→`exigences`
  - Fix : suppression `niveau_requis` (champ inexistant dans le modèle)
  - Fix : erreur candidature via `translateError()`, logs wrappés `__DEV__`

---

## 📋 Candidatures

- [x] **Mes candidatures** (`src/screens/student/CandidaturesScreen.jsx`) ✅ corrigé
  - Fix : `item.id` → `item.id_candidature` (keyExtractor + withdraw)
  - Fix : `offre_details` → `offre_detail` (sans 's')
  - Fix : `date_candidature` → `postule_le`
  - Fix : `offre.entreprise_nom` → `offre.entreprise?.nom`

---

## 💼 Mon Stage

- [x] **Gestion du stage** (`src/screens/student/MyInternshipScreen.jsx`) ✅ corrigé
  - Fix : `convention.id` → `convention.id_convention`
  - Fix : `convention.offre_details` → champs plats `offre_titre` + `entreprise_nom`
  - Fix : `statut_signature_etudiant === 'Signé'` → `!!signe_par_etudiant_le`
  - Fix : upload `'document'` → `'fichier_signe'`

- [x] **Absences** (`src/screens/student/AbsencesScreen.jsx`) ✅ corrigé
  - Fix : `item.date` → `item.date_absence`
  - Fix : `item.raison` → `item.motif_signalement`
  - Fix : statut `'justifiée'` → `'Justifiée'` (casse exacte du backend)
  - Fix : payload `{ message }` → `{ justification }`

---

## ⭐ Favoris

- [x] **Mes favoris** (`src/screens/student/FavorisScreen.jsx`) ✅ corrigé
  - Fix : `offre.entreprise_nom` → `offre.entreprise?.nom`
  - Fix : `offre.duree_mois` → `offre.duree_semaines`

---

## 📊 Évaluations

- [x] **Évaluations** (`src/screens/student/EvaluationsScreen.jsx`) ✅ corrigé
  - `GET evaluations/` → appel propre via `src/services/evaluations.js`
  - Tabs : Entreprise / Mi-parcours / Finale (auto-évaluation supprimée)

---

## 👤 Profil

- [x] **Profil étudiant** (`src/screens/student/ProfileScreen.jsx`) — onglet "Profil" ✅ corrigé
  - `PATCH auth/me/` → champs `{ prenom, nom, telephone, adresse }` (était `auth/profil/` → 404)
  - `PATCH auth/me/` → upload photo (multipart, image JPG/PNG)
  - `PATCH auth/me/` → upload CV (multipart, PDF)
  - Fix : `user?.email` → `user?.courriel` (email s'affichait vide)
  - Fix : 415 → ajout `JSONParser` dans `ProfileMeView.parser_classes` (backend/accounts/views.py:146)
  - ⚠️ Connu : photo et CV ne se rafraîchissent pas dans l'UI après upload (hors scope)

---

## 🔧 Infrastructure / Config (non-fonctionnel, transversal)

- [ ] **Config API centrale** (`src/config/api.js`)
  - URL dynamique via `Constants.expoConfig.hostUri` ✅ déjà en place
  - Fallback `EXPO_PUBLIC_API_URL` ✅

- [ ] **Client Axios** (`src/services/api.js`)
  - Intercepteur auth (Bearer token) ✅
  - Refresh automatique sur 401 ✅
  - Gestion des erreurs réseau / HTTP ✅

- [ ] **Navigation** (`src/navigation/`)
  - `RootNavigator` : attend hydratation Zustand avant de rendre ✅
  - `AuthNavigator` : Login → Register → VerifyAccount → ForgotPassword → ResetPassword
  - `StudentNavigator` : 5 onglets top-bar + stacks imbriqués ✅

---

## ⚠️ Points d'attention à vérifier avant de corriger

1. **`auth/login/`** : le payload mobile envoie `courriel` (français) — le backend
   attend-il `courriel` ou `email` ?
2. **`auth/profil/`** vs **`auth/me/`** : ProfileScreen appelle `auth/profil/`
   mais l'exploration backend montre `auth/me/` pour GET/PATCH. À confirmer.
3. **Auto-évaluations** : EvaluationsScreen filtre avec `?type=auto` sur
   `/evaluations/` mais le backend a `/evaluations/auto/` séparé.
4. ~~**RegisterScreen** : envoie `first_name` / `last_name` (anglais)~~ ✅ corrigé dans `auth.js`
