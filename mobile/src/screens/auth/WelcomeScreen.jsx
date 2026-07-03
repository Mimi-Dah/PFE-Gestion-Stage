import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GraduationCap, ArrowRight, ArrowLeft, Search, FileCheck, BellRing } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { F } from '../../theme/fonts';
import useLayoutStore from '../../store/layoutStore';
import { getColors } from '../../theme/colors';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';

export default function WelcomeScreen({ navigation }) {
  const { t } = useTranslation();
  const isDark = useLayoutStore((s) => s.isDarkMode);
  const C = getColors(isDark);
  const s = makeStyles(C);

  const FEATURES = [
    { icon: Search,    text: t('welcome.features.offers') },
    { icon: FileCheck, text: t('welcome.features.track')  },
    { icon: BellRing,  text: t('welcome.features.alerts') },
  ];

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={C.bgCard}
      />

      {/* Brand + language switcher */}
      <View style={s.brandRow}>
        <View style={s.logoBox}>
          <GraduationCap size={20} color={C.primary} strokeWidth={2.2} />
        </View>
        <Text style={s.brandName}>{t('brand.name')}</Text>
        <View style={{ flex: 1 }} />
        <LanguageSwitcher />
      </View>

      {/* Center illustration */}
      <View style={s.illustrationArea}>
        <View style={s.bigCircle}>
          <GraduationCap size={64} color={C.primary} strokeWidth={1.2} />
        </View>
        <View style={[s.dot, s.dotA]} />
        <View style={[s.dot, s.dotB]} />
        <View style={[s.dot, s.dotC]} />
      </View>

      {/* Headline */}
      <View style={s.headlineBlock}>
        <Text style={s.title}>{t('welcome.title')}</Text>
        <Text style={s.subtitle}>{t('welcome.subtitle')}</Text>
      </View>

      {/* Features */}
      <View style={s.featureList}>
        {FEATURES.map(({ icon: Icon, text }) => (
          <View key={text} style={s.featureRow}>
            <View style={s.featureIcon}>
              <Icon size={16} color={C.primary} strokeWidth={2} />
            </View>
            <Text style={s.featureText}>{text}</Text>
          </View>
        ))}
      </View>

      {/* Buttons */}
      <View style={s.buttons}>
        <TouchableOpacity
          style={s.btnPrimary}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.85}
        >
          <Text style={s.btnPrimaryText}>{t('welcome.login')}</Text>
          {I18nManager.isRTL
            ? <ArrowLeft size={18} color="#fff" strokeWidth={2} />
            : <ArrowRight size={18} color="#fff" strokeWidth={2} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={s.btnGhost}
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.7}
        >
          <Text style={s.btnGhostText}>{t('welcome.register')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bgCard,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 12,
  },

  brandRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBox: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: C.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  brandName: { fontFamily: F.bold, fontSize: 22, color: C.text, letterSpacing: -0.4 },

  illustrationArea: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  bigCircle: {
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: C.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: C.primary,
    opacity: 0.18,
  },
  dotA: { width: 14, height: 14, top: 20,  right: 50 },
  dotB: { width: 9,  height: 9,  bottom: 30, left: 48 },
  dotC: { width: 6,  height: 6,  top: 50,  left: 30 },

  headlineBlock: { gap: 10 },
  title: {
    fontFamily: F.bold,
    fontSize: 34,
    lineHeight: 42,
    color: C.text,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontFamily: F.reg,
    fontSize: 15,
    color: C.textSub,
    lineHeight: 23,
  },

  featureList: { gap: 14 },
  featureRow:  { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.primarySoft,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  featureText: { fontFamily: F.reg, fontSize: 14, color: C.textSub, flex: 1, lineHeight: 20 },

  buttons: { gap: 10 },
  btnPrimary: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnPrimaryText: { fontFamily: F.semi, fontSize: 16, color: '#fff' },

  btnGhost: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnGhostText: { fontFamily: F.semi, fontSize: 15, color: C.textSub },
});
