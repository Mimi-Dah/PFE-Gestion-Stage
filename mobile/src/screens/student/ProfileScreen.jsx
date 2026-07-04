import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Image, Modal, Switch, I18nManager,
} from 'react-native';
import {
  User, Heart, Lock, FileText, Star, LogOut, ChevronRight, ChevronLeft, X, Moon, Pencil, Globe,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFloatingTabPadding } from '../../components/ui/FloatingTabBar';
import { F } from '../../theme/fonts';
import { shadow, radius } from '../../theme/tokens';
import useAuthStore from '../../store/authStore';
import useLayoutStore from '../../store/layoutStore';
import { getColors } from '../../theme/colors';
import AuthService from '../../services/auth';
import api from '../../services/api';
import { logoutUser } from '../../services/authService';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';

export default function ProfileScreen({ navigation }) {
  const { t } = useTranslation();
  const insets     = useSafeAreaInsets();
  const tabPad     = useFloatingTabPadding();
  const isDark     = useLayoutStore((s) => s.isDarkMode);
  const toggleDark = useLayoutStore((s) => s.toggleDarkMode);
  const C          = getColors(isDark);
  const [showTerms, setShowTerms] = useState(false);
  const user       = useAuthStore((s) => s.user);

  const updateUser = useAuthStore((s) => s.updateUser);
  const profil     = user?.profil_etudiant || {};

  useFocusEffect(
    useCallback(() => {
      AuthService.getUserProfile().then((result) => {
        if (result.ok) updateUser(result.value.data);
      });
    }, [])
  );

  const fullName  = [profil.prenom, profil.nom].filter(Boolean).join(' ') || t('profile.defaultUser');
  const initials  = ((profil.prenom?.[0] || '') + (profil.nom?.[0] || '')).toUpperCase() || 'U';
  const roleLabel = t(`profile.roles.${user?.role}`, { defaultValue: user?.role ?? '' });

  const confirmLogout = () =>
    Alert.alert(t('profile.logoutConfirmTitle'), t('profile.logoutConfirmMsg'), [
      { text: t('profile.logoutCancel'), style: 'cancel' },
      { text: t('profile.logoutConfirm'), style: 'destructive', onPress: () => logoutUser() },
    ]);

  const SETTINGS = [
    {
      label: t('profile.items.myInfo'),
      icon: User,
      iconBg: C.primarySoft,
      iconColor: C.primary,
      onPress: () => navigation.navigate('ProfileEdit'),
    },
    {
      label: t('profile.items.changePassword'),
      icon: Lock,
      iconBg: C.primarySoft,
      iconColor: C.primary,
      onPress: () => navigation.navigate('ChangePassword'),
    },
  ];

  const SUPPORT = [
    {
      label: t('profile.items.favorites'),
      icon: Heart,
      iconBg: isDark ? 'rgba(239,68,68,0.15)' : '#FEE2E2',
      iconColor: '#EF4444',
      onPress: () => navigation.navigate('Favoris'),
    },
    {
      label: t('profile.items.evaluations'),
      icon: Star,
      iconBg: isDark ? 'rgba(124,58,237,0.15)' : '#EDE9FE',
      iconColor: isDark ? '#A78BFA' : '#7C3AED',
      onPress: () => navigation.navigate('Evaluations'),
    },
    {
      label: t('profile.items.terms'),
      icon: FileText,
      iconBg: C.bgMuted,
      iconColor: C.textSub,
      onPress: () => setShowTerms(true),
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      <TermsModal visible={showTerms} onClose={() => setShowTerms(false)} C={C} t={t} />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: C.bgCard, borderBottomColor: C.border }]}>
        <Text style={[styles.headerTitle, { color: C.primary }]}>{t('profile.title')}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: tabPad + 20 }]}
      >
        {/* ── Profile section ── */}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            {profil.photo
              ? <Image source={{ uri: profil.photo }} style={styles.avatarImg} />
              : (
                <View style={[styles.avatarCircle, { backgroundColor: C.primarySoft }]}>
                  <Text style={[styles.avatarInitials, { color: C.primary }]}>{initials}</Text>
                </View>
              )}
            <TouchableOpacity
              style={[styles.editOverlay, { backgroundColor: C.primary, borderColor: C.bgCard }]}
              onPress={() => navigation.navigate('ProfileEdit')}
              activeOpacity={0.8}
            >
              <Pencil size={12} color="#fff" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.userName, { color: C.text }]}>{fullName}</Text>
          <Text style={[styles.userEmail, { color: C.textMuted }]}>{user?.courriel}</Text>
          {!!roleLabel && (
            <View style={[styles.roleBadge, { backgroundColor: C.primarySoft }]}>
              <Text style={[styles.roleBadgeText, { color: C.primary }]}>{roleLabel}</Text>
            </View>
          )}
        </View>

        {/* ── Settings section ── */}
        <Text style={[styles.sectionLabel, { color: '#EF4444' }]}>{t('profile.sections.settings')}</Text>
        <View style={[styles.card, { backgroundColor: C.bgCard, borderColor: C.border }]}>
          {SETTINGS.map((item, idx) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.row, { borderBottomWidth: 1, borderBottomColor: C.border }]}
              onPress={item.onPress}
              activeOpacity={0.6}
            >
              <View style={[styles.iconBg, { backgroundColor: item.iconBg }]}>
                <item.icon size={18} color={item.iconColor} strokeWidth={1.8} />
              </View>
              <Text style={[styles.rowLabel, { color: C.text }]}>{item.label}</Text>
              {I18nManager.isRTL
                ? <ChevronLeft size={16} color={C.textMuted} strokeWidth={1.8} />
                : <ChevronRight size={16} color={C.textMuted} strokeWidth={1.8} />}
            </TouchableOpacity>
          ))}

          {/* Dark mode row */}
          <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: C.border }]}>
            <View style={[styles.iconBg, { backgroundColor: C.bgMuted }]}>
              <Moon size={18} color={C.textSub} strokeWidth={1.8} />
            </View>
            <Text style={[styles.rowLabel, { color: C.text }]}>{t('profile.items.darkMode')}</Text>
            <Switch
              value={isDark}
              onValueChange={toggleDark}
              trackColor={{ false: '#E2E8F0', true: C.primary }}
              thumbColor="#fff"
            />
          </View>

          {/* Language row */}
          <View style={styles.row}>
            <View style={[styles.iconBg, { backgroundColor: C.bgMuted }]}>
              <Globe size={18} color={C.textSub} strokeWidth={1.8} />
            </View>
            <Text style={[styles.rowLabel, { color: C.text }]}>{t('profile.items.language')}</Text>
            <LanguageSwitcher />
          </View>
        </View>

        {/* ── Support section ── */}
        <Text style={[styles.sectionLabel, { color: '#EF4444' }]}>{t('profile.sections.support')}</Text>
        <View style={[styles.card, { backgroundColor: C.bgCard, borderColor: C.border }]}>
          {SUPPORT.map((item, idx) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.row,
                idx < SUPPORT.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border },
              ]}
              onPress={item.onPress}
              activeOpacity={0.6}
            >
              <View style={[styles.iconBg, { backgroundColor: item.iconBg }]}>
                <item.icon size={18} color={item.iconColor} strokeWidth={1.8} />
              </View>
              <Text style={[styles.rowLabel, { color: C.text }]}>{item.label}</Text>
              {I18nManager.isRTL
                ? <ChevronLeft size={16} color={C.textMuted} strokeWidth={1.8} />
                : <ChevronRight size={16} color={C.textMuted} strokeWidth={1.8} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Logout button ── */}
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : '#FEE2E2' }]}
          onPress={confirmLogout}
          activeOpacity={0.7}
        >
          <LogOut size={18} color="#EF4444" strokeWidth={1.8} style={styles.logoutIcon} />
          <Text style={styles.logoutText}>{t('profile.logout')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function TermsModal({ visible, onClose, C, t }) {
  const sections = t('profile.terms.sections', { returnObjects: true }) || [];
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[tm.root, { backgroundColor: C.bg }]}>
        <View style={[tm.header, { backgroundColor: C.bgCard, borderBottomColor: C.border }]}>
          <Text style={[tm.title, { color: C.text }]}>{t('profile.terms.title')}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={10} style={[tm.closeBtn, { backgroundColor: C.bgMuted }]}>
            <X size={18} color={C.textSub} strokeWidth={2} />
          </TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tm.scroll}>
          <Text style={[tm.intro, { color: C.textSub }]}>
            {t('profile.terms.intro')}
          </Text>
          {sections.map((section, i) => (
            <View key={i} style={tm.section}>
              <Text style={[tm.sectionTitle, { color: C.text }]}>{section.title}</Text>
              <Text style={[tm.sectionBody, { color: C.textSub }]}>{section.body}</Text>
            </View>
          ))}
          <View style={[tm.footer, { borderTopColor: C.border }]}>
            <Text style={[tm.footerText, { color: C.textMuted }]}>
              {t('profile.terms.footer')}
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const tm = StyleSheet.create({
  root:         { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1 },
  title:        { fontFamily: F.bold, fontSize: 18, flex: 1, letterSpacing: -0.2 },
  closeBtn:     { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  scroll:       { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, gap: 20 },
  intro:        { fontFamily: F.reg, fontSize: 12 },
  section:      { gap: 6 },
  sectionTitle: { fontFamily: F.semi, fontSize: 15 },
  sectionBody:  { fontFamily: F.reg, fontSize: 14, lineHeight: 21 },
  footer:       { borderTopWidth: 1, paddingTop: 20 },
  footerText:   { fontFamily: F.reg, fontSize: 13, lineHeight: 19, textAlign: 'center' },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1,
  },
  headerTitle: { fontFamily: F.bold, fontSize: 20, letterSpacing: -0.3 },
  scroll: { paddingHorizontal: 16, paddingTop: 28 },
  profileSection: { alignItems: 'center', marginBottom: 28 },
  avatarWrapper:  { position: 'relative', marginBottom: 14 },
  avatarImg:      { width: 90, height: 90, borderRadius: 45 },
  avatarCircle:   { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontFamily: F.bold, fontSize: 30 },
  editOverlay: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2,
  },
  userName:      { fontFamily: F.bold, fontSize: 20, letterSpacing: -0.2, marginBottom: 4 },
  userEmail:     { fontFamily: F.reg, fontSize: 13, marginBottom: 12 },
  roleBadge:     { borderRadius: 999, paddingHorizontal: 18, paddingVertical: 6 },
  roleBadgeText: { fontFamily: F.semi, fontSize: 13 },
  sectionLabel:  { fontFamily: F.bold, fontSize: 11, letterSpacing: 0.8, marginStart: 4, marginBottom: 8 },
  card:          { borderRadius: 16, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13 },
  iconBg: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginEnd: 14 },
  rowLabel: { fontFamily: F.med, fontSize: 15, flex: 1, textAlign: I18nManager.isRTL ? 'right' : 'left' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 16, paddingVertical: 16, marginBottom: 8 },
  logoutIcon: { marginEnd: 10 },
  logoutText: { fontFamily: F.semi, fontSize: 15, color: '#EF4444' },
});
