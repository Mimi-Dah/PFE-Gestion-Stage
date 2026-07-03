import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal, FlatList, Platform, I18nManager,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import {
  Calendar, FileText, CheckCircle, Clock, XCircle,
  Briefcase, ChevronRight, ChevronLeft, ChevronDown, ClipboardList, Upload,
  Star, MessageSquare, AlertTriangle, Award, Download,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFloatingTabPadding } from '../../components/ui/FloatingTabBar';
import { F } from '../../theme/fonts';
import { shadow, radius } from '../../theme/tokens';
import useLayoutStore from '../../store/layoutStore';
import useAuthStore from '../../store/authStore';
import { getColors } from '../../theme/colors';
import api, { API_BASE_URL } from '../../services/api';

async function fetchConventions() {
  const r = await api.get('conventions/');
  return r.data?.results ?? (Array.isArray(r.data) ? r.data : []);
}
async function fetchRapports() {
  const r = await api.get('rapports/');
  return r.data?.results ?? r.data ?? [];
}
async function fetchActiveCandidature() {
  const r = await api.get('candidatures/mes-candidatures/');
  const all = r.data?.results ?? r.data ?? [];
  const ACTIVE = ['Acceptée', 'Stage_actif', 'Terminé', 'Convention_en_cours'];
  return all.find((c) => ACTIVE.includes(c.statut)) ?? null;
}

const CONV_COLORS = {
  'en_attente_validation': { color: '#F59E0B', bg: '#FFFBEB', icon: Clock },
  'validée':               { color: '#10B981', bg: '#ECFDF5', icon: CheckCircle },
  'refusée':               { color: '#EF4444', bg: '#FEF2F2', icon: XCircle },
};

export default function MyInternshipScreen({ navigation }) {
  const { t }  = useTranslation();
  const insets = useSafeAreaInsets();
  const tabPad = useFloatingTabPadding();
  const isDark = useLayoutStore((s) => s.isDarkMode);
  const C      = getColors(isDark);
  const qc     = useQueryClient();

  const token = useAuthStore((s) => s.token);

  const fmt = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString(t('dashboard.dateLocale'), { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const convStatus = (raw) => {
    const key = (raw || '').toLowerCase();
    const colors = CONV_COLORS[key] ?? CONV_COLORS['en_attente_validation'];
    const label = t(`myInternship.conventionStatus.${key}`) || t('myInternship.conventionStatus.en_attente_validation');
    return { ...colors, label };
  };

  const CAND_STATUS_CFG = {
    Stage_actif:         { label: t('candidatures.status.Stage_actif'),         color: '#059669', bg: '#ECFDF5' },
    Terminé:             { label: t('candidatures.status.Terminé'),              color: '#64748B', bg: '#F1F5F9' },
    Acceptée:            { label: t('candidatures.status.Acceptée'),             color: '#059669', bg: '#ECFDF5' },
    Convention_en_cours: { label: t('candidatures.status.Convention_en_cours'),  color: '#1B6EF3', bg: '#EFF6FF' },
  };
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [pickerVisible,  setPickerVisible]  = useState(false);
  const [downloading,    setDownloading]    = useState(null);

  const handleDownload = async (fileUrl, filename) => {
    if (!fileUrl) return;

    // Build absolute URL — Django may return relative or absolute paths
    let fullUrl = fileUrl;
    if (!fileUrl.startsWith('http')) {
      const serverBase = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
      let path = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
      if (!path.startsWith('/media/')) path = `/media${path}`;
      fullUrl = serverBase + path;
    }

    try {
      setDownloading(filename);

      // Download to app cache with auth header
      const tempUri = FileSystem.cacheDirectory + filename;
      const { uri, status } = await FileSystem.downloadAsync(fullUrl, tempUri, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (status !== 200) throw new Error(`Erreur serveur (${status})`);

      if (Platform.OS === 'ios') {
        // iOS: use share sheet — lets user save to Files, AirDrop, etc.
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: filename });
        } else {
          Alert.alert(t('common.error'), t('myInternship.downloadError'));
        }
      } else {
        // Android: use SAF to write directly to Downloads folder
        const DOWNLOADS_URI =
          'content://com.android.externalstorage.documents/tree/primary%3ADownload';
        const { granted, directoryUri } =
          await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(DOWNLOADS_URI);
        if (!granted) return;

        try {
          const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const destUri = await FileSystem.StorageAccessFramework.createFileAsync(
            directoryUri, filename, 'application/pdf',
          );
          await FileSystem.writeAsStringAsync(destUri, base64, {
            encoding: FileSystem.EncodingType.Base64,
          });
          Alert.alert(t('myInternship.downloading'), `"${filename}" ${t('myInternship.downloadSuccess')}`);
        } catch {
          Alert.alert(t('common.error'), t('myInternship.downloadError'));
        }
      }
    } catch (e) {
      Alert.alert(t('common.error'), e?.message || t('myInternship.downloadError'));
    } finally {
      setDownloading(null);
    }
  };

  const { data: conventions = [], isLoading: loadingConv, isError: errConv } = useQuery({ queryKey: ['conventions'], queryFn: fetchConventions });
  const { data: rapports = [],    isLoading: loadingRap  } = useQuery({ queryKey: ['rapports'], queryFn: fetchRapports });
  const { data: activeCandidature, isLoading: loadingCand, isError: errCand } = useQuery({
    queryKey: ['active-candidature'],
    queryFn: fetchActiveCandidature,
  });

  const sorted     = [...conventions].sort((a, b) => (b.id_convention ?? b.id ?? 0) - (a.id_convention ?? a.id ?? 0));
  const convention = (selectedConvId !== null ? sorted.find(c => (c.id_convention ?? c.id) === selectedConvId) : null) ?? sorted[0] ?? null;

  const uploadRapportMutation = useMutation({
    mutationFn: async ({ fileUri, fileName, mimeType, resume, offreId }) => {
      const form = new FormData();
      form.append('fichier', { uri: fileUri, name: fileName, type: mimeType });
      form.append('resume', resume || 'Rapport de stage');
      form.append('offre', offreId);
      return api.post('rapports/', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rapports'] });
      Alert.alert(t('common.success'), t('myInternship.reportSuccess'));
    },
    onError: (e) => Alert.alert(t('common.error'), e.response?.data?.detail || t('myInternship.reportError')),
  });

  // Unified offre_id: prefer convention data, fall back to candidature FK
  const offreId = convention?.offre_id ?? activeCandidature?.offre ?? null;

  const handleUploadRapport = async () => {
    if (!offreId) {
      Alert.alert(t('common.error'), t('myInternship.noFile'));
      return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (result.canceled) return;
      const asset = result.assets[0];
      uploadRapportMutation.mutate({
        fileUri:  asset.uri,
        fileName: asset.name,
        mimeType: asset.mimeType || 'application/pdf',
        resume:   t('myInternship.reportTitle'),
        offreId,
      });
    } catch {
      Alert.alert(t('common.error'), t('myInternship.signError'));
    }
  };

  if (loadingConv || loadingRap || loadingCand) {
    return <View style={[styles.centered, { backgroundColor: C.bg }]}><ActivityIndicator color={C.primary} /></View>;
  }

  // Both queries failed (network / auth error) — show a retry prompt
  if (errConv && errCand) {
    return (
      <View style={[styles.centered, { backgroundColor: C.bg }]}>
        <View style={[styles.emptyIconBox, { backgroundColor: '#FEF2F2' }]}>
          <AlertTriangle size={28} color="#EF4444" strokeWidth={1.5} />
        </View>
        <Text style={[styles.emptyTitle, { color: C.text }]}>{t('myInternship.empty')}</Text>
        <Text style={[styles.emptyBody, { color: C.textSub }]}>{t('myInternship.emptySubtitle')}</Text>
        <TouchableOpacity
          style={[styles.uploadBtn, { backgroundColor: C.primary, marginTop: 16, paddingHorizontal: 24 }]}
          onPress={() => { qc.invalidateQueries(); }}
        >
          <Text style={styles.uploadBtnText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show empty state only when both queries succeeded but returned no data
  if (!convention && !activeCandidature) {
    return <EmptyStage C={C} insets={insets} tabPad={tabPad} t={t} />;
  }

  const candidatureStatut = convention?.candidature_statut ?? activeCandidature?.statut ?? null;
  const candStatusCfg = CAND_STATUS_CFG[candidatureStatut] ?? null;

  const cs      = convention ? convStatus(convention.statut) : null;
  const CsIcon  = cs?.icon ?? Clock;
  const rapport = (convention?.offre_id
    ? rapports.find(r => r.offre === convention.offre_id)
    : rapports[0]) ?? null;

  const offreDetail  = activeCandidature?.offre_detail ?? {};
  const dateDebut = fmt(
    convention?.offre_date_debut ?? offreDetail.date_debut
  );
  const dateFin = fmt(
    convention?.offre_date_fin ?? offreDetail.date_fin
  );

  // Display info: prefer convention fields, fall back to candidature offer detail
  const offreTitre   = convention?.offre_titre   ?? offreDetail.titre       ?? 'Stage en cours';
  const entrepriseNom = convention?.entreprise_nom ?? offreDetail.entreprise?.nom ?? 'Entreprise';

  // Can the student upload a rapport?
  // Either the candidature is active, OR the convention is already validated (which implies active stage)
  const canUpload = !!offreId && (
    ['Stage_actif', 'Terminé'].includes(activeCandidature?.statut) ||
    convention?.statut?.toLowerCase() === 'validée'
  );

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: C.bgCard, borderBottomColor: C.border }]}>
        {/* Row 1 — title + N° */}
        <View style={styles.headerTopRow}>
          <Text style={[styles.pageTitle, { color: C.text }]}>{t('myInternship.title')}</Text>
          {convention?.numero_convention && (
            <Text style={[styles.convNum, { color: C.textMuted }]}>N° {convention.numero_convention}</Text>
          )}
        </View>

        {/* Row 2 — status pill + convention selector */}
        <View style={styles.headerBottomRow}>
          {candStatusCfg && (
            <View style={[styles.statusPill, { backgroundColor: candStatusCfg.bg }]}>
              <Text style={[styles.statusPillText, { color: candStatusCfg.color }]}>{candStatusCfg.label}</Text>
            </View>
          )}

          {sorted.length > 0 && (
            <TouchableOpacity
              onPress={() => sorted.length > 1 && setPickerVisible(true)}
              style={[styles.selectorBtn, { backgroundColor: C.bgMuted ?? C.bg, borderColor: C.border }]}
              activeOpacity={sorted.length > 1 ? 0.7 : 1}
            >
              <Text style={[styles.selectorBtnText, { color: C.text }]} numberOfLines={1}>
                {convention?.offre_titre ?? '—'}
              </Text>
              {sorted.length > 1 && <ChevronDown size={13} color={C.textMuted} strokeWidth={2} />}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Convention picker modal */}
      <Modal visible={pickerVisible} transparent animationType="slide" onRequestClose={() => setPickerVisible(false)}>
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setPickerVisible(false)}>
          <View style={[styles.pickerSheet, { backgroundColor: C.bgCard }]}>
            <View style={[styles.pickerHandle, { backgroundColor: C.border }]} />
            <Text style={[styles.pickerTitle, { color: C.text }]}>{t('myInternship.title')}</Text>
            <FlatList
              data={sorted}
              keyExtractor={c => String(c.id_convention ?? c.id)}
              renderItem={({ item }) => {
                const convId = item.id_convention ?? item.id;
                const isActive = convId === (convention?.id_convention ?? convention?.id);
                return (
                  <TouchableOpacity
                    style={[styles.pickerItem, isActive && { backgroundColor: C.primarySoft }]}
                    onPress={() => { setSelectedConvId(convId); setPickerVisible(false); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pickerItemText, { color: isActive ? C.primary : C.text }]} numberOfLines={2}>
                      {item.offre_titre ?? `Convention #${convId}`}
                    </Text>
                    {isActive && <CheckCircle size={16} color={C.primary} strokeWidth={2} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: tabPad, gap: 14 }}>

        {/* ── Info card (entreprise + dates) ──────────────────────── */}
        <View style={[styles.infoCard, { backgroundColor: C.bgCard, borderColor: C.border }]}>
          {/* Company row */}
          <View style={styles.infoCompanyRow}>
            <View style={[styles.infoIconBox, { backgroundColor: C.primarySoft }]}>
              <Briefcase size={18} color={C.primary} strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoOffreTitle, { color: C.text }]} numberOfLines={2}>{offreTitre}</Text>
              <Text style={[styles.infoCompanyName, { color: C.textSub }]}>{entrepriseNom}</Text>
            </View>
          </View>

          {(dateDebut || dateFin) && (
            <>
              <View style={[styles.infoDivider, { backgroundColor: C.border }]} />
              <View style={styles.infoDatesRow}>
                <View style={styles.infoDateItem}>
                  <Calendar size={13} color={C.primary} strokeWidth={1.8} />
                  <View>
                    <Text style={[styles.infoDateLabel, { color: C.textMuted }]}>{t('offerDetail.startDate')}</Text>
                    <Text style={[styles.infoDateVal, { color: C.text }]}>{dateDebut || '—'}</Text>
                  </View>
                </View>
                <View style={[styles.infoDateSep, { backgroundColor: C.border }]} />
                <View style={styles.infoDateItem}>
                  <Calendar size={13} color={C.primary} strokeWidth={1.8} />
                  <View>
                    <Text style={[styles.infoDateLabel, { color: C.textMuted }]}>{t('offerDetail.duration')}</Text>
                    <Text style={[styles.infoDateVal, { color: C.text }]}>{dateFin || '—'}</Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>

        {/* ── Convention de stage ──────────────────────────────────── */}
        <SectionTitle C={C} icon={FileText} label={t('myInternship.signTitle')} />

        {convention ? (
          <View style={[styles.card, { backgroundColor: C.bgCard, borderColor: C.border }]}>
            {/* Status badge */}
            <View style={[styles.statusRow, { backgroundColor: cs.bg, borderColor: cs.color }]}>
              <CsIcon size={15} color={cs.color} strokeWidth={2} />
              <Text style={[styles.statusLabel, { color: cs.color }]}>{cs.label}</Text>
            </View>

            {/* Refusal reason */}
            {convention.statut === 'Refusée' && convention.motif_refus && (
              <View style={[styles.alertBox, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }]}>
                <AlertTriangle size={14} color="#EF4444" strokeWidth={2} />
                <Text style={[styles.alertText, { color: '#B91C1C' }]}>{convention.motif_refus}</Text>
              </View>
            )}

            {/* Signature timeline */}
            <View style={styles.timelineWrap}>
              <TimelineRow
                C={C}
                done={!!convention.signe_par_etudiant_le}
                label={`${t('myInternship.signedStudent')}`}
                date={fmt(convention.signe_par_etudiant_le)}
              />
              <TimelineRow
                C={C}
                done={!!convention.signe_par_entreprise_le}
                label={`${t('myInternship.signedCompany')}`}
                date={fmt(convention.signe_par_entreprise_le)}
              />
              <TimelineRow
                C={C}
                done={convention.statut === 'Validée'}
                label={t('myInternship.conventionStatus.validée')}
                date={fmt(convention.date_validation)}
                last
              />
            </View>

            {convention.jours_restants != null && convention.statut === 'En_attente_validation' && (
              <View style={[styles.slaRow, { backgroundColor: convention.jours_restants < 0 ? '#FEF2F2' : C.bgMuted }]}>
                <Clock size={13} color={convention.jours_restants < 0 ? '#EF4444' : C.textMuted} strokeWidth={2} />
                <Text style={[styles.slaText, { color: convention.jours_restants < 0 ? '#EF4444' : C.textMuted }]}>
                  {convention.jours_restants < 0
                    ? `${t('myInternship.waitingSignature')} (${Math.abs(convention.jours_restants)})`
                    : `${convention.jours_restants} ${t('myInternship.waitingSignature')}`}
                </Text>
              </View>
            )}

            {(convention.fichier_signe || convention.fichier_convention) && (() => {
              const url  = convention.fichier_signe || convention.fichier_convention;
              const name = convention.fichier_signe ? 'convention_signee.pdf' : 'convention.pdf';
              const isLoading = downloading === name;
              return (
                <TouchableOpacity
                  style={[styles.downloadBtn, { backgroundColor: C.primarySoft }]}
                  onPress={() => handleDownload(url, name)}
                  disabled={!!downloading}
                  activeOpacity={0.7}
                >
                  {isLoading
                    ? <ActivityIndicator size="small" color={C.primary} />
                    : <>
                        <Download size={15} color={C.primary} strokeWidth={2} />
                        <Text style={[styles.downloadBtnText, { color: C.primary }]}>
                          {convention.fichier_signe ? t('myInternship.downloadConvention') : t('myInternship.uploadConvention')}
                        </Text>
                      </>}
                </TouchableOpacity>
              );
            })()}
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: C.bgCard, borderColor: C.border }]}>
            <View style={[styles.statusRow, { backgroundColor: '#FFFBEB', borderColor: '#FCD34D' }]}>
              <Clock size={15} color="#F59E0B" strokeWidth={2} />
              <Text style={[styles.statusLabel, { color: '#F59E0B' }]}>
                {activeCandidature?.statut === 'Convention_en_cours'
                  ? t('candidatures.status.Convention_en_cours')
                  : t('myInternship.waitingSignature')}
              </Text>
            </View>
          </View>
        )}

        {/* ── Rapport de stage ─────────────────────────────────────── */}
        <SectionTitle C={C} icon={ClipboardList} label={t('myInternship.reportTitle')} />

        <View style={[styles.card, { backgroundColor: C.bgCard, borderColor: C.border }]}>
          {rapport !== null ? (
            <>
              <View style={[styles.statusRow, { alignSelf: 'stretch', backgroundColor: '#ECFDF5', borderColor: '#6EE7B7' }]}>
                <CheckCircle size={15} color="#10B981" strokeWidth={2} />
                <Text style={[styles.statusLabel, { color: '#10B981', flex: 1 }]}>{t('myInternship.submitted')}</Text>
                <Text style={[styles.statusDate, { color: '#6EE7B7' }]}>{fmt(rapport.soumis_le)}</Text>
              </View>

              {rapport.note != null && (
                <View style={[styles.gradeBox, { backgroundColor: C.primarySoft, borderColor: C.primary + '40' }]}>
                  <Award size={20} color={C.primary} strokeWidth={1.8} />
                  <View>
                    <Text style={[styles.gradeLabel, { color: C.textMuted }]}>{t('evaluations.globalScore')}</Text>
                    <Text style={[styles.gradeVal, { color: C.primary }]}>{rapport.note} <Text style={styles.gradeSur}>/20</Text></Text>
                  </View>
                </View>
              )}

              {rapport.commentaire && (
                <View style={[styles.commentBox, { backgroundColor: C.bgMuted, borderColor: C.border }]}>
                  <MessageSquare size={14} color={C.textSub} strokeWidth={1.8} />
                  <Text style={[styles.commentText, { color: C.textSub }]}>{rapport.commentaire}</Text>
                </View>
              )}

              {rapport.fichier && (
                <TouchableOpacity
                  style={[styles.downloadBtn, { backgroundColor: C.primarySoft }]}
                  onPress={() => handleDownload(rapport.fichier, 'rapport_de_stage.pdf')}
                  disabled={!!downloading}
                  activeOpacity={0.7}
                >
                  {downloading === 'rapport_de_stage.pdf'
                    ? <ActivityIndicator size="small" color={C.primary} />
                    : <>
                        <Download size={15} color={C.primary} strokeWidth={2} />
                        <Text style={[styles.downloadBtnText, { color: C.primary }]}>{t('myInternship.downloadReport')}</Text>
                      </>}
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <View style={[styles.statusRow, { backgroundColor: '#FFFBEB', borderColor: '#FCD34D' }]}>
                <Clock size={15} color="#F59E0B" strokeWidth={2} />
                <Text style={[styles.statusLabel, { color: '#F59E0B' }]}>{t('myInternship.notSubmitted')}</Text>
              </View>
              <Text style={[styles.rapportHint, { color: C.textMuted }]}>
                {t('myInternship.uploadPlaceholder')}
              </Text>
              {canUpload ? (
                <TouchableOpacity
                  style={[styles.uploadBtn, { backgroundColor: C.primary }]}
                  onPress={handleUploadRapport}
                  disabled={uploadRapportMutation.isPending}
                  activeOpacity={0.8}
                >
                  {uploadRapportMutation.isPending
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <>
                        <Upload size={15} color="#fff" strokeWidth={2} />
                        <Text style={styles.uploadBtnText}>{t('myInternship.uploadReport')}</Text>
                      </>}
                </TouchableOpacity>
              ) : (
                <View style={[styles.statusRow, { backgroundColor: C.bgMuted, borderColor: C.border }]}>
                  <AlertTriangle size={14} color={C.textMuted} strokeWidth={2} />
                  <Text style={[styles.statusLabel, { color: C.textMuted }]}>
                    {t('myInternship.waitingSignature')}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* ── Accès rapide ─────────────────────────────────────────── */}
        <SectionTitle C={C} icon={Star} label={t('myInternship.evalTitle')} />

        <View style={[styles.card, { backgroundColor: C.bgCard, borderColor: C.border, gap: 0, padding: 0 }]}>
          <QuickRow
            C={C}
            label={t('evaluations.title')}
            sub={offreTitre !== 'Stage en cours' ? offreTitre : t('evaluations.emptyForOffer')}
            onPress={() => navigation.navigate('Evaluations', {
              offreId:   offreId,
              stageName: offreTitre,
            })}
          />
          <View style={[styles.rowDivider, { backgroundColor: C.border }]} />
          <QuickRow
            C={C}
            label={t('absences.title')}
            sub={offreTitre !== 'Stage en cours' ? offreTitre : t('absences.empty')}
            onPress={() => navigation.navigate('Absences', {
              candidatureId: convention?.candidature ?? activeCandidature?.id_candidature ?? null,
              stageName:     offreTitre,
            })}
          />
        </View>

      </ScrollView>
    </View>
  );
}

function SectionTitle({ C, icon: Icon, label }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Icon size={15} color={C.primary} strokeWidth={2} />
      <Text style={[styles.sectionTitle, { color: C.text }]}>{label}</Text>
    </View>
  );
}

function TimelineRow({ C, done, label, date, last }) {
  return (
    <View style={styles.tlRow}>
      <View style={styles.tlLeft}>
        <View style={[styles.tlDot, { backgroundColor: done ? '#10B981' : C.border, borderColor: done ? '#10B981' : C.border }]}>
          {done && <CheckCircle size={10} color="#fff" strokeWidth={3} />}
        </View>
        {!last && <View style={[styles.tlLine, { backgroundColor: C.border }]} />}
      </View>
      <View style={styles.tlContent}>
        <Text style={[styles.tlLabel, { color: done ? C.text : C.textMuted }]}>{label}</Text>
        {date && <Text style={[styles.tlDate, { color: C.textMuted }]}>{date}</Text>}
      </View>
    </View>
  );
}

function QuickRow({ C, label, sub, onPress }) {
  return (
    <TouchableOpacity style={styles.quickRow} onPress={onPress} activeOpacity={0.7}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.quickLabel, { color: C.text }]}>{label}</Text>
        <Text style={[styles.quickSub, { color: C.textMuted }]}>{sub}</Text>
      </View>
      {I18nManager.isRTL
        ? <ChevronLeft size={16} color={C.textMuted} strokeWidth={1.8} />
        : <ChevronRight size={16} color={C.textMuted} strokeWidth={1.8} />}
    </TouchableOpacity>
  );
}

function EmptyStage({ C, insets, tabPad, t }) {
  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: C.bgCard, borderBottomColor: C.border }]}>
        <Text style={[styles.pageTitle, { color: C.text }]}>{t('myInternship.title')}</Text>
      </View>
      <View style={[styles.centered, { paddingBottom: tabPad }]}>
        <View style={[styles.emptyIconBox, { backgroundColor: C.primarySoft }]}>
          <Briefcase size={28} color={C.primary} strokeWidth={1.5} />
        </View>
        <Text style={[styles.emptyTitle, { color: C.text }]}>{t('myInternship.empty')}</Text>
        <Text style={[styles.emptyBody, { color: C.textSub }]}>{t('myInternship.emptySubtitle')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1 },
  centered:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  header:            { paddingHorizontal: 18, paddingBottom: 14, borderBottomWidth: 1, gap: 10 },
  headerTopRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerBottomRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pageTitle:         { fontFamily: F.bold, fontSize: 20, letterSpacing: -0.3 },
  convNum:           { fontFamily: F.reg, fontSize: 12 },

  statusPill:        { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  statusPillText:    { fontFamily: F.semi, fontSize: 11 },
  selectorBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  selectorBtnText:   { fontFamily: F.med, fontSize: 13, flex: 1 },

  pickerOverlay:   { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  pickerSheet:     { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32, paddingTop: 12, maxHeight: '60%' },
  pickerHandle:    { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  pickerTitle:     { fontFamily: F.bold, fontSize: 16, paddingHorizontal: 20, marginBottom: 8 },
  pickerItem:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
  pickerItemText:  { fontFamily: F.med, fontSize: 14, flex: 1 },

  infoCard:        { borderRadius: radius.card, borderWidth: 1, overflow: 'hidden', ...shadow.card },
  infoCompanyRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  infoIconBox:     { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  infoOffreTitle:  { fontFamily: F.bold, fontSize: 14, letterSpacing: -0.1, marginBottom: 2 },
  infoCompanyName: { fontFamily: F.med, fontSize: 12 },
  infoDivider:     { height: 1 },
  infoDatesRow:    { flexDirection: 'row', alignItems: 'center', padding: 12 },
  infoDateItem:    { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9 },
  infoDateSep:     { width: 1, height: 32, marginHorizontal: 8 },
  infoDateLabel:   { fontFamily: F.reg, fontSize: 11, marginBottom: 1 },
  infoDateVal:     { fontFamily: F.semi, fontSize: 13 },

  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 4 },
  sectionTitle:    { fontFamily: F.semi, fontSize: 14 },

  card:         { borderRadius: radius.card, borderWidth: 1, padding: 14, gap: 10, ...shadow.card },

  statusRow:    { flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  statusLabel:  { fontFamily: F.semi, fontSize: 13 },
  statusDate:   { fontFamily: F.reg, fontSize: 11 },

  alertBox:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10, borderRadius: 10, borderWidth: 1 },
  alertText:    { fontFamily: F.reg, fontSize: 13, flex: 1, lineHeight: 19 },

  timelineWrap: { gap: 0, marginTop: 4 },
  tlRow:        { flexDirection: 'row', gap: 12 },
  tlLeft:       { alignItems: 'center', width: 20 },
  tlDot:        { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  tlLine:       { width: 2, flex: 1, marginVertical: 3 },
  tlContent:    { flex: 1, paddingBottom: 16 },
  tlLabel:      { fontFamily: F.med, fontSize: 14 },
  tlDate:       { fontFamily: F.reg, fontSize: 12, marginTop: 2 },

  slaRow:       { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  slaText:      { fontFamily: F.med, fontSize: 12 },

  gradeBox:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  gradeLabel:   { fontFamily: F.reg, fontSize: 12, marginBottom: 2 },
  gradeVal:     { fontFamily: F.bold, fontSize: 22 },
  gradeSur:     { fontFamily: F.reg, fontSize: 14 },

  commentBox:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
  commentText:  { fontFamily: F.reg, fontSize: 13, flex: 1, lineHeight: 19 },

  rapportHint:  { fontFamily: F.reg, fontSize: 13, lineHeight: 19 },
  uploadBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 13 },
  uploadBtnText:{ fontFamily: F.semi, fontSize: 14, color: '#fff' },

  rowDivider:   { height: 1 },
  quickRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  quickLabel:   { fontFamily: F.semi, fontSize: 15 },
  quickSub:     { fontFamily: F.reg, fontSize: 12, marginTop: 2 },

  emptyIconBox: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle:   { fontFamily: F.bold, fontSize: 17, textAlign: 'center', letterSpacing: -0.2, marginBottom: 8 },
  emptyBody:    { fontFamily: F.reg, fontSize: 13, lineHeight: 19, textAlign: 'center' },

  downloadBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 12 },
  downloadBtnText: { fontFamily: F.semi, fontSize: 14 },
});
