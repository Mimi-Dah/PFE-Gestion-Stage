import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import useLayoutStore from '../../store/layoutStore';
import { getColors } from '../../theme/colors';
import { typography } from '../../theme/tokens';
import Button from './Button';

/**
 * Usage:
 *   <ErrorState message="Impossible de charger les offres." onRetry={refetch} />
 *   <ErrorState message="Une erreur réseau est survenue." />
 */
export default function ErrorState({ message, onRetry, style }) {
  const isDark = useLayoutStore((s) => s.isDarkMode);
  const C = getColors(isDark);

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.icon} accessibilityElementsHidden>⚠️</Text>
      <Text
        style={{
          ...typography.body,
          color: C.textSub,
          textAlign: 'center',
          marginBottom: onRetry ? 24 : 0,
        }}
      >
        {message ?? 'Une erreur est survenue.'}
      </Text>
      {onRetry ? (
        <Button variant="outline" size="sm" onPress={onRetry}>
          Réessayer
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 32 },
  icon:      { fontSize: 40, marginBottom: 16 },
});
