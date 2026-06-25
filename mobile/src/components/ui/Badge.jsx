import React from 'react';
import { View, Text } from 'react-native';
import useLayoutStore from '../../store/layoutStore';
import { getColors } from '../../theme/colors';
import { F } from '../../theme/fonts';

/**
 * Radius : 6px pour les badges (éléments courts), cohérent avec le système 12px
 * Pas de forme pill — les badges restent rectangulaires avec coins doux (6px)
 */
const BADGE_RADIUS = 6;

function getVariants(isDark) {
  if (isDark) {
    return {
      success: { bg: '#052E16', text: '#34D399', border: 'rgba(52, 211, 153, 0.20)' },
      warning: { bg: '#422006', text: '#FCD34D', border: 'rgba(252, 211, 77, 0.20)' },
      danger:  { bg: '#450A0A', text: '#FCA5A5', border: 'rgba(252, 165, 165, 0.20)' },
      info:    { bg: '#0C1A3B', text: '#93C5FD', border: 'rgba(147, 197, 253, 0.20)' },
      muted:   { bg: '#1E293B', text: '#94A3B8', border: 'rgba(148, 163, 184, 0.15)' },
    };
  }
  return {
    success: { bg: '#DCFCE7', text: '#15803D', border: 'rgba(21, 128, 61, 0.20)' },
    warning: { bg: '#FEF3C7', text: '#B45309', border: 'rgba(180, 83, 9, 0.20)' },
    danger:  { bg: '#FEE2E2', text: '#DC2626', border: 'rgba(220, 38, 38, 0.20)' },
    info:    { bg: '#DBEAFE', text: '#1D4ED8', border: 'rgba(29, 78, 216, 0.20)' },
    muted:   { bg: '#F1F5F9', text: '#64748B', border: 'rgba(100, 116, 139, 0.15)' },
  };
}

export default function Badge({ label, variant = 'muted', style }) {
  const isDark = useLayoutStore((s) => s.isDarkMode);
  const C = getColors(isDark);
  const variants = getVariants(isDark);

  const v = variants[variant];
  const bg     = v?.bg     ?? C.bgInput;
  const color  = v?.text   ?? C.textSub;
  const border = v?.border ?? 'transparent';

  return (
    <View
      style={[
        {
          backgroundColor:  bg,
          borderRadius:     BADGE_RADIUS,
          borderWidth:      1,
          borderColor:      border,
          paddingHorizontal: 8,
          paddingVertical:  3,
          alignSelf:        'flex-start',
        },
        style,
      ]}
    >
      <Text style={{
        fontFamily:    F.bodySemi,
        color,
        fontSize:      11,
        letterSpacing: 0.3,
        textTransform: 'uppercase',
      }}>
        {label}
      </Text>
    </View>
  );
}
