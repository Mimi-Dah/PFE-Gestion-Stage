import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import useLayoutStore from '../../store/layoutStore';
import { gradients } from '../../theme/gradients';

/**
 * Full-screen soft gradient background. Use as the root wrapper of any screen.
 * @example
 * <GradientBackground>
 *   <SafeAreaView style={{ flex: 1 }}>...</SafeAreaView>
 * </GradientBackground>
 */
export default function GradientBackground({ children, style }) {
  const isDark  = useLayoutStore((s) => s.isDarkMode);
  const colors  = isDark ? gradients.backgroundDark : gradients.background;

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={[styles.container, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
