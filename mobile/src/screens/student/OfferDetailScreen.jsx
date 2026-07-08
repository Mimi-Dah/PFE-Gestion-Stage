import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, TextInput, ActivityIndicator, Alert, I18nManager,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import {
  ArrowLeft, ArrowRight, Heart, MapPin, Clock, Calendar, DollarSign,
  FileUp, CheckCircle, X, Upload, Briefcase, Wifi, CheckCircle2,
  Building2, ShieldCheck,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { F } from '../../theme/fonts';
import { shadow, radius } from '../../theme/tokens';
import useLayoutStore from '../../store/layoutStore';
import { getColors } from '../../theme/colors';
import api from '../../services/api';

async function fetchOffre(id)  { const r = await api.get(`offres/${id}/`); return r.data; }
async function toggleFavori(id){ const r = await api.post(`offres/${id}/favori/`); return r.data; }
async function postuler({ offerId, cv, motivation }) {
  const form = new FormData();
  form.append('offre', offerId);
  if (cv) form.append('cv', { uri: cv.uri, name: cv.name, type: 'application/pdf' });
  if (motivation) form.append('lettre_motivation', motivation);
  const r = await api.post('candidatures/', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return r.data;
}

export default function OfferDetailScreen({ navigation, route }) {
  const { t }       = useTranslation();
  const insets      = useSafeAreaInsets();
  const isDark      = useLayoutStore((s) => s.isDarkMode);
  const C           = getColors(isDark);

  const fmt = (dateStr) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString(t('dashboard.dateLocale'), { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };
  const qc          = useQueryClient();
  const offerId     = route.params?.offerId;
  const [modalOpen, setModalOpen] = useState(false);
  const [cv,        setCv]        = useState(null);
  const [motiv,     setMotiv]     = useState('');
  const [done,      setDone]      = useState(false);

  const { data: offre, isLoading } = useQuery({
    queryKey: ['offre', offerId],
    queryFn:  () => fetchOffre(offerId),
    enabled:  !!offerId,
  });

  const { data: mesCandidatures = [] } = useQuery({
    queryKey: ['candidatures'],
    queryFn:  async () => {
      const r = await api.get('candidatures/mes-candidatures/');
      return r.data?.results ?? r.data ?? [];
    },
  });

  const alreadyApplied = mesCandidatures.some(
    (c) => String(c.offre) === String(offerId) || String(c.offre?.id) === String(offerId)
  );

  const favMutation = useMutation({
    mutationFn: () => toggleFavori(offerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['offres'] }),
  });

  const candidatureMutation = useMutation({
    mutationFn: () => postuler({ offerId, cv, motivation: motiv }),
    onSuccess: () => {
      setDone(true);
      qc.invalidateQueries({ queryKey: ['candidatures'] });
      qc.invalidateQueries({ queryKey: ['offre', offerId] });
    },
    onError: (e) => Alert.alert(t('common.error'), e.message || t('offers.applyModal.alreadyApplied')),
  });

  const pickCv = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (!res.canceled && res.assets?.[0]) setCv(res.assets[0]);
  };

  if (isLoading) return <View style={[styles.centered, { backgroundColor: C.bg }]}><ActivityIndicator color={C.primary} /></View>;
  if (!offre)    return <View style={[styles.centered, { backgroundColor: C.bg }]}><Text style={{ color: C.textSub }}>{t('offerDetail.error')}</Text></View>;

  const logo      = offre.entreprise?.nom?.[0]?.toUpperCase() || '?';
  const isActive  = offre.statut === 'Active';
  const startDate = fmt(offre.date_debut);
  const endDate   = fmt(offre.date_fin);

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      {/* Header fixed */}
      <View style={[styles.navBar, { paddingTop: insets.top + 8, backgroundColor: C.bgCard, borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8} style={[styles.iconBtn, { backgroundColor: C.bgMuted }]}>
          {I18nManager.isRTL
            ? <ArrowRight size={18} color={C.text} strokeWidth={2} />
            : <ArrowLeft  size={18} color={C.text} strokeWidth={2} />}
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: C.text }]} numberOfLines={1}>{t('offerDetail.back')}</Text>
        <TouchableOpacity
          onPress={() => favMutation.mutate()}
          hitSlop={8}
          style={[styles.iconBtn, { backgroundColor: C.bgMuted }]}
        >
          <Heart size={18}
            color={offre.is_favori ? '#EF4444' : C.textSub}
            fill={offre.is_favori ? '#EF4444' : 'none'}
            strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Company + Title card */}
        <View style={[styles.offerHeader, { backgroundColor: C.bgCard, borderColor: C.border }]}>
          <View style={[styles.logoBox, { backgroundColor: C.primarySoft }]}>
            <Text style={[styles.logoText, { color: C.primary }]}>{logo}</Text>
          </View>
          <Text style={[styles.offerTitle, { color: C.text }]}>{offre.titre}</Text>
          <Text style={[styles.companyName, { color: C.textSub }]}>{offre.entreprise?.nom}</Text>

          {/* Status / domain chips */}
          <View style={styles.chipGrid}>
            {offre.domaine ? (
              <View style={[styles.chip, { backgroundColor: '#EFF6FF' }]}>
                <Text style={[styles.chipText, { color: '#1D4ED8' }]}>{offre.domaine}</Text>
              </View>
            ) : null}
            <View style={[styles.chip, { backgroundColor: isActive ? '#DCFCE7' : '#F1F5F9' }]}>
              {isActive && <CheckCircle2 size={11} color="#15803D" strokeWidth={2} />}
              <Text style={[styles.chipText, { color: isActive ? '#15803D' : '#64748B' }]}>
                {offre.statut || 'Inconnu'}
              </Text>
            </View>
            {offre.teletravail ? (
              <View style={[styles.chip, { backgroundColor: '#F0FDF4' }]}>
                <Wifi size={11} color="#059669" strokeWidth={2} />
                <Text style={[styles.chipText, { color: '#059669' }]}>{t('offerDetail.remote')}</Text>
              </View>
            ) : null}
            {offre.duree_semaines ? (
              <View style={[styles.chip, { backgroundColor: C.bgMuted }]}>
                <Clock size={11} color={C.textSub} strokeWidth={2} />
                <Text style={[styles.chipText, { color: C.textSub }]}>{offre.duree_semaines} {t('offerDetail.weeks')}</Text>
              </View>
            ) : null}
            {offre.localisation ? (
              <View style={[styles.chip, { backgroundColor: C.bgMuted }]}>
                <MapPin size={11} color={C.textSub} strokeWidth={2} />
                <Text style={[styles.chipText, { color: C.textSub }]}>{offre.localisation}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Details grid */}
        <View style={[styles.section, { backgroundColor: C.bgCard, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>{t('offerDetail.information')}</Text>
          <View style={styles.detailGrid}>
            <DetailRow icon={Calendar} label={t('offerDetail.startDate')} value={startDate} C={C} />
            <DetailRow icon={Calendar} label={t('offerDetail.endDate')} value={endDate} C={C} />
            <DetailRow
              icon={DollarSign}
              label={t('offerDetail.compensation')}
              value={offre.gratification ? `${offre.gratification} ${t('offerDetail.perMonth')}` : t('offerDetail.unpaid')}
              C={C}
              highlight={!!offre.gratification}
            />
            {offre.duree_semaines ? (
              <DetailRow icon={Clock} label={t('offerDetail.duration')} value={`${offre.duree_semaines} ${t('offerDetail.weeks')}`} C={C} />
            ) : null}
          </View>
        </View>

        {/* Description */}
        <Section title={t('offerDetail.missionDesc')} C={C}>
          <Text style={[styles.bodyText, { color: C.textSub }]}>
            {offre.description || t('offerDetail.noDescription')}
          </Text>
        </Section>

        {/* Required profile */}
        {offre.exigences ? (
          <Section title={t('offerDetail.requiredProfile')} C={C}>
            <Text style={[styles.bodyText, { color: C.textSub }]}>{offre.exigences}</Text>
          </Section>
        ) : null}

        {/* About company */}
        <Section title={t('offerDetail.aboutCompany')} C={C}>
          <View style={styles.companyRow}>
            <View style={[styles.companyIcon, { backgroundColor: C.primarySoft }]}>
              <Building2 size={16} color={C.primary} strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.companyRowName, { color: C.text }]}>{offre.entreprise?.nom || 'Entreprise'}</Text>
            </View>
          </View>
        </Section>

        {/* Publication date */}
        {offre.publie_le ? (
          <View style={{ paddingHorizontal: 16, marginTop: 4, marginBottom: 4 }}>
            <Text style={[styles.metaText, { color: C.textSub }]}>
              {t('offerDetail.publishedOn', { date: fmt(offre.publie_le) })}
            </Text>
          </View>
        ) : null}

      </ScrollView>

      {/* CTA fixe */}
      <View style={[styles.cta, { paddingBottom: insets.bottom + 12, backgroundColor: C.bgCard, borderTopColor: C.border }]}>
        <TouchableOpacity
          style={[
            styles.ctaBtn,
            alreadyApplied
              ? { backgroundColor: '#E2E8F0' }
              : { backgroundColor: isActive ? C.primary : '#94A3B8' },
          ]}
          onPress={() => { if (!alreadyApplied && isActive) setModalOpen(true); }}
          activeOpacity={alreadyApplied || !isActive ? 1 : 0.85}
          disabled={alreadyApplied || !isActive}
        >
          {alreadyApplied ? (
            <>
              <CheckCircle size={18} color="#64748B" strokeWidth={2} />
              <Text style={[styles.ctaBtnText, { color: '#64748B' }]}>{t('offerDetail.alreadyApplied')}</Text>
            </>
          ) : !isActive ? (
            <Text style={[styles.ctaBtnText, { color: '#fff' }]}>{t('offerDetail.status.Inactive')}</Text>
          ) : (
            <>
              <FileUp size={18} color="#fff" strokeWidth={2} />
              <Text style={styles.ctaBtnText}>{t('offerDetail.applyNow')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal candidature */}
      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => { if (!candidatureMutation.isPending) setModalOpen(false); }}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalSheet, { backgroundColor: C.bgCard }]}>
            <View style={[styles.handle, { backgroundColor: C.border }]} />

            {done ? (
              <View style={styles.doneWrap}>
                <CheckCircle size={48} color={C.success} strokeWidth={1.5} />
                <Text style={[styles.doneTitle, { color: C.text }]}>{t('offers.applyModal.success')}</Text>
                <Text style={[styles.doneBody, { color: C.textSub }]}>{t('offers.applyModal.hint')}</Text>
                <TouchableOpacity style={[styles.ctaBtn, { backgroundColor: C.primary, marginTop: 8, alignSelf: 'stretch' }]} onPress={() => { setModalOpen(false); setDone(false); }}>
                  <Text style={styles.ctaBtnText}>{t('common.close')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: C.text }]}>{t('offers.applyModal.title')}</Text>
                  <TouchableOpacity onPress={() => setModalOpen(false)} hitSlop={8}>
                    <X size={22} color={C.textMuted} strokeWidth={2} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.fieldLabel, { color: C.text }]}>{t('offers.applyModal.cvLabel')} <Text style={{ color: '#EF4444' }}>*</Text></Text>
                <TouchableOpacity style={[styles.uploadBtn, { borderColor: cv ? C.primary : C.border, backgroundColor: cv ? C.primarySoft : C.bgMuted }]} onPress={pickCv} activeOpacity={0.75}>
                  <Upload size={18} color={cv ? C.primary : C.textSub} strokeWidth={1.8} />
                  <Text style={[styles.uploadText, { color: cv ? C.primary : C.textSub }]}>
                    {cv ? cv.name : t('offers.applyModal.cvBtn')}
                  </Text>
                </TouchableOpacity>

                <Text style={[styles.fieldLabel, { color: C.text, marginTop: 16 }]}>{t('offers.applyModal.motivationLabel')}</Text>
                <TextInput
                  style={[styles.textarea, { borderColor: C.border, color: C.text, backgroundColor: C.bgMuted }]}
                  placeholder={t('offers.applyModal.motivationPlaceholder')}
                  placeholderTextColor={C.textMuted}
                  multiline
                  numberOfLines={4}
                  value={motiv}
                  onChangeText={setMotiv}
                  textAlignVertical="top"
                />

                <TouchableOpacity
                  style={[styles.ctaBtn, { backgroundColor: C.primary, marginTop: 20, opacity: candidatureMutation.isPending ? 0.65 : 1 }]}
                  onPress={() => candidatureMutation.mutate()}
                  disabled={candidatureMutation.isPending || !cv}
                  activeOpacity={0.85}
                >
                  {candidatureMutation.isPending
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.ctaBtnText}>{t('offers.applyModal.submit')}</Text>}
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function Section({ title, C, children }) {
  return (
    <View style={[styles.section, { backgroundColor: C.bgCard, borderColor: C.border }]}>
      <Text style={[styles.sectionTitle, { color: C.text }]}>{title}</Text>
      {children}
    </View>
  );
}

function DetailRow({ icon: Icon, label, value, C, highlight }) {
  if (!value) return null;
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLabelRow}>
        <Icon size={11} color={C.primary} strokeWidth={2} />
        <Text style={[styles.detailLabel, { color: C.textSub }]}>{label}</Text>
      </View>
      <View style={[styles.detailValue, { borderColor: C.border, backgroundColor: C.bgMuted }]}>
        <Text style={[styles.detailValueText, { color: highlight ? '#059669' : C.text, fontFamily: highlight ? F.semi : F.med }]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1 },
  centered:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navBar:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  iconBtn:        { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  navTitle:       { flex: 1, fontFamily: F.semi, fontSize: 15, textAlign: 'center', marginHorizontal: 8 },
  offerHeader:    { padding: 20, alignItems: 'center', gap: 6, marginHorizontal: 16, marginTop: 16, borderRadius: radius.card, borderWidth: 1, ...shadow.card },
  logoBox:        { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  logoText:       { fontFamily: F.bold, fontSize: 21 },
  offerTitle:     { fontFamily: F.bold, fontSize: 18, letterSpacing: -0.3, textAlign: 'center' },
  companyName:    { fontFamily: F.reg, fontSize: 13, textAlign: 'center' },
  chipGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 8 },
  chip:           { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  chipText:       { fontFamily: F.med, fontSize: 11 },
  section:        { padding: 16, marginHorizontal: 16, marginTop: 12, borderRadius: radius.card, borderWidth: 1, ...shadow.card },
  sectionTitle:   { fontFamily: F.semi, fontSize: 14, marginBottom: 12 },
  bodyText:       { fontFamily: F.reg, fontSize: 14, lineHeight: 22 },
  detailGrid:     { gap: 10 },
  detailRow:      { gap: 4 },
  detailLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  detailLabel:    { fontFamily: F.semi, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue:    { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9 },
  detailValueText:{ fontSize: 14 },
  companyRow:     { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  companyIcon:    { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  companyRowName: { fontFamily: F.semi, fontSize: 14 },
  metaText:       { fontFamily: F.reg, fontSize: 12 },
  tipBox:         { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginHorizontal: 16, marginTop: 12, padding: 14, borderRadius: radius.card, borderWidth: 1 },
  tipText:        { fontFamily: F.reg, fontSize: 13, lineHeight: 20, flex: 1 },
  cta:            { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1 },
  ctaBtn:         { borderRadius: 13, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaBtnText:     { fontFamily: F.semi, fontSize: 15, color: '#fff' },
  modalOverlay:   { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.5)' },
  modalSheet:     { borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingTop: 12 },
  handle:         { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle:     { fontFamily: F.bold, fontSize: 17 },
  fieldLabel:     { fontFamily: F.semi, fontSize: 13, marginBottom: 8 },
  uploadBtn:      { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 14, padding: 16 },
  uploadText:     { fontFamily: F.med, fontSize: 14, flex: 1 },
  textarea:       { borderWidth: 1, borderRadius: 14, padding: 16, fontFamily: F.reg, fontSize: 14, minHeight: 100 },
  doneWrap:       { alignItems: 'center', paddingVertical: 16, gap: 12 },
  doneTitle:      { fontFamily: F.bold, fontSize: 20 },
  doneBody:       { fontFamily: F.reg, fontSize: 14, lineHeight: 21, textAlign: 'center' },
});
