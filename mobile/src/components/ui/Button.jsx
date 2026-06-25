import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import useLayoutStore from '../../store/layoutStore';
import { getColors } from '../../theme/colors';
import { F } from '../../theme/fonts';

const BTN_RADIUS = 12;

export default function Button({
  onPress,
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  pill = false,
  uppercase,
  style,
}) {
  const isDark = useLayoutStore((s) => s.isDarkMode);
  const C = getColors(isDark);

  const variants = {
    primary:   { bg: C.primary,     text: '#FFFFFF', border: 'transparent' },
    secondary: { bg: C.bgCard,      text: C.text,    border: C.border      },
    danger:    { bg: C.danger,      text: '#FFFFFF',  border: 'transparent' },
    ghost:     { bg: 'transparent', text: C.textSub,  border: 'transparent' },
    outline:   { bg: 'transparent', text: C.primary,  border: C.primary    },
    dark:      { bg: '#1E1E1E',     text: '#FFFFFF',  border: 'transparent' },
  };

  const sizes = {
    sm: { py: 8,  px: 16, fontSize: 12, minHeight: 34 },
    md: { py: 12, px: 20, fontSize: 14, minHeight: 44 },
    lg: { py: 14, px: 26, fontSize: 14, minHeight: 48 },
  };

  const v = variants[variant] ?? variants.primary;
  const s = sizes[size] ?? sizes.md;
  const isDisabled = disabled || loading;
  const hasBorder  = variant === 'secondary' || variant === 'outline';
  const isUpper    = uppercase ?? (variant === 'primary');

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        {
          backgroundColor:  v.bg,
          borderColor:      v.border,
          borderWidth:      hasBorder ? 1 : 0,
          paddingVertical:  s.py,
          paddingHorizontal: s.px,
          borderRadius:     pill ? 999 : BTN_RADIUS,
          minHeight:        s.minHeight,
          flexDirection:    'row',
          justifyContent:   'center',
          alignItems:       'center',
          gap:              8,
          opacity:          isDisabled ? 0.45 : 1,
          ...(fullWidth ? { width: '100%' } : {}),
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <Text style={{
          fontFamily:    F.displaySemi,
          color:         v.text,
          fontSize:      s.fontSize,
          textAlign:     'center',
          letterSpacing: isUpper ? 0.5 : 0.1,
          textTransform: isUpper ? 'uppercase' : 'none',
        }}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}
