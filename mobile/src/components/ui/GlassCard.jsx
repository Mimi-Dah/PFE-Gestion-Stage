import React from 'react';
import { View, StyleSheet } from 'react-native';
import useLayoutStore from '../../store/layoutStore';
import { getColors } from '../../theme/colors';
import { radius, shadow } from '../../theme/tokens';

export default function GlassCard({ children, style }) {
  const isDark = useLayoutStore((s) => s.isDarkMode);
  const C = getColors(isDark);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: C.bgCard,
          borderColor: C.border,
        },
        shadow.sm,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    borderWidth:  1,
    padding:      16,
  },
});
