import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { X, AlertCircle } from 'lucide-react-native';
import { errorBus } from '../../utils/errorBus';
import { getColors } from '../../theme/colors';
import useLayoutStore from '../../store/layoutStore';
import { F } from '../../theme/fonts';

export default function ErrorToast() {
  const isDark = useLayoutStore((s) => s.isDarkMode);
  const C = getColors(isDark);
  const [toasts, setToasts] = useState([]);

  const toastBg     = isDark ? '#450A0A' : '#FEF2F2';
  const toastBorder = isDark ? '#7F1D1D' : '#FECACA';
  const toastText   = isDark ? '#FCA5A5' : '#DC2626';
  const toastIcon   = isDark ? '#FCA5A5' : '#EF4444';

  useEffect(() => {
    const unsub = errorBus.subscribe((error) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, error }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    });
    return unsub;
  }, []);

  if (toasts.length === 0) return null;

  return (
    <View style={styles.container}>
      {toasts.map(({ id, error }) => (
        <View
          key={id}
          style={[styles.toast, { backgroundColor: toastBg, borderColor: toastBorder }]}
        >
          <AlertCircle size={18} color={toastIcon} style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            {error.code && (
              <Text style={{ fontFamily: F.bodySemi, color: toastText, fontSize: 11, opacity: 0.7 }}>
                {error.code}
              </Text>
            )}
            <Text style={{ fontFamily: F.bodyReg, color: toastText, fontSize: 13 }} numberOfLines={2}>
              {error.message}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setToasts((prev) => prev.filter((t) => t.id !== id))}>
            <X size={16} color={toastText} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    right: 16,
    zIndex: 999,
    gap: 8,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
});
