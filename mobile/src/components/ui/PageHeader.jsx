import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useLayoutStore from '../../store/layoutStore';
import { getColors } from '../../theme/colors';
import { F } from '../../theme/fonts';

/**
 * Usage: <PageHeader title="Reserve" onBack={() => navigation.goBack()} />
 * Pads for the safe area itself — render it at the top of the screen, no extra insets.top needed.
 */
export default function PageHeader({ title, onBack, right, style }) {
  const insets = useSafeAreaInsets();
  const isDark = useLayoutStore((s) => s.isDarkMode);
  const C = getColors(isDark);

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 18,
          paddingTop: insets.top + 12,
          paddingBottom: 12,
        },
        style,
      ]}
    >
      {onBack && (
        <TouchableOpacity onPress={onBack} hitSlop={10} style={{ marginRight: 12 }}>
          <ArrowLeft size={20} color={C.text} strokeWidth={2} />
        </TouchableOpacity>
      )}
      <Text
        style={{ fontFamily: F.bold, fontSize: 17, color: C.text, letterSpacing: -0.2, flex: 1 }}
        numberOfLines={1}
      >
        {title}
      </Text>
      {right}
    </View>
  );
}
