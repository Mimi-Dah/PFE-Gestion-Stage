import { useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import useAuthStore from '../store/authStore';

/**
 * Déconnexion automatique après une période d'inactivité, adaptée aux
 * contraintes de React Native (pas de `mousemove`/`keydown` globaux) :
 *
 * 1. Activité tactile : le composant `InactivityGuard` (qui utilise ce hook)
 *    enveloppe l'application avec `onStartShouldSetResponderCapture`, qui
 *    laisse passer chaque toucher à ses enfants tout en nous permettant de
 *    l'observer — on appelle alors `registerActivity()`.
 * 2. Mise en arrière-plan : quand l'app passe en "background"/"inactive"
 *    (verrouillage de l'écran, changement d'app), on note l'heure. À son
 *    retour au premier plan, si le temps écoulé dépasse `timeout`, on
 *    déclenche `onIdle` immédiatement (un `setTimeout` ne tourne pas de
 *    façon fiable pendant que l'app est suspendue par l'OS).
 *
 * @param {object} options
 * @param {number} options.timeout - Délai d'inactivité en ms (ex: 30 * 60 * 1000).
 * @param {() => void} options.onIdle - Callback déclenché à l'expiration du délai.
 * @param {boolean} [options.enabled=true] - Désactive le hook (ex: utilisateur non connecté).
 * @returns {{ registerActivity: () => void }}
 */
export default function useInactivityLogout({ timeout, onIdle, enabled = true }) {
  const lastActivityRef = useRef(Date.now());
  const backgroundedAtRef = useRef(null);
  const timerRef = useRef(null);
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const scheduleTimer = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(() => onIdleRef.current?.(), timeout);
  }, [timeout, clearTimer]);

  const registerActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (enabled) scheduleTimer();
  }, [enabled, scheduleTimer]);

  useEffect(() => {
    if (!enabled) {
      clearTimer();
      return undefined;
    }

    scheduleTimer();

    const handleAppStateChange = (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        backgroundedAtRef.current = Date.now();
        // On ne peut pas compter sur setTimeout pendant que l'app est
        // suspendue : on désarme le minuteur et on vérifiera à la reprise.
        clearTimer();
        return;
      }

      if (nextState === 'active' && backgroundedAtRef.current) {
        const elapsed = Date.now() - backgroundedAtRef.current;
        backgroundedAtRef.current = null;
        if (elapsed >= timeout) {
          onIdleRef.current?.();
        } else {
          registerActivity();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      clearTimer();
      subscription.remove();
    };
  }, [enabled, timeout, scheduleTimer, clearTimer, registerActivity]);

  return { registerActivity };
}

/**
 * Raccourci pratique : ne s'active que si l'utilisateur est bien connecté,
 * pour ne pas faire tourner de minuteur inutile sur les écrans publics.
 */
export function useAuthenticatedInactivityLogout({ timeout, onIdle }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useInactivityLogout({ timeout, onIdle, enabled: isAuthenticated });
}
