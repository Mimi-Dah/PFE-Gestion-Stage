import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Alert, I18nManager,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react-native';
import { F } from '../../theme/fonts';
import { getColors } from '../../theme/colors';
import useLayoutStore from '../../store/layoutStore';
import { LANG_KEY, RTL_LANGS } from '../../i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGES = [
  { code: 'fr', label: 'Français', native: 'Français' },
  { code: 'en', label: 'English',  native: 'English'  },
  { code: 'ar', label: 'العربية',  native: 'العربية'  },
];

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const isDark = useLayoutStore((s) => s.isDarkMode);
  const C = getColors(isDark);
  const [open, setOpen] = useState(false);

  const current = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

  const handleSelect = async (code) => {
    setOpen(false);
    if (code === i18n.language) return;

    const willBeRTL = RTL_LANGS.includes(code);
    const needsRestart = willBeRTL !== I18nManager.isRTL;

    await AsyncStorage.setItem(LANG_KEY, code);
    await i18n.changeLanguage(code);
    I18nManager.allowRTL(willBeRTL);
    I18nManager.forceRTL(willBeRTL);

    // React Native only mirrors row layouts / start-end spacing for the new
    // writing direction after a full reload — switching the i18n language
    // alone does not re-layout already-mounted screens.
    if (needsRestart) {
      Alert.alert(t('lang.restartRequired'), t('lang.restartMsg'), [
        { text: t('lang.restartLater'), style: 'cancel' },
        {
          text: t('lang.restartNow'),
          onPress: () => {
            import('expo-updates')
              .then((Updates) => Updates.reloadAsync())
              .catch(() => {
                Alert.alert(t('lang.restartRequired'), t('lang.restartMsg'));
              });
          },
        },
      ]);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.trigger, { backgroundColor: C.bgMuted }]}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <Globe size={16} color={C.textSub} strokeWidth={1.8} />
        <Text style={[styles.triggerText, { color: C.text }]}>{current.native}</Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={[styles.sheet, { backgroundColor: C.bgCard, borderColor: C.border }]}>
            <Text style={[styles.sheetTitle, { color: C.text }]}>{t('lang.select')}</Text>

            {LANGUAGES.map((lang) => {
              const selected = lang.code === i18n.language;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.langRow,
                    { borderBottomColor: C.border },
                    selected && { backgroundColor: C.primarySoft },
                  ]}
                  onPress={() => handleSelect(lang.code)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.langNative, { color: selected ? C.primary : C.text }]}>
                    {lang.native}
                  </Text>
                  <Text style={[styles.langLabel, { color: C.textSub }]}>{lang.label}</Text>
                  {selected && <Check size={16} color={C.primary} strokeWidth={2.5} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  triggerText: {
    fontFamily: F.med,
    fontSize: 13,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  sheet: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sheetTitle: {
    fontFamily: F.bold,
    fontSize: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  langNative: {
    fontFamily: F.semi,
    fontSize: 15,
    flex: 1,
  },
  langLabel: {
    fontFamily: F.reg,
    fontSize: 13,
  },
});
