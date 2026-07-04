import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, ArrowLeft, Search, Clock, CheckCircle, FileText, Briefcase, GraduationCap, User, Star, Heart, BellDot } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import useLayoutStore from '../../store/layoutStore';
import useAuthStore from '../../store/authStore';
import { getColors } from '../../theme/colors';
import { spacing } from '../../theme/tokens';
import { F } from '../../theme/fonts';
import api from '../../services/api';
import ErrorState                from '../../components/ui/ErrorState';
import LoadingSpinner             from '../../components/ui/LoadingSpinner';
import { useFloatingTabPadding } from '../../components/ui/FloatingTabBar';
import { useTranslation } from 'react-i18next';

function StatCard({ Icon, value, label, C }) {
  return (
    <View style={[styles.statCard, { backgroundColor: C.bgCard, borderColor: C.border }]}>
      <View style={[styles.statIconWrap, { backgroundColor: C.primarySoft }]}>
        <Icon size={18} color={C.primary} strokeWidth={2} />
      </View>
      <Text style={[styles.statValue, { color: C.text }]}>{value ?? '—'}</Text>
      <Text style={[styles.statLabel, { color: C.textSub }]}>{label}</Text>
    </View>
  );
}

function TileItem({ tile, onPress, C }) {
  const Icon = tile.icon;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.tileWrapper}>
      <View style={[styles.tile, { backgroundColor: C.bgCard, borderColor: C.border }]}>
        <View style={[styles.tileIconWrap, { backgroundColor: C.primarySoft }]}>
          <Icon size={26} color={C.primary} strokeWidth={2} />
        </View>
        <Text style={[styles.tileLabel, { color: C.text }]}>{tile.label}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function DashboardScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const isDark     = useLayoutStore((s) => s.isDarkMode);
  const C          = getColors(isDark);
  const tabPadding = useFloatingTabPadding();
  const user       = useAuthStore((s) => s.user);
  const prenom     = user?.profil_etudiant?.prenom || user?.first_name || '';

  const FEATURE_TILES = [
    { icon: Briefcase,     label: t('dashboard.tiles.offers'),       tab: 'AccueilTab'      },
    { icon: FileText,      label: t('dashboard.tiles.candidatures'), tab: 'CandidaturesTab' },
    { icon: GraduationCap, label: t('dashboard.tiles.internship'),   tab: 'StageTab'        },
    { icon: User,          label: t('dashboard.tiles.profile'),      tab: 'ProfilTab'       },
    { icon: Star,          label: t('dashboard.tiles.evaluations'),  screen: 'Evaluations'  },
    { icon: Heart,         label: t('dashboard.tiles.favorites'),    screen: 'Favoris'      },
  ];

  const today = new Date();
  const locale = t('dashboard.dateLocale');
  const dayStr = today.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });

  const { data: candidaturesData, isLoading, isError: candidaturesError, refetch } = useQuery({
    queryKey: ['dashboard-candidatures'],
    queryFn:  () => api.get('candidatures/mes-candidatures/').then(r => r.data),
  });

  const { data: internshipData } = useQuery({
    queryKey: ['dashboard-internship'],
    queryFn:  () => api.get('conventions/').then(r => r.data),
  });

  const { data: notifs = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn:  async () => {
      try { const r = await api.get('notifications/'); return r.data?.results ?? r.data ?? []; }
      catch { return []; }
    },
    staleTime: 60_000,
  });
  const unreadCount = notifs.filter((n) => !n.est_lue).length;

  const candidatures = candidaturesData?.results ?? candidaturesData ?? [];
  const pending      = candidatures.filter(c => c.statut === 'En_attente').length;
  const accepted     = candidatures.filter(c => c.statut === 'Acceptée').length;
  const conventions   = Array.isArray(internshipData) ? internshipData : (internshipData?.results ?? []);
  const internship    = [...conventions].sort((a, b) => (b.id_convention ?? b.id ?? 0) - (a.id_convention ?? a.id ?? 0))[0] ?? null;

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: tabPadding }]}
        >
          {/* Header: date left, bell + avatar right */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.headerDay, { color: C.textSub }]}>
                {dayStr.charAt(0).toUpperCase() + dayStr.slice(1)}
              </Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Notifications')}
                style={[styles.bellBtn, { backgroundColor: C.accent }]}
                accessibilityRole="button"
                accessibilityLabel="Notifications"
              >
                <BellDot size={20} color="#fff" strokeWidth={1.8} />
                {unreadCount > 0 && (
                  <View style={[styles.bellBadge, { backgroundColor: C.primary }]}>
                    <Text style={styles.bellBadgeText}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('ProfilTab')}
                style={[styles.avatarBtn, { backgroundColor: C.primary }]}
                accessibilityRole="button"
                accessibilityLabel="Mon profil"
              >
                <User size={18} color="#fff" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Large title */}
          <Text style={[styles.pageTitle, { color: C.text }]}>
            {t('dashboard.greeting')}, {prenom || t('profile.defaultUser')} 👋
          </Text>

          {/* Category filter pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.pillsRow}
            contentContainerStyle={styles.pillsContent}
          >
            {['Tous les stages', 'Informatique', 'Finance', 'Marketing', 'RH'].map((label) => (
              <TouchableOpacity
                key={label}
                style={[styles.pill, { borderColor: C.border, backgroundColor: C.bgCard }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.pillText, { color: C.textSub, fontFamily: F.bodyMed }]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Search bar */}
          <View style={[styles.searchBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F2F2F7' }]}>
            <Search size={18} color={C.textMuted} style={{ marginEnd: 10 }} />
            <TextInput
              placeholder={t('dashboard.searchPlaceholder')}
              placeholderTextColor={C.textMuted}
              style={[styles.searchInput, { color: C.text }]}
              onFocus={() => navigation.navigate('AccueilTab')}
            />
          </View>

          {/* Stats */}
          {isLoading ? (
            <LoadingSpinner />
          ) : candidaturesError ? (
            <ErrorState message={t('dashboard.error')} onRetry={refetch} />
          ) : (
            <View style={styles.statsRow}>
              <StatCard Icon={Clock}       value={pending}             label={t('candidatures.status.En_attente')} C={C} />
              <StatCard Icon={CheckCircle} value={accepted}            label={t('candidatures.status.Acceptée')}  C={C} />
              <StatCard Icon={FileText}    value={candidatures.length} label="Total"                               C={C} />
            </View>
          )}

          {/* Active internship banner */}
          {internship ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('StageTab')}
              activeOpacity={0.85}
              style={[styles.internshipBanner, { backgroundColor: C.primary }]}
            >
              <View>
                <Text style={styles.internshipLabel}>{t('myInternship.title').toUpperCase()}</Text>
                <Text style={styles.internshipTitle} numberOfLines={1}>
                  {internship.offre_titre || 'Stage actif'}
                </Text>
                <Text style={styles.internshipCompany} numberOfLines={1}>
                  {internship.entreprise_nom}
                </Text>
              </View>
              <View style={styles.internshipArrow}>
                {I18nManager.isRTL
                  ? <ArrowLeft size={20} color="#FFFFFF" />
                  : <ArrowRight size={20} color="#FFFFFF" />}
              </View>
            </TouchableOpacity>
          ) : null}

          {/* Feature grid */}
          <Text style={[styles.sectionTitle, { color: C.textSub }]}>{t('dashboard.quickActions')}</Text>
          <View style={styles.grid}>
            {FEATURE_TILES.map((tile) => (
              <TileItem
                key={tile.label}
                tile={tile}
                C={C}
                onPress={() =>
                  tile.tab
                    ? navigation.navigate(tile.tab)
                    : navigation.navigate(tile.screen)
                }
              />
            ))}
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:     { flex: 1 },
  safeArea: { flex: 1 },
  scroll:   { paddingHorizontal: spacing.md },

  header: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingVertical: spacing.md,
  },
  headerDay: {
    fontFamily: F.bodyMed,
    fontSize:   13,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
  },
  bellBtn: {
    width:          38,
    height:         38,
    borderRadius:   19,
    alignItems:     'center',
    justifyContent: 'center',
  },
  bellBadge: {
    position:         'absolute',
    top:              0,
    right:            0,
    minWidth:         17,
    height:           17,
    borderRadius:     999,
    paddingHorizontal: 4,
    alignItems:       'center',
    justifyContent:   'center',
    borderWidth:      1.5,
    borderColor:      '#fff',
  },
  bellBadgeText: { fontFamily: F.bold, fontSize: 9, color: '#fff', lineHeight: 12 },
  avatarBtn: {
    width:          38,
    height:         38,
    borderRadius:   19,
    alignItems:     'center',
    justifyContent: 'center',
  },

  pageTitle: {
    fontFamily:   F.displayBlack,
    fontSize:     32,
    lineHeight:   40,
    letterSpacing: -0.8,
    marginBottom: spacing.md,
  },

  pillsRow: {
    marginBottom: spacing.md,
  },
  pillsContent: {
    gap:             8,
    paddingEnd:      spacing.md,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical:   8,
    borderRadius:      999,
    borderWidth:       1,
  },
  pillText: {
    fontSize: 13,
  },

  searchBar: {
    flexDirection:     'row',
    alignItems:        'center',
    borderRadius:      999,
    borderWidth:       0,
    paddingHorizontal: 16,
    height:            48,
    marginBottom:      spacing.lg,
    backgroundColor:   '#F2F2F7',
  },
  searchInput: {
    fontFamily: F.bodyReg,
    flex:       1,
    fontSize:   14,
  },

  statsRow: {
    flexDirection: 'row',
    gap:           spacing.sm,
    marginBottom:  spacing.md,
  },
  statCard: {
    flex:           1,
    alignItems:     'center',
    padding:        16,
    borderRadius:   16,
    borderWidth:    1,
    gap:            8,
  },
  statIconWrap: {
    width:          40,
    height:         40,
    borderRadius:   20,
    alignItems:     'center',
    justifyContent: 'center',
  },
  statValue: {
    fontFamily: F.displayBlack,
    fontSize:   26,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontFamily: F.bodyMed,
    fontSize:   11,
    textAlign:  'center',
  },

  internshipBanner: {
    borderRadius:   18,
    padding:        20,
    marginBottom:   spacing.lg,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  internshipLabel: {
    fontFamily:    F.displaySemi,
    fontSize:      10,
    color:         'rgba(255,255,255,0.75)',
    letterSpacing: 1.2,
    marginBottom:  4,
  },
  internshipTitle: {
    fontFamily: F.displayBold,
    fontSize:   19,
    color:      '#FFFFFF',
    lineHeight: 24,
  },
  internshipCompany: {
    fontFamily: F.bodyReg,
    fontSize:   13,
    color:      'rgba(255,255,255,0.70)',
    marginTop:  2,
  },
  internshipArrow: {
    width:           42,
    height:          42,
    borderRadius:    21,
    backgroundColor: 'rgba(255,255,255,0.20)',
    alignItems:      'center',
    justifyContent:  'center',
  },

  sectionTitle: {
    fontFamily:   F.displayBold,
    fontSize:     16,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           spacing.sm,
  },
  tileWrapper: {
    width: '47.5%',
  },
  tile: {
    borderRadius:      16,
    borderWidth:       1,
    paddingVertical:   24,
    paddingHorizontal: 14,
    alignItems:        'center',
    gap:               14,
  },
  tileIconWrap: {
    width:          60,
    height:         60,
    borderRadius:   30,
    alignItems:     'center',
    justifyContent: 'center',
  },
  tileLabel: {
    fontFamily: F.displaySemi,
    fontSize:   13,
    textAlign:  'center',
    lineHeight: 19,
  },
});
