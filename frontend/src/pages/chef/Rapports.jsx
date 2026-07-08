import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../components/PageHeader';
import {
  FileSpreadsheet, Eye, Calendar,
  Clock, Search, GraduationCap, CheckCircle2,
  X, ChevronLeft, ChevronRight, Download, Building2,
} from 'lucide-react';
import api, { mediaUrl } from '../../services/api';
import { dateLocale } from '../../utils/dateLocale';

const PAGE_SIZES = [10, 25, 50];

const FILTER_KEYS = [
  { key: 'all',      labelKey: 'filterAll'      },
  { key: 'graded',   labelKey: 'filterGraded'   },
  { key: 'ungraded', labelKey: 'filterUngraded' },
];

const AVT_BG   = ['#dbeafe', '#dcfce7', '#fef9c3', '#ede9fe', '#fee2e2', '#ffedd5'];
const AVT_TEXT = ['#1d4ed8', '#15803d', '#92400e', '#6d28d9', '#b91c1c', '#c2410c'];

const scoreColor = (n) => {
  if (n == null) return { color: 'var(--text-muted)', bg: 'transparent' };
  if (n >= 16) return { color: '#15803d', bg: '#dcfce7' };
  if (n >= 12) return { color: '#1d4ed8', bg: '#dbeafe' };
  if (n >= 8)  return { color: '#92400e', bg: '#fef9c3' };
  return           { color: '#b91c1c', bg: '#fee2e2' };
};

const RECO_CFG = {
  'Oui':       { color: '#15803d', bg: '#dcfce7', dot: '#22c55e' },
  'Non':       { color: '#b91c1c', bg: '#fee2e2', dot: '#ef4444' },
  'Peut-être': { color: '#92400e', bg: '#fef9c3', dot: '#f59e0b' },
};

const downloadFile = async (url, filename) => {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename || 'rapport';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error('Download failed', err);
  }
};

const StatCard = ({ icon: Icon, label, value, iconBg, iconColor }) => (
  <div
    style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem', transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.15s' }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = iconColor; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
  >
    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={17} />
    </div>
    <div>
      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '0.15rem' }}>{label}</div>
    </div>
  </div>
);

const Rapports = () => {
  const { t, i18n } = useTranslation();
  const [selected, setSelected]       = useState(null);
  const [filter, setFilter]           = useState('all');
  const [search, setSearch]           = useState('');
  const [page, setPage]               = useState(1);
  const [pageSize, setPageSize]       = useState(10);
  const { data: rapportsData, isLoading, isError } = useQuery({
    queryKey: ['rapports-departement'],
    queryFn: async () => {
      const r = await api.safeRequest(api.get('rapports/'));
      if (r.ok) return r.value.data;
      throw r.error;
    },
  });
  const rapports = Array.isArray(rapportsData) ? rapportsData : (rapportsData?.results || []);

  const withGrade = rapports.filter(r => r.note_entreprise != null).length;
  const avgGrade  = withGrade
    ? (rapports.filter(r => r.note_entreprise != null).reduce((s, r) => s + r.note_entreprise, 0) / withGrade).toFixed(1)
    : 'N/A';

  const rows = useMemo(() => {
    const q = search.toLowerCase();
    return rapports.filter(r => {
      const matchF = filter === 'all' || (filter === 'graded' && r.note_entreprise != null) || (filter === 'ungraded' && r.note_entreprise == null);
      const matchS = !q || (r.etudiant_nom || '').toLowerCase().includes(q) || (r.offre_titre || '').toLowerCase().includes(q);
      return matchF && matchS;
    });
  }, [rapports, filter, search]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows   = rows.slice((page - 1) * pageSize, page * pageSize);

  const handleOpenDetail = (rap) => {
    setSelected(rap);
  };

  return (
    <div style={{ padding: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      <PageHeader
        eyebrow={t('pages.chefRapports.eyebrow')}
        title={t('pages.chefRapports.title')}
        subtitle={t('pages.chefRapports.subtitle')}
      />

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <StatCard icon={FileSpreadsheet} label={t('pages.chefRapports.statTotalReports')} value={rapports.length}            iconBg="#eef2ff" iconColor="#6366f1" />
        <StatCard icon={CheckCircle2}    label={t('pages.chefRapports.statGradesGiven')} value={withGrade}                   iconBg="#dcfce7" iconColor="#15803d" />
        <StatCard icon={Clock}           label={t('pages.chefRapports.statNoGrade')}     value={rapports.length - withGrade} iconBg="#fef9c3" iconColor="#92400e" />
        <StatCard icon={GraduationCap}   label={t('pages.chefRapports.statAverage')}     value={avgGrade}                   iconBg="#dbeafe" iconColor="#1d4ed8" />
      </div>

      {/* ── Main panel ── */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>

        {/* Panel header */}
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FileSpreadsheet size={18} color="#6366f1" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>{t('pages.chefRapports.panelTitle')}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 1 }}>
                {t('pages.chefRapports.reportCount', { count: rows.length })}
              </div>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)', pointerEvents: 'none' }} />
            <input
              type="text" placeholder={t('pages.chefRapports.searchPlaceholder')} value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ height: 36, paddingLeft: '2.1rem', paddingRight: '0.85rem', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.85rem', outline: 'none', width: 230, color: 'var(--text-main)', boxSizing: 'border-box', background: 'var(--bg-card)' }}
            />
          </div>
        </div>

        {/* Filter pills */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '0.75rem 1.5rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {FILTER_KEYS.map(f => (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setPage(1); }}
              style={{
                height: 30, padding: '0 0.85rem', borderRadius: 6, border: '1px solid',
                fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                borderColor: filter === f.key ? '#6366f1' : 'var(--border)',
                background:  filter === f.key ? '#6366f1' : 'var(--bg-card)',
                color:       filter === f.key ? '#fff'    : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}
            >
              {t(`pages.chefRapports.${f.labelKey}`)}
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
                  t('pages.chefRapports.colStudent'),
                  t('pages.chefRapports.colOffer'),
                  t('pages.chefRapports.colSubmitted'),
                  t('pages.chefRapports.colEvalEntreprise'),
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
                    {[160, 180, 100, 80, 40].map((w, j) => (
                      <td key={j} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ height: 12, width: w, background: 'var(--surface-section)', borderRadius: 4 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={5} style={{ padding: '4rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t('pages.chefRapports.errorLoading')}</span>
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '4rem', textAlign: 'center' }}>
                    <FileSpreadsheet size={32} style={{ color: 'var(--text-subtle)', display: 'block', margin: '0 auto 0.75rem' }} />
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-color)', fontSize: '0.9rem' }}>{t('pages.chefRapports.noReports')}</p>
                    <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {search ? t('pages.chefRapports.noSearchResults', { defaultValue: '' }) : ''}
                    </p>
                  </td>
                </tr>
              ) : pageRows.map(rap => {
                const idx = (rap.etudiant_nom?.charCodeAt(0) || 0) % AVT_BG.length;
                const ini = (rap.etudiant_nom?.[0] || 'É').toUpperCase();
                return (
                  <tr key={rap.id || rap.id_rapport}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-section)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                    style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.12s' }}
                  >
                    <td style={{ padding: '0.9rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 9, background: AVT_BG[idx], color: AVT_TEXT[idx], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.82rem', flexShrink: 0 }}>{ini}</div>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>{rap.etudiant_nom}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.9rem 1.25rem', fontSize: '0.83rem', color: 'var(--text-muted)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {rap.offre_titre || '—'}
                    </td>
                    <td style={{ padding: '0.9rem 1.25rem', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.83rem', color: 'var(--text-color)' }}>
                        <Calendar size={13} color="var(--text-muted)" />
                        {new Date(rap.soumis_le).toLocaleDateString(dateLocale(i18n.language), { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td style={{ padding: '0.9rem 1.25rem' }}>
                      {rap.note_entreprise != null ? (() => {
                        const esc = scoreColor(rap.note_entreprise);
                        return (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15rem', fontSize: '0.85rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: 7, background: esc.bg, color: esc.color }}>
                            {rap.note_entreprise}<span style={{ fontWeight: 400, opacity: 0.65, fontSize: '0.7rem' }}>/20</span>
                          </span>
                        );
                      })() : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'var(--surface-section)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.2rem 0.55rem' }}>{t('pages.chefRapports.noEvalEntreprise')}</span>
                      )}
                    </td>
                    <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>
                      <button
                        onClick={() => handleOpenDetail(rap)}
                        style={{ width: 32, height: 32, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-card)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-section)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-main)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
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

        {/* Pagination */}
        {!isLoading && rows.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border)', padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('pages.chefRapports.rows')}</span>
              <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                style={{ height: 28, padding: '0 0.5rem', border: '1px solid var(--border)', borderRadius: 6, fontSize: '0.8rem', color: 'var(--text-color)', background: 'var(--bg-card)', cursor: 'pointer', outline: 'none' }}>
                {PAGE_SIZES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, rows.length)} {t('pages.chefRapports.of')} {rows.length}
            </span>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ height: 28, width: 28, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg-card)', cursor: page === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: page === 1 ? 'var(--text-subtle)' : 'var(--text-color)' }}>
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let n = i + 1;
                if (totalPages > 5) {
                  if (page <= 3) n = i + 1;
                  else if (page >= totalPages - 2) n = totalPages - 4 + i;
                  else n = page - 2 + i;
                }
                return (
                  <button key={n} onClick={() => setPage(n)}
                    style={{ height: 28, minWidth: 28, padding: '0 0.25rem', border: `1px solid ${page === n ? '#6366f1' : 'var(--border)'}`, borderRadius: 6, background: page === n ? '#6366f1' : 'var(--bg-card)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: page === n ? 600 : 400, color: page === n ? '#fff' : 'var(--text-color)' }}>
                    {n}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ height: 28, width: 28, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg-card)', cursor: page === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: page === totalPages ? 'var(--text-subtle)' : 'var(--text-color)' }}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {selected && (() => {
        const idx = (selected.etudiant_nom?.charCodeAt(0) || 0) % AVT_BG.length;
        const ini = (selected.etudiant_nom?.[0] || 'É').toUpperCase();
        const url = selected.fichier ? mediaUrl(selected.fichier) : null;
        const ext = url ? url.split('.').pop().toLowerCase() : '';
        const isDocx = ext === 'docx' || ext === 'doc';
        const isPdf  = ext === 'pdf';
        const iconBg    = isPdf ? '#fee2e2' : isDocx ? '#dbeafe' : '#f3f4f6';
        const iconColor = isPdf ? '#b91c1c' : isDocx ? '#1d4ed8' : '#6b7280';
        const filename  = url ? url.split('/').pop() : '';
        const fileLabel = isPdf
          ? t('pages.chefRapports.reportFilePdf')
          : isDocx
          ? t('pages.chefRapports.reportFileWord')
          : t('pages.chefRapports.reportFileOther', { ext: ext.toUpperCase() || 'File' });

        return (
          <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
            <div onClick={e => e.stopPropagation()} className="glass-panel" style={{ width: '100%', maxWidth: 560, maxHeight: '90vh', borderRadius: 16, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

              {/* Header */}
              <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: AVT_BG[idx], color: AVT_TEXT[idx], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.05rem', flexShrink: 0 }}>{ini}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>{selected.etudiant_nom}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{selected.offre_titre || '—'}</div>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-section)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Meta chips */}
              <div style={{ borderTop: '1px solid var(--border)', padding: '0.75rem 1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flexShrink: 0, background: 'var(--surface-section)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.75rem', borderRadius: 999, border: '1px solid var(--border)', background: 'var(--bg-card)', fontSize: '0.78rem', color: 'var(--text-color)', fontWeight: 500 }}>
                  <Calendar size={12} color="var(--text-muted)" />
                  {new Date(selected.soumis_le).toLocaleDateString(dateLocale(i18n.language), { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>

              {/* Body */}
              <div style={{ overflowY: 'auto', flex: 1, padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                {/* File card */}
                {url ? (
                  <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--surface-section)' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileSpreadsheet size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 3 }}>{fileLabel}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{filename}</div>
                    </div>
                    <button
                      onClick={() => downloadFile(url, filename)}
                      style={{ height: 36, padding: '0 1rem', borderRadius: 8, background: '#1b6ef3', color: '#fff', fontWeight: 600, fontSize: '0.8rem', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0, transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#1558c0'}
                      onMouseLeave={e => e.currentTarget.style.background = '#1b6ef3'}
                    >
                      <Download size={13} /> {t('pages.chefRapports.downloadReport')}
                    </button>
                  </div>
                ) : (
                  <div style={{ border: '1px dashed var(--border)', borderRadius: 10, padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--surface-section)' }}>
                    <FileSpreadsheet size={28} style={{ opacity: 0.3, display: 'block', margin: '0 auto 0.5rem' }} />
                    <p style={{ margin: 0, fontSize: '0.83rem' }}>{t('pages.chefRapports.noFile')}</p>
                  </div>
                )}

                {/* Student summary */}
                {selected.resume && (
                  <div style={{ background: 'var(--surface-section)', border: '1px solid var(--border)', borderRadius: 10, padding: '1rem 1.25rem' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem' }}>{t('pages.chefRapports.studentSummary')}</div>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-color)', lineHeight: 1.7, fontStyle: 'italic' }}>"{selected.resume}"</p>
                  </div>
                )}

                {/* Enterprise evaluation */}
                <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ padding: '0.75rem 1.25rem', background: 'var(--surface-section)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Building2 size={14} color="#6366f1" />
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{t('pages.chefRapports.evalEntrepriseSection')}</span>
                  </div>
                  <div style={{ padding: '1rem 1.25rem' }}>
                    {selected.note_entreprise != null ? (() => {
                      const esc = scoreColor(selected.note_entreprise);
                      const reco = selected.recommandation_entreprise;
                      const recoCfg = RECO_CFG[reco];
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>{t('pages.chefRapports.noteEntreprise')}</div>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '1rem', fontWeight: 800, padding: '0.3rem 0.75rem', borderRadius: 8, background: esc.bg, color: esc.color }}>
                              {selected.note_entreprise}<span style={{ fontWeight: 400, opacity: 0.65, fontSize: '0.75rem' }}>/20</span>
                            </span>
                          </div>
                          {recoCfg && (
                            <div>
                              <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>{t('pages.chefRapports.recommandation')}</div>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.75rem', borderRadius: 999, background: recoCfg.bg, color: recoCfg.color, fontSize: '0.8rem', fontWeight: 600 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: recoCfg.dot, flexShrink: 0 }} />
                                {reco}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })() : (
                      <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{t('pages.chefRapports.noEvalEntreprise')}</p>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Rapports;
