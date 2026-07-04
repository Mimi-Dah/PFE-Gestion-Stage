import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, Alert, I18nManager } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Edit2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import useLayoutStore from '../../store/layoutStore';
import { getColors } from '../../theme/colors';
import { typography, radius } from '../../theme/tokens';
import { F } from '../../theme/fonts';
import api from '../../services/api';
import Screen      from '../../components/ui/Screen';
import Card        from '../../components/ui/Card';
import Button      from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState  from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function AbsencesScreen({ navigation, route }) {
  const { t }  = useTranslation();
  const isDark = useLayoutStore((s) => s.isDarkMode);
  const C      = getColors(isDark);
  const queryClient = useQueryClient();
  const [selectedAbsence, setSelectedAbsence] = useState(null);
  const [justification, setJustification] = useState('');
  const [loading, setLoading] = useState(false);

  const candidatureId = route.params?.candidatureId ?? null;
  const stageName     = route.params?.stageName     ?? null;

  const { data, isLoading } = useQuery({
    queryKey: ['absences'],
    queryFn: () => api.get('absences/').then(r => r.data),
  });

  const allAbsences = Array.isArray(data) ? data : data?.results ?? [];
  const absences    = candidatureId != null
    ? allAbsences.filter(a => a.candidature === candidatureId)
    : allAbsences;

  const handleJustify = async () => {
    if (!justification.trim()) return;
    setLoading(true);
    const result = await api.safeRequest(
      api.post(`absences/${selectedAbsence.id_absence}/justifier/`, { justification })
    );
    setLoading(false);
    if (result.ok) {
      queryClient.invalidateQueries({ queryKey: ['absences'] });
      setSelectedAbsence(null);
      setJustification('');
      Alert.alert(t('absences.justifySuccess'), t('absences.justifySuccessMsg'));
    } else {
      Alert.alert(t('absences.justifyError'), result.error?.message || t('absences.justifyErrorMsg'));
    }
  };

  return (
    <Screen>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {I18nManager.isRTL
            ? <ChevronRight size={24} color={C.primary} />
            : <ChevronLeft  size={24} color={C.primary} />}
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ ...typography.h2, color: C.text }}>{t('absences.title')}</Text>
          {stageName ? (
            <Text style={{ ...typography.small, color: C.textMuted, marginTop: 1 }} numberOfLines={1}>
              {stageName}
            </Text>
          ) : null}
        </View>
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : (
        <FlatList
          data={absences}
          keyExtractor={(item) => String(item.id_absence)}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1, marginEnd: 12 }}>
                  <Text style={{ ...typography.label, color: C.text }}>
                    {new Date(item.date_absence).toLocaleDateString(t('dashboard.dateLocale'), {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </Text>
                  {item.motif_signalement ? (
                    <Text style={{ ...typography.caption, color: C.textSub, marginTop: 4 }}>
                      {item.motif_signalement}
                    </Text>
                  ) : null}
                </View>
                <StatusBadge status={item.statut} />
              </View>
              {item.statut === 'Signaler' && !item.delai_depasse ? (
                <TouchableOpacity
                  onPress={() => setSelectedAbsence(item)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, alignSelf: 'flex-start' }}
                  accessibilityRole="button"
                  accessibilityLabel="Justifier cette absence"
                >
                  <Edit2 size={14} color={C.primary} />
                  <Text style={{ ...typography.caption, fontFamily: F.bodySemi, color: C.primary }}>{t('absences.justifyBtn')}</Text>
                </TouchableOpacity>
              ) : null}
            </Card>
          )}
          ListEmptyComponent={
            <EmptyState
              emoji="✅"
              title={t('absences.empty')}
              body={t('absences.emptySubtitle')}
            />
          }
        />
      )}

      {/* Justify modal */}
      <Modal visible={!!selectedAbsence} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: C.overlay }}>
          <View style={{
            backgroundColor: C.bgCard,
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            padding: 24,
          }}>
            <Text style={{ ...typography.h3, color: C.text, marginBottom: 16 }}>
              {t('absences.justifyTitle')}
            </Text>
            <TextInput
              value={justification}
              onChangeText={setJustification}
              placeholder={t('absences.justifyPlaceholder')}
              placeholderTextColor={C.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{
                backgroundColor: C.bgInput, borderRadius: radius.lg,
                padding: 16, color: C.text, fontSize: 14,
                minHeight: 100, borderWidth: 1, borderColor: C.border, marginBottom: 16,
              }}
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Button
                variant="secondary"
                uppercase={false}
                style={{ flex: 1 }}
                onPress={() => { setSelectedAbsence(null); setJustification(''); }}
              >
                {t('common.cancel')}
              </Button>
              <Button uppercase={false} style={{ flex: 1 }} loading={loading} onPress={handleJustify}>
                {t('absences.justifySubmit')}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
