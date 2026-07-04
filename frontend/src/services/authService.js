import axios from 'axios';
import useAuthStore from '../store/authStore';

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';
const API_URL = `${BACKEND_URL}/api/v1/`;

/**
 * Déconnexion "propre" : blackliste le refresh token côté serveur puis vide
 * l'état local (store + sessionStorage).
 *
 * Ce module est volontairement séparé de `api.js` : l'intercepteur Axios de
 * `api.js` a besoin d'importer le store, et le store ne doit pas dépendre de
 * l'instance Axios (pour éviter une dépendance circulaire). `authService.js`
 * peut, lui, dépendre des deux.
 *
 * On utilise une instance Axios "nue" (pas `api`) car l'access token est
 * probablement déjà expiré au moment de la déconnexion (c'est justement le
 * cas le plus fréquent : timeout d'inactivité, refresh token expiré, etc.) —
 * inutile de passer par l'intercepteur qui tenterait un refresh pour rien.
 *
 * @param {object} [options]
 * @param {string} [options.reason] - Raison de la déconnexion, pour affichage
 *   éventuel sur l'écran de login ("session expirée", "inactivité", ...).
 */
export async function logoutUser({ reason } = {}) {
  const refreshToken = useAuthStore.getState().refreshToken || sessionStorage.getItem('refresh_token');

  if (refreshToken) {
    try {
      await axios.post(`${API_URL}auth/logout/`, { refresh: refreshToken });
    } catch (err) {
      // On ne bloque jamais la déconnexion côté client si l'appel réseau
      // échoue (serveur injoignable, jeton déjà expiré/blacklisté, etc.) :
      // le token expirera de toute façon tout seul côté serveur.
      console.warn('[Auth] Échec du blacklist du refresh token au logout :', err?.message);
    }
  }

  useAuthStore.getState().logout();
  return reason;
}
