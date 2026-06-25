import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import useLayoutStore from '../../store/layoutStore';
import { getColors } from '../../theme/colors';
import { F } from '../../theme/fonts';

export default function MetricCircle({ value = 0, max = 5, size = 80, label }) {
  const isDark = useLayoutStore((s) => s.isDarkMode);
  const C = getColors(isDark);

  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.min(Math.max(value / max, 0), 1);
  const strokeDashoffset = circumference * (1 - ratio);

  const color = ratio >= 0.8 ? C.success : ratio >= 0.5 ? C.warning : C.danger;

  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={C.border}
            strokeWidth={6}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={6}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontFamily: F.serifBold, color: C.text, fontSize: size * 0.22 }}>
            {value.toFixed(1)}
          </Text>
        </View>
      </View>
      {label && (
        <Text style={{ fontFamily: F.bodyMed, color: C.textSub, fontSize: 11, textAlign: 'center', maxWidth: size + 16 }}>
          {label}
        </Text>
      )}
    </View>
  );
}
