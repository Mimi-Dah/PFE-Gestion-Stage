import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Briefcase } from 'lucide-react-native';
import GlassCard from './GlassCard';
import useLayoutStore from '../../store/layoutStore';
import { getColors } from '../../theme/colors';
import { typography, radius } from '../../theme/tokens';
import { F } from '../../theme/fonts';

/**
 * List item with colored icon tile, title/subtitle, date, and category tag.
 * @example
 * <ListItem
 *   Icon={Briefcase}
 *   tileColor="#DCFCE7"
 *   iconColor="#16A34A"
 *   title="Développeur Web"
 *   subtitle="Acme Corp · Paris"
 *   date="12 mai"
 *   tag="Informatique"
 *   onPress={() => {}}
 * />
 */
export default function ListItem({
  Icon = Briefcase, tileColor, iconColor,
  title, subtitle, date, tag, tagColor,
  onPress,
}) {
  const isDark = useLayoutStore((s) => s.isDarkMode);
  const C      = getColors(isDark);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={styles.wrapper}>
      <GlassCard style={styles.card}>
        <View style={[styles.tile, { backgroundColor: tileColor ?? C.primarySoft }]}>
          <Icon size={20} color={iconColor ?? C.primary} strokeWidth={2} />
        </View>
        <View style={styles.content}>
          <Text style={[styles.title, { color: C.text }]} numberOfLines={1}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: C.textSub }]} numberOfLines={1}>{subtitle}</Text>
          ) : null}
          <View style={styles.footer}>
            {date ? (
              <Text style={[styles.meta, { color: C.textMuted }]}>{date}</Text>
            ) : null}
            {tag ? (
              <View style={[styles.tag, { backgroundColor: tagColor ?? C.primarySoft }]}>
                <Text style={[styles.tagText, { color: iconColor ?? C.primary }]}>{tag}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper:  { marginBottom: 10 },
  card:     { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14 },
  tile: {
    width:          44,
    height:         44,
    borderRadius:   radius.md,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  content:  { flex: 1, gap: 3 },
  title:    { ...typography.label, fontFamily: F.bodySemi, fontSize: 15 },
  subtitle: { ...typography.caption },
  footer:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  meta:     { ...typography.small },
  tag: {
    paddingHorizontal: 8,
    paddingVertical:   2,
    borderRadius:      6,
  },
  tagText: { ...typography.small, fontFamily: F.bodySemi, fontSize: 11 },
});
