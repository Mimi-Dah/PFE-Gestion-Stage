import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Eye, EyeOff, Lock } from 'lucide-react-native';
import { F } from '../../theme/fonts';
import { shadow, radius } from '../../theme/tokens';
import useLayoutStore from '../../store/layoutStore';
import { getColors } from '../../theme/colors';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../components/ui/PageHeader';

export default function ChangePasswordScreen({ navigation }) {
  const { t }   = useTranslation();
  const isDark  = useLayoutStore((s) => s.isDarkMode);
  const C       = getColors(isDark);

  const [ancien,    setAncien]    = useState('');
  const [nouveau,   setNouveau]   = useState('');
  const [confirmer, setConfirmer] = useState('');
  const [showA, setShowA] = useState(false);
  const [showN, setShowN] = useState(false);
  const [showC, setShowC] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiErr,  setApiErr]  = useState('');

  const handleSubmit = async () => {
    setApiErr('');
    if (!ancien || !nouveau || !confirmer) {
      setApiErr(t('changePassword.errors.allRequired')); return;
    }
    if (nouveau.length < 8) {
      setApiErr(t('changePassword.errors.minLength')); return;
    }
    if (nouveau !== confirmer) {
      setApiErr(t('changePassword.errors.mismatch')); return;
    }

    setLoading(true);
    try {
      await api.post('auth/change-password/', {
        ancien_password:  ancien,
        nouveau_password: nouveau,
      });
      Alert.alert(t('changePassword.successTitle'), t('changePassword.successMsg'), [
        { text: t('common.ok'), onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      setApiErr(e.message || t('changePassword.errors.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <PageHeader title={t('changePassword.pageTitle')} onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View style={[styles.iconWrap, { backgroundColor: C.primarySoft }]}>
          <Lock size={22} color={C.primary} strokeWidth={1.8} />
        </View>
        <Text style={[styles.subtitle, { color: C.textSub }]}>{t('changePassword.subtitle')}</Text>

        {/* Error banner */}
        {apiErr ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{apiErr}</Text>
          </View>
        ) : null}

        {/* Fields */}
        <View style={[styles.card, { backgroundColor: C.bgCard, borderColor: C.border }]}>
          <PwField
            label={t('changePassword.currentPassword')}
            value={ancien}
            onChange={setAncien}
            show={showA}
            onToggle={() => setShowA((v) => !v)}
            C={C}
          />
          <View style={[styles.divider, { backgroundColor: C.border }]} />
          <PwField
            label={t('changePassword.newPassword')}
            value={nouveau}
            onChange={setNouveau}
            show={showN}
            onToggle={() => setShowN((v) => !v)}
            C={C}
          />
          <View style={[styles.divider, { backgroundColor: C.border }]} />
          <PwField
            label={t('changePassword.confirmPassword')}
            value={confirmer}
            onChange={setConfirmer}
            show={showC}
            onToggle={() => setShowC((v) => !v)}
            C={C}
            isLast
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: C.primary, opacity: loading ? 0.65 : 1 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.submitText}>{t('changePassword.submit')}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PwField({ label, value, onChange, show, onToggle, C }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: C.textSub }]}>{label}</Text>
      <View style={styles.pwRow}>
        <TextInput
          style={[styles.fieldInput, { color: C.text, flex: 1 }]}
          value={value}
          onChangeText={onChange}
          secureTextEntry={!show}
          placeholder="••••••••"
          placeholderTextColor={C.textMuted}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={onToggle} hitSlop={8}>
          {show
            ? <EyeOff size={18} color={C.textMuted} strokeWidth={1.8} />
            : <Eye    size={18} color={C.textMuted} strokeWidth={1.8} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll:       { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 40 },
  iconWrap:     { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 10 },
  subtitle:     { fontFamily: F.reg, fontSize: 13, textAlign: 'center', lineHeight: 19, marginBottom: 20 },
  errorBanner:  { backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12, marginBottom: 14 },
  errorText:    { fontFamily: F.med, fontSize: 13, color: '#EF4444' },
  card:         { borderRadius: radius.card, borderWidth: 1, marginBottom: 20, ...shadow.card },
  divider:      { height: 1 },
  fieldWrap:    { paddingHorizontal: 14, paddingVertical: 12 },
  fieldLabel:   { fontFamily: F.semi, fontSize: 12, marginBottom: 5 },
  pwRow:        { flexDirection: 'row', alignItems: 'center' },
  fieldInput:   { fontFamily: F.reg, fontSize: 14, padding: 0 },
  submitBtn:    { borderRadius: 13, paddingVertical: 14, alignItems: 'center' },
  submitText:   { fontFamily: F.semi, fontSize: 15, color: '#fff' },
});
