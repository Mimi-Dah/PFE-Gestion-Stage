import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  Animated, Dimensions, Pressable,
} from 'react-native';
import { HelpCircle, FileText, LogOut, X, GraduationCap } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getColors } from '../../theme/colors';
import { F } from '../../theme/fonts';
import useLayoutStore from '../../store/layoutStore';
import useAuthStore from '../../store/authStore';

const W = Dimensions.get('window').width;
const DRAWER_W = Math.min(W * 0.78, 300);

export default function DrawerMenu({ visible, onClose, navigation }) {
  const insets = useSafeAreaInsets();
  const isDark  = useLayoutStore((s) => s.isDarkMode);
  const C       = getColors(isDark);
  const logout  = useAuthStore((s) => s.logout);
  const user    = useAuthStore((s) => s.user);

  const slideX = useRef(new Animated.Value(-DRAWER_W)).current;
  const fadeOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideX, { toValue: 0, useNativeDriver: true, tension: 60, friction: 10 }),
        Animated.timing(fadeOp, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideX, { toValue: -DRAWER_W, duration: 220, useNativeDriver: true }),
        Animated.timing(fadeOp, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const items = [
    { icon: HelpCircle, label: 'Aide', onPress: () => {} },
    { icon: FileText,   label: 'Conditions d\'utilisation', onPress: () => {} },
  ];

  const handleLogout = () => {
    onClose();
    logout();
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        {/* Overlay */}
        <Animated.View style={[styles.overlay, { opacity: fadeOp }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* Drawer panel */}
        <Animated.View style={[
          styles.drawer,
          {
            width:           DRAWER_W,
            backgroundColor: C.bgCard,
            paddingTop:      insets.top + 16,
            transform:       [{ translateX: slideX }],
          },
        ]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.logoRow]}>
              <View style={[styles.logoBubble, { backgroundColor: C.primarySoft }]}>
                <GraduationCap size={20} color={C.primary} strokeWidth={2} />
              </View>
              <Text style={[styles.brandName, { color: C.text }]}>internHub</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <X size={22} color={C.textMuted} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* User info */}
          {user && (
            <View style={[styles.userBlock, { borderBottomColor: C.border }]}>
              <View style={[styles.avatar, { backgroundColor: C.primarySoft }]}>
                <Text style={[styles.avatarText, { color: C.primary }]}>
                  {(user.first_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.userName, { color: C.text }]} numberOfLines={1}>
                  {user.first_name} {user.last_name}
                </Text>
                <Text style={[styles.userEmail, { color: C.textSub }]} numberOfLines={1}>
                  {user.email}
                </Text>
              </View>
            </View>
          )}

          {/* Menu items */}
          <View style={styles.menuList}>
            {items.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.menuItem, { borderBottomColor: C.border }]}
                onPress={() => { onClose(); item.onPress(); }}
                activeOpacity={0.65}
              >
                <item.icon size={20} color={C.textSub} strokeWidth={1.8} />
                <Text style={[styles.menuLabel, { color: C.text }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <LogOut size={20} color="#EF4444" strokeWidth={1.8} />
            <Text style={styles.logoutLabel}>Déconnexion</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.45)',
  },
  drawer: {
    position:       'absolute',
    left:           0,
    top:            0,
    bottom:         0,
    shadowColor:    '#000',
    shadowOpacity:  0.18,
    shadowRadius:   20,
    shadowOffset:   { width: 4, height: 0 },
    elevation:      12,
  },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom:   24,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBubble: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  brandName: { fontFamily: F.bold, fontSize: 18 },

  userBlock: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            12,
    marginHorizontal: 20,
    paddingBottom:  20,
    borderBottomWidth: 1,
    marginBottom:   12,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText:  { fontFamily: F.bold, fontSize: 18 },
  userName:    { fontFamily: F.semi, fontSize: 14 },
  userEmail:   { fontFamily: F.reg, fontSize: 12, marginTop: 2 },

  menuList: { flex: 1 },
  menuItem: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              14,
    paddingHorizontal: 20,
    paddingVertical:  16,
    borderBottomWidth: 1,
  },
  menuLabel: { fontFamily: F.med, fontSize: 15 },

  logoutBtn: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              12,
    paddingHorizontal: 20,
    paddingVertical:  20,
    marginBottom:     8,
  },
  logoutLabel: { fontFamily: F.semi, fontSize: 15, color: '#EF4444' },
});
