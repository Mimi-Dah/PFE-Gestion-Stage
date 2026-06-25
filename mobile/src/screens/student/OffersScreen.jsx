import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, Image, FlatList, TouchableOpacity, TextInput,
  RefreshControl, StyleSheet, ActivityIndicator, ScrollView,
  Modal, Pressable,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Bell, Heart, SlidersHorizontal, X, Check,
  LayoutGrid, Building2, Home, Clock, Briefcase, Globe,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFloatingTabPadding } from '../../components/ui/FloatingTabBar';
import { F } from '../../theme/fonts';
import useAuthStore from '../../store/authStore';
import useLayoutStore from '../../store/layoutStore';
import { getColors } from '../../theme/colors';
import api from '../../services/api';

/* ─── Filter keys (internal — drive the API) ─── */
const FILTER_KEYS = ['Tous', 'Présentiel', 'À distance', 'Favoris'];
const FILTER_ICONS = {
  'Tous':       LayoutGrid,
  'Présentiel': Building2,
  'À distance': Home,
  'Favoris':    Heart,
};

const PALETTES = [
  { bg: '#EBF2FF', fg: '#1B6EF3' },
  { bg: '#FDECEA', fg: '#DC2626' },
  { bg: '#E8FAF2', fg: '#10B981' },
  { bg: '#FEF9EC', fg: '#D97706' },
  { bg: '#F3ECFF', fg: '#7C3AED' },
];

/* ─── API ─── */
async function toggleFavori(id) {
  const r = await api.post(`offres/${id}/favori/`);
  return r.data;
}
async function fetchOffres(search, filter) {
  const params = {};
  if (search)                  params.search      = search;
  if (filter === 'Favoris')    params.favoris     = true;
  if (filter === 'Présentiel') params.teletravail = false;
  if (filter === 'À distance') params.teletravail = true;
  const res = await api.get('offres/', { params });
  return res.data?.results ?? res.data ?? [];
}

/* ════════════════════════════════════════════════════════
   SCREEN
════════════════════════════════════════════════════════ */
export default function OffersScreen({ navigation }) {
  const { t }  = useTranslation();
  const insets = useSafeAreaInsets();
  const tabPad = useFloatingTabPadding();
  const isDark = useLayoutStore((s) => s.isDarkMode);
  const C      = getColors(isDark);
  const user   = useAuthStore((s) => s.user);
  const qc     = useQueryClient();

  const [search, setSearch]             = useState('');
  const [filter, setFilter]             = useState('Tous');
  const [debouncedSearch, setDebounced] = useState('');
  const debounceRef                     = useRef(null);
  const [filterModal, setFilterModal]   = useState(false);

  /* Translated filter labels keyed by the internal key */
  const FILTER_LABELS = {
    'Tous':       t('offers.filters.all'),
    'Présentiel': t('offers.filters.onsite'),
    'À distance': t('offers.filters.remote'),
    'Favoris':    t('offers.filters.favorites'),
  };

  const handleSearch = (text) => {
    setSearch(text);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebounced(text), 400);
  };

  const { data: offres = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['offres', debouncedSearch, filter],
    queryFn:  () => fetchOffres(debouncedSearch, filter),
  });

  const { mutate: handleToggleFavori } = useMutation({
    mutationFn: (id) => toggleFavori(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['offres'] });
      qc.invalidateQueries({ queryKey: ['favoris'] });
    },
  });

  const firstName = user?.profil_etudiant?.prenom || user?.first_name || t('profile.defaultUser');
  const initial   = (firstName[0] || 'E').toUpperCase();
  const photoUrl  = user?.profil_etudiant?.photo || null;

  const renderOffer = useCallback(({ item, index }) => (
    <OfferCard
      item={item}
      index={index}
      C={C}
      isDark={isDark}
      remoteLabel={t('offers.remote')}
      onPress={() => navigation.navigate('OfferDetail', { offerId: item.id })}
      onToggleFavori={() => handleToggleFavori(item.id)}
    />
  ), [C, isDark, navigation, handleToggleFavori, t]);

  const ListHeader = useCallback(() => (
    <View style={s.listHeader}>

      {/* ─── Topbar ─── */}
      <View style={[s.topbar, { paddingTop: insets.top + 10 }]}>
        <View style={s.topbarLeft}>
          {photoUrl
            ? <Image source={{ uri: photoUrl }} style={s.avatar} />
            : (
              <View style={[s.avatarFallback, { backgroundColor: isDark ? C.primarySoft : '#EBF2FF' }]}>
                <Text style={[s.avatarInitial, { color: C.primary }]}>{initial}</Text>
              </View>
            )
          }
          <Text style={[s.greetText, { color: isDark ? C.text : '#1A1A2E' }]}>
            {t('dashboard.greeting')}, <Text style={s.greetName}>{firstName}</Text>
          </Text>
        </View>
        <TouchableOpacity
          hitSlop={12}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Notifications')}
          style={[s.bellBtn, { backgroundColor: C.primarySoft }]}
        >
          <Bell size={20} color={C.primary} strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      {/* ─── Hero ─── */}
      <View style={s.hero}>
        <Text style={[s.heroTitle, { color: isDark ? C.text : '#0F172A' }]}>
          {t('offers.heroTitle')}
        </Text>
        <Text style={[s.heroSub, { color: isDark ? C.textSub : '#94A3B8' }]}>
          {t('offers.heroSubtitle')}
        </Text>
      </View>

      {/* ─── Search ─── */}
      <View style={s.searchRow}>
        <View style={[s.searchPill, {
          backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#F4F5F7',
        }]}>
          <Search size={15} color="#94A3B8" strokeWidth={1.8} />
          <TextInput
            style={[s.searchInput, { color: isDark ? C.text : '#0F172A' }]}
            placeholder={t('offers.searchPlaceholder')}
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); setDebounced(''); }} hitSlop={8}>
              <Text style={{ color: '#94A3B8', fontSize: 14, lineHeight: 18 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[s.filterIcon, {
            backgroundColor: filterModal || filter !== 'Tous'
              ? C.primary
              : (isDark ? C.bgCard : '#F4F5F7'),
          }]}
          activeOpacity={0.7}
          onPress={() => setFilterModal(true)}
        >
          <SlidersHorizontal
            size={17}
            color={filterModal || filter !== 'Tous' ? '#FFFFFF' : (isDark ? C.textSub : '#64748B')}
            strokeWidth={2}
          />
        </TouchableOpacity>
      </View>

      {/* ─── Categories ─── */}
      <View style={s.sectionRow}>
        <Text style={[s.sectionTitle, { color: isDark ? C.textSub : '#64748B' }]}>
          {t('offers.categories')}
        </Text>
        <TouchableOpacity activeOpacity={0.7} onPress={() => setFilter('Tous')}>
          <Text style={[s.seeAll, { color: C.primary }]}>{t('offers.seeAll')}</Text>
        </TouchableOpacity>
      </View>

      <View style={s.catsRow}>
        {FILTER_KEYS.map((key) => {
          const isActive = filter === key;
          const Icon     = FILTER_ICONS[key];
          const label    = FILTER_LABELS[key];
          return (
            <TouchableOpacity
              key={key}
              style={s.catItem}
              onPress={() => setFilter(key)}
              activeOpacity={0.75}
            >
              <View style={[
                s.catCircle,
                isActive
                  ? { backgroundColor: C.primary }
                  : {
                      backgroundColor: isDark ? C.bgCard : '#FFFFFF',
                      borderWidth:     1.5,
                      borderColor:     isDark ? C.border : '#E2E8F0',
                    },
              ]}>
                <Icon
                  size={19}
                  color={isActive ? '#FFFFFF' : (isDark ? C.textSub : '#94A3B8')}
                  strokeWidth={1.7}
                />
              </View>
              <Text style={[
                s.catLabel,
                { color: isActive ? C.primary : (isDark ? C.textSub : '#94A3B8'),
                  fontFamily: isActive ? F.semi : F.reg },
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ─── Top Offers header ─── */}
      <View style={s.sectionRow}>
        <Text style={[s.sectionTitle, { color: isDark ? C.textSub : '#64748B' }]}>
          {filter === 'Favoris' ? t('offers.myFavorites') : t('offers.topOffers')}
        </Text>
        {filter !== 'Favoris' && (
          <View style={[s.newBadge, {
            borderColor: isDark ? '#3B82F6' : '#BFDBFE',
            backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#EFF6FF',
          }]}>
            <Text style={[s.newBadgeText, { color: C.primary }]}>{t('offers.newBadge')}</Text>
          </View>
        )}
      </View>

    </View>
  ), [C, isDark, insets.top, initial, firstName, photoUrl, search, filter, filterModal, navigation, t, FILTER_LABELS]);

  return (
    <View style={[s.screen, { backgroundColor: isDark ? C.bg : '#FFFFFF' }]}>
      {isLoading ? (
        <>
          <ListHeader />
          <View style={s.centered}>
            <ActivityIndicator color={C.primary} size="large" />
          </View>
        </>
      ) : (
        <FlatList
          data={offres}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderOffer}
          ListHeaderComponent={<ListHeader />}
          contentContainerStyle={[
            { paddingBottom: tabPad + 80 },
            offres.length === 0 && { flex: 1 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={refetch}
              tintColor={C.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState C={C} t={t} />}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}

      {/* ── Filter bottom sheet ── */}
      <FilterModal
        visible={filterModal}
        current={filter}
        isDark={isDark}
        C={C}
        filterLabels={FILTER_LABELS}
        t={t}
        onSelect={(f) => { setFilter(f); setFilterModal(false); }}
        onClose={() => setFilterModal(false)}
        onReset={() => { setFilter('Tous'); setFilterModal(false); }}
      />
    </View>
  );
}

/* ════════════════════════════════════════════════════════
   FILTER MODAL
════════════════════════════════════════════════════════ */
function FilterModal({ visible, current, isDark, C, filterLabels, t, onSelect, onClose, onReset }) {
  const FILTER_OPTIONS = [
    { key: 'Tous',       Icon: LayoutGrid },
    { key: 'Présentiel', Icon: Building2  },
    { key: 'À distance', Icon: Home       },
    { key: 'Favoris',    Icon: Heart      },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={fm.overlay} onPress={onClose} />
      <View style={[fm.sheet, { backgroundColor: isDark ? C.bgCard : '#FFFFFF' }]}>

        <View style={[fm.handle, { backgroundColor: isDark ? C.border : '#E2E8F0' }]} />

        <View style={fm.sheetHeader}>
          <Text style={[fm.sheetTitle, { color: isDark ? C.text : '#0F172A' }]}>{t('offers.filtersTitle')}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <X size={20} color={isDark ? C.textSub : '#64748B'} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <Text style={[fm.groupLabel, { color: isDark ? C.textMuted : '#94A3B8' }]}>
          {t('offers.internshipType')}
        </Text>

        {FILTER_OPTIONS.map(({ key, Icon }) => {
          const active = current === key;
          const label  = filterLabels[key] ?? key;
          return (
            <TouchableOpacity
              key={key}
              style={[fm.option, {
                backgroundColor: active
                  ? (isDark ? 'rgba(27,110,243,0.15)' : '#EFF6FF')
                  : 'transparent',
                borderColor: active ? C.primary : (isDark ? C.border : '#E2E8F0'),
              }]}
              onPress={() => onSelect(key)}
              activeOpacity={0.75}
            >
              <View style={[fm.optionIcon, {
                backgroundColor: active ? C.primary : (isDark ? C.bgCard : '#F4F5F7'),
              }]}>
                <Icon size={16} color={active ? '#FFFFFF' : (isDark ? C.textSub : '#64748B')} strokeWidth={1.8} />
              </View>
              <Text style={[fm.optionLabel, {
                color:      active ? C.primary : (isDark ? C.text : '#1A1A2E'),
                fontFamily: active ? F.semi : F.reg,
              }]}>
                {label}
              </Text>
              {active && (
                <View style={[fm.checkCircle, { backgroundColor: C.primary }]}>
                  <Check size={11} color="#FFFFFF" strokeWidth={2.5} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        <View style={fm.sheetFooter}>
          <TouchableOpacity
            style={[fm.resetBtn, { borderColor: isDark ? C.border : '#E2E8F0' }]}
            onPress={onReset}
          >
            <Text style={[fm.resetText, { color: isDark ? C.textSub : '#64748B' }]}>
              {t('offers.reset')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[fm.applyBtn, { backgroundColor: C.primary }]}
            onPress={() => onSelect(current)}
          >
            <Text style={fm.applyText}>{t('offers.apply')}</Text>
          </TouchableOpacity>
        </View>

      </View>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════
   OFFER CARD
════════════════════════════════════════════════════════ */
function OfferCard({ item, index, C, isDark, remoteLabel, onPress, onToggleFavori }) {
  const pal      = PALETTES[index % PALETTES.length];
  const initial  = (item.entreprise?.nom?.[0] || '?').toUpperCase();
  const company  = item.entreprise?.nom || 'Entreprise';
  const location = item.localisation || '';

  const meta = [];
  if (item.duree)        meta.push({ Icon: Clock,    text: item.duree });
  if (item.type_contrat) meta.push({ Icon: Briefcase, text: item.type_contrat });
  else if (item.domaine) meta.push({ Icon: Briefcase, text: item.domaine });
  if (item.teletravail)  meta.push({ Icon: Globe,     text: remoteLabel });

  return (
    <TouchableOpacity
      style={[s.card, {
        backgroundColor: isDark ? C.bgCard : '#FFFFFF',
        shadowColor: '#000',
      }]}
      onPress={onPress}
      activeOpacity={0.78}
    >
      <View style={[s.cardAvatar, { backgroundColor: isDark ? C.primarySoft : pal.bg }]}>
        <Text style={[s.cardAvatarText, { color: isDark ? C.primary : pal.fg }]}>
          {initial}
        </Text>
      </View>

      <View style={s.cardContent}>
        <View style={s.cardTitleRow}>
          <Text style={[s.cardTitle, { color: isDark ? C.text : '#0F172A' }]} numberOfLines={1}>
            {item.titre}
          </Text>
          <TouchableOpacity onPress={onToggleFavori} hitSlop={10}>
            <Heart
              size={17}
              color={item.is_favori ? '#EF4444' : '#CBD5E1'}
              fill={item.is_favori ? '#EF4444' : 'none'}
              strokeWidth={1.8}
            />
          </TouchableOpacity>
        </View>

        <Text style={[s.cardCompany, { color: isDark ? C.textSub : '#64748B' }]} numberOfLines={1}>
          {company}{location ? ` • ${location}` : ''}
        </Text>

        {meta.length > 0 && (
          <View style={s.cardMeta}>
            {meta.map(({ Icon, text }, i) => (
              <View key={i} style={s.cardMetaItem}>
                <Icon size={12} color="#94A3B8" strokeWidth={1.8} />
                <Text style={[s.cardMetaText, { color: isDark ? C.textMuted : '#94A3B8' }]}>
                  {text}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

/* ─── Empty state ─── */
function EmptyState({ C, t }) {
  return (
    <View style={s.empty}>
      <Text style={{ fontSize: 44, marginBottom: 14 }}>🔍</Text>
      <Text style={[s.emptyTitle, { color: C.text }]}>{t('offers.empty')}</Text>
      <Text style={[s.emptySub, { color: C.textSub }]}>{t('offers.emptySubtitle')}</Text>
    </View>
  );
}

/* ════════════════════════════════════════════════════════
   STYLES
════════════════════════════════════════════════════════ */
const s = StyleSheet.create({
  screen:  { flex: 1 },
  centered:{ flex: 1, alignItems: 'center', justifyContent: 'center' },

  listHeader: { paddingBottom: 4 },

  /* ── Topbar ── */
  topbar: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 22,
    paddingBottom:     6,
  },
  topbarLeft: {
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
  avatar: {
    width:        40,
    height:       40,
    borderRadius: 20,
  },
  avatarFallback: {
    width:          40,
    height:         40,
    borderRadius:   20,
    alignItems:     'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: F.displayBold,
    fontSize:   16,
  },
  greetText: {
    fontFamily: F.reg,
    fontSize:   15,
    lineHeight: 22,
  },
  greetName: {
    fontFamily: F.bold,
  },

  /* ── Hero ── */
  hero: {
    paddingHorizontal: 22,
    paddingTop:        22,
    paddingBottom:     22,
  },
  heroTitle: {
    fontFamily:    F.displayBlack,
    fontSize:      28,
    lineHeight:    36,
    letterSpacing: -0.4,
    marginBottom:  4,
  },
  heroSub: {
    fontFamily: F.reg,
    fontSize:   13,
    lineHeight: 20,
  },

  /* ── Search ── */
  searchRow: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               10,
    paddingHorizontal: 22,
    marginBottom:      26,
  },
  searchPill: {
    flex:              1,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    height:            46,
    borderRadius:      999,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex:       1,
    fontFamily: F.reg,
    fontSize:   13,
    padding:    0,
  },
  filterIcon: {
    width:          46,
    height:         46,
    borderRadius:   14,
    alignItems:     'center',
    justifyContent: 'center',
  },

  /* ── Section header ── */
  sectionRow: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    paddingHorizontal: 22,
    marginBottom:      14,
  },
  sectionTitle: {
    fontFamily:    F.bold,
    fontSize:      11,
    letterSpacing: 1.4,
  },
  seeAll: {
    fontFamily: F.semi,
    fontSize:   13,
  },

  /* ── NOUVEAU badge ── */
  newBadge: {
    borderWidth:       1,
    borderRadius:      999,
    paddingHorizontal: 12,
    paddingVertical:   4,
  },
  newBadgeText: {
    fontFamily:    F.bold,
    fontSize:      10,
    letterSpacing: 0.8,
  },

  /* ── Categories ── */
  catsRow: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    paddingHorizontal: 22,
    marginBottom:      24,
  },
  catItem: {
    alignItems: 'center',
    gap:        8,
    flex:       1,
  },
  catCircle: {
    width:          52,
    height:         52,
    borderRadius:   26,
    alignItems:     'center',
    justifyContent: 'center',
  },
  catLabel: {
    fontSize:  11,
    textAlign: 'center',
    lineHeight: 15,
  },

  /* ── Card ── */
  card: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            14,
    marginHorizontal: 16,
    padding:        16,
    borderRadius:   16,
    shadowOpacity:  0.06,
    shadowRadius:   10,
    shadowOffset:   { width: 0, height: 3 },
    elevation:      3,
  },
  cardAvatar: {
    width:          46,
    height:         46,
    borderRadius:   12,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  cardAvatarText: {
    fontFamily: F.displayBold,
    fontSize:   18,
    lineHeight: 24,
  },
  cardContent: {
    flex:    1,
    minWidth: 0,
  },
  cardTitleRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    gap:            8,
    marginBottom:   3,
  },
  cardTitle: {
    fontFamily: F.displayBold,
    fontSize:   14,
    lineHeight: 20,
    flex:       1,
  },
  cardCompany: {
    fontFamily:   F.reg,
    fontSize:     12,
    lineHeight:   17,
    marginBottom: 8,
  },
  cardMeta: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           10,
  },
  cardMetaItem: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
  },
  cardMetaText: {
    fontFamily: F.reg,
    fontSize:   11,
  },

  /* ── Empty ── */
  empty: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: 32,
    paddingTop:        48,
  },
  emptyTitle: { fontFamily: F.semi,  fontSize: 17, marginBottom: 8, textAlign: 'center' },
  emptySub:   { fontFamily: F.reg,   fontSize: 14, lineHeight:   21, textAlign: 'center' },
});

/* ── Filter modal styles ── */
const fm = StyleSheet.create({
  overlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.40)',
  },
  sheet: {
    borderTopLeftRadius:  28,
    borderTopRightRadius: 28,
    paddingHorizontal:    22,
    paddingBottom:        36,
    shadowColor:          '#000',
    shadowOpacity:        0.15,
    shadowRadius:         20,
    shadowOffset:         { width: 0, height: -4 },
    elevation:            20,
  },
  handle: {
    width:        40,
    height:       4,
    borderRadius: 2,
    alignSelf:    'center',
    marginTop:    12,
    marginBottom: 20,
  },
  sheetHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   22,
  },
  sheetTitle: {
    fontFamily: F.displayBold,
    fontSize:   18,
  },
  groupLabel: {
    fontFamily:    F.bold,
    fontSize:      10,
    letterSpacing: 1.4,
    marginBottom:  10,
  },
  option: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            12,
    borderWidth:    1.5,
    borderRadius:   14,
    paddingVertical:   14,
    paddingHorizontal: 14,
    marginBottom:   10,
  },
  optionIcon: {
    width:          36,
    height:         36,
    borderRadius:   10,
    alignItems:     'center',
    justifyContent: 'center',
  },
  optionLabel: {
    flex:      1,
    fontSize:  14,
    lineHeight: 20,
  },
  checkCircle: {
    width:          22,
    height:         22,
    borderRadius:   11,
    alignItems:     'center',
    justifyContent: 'center',
  },
  sheetFooter: {
    flexDirection: 'row',
    gap:           12,
    marginTop:     8,
  },
  resetBtn: {
    flex:            1,
    height:          50,
    borderRadius:    14,
    borderWidth:     1.5,
    alignItems:      'center',
    justifyContent:  'center',
  },
  resetText: {
    fontFamily: F.semi,
    fontSize:   14,
  },
  applyBtn: {
    flex:           2,
    height:         50,
    borderRadius:   14,
    alignItems:     'center',
    justifyContent: 'center',
  },
  applyText: {
    fontFamily: F.semi,
    fontSize:   14,
    color:      '#FFFFFF',
  },
});
