import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../components/PageHeader';
import {
  AlertCircle, CheckCircle, XCircle, FileText,
  Calendar, Building2, Clock, Eye, Check, X,
  ClipboardList, Search, Hourglass, Lock,
} from 'lucide-react';
import api, { mediaUrl } from '../../services/api';
import { dateLocale } from '../../utils/dateLocale';

const FILTER_KEYS = [
  { key: 'all',                    labelKey: 'filterAll'         },
  { key: 'Signaler',               labelKey: 'filterReported'    },
  { key: 'En_attente_approbation', labelKey: 'filterToApprove'   },
  { key: 'Justifiée',              labelKey: 'filterJustified'   },
  { key: 'Non_justifiée',          labelKey: 'filterUnjustified' },
];

const STATUS = {
  Signaler:               { labelKey: 'statusReported',   bg: '#fef9c3', color: '#92400e', dot: '#f59e0b' },
  En_attente_approbation: { labelKey: 'statusToApprove',  bg: '#ede9fe', color: '#4338ca', dot: '#6366f1' },
  Justifiée:              { labelKey: 'statusJustified',  bg: '#dcfce7', color: '#15803d', dot: '#22c55e' },
  Non_justifiée:          { labelKey: 'statusUnjustified',bg: '#fee2e2', color: '#b91c1c', dot: '#ef4444' },
};

const AVT_BG   = ['#dbeafe', '#dcfce7', '#fef9c3', '#ede9fe', '#fee2e2', '#ffedd5'];
const AVT_TEXT = ['#1d4ed8', '#15803d', '#92400e', '#6d28d9', '#b91c1c', '#c2410c'];

const StatCard = ({ icon: Icon, label, value, iconBg, iconColor }) => (
  <div
    style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem', transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.15s' }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = iconColor; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
  >
    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={17} />
    </div>
    <div>
      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 500, marginTop: '0.15rem' }}>{label}</div>
    </div>
  </div>
);

export default function AbsencesChef() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]     = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['chef-absences'],
    queryFn: async () => {
      const r = await api.safeRequest(api.get('absences/'));
      if (r.ok) return r.value.data;
      throw r.error;
    },
  });

  const mutation = useMutation({
    mutationFn: async ({ id, statut }) => {
      const r = await api.safeRequest(api.post(`absences/${id}/valider/`, { statut }));
      if (r.ok) return r.value.data;
      throw r.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chef-absences'] });
      setSelected(null);
    },
  });

  const absences = Array.isArray(data) ? data : (data?.results || []);

  const stats = useMemo(() => ({
    total:       absences.length,
    pending:     absences.filter(a => a.statut === 'Signaler').length,
    toApprove:   absences.filter(a => a.statut === 'En_attente_approbation').length,
    justified:   absences.filter(a => a.statut === 'Justifiée').length,
    unjustified: absences.filter(a => a.statut === 'Non_justifiée').length,
  }), [absences]);

  const rows = useMemo(() => absences.filter(a => {
    const matchF = filter === 'all' || a.statut === filter;
    const q = search.toLowerCase();
    const matchS = !q || `${a.etudiant_prenom} ${a.etudiant_nom} ${a.entreprise_nom}`.toLowerCase().includes(q);
    return matchF && matchS;
  }), [absences, filter, search]);

  const getStatusLabel = (statusKey) => {
    const s = STATUS[statusKey];
    return s ? t(`pages.chefAbsences.${s.labelKey}`) : statusKey;
  };

  return (
    <div style={{ padding: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      <PageHeader
        eyebrow={t('pages.chefAbsences.eyebrow')}
        title={t('pages.chefAbsences.title')}
        subtitle={t('pages.chefAbsences.subtitle')}
      />

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
        <StatCard icon={ClipboardList} label={t('pages.chefAbsences.statTotal')}       value={stats.total}       iconBg="#eef2ff" iconColor="#6366f1" />
        <StatCard icon={Clock}         label={t('pages.chefAbsences.statReported')}     value={stats.pending}     iconBg="#fef9c3" iconColor="#92400e" />
        <StatCard icon={Hourglass}     label={t('pages.chefAbsences.statToApprove')}    value={stats.toApprove}   iconBg="#ede9fe" iconColor="#4338ca" />
        <StatCard icon={CheckCircle}   label={t('pages.chefAbsences.statJustified')}    value={stats.justified}   iconBg="#dcfce7" iconColor="#15803d" />
        <StatCard icon={XCircle}       label={t('pages.chefAbsences.statUnjustified')}  value={stats.unjustified} iconBg="#fee2e2" iconColor="#b91c1c" />
      </div>

      {/* ── Main panel ── */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>

        {/* Panel header */}
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ClipboardList size={18} color="#6366f1" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>{t('pages.chefAbsences.listTitle')}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 1 }}>
                {t('pages.chefAbsences.absencesShown', { count: rows.length })}
              </div>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)', pointerEvents: 'none' }} />
            <input
              type="text" placeholder={t('pages.chefAbsences.searchPlaceholder')} value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ height: 36, paddingLeft: '2.1rem', paddingRight: '0.85rem', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.85rem', outline: 'none', width: 230, color: 'var(--text-main)', boxSizing: 'border-box', background: 'var(--bg-card)' }}
            />
          </div>
        </div>

        {/* Filter pills */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '0.75rem 1.5rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {FILTER_KEYS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                height: 30, padding: '0 0.85rem', borderRadius: 6, border: '1px solid',
                fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                borderColor: filter === f.key ? '#6366f1' : 'var(--border)',
                background:  filter === f.key ? '#6366f1' : 'var(--bg-card)',
                color:       filter === f.key ? '#fff'    : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}
            >
              {t(`pages.chefAbsences.${f.labelKey}`)}
            </button>
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--border)' }} />

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface-section)' }}>
                {[
                  t('pages.chefAbsences.colStudent'),
                  t('pages.chefAbsences.colDate'),
                  t('pages.chefAbsences.colCompany'),
                  t('pages.chefAbsences.colStatus'),
                  '',
                ].map((h, i) => (
                  <th key={i} style={{
                    padding: '0.75rem 1.25rem', fontSize: '0.72rem', fontWeight: 700,
                    color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
                    textAlign: i === 4 ? 'right' : 'left', borderBottom: '1px solid var(--border)',
                    whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {[160, 100, 130, 110, 40].map((w, j) => (
                      <td key={j} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ height: 12, width: w, background: '#f1f5f9', borderRadius: 4 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={5} style={{ padding: '4rem', textAlign: 'center' }}>
                    <AlertCircle size={32} style={{ color: '#ef4444', display: 'block', margin: '0 auto 0.75rem' }} />
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t('pages.chefAbsences.errorLoading')}</span>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '4rem', textAlign: 'center' }}>
                    <ClipboardList size={32} style={{ color: 'var(--text-subtle)', display: 'block', margin: '0 auto 0.75rem' }} />
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-color)', fontSize: '0.9rem' }}>{t('pages.chefAbsences.noAbsences')}</p>
                    <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {search ? t('pages.chefAbsences.noSearchResults') : t('pages.chefAbsences.noDeptAbsence')}
                    </p>
                  </td>
                </tr>
              ) : rows.map(abs => {
                const s   = STATUS[abs.statut] || { labelKey: null, bg: '#f3f4f6', color: 'var(--text-muted)', dot: '#d1d5db' };
                const idx = (abs.etudiant_prenom?.charCodeAt(0) || 0) % AVT_BG.length;
                const ini = ((abs.etudiant_prenom?.[0] || '') + (abs.etudiant_nom?.[0] || '')).toUpperCase() || '?';
                const statusLabel = s.labelKey ? t(`pages.chefAbsences.${s.labelKey}`) : abs.statut;
                return (
                  <tr key={abs.id_absence}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                    style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.12s' }}
                  >
                    <td style={{ padding: '0.9rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 9, background: AVT_BG[idx], color: AVT_TEXT[idx], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.82rem', flexShrink: 0 }}>{ini}</div>
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>{abs.etudiant_prenom} {abs.etudiant_nom}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 1 }}>{abs.offre_titre || t('pages.chefAbsences.stage')}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.9rem 1.25rem', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.83rem', color: 'var(--text-color)' }}>
                        <Calendar size={13} color="#94a3b8" />
                        {new Date(abs.date_absence).toLocaleDateString(dateLocale(i18n.language), { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td style={{ padding: '0.9rem 1.25rem', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.83rem', color: 'var(--text-color)' }}>
                        <Building2 size={13} color="#94a3b8" />{abs.entreprise_nom}
                      </span>
                    </td>
                    <td style={{ padding: '0.9rem 1.25rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600, padding: '0.28rem 0.7rem', borderRadius: 999, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />{statusLabel}
                      </span>
                    </td>
                    <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelected(abs)}
                        style={{ width: 32, height: 32, border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#1e293b'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal ── */}
      {selected && (() => {
        const s          = STATUS[selected.statut] || { labelKey: null, bg: '#f3f4f6', color: 'var(--text-muted)', dot: '#d1d5db' };
        const idx        = (selected.etudiant_prenom?.charCodeAt(0) || 0) % AVT_BG.length;
        const ini        = ((selected.etudiant_prenom?.[0] || '') + (selected.etudiant_nom?.[0] || '')).toUpperCase() || '?';
        const canDecide  = selected.statut === 'Signaler' || selected.statut === 'En_attente_approbation';
        const isApproved = selected.statut === 'Justifiée';
        const statusLabel = s.labelKey ? t(`pages.chefAbsences.${s.labelKey}`) : selected.statut;
        return (
          <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
            <div onClick={e => e.stopPropagation()} className="glass-panel" style={{ width: '100%', maxWidth: 520, maxHeight: '90vh', borderRadius: 16, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

              {/* Header */}
              <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: AVT_BG[idx], color: AVT_TEXT[idx], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.05rem', flexShrink: 0 }}>{ini}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>{selected.etudiant_prenom} {selected.etudiant_nom}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{selected.offre_titre || t('pages.chefAbsences.stageEntreprise')}</div>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Meta chips */}
              <div style={{ borderTop: '1px solid #e2e8f0', padding: '0.75rem 1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flexShrink: 0, background: '#f8fafc' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.75rem', borderRadius: 999, border: '1px solid #e2e8f0', background: '#fff', fontSize: '0.78rem', color: 'var(--text-color)', fontWeight: 500 }}>
                  <Calendar size={12} color="#94a3b8" />{new Date(selected.date_absence).toLocaleDateString(dateLocale(i18n.language), { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.75rem', borderRadius: 999, border: '1px solid #e2e8f0', background: '#fff', fontSize: '0.78rem', color: 'var(--text-color)', fontWeight: 500 }}>
                  <Building2 size={12} color="#94a3b8" />{selected.entreprise_nom}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600, padding: '0.3rem 0.75rem', borderRadius: 999, background: s.bg, color: s.color }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />{statusLabel}
                </span>
              </div>

              {/* Body */}
              <div style={{ overflowY: 'auto', flex: 1, padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1rem 1.25rem' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem' }}>{t('pages.chefAbsences.reportedReason')}</div>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-color)', lineHeight: 1.65, fontStyle: 'italic' }}>"{selected.motif_signalement}"</p>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.4rem', textAlign: 'right' }}>— {selected.entreprise_nom}</div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1rem 1.25rem' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem' }}>{t('pages.chefAbsences.studentJustification')}</div>
                  {selected.justification ? (
                    <>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-color)', lineHeight: 1.65 }}>{selected.justification}</p>
                      {selected.document_justificatif && (
                        <a href={mediaUrl(selected.document_justificatif)} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.75rem', padding: '0.45rem 0.85rem', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 7, color: '#4338ca', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600 }}>
                          <FileText size={13} /> {t('pages.chefAbsences.seeDocument')}
                        </a>
                      )}
                    </>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertCircle size={14} color="#f59e0b" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '0.82rem', color: '#92400e', fontWeight: 500 }}>{t('pages.chefAbsences.noJustification')}</span>
                    </div>
                  )}
                </div>

                {selected.statut === 'En_attente_approbation' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 0.9rem', background: '#ede9fe', border: '1px solid #c4b5fd', borderRadius: 8 }}>
                    <Hourglass size={13} color="#4338ca" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.8rem', color: '#4338ca', fontWeight: 500 }}>{t('pages.chefAbsences.pendingMessage')}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ borderTop: '1px solid #e2e8f0', padding: '1rem 1.5rem', flexShrink: 0 }}>
                {canDecide ? (
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      onClick={() => mutation.mutate({ id: selected.id_absence, statut: 'Non_justifiée' })}
                      disabled={mutation.isPending}
                      style={{ flex: 1, height: 40, border: '1px solid #fecaca', borderRadius: 9, background: '#fff', cursor: mutation.isPending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: '#dc2626', transition: 'background 0.15s' }}
                      onMouseEnter={e => !mutation.isPending && (e.currentTarget.style.background = '#fff5f5')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                    >
                      <X size={14} /> {t('pages.chefAbsences.reject')}
                    </button>
                    <button
                      onClick={() => mutation.mutate({ id: selected.id_absence, statut: 'Justifiée' })}
                      disabled={mutation.isPending}
                      style={{ flex: 2, height: 40, border: 'none', borderRadius: 9, background: '#15803d', cursor: mutation.isPending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: '#fff', transition: 'background 0.15s' }}
                      onMouseEnter={e => !mutation.isPending && (e.currentTarget.style.background = '#166534')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#15803d')}
                    >
                      <Check size={14} /> {selected.justification ? t('pages.chefAbsences.approveJustification') : t('pages.chefAbsences.excuseWithout')}
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: 9, background: isApproved ? '#dcfce7' : '#fee2e2', border: `1px solid ${isApproved ? '#86efac' : '#fecaca'}` }}>
                      {isApproved ? <CheckCircle size={16} color="#15803d" /> : <XCircle size={16} color="#dc2626" />}
                      <span style={{ fontWeight: 600, fontSize: '0.875rem', color: isApproved ? '#15803d' : '#dc2626' }}>
                        {isApproved ? t('pages.chefAbsences.absenceJustified') : t('pages.chefAbsences.absenceUnjustified')}
                      </span>
                    </div>
                    {!isApproved && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.6rem', fontSize: '0.72rem', color: '#b91c1c' }}>
                        <Lock size={11} /> {t('pages.chefAbsences.abandonWarning')}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
