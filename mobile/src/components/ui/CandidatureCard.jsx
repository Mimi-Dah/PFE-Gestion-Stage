import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Building, Calendar } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import useLayoutStore from '../../store/layoutStore';
import { getColors } from '../../theme/colors';
import { typography, shadow, radius } from '../../theme/tokens';
import { F } from '../../theme/fonts';
import StatusBadge from './StatusBadge';

/**
 * Usage:
 *   <CandidatureCard
 *     offerTitle="Développeur React Native"
 *     company="TechCorp"
 *     status="En_attente"
 *     date="2025-05-10"
 *     onPress={() => {}}
 *     onWithdraw={() => confirmWithdraw(id)}
 *   />
 */
export default function CandidatureCard({
  offerTitle,
  company,
  status,
  date,
  onPress,
  onWithdraw,
  style,
}) {
  const { t } = useTranslation();
  const isDark = useLayoutStore((s) => s.isDarkMode);
  const C = getColors(isDark);

  const formattedDate = date
    ? new Date(date).toLocaleDateString(t('dashboard.dateLocale'), { day: '2-digit', month: 'short', year: 'numeric' })
    : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`Candidature : ${offerTitle}`}
      style={[
        styles.card,
        { backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border },
        style,
      ]}
    >
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text style={{ ...typography.label, color: C.text }} numberOfLines={2}>
            {offerTitle}
          </Text>
          <View style={styles.metaRow}>
            <Building size={13} color={C.textMuted} />
            <Text style={{ ...typography.caption, color: C.textSub, marginLeft: 4 }} numberOfLines={1}>
              {company}
            </Text>
          </View>
        </View>
        <StatusBadge status={status} />
      </View>
      <View style={styles.bottom}>
        {formattedDate ? (
          <View style={styles.metaRow}>
            <Calendar size={12} color={C.textMuted} />
            <Text style={{ ...typography.small, color: C.textMuted, marginLeft: 4 }}>
              {formattedDate}
            </Text>
          </View>
        ) : null}
        {onWithdraw && status === 'En_attente' ? (
          <TouchableOpacity
            onPress={onWithdraw}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Retirer la candidature"
          >
            <Text style={{ ...typography.small, fontFamily: F.bodySemi, color: C.danger }}>
              Retirer
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card:    { borderRadius: radius.lg, padding: 16, marginBottom: 12 },
  top:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  bottom:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
});
