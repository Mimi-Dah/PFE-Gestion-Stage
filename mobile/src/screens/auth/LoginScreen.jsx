import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, StatusBar,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { F } from '../../theme/fonts';
import AuthService from '../../services/auth';
import useAuthStore from '../../store/authStore';
import useLayoutStore from '../../store/layoutStore';
import { getColors } from '../../theme/colors';

export default function LoginScreen({ navigation }) {
  const { t } = useTranslation();
  const insets   = useSafeAreaInsets();
  const isDark   = useLayoutStore((s) => s.isDarkMode);
  const C        = getColors(isDark);
  const s        = makeStyles(C);
  const setAuth  = useAuthStore((st) => st.setAuth);
  const [showPw, setShowPw] = useState(false);
  const [apiErr, setApiErr] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const schema = z.object({
    email:    z.string().email(t('auth.login.emailInvalid')),
    password: z.string().min(1, t('auth.login.passwordRequired')),
  });

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async ({ email, password }) => {
    setApiErr('');
    const loginResult = await AuthService.login({ email, password });
    if (!loginResult.ok) {
      setApiErr(loginResult.error?.message || t('auth.login.errorDefault'));
      return;
    }
    const { access, refresh } = loginResult.value.data;
    useAuthStore.getState().setToken(access);
    const profileResult = await AuthService.getUserProfile();
    const user = profileResult.ok ? profileResult.value.data : null;
    setAuth(user, access, refresh, rememberMe);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={C.bg}
      />
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.title}>{t('auth.login.title')}</Text>
        <Text style={s.subtitle}>{t('auth.login.subtitle')}</Text>

        {apiErr ? (
          <View style={s.errorBanner}>
            <Text style={s.errorBannerText}>{apiErr}</Text>
          </View>
        ) : null}

        <View style={s.fields}>
          <Field label={t('auth.login.email')} error={errors.email?.message} s={s}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value, onBlur } }) => (
                <TextInput
                  style={[s.input, errors.email && s.inputError]}
                  placeholder={t('auth.login.emailPlaceholder')}
                  placeholderTextColor={C.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
          </Field>

          <Field label={t('auth.login.password')} error={errors.password?.message} s={s}>
            <View style={s.pwWrap}>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value, onBlur } }) => (
                  <TextInput
                    style={[s.input, s.pwInput, errors.password && s.inputError]}
                    placeholder={t('auth.login.passwordPlaceholder')}
                    placeholderTextColor={C.textMuted}
                    secureTextEntry={!showPw}
                    autoComplete="password"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPw((p) => !p)} hitSlop={8}>
                {showPw
                  ? <EyeOff size={18} color={C.textMuted} strokeWidth={1.8} />
                  : <Eye    size={18} color={C.textMuted} strokeWidth={1.8} />}
              </TouchableOpacity>
            </View>
          </Field>
        </View>

        <TouchableOpacity
          style={s.rememberRow}
          onPress={() => setRememberMe((v) => !v)}
          activeOpacity={0.7}
          hitSlop={6}
        >
          <View style={[s.checkbox, rememberMe && s.checkboxChecked]}>
            {rememberMe && <Check size={13} color="#fff" strokeWidth={3} />}
          </View>
          <Text style={s.rememberText}>{t('auth.login.rememberMe')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.submitBtn, isSubmitting && s.submitBtnDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={s.submitText}>{t('auth.login.submit')}</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('ForgotPassword')}
          activeOpacity={0.7}
          style={s.forgotBtn}
        >
          <Text style={s.forgotText}>{t('auth.login.forgotPassword')}</Text>
        </TouchableOpacity>

        <View style={s.registerRow}>
          <Text style={s.registerHint}>{t('auth.login.noAccount')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.7}>
            <Text style={s.registerLink}>{t('auth.login.register')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, error, children, s }) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      {children}
      {error ? <Text style={s.fieldError}>{error}</Text> : null}
    </View>
  );
}

const makeStyles = (C) => StyleSheet.create({
  scroll:      { paddingHorizontal: 24, flexGrow: 1 },
  title:       { fontFamily: F.bold, fontSize: 24, color: C.text, letterSpacing: -0.3, lineHeight: 29, marginTop: 12, marginBottom: 6 },
  subtitle:    { fontFamily: F.med, fontSize: 13, color: C.primary, marginBottom: 22 },
  errorBanner:     { backgroundColor: C.errorSurface, borderRadius: 10, padding: 12, marginBottom: 16 },
  errorBannerText: { fontFamily: F.med, fontSize: 13, color: C.danger },
  fields:      { gap: 14, marginBottom: 4 },
  fieldWrap:   { gap: 6 },
  fieldLabel:  { fontFamily: F.semi, fontSize: 13, color: C.text, letterSpacing: 0.1 },
  input: {
    backgroundColor: C.bgMuted,
    borderWidth: 0, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 13,
    fontFamily: F.reg, fontSize: 14, color: C.text,
  },
  inputError: { borderWidth: 1.5, borderColor: C.danger },
  fieldError:  { fontFamily: F.reg, fontSize: 12, color: C.danger },
  pwWrap:   { position: 'relative' },
  pwInput:  { paddingRight: 48 },
  eyeBtn:   { position: 'absolute', right: 16, top: 0, bottom: 0, justifyContent: 'center' },
  rememberRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, marginBottom: 24 },
  checkbox: {
    width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center', backgroundColor: C.bgCard,
  },
  checkboxChecked: { backgroundColor: C.primary, borderColor: C.primary },
  rememberText: { fontFamily: F.med, fontSize: 13, color: C.textSub },
  submitBtn:         { backgroundColor: C.primary, borderRadius: 13, paddingVertical: 14, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.65 },
  submitText:        { fontFamily: F.semi, fontSize: 15, color: '#fff' },
  forgotBtn:    { alignItems: 'center', marginTop: 16, marginBottom: 24 },
  forgotText:   { fontFamily: F.med, fontSize: 13, color: C.textSub },
  registerRow:  { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  registerHint: { fontFamily: F.reg, fontSize: 14, color: C.textSub },
  registerLink: { fontFamily: F.semi, fontSize: 14, color: C.primary },
});
