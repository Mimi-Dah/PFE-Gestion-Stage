import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { F } from '../../theme/fonts';
import PageHeader from '../../components/ui/PageHeader';
import useLayoutStore from '../../store/layoutStore';
import { getColors } from '../../theme/colors';

export default function ForgotPasswordScreen({ navigation }) {
  const { t } = useTranslation();
  const insets  = useSafeAreaInsets();
  const isDark  = useLayoutStore((st) => st.isDarkMode);
  const C       = getColors(isDark);
  const s       = makeStyles(C);
  const [sent, setSent]     = useState(false);
  const [apiErr, setApiErr] = useState('');

  const schema = z.object({ email: z.string().email(t('auth.forgotPassword.emailInvalid')) });

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async ({ email }) => {
    setApiErr('');
    try {
      await fetch(`/api/v1/auth/forgot-password/`, { method: 'POST', body: JSON.stringify({ email }), headers: { 'Content-Type': 'application/json' } });
      setSent(true);
    } catch {
      setApiErr(t('auth.forgotPassword.errorSend'));
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />
      <PageHeader title={t('auth.forgotPassword.pageTitle')} onBack={() => navigation.goBack()} />
      <View style={[s.root, { paddingBottom: insets.bottom + 32 }]}>
        <View style={s.iconArea}>
          <View style={s.iconCircle}>
            <Mail size={32} color={C.primary} strokeWidth={1.5} />
          </View>
        </View>

        <Text style={s.title}>{t('auth.forgotPassword.title')}</Text>
        <Text style={s.subtitle}>{t('auth.forgotPassword.subtitle')}</Text>

        {sent ? (
          <View style={s.successBanner}>
            <Text style={s.successText}>{t('auth.forgotPassword.successMsg')}</Text>
          </View>
        ) : (
          <>
            {apiErr ? <View style={s.errorBanner}><Text style={s.errorBannerText}>{apiErr}</Text></View> : null}

            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>{t('auth.forgotPassword.email')}</Text>
              <Controller control={control} name="email" render={({ field: { onChange, value, onBlur } }) => (
                <TextInput
                  style={[s.input, errors.email && s.inputError]}
                  placeholder={t('auth.forgotPassword.emailPlaceholder')}
                  placeholderTextColor={C.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={value} onChangeText={onChange} onBlur={onBlur}
                />
              )} />
              {errors.email ? <Text style={s.fieldError}>{errors.email.message}</Text> : null}
            </View>

            <TouchableOpacity
              style={[s.submitBtn, isSubmitting && s.submitBtnDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.submitText}>{t('auth.forgotPassword.submit')}</Text>}
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7} style={s.backBtn}>
          <Text style={s.backText}>{t('auth.forgotPassword.backToLogin')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  root:          { flex: 1, paddingHorizontal: 24 },
  iconArea:      { alignItems: 'center', marginBottom: 22 },
  iconCircle:    { width: 72, height: 72, borderRadius: 20, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' },
  title:         { fontFamily: F.bold, fontSize: 22, color: C.text, letterSpacing: -0.3, marginBottom: 8 },
  subtitle:      { fontFamily: F.reg, fontSize: 13, color: C.textSub, lineHeight: 19, marginBottom: 22 },
  successBanner: { backgroundColor: C.successSoft, borderRadius: 12, padding: 14, marginBottom: 20 },
  successText:   { fontFamily: F.med, fontSize: 14, color: C.success, lineHeight: 20 },
  errorBanner:   { backgroundColor: C.errorSurface, borderRadius: 10, padding: 12, marginBottom: 14 },
  errorBannerText: { fontFamily: F.med, fontSize: 13, color: C.danger },
  fieldWrap:     { gap: 6, marginBottom: 18 },
  fieldLabel:    { fontFamily: F.semi, fontSize: 13, color: C.text },
  input:         { backgroundColor: C.bgMuted, borderWidth: 0, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontFamily: F.reg, fontSize: 14, color: C.text },
  inputError:    { borderWidth: 1.5, borderColor: C.danger },
  fieldError:    { fontFamily: F.reg, fontSize: 12, color: C.danger },
  submitBtn:     { backgroundColor: C.primary, borderRadius: 13, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  submitBtnDisabled: { opacity: 0.65 },
  submitText:    { fontFamily: F.semi, fontSize: 15, color: '#fff' },
  backBtn:       { alignItems: 'center' },
  backText:      { fontFamily: F.med, fontSize: 14, color: C.textSub },
});
