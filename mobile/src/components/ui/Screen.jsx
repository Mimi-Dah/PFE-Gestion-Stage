import React from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useLayoutStore from '../../store/layoutStore';
import { getColors } from '../../theme/colors';

import GradientBackground from './GradientBackground';

/**
 * Usage:
 *   <Screen>...</Screen>
 *   <Screen scroll>...</Screen>
 *   <Screen scroll keyboardAware>...</Screen>
 *   <Screen scroll contentStyle={{ paddingHorizontal: 0 }}>...</Screen>
 *   <Screen transparent>...</Screen>   — no background, for use inside GradientBackground
 */
export default function Screen({
  children,
  scroll        = false,
  keyboardAware = false,
  transparent   = false,
  contentStyle,
  style,
}) {
  const isDark = useLayoutStore((s) => s.isDarkMode);
  const C      = getColors(isDark);

  const inner = scroll ? (
    <ScrollView
      style={styles.fill}
      contentContainerStyle={[styles.scrollContent, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, contentStyle]}>{children}</View>
  );

  const safe = (
    <SafeAreaView
      style={[
        styles.fill,
        style,
      ]}
    >
      {inner}
    </SafeAreaView>
  );

  const content = keyboardAware ? (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {safe}
    </KeyboardAvoidingView>
  ) : safe;

  if (transparent) return content;

  return (
    <GradientBackground style={styles.fill}>
      {content}
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  fill:          { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
});
