import React, { useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, I18nManager,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Heart, MapPin, Clock, Briefcase } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { F } from '../../theme/fonts';
import useLayoutStore from '../../store/layoutStore';
import { getColors } from '../../theme/colors';
import api from '../../services/api';

async function fetchFavoris()      { const r = await api.get('offres/favoris/');       return r.data?.results ?? r.data ?? []; }
async function toggleFavori(id)    { const r = await api.post(`offres/${id}/favori/`); return r.data; }

export default function FavorisScreen({ navigation }) {
  const { t }   = useTranslation();
  const insets  = useSafeAreaInsets();
  const isDark  = useLayoutStore((s) => s.isDarkMode);
  const C       = getColors(isDark);
  const qc      = useQueryClient();

  const { data: favoris = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['favoris'],
    queryFn:  fetchFavoris,
  });

  const removeMutation = useMutation({
    mutationFn: (id) => toggleFavori(id),
    onSuccess:  ()   => { qc.invalidateQueries({ queryKey: ['favoris'] }); qc.invalidateQueries({ queryKey: ['offres'] }); },
  });

  const renderItem = useCallback(({ item }) => {
    const offre = item.offre_details || {};
    const logo  = offre.entreprise?.nom?.[0]?.toUpperCase() || offre.titre?.[0]?.toUpperCase() || '?';
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: C.bgCard, borderColor: C.border }]}
        onPress={() => navigation.navigate('OfferDetail', { offerId: item.offre })}
        activeOpacity={0.75}
      >
        <View style={styles.cardTop}>
          <View style={[styles.logoBox, { backgroundColor: C.primarySoft }]}>
            <Text style={[styles.logoText, { color: C.primary }]}>{logo}</Text>
          </View>
          <View style={styles.cardMain}>
            <Text style={[styles.cardTitle, { color: C.text }]} numberOfLines={1}>{offre.titre}</Text>
            <Text style={[styles.cardCompany, { color: C.textSub }]} numberOfLines={1}>
              {offre.entreprise?.nom || 'Entreprise'}
            </Text>
          </View>
          <TouchableOpacity hitSlop={8} onPress={() => removeMutation.mutate(item.offre)}>
            <Heart size={20} color="#EF4444" fill="#EF4444" strokeWidth={1.8} />
          </TouchableOpacity>
        </View>

        <View style={styles.chipRow}>
          {offre.localisation && (
            <View style={[styles.chip, { backgroundColor: C.bgMuted }]}>
              <MapPin size={11} color={C.textSub} strokeWidth={2} />
              <Text style={[styles.chipText, { color: C.textSub }]}>{offre.localisation}</Text>
            </View>
          )}
          {offre.duree && (
            <View style={[styles.chip, { backgroundColor: C.bgMuted }]}>
              <Clock size={11} color={C.textSub} strokeWidth={2} />
              <Text style={[styles.chipText, { color: C.textSub }]}>{offre.duree}</Text>
            </View>
          )}
          {offre.domaine && (
            <View style={[styles.chip, { backgroundColor: C.primarySoft }]}>
              <Briefcase size={11} color={C.primary} strokeWidth={2} />
              <Text style={[styles.chipText, { color: C.primary }]}>{offre.domaine}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [C, navigation]);

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + 14, backgroundColor: C.bgCard, borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          {I18nManager.isRTL
            ? <ArrowRight size={22} color={C.text} strokeWidth={2} />
            : <ArrowLeft  size={22} color={C.text} strokeWidth={2} />}
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: C.text }]}>{t('favoris.title')}</Text>
        <View style={{ width: 22 }} />
      </View>

      {isLoading ? (
        <View style={styles.centered}><ActivityIndicator color={C.primary} /></View>
      ) : (
        <FlatList
          data={favoris}
          keyExtractor={(item) => String(item.id ?? item.offre)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, gap: 12 }}
          refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={C.primary} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>❤️</Text>
              <Text style={[styles.emptyTitle, { color: C.text }]}>{t('favoris.empty')}</Text>
              <Text style={[styles.emptyBody, { color: C.textSub }]}>{t('favoris.emptySubtitle')}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1 },
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  pageTitle:   { fontFamily: F.bold, fontSize: 18 },
  card:        { borderRadius: 12, borderWidth: 1, padding: 16, gap: 12 },
  cardTop:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoBox:     { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  logoText:    { fontFamily: F.bold, fontSize: 18 },
  cardMain:    { flex: 1 },
  cardTitle:   { fontFamily: F.semi, fontSize: 15, marginBottom: 3 },
  cardCompany: { fontFamily: F.reg, fontSize: 13 },
  chipRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip:        { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  chipText:    { fontFamily: F.med, fontSize: 11 },
  emptyWrap:   { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyEmoji:  { fontSize: 48, marginBottom: 16 },
  emptyTitle:  { fontFamily: F.semi, fontSize: 17, marginBottom: 8, textAlign: 'center' },
  emptyBody:   { fontFamily: F.reg, fontSize: 14, lineHeight: 21, textAlign: 'center' },
});
