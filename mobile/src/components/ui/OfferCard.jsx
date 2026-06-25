import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Building, Star, MapPin } from 'lucide-react-native';
import useLayoutStore from '../../store/layoutStore';
import { getColors } from '../../theme/colors';
import { F } from '../../theme/fonts';

function TagPill({ label, variant = 'default', C }) {
  const styles = {
    info:    { bg: '#DBEAFE', color: '#1D4ED8' },
    success: { bg: '#DCFCE7', color: '#15803D' },
    default: { bg: C.bgMuted, color: C.textSub  },
  };
  const s = styles[variant] ?? styles.default;
  return (
    <View style={[pill.wrap, { backgroundColor: s.bg }]}>
      <Text style={[pill.text, { color: s.color }]}>{label}</Text>
    </View>
  );
}

const pill = StyleSheet.create({
  wrap: {
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderRadius:      999,
    alignSelf:         'flex-start',
  },
  text: {
    fontFamily:    F.displaySemi,
    fontSize:      11,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});

export default function OfferCard({
  title,
  company,
  location,
  domain,
  contractType,
  tags,
  isFavorite = false,
  onPress,
  onToggleFavorite,
  style,
}) {
  const isDark = useLayoutStore((s) => s.isDarkMode);
  const C      = getColors(isDark);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`Offre : ${title}, ${company}`}
      style={[
        styles.card,
        {
          backgroundColor: C.bgCard,
          shadowColor:     isDark ? '#000' : '#8FA0B8',
        },
        style,
      ]}
    >
      {/* Top row: title + star */}
      <View style={styles.topRow}>
        <Text style={[styles.title, { color: C.text }]} numberOfLines={2}>
          {title}
        </Text>
        {onToggleFavorite ? (
          <TouchableOpacity
            onPress={onToggleFavorite}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            style={styles.starBtn}
          >
            <Star
              size={22}
              color={isFavorite ? C.star : C.textMuted}
              fill={isFavorite ? C.star : 'none'}
              strokeWidth={1.8}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Meta info */}
      <View style={styles.meta}>
        <View style={styles.metaRow}>
          <Building size={13} color={C.textMuted} strokeWidth={1.8} />
          <Text style={[styles.metaText, { color: C.textSub }]} numberOfLines={1}>
            {company}
          </Text>
        </View>
        {location ? (
          <View style={styles.metaRow}>
            <MapPin size={13} color={C.textMuted} strokeWidth={1.8} />
            <Text style={[styles.metaText, { color: C.textMuted }]} numberOfLines={1}>
              {location}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Tags */}
      {(domain || contractType || tags?.length) ? (
        <View style={styles.tags}>
          {domain       ? <TagPill label={domain}       variant="info"    C={C} /> : null}
          {contractType ? <TagPill label={contractType} variant="success" C={C} /> : null}
          {tags?.map((t, i) => (
            <TagPill key={i} label={t.label} variant={t.variant ?? 'default'} C={C} />
          ))}
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius:  16,
    padding:       18,
    marginBottom:  12,
    shadowOpacity: 0.08,
    shadowRadius:  10,
    shadowOffset:  { width: 0, height: 3 },
    elevation:     3,
  },
  topRow: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
    gap:            12,
    marginBottom:   10,
  },
  title: {
    fontFamily: F.displayBold,
    fontSize:   17,
    lineHeight: 23,
    flex:       1,
  },
  starBtn: {
    marginTop: 1,
  },
  meta: {
    gap:          5,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
  metaText: {
    fontFamily: F.bodyReg,
    fontSize:   13,
  },
  tags: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           6,
  },
});
