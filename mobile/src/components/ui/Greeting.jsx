import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import useAuthStore from '../../store/authStore';
import useLayoutStore from '../../store/layoutStore';
import { getColors } from '../../theme/colors';
import { F } from '../../theme/fonts';

export default function Greeting({ subtitle, style }) {
  const isDark = useLayoutStore((s) => s.isDarkMode);
  const C      = getColors(isDark);
  const user   = useAuthStore((s) => s.user);
  const prenom = user?.profil_etudiant?.prenom || user?.first_name || '';

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.hey, { color: C.text }]}>HEY,</Text>
      <Text style={[styles.name, { color: C.text }]}>
        {prenom ? prenom.toUpperCase() : 'ÉTUDIANT'}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: C.textSub }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 0 },
  hey: {
    fontFamily:    F.serifBlack,
    fontSize:      36,
    lineHeight:    46,
    letterSpacing: -0.3,
  },
  name: {
    fontFamily:    F.serifBlack,
    fontSize:      36,
    lineHeight:    46,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: F.bodyReg,
    fontSize:   14,
    marginTop:  10,
    lineHeight: 21,
  },
});
