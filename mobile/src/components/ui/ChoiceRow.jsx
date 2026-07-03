import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, I18nManager } from 'react-native';
import { ChevronRight, ChevronLeft, User, Star, AlertCircle, Building, MapPin } from 'lucide-react-native';
import useLayoutStore from '../../store/layoutStore';
import { getColors } from '../../theme/colors';
import { typography } from '../../theme/tokens';
import Divider from './Divider';

const ICON_MAP = {
  'person-outline': User,
  'star-outline': Star,
  'alert-circle-outline': AlertCircle,
  'business-outline': Building,
  'location-outline': MapPin,
};

export default function ChoiceRow({
  Icon,
  icon,
  emoji,
  label,
  onPress,
  last = false,
  rightContent,
  style,
}) {
  const isDark = useLayoutStore((s) => s.isDarkMode);
  const C = getColors(isDark);

  const IconToRender = Icon || (icon ? ICON_MAP[icon] : null);

  return (
    <>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.65}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[styles.row, style]}
      >
        <View style={styles.left}>
          {emoji ? (
            <Text style={styles.emoji}>{emoji}</Text>
          ) : IconToRender ? (
            <View style={[styles.iconWrap, { backgroundColor: C.primarySoft }]}>
              <IconToRender size={18} color={C.primary} strokeWidth={2} />
            </View>
          ) : null}
          <Text style={{ ...typography.body, color: C.text, flex: 1 }}>{label}</Text>
        </View>
        <View style={styles.right}>
          {rightContent ?? null}
          {I18nManager.isRTL
            ? <ChevronLeft size={16} color={C.textMuted} style={{ marginEnd: 4 }} />
            : <ChevronRight size={16} color={C.textMuted} style={{ marginStart: 4 }} />}
        </View>
      </TouchableOpacity>
      {!last && <Divider />}
    </>
  );
}

const styles = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, minHeight: 52 },
  left:     { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  right:    { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  emoji:    { fontSize: 22, width: 32, textAlign: 'center' },
});
