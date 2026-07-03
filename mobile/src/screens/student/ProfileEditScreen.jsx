import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Image,
} from 'react-native';
import { useMutation } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Camera, FileText, Save } from 'lucide-react-native';
import { F } from '../../theme/fonts';
import { shadow, radius } from '../../theme/tokens';
import useAuthStore from '../../store/authStore';
import useLayoutStore from '../../store/layoutStore';
import { getColors } from '../../theme/colors';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../components/ui/PageHeader';

const NIVEAUX = ['L1', 'L2', 'L3', 'M1', 'M2', 'Doctorat'];

export default function ProfileEditScreen({ navigation }) {
  const { t }      = useTranslation();
  const isDark     = useLayoutStore((s) => s.isDarkMode);
  const C          = getColors(isDark);
  const user       = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const profil     = user?.profil_etudiant || {};

  const [form, setForm] = useState({
    prenom:           profil.prenom           || '',
    nom:              profil.nom              || '',
    telephone:        profil.telephone        || '',
    adresse:          profil.adresse          || '',
    universite:       profil.universite       || '',
    specialite:       profil.specialite       || '',
    matricule:        profil.matricule        || '',
    niveau_academique: profil.niveau_academique || '',
  });
  const [newPhoto, setNewPhoto] = useState(null);
  const [newCv,    setNewCv]   = useState(null);
  const [showNiveaux, setShowNiveaux] = useState(false);

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  /* ── Photo picker ── */
  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert(t('profileEdit.permissionRequired')); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets?.[0]) {
      setNewPhoto(result.assets[0]);
    }
  };

  /* ── CV picker ── */
  const pickCv = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (!result.canceled && result.assets?.[0]) {
      setNewCv(result.assets[0]);
      Alert.alert(t('profileEdit.cvSelected'), result.assets[0].name);
    }
  };

  /* ── Save mutation ── */
  const saveMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (newPhoto) {
        fd.append('photo', {
          uri:  newPhoto.uri,
          name: 'avatar.jpg',
          type: 'image/jpeg',
        });
      }
      if (newCv) {
        fd.append('cv', {
          uri:  newCv.uri,
          name: newCv.name,
          type: 'application/pdf',
        });
      }
      const r = await api.patch('auth/me/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return r.data;
    },
    onSuccess: (data) => {
      updateUser({ ...user, profil_etudiant: data.profil_etudiant ?? profil });
      Alert.alert(t('common.success'), t('profileEdit.successMsg'), [
        { text: t('common.ok'), onPress: () => navigation.goBack() },
      ]);
    },
    onError: (e) => Alert.alert(t('common.error'), e.message || t('profileEdit.errorMsg')),
  });

  const avatarUri = newPhoto?.uri || profil.photo || null;
  const initials  = `${form.prenom?.[0] || ''}${form.nom?.[0] || ''}`.toUpperCase() || 'U';

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>

      <PageHeader
        title={t('profileEdit.pageTitle')}
        onBack={() => navigation.goBack()}
        right={(
          <TouchableOpacity
            onPress={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            hitSlop={8}
          >
            {saveMutation.isPending
              ? <ActivityIndicator size="small" color={C.primary} />
              : <Save size={20} color={C.primary} strokeWidth={2} />}
          </TouchableOpacity>
        )}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <TouchableOpacity style={styles.avatarWrap} onPress={pickPhoto} activeOpacity={0.8}>
          {avatarUri
            ? <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
            : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: C.primarySoft }]}>
                <Text style={[styles.avatarInitials, { color: C.primary }]}>{initials}</Text>
              </View>
            )}
          <View style={[styles.cameraOverlay, { backgroundColor: C.primary }]}>
            <Camera size={14} color="#fff" strokeWidth={2} />
          </View>
        </TouchableOpacity>
        <Text style={[styles.avatarHint, { color: C.textMuted }]}>{t('profileEdit.changePhoto')}</Text>

        {/* ── Section: Infos personnelles ── */}
        <SectionTitle title={t('auth.register.titleForm1').toUpperCase()} C={C} />
        <View style={[styles.card, { backgroundColor: C.bgCard, borderColor: C.border }]}>
          <Field label={`${t('profileEdit.firstName')} *`} value={form.prenom}    onChange={set('prenom')}    C={C} />
          <Divider C={C} />
          <Field label={`${t('profileEdit.lastName')} *`}  value={form.nom}       onChange={set('nom')}       C={C} />
          <Divider C={C} />
          <Field label={t('profileEdit.phone')}             value={form.telephone} onChange={set('telephone')} C={C} keyboardType="phone-pad" />
          <Divider C={C} />
          <Field label={t('profileEdit.address')}           value={form.adresse}   onChange={set('adresse')}   C={C} multiline />
        </View>

        {/* ── Section: Infos académiques ── */}
        <SectionTitle title={t('auth.register.titleForm2').toUpperCase()} C={C} />
        <View style={[styles.card, { backgroundColor: C.bgCard, borderColor: C.border }]}>
          <Field label={t('profileEdit.university')}  value={form.universite}  onChange={set('universite')}  C={C} />
          <Divider C={C} />
          <Field label={t('profileEdit.speciality')}  value={form.specialite}  onChange={set('specialite')}  C={C} />
          <Divider C={C} />
          <Field label={t('profileEdit.matricule')}   value={form.matricule}   onChange={set('matricule')}   C={C} />
          <Divider C={C} />
          {/* Niveau dropdown */}
          <TouchableOpacity
            style={styles.fieldRow}
            onPress={() => setShowNiveaux((v) => !v)}
            activeOpacity={0.7}
          >
            <Text style={[styles.fieldLabel, { color: C.textSub }]}>{t('profileEdit.level')}</Text>
            <Text style={[styles.fieldValue, { color: form.niveau_academique ? C.text : C.textMuted }]}>
              {form.niveau_academique || t('profileEdit.selectLevel')}
            </Text>
          </TouchableOpacity>
          {showNiveaux && (
            <View style={[styles.dropdown, { borderTopColor: C.border }]}>
              {NIVEAUX.map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[styles.dropdownItem, { borderBottomColor: C.border }]}
                  onPress={() => { set('niveau_academique')(n); setShowNiveaux(false); }}
                >
                  <Text style={[styles.dropdownText, {
                    color: form.niveau_academique === n ? C.primary : C.text,
                    fontFamily: form.niveau_academique === n ? F.semi : F.reg,
                  }]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ── Section: Documents ── */}
        <SectionTitle title={t('profileEdit.cv').toUpperCase()} C={C} />
        <TouchableOpacity
          style={[styles.card, styles.docRow, { backgroundColor: C.bgCard, borderColor: C.border }]}
          onPress={pickCv}
          activeOpacity={0.75}
        >
          <FileText size={20} color={C.primary} strokeWidth={1.8} />
          <View style={{ flex: 1, marginStart: 14 }}>
            <Text style={[styles.docTitle, { color: C.text }]}>
              {newCv ? newCv.name : profil.cv ? t('profileEdit.changeCv') : t('profileEdit.cv')}
            </Text>
            <Text style={[styles.docSub, { color: C.textMuted }]}>{t('profileEdit.cvSelected')}</Text>
          </View>
        </TouchableOpacity>

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: C.primary, opacity: saveMutation.isPending ? 0.65 : 1 }]}
          onPress={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          activeOpacity={0.85}
        >
          {saveMutation.isPending
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.saveBtnText}>{t('profileEdit.save')}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function SectionTitle({ title, C }) {
  return <Text style={[styles.sectionTitle, { color: C.textSub }]}>{title.toUpperCase()}</Text>;
}

function Divider({ C }) {
  return <View style={[styles.divider, { backgroundColor: C.border }]} />;
}

function Field({ label, value, onChange, C, keyboardType, multiline }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={[styles.fieldLabel, { color: C.textSub }]}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, { color: C.text }, multiline && { minHeight: 60, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType || 'default'}
        placeholderTextColor={C.textMuted}
        placeholder="—"
        multiline={!!multiline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1 },
  scroll:  { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40, gap: 8 },

  avatarWrap:        { alignSelf: 'center', position: 'relative', marginBottom: 6 },
  avatarImg:         { width: 72, height: 72, borderRadius: 36 },
  avatarPlaceholder: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  avatarInitials:    { fontFamily: F.bold, fontSize: 24 },
  cameraOverlay: {
    position: 'absolute', bottom: 0, right: 0,
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  avatarHint:   { fontFamily: F.reg, fontSize: 12, textAlign: 'center', marginBottom: 14 },

  sectionTitle: { fontFamily: F.semi, fontSize: 11, letterSpacing: 0.8, marginTop: 10, marginBottom: 4, marginStart: 4 },
  card:         { borderRadius: radius.card, borderWidth: 1, ...shadow.card },
  divider:      { height: 1, marginStart: 16 },

  fieldRow:    { paddingHorizontal: 14, paddingVertical: 11 },
  fieldLabel:  { fontFamily: F.semi, fontSize: 12, marginBottom: 4 },
  fieldValue:  { fontFamily: F.reg, fontSize: 14 },
  fieldInput:  { fontFamily: F.reg, fontSize: 14, padding: 0 },

  dropdown:     { borderTopWidth: 1 },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1 },
  dropdownText: { fontSize: 13 },

  docRow:    { flexDirection: 'row', alignItems: 'center', padding: 14 },
  docTitle:  { fontFamily: F.semi, fontSize: 14 },
  docSub:    { fontFamily: F.reg, fontSize: 12, marginTop: 2 },

  saveBtn:     { borderRadius: 13, paddingVertical: 14, alignItems: 'center', marginTop: 14 },
  saveBtnText: { fontFamily: F.semi, fontSize: 15, color: '#fff' },
});
