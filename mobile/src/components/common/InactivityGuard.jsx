import React from 'react';
import { View } from 'react-native';
import { useAuthenticatedInactivityLogout } from '../../hooks/useInactivityLogout';
import { logoutUser } from '../../services/authService';

// Doit rester cohérent avec le timeout web (voir frontend/src/layouts/DashboardLayout.jsx).
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * Enveloppe l'application pour détecter toute interaction tactile et
 * déclencher une déconnexion automatique après 30 minutes d'inactivité.
 *
 * `onStartShouldSetResponderCapture` est appelé pour CHAQUE toucher qui
 * descend l'arbre de vues, avant que les enfants ne deviennent "responder" —
 * on l'utilise uniquement pour observer l'activité, puis on retourne `false`
 * pour ne jamais voler le toucher aux boutons/écrans en dessous.
 */
export default function InactivityGuard({ children }) {
  const { registerActivity } = useAuthenticatedInactivityLogout({
    timeout: INACTIVITY_TIMEOUT_MS,
    onIdle: () => logoutUser({ reason: 'idle' }),
  });

  return (
    <View
      style={{ flex: 1 }}
      onStartShouldSetResponderCapture={() => {
        registerActivity();
        return false;
      }}
    >
      {children}
    </View>
  );
}
