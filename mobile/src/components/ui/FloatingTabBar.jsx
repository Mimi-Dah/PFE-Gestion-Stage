import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Home, Briefcase, FileText, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { getColors } from '../../theme/colors';
import useLayoutStore from '../../store/layoutStore';

export const TAB_BAR_HEIGHT = 64;

export function useFloatingTabPadding() {
  const { bottom } = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + (bottom || 0) + 12;
}

const TAB_CONFIG = [
  { name: 'AccueilTab',      Icon: Home,      labelKey: 'tabs.home'          },
  { name: 'StageTab',        Icon: Briefcase, labelKey: 'tabs.myInternships' },
  { name: 'CandidaturesTab', Icon: FileText,  labelKey: 'tabs.applications'  },
  { name: 'ProfilTab',       Icon: User,      labelKey: 'tabs.profile'       },
];

export default function FloatingTabBar({ state, navigation }) {
  const insets   = useSafeAreaInsets();
  const isDark   = useLayoutStore((s) => s.isDarkMode);
  const C        = getColors(isDark);
  const { t }    = useTranslation();

  return (
    <View
      style={[
        s.bar,
        {
          height: TAB_BAR_HEIGHT + (insets.bottom || 0),
          paddingBottom: insets.bottom || 0,
          backgroundColor: isDark ? C.bgCard : '#FFFFFF',
          borderTopColor: C.border,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const cfg = TAB_CONFIG.find((t) => t.name === route.name);
        if (!cfg) return null;

        const onPress = () => {
          const event = navigation.emit({
            type:            'tabPress',
            target:          route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.7}
            style={s.tab}
            accessibilityRole="button"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={t(cfg.labelKey)}
          >
            <cfg.Icon
              size={22}
              color={isFocused ? C.primary : C.textMuted}
              strokeWidth={isFocused ? 2.2 : 1.8}
            />
            <Text style={[s.label, { color: isFocused ? C.primary : C.textMuted }]}>
              {t(cfg.labelKey)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    paddingTop:    10,
    borderTopWidth: 1,
  },
  tab: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'flex-start',
    gap:            4,
  },
  label: {
    fontSize:   10,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
