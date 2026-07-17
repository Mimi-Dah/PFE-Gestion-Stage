import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import useAuthStore from '../store/authStore';
import useSessionMessageStore from '../store/sessionMessageStore';

/**
 * Déconnexion "propre" : blackliste le refresh token côté serveur puis vide
 * le store (et donc AsyncStorage, via le middleware `persist`).
 *
 * Séparé de `services/api.js` pour la même raison que côté Web : éviter une
 * dépendance circulaire entre l'instance Axios et le store d'authentification.
 * On utilise ici une instance Axios "nue" plutôt que `api`, car l'access
 * token est souvent déjà expiré au moment où l'on se déconnecte.
 *
 * @param {object} [options]
 * @param {'idle'|string} [options.reason] - Raison de la déconnexion, relayée
 *   à l'écran de connexion via `sessionMessageStore` pour affichage.
 */
export async function logoutUser({ reason } = {}) {
  const { refreshToken } = useAuthStore.getState();

  if (refreshToken) {
    try {
      await axios.post(`${API_BASE_URL}auth/logout/`, { refresh: refreshToken });
    } catch (err) {
      // Ne bloque jamais la déconnexion locale : le token expirera de toute
      // façon côté serveur (ACCESS/REFRESH_TOKEN_LIFETIME).
      console.warn('[Auth] Échec du blacklist du refresh token au logout :', err?.message);
    }
  }

  if (reason) {
    useSessionMessageStore.getState().setReason(reason);
  }
  useAuthStore.getState().logout();
}
