import { create } from 'zustand';

/**
 * Petit store volatile (non persisté) qui transporte la raison de la
 * dernière déconnexion (ex: "idle") jusqu'à l'écran de connexion, pour lui
 * permettre d'afficher un message explicatif à l'utilisateur.
 *
 * Séparé de `authStore` car celui-ci est persisté dans AsyncStorage : on ne
 * veut surtout pas qu'un message d'inactivité survive à un redémarrage de
 * l'application.
 */
const useSessionMessageStore = create((set) => ({
  reason: null,
  setReason: (reason) => set({ reason }),
  clear: () => set({ reason: null }),
}));

export default useSessionMessageStore;
