import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import useLayoutStore from '../../store/layoutStore';
import { getColors } from '../../theme/colors';

export default function LoadingSpinner({ message, fullScreen = false }) {
  const isDark = useLayoutStore((s) => s.isDarkMode);
  const C = getColors(isDark);

  return (
    <View
      style={{
        flex: fullScreen ? 1 : 0,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        backgroundColor: fullScreen ? C.bg : 'transparent',
      }}
    >
      <ActivityIndicator size="large" color={C.primary} />
      {message && (
        <Text style={{ color: C.textSub, marginTop: 12, fontSize: 14 }}>{message}</Text>
      )}
    </View>
  );
}
