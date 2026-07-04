import { useEffect, useRef } from 'react';

// Événements considérés comme une "activité utilisateur". On couvre la souris,
// le clavier, le scroll et le tactile (tablette/écran tactile sur le Web).
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'wheel'];

/**
 * Détecte l'inactivité de l'utilisateur et déclenche `onIdle` après `timeout`
 * millisecondes sans la moindre interaction.
 *
 * Le minuteur est un simple `setTimeout` remis à zéro à chaque événement
 * d'activité (throttlé pour éviter de recréer le timer à chaque pixel de
 * `mousemove`), plutôt qu'un `setInterval` qui vérifierait en boucle — moins
 * de réveils CPU quand l'utilisateur est actif.
 *
 * @param {object} options
 * @param {number} options.timeout - Délai d'inactivité en ms avant déconnexion (ex: 30 * 60 * 1000).
 * @param {() => void} options.onIdle - Callback appelé une fois le délai atteint.
 * @param {boolean} [options.enabled=true] - Permet de désactiver le hook (ex: utilisateur non connecté).
 */
export default function useIdleTimer({ timeout, onIdle, enabled = true }) {
  const timerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  // On garde onIdle dans un ref pour ne pas avoir à re-souscrire les
  // listeners à chaque re-render du composant appelant.
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;

  useEffect(() => {
    if (!enabled) return undefined;

    const clearExistingTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };

    const scheduleTimeout = () => {
      clearExistingTimer();
      timerRef.current = setTimeout(() => {
        onIdleRef.current?.();
      }, timeout);
    };

    // Remise à zéro throttlée : on ignore les activités trop rapprochées
    // (< 1s) pour ne pas recréer un setTimeout à chaque frame de mousemove.
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivityRef.current < 1000) return;
      lastActivityRef.current = now;
      scheduleTimeout();
    };

    // Si l'onglet redevient visible après avoir été masqué longtemps,
    // on revérifie explicitement le délai (le setTimeout du navigateur peut
    // être throttlé/suspendu quand l'onglet est en arrière-plan).
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const elapsed = Date.now() - lastActivityRef.current;
        if (elapsed >= timeout) {
          onIdleRef.current?.();
        } else {
          scheduleTimeout();
        }
      }
    };

    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }));
    document.addEventListener('visibilitychange', handleVisibilityChange);

    scheduleTimeout();

    return () => {
      clearExistingTimer();
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, handleActivity));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [timeout, enabled]);
}
