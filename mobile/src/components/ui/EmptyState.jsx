import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import useLayoutStore from '../../store/layoutStore';
import { getColors } from '../../theme/colors';
import { typography } from '../../theme/tokens';

/**
 * Usage:
 *   <EmptyState emoji="📋" title="Aucune candidature" body="Postulez à des offres pour les voir ici." />
 *   <EmptyState emoji="🔍" title="Aucun résultat" body="Essayez d'autres mots-clés." cta="Voir toutes les offres" onCta={fn} />
 */
export default function EmptyState({ emoji, title, body, cta, onCta, style }) {
  const isDark = useLayoutStore((s) => s.isDarkMode);
  const C = getColors(isDark);

  return (
    <View style={[styles.container, style]}>
      {emoji ? (
        <Text style={styles.emoji} accessibilityElementsHidden>{emoji}</Text>
      ) : null}
      <Text style={{ ...typography.h3, color: C.text, textAlign: 'center', marginBottom: 8 }}>
        {title}
      </Text>
      {body ? (
        <Text style={{ ...typography.body, color: C.textSub, textAlign: 'center' }}>
          {body}
        </Text>
      ) : null}
      {cta && onCta ? (
        <TouchableOpacity
          onPress={onCta}
          style={styles.cta}
          accessibilityRole="button"
          accessibilityLabel={cta}
        >
          <Text style={{ ...typography.label, color: C.primary }}>{cta}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 32 },
  emoji:     { fontSize: 48, marginBottom: 16 },
  cta:       { marginTop: 20, paddingVertical: 8 },
});
