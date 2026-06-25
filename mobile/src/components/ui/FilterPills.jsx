import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import useLayoutStore from '../../store/layoutStore';
import { getColors } from '../../theme/colors';
import { F } from '../../theme/fonts';

export default function FilterPills({ items, active, onSelect, style }) {
  const isDark = useLayoutStore((s) => s.isDarkMode);
  const C      = getColors(isDark);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[{ flexGrow: 0 }, style]}
      contentContainerStyle={styles.container}
    >
      {items.map((item) => {
        const isActive = item === active;
        return (
          <TouchableOpacity
            key={item}
            onPress={() => onSelect?.(item)}
            activeOpacity={0.75}
            style={[
              styles.pill,
              isActive
                ? { backgroundColor: C.primary }
                : { backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border },
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  color:      isActive ? '#FFFFFF' : C.textSub,
                  fontFamily: isActive ? F.displaySemi : F.displayReg,
                },
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    paddingHorizontal: 20,
    paddingVertical:   4,
  },
  pill: {
    paddingHorizontal: 18,
    paddingVertical:   9,
    borderRadius:      999,
  },
  label: {
    fontSize: 13,
  },
});
