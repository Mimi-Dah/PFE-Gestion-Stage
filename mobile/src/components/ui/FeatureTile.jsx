import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Briefcase } from 'lucide-react-native';
import useLayoutStore from '../../store/layoutStore';
import { getColors } from '../../theme/colors';
import { F } from '../../theme/fonts';

export default function FeatureTile({ Icon = Briefcase, label, onPress }) {
  const isDark = useLayoutStore((s) => s.isDarkMode);
  const C      = getColors(isDark);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={styles.wrapper}>
      <View style={[styles.card, { backgroundColor: C.bgCard, borderColor: C.border }]}>
        <View style={[styles.iconCircle, { backgroundColor: C.primarySoft }]}>
          <Icon size={26} color={C.primary} strokeWidth={2} />
        </View>
        <Text style={[styles.label, { color: C.text }]} numberOfLines={2}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  card: {
    borderRadius:      14,
    borderWidth:       1,
    alignItems:        'center',
    paddingVertical:   22,
    paddingHorizontal: 12,
    gap:               12,
  },
  iconCircle: {
    width:          56,
    height:         56,
    borderRadius:   28,
    alignItems:     'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: F.displaySemi,
    fontSize:   13,
    textAlign:  'center',
    lineHeight: 18,
  },
});
