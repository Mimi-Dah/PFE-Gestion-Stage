import React from 'react';
import { View, StyleSheet } from 'react-native';
import useLayoutStore from '../../store/layoutStore';
import { getColors } from '../../theme/colors';

/**
 * Usage:
 *   <Divider />
 *   <Divider style={{ marginVertical: 8 }} />
 */
export default function Divider({ style }) {
  const isDark = useLayoutStore((s) => s.isDarkMode);
  const C = getColors(isDark);

  return (
    <View
      style={[{ height: StyleSheet.hairlineWidth, backgroundColor: C.border }, style]}
    />
  );
}
