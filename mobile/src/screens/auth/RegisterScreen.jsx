import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, StatusBar,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, ChevronDown } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { F } from '../../theme/fonts';
import AuthService from '../../services/auth';
import PageHeader from '../../components/ui/PageHeader';
import useLayoutStore from '../../store/layoutStore';
import { getColors } from '../../theme/colors';

const NIVEAUX = ['L1', 'L2', 'L3', 'M1', 'M2'];

export default function RegisterScreen({ navigation }) {
  const { t } = useTranslation();
  const insets  = useSafeAreaInsets();
  const isDark  = useLayoutStore((st) => st.isDarkMode);
  const C       = getColors(isDark);
  const s       = makeStyles(C);

  const [step, setStep]   = useState(1);
  const [step1Data, setStep1Data] = useState(null);
  const [showPw, setShowPw]       = useState(false);
  const [apiErr, setApiErr]       = useState('');
  const [showNiveaux, setShowNiveaux] = useState(false);

  const step1Schema = z.object({
    first_name: z.string().min(2, t('auth.register.errors.firstNameRequired')),
    last_name:  z.string().min(2, t('auth.register.errors.lastNameRequired')),
    email:      z.string().email(t('auth.register.errors.emailInvalid')),
    password:   z.string().min(8, t('auth.register.errors.passwordMin')),
  });

  const step2Schema = z.object({
    universite:  z.string().min(2, t('auth.register.errors.universityRequired')),
    departement: z.string().min(2, t('auth.register.errors.departmentRequired')),
    specialite:  z.string().min(2, t('auth.register.errors.specialityRequired')),
    niveau:      z.string().min(1, t('auth.register.errors.levelRequired')),
    matricule:   z.string().min(3, t('auth.register.errors.matriculeRequired')),
  });

  const form1 = useForm({ resolver: zodResolver(step1Schema), defaultValues: { first_name: '', last_name: '', email: '', password: '' } });
  const form2 = useForm({ resolver: zodResolver(step2Schema), defaultValues: { universite: '', departement: '', specialite: '', niveau: '', matricule: '' } });

  const onStep1 = (data) => { setStep1Data(data); setStep(2); };

  const onStep2 = async (data) => {
    setApiErr('');
    const result = await AuthService.register({ ...step1Data, ...data, role: 'Étudiant' });
    if (!result.ok) {
      const details = result.error?.details;
      if (details?.courriel) {
        setStep(1);
        form1.setError('email', { message: t('auth.register.errors.emailTaken') });
        return;
      }
      if (details?.password) {
        setStep(1);
        form1.setError('password', { message: String(details.password[0]) });
        return;
      }
      setApiErr(result.error?.message || t('auth.register.errors.registerFailed'));
      return;
    }
    navigation.navigate('VerifyAccount', { email: step1Data.email });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />
      <PageHeader
        title={step === 1 ? t('auth.register.title') : t('auth.register.titleStep2')}
        onBack={step === 2 ? () => setStep(1) : undefined}
        style={{ paddingBottom: 0 }}
      />
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: 20, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Step indicator */}
        <View style={s.stepIndicator}>
          <View style={[s.stepDot, { backgroundColor: C.primary }]} />
          <View style={[s.stepLine, { backgroundColor: step === 2 ? C.primary : C.border }]} />
          <View style={[s.stepDot, { backgroundColor: step === 2 ? C.primary : C.border }]} />
        </View>
        <Text style={s.stepLabel}>{t('auth.register.stepLabel', { step })}</Text>

        <Text style={s.title}>{step === 1 ? t('auth.register.titleForm1') : t('auth.register.titleForm2')}</Text>
        <Text style={s.subtitle}>
          {step === 1 ? t('auth.register.subtitleForm1') : t('auth.register.subtitleForm2')}
        </Text>

        {apiErr ? (
          <View style={s.errorBanner}><Text style={s.errorBannerText}>{apiErr}</Text></View>
        ) : null}

        {/* STEP 1 */}
        {step === 1 && (
          <View style={s.fields}>
            <View style={s.row}>
              <View style={s.halfField}>
                <FField label={t('auth.register.firstName')} error={form1.formState.errors.first_name?.message} s={s}>
                  <Controller control={form1.control} name="first_name" render={({ field: { onChange, value, onBlur } }) => (
                    <TextInput style={[s.input, form1.formState.errors.first_name && s.inputError]}
                      placeholder={t('auth.register.firstName')} placeholderTextColor={C.textMuted}
                      value={value} onChangeText={onChange} onBlur={onBlur} />
                  )} />
                </FField>
              </View>
              <View style={s.halfField}>
                <FField label={t('auth.register.lastName')} error={form1.formState.errors.last_name?.message} s={s}>
                  <Controller control={form1.control} name="last_name" render={({ field: { onChange, value, onBlur } }) => (
                    <TextInput style={[s.input, form1.formState.errors.last_name && s.inputError]}
                      placeholder={t('auth.register.lastName')} placeholderTextColor={C.textMuted}
                      value={value} onChangeText={onChange} onBlur={onBlur} />
                  )} />
                </FField>
              </View>
            </View>

            <FField label={t('auth.register.email')} error={form1.formState.errors.email?.message} s={s}>
              <Controller control={form1.control} name="email" render={({ field: { onChange, value, onBlur } }) => (
                <TextInput style={[s.input, form1.formState.errors.email && s.inputError]}
                  placeholder="exemple@email.com" placeholderTextColor={C.textMuted}
                  keyboardType="email-address" autoCapitalize="none"
                  value={value} onChangeText={onChange} onBlur={onBlur} />
              )} />
            </FField>

            <FField label={t('auth.register.password')} error={form1.formState.errors.password?.message} s={s}>
              <View style={s.pwWrap}>
                <Controller control={form1.control} name="password" render={({ field: { onChange, value, onBlur } }) => (
                  <TextInput style={[s.input, s.pwInput, form1.formState.errors.password && s.inputError]}
                    placeholder="••••••••" placeholderTextColor={C.textMuted}
                    secureTextEntry={!showPw}
                    value={value} onChangeText={onChange} onBlur={onBlur} />
                )} />
                <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPw((p) => !p)} hitSlop={8}>
                  {showPw ? <EyeOff size={18} color={C.textMuted} strokeWidth={1.8} /> : <Eye size={18} color={C.textMuted} strokeWidth={1.8} />}
                </TouchableOpacity>
              </View>
            </FField>

            <TouchableOpacity style={s.submitBtn} onPress={form1.handleSubmit(onStep1)} activeOpacity={0.85}>
              <Text style={s.submitText}>{t('auth.register.next')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <View style={s.fields}>
            <FField label={t('auth.register.university')} error={form2.formState.errors.universite?.message} s={s}>
              <Controller control={form2.control} name="universite" render={({ field: { onChange, value, onBlur } }) => (
                <TextInput style={[s.input, form2.formState.errors.universite && s.inputError]}
                  placeholder="Ex: Université de Brest" placeholderTextColor={C.textMuted}
                  value={value} onChangeText={onChange} onBlur={onBlur} />
              )} />
            </FField>

            <FField label={t('auth.register.department')} error={form2.formState.errors.departement?.message} s={s}>
              <Controller control={form2.control} name="departement" render={({ field: { onChange, value, onBlur } }) => (
                <TextInput style={[s.input, form2.formState.errors.departement && s.inputError]}
                  placeholder="Ex: Informatique" placeholderTextColor={C.textMuted}
                  value={value} onChangeText={onChange} onBlur={onBlur} />
              )} />
            </FField>

            <FField label={t('auth.register.speciality')} error={form2.formState.errors.specialite?.message} s={s}>
              <Controller control={form2.control} name="specialite" render={({ field: { onChange, value, onBlur } }) => (
                <TextInput style={[s.input, form2.formState.errors.specialite && s.inputError]}
                  placeholder="Ex: Développement Web" placeholderTextColor={C.textMuted}
                  value={value} onChangeText={onChange} onBlur={onBlur} />
              )} />
            </FField>

            <FField label={t('auth.register.level')} error={form2.formState.errors.niveau?.message} s={s}>
              <Controller control={form2.control} name="niveau" render={({ field: { onChange, value } }) => (
                <View>
                  <TouchableOpacity
                    style={[s.input, s.selectInput, form2.formState.errors.niveau && s.inputError]}
                    onPress={() => setShowNiveaux((p) => !p)}
                    activeOpacity={0.75}
                  >
                    <Text style={[s.selectText, !value && { color: C.textMuted }]}>
                      {value || t('auth.register.selectLevel')}
                    </Text>
                    <ChevronDown size={16} color={C.textMuted} />
                  </TouchableOpacity>
                  {showNiveaux && (
                    <View style={s.dropdown}>
                      {NIVEAUX.map((n) => (
                        <TouchableOpacity key={n} style={[s.dropdownItem, { borderBottomColor: C.border }]}
                          onPress={() => { onChange(n); setShowNiveaux(false); }}>
                          <Text style={[s.dropdownText, value === n && { color: C.primary, fontFamily: F.semi }]}>{n}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )} />
            </FField>

            <FField label={t('auth.register.matricule')} error={form2.formState.errors.matricule?.message} s={s}>
              <Controller control={form2.control} name="matricule" render={({ field: { onChange, value, onBlur } }) => (
                <TextInput style={[s.input, form2.formState.errors.matricule && s.inputError]}
                  placeholder="Ex: 20240001" placeholderTextColor={C.textMuted}
                  keyboardType="numeric" value={value} onChangeText={onChange} onBlur={onBlur} />
              )} />
            </FField>

            <TouchableOpacity
              style={[s.submitBtn, form2.formState.isSubmitting && s.submitBtnDisabled]}
              onPress={form2.handleSubmit(onStep2)} disabled={form2.formState.isSubmitting} activeOpacity={0.85}
            >
              {form2.formState.isSubmitting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.submitText}>{t('auth.register.submit')}</Text>}
            </TouchableOpacity>
          </View>
        )}

        <View style={s.loginRow}>
          <Text style={s.loginHint}>{t('auth.register.alreadyAccount')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
            <Text style={s.loginLink}>{t('auth.register.loginLink')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FField({ label, error, children, s }) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      {children}
      {error ? <Text style={s.fieldError}>{error}</Text> : null}
    </View>
  );
}

const makeStyles = (C) => StyleSheet.create({
  scroll:        { paddingHorizontal: 24, flexGrow: 1 },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  stepDot:       { width: 10, height: 10, borderRadius: 5 },
  stepLine:      { flex: 1, height: 2, marginHorizontal: 6 },
  stepLabel:     { fontFamily: F.med, fontSize: 12, color: C.textMuted, marginBottom: 20 },
  title:         { fontFamily: F.bold, fontSize: 22, color: C.text, letterSpacing: -0.3, marginBottom: 5 },
  subtitle:      { fontFamily: F.reg, fontSize: 13, color: C.textSub, lineHeight: 19, marginBottom: 20 },
  errorBanner:   { backgroundColor: C.errorSurface, borderRadius: 10, padding: 12, marginBottom: 14 },
  errorBannerText: { fontFamily: F.med, fontSize: 13, color: C.danger },
  fields:        { gap: 12 },
  row:           { flexDirection: 'row', gap: 12 },
  halfField:     { flex: 1 },
  fieldWrap:     { gap: 6 },
  fieldLabel:    { fontFamily: F.semi, fontSize: 13, color: C.text, letterSpacing: 0.1 },
  input:         { backgroundColor: C.bgMuted, borderWidth: 0, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontFamily: F.reg, fontSize: 14, color: C.text },
  inputError:    { borderWidth: 1.5, borderColor: C.danger },
  fieldError:    { fontFamily: F.reg, fontSize: 12, color: C.danger },
  pwWrap:        { position: 'relative' },
  pwInput:       { paddingEnd: 48 },
  eyeBtn:        { position: 'absolute', end: 16, top: 0, bottom: 0, justifyContent: 'center' },
  selectInput:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectText:    { fontFamily: F.reg, fontSize: 15, color: C.text },
  dropdown:      { borderWidth: 1, borderColor: C.border, borderRadius: 14, marginTop: 4, overflow: 'hidden', backgroundColor: C.bgCard },
  dropdownItem:  { paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1 },
  dropdownText:  { fontFamily: F.reg, fontSize: 15, color: C.text },
  submitBtn:     { backgroundColor: C.primary, borderRadius: 13, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  submitBtnDisabled: { opacity: 0.65 },
  submitText:    { fontFamily: F.semi, fontSize: 15, color: '#fff' },
  loginRow:      { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  loginHint:     { fontFamily: F.reg, fontSize: 14, color: C.textSub },
  loginLink:     { fontFamily: F.semi, fontSize: 14, color: C.primary },
});
