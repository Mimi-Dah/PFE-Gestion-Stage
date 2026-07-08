import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Upload,
  Calendar,
  Building2,
  FileCheck2,
  XCircle,
  X,
  Hourglass,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import api from '../services/api';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import { dateLocale } from '../utils/dateLocale';

/* ── shared field styles (mirrors OfferDetail's boxed-field language) ── */
const fieldLabel = {
  display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: '700',
  color: 'var(--text-muted)', textTransform: 'uppercase',
  letterSpacing: '0.05em', marginBottom: '0.4rem',
};
const inputBox = {
  width: '100%', padding: '0.6rem 0.875rem', borderRadius: '6px',
  border: '1px solid var(--surface-border)', backgroundColor: 'var(--surface-card)',
  color: 'var(--text-main)', fontSize: '0.875rem', fontWeight: '500',
  boxSizing: 'border-box', lineHeight: 1.5,
};

/* ── helpers ── */
const getStatusStyle = (statut, t) => {
  switch (statut) {
    case 'Signaler':               return { bg: 'rgba(245,158,11,.12)', color: '#b45309',  icon: AlertCircle  };
    case 'En_attente_approbation': return { bg: 'rgba(99,102,241,.1)',  color: '#4338ca',  icon: Hourglass    };
    case 'Justifiée':              return { bg: 'rgba(16,185,129,.1)',   color: '#15803d',  icon: CheckCircle2 };
    case 'Non_justifiée':          return { bg: 'rgba(239,68,68,.12)',   color: '#b91c1c',  icon: XCircle      };
    default:                       return { bg: 'var(--surface-hover)',  color: 'var(--text-muted)', icon: Clock };
  }
};

/* ── component ── */
const Absences = () => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [justMessage, setJustMessage] = useState('');
  const [justFile, setJustFile]       = useState(null);
  const [selectedAbsence, setSelectedAbsence] = useState(null);
  const [submitError, setSubmitError] = useState('');

  const DeadlineBadge = ({ joursRestants, delaiDepasse }) => {
    if (delaiDepasse)
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.18rem 0.55rem', borderRadius: '999px', background: 'rgba(239,68,68,.12)', color: '#b91c1c', fontSize: '0.7rem', fontWeight: 700 }}>
          <Lock size={10} /> {t('pages.absences.deadlineExpired')}
        </span>
      );
    if (joursRestants === null || joursRestants === undefined) return null;
    const urgent = joursRestants <= 1;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.18rem 0.55rem', borderRadius: '999px', background: urgent ? 'rgba(239,68,68,.12)' : 'rgba(245,158,11,.12)', color: urgent ? '#b91c1c' : '#b45309', fontSize: '0.7rem', fontWeight: 700 }}>
        <Clock size={10} /> {joursRestants === 0 ? t('pages.absences.deadlineLastDay') : t('pages.absences.deadlineDays', { count: joursRestants })}
      </span>
    );
  };

  const { data: absencesData, isLoading, isError } = useQuery({
    queryKey: ['my-absences'],
    queryFn: async () => {
      const result = await api.safeRequest(api.get('absences/'));
      if (result.ok) return result.value.data;
      throw result.error;
    },
  });

  const justifyMutation = useMutation({
    mutationFn: async ({ id, formData }) => {
      const result = await api.safeRequest(api.post(`absences/${id}/justifier/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }));
      if (result.ok) return result.value.data;
      throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-absences'] });
      setJustMessage('');
      setJustFile(null);
      setSelectedAbsence(null);
      setSubmitError('');
    },
    onError: (err) => setSubmitError(err?.message || t('pages.absences.modal.submitError')),
  });

  const absences = Array.isArray(absencesData) ? absencesData : (absencesData?.results || []);

  const handleJustify = (e) => {
    e.preventDefault();
    if (!selectedAbsence || !justMessage) return;
    setSubmitError('');
    const formData = new FormData();
    formData.append('justification', justMessage);
    if (justFile) formData.append('document_justificatif', justFile);
    justifyMutation.mutate({ id: selectedAbsence.id_absence, formData });
  };

  if (isLoading) return <SkeletonLoader variant="cards" />;

  if (isError) return (
    <div style={{ padding: '5rem', textAlign: 'center', color: 'var(--error)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <AlertCircle size={40} />
      <p style={{ fontWeight: 700 }}>{t('pages.absences.error')}</p>
    </div>
  );

  return (
    <>
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)' }}>
          {t('pages.absences.title')}
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          {t('pages.absences.subtitle')}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {absences.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '5rem', border: '2px dashed var(--surface-border)' }}>
            <CheckCircle2 size={56} style={{ color: 'var(--success)', opacity: 0.6, marginBottom: '1.5rem' }} />
            <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.5rem', fontWeight: 800 }}>{t('pages.absences.emptyTitle')}</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              {t('pages.absences.emptySubtitle')}
            </p>
          </div>
        ) : (
          absences.map((abs) => {
            const s = getStatusStyle(abs.statut, t);
            const canJustify = abs.statut === 'Signaler' && !abs.delai_depasse;
            const expired    = abs.statut === 'Signaler' && abs.delai_depasse;

            return (
              <div
                key={abs.id_absence}
                className="vl-card"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto',
                  gap: '1.5rem',
                  alignItems: 'center',
                  padding: '1.25rem 1.5rem',
                  borderLeft: `3px solid ${abs.statut === 'Non_justifiée' || expired ? 'var(--error)' : abs.statut === 'Signaler' ? '#f59e0b' : abs.statut === 'En_attente_approbation' ? '#6366f1' : 'transparent'}`,
                  opacity: expired ? 0.85 : 1,
                }}
              >
                {/* Icon */}
                <div style={{ width: 42, height: 42, borderRadius: '10px', backgroundColor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
                  <Calendar size={20} />
                </div>

                {/* Info */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                      {new Date(abs.date_absence).toLocaleDateString(dateLocale(i18n.language), { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', padding: '0.2rem 0.6rem', borderRadius: '100px', backgroundColor: s.bg, color: s.color }}>
                      {t('pages.absences.status.' + abs.statut)}
                    </span>
                    {abs.statut === 'Signaler' && (
                      <DeadlineBadge joursRestants={abs.jours_restants} delaiDepasse={abs.delai_depasse} />
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600, flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Building2 size={12} /> {abs.entreprise_nom}
                    </span>
                    <span>·</span>
                    <span>{t('pages.absences.reason', { reason: abs.motif_signalement })}</span>
                  </div>

                  {abs.statut === 'En_attente_approbation' && (
                    <div style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: '#4338ca', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <ShieldCheck size={12} /> {t('pages.absences.pendingMsg')}
                    </div>
                  )}

                  {abs.statut === 'Non_justifiée' && !abs.justification && (
                    <div style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: '#b91c1c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Lock size={12} /> {t('pages.absences.autoClosedMsg')}
                    </div>
                  )}

                  {abs.statut === 'Non_justifiée' && abs.justification && (
                    <div style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: '#b91c1c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <XCircle size={12} /> {t('pages.absences.rejectedMsg')}
                    </div>
                  )}
                </div>

                {/* Action */}
                <div>
                  {canJustify && (
                    <button
                      className="primary"
                      onClick={() => setSelectedAbsence(abs)}
                      style={{ fontSize: '0.82rem', padding: '0.5rem 1rem', borderRadius: '8px' }}
                    >
                      {t('pages.absences.justifyBtn')}
                    </button>
                  )}

                  {expired && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#b91c1c', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      <Lock size={13} /> {t('pages.absences.expiredLabel')}
                    </div>
                  )}

                  {abs.statut === 'En_attente_approbation' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#4338ca', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      <Hourglass size={13} /> {t('pages.absences.reviewLabel')}
                    </div>
                  )}

                  {abs.statut === 'Justifiée' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#15803d', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      <FileCheck2 size={13} /> {t('pages.absences.approvedLabel')}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>

      {/* ── Justification modal ── */}
      {selectedAbsence && (
        <div
          onClick={e => e.target === e.currentTarget && setSelectedAbsence(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1.5rem' }}
        >
          <div style={{ backgroundColor: 'var(--surface-card)', borderRadius: '10px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>

            {/* ── Header ─────────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--surface-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Calendar size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>{t('pages.absences.modal.title')}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    {new Date(selectedAbsence.date_absence).toLocaleDateString(dateLocale(i18n.language), { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedAbsence(null)}
                style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid var(--surface-border)', backgroundColor: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                <X size={15} />
              </button>
            </div>

            {/* ── Body ───────────────────────────────────────────── */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>

              {selectedAbsence.jours_restants !== null && selectedAbsence.jours_restants !== undefined && (
                <span style={{
                  display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', gap: '4px',
                  padding: '4px 12px', borderRadius: '9999px', fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.02em',
                  background: selectedAbsence.jours_restants <= 1 ? 'rgba(239,68,68,.12)' : 'rgba(245,158,11,.12)',
                  color: selectedAbsence.jours_restants <= 1 ? '#b91c1c' : '#b45309',
                }}>
                  <Clock size={11} />
                  {selectedAbsence.jours_restants === 0
                    ? t('pages.absences.modal.lastDayWarning')
                    : t('pages.absences.modal.daysLeft', { count: selectedAbsence.jours_restants })}
                </span>
              )}

              {/* Info fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={fieldLabel}><Calendar size={12} color="var(--primary)" />{t('pages.absences.modal.absenceDate')}</label>
                  <div style={inputBox}>
                    {new Date(selectedAbsence.date_absence).toLocaleDateString(dateLocale(i18n.language), { day: 'numeric', month: 'long' })}
                  </div>
                </div>
                <div>
                  <label style={fieldLabel}><Building2 size={12} color="var(--primary)" />{t('pages.absences.modal.company')}</label>
                  <div style={inputBox}>{selectedAbsence.entreprise_nom}</div>
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--surface-border)', margin: 0 }} />

              <form onSubmit={handleJustify} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
                <div>
                  <label style={fieldLabel}>
                    <FileText size={12} color="var(--primary)" />
                    {t('pages.absences.modal.explanationLabel')} <span style={{ color: 'var(--error)' }}>*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={justMessage}
                    onChange={e => setJustMessage(e.target.value)}
                    placeholder={t('pages.absences.modal.explanationPlaceholder')}
                    required
                    style={{ ...inputBox, resize: 'vertical', fontFamily: 'inherit', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={fieldLabel}>
                    <Upload size={12} color="var(--primary)" />
                    {t('pages.absences.modal.docLabel')}
                  </label>
                  <div style={{ ...inputBox, display: 'flex', flexDirection: 'column', gap: '0.35rem', backgroundColor: 'var(--surface-section)' }}>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={e => setJustFile(e.target.files[0])}
                      style={{ fontSize: '0.78rem', color: 'var(--text-color)', width: '100%' }}
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('pages.absences.modal.docHint')}</span>
                  </div>
                </div>

                {submitError && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', padding: '11px 14px', backgroundColor: 'var(--error-light)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: 'var(--error)', lineHeight: 1.45 }}>
                    <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                    {submitError}
                  </div>
                )}

                {/* ── Footer ─────────────────────────────────────────── */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid var(--surface-border)', paddingTop: '1.125rem', marginTop: '0.1rem' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedAbsence(null)}
                    style={{ padding: '0.6rem 1.25rem', borderRadius: '6px', border: '1px solid var(--surface-border)', backgroundColor: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
                  >
                    {t('pages.absences.modal.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={justifyMutation.isPending || !justMessage.trim()}
                    style={{ padding: '0.6rem 1.375rem', borderRadius: '6px', border: 'none', backgroundColor: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: justifyMutation.isPending ? 'not-allowed' : 'pointer', opacity: (justifyMutation.isPending || !justMessage.trim()) ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Upload size={14} />
                    {justifyMutation.isPending ? t('pages.absences.modal.submitting') : t('pages.absences.modal.submitBtn')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Absences;
