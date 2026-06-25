import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader';
import {
  Search, Building2, X, MessageSquare,
  ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown,
  ClipboardCheck, TrendingUp, ThumbsUp, Award,
} from 'lucide-react';
import api from '../services/api';

const PAGE_SIZES = [5, 10, 25, 50];

const scoreColor = (n) => {
  if (n >= 16) return { color: '#15803d', bg: '#dcfce7' };
  if (n >= 12) return { color: '#1d4ed8', bg: '#dbeafe' };
  if (n >= 8)  return { color: '#92400e', bg: '#fef9c3' };
  return           { color: '#b91c1c', bg: '#fee2e2' };
};

const TH = ({ children, col, sort, onSort, style = {} }) => {
  const active = sort?.col === col;
  return (
    <th
      onClick={() => col && onSort?.(col)}
      style={{
        padding: '0.75rem 1rem', fontSize: '0.72rem', fontWeight: 700,
        color: active ? 'var(--text-main)' : 'var(--text-muted)', textTransform: 'uppercase',
        letterSpacing: '0.05em', textAlign: 'left', background: 'var(--surface-section)',
        borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
        cursor: col ? 'pointer' : 'default', userSelect: 'none',
        ...style,
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
        {children}
        {col && (active
          ? sort.dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />
          : <ArrowUpDown size={11} style={{ opacity: 0.35 }} />
        )}
      </span>
    </th>
  );
};

const Stars = ({ value, max = 5 }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
    fontSize: '0.82rem', fontWeight: '700', color: '#f59e0b',
  }}>
    {value}
    <span style={{ color: 'var(--text-subtle)', fontWeight: '400' }}>/{max}</span>
  </span>
);

export default function Evaluations() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(null);
  const [search, setSearch]     = useState('');
  const [sort, setSort]         = useState({ col: 'date_evaluation', dir: 'desc' });
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const REC = {
    Oui:         { bg: '#dcfce7', color: '#15803d', dot: '#22c55e', label: t('pages.evaluations.rec.Oui') },
    Non:         { bg: '#fee2e2', color: '#b91c1c', dot: '#ef4444', label: t('pages.evaluations.rec.Non') },
    'Peut-être': { bg: '#fef9c3', color: '#92400e', dot: '#f59e0b', label: t('pages.evaluations.rec.Peut-être') },
  };

  const { data: raw, isLoading } = useQuery({
    queryKey: ['my-evaluations'],
    queryFn: () => api.get('evaluations/').then(r => r.data),
  });
  const evals = Array.isArray(raw) ? raw : (raw?.results || []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = evals.filter(e => `${e.entreprise_nom}`.toLowerCase().includes(q));
    list = [...list].sort((a, b) => {
      let av = a[sort.col] ?? '', bv = b[sort.col] ?? '';
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      return sort.dir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return list;
  }, [evals, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (col) => {
    setSort(s => ({ col, dir: s.col === col && s.dir === 'asc' ? 'desc' : 'asc' }));
    setPage(1);
  };

  const avgScore = evals.length
    ? (evals.reduce((s, e) => s + (e.note_globale || 0), 0) / evals.length).toFixed(1)
    : '—';
  const recRate = evals.length
    ? Math.round((evals.filter(e => e.recommanderait === 'Oui').length / evals.length) * 100)
    : 0;
  const highScores = evals.filter(e => (e.note_globale || 0) >= 15).length;

  return (
    <div style={{ padding: '0 0 2rem' }}>
      <style>{`
        .ev-stat-card {
          transition: box-shadow .2s ease, transform .2s ease, border-color .2s ease;
        }
        .ev-stat-card:hover {
          box-shadow: 0 10px 15px -3px rgba(0,0,0,.08), 0 4px 6px -2px rgba(0,0,0,.04);
          transform: translateY(-2px);
          border-color: #CBD5E1 !important;
        }
      `}</style>

      <PageHeader
        eyebrow={t('pages.evaluations.eyebrow')}
        title={t('pages.evaluations.title')}
        subtitle={t('pages.evaluations.subtitle')}
      />

      {/* Stat chips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: t('pages.evaluations.statTotal'), value: evals.length,  color: '#6366f1', bg: '#eef2ff', icon: <ClipboardCheck size={18} /> },
          { label: t('pages.evaluations.statAvg'),   value: avgScore,       color: '#1d4ed8', bg: '#dbeafe', icon: <Award size={18} /> },
          { label: t('pages.evaluations.statRec'),   value: `${recRate}%`,  color: '#15803d', bg: '#dcfce7', icon: <TrendingUp size={18} /> },
          { label: t('pages.evaluations.statHigh'),  value: highScores,     color: '#92400e', bg: '#fef9c3', icon: <ThumbsUp size={18} /> },
        ].map(s => (
          <div key={s.label} className="ev-stat-card" style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px',
            padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem',
          }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{
          padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
            {t('pages.evaluations.tableTitle')}{' '}
            <span style={{ color: 'var(--text-subtle)', fontWeight: 400 }}>({filtered.length})</span>
          </span>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)', pointerEvents: 'none' }} />
            <input
              type="text" placeholder={t('pages.evaluations.searchPlaceholder')} value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ height: '34px', paddingLeft: '2rem', paddingRight: '0.75rem', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.85rem', outline: 'none', width: '230px', color: 'var(--text-main)', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <TH col="date_evaluation" sort={sort} onSort={handleSort}>{t('pages.evaluations.colDate')}</TH>
                <TH col="entreprise_nom"  sort={sort} onSort={handleSort}>{t('pages.evaluations.colCompany')}</TH>
                <TH col="note_globale"    sort={sort} onSort={handleSort}>{t('pages.evaluations.colScore')}</TH>
                <TH col="recommanderait"  sort={sort} onSort={handleSort}>{t('pages.evaluations.colRec')}</TH>
                <TH style={{ width: '80px' }}>{t('pages.evaluations.colActions')}</TH>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {[80, 160, 70, 90, 70].map((w, j) => (
                      <td key={j} style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #f3f4f6' }}>
                        <div style={{ height: '13px', width: `${w}px`, background: 'var(--surface-section)', borderRadius: '4px' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.875rem' }}>
                    {evals.length === 0
                      ? t('pages.evaluations.noEvals')
                      : t('pages.evaluations.noResults')}
                  </td>
                </tr>
              ) : rows.map(ev => {
                const sc = scoreColor(ev.note_globale);
                const rec = REC[ev.recommanderait];
                return (
                  <tr
                    key={ev.id_evaluation}
                    style={{ borderBottom: '1px solid #f3f4f6' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-section)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {ev.date_evaluation ? new Date(ev.date_evaluation).toLocaleDateString(undefined) : '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.875rem', color: 'var(--text-color)', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Building2 size={13} color="#9ca3af" />
                        {ev.entreprise_nom || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.82rem', fontWeight: 700, padding: '0.25rem 0.65rem', borderRadius: '6px', background: sc.bg, color: sc.color, whiteSpace: 'nowrap' }}>
                        {ev.note_globale ?? '—'}
                        <span style={{ fontWeight: 400, opacity: 0.7, fontSize: '0.7rem' }}>/20</span>
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {rec ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.65rem', borderRadius: '999px', background: rec.bg, color: rec.color }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: rec.dot, flexShrink: 0 }} />
                          {rec.label}
                        </span>
                      ) : <span style={{ color: 'var(--text-subtle)' }}>—</span>}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <button
                        onClick={() => setSelected(ev)}
                        style={{ height: '30px', padding: '0 0.75rem', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-card)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-color)', whiteSpace: 'nowrap' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-section)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; }}
                      >
                        {t('pages.evaluations.viewBtn')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && filtered.length > 0 && (
          <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('pages.evaluations.rows')}</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                style={{ height: '28px', padding: '0 0.5rem', border: '1px solid var(--border)', borderRadius: '5px', fontSize: '0.8rem', color: 'var(--text-color)', background: 'var(--bg-card)', cursor: 'pointer', outline: 'none' }}
              >
                {PAGE_SIZES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, filtered.length)} {t('pages.evaluations.of')} {filtered.length}
            </span>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ height: '28px', width: '28px', border: '1px solid var(--border)', borderRadius: '5px', background: 'var(--bg-card)', cursor: page === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: page === 1 ? 'var(--border)' : 'var(--text-color)' }}
              >
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
                    style={{ height: '28px', minWidth: '28px', padding: '0 0.25rem', border: `1px solid ${page === n ? '#1b6ef3' : 'var(--border)'}`, borderRadius: '5px', background: page === n ? '#1b6ef3' : 'var(--bg-card)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: page === n ? 600 : 400, color: page === n ? '#fff' : 'var(--text-color)' }}
                  >
                    {n}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ height: '28px', width: '28px', border: '1px solid var(--border)', borderRadius: '5px', background: 'var(--bg-card)', cursor: page === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: page === totalPages ? 'var(--border)' : 'var(--text-color)' }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div
          onClick={e => e.target === e.currentTarget && setSelected(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}
        >
          <div style={{ background: 'var(--bg-card)', borderRadius: '10px', width: '100%', maxWidth: '480px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' }}>

            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>{t('pages.evaluations.modal.title')}</span>
              <button onClick={() => setSelected(null)} style={{ width: '26px', height: '26px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <X size={13} />
              </button>
            </div>

            <div style={{ padding: '1rem', overflowY: 'auto', flex: 1 }}>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {[
                  { label: t('pages.evaluations.modal.company'), value: selected.entreprise_nom },
                  { label: t('pages.evaluations.modal.date'), value: selected.date_evaluation ? new Date(selected.date_evaluation).toLocaleDateString(undefined) : '—' },
                ].map(item => (
                  <div key={item.label} style={{ border: '1px solid var(--border)', borderRadius: '7px', padding: '0.55rem 0.75rem' }}>
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>{item.label}</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>{item.value || '—'}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div style={{ border: '1px solid var(--border)', borderRadius: '7px', padding: '0.55rem 0.75rem' }}>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>{t('pages.evaluations.modal.globalScore')}</div>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800, color: scoreColor(selected.note_globale).color }}>
                    {selected.note_globale}<span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-subtle)' }}>/20</span>
                  </span>
                </div>
                <div style={{ border: '1px solid var(--border)', borderRadius: '7px', padding: '0.55rem 0.75rem' }}>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>{t('pages.evaluations.modal.recommendation')}</div>
                  {REC[selected.recommanderait] ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600, padding: '0.18rem 0.5rem', borderRadius: '999px', background: REC[selected.recommanderait].bg, color: REC[selected.recommanderait].color }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: REC[selected.recommanderait].dot }} />
                      {REC[selected.recommanderait].label}
                    </span>
                  ) : '—'}
                </div>
              </div>

              <div style={{ border: '1px solid var(--border)', borderRadius: '7px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                {[
                  [t('pages.evaluations.modal.behavior'),    selected.comportement],
                  [t('pages.evaluations.modal.adaptability'), selected.adaptabilite],
                  [t('pages.evaluations.modal.teamwork'),     selected.travail_equipe],
                  [t('pages.evaluations.modal.workQuality'),  selected.qualite_travail],
                ].map(([label, val], i, arr) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.55rem 0.75rem', borderBottom: i < arr.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-color)', fontWeight: 500 }}>{label}</span>
                    <Stars value={val} />
                  </div>
                ))}
              </div>

              {selected.commentaires && (
                <div style={{ background: 'var(--surface-section)', border: '1px solid var(--border)', borderRadius: '7px', padding: '0.65rem 0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                    <MessageSquare size={12} color="#6b7280" />
                    <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('pages.evaluations.modal.tutorComments')}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-color)', lineHeight: 1.6, fontStyle: 'italic' }}>
                    "{selected.commentaires}"
                  </p>
                </div>
              )}

              <button
                onClick={() => setSelected(null)}
                style={{ width: '100%', height: '34px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-card)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-color)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-section)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
              >
                {t('pages.evaluations.modal.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
