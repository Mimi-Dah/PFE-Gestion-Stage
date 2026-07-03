import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader';
import {
  FileCheck, FileText, Download, Upload,
  AlertCircle, CheckCircle2, Clock,
  ChevronDown, Award,
  Briefcase, ChevronRight,
  PlayCircle, Zap,
  X,
} from 'lucide-react';
import api, { mediaUrl } from '../services/api';
import { dateLocale } from '../utils/dateLocale';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import './MonStage.css';

/* ── Helpers ───────────────────────────────────────────────────── */
const getStepState = (done, isNext) => done ? 'done' : isNext ? 'current' : 'pending';

const fmtDate = (d, lang = 'fr') =>
  d ? new Date(d).toLocaleDateString(dateLocale(lang), { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

/* ── Step item ─────────────────────────────────────────────────── */
const StepItem = ({ icon: Icon, label, state }) => {
  const { t } = useTranslation();
  const done    = state === 'done';
  const current = state === 'current';
  return (
    <div className="vf-folder-item">
      <div className="vf-folder-item-left">
        <div className="vf-folder-icon" style={{
          background: done ? '#eff6ff' : current ? '#fefce8' : '#f8fafc',
          color:      done ? '#1b6ef3' : current ? '#b45309' : '#94a3b8',
        }}>
          <Icon size={16} />
        </div>
        <span className={`vf-folder-name${done || current ? '' : ' muted'}`}>{label}</span>
      </div>
      {done ? (
        <span className="ms-badge-asym" style={{ background: '#eff6ff', color: '#1b6ef3', whiteSpace: 'nowrap' }}>
          {t('pages.myInternship.stepDone')}
        </span>
      ) : current ? (
        <span className="ms-badge-asym" style={{ background: '#fffbeb', color: '#b45309', whiteSpace: 'nowrap' }}>
          {t('pages.myInternship.stepCurrent')}
        </span>
      ) : (
        <span style={{ fontSize: '0.7rem', color: '#cbd5e1', fontWeight: 600 }}>—</span>
      )}
    </div>
  );
};

/* ── Icon action button ─────────────────────────────────────────── */
const IconBtn = ({ icon: Icon, title, onClick, color, border, bg }) => (
  <button
    title={title}
    onClick={onClick}
    style={{ width: 30, height: 30, border: `1.5px solid ${border || '#e2e8f0'}`, borderRadius: 7, background: bg || 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: color || '#64748b' }}
    onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
    onMouseLeave={e => e.currentTarget.style.background = bg || 'transparent'}
  >
    <Icon size={13} />
  </button>
);

/* ══════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════ */
const MyInternship = () => {
  const { t, i18n } = useTranslation();
  const fmt = (d) => fmtDate(d, i18n.language);
  const queryClient = useQueryClient();
  const [convFile,      setConvFile]      = useState(null);
  const [reportFile,    setReportFile]    = useState(null);
  const [reportSummary, setReportSummary] = useState('');
  const [message,       setMessage]       = useState('');
  const [selectedConventionId, setSelectedConventionId] = useState(null);

  /* ── Status maps ─────────────────────────────────────────────── */
  const STAGE_STATUS = {
    En_attente:          { color: '#b45309', bg: '#fffbeb' },
    Acceptée:            { color: '#16a34a', bg: '#f0fdf4' },
    Refusée:             { color: '#b91c1c', bg: '#fef2f2' },
    Retirée:             { color: '#64748b', bg: '#f1f5f9' },
    Convention_en_cours: { color: '#1d4ed8', bg: '#eff6ff' },
    Stage_actif:         { color: '#16a34a', bg: '#f0fdf4' },
    Terminé:             { color: '#64748b', bg: '#f1f5f9' },
  };
  const CONV_STATUS = {
    En_attente_validation: { color: '#b45309', bg: '#fffbeb' },
    Validée:               { color: '#16a34a', bg: '#f0fdf4' },
    Refusée:               { color: '#b91c1c', bg: '#fef2f2' },
  };

  /* ── Queries ─────────────────────────────────────────────────── */
  const { data: conventionsData, isLoading } = useQuery({
    queryKey: ['conventions'],
    queryFn: async () => {
      const r = await api.safeRequest(api.get('conventions/'));
      if (r.ok) return r.value.data;
      throw r.error;
    },
  });
  const { data: reportsData } = useQuery({
    queryKey: ['my-reports'],
    queryFn: async () => {
      const r = await api.safeRequest(api.get('rapports/'));
      if (r.ok) return r.value.data;
      throw r.error;
    },
  });
  const { data: evaluationsRaw } = useQuery({
    queryKey: ['my-evaluations-internship'],
    queryFn: () => api.get('evaluations/').then(r => r.data),
  });

  const conventions  = Array.isArray(conventionsData) ? conventionsData : conventionsData?.results || [];
  const sorted       = [...conventions].sort((a, b) => (b.id_convention || b.id) - (a.id_convention || a.id));
  const activeConv   = (selectedConventionId !== null
    ? sorted.find(c => (c.id_convention || c.id) === selectedConventionId)
    : null) || sorted[0] || null;
  const activeConvId = activeConv ? (activeConv.id_convention || activeConv.id) : '';

  const reports      = Array.isArray(reportsData) ? reportsData : reportsData?.results || [];
  const activeReport = reports.find(r => r.offre === activeConv?.offre_id);
  const allEvals     = Array.isArray(evaluationsRaw) ? evaluationsRaw : evaluationsRaw?.results || [];
  const activeEval   = activeConv ? allEvals.find(e => e.offre === activeConv.offre_id) || null : null;

  /* ── Mutations ───────────────────────────────────────────────── */
  const signMutation = useMutation({
    mutationFn: (fd) => api.post(
      `conventions/${activeConv.id || activeConv.id_convention}/signer-etudiant/`, fd,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    ),
    onSuccess: () => {
      setMessage('success:' + t('pages.myInternship.signSuccess'));
      setConvFile(null);
      queryClient.invalidateQueries({ queryKey: ['conventions'] });
    },
    onError: (err) => setMessage('error:' + (err.message || t('pages.myInternship.signError'))),
  });
  const reportMutation = useMutation({
    mutationFn: (fd) => api.post('rapports/', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => {
      setMessage('success:' + t('pages.myInternship.reportSuccess'));
      setReportFile(null);
      setReportSummary('');
      queryClient.invalidateQueries({ queryKey: ['my-reports'] });
    },
    onError: (err) => setMessage('error:' + (err.message || t('pages.myInternship.reportError'))),
  });

  const handleConvUpload = (e) => {
    e.preventDefault();
    if (!convFile || !activeConv) return;
    const fd = new FormData();
    fd.append('fichier_signe', convFile);
    signMutation.mutate(fd);
  };
  const handleReportUpload = (e) => {
    e.preventDefault();
    if (!reportFile || !activeConv) return;
    const fd = new FormData();
    fd.append('fichier', reportFile);
    fd.append('offre', activeConv.offre_id);
    fd.append('resume', reportSummary || `Rapport de stage — ${activeConv.numero_convention}`);
    reportMutation.mutate(fd);
  };

  if (isLoading) return <SkeletonLoader variant="detail" />;

  /* ── Empty state ─────────────────────────────────────────────── */
  if (!activeConv) return (
    <div className="ms-empty">
      <Briefcase size={52} color="#cbd5e1" />
      <h2>{t('pages.myInternship.emptyTitle')}</h2>
      <p>{t('pages.myInternship.emptySubtitle')}</p>
      <button className="vf-btn vf-btn-primary" style={{ marginTop: '0.5rem' }}
        onClick={() => window.location.href = '/espace/offres'}
      >
        {t('pages.myInternship.exploreOffers')} <ChevronRight size={15} />
      </button>
    </div>
  );

  /* ── Timeline steps ──────────────────────────────────────────── */
  const stepsDone = [
    !!activeConv.cree_le,
    !!activeConv.signe_par_etudiant_le && !!activeConv.signe_par_entreprise_le,
    activeConv.candidature_statut === 'Stage_actif' || activeConv.candidature_statut === 'Terminé',
    !!activeReport,
    !!activeEval,
  ];
  const doneCount   = stepsDone.filter(Boolean).length;
  const nextIdx     = stepsDone.findIndex(d => !d);
  const canSubmit   = ['Stage_actif', 'Terminé'].includes(activeConv.candidature_statut);

  const STEPS = [
    { label: t('pages.myInternship.step1'), icon: FileCheck  },
    { label: t('pages.myInternship.step2'), icon: Zap        },
    { label: t('pages.myInternship.step3'), icon: PlayCircle },
    { label: t('pages.myInternship.step4'), icon: FileText   },
    { label: t('pages.myInternship.step5'), icon: Award      },
  ];

  const stageStatus = STAGE_STATUS[activeConv.candidature_statut] || STAGE_STATUS.En_attente;
  const convStatus  = CONV_STATUS[activeConv.statut] || CONV_STATUS.En_attente_validation;
  const [msgType, msgText] = message ? message.split(':') : ['', ''];

  const duration = (() => {
    if (!activeConv.date_debut || !activeConv.date_fin) return null;
    const days = Math.round((new Date(activeConv.date_fin) - new Date(activeConv.date_debut)) / 86400000);
    const weeks = Math.round(days / 7);
    if (weeks >= 8) return t('pages.myInternship.durationMonths', { n: Math.round(weeks / 4.33) });
    if (weeks >= 1) return t('pages.myInternship.durationWeeks', { count: weeks });
    return t('pages.myInternship.durationDays', { count: days });
  })();

  return (
    <div className="ms-page-wrap">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="ms-header">
        <PageHeader
          eyebrow={t('pages.myInternship.eyebrow')}
          title={t('pages.myInternship.title')}
          subtitle={t('pages.myInternship.subtitle')}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
          <span className="v-tag" style={{ background: stageStatus.bg, color: stageStatus.color }}>
            {t('pages.myInternship.status.' + activeConv.candidature_statut)}
          </span>
          {sorted.length > 0 && (
            <div className="ms-selector-wrap">
              <select
                className="ms-selector"
                value={activeConvId}
                onChange={e => setSelectedConventionId(Number(e.target.value))}
                disabled={sorted.length === 1}
              >
                {sorted.map(c => (
                  <option key={c.id_convention || c.id} value={c.id_convention || c.id}>
                    {c.offre_titre}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="ms-selector-chevron" />
            </div>
          )}
        </div>
      </div>

      {/* ── Message banner ──────────────────────────────────────── */}
      {message && (
        <div className={`ms-banner ${msgType === 'success' ? 'ms-banner-success' : 'ms-banner-error'}`}>
          <span className="ms-banner-icon">
            {msgType === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          </span>
          <span style={{ flex: 1 }}>{msgText}</span>
          <button onClick={() => setMessage('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, flexShrink: 0 }}>
            <X size={15} />
          </button>
        </div>
      )}

      {/* ── Info paragraph ─────────────────────────────────────── */}
      <div className="ms-info-para" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem 1.5rem' }}>
        <span>
          {t('pages.myInternship.convWith')} <strong>{activeConv.numero_convention || `#${activeConvId}`}</strong>{' '}
          {t('pages.myInternship.convWithCompany')} <strong>{activeConv.entreprise_nom || '—'}</strong>
          {activeConv.date_debut && (
            <>, {t('pages.myInternship.convFrom')} <strong>{fmt(activeConv.date_debut)}</strong>{' '}
            {t('pages.myInternship.convTo')} <strong>{fmt(activeConv.date_fin)}</strong>
            {duration && <> — {t('pages.myInternship.convDuration')}&nbsp;: <strong>{duration}</strong></>}
            </>
          )}.{' '}
          {t('pages.myInternship.convStatus')}&nbsp;:{' '}
          <span className="ms-info-badge" style={{ color: convStatus.color, background: convStatus.bg }}>
            {t('pages.myInternship.status.' + activeConv.statut)}
          </span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.875rem', flexShrink: 0 }}>
          <span className="ms-sign-row" style={{ gap: 5 }}>
            <span className="ms-sign-dot" style={{ background: activeConv.signe_par_etudiant_le ? '#16a34a' : '#e2e8f0' }} />
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{t('pages.myInternship.signedStudent')}</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: activeConv.signe_par_etudiant_le ? '#16a34a' : '#94a3b8' }}>
              {activeConv.signe_par_etudiant_le ? fmt(activeConv.signe_par_etudiant_le) : t('pages.myInternship.waitingSignature')}
            </span>
          </span>
          <span className="ms-sign-row" style={{ gap: 5 }}>
            <span className="ms-sign-dot" style={{ background: activeConv.signe_par_entreprise_le ? '#16a34a' : '#e2e8f0' }} />
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{t('pages.myInternship.signedCompany')}</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: activeConv.signe_par_entreprise_le ? '#16a34a' : '#94a3b8' }}>
              {activeConv.signe_par_entreprise_le ? fmt(activeConv.signe_par_entreprise_le) : t('pages.myInternship.waitingSignature')}
            </span>
          </span>
        </span>
      </div>

      {/* ══ MAIN CONTENT ═══════════════════════════════════════════ */}
      <div className="ms-right-col">

        {/* Steps card */}
        <div className="vf-card">
          <div style={{ padding: '1.125rem 1.375rem', borderBottom: '1.5px solid #f1f5f9' }}>
            <div className="vf-card-title-row" style={{ margin: 0 }}>
              <h3 className="vf-card-title" style={{ margin: 0 }}>{t('pages.myInternship.stepsTitle')}</h3>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1b6ef3' }}>
                {t('pages.myInternship.stepsCount', { done: doneCount, total: STEPS.length })}
              </span>
            </div>
          </div>
          <div className="vf-folder-list">
            {STEPS.map((step, idx) => (
              <StepItem
                key={idx}
                icon={step.icon}
                label={step.label}
                state={getStepState(stepsDone[idx], idx === nextIdx)}
              />
            ))}
          </div>
        </div>

        {/* Documents card */}
        <div className="vf-card">
          <div style={{ padding: '1.125rem 1.375rem', borderBottom: '1.5px solid #f1f5f9' }}>
            <h3 className="vf-card-title" style={{ margin: 0 }}>{t('pages.myInternship.docsTitle')}</h3>
          </div>
          <div className="vf-file-table-header">
            <span>{t('pages.myInternship.colName')}</span>
            <span>{t('pages.myInternship.colDate')}</span>
            <span>{t('pages.myInternship.colStatus')}</span>
            <span style={{ textAlign: 'right' }}>{t('pages.myInternship.colActions')}</span>
          </div>
          {/* Convention row */}
          <div className="vf-file-row">
            <div className="vf-file-name">
              <div className="vf-file-icon"><FileCheck size={15} color="#1b6ef3" /></div>
              <div>
                <div className="vf-file-text">{t('pages.myInternship.conventionDoc')}</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                  {activeConv.numero_convention || `#${activeConvId}`}
                </div>
              </div>
            </div>
            <span className="vf-file-date">{fmtDate(activeConv.cree_le)}</span>
            <span>
              <span className="ms-badge-asym" style={{ background: convStatus.bg, color: convStatus.color }}>
                {t('pages.myInternship.status.' + activeConv.statut)}
              </span>
            </span>
            <div className="vf-file-actions">
              {(activeConv.fichier_convention || activeConv.fichier_signe) && (
                <IconBtn icon={Download} title={t('pages.myInternship.downloadConvention')}
                  onClick={() => {
                    const f = activeConv.fichier_signe || activeConv.fichier_convention;
                    const u = mediaUrl(f);
                    if (u) window.open(u, '_blank');
                  }}
                />
              )}
            </div>
          </div>
          {/* Rapport row */}
          <div className="vf-file-row">
            <div className="vf-file-name">
              <div className="vf-file-icon" style={{ background: activeReport ? '#f0fdf4' : '#f8fafc' }}>
                <FileText size={15} color={activeReport ? '#16a34a' : '#94a3b8'} />
              </div>
              <div>
                <div className="vf-file-text">{t('pages.myInternship.reportDoc')}</div>
                {activeReport?.resume && (
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {activeReport.resume}
                  </div>
                )}
              </div>
            </div>
            <span className="vf-file-date">{activeReport ? fmtDate(activeReport.soumis_le) : '—'}</span>
            <span>
              {activeReport ? (
                <span className="ms-badge-asym" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                  {t('pages.myInternship.submitted')}
                </span>
              ) : (
                <span style={{ fontSize: '0.7rem', color: '#cbd5e1', fontWeight: 600 }}>{t('pages.myInternship.notSubmitted')}</span>
              )}
            </span>
            <div className="vf-file-actions">
              {activeReport && (
                <IconBtn icon={Download} title={t('pages.myInternship.downloadReport')}
                  onClick={() => window.open(activeReport.fichier, '_blank')}
                />
              )}
            </div>
          </div>
        </div>

        {/* Convention upload */}
        {!activeConv.signe_par_etudiant_le && (
          <div className="vf-card">
            <div style={{ padding: '1.125rem 1.375rem', borderBottom: '1.5px solid #f1f5f9' }}>
              <div className="vf-card-title-row" style={{ margin: 0 }}>
                <h3 className="vf-card-title" style={{ margin: 0 }}>{t('pages.myInternship.signTitle')}</h3>
                <span className="v-tag v-tag-warning"><Clock size={11} /> {t('pages.myInternship.signPending')}</span>
              </div>
            </div>
            <form onSubmit={handleConvUpload} style={{ padding: '1.125rem 1.375rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="ms-upload-zone">
                <input type="file" id="conv-upload" style={{ display: 'none' }} required
                  onChange={e => setConvFile(e.target.files[0])} />
                <label htmlFor="conv-upload" className="ms-upload-label">
                  <Upload size={22} color="#1b6ef3" />
                  <span className="ms-upload-filename">
                    {convFile ? convFile.name : t('pages.myInternship.uploadPlaceholder')}
                  </span>
                  <span className="ms-upload-hint">{t('pages.myInternship.uploadHint')}</span>
                </label>
              </div>
              <button type="submit" className="vf-btn vf-btn-primary vf-btn-full"
                disabled={signMutation.isPending || !convFile}>
                {signMutation.isPending ? t('pages.myInternship.uploading') : t('pages.myInternship.uploadBtn')}
              </button>
            </form>
          </div>
        )}

        {/* Rapport upload */}
        {!activeReport && canSubmit && (
          <div className="vf-card">
            <div style={{ padding: '1.125rem 1.375rem', borderBottom: '1.5px solid #f1f5f9' }}>
              <h3 className="vf-card-title" style={{ margin: 0 }}>{t('pages.myInternship.reportTitle')}</h3>
            </div>
            <form onSubmit={handleReportUpload} style={{ padding: '1.125rem 1.375rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label className="ms-field-label" htmlFor="report-summary">{t('pages.myInternship.reportSummaryLabel')}</label>
                <textarea
                  id="report-summary"
                  value={reportSummary}
                  onChange={e => setReportSummary(e.target.value)}
                  placeholder={t('pages.myInternship.reportSummaryPlaceholder')}
                  rows={4}
                  required
                  style={{
                    width: '100%', padding: '0.75rem', borderRadius: '10px',
                    border: '1.5px solid #e2e8f0', fontSize: '0.845rem',
                    fontFamily: 'inherit', resize: 'none', background: '#ffffff',
                    color: '#1e293b', outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#93c5fd'}
                  onBlur={e  => e.currentTarget.style.borderColor = '#e2e8f0'}
                />
              </div>
              <div className="ms-upload-zone">
                <input type="file" id="report-upload" style={{ display: 'none' }} required
                  onChange={e => setReportFile(e.target.files[0])} />
                <label htmlFor="report-upload" className="ms-upload-label">
                  <Upload size={22} color="#6366f1" />
                  <span className="ms-upload-filename">
                    {reportFile ? reportFile.name : t('pages.myInternship.uploadPlaceholder')}
                  </span>
                  <span className="ms-upload-hint">{t('pages.myInternship.uploadHint')}</span>
                </label>
              </div>
              <button type="submit" className="vf-btn vf-btn-full"
                style={{ background: '#6366f1', color: '#fff', borderRadius: 8, border: 'none', padding: '0.6rem 1rem', fontSize: '0.845rem', fontWeight: 600, opacity: reportFile ? 1 : 0.5, cursor: reportFile ? 'pointer' : 'not-allowed' }}
                disabled={reportMutation.isPending || !reportFile}>
                {reportMutation.isPending ? t('pages.myInternship.reportUploading') : t('pages.myInternship.reportSubmitBtn')}
              </button>
            </form>
          </div>
        )}

        {/* Évaluation card */}
        {activeEval && (
          <div className="vf-card">
            <div className="ms-eval-header" style={{ padding: '1.125rem 1.375rem', borderBottom: '1px dashed #eaecf2' }}>
              <div className="vf-card-title-row" style={{ margin: 0 }}>
                <h3 className="vf-card-title" style={{ margin: 0 }}>{t('pages.myInternship.evalTitle')}</h3>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{activeEval.entreprise_nom}</span>
              </div>
            </div>

            <div className="ms-eval-body">
              {/* LEFT — Global score */}
              <div className="ms-eval-left">
                <span className="ms-section-label">{t('pages.myInternship.globalScore')}</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                  <span className="ms-serif" style={{ fontSize: '2.25rem', fontWeight: 700, color: '#1b6ef3', lineHeight: 1, letterSpacing: '-0.03em' }}>
                    {activeEval.note_globale}
                  </span>
                  <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500 }}>/20</span>
                </div>
                <div className="ms-score-track-v2" aria-label={`${activeEval.note_globale} / 20`}>
                  <svg viewBox="0 0 200 14" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="sg" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#1b6ef3" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                    </defs>
                    <line x1="4" y1="7" x2="196" y2="7" stroke="#e8edf5" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="4" y1="7" x2={4 + ((activeEval.note_globale / 20) * 192)} y2="7"
                      stroke="url(#sg)" strokeWidth="1.5" strokeLinecap="round"
                      style={{ transition: 'x2 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
                    <circle cx={4 + ((activeEval.note_globale / 20) * 192)} cy="7" r="4.5" fill="#1b6ef3" />
                  </svg>
                </div>
                {activeEval.commentaires && (
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', lineHeight: 1.5 }}>
                    "{activeEval.commentaires}"
                  </p>
                )}
              </div>

              {/* RIGHT — Sub-scores */}
              <div className="ms-eval-right">
                {[
                  [t('pages.myInternship.criteriaWork'),     activeEval.qualite_travail, '#1b6ef3'],
                  [t('pages.myInternship.criteriaBehavior'), activeEval.comportement,    '#6366f1'],
                  [t('pages.myInternship.criteriaAdapt'),    activeEval.adaptabilite,    '#f59e0b'],
                  [t('pages.myInternship.criteriaTeam'),     activeEval.travail_equipe,  '#16a34a'],
                ].map(([label, rawVal, color]) => {
                  const val = rawVal > 5 ? +(rawVal / 4).toFixed(1) : rawVal;
                  return (
                    <div key={label} style={{
                      background: '#f8fafc', borderRadius: 10,
                      border: '1.5px solid #eaecf2',
                      padding: '0.75rem 0.875rem',
                      display: 'flex', flexDirection: 'column', gap: '0.5rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>{label}</span>
                        </div>
                        <span className="ms-serif" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>
                          {val}<span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 400, fontFamily: 'Inter, sans-serif' }}>/5</span>
                        </span>
                      </div>
                      <div className="ms-subscore-bar-track">
                        <div className="ms-subscore-bar-fill" style={{
                          width: `${Math.min((val / 5) * 100, 100)}%`,
                          background: color,
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Awaiting evaluation */}
        {activeReport && !activeEval && (
          <div className="vf-card">
            <div style={{ padding: '1.125rem 1.375rem' }}>
              <div className="ms-banner ms-banner-warning" style={{ margin: 0 }}>
                <Clock size={18} className="ms-banner-icon" />
                <span>{t('pages.myInternship.awaitingEval')}</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MyInternship;
