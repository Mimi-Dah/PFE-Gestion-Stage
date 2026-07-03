import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, I18nManager } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import useLayoutStore from '../../store/layoutStore';
import { getColors } from '../../theme/colors';
import { typography, radius } from '../../theme/tokens';
import EvaluationService from '../../services/evaluations';
import Screen        from '../../components/ui/Screen';
import Card          from '../../components/ui/Card';
import MetricCircle  from '../../components/ui/MetricCircle';
import EmptyState    from '../../components/ui/EmptyState';
import ErrorState    from '../../components/ui/ErrorState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function EvaluationsScreen({ navigation, route }) {
  const { t }  = useTranslation();
  const isDark = useLayoutStore((s) => s.isDarkMode);
  const C      = getColors(isDark);

  const METRIC_LABELS = {
    comportement:   t('evaluations.metrics.comportement'),
    adaptabilite:   t('evaluations.metrics.adaptabilite'),
    travail_equipe: t('evaluations.metrics.travail_equipe'),
    qualite_travail:t('evaluations.metrics.qualite_travail'),
  };

  const offreId   = route.params?.offreId   ?? null;
  const stageName = route.params?.stageName ?? null;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['evaluations', 'entreprise'],
    queryFn: () => EvaluationService.list('entreprise'),
  });

  const allEvals = Array.isArray(data) ? data : data?.results ?? [];
  const evals    = offreId != null
    ? allEvals.filter(ev => ev.offre === offreId)
    : allEvals;

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
          <Text style={{ ...typography.h2, color: C.text }}>{t('evaluations.title')}</Text>
          {stageName ? (
            <Text style={{ ...typography.small, color: C.textMuted, marginTop: 1 }} numberOfLines={1}>
              {stageName}
            </Text>
          ) : null}
        </View>
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen message={t('common.loading')} />
      ) : isError ? (
        <ErrorState message={t('evaluations.error')} onRetry={refetch} style={{ flex: 1 }} />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, gap: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {!evals.length ? (
            <EmptyState
              emoji="📊"
              title={t('evaluations.empty')}
              body={offreId != null ? t('evaluations.emptyForOffer') : t('evaluations.emptySubtitle')}
            />
          ) : (
            evals.map((ev, idx) => (
              <View key={ev.id_evaluation ?? idx} style={{ gap: 12 }}>
                {/* Header: entreprise + note globale */}
                <Card>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ ...typography.label, color: C.text }}>{ev.entreprise_nom || 'Entreprise'}</Text>
                      {ev.date_evaluation ? (
                        <Text style={{ ...typography.small, color: C.textMuted, marginTop: 2 }}>
                          {new Date(ev.date_evaluation).toLocaleDateString(t('dashboard.dateLocale'))}
                        </Text>
                      ) : null}
                    </View>
                    {ev.note_globale != null && (
                      <View style={{ alignItems: 'center', backgroundColor: C.primarySoft, borderRadius: 12, padding: 10, minWidth: 64 }}>
                        <Text style={{ ...typography.h2, color: C.primary, lineHeight: 32 }}>{ev.note_globale}</Text>
                        <Text style={{ ...typography.small, color: C.textMuted }}>/ 20</Text>
                      </View>
                    )}
                  </View>

                  {/* Criteria circles */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20, justifyContent: 'center' }}>
                    {Object.entries(METRIC_LABELS).map(([key, label]) => {
                      const raw = ev[key];
                      if (raw === undefined || raw === null) return null;
                      return <MetricCircle key={key} value={parseFloat(raw)} max={5} size={84} label={label} />;
                    })}
                  </View>
                </Card>

                {/* Comments */}
                {ev.commentaires ? (
                  <Card>
                    <Text style={{ ...typography.label, color: C.text, marginBottom: 10 }}>{t('evaluations.tutorComments')}</Text>
                    <Text style={{ ...typography.body, color: C.textSub }}>{ev.commentaires}</Text>
                  </Card>
                ) : null}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </Screen>
  );
}
