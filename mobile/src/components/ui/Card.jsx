import React from 'react';
import { View } from 'react-native';
import useLayoutStore from '../../store/layoutStore';
import { getColors } from '../../theme/colors';
import { shadow } from '../../theme/tokens';

/**
 * Usage:
 *   <Card>...</Card>
 *   <Card style={{ padding: 0 }}>...</Card>  (override padding for custom layouts)
 */
export default function Card({ children, style }) {
  const isDark = useLayoutStore((s) => s.isDarkMode);
  const C = getColors(isDark);

  return (
    <View
      style={[
        {
          backgroundColor: C.bgCard,
          borderRadius: 12,
          padding: 24,
          borderWidth:  1,
          borderColor:  C.border,
          ...(isDark ? {} : shadow.sm),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
