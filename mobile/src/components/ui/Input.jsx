import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { EyeOff, Eye, User, Mail, Lock, Phone, MapPin, Briefcase } from 'lucide-react-native';
import useLayoutStore from '../../store/layoutStore';
import { getColors } from '../../theme/colors';
import { F } from '../../theme/fonts';

const ICON_MAP = {
  'person-outline': User,
  'mail-outline': Mail,
  'lock-closed-outline': Lock,
  'call-outline': Phone,
  'location-outline': MapPin,
  'briefcase-outline': Briefcase,
};

export default function Input({
  label,
  error,
  secureTextEntry,
  leftIcon,
  LeftIcon,
  pill = false,
  style,
  containerStyle,
  ...props
}) {
  const isDark = useLayoutStore((s) => s.isDarkMode);
  const C = getColors(isDark);
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPassword = secureTextEntry;

  const borderColor = error ? C.danger : focused ? C.primary : C.border;
  const bgColor     = C.bgInput;
  const borderRadius = pill ? 999 : 12;
  const paddingH     = pill ? 24 : 16;

  const IconToRender = LeftIcon || (leftIcon ? ICON_MAP[leftIcon] : null);

  return (
    <View style={[{ marginBottom: 16 }, containerStyle]}>
      {label && (
        <Text style={{
          fontFamily:   F.displaySemi,
          color:        C.textSub,
          fontSize:     13,
          marginBottom: 8,
          letterSpacing: 0.2,
        }}>
          {label}
        </Text>
      )}
      <View
        style={{
          flexDirection:     'row',
          alignItems:        'center',
          backgroundColor:   bgColor,
          borderRadius,
          borderWidth:       focused ? 1.5 : 1,
          borderColor,
          paddingHorizontal: paddingH,
          minHeight:         50,
        }}
      >
        {IconToRender && (
          <IconToRender
            size={19}
            color={focused ? C.primary : C.textMuted}
            style={{ marginRight: 8 }}
            strokeWidth={2}
          />
        )}
        <TextInput
          {...props}
          secureTextEntry={isPassword && !visible}
          placeholderTextColor={C.textMuted}
          onFocus={(e) => { setFocused(true);  props.onFocus?.(e); }}
          onBlur={(e)  => { setFocused(false); props.onBlur?.(e);  }}
          style={[
            {
              fontFamily:      F.bodyReg,
              flex:            1,
              color:           C.text,
              fontSize:        15,
              paddingVertical: 16,
            },
            style,
          ]}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setVisible(!visible)}
            accessibilityLabel={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {visible ? <EyeOff size={19} color={C.textMuted} /> : <Eye size={19} color={C.textMuted} />}
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={{ fontFamily: F.bodyReg, color: C.danger, fontSize: 12, marginTop: 8 }}>{error}</Text>
      )}
    </View>
  );
}
