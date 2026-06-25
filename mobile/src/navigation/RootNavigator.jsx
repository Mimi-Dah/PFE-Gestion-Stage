import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import useAuthStore from '../store/authStore';
import useLayoutStore from '../store/layoutStore';
import { getColors } from '../theme/colors';
import AuthNavigator from './AuthNavigator';
import StudentNavigator from './StudentNavigator';

export default function RootNavigator() {
  const isDark = useLayoutStore((s) => s.isDarkMode);
  const C = getColors(isDark);

  // Zustand with AsyncStorage needs a tick to hydrate persisted state
  const [hydrated, setHydrated] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    // Wait for zustand-persist to hydrate from AsyncStorage
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    // If already hydrated (e.g. fast reload), skip the wait
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    }
    return unsub;
  }, []);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg }}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return isAuthenticated ? <StudentNavigator /> : <AuthNavigator />;
}
