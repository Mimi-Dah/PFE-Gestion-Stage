import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import useLayoutStore from '../../store/layoutStore';
import { getColors } from '../../theme/colors';
import { typography } from '../../theme/tokens';
import { F } from '../../theme/fonts';

/**
 * Usage:
 *   <SectionHeader title="Mes candidatures" />
 *   <SectionHeader title="Offres récentes" action="Voir tout" onAction={() => navigate('Offers')} />
 */
export default function SectionHeader({ title, action, onAction, style }) {
  const isDark = useLayoutStore((s) => s.isDarkMode);
  const C = getColors(isDark);

  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
        style,
      ]}
    >
      <Text style={{ ...typography.h3, color: C.text }}>{title}</Text>
      {action ? (
        <TouchableOpacity
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={action}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={{ ...typography.caption, fontFamily: F.bodySemi, color: C.primary }}>
            {action}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
