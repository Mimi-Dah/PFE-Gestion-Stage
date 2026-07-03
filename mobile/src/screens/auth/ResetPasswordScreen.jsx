import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { F } from '../../theme/fonts';
import PageHeader from '../../components/ui/PageHeader';
import useLayoutStore from '../../store/layoutStore';
import { getColors } from '../../theme/colors';
import api from '../../services/api';

export default function ResetPasswordScreen({ navigation, route }) {
  const { t } = useTranslation();
  const insets  = useSafeAreaInsets();
  const isDark  = useLayoutStore((st) => st.isDarkMode);
  const C       = getColors(isDark);
  const s       = makeStyles(C);
  const token   = route?.params?.token || '';
  const uid     = route?.params?.uid   || '';
  const [showPw,   setShowPw]   = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [done,     setDone]     = useState(false);
  const [apiErr,   setApiErr]   = useState('');

  const schema = z.object({
    password:        z.string().min(8, t('auth.register.errors.passwordMin')),
    passwordConfirm: z.string(),
  }).refine((d) => d.password === d.passwordConfirm, {
    message: t('changePassword.errors.mismatch'),
    path: ['passwordConfirm'],
  });

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { password: '', passwordConfirm: '' },
  });

  const onSubmit = async ({ password }) => {
    setApiErr('');
    const result = await api.safeRequest(api.post('auth/reset-password/', { password, token, uid }));
    if (result.ok) {
      setDone(true);
    } else {
      setApiErr(result.error?.message || t('common.error'));
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />
      <PageHeader title={t('auth.resetPassword.pageTitle')} onBack={() => navigation.goBack()} />
      <View style={[s.root, { paddingBottom: insets.bottom + 32 }]}>
        <Text style={s.title}>{t('auth.resetPassword.title')}</Text>
        <Text style={s.subtitle}>{t('auth.resetPassword.subtitle')}</Text>

        {done ? (
          <>
            <View style={s.successBanner}>
              <Text style={s.successText}>{t('auth.resetPassword.successMsg')}</Text>
            </View>
            <TouchableOpacity style={s.submitBtn} onPress={() => navigation.navigate('Login')} activeOpacity={0.85}>
              <Text style={s.submitText}>{t('auth.login.submit')}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {apiErr ? <View style={s.errorBanner}><Text style={s.errorBannerText}>{apiErr}</Text></View> : null}

            <View style={s.fields}>
              <View style={s.fieldWrap}>
                <Text style={s.fieldLabel}>{t('auth.resetPassword.newPassword')}</Text>
                <View style={s.pwWrap}>
                  <Controller control={control} name="password" render={({ field: { onChange, value, onBlur } }) => (
                    <TextInput
                      style={[s.input, s.pwInput, errors.password && s.inputError]}
                      placeholder="••••••••" placeholderTextColor={C.textMuted}
                      secureTextEntry={!showPw} value={value} onChangeText={onChange} onBlur={onBlur}
                    />
                  )} />
                  <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPw((p) => !p)} hitSlop={8}>
                    {showPw ? <EyeOff size={18} color={C.textMuted} strokeWidth={1.8} /> : <Eye size={18} color={C.textMuted} strokeWidth={1.8} />}
                  </TouchableOpacity>
                </View>
                {errors.password ? <Text style={s.fieldError}>{errors.password.message}</Text> : null}
              </View>

              <View style={s.fieldWrap}>
                <Text style={s.fieldLabel}>{t('auth.resetPassword.confirmPassword')}</Text>
                <View style={s.pwWrap}>
                  <Controller control={control} name="passwordConfirm" render={({ field: { onChange, value, onBlur } }) => (
                    <TextInput
                      style={[s.input, s.pwInput, errors.passwordConfirm && s.inputError]}
                      placeholder="••••••••" placeholderTextColor={C.textMuted}
                      secureTextEntry={!showConf} value={value} onChangeText={onChange} onBlur={onBlur}
                    />
                  )} />
                  <TouchableOpacity style={s.eyeBtn} onPress={() => setShowConf((p) => !p)} hitSlop={8}>
                    {showConf ? <EyeOff size={18} color={C.textMuted} strokeWidth={1.8} /> : <Eye size={18} color={C.textMuted} strokeWidth={1.8} />}
                  </TouchableOpacity>
                </View>
                {errors.passwordConfirm ? <Text style={s.fieldError}>{errors.passwordConfirm.message}</Text> : null}
              </View>
            </View>

            <TouchableOpacity
              style={[s.submitBtn, isSubmitting && s.submitBtnDisabled]}
              onPress={handleSubmit(onSubmit)} disabled={isSubmitting} activeOpacity={0.85}
            >
              {isSubmitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.submitText}>{t('auth.resetPassword.submit')}</Text>}
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  root:          { flex: 1, paddingHorizontal: 24 },
  title:         { fontFamily: F.bold, fontSize: 22, color: C.text, letterSpacing: -0.3, marginBottom: 8 },
  subtitle:      { fontFamily: F.reg, fontSize: 13, color: C.textSub, lineHeight: 19, marginBottom: 22 },
  successBanner: { backgroundColor: C.successSoft, borderRadius: 12, padding: 14, marginBottom: 20 },
  successText:   { fontFamily: F.med, fontSize: 14, color: C.success },
  errorBanner:   { backgroundColor: C.errorSurface, borderRadius: 10, padding: 12, marginBottom: 14 },
  errorBannerText: { fontFamily: F.med, fontSize: 13, color: C.danger },
  fields:        { gap: 14, marginBottom: 20 },
  fieldWrap:     { gap: 6 },
  fieldLabel:    { fontFamily: F.semi, fontSize: 13, color: C.text },
  input:         { backgroundColor: C.bgMuted, borderWidth: 0, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontFamily: F.reg, fontSize: 14, color: C.text },
  inputError:    { borderWidth: 1.5, borderColor: C.danger },
  fieldError:    { fontFamily: F.reg, fontSize: 12, color: C.danger },
  pwWrap:        { position: 'relative' },
  pwInput:       { paddingEnd: 48 },
  eyeBtn:        { position: 'absolute', end: 16, top: 0, bottom: 0, justifyContent: 'center' },
  submitBtn:     { backgroundColor: C.primary, borderRadius: 13, paddingVertical: 14, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.65 },
  submitText:    { fontFamily: F.semi, fontSize: 15, color: '#fff' },
});
