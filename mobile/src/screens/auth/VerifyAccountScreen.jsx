import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';
import { MailCheck, GraduationCap, ArrowLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { F } from '../../theme/fonts';
import useLayoutStore from '../../store/layoutStore';
import { getColors } from '../../theme/colors';

export default function VerifyAccountScreen({ navigation, route }) {
  const { t } = useTranslation();
  const insets   = useSafeAreaInsets();
  const isDark   = useLayoutStore((st) => st.isDarkMode);
  const C        = getColors(isDark);
  const s        = makeStyles(C);
  const email    = route?.params?.email || '';
  const [resent,  setResent]  = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setResent(true);
    setLoading(false);
  };

  return (
    <View style={[s.root, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />

      {/* Header */}
      <View style={s.topRow}>
        <TouchableOpacity onPress={() => navigation.navigate('Login')} hitSlop={8}>
          <ArrowLeft size={22} color={C.text} strokeWidth={2} />
        </TouchableOpacity>
        <View style={s.logoRow}>
          <View style={s.logoBubble}>
            <GraduationCap size={16} color={C.primary} strokeWidth={2.5} />
          </View>
          <Text style={s.brandName}>{t('brand.name')}</Text>
        </View>
        <View style={{ width: 22 }} />
      </View>

      {/* Illustration */}
      <View style={s.iconArea}>
        <View style={s.iconCircle}>
          <MailCheck size={44} color={C.primary} strokeWidth={1.5} />
        </View>
      </View>

      <Text style={s.title}>{t('auth.verifyAccount.title')}</Text>
      <Text style={s.body}>
        {t('auth.verifyAccount.subtitle', { email })
          .split(email)
          .map((part, i, arr) =>
            i < arr.length - 1
              ? [part, <Text key={i} style={s.emailHighlight}>{email}</Text>]
              : part
          )}
      </Text>

      {resent && (
        <View style={s.successBanner}>
          <Text style={s.successText}>{t('common.success')} ✓</Text>
        </View>
      )}

      <TouchableOpacity
        style={[s.resendBtn, loading && { opacity: 0.65 }]}
        onPress={handleResend}
        disabled={loading || resent}
        activeOpacity={0.8}
      >
        {loading
          ? <ActivityIndicator color={C.primary} size="small" />
          : <Text style={s.resendText}>{resent ? `${t('common.success')} ✓` : t('auth.verifyAccount.title')}</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
        <Text style={s.backLink}>{t('auth.forgotPassword.backToLogin')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (C) => StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.bg, paddingHorizontal: 28 },
  topRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48 },
  logoRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoBubble:    { width: 28, height: 28, borderRadius: 8, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' },
  brandName:     { fontFamily: F.bold, fontSize: 16, color: C.text },
  iconArea:      { alignItems: 'center', marginBottom: 32 },
  iconCircle:    { width: 96, height: 96, borderRadius: 28, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' },
  title:         { fontFamily: F.bold, fontSize: 26, color: C.text, letterSpacing: -0.3, marginBottom: 12, textAlign: 'center' },
  body:          { fontFamily: F.reg, fontSize: 15, color: C.textSub, lineHeight: 23, textAlign: 'center', marginBottom: 32 },
  emailHighlight: { fontFamily: F.semi, color: C.text },
  hint:          { fontFamily: F.reg, fontSize: 13, color: C.textMuted, lineHeight: 20, textAlign: 'center', marginBottom: 32 },
  successBanner: { backgroundColor: C.successSoft, borderRadius: 10, padding: 12, marginBottom: 20, alignItems: 'center' },
  successText:   { fontFamily: F.med, fontSize: 14, color: C.success },
  resendBtn:     { backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  resendText:    { fontFamily: F.semi, fontSize: 14, color: C.primary },
  backLink:      { fontFamily: F.med, fontSize: 14, color: C.textSub, textAlign: 'center' },
});
