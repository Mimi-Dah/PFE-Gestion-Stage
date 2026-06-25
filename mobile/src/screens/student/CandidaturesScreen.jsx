import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase, Clock, CheckCircle2, XCircle, Trash2, FileText,
  MapPin, PlayCircle, BadgeCheck, ChevronRight,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFloatingTabPadding } from '../../components/ui/FloatingTabBar';
import { F } from '../../theme/fonts';
import { shadow, radius } from '../../theme/tokens';
import useLayoutStore from '../../store/layoutStore';
import { getColors } from '../../theme/colors';
import api from '../../services/api';

const STATUS_COLORS = {
  En_attente:          { color: '#D97706', bg: '#FFFBEB', darkBg: '#2D2000', icon: Clock         },
  en_attente:          { color: '#D97706', bg: '#FFFBEB', darkBg: '#2D2000', icon: Clock         },
  pending:             { color: '#D97706', bg: '#FFFBEB', darkBg: '#2D2000', icon: Clock         },
  Acceptée:            { color: '#059669', bg: '#ECFDF5', darkBg: '#002D1A', icon: CheckCircle2  },
  acceptée:            { color: '#059669', bg: '#ECFDF5', darkBg: '#002D1A', icon: CheckCircle2  },
  acceptee:            { color: '#059669', bg: '#ECFDF5', darkBg: '#002D1A', icon: CheckCircle2  },
  Refusée:             { color: '#DC2626', bg: '#FEF2F2', darkBg: '#2D0000', icon: XCircle       },
  refusée:             { color: '#DC2626', bg: '#FEF2F2', darkBg: '#2D0000', icon: XCircle       },
  refusee:             { color: '#DC2626', bg: '#FEF2F2', darkBg: '#2D0000', icon: XCircle       },
  Convention_en_cours: { color: '#1B6EF3', bg: '#EFF6FF', darkBg: '#001A2D', icon: FileText      },
  Stage_actif:         { color: '#059669', bg: '#ECFDF5', darkBg: '#002D1A', icon: PlayCircle    },
  Terminé:             { color: '#64748B', bg: '#F8FAFC', darkBg: '#1A1F2E', icon: BadgeCheck    },
  terminé:             { color: '#64748B', bg: '#F8FAFC', darkBg: '#1A1F2E', icon: BadgeCheck    },
  Retirée:             { color: '#64748B', bg: '#F8FAFC', darkBg: '#1A1F2E', icon: Trash2        },
  retirée:             { color: '#64748B', bg: '#F8FAFC', darkBg: '#1A1F2E', icon: Trash2        },
};

async function fetchCandidatures() {
  const r = await api.get('candidatures/mes-candidatures/');
  return r.data?.results ?? r.data ?? [];
}

function getCount(all, filterKey) {
  if (filterKey === 'Toutes') return all.length;
  return all.filter((c) => c.statut === filterKey).length;
}

export default function CandidaturesScreen({ navigation }) {
  const { t } = useTranslation();
  const insets  = useSafeAreaInsets();
  const tabPad  = useFloatingTabPadding();
  const isDark  = useLayoutStore((s) => s.isDarkMode);
  const C       = getColors(isDark);
  const qc      = useQueryClient();
  const [filter, setFilter] = useState('Toutes');

  const FILTERS_I18N = [
    { key: 'Toutes',             label: t('candidatures.filters.all')       },
    { key: 'En_attente',         label: t('candidatures.filters.pending')   },
    { key: 'Acceptée',           label: t('candidatures.filters.accepted')  },
    { key: 'Convention_en_cours',label: t('candidatures.filters.convention')},
    { key: 'Stage_actif',        label: t('candidatures.filters.active')    },
    { key: 'Refusée',            label: t('candidatures.filters.refused')   },
    { key: 'Terminé',            label: t('candidatures.filters.finished')  },
  ];

  const STATUS_MAP_I18N = {
    En_attente:          { label: t('candidatures.status.En_attente'),          color: '#D97706', bg: '#FFFBEB', darkBg: '#2D2000', icon: Clock         },
    en_attente:          { label: t('candidatures.status.En_attente'),          color: '#D97706', bg: '#FFFBEB', darkBg: '#2D2000', icon: Clock         },
    pending:             { label: t('candidatures.status.En_attente'),          color: '#D97706', bg: '#FFFBEB', darkBg: '#2D2000', icon: Clock         },
    Acceptée:            { label: t('candidatures.status.Acceptée'),            color: '#059669', bg: '#ECFDF5', darkBg: '#002D1A', icon: CheckCircle2  },
    acceptée:            { label: t('candidatures.status.Acceptée'),            color: '#059669', bg: '#ECFDF5', darkBg: '#002D1A', icon: CheckCircle2  },
    acceptee:            { label: t('candidatures.status.Acceptée'),            color: '#059669', bg: '#ECFDF5', darkBg: '#002D1A', icon: CheckCircle2  },
    Refusée:             { label: t('candidatures.status.Refusée'),             color: '#DC2626', bg: '#FEF2F2', darkBg: '#2D0000', icon: XCircle       },
    refusée:             { label: t('candidatures.status.Refusée'),             color: '#DC2626', bg: '#FEF2F2', darkBg: '#2D0000', icon: XCircle       },
    refusee:             { label: t('candidatures.status.Refusée'),             color: '#DC2626', bg: '#FEF2F2', darkBg: '#2D0000', icon: XCircle       },
    Convention_en_cours: { label: t('candidatures.status.Convention_en_cours'), color: '#1B6EF3', bg: '#EFF6FF', darkBg: '#001A2D', icon: FileText      },
    Stage_actif:         { label: t('candidatures.status.Stage_actif'),         color: '#059669', bg: '#ECFDF5', darkBg: '#002D1A', icon: PlayCircle    },
    Terminé:             { label: t('candidatures.status.Terminé'),             color: '#64748B', bg: '#F8FAFC', darkBg: '#1A1F2E', icon: BadgeCheck    },
    terminé:             { label: t('candidatures.status.Terminé'),             color: '#64748B', bg: '#F8FAFC', darkBg: '#1A1F2E', icon: BadgeCheck    },
    Retirée:             { label: t('candidatures.status.Retirée'),             color: '#64748B', bg: '#F8FAFC', darkBg: '#1A1F2E', icon: Trash2        },
    retirée:             { label: t('candidatures.status.Retirée'),             color: '#64748B', bg: '#F8FAFC', darkBg: '#1A1F2E', icon: Trash2        },
  };

  const { data: all = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['candidatures'],
    queryFn:  fetchCandidatures,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`candidatures/${id}/`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['candidatures'] }),
    onError:    (e) => Alert.alert(t('candidatures.deleteError'), e.message || t('candidatures.cancelError')),
  });

  const confirmDelete = (id) => {
    Alert.alert(
      t('candidatures.cancelTitle'),
      t('candidatures.cancelMsg'),
      [
        { text: t('common.no'), style: 'cancel' },
        { text: t('candidatures.cancelConfirm'), style: 'destructive', onPress: () => deleteMutation.mutate(id) },
      ],
    );
  };

  const filtered = filter === 'Toutes'
    ? all
    : all.filter((c) => c.statut === filter);

  const renderItem = useCallback(({ item }) => (
    <CandidatureCard
      item={item}
      C={C}
      isDark={isDark}
      statusMap={STATUS_MAP_I18N}
      labelFollow={t('candidatures.followBtn')}
      labelView={t('candidatures.viewBtn')}
      labelWithdraw={t('candidatures.withdrawBtn')}
      onDelete={() => confirmDelete(item.id_candidature)}
      onViewOffer={() => {
        const offerId = item.offre || item.id_offre;
        if (offerId) navigation.navigate('OfferDetail', { offerId });
      }}
      onFollowStage={() => navigation.navigate('StageTab', { screen: 'MyInternship' })}
    />
  ), [C, isDark, navigation, STATUS_MAP_I18N, t]);

  /* Only show filters that have at least one item (except "Toutes") */
  const visibleFilters = FILTERS_I18N.filter(
    f => f.key === 'Toutes' || getCount(all, f.key) > 0
  );

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 20, backgroundColor: C.bgCard, borderBottomColor: C.border }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.pageTitle, { color: C.text }]}>{t('candidatures.title')}</Text>
            <Text style={[styles.pageCount, { color: C.textMuted }]}>
              {all.length} {t('candidatures.title').toLowerCase()}
            </Text>
          </View>
          <View style={[styles.headerIcon, { backgroundColor: C.primarySoft }]}>
            <FileText size={17} color={C.primary} strokeWidth={1.8} />
          </View>
        </View>

        {/* ── Filter tabs ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {visibleFilters.map(({ key, label }) => {
            const active = filter === key;
            const count  = getCount(all, key);
            return (
              <TouchableOpacity
                key={key}
                style={[styles.tab, active && { borderBottomColor: C.primary, borderBottomWidth: 2 }]}
                onPress={() => setFilter(key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabLabel, { color: active ? C.primary : C.textSub }]}>{label}</Text>
                {count > 0 && (
                  <View style={[styles.tabBadge, { backgroundColor: active ? C.primary : C.bgMuted }]}>
                    <Text style={[styles.tabBadgeText, { color: active ? '#fff' : C.textMuted }]}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── List ── */}
      {isLoading ? (
        <View style={styles.centered}><ActivityIndicator color={C.primary} size="large" /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id_candidature)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: tabPad, gap: 12 }}
          refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={C.primary} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState C={C} filter={filter} t={t} filterLabels={FILTERS_I18N} />}
        />
      )}
    </View>
  );
}

function CandidatureCard({ item, C, isDark, statusMap, labelFollow, labelView, labelWithdraw, onDelete, onViewOffer, onFollowStage }) {
  const colors     = STATUS_COLORS[item.statut] ?? STATUS_COLORS['en_attente'];
  const label      = statusMap?.[item.statut]?.label ?? colors.label ?? item.statut;
  const st         = { ...colors, label };
  const StatusIcon = st.icon;
  const offre      = item.offre_detail || {};
  const logo       = (offre.entreprise?.nom?.[0] || offre.titre?.[0] || '?').toUpperCase();
  const statusBg   = isDark ? st.darkBg : st.bg;

  const isPending   = item.statut === 'En_attente' || item.statut === 'en_attente';
  const isActive    = item.statut === 'Acceptée' || item.statut === 'Stage_actif';
  const appliedDate = item.postule_le
    ? new Date(item.postule_le).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <View style={styles.cardShadowWrap}>
      <View style={[styles.card, { backgroundColor: C.bgCard, borderColor: C.border }]}>
        <View style={[styles.cardAccent, { backgroundColor: st.color }]} />

        <View style={styles.cardInner}>
          {/* Top row */}
          <View style={styles.cardTop}>
            <View style={[styles.logoBox, { backgroundColor: C.primarySoft }]}>
              <Text style={[styles.logoText, { color: C.primary }]}>{logo}</Text>
            </View>

            <View style={styles.cardMeta}>
              <Text style={[styles.cardTitle, { color: C.text }]} numberOfLines={1}>
                {offre.titre || 'Offre de stage'}
              </Text>
              <Text style={[styles.cardCompany, { color: C.textSub }]} numberOfLines={1}>
                {offre.entreprise?.nom || 'Entreprise'}
              </Text>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
              <StatusIcon size={11} color={st.color} strokeWidth={2.5} />
              <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
            </View>
          </View>

          {/* Info chips row */}
          <View style={styles.chipsRow}>
            {offre.localisation ? (
              <View style={[styles.infoChip, { backgroundColor: C.bgMuted }]}>
                <MapPin size={11} color={C.textMuted} strokeWidth={1.8} />
                <Text style={[styles.infoChipText, { color: C.textMuted }]}>{offre.localisation}</Text>
              </View>
            ) : null}
            {offre.duree_semaines ? (
              <View style={[styles.infoChip, { backgroundColor: C.bgMuted }]}>
                <Clock size={11} color={C.textMuted} strokeWidth={1.8} />
                <Text style={[styles.infoChipText, { color: C.textMuted }]}>{offre.duree_semaines} sem.</Text>
              </View>
            ) : null}
            {offre.domaine ? (
              <View style={[styles.infoChip, { backgroundColor: '#EFF6FF' }]}>
                <Text style={[styles.infoChipText, { color: '#1D4ED8' }]}>{offre.domaine}</Text>
              </View>
            ) : null}
          </View>

          {/* Footer */}
          <View style={[styles.cardFooter, { borderTopColor: C.border }]}>
            <View style={styles.dateRow}>
              <Clock size={12} color={C.textMuted} strokeWidth={1.8} />
              <Text style={[styles.dateText, { color: C.textMuted }]}>{appliedDate}</Text>
            </View>

            <View style={styles.actionsRow}>
              {isActive && (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ECFDF5', borderColor: 'rgba(34,197,94,.25)' }]} onPress={onFollowStage} activeOpacity={0.7}>
                  <PlayCircle size={12} color="#059669" strokeWidth={2} />
                  <Text style={[styles.actionBtnText, { color: '#059669' }]}>{labelFollow}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: C.bgMuted, borderColor: C.border }]} onPress={onViewOffer} activeOpacity={0.7}>
                <Text style={[styles.actionBtnText, { color: C.textSub }]}>{labelView}</Text>
                <ChevronRight size={12} color={C.textSub} strokeWidth={2} />
              </TouchableOpacity>
              {isPending && (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FEF2F2', borderColor: 'rgba(239,68,68,.25)' }]} onPress={onDelete} activeOpacity={0.7}>
                  <Trash2 size={12} color="#EF4444" strokeWidth={2} />
                  <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>{labelWithdraw}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function EmptyState({ C, filter, t, filterLabels }) {
  const filterLabel = filterLabels?.find(f => f.key === filter)?.label ?? filter;
  return (
    <View style={styles.emptyWrap}>
      <View style={[styles.emptyIconBox, { backgroundColor: C.bgMuted }]}>
        <Briefcase size={32} color={C.textMuted} strokeWidth={1.5} />
      </View>
      <Text style={[styles.emptyTitle, { color: C.text }]}>
        {filter === 'Toutes' ? t('candidatures.empty') : `${t('candidatures.empty')} "${filterLabel}"`}
      </Text>
      <Text style={[styles.emptyBody, { color: C.textSub }]}>
        {t('candidatures.emptySubtitle')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root:     { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header:     { borderBottomWidth: 1, paddingHorizontal: 18, paddingBottom: 0 },
  headerTop:  { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
  pageTitle:  { fontFamily: F.bold, fontSize: 19, letterSpacing: -0.3 },
  pageCount:  { fontFamily: F.reg, fontSize: 12, marginTop: 2 },
  headerIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },

  tabsRow:      { flexDirection: 'row', gap: 4, paddingBottom: 0 },
  tab:          { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabLabel:     { fontFamily: F.semi, fontSize: 13 },
  tabBadge:     { borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2, minWidth: 20, alignItems: 'center' },
  tabBadgeText: { fontFamily: F.bold, fontSize: 11 },

  cardShadowWrap: { borderRadius: radius.card, ...shadow.card },
  card:           { borderRadius: radius.card, borderWidth: 1, flexDirection: 'row', overflow: 'hidden' },
  cardAccent:     { width: 4 },
  cardInner:      { flex: 1, padding: 14, gap: 8 },
  cardTop:        { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBox:        { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  logoText:       { fontFamily: F.bold, fontSize: 16 },
  cardMeta:       { flex: 1 },
  cardTitle:      { fontFamily: F.semi, fontSize: 14, marginBottom: 2 },
  cardCompany:    { fontFamily: F.reg, fontSize: 12 },
  statusBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText:     { fontFamily: F.semi, fontSize: 11 },

  chipsRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  infoChip:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  infoChipText:  { fontFamily: F.med, fontSize: 11 },

  cardFooter:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1 },
  dateRow:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dateText:    { fontFamily: F.reg, fontSize: 12 },
  actionsRow:  { flexDirection: 'row', gap: 6 },
  actionBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  actionBtnText:{ fontFamily: F.semi, fontSize: 11 },

  emptyWrap:    { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32, gap: 12 },
  emptyIconBox: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  emptyTitle:   { fontFamily: F.semi, fontSize: 17, textAlign: 'center' },
  emptyBody:    { fontFamily: F.reg, fontSize: 14, lineHeight: 21, textAlign: 'center' },
});
