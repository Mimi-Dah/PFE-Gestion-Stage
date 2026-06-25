import React from 'react';
import { View, Text } from 'react-native';
import useLayoutStore from '../../store/layoutStore';
import { getColors } from '../../theme/colors';
import { F } from '../../theme/fonts';

export default function Heading({ emoji, title, subtitle, style }) {
  const isDark = useLayoutStore((s) => s.isDarkMode);
  const C = getColors(isDark);

  return (
    <View style={[{ alignItems: 'center', marginBottom: 32 }, style]}>
      {emoji ? (
        <Text style={{ fontSize: 52, marginBottom: 16 }} accessibilityElementsHidden>
          {emoji}
        </Text>
      ) : null}
      <Text style={{
        fontFamily:    F.serifBold,
        fontSize:      32,
        color:         C.text,
        textAlign:     'center',
        letterSpacing: -0.2,
        lineHeight:    42,
        textTransform: 'uppercase',
      }}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={{
          fontFamily: F.bodyReg,
          fontSize:   14,
          color:      C.textSub,
          textAlign:  'center',
          marginTop:  12,
          lineHeight: 21,
        }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
