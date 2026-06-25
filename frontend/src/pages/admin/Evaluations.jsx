import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '../../components/PageHeader';
import { useTranslation } from 'react-i18next';
import {
  Search, Star, Building2, X, MessageSquare,
  ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown,
  ClipboardCheck, TrendingUp, ThumbsUp, Award,
} from 'lucide-react';
import api from '../../services/api';

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

const Stars = ({ value, max = 5, size = 13 }) => (
  <span style={{ display: 'inline-flex', gap: '2px', alignItems: 'center' }}>
    {Array.from({ length: max }).map((_, i) => (
      <Star key={i} size={size}
        fill={i < value ? '#f59e0b' : 'none'}
        stroke={i < value ? '#f59e0b' : 'var(--border)'}
      />
    ))}
    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-color)', marginLeft: '4px' }}>{value}/{max}</span>
  </span>
);

export default function AdminEvaluations() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(null);
  const [search, setSearch]     = useState('');
  const [sort, setSort]         = useState({ col: 'cree_le', dir: 'desc' });
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: raw, isLoading } = useQuery({
    queryKey: ['admin-all-evaluations'],
    queryFn: async () => {
      const r = await api.safeRequest(api.get('evaluations/'));
      if (r.ok) return r.value.data;
      throw r.error;
    },
  });
  const evals = Array.isArray(raw) ? raw : (raw?.results || []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = evals.filter(e =>
      `${e.etudiant_nom}`.toLowerCase().includes(q) ||
      `${e.entreprise_nom}`.toLowerCase().includes(q)
    );
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

  const recLabel = (val) => val === 'Oui'
    ? t('pages.adminEvaluations.recYes')
    : val === 'Non'
    ? t('pages.adminEvaluations.recNo')
    : val;

  const recStyle = {
    Oui: { bg: '#dcfce7', color: '#15803d', dot: '#22c55e' },
    Non: { bg: '#fee2e2', color: '#b91c1c', dot: '#ef4444' },
  };

  return (
    <div style={{ padding: '0 0 2rem' }}>

      <PageHeader
        eyebrow={t('nav.sections.administration')}
        title={t('pages.adminEvaluations.title')}
        subtitle={t('pages.adminEvaluations.subtitle')}
      />

      {/* Stat chips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: t('pages.adminEvaluations.statTotal'), value: evals.length,  color: '#6366f1', bg: '#eef2ff', icon: <ClipboardCheck size={18} /> },
          { label: t('pages.adminEvaluations.statAvg'),   value: avgScore,      color: '#1d4ed8', bg: '#dbeafe', icon: <Award size={18} /> },
          { label: t('pages.adminEvaluations.statRec'),   value: `${recRate}%`, color: '#15803d', bg: '#dcfce7', icon: <TrendingUp size={18} /> },
          { label: t('pages.adminEvaluations.statHigh'),  value: highScores,    color: '#92400e', bg: '#fef9c3', icon: <ThumbsUp size={18} /> },
        ].map(s => (
          <div
            key={s.label}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px',
              padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem',
              transition: 'transform 0.18s ease, box-shadow 0.18s ease',
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
            {t('pages.adminEvaluations.tableTitle')}{' '}
            <span style={{ color: 'var(--text-subtle)', fontWeight: 400 }}>({filtered.length})</span>
          </span>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)', pointerEvents: 'none' }} />
            <input
              type="text" placeholder={t('pages.adminEvaluations.searchPlaceholder')} value={search}
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
                <TH col="cree_le"        sort={sort} onSort={handleSort}>{t('pages.adminEvaluations.colDate')}</TH>
                <TH col="etudiant_nom"   sort={sort} onSort={handleSort}>{t('pages.adminEvaluations.colStudent')}</TH>
                <TH col="entreprise_nom" sort={sort} onSort={handleSort}>{t('pages.adminEvaluations.colCompany')}</TH>
                <TH col="note_globale"   sort={sort} onSort={handleSort}>{t('pages.adminEvaluations.colScore')}</TH>
                <TH col="recommanderait" sort={sort} onSort={handleSort}>{t('pages.adminEvaluations.colRec')}</TH>
                <TH style={{ width: '80px' }}>{t('pages.adminEvaluations.colActions')}</TH>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {[80, 160, 130, 70, 90, 70].map((w, j) => (
                      <td key={j} style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #f3f4f6' }}>
                        <div style={{ height: '13px', width: `${w}px`, background: 'var(--surface-section)', borderRadius: '4px' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.875rem' }}>
                    {t('pages.adminEvaluations.noEvals')}
                  </td>
                </tr>
              ) : rows.map(ev => {
                const hue = (ev.etudiant_nom?.charCodeAt(0) || 65) % 360;
                const sc = scoreColor(ev.note_globale);
                const rec = recStyle[ev.recommanderait];
                return (
                  <tr
                    key={ev.id_evaluation}
                    style={{ borderBottom: '1px solid #f3f4f6' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-section)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {ev.cree_le ? new Date(ev.cree_le).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0, background: `hsl(${hue},55%,90%)`, color: `hsl(${hue},55%,32%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem' }}>
                          {(ev.etudiant_nom?.[0] || '?').toUpperCase()}
                        </div>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                          {ev.etudiant_nom || '—'}
                        </span>
                      </div>
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
                          {recLabel(ev.recommanderait)}
                        </span>
                      ) : <span style={{ color: 'var(--text-subtle)' }}>—</span>}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <button
                        onClick={() => setSelected(ev)}
                        style={{ height: '30px', padding: '0 0.75rem', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-card)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-color)', whiteSpace: 'nowrap' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-section)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                      >
                        {t('pages.adminEvaluations.viewBtn')}
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
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('pages.adminEvaluations.rows')}</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                style={{ height: '28px', padding: '0 0.5rem', border: '1px solid var(--border)', borderRadius: '5px', fontSize: '0.8rem', color: 'var(--text-color)', background: 'var(--bg-card)', cursor: 'pointer', outline: 'none' }}
              >
                {PAGE_SIZES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, filtered.length)} {t('pages.adminEvaluations.of')} {filtered.length}
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
                    style={{ height: '28px', minWidth: '28px', padding: '0 0.25rem', border: `1px solid ${page === n ? '#1b6ef3' : 'var(--border)'}`, borderRadius: '5px', background: page === n ? '#1b6ef3' : '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: page === n ? 600 : 400, color: page === n ? '#fff' : 'var(--text-color)' }}
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
      {selected && createPortal(
        <div
          onClick={e => e.target === e.currentTarget && setSelected(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1.5rem' }}
        >
          <div style={{ background: 'var(--bg-card)', borderRadius: '10px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>

            {/* Modal header */}
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{t('pages.adminEvaluations.modal.title')}</span>
              <button onClick={() => setSelected(null)} style={{ width: '28px', height: '28px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <X size={14} />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: '1.25rem' }}>

              {/* Identity */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[
                  { label: t('pages.adminEvaluations.modal.student'), value: selected.etudiant_nom },
                  { label: t('pages.adminEvaluations.modal.company'), value: selected.entreprise_nom },
                ].map(item => (
                  <div key={item.label} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '0.85rem 1rem' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>{item.label}</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>{item.value || '—'}</div>
                  </div>
                ))}
              </div>

              {/* Score + Recommendation */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>{t('pages.adminEvaluations.modal.globalScore')}</div>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: scoreColor(selected.note_globale).color }}>
                      {selected.note_globale}<span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-subtle)' }}>/20</span>
                    </span>
                  </div>
                </div>
                <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '0.85rem 1rem' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>{t('pages.adminEvaluations.modal.recommendation')}</div>
                  {recStyle[selected.recommanderait] ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: 600, padding: '0.2rem 0.55rem', borderRadius: '999px', background: recStyle[selected.recommanderait].bg, color: recStyle[selected.recommanderait].color }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: recStyle[selected.recommanderait].dot }} />
                      {recLabel(selected.recommanderait)}
                    </span>
                  ) : '—'}
                </div>
              </div>

              {/* Criteria */}
              <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', marginBottom: '1.25rem' }}>
                {[
                  [t('pages.adminEvaluations.modal.behavior'),    selected.comportement],
                  [t('pages.adminEvaluations.modal.adaptability'), selected.adaptabilite],
                  [t('pages.adminEvaluations.modal.teamwork'),     selected.travail_equipe],
                  [t('pages.adminEvaluations.modal.workQuality'),  selected.qualite_travail],
                ].map(([label, val], i, arr) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: i < arr.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-color)', fontWeight: 500 }}>{label}</span>
                    <Stars value={val} />
                  </div>
                ))}
              </div>

              {/* Comments */}
              {selected.commentaires && (
                <div style={{ background: 'var(--surface-section)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                    <MessageSquare size={13} color="#6b7280" />
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('pages.adminEvaluations.modal.tutorComments')}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-color)', lineHeight: 1.65, fontStyle: 'italic' }}>
                    "{selected.commentaires}"
                  </p>
                </div>
              )}

              {/* Close */}
              <button
                onClick={() => setSelected(null)}
                style={{ width: '100%', height: '38px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-card)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-color)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-section)'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                {t('pages.adminEvaluations.modal.close')}
              </button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
}
