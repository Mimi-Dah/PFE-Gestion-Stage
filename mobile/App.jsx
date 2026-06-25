import './src/polyfills/urlPolyfill';
import './src/i18n';
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, I18nManager } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useTranslation } from 'react-i18next';
import { RTL_LANGS } from './src/i18n';

SplashScreen.preventAutoHideAsync();
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { navigationRef } from './src/navigation/navigationRef';
import RootNavigator from './src/navigation/RootNavigator';
import ErrorToast from './src/components/common/ErrorToast';
import useLayoutStore from './src/store/layoutStore';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_900Black,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from './src/theme/fonts';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function AppContent() {
  const isDark = useLayoutStore((s) => s.isDarkMode);
  const { i18n } = useTranslation();
  const isRTL = RTL_LANGS.includes(i18n.language);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_900Black,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  // Keep the native I18nManager in sync so the OS reflects the correct direction
  // on any future full native restart. The actual in-session direction is driven by
  // the `direction` style on the root View below (no reload needed).
  useEffect(() => {
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);
  }, [isRTL]);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, direction: isRTL ? 'rtl' : 'ltr' }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator />
      <ErrorToast />
    </View>
  );
}

function LoadingScreen() {
  return (
    <View style={splash.root}>
      <StatusBar style="light" />
      <View style={splash.iconBox}>
        <Text style={splash.iconText}>SF</Text>
      </View>
      <Text style={splash.brand}>StageFlow</Text>
      <Text style={splash.tagline}>Votre plateforme de stages</Text>
    </View>
  );
}

const splash = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#2C3E50', alignItems: 'center', justifyContent: 'center', gap: 16 },
  iconBox: { width: 90, height: 90, borderRadius: 24, backgroundColor: 'rgba(46,204,113,0.25)', alignItems: 'center', justifyContent: 'center' },
  iconText:{ fontSize: 32, fontWeight: '800', color: '#2ECC71', letterSpacing: -1 },
  brand:   { fontSize: 28, fontWeight: '800', color: '#ECF0F1', letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: 'rgba(236,240,241,0.65)' },
});

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer ref={navigationRef}>
            <AppContent />
          </NavigationContainer>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
