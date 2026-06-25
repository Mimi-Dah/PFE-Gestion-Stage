import { useState, useMemo } from 'react';
import PageHeader from '../../components/PageHeader';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Activity, UserPlus, Briefcase, FileText,
  Search, RefreshCw, AlertCircle,
  ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown,
} from 'lucide-react';
import api from '../../services/api';

const PAGE_SIZES = [10, 25, 50, 100];

const TYPE_ICONS = {
  user_registered: UserPlus,
  offre:           Briefcase,
  candidature:     FileText,
};

const TYPE_STYLE = {
  user_registered: { bg: '#dbeafe', color: '#1d4ed8', dot: '#3b82f6' },
  offre:           { bg: '#ede9fe', color: '#6d28d9', dot: '#8b5cf6' },
  candidature:     { bg: '#fef9c3', color: '#92400e', dot: '#f59e0b' },
};
const DEFAULT_STYLE = { bg: '#f3f4f6', color: 'var(--text-color)', dot: 'var(--text-subtle)' };

const LOCALE_MAP = { fr: 'fr-FR', en: 'en-US', ar: 'ar-DZ' };

function timeAgo(iso, t, lang) {
  const secs = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (secs < 60)  return t('pages.adminLogs.timeAgo.justNow');
  const m = Math.floor(secs / 60);
  if (m < 60)     return t('pages.adminLogs.timeAgo.minutesAgo', { m });
  const h = Math.floor(m / 60);
  if (h < 24)     return t('pages.adminLogs.timeAgo.hoursAgo', { h });
  const d = Math.floor(h / 24);
  if (d === 1)    return t('pages.adminLogs.timeAgo.yesterday');
  if (d < 7)      return t('pages.adminLogs.timeAgo.daysAgo', { d });
  return new Date(iso).toLocaleDateString(LOCALE_MAP[lang] || 'en-US');
}

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

export default function AdminLogs() {
  const { t, i18n } = useTranslation();
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch]         = useState('');
  const [sort, setSort]             = useState({ col: 'date', dir: 'desc' });
  const [page, setPage]             = useState(1);
  const [pageSize, setPageSize]     = useState(25);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['admin-activity'],
    queryFn: () => api.get('analytics/admin/activity/').then(r => r.data.activities),
    refetchInterval: 30000,
  });
  const all = data ?? [];

  const typeLabel = (type) => {
    if (type === 'user_registered') return t('pages.adminLogs.typeAccount');
    if (type === 'offre')           return t('pages.adminLogs.typeOffer');
    if (type === 'candidature')     return t('pages.adminLogs.typeApplication');
    return t('pages.adminLogs.typeDefault');
  };

  const counts = useMemo(() => all.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + 1;
    return acc;
  }, {}), [all]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = all.filter(a => {
      const matchType = typeFilter === 'all' || a.type === typeFilter;
      const matchQ    = !q || a.label?.toLowerCase().includes(q) || a.detail?.toLowerCase().includes(q);
      return matchType && matchQ;
    });
    list = [...list].sort((a, b) => {
      let av = a[sort.col] ?? '', bv = b[sort.col] ?? '';
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      return sort.dir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return list;
  }, [all, typeFilter, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (col) => {
    setSort(s => ({ col, dir: s.col === col && s.dir === 'asc' ? 'desc' : 'asc' }));
    setPage(1);
  };

  const typeFilters = [
    { id: 'all',             label: t('pages.adminLogs.filterAll') },
    { id: 'user_registered', label: t('pages.adminLogs.filterAccounts') },
    { id: 'offre',           label: t('pages.adminLogs.filterOffers') },
    { id: 'candidature',     label: t('pages.adminLogs.filterApplications') },
  ];

  return (
    <div style={{ padding: '0 0 2rem' }}>

      <PageHeader
        eyebrow={t('nav.sections.administration')}
        title={t('pages.adminLogs.title')}
        subtitle={t('pages.adminLogs.subtitle')}
        actions={
          <button
            onClick={() => refetch()} disabled={isFetching}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', height: '36px', padding: '0 1rem', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-card)', cursor: isFetching ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-color)' }}
            onMouseEnter={e => !isFetching && (e.currentTarget.style.background = 'var(--surface-section)')}
            onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
          >
            <RefreshCw size={13} style={{ animation: isFetching ? 'spin 1s linear infinite' : 'none' }} />
            {t('pages.adminLogs.refreshBtn')}
          </button>
        }
      />

      {/* Stat chips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: t('pages.adminLogs.statEvents'),      value: all.length,                   color: '#6366f1', bg: '#eef2ff', Icon: Activity  },
          { label: t('pages.adminLogs.statNewAccounts'), value: counts.user_registered || 0,  color: '#15803d', bg: '#dcfce7', Icon: UserPlus  },
          { label: t('pages.adminLogs.statPublished'),   value: counts.offre || 0,            color: '#6d28d9', bg: '#ede9fe', Icon: Briefcase },
          { label: t('pages.adminLogs.statApplications'),value: counts.candidature || 0,      color: '#92400e', bg: '#fef9c3', Icon: FileText  },
        ].map(s => (
          <div
            key={s.label}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem', transition: 'transform 0.18s ease, box-shadow 0.18s ease' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <s.Icon size={18} />
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
        <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {t('pages.adminLogs.tableTitle')}{' '}
              <span style={{ color: 'var(--text-subtle)', fontWeight: 400 }}>({filtered.length})</span>
            </span>
            <div style={{ display: 'flex', gap: '0.3rem', marginLeft: '0.5rem' }}>
              {typeFilters.map(f => (
                <button
                  key={f.id} onClick={() => { setTypeFilter(f.id); setPage(1); }}
                  style={{
                    height: '26px', padding: '0 0.65rem', borderRadius: '999px', border: '1px solid',
                    fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                    borderColor: typeFilter === f.id ? '#1b6ef3' : 'var(--border)',
                    background:  typeFilter === f.id ? '#1b6ef3' : '#fff',
                    color:       typeFilter === f.id ? '#fff'    : 'var(--text-muted)',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.73rem', fontWeight: 600, color: '#15803d', background: '#dcfce7', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
              Live · 30s
            </span>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)', pointerEvents: 'none' }} />
              <input
                type="text" placeholder={t('common.search')} value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                style={{ height: '34px', paddingLeft: '2rem', paddingRight: '0.75rem', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.85rem', outline: 'none', width: '210px', color: 'var(--text-main)', boxSizing: 'border-box' }}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <TH col="date"   sort={sort} onSort={handleSort} style={{ width: '160px' }}>{t('pages.adminLogs.colTimestamp')}</TH>
                <TH col="type"   sort={sort} onSort={handleSort} style={{ width: '130px' }}>{t('pages.adminLogs.colType')}</TH>
                <TH col="label"  sort={sort} onSort={handleSort}>{t('pages.adminLogs.colEvent')}</TH>
                <TH col="detail" sort={sort} onSort={handleSort}>{t('pages.adminLogs.colDetail')}</TH>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {[100, 90, 140, 260].map((w, j) => (
                      <td key={j} style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #f3f4f6' }}>
                        <div style={{ height: '13px', width: `${w}px`, background: 'var(--surface-section)', borderRadius: '4px' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={4} style={{ padding: '3.5rem', textAlign: 'center' }}>
                    <AlertCircle size={28} style={{ color: '#ef4444', display: 'block', margin: '0 auto 0.5rem' }} />
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t('pages.adminLogs.errorLoading')}</span>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.875rem' }}>
                    {t('pages.adminLogs.noEvents')}
                  </td>
                </tr>
              ) : rows.map((a, idx) => {
                const style = TYPE_STYLE[a.type] || DEFAULT_STYLE;
                const Icon  = TYPE_ICONS[a.type] || Activity;
                return (
                  <tr
                    key={idx}
                    style={{ borderBottom: '1px solid #f3f4f6' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-section)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-color)' }}>{timeAgo(a.date, t, i18n.language)}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '0.15rem' }}>
                        {new Date(a.date).toLocaleDateString(LOCALE_MAP[i18n.language] || 'en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.65rem', borderRadius: '999px', background: style.bg, color: style.color, whiteSpace: 'nowrap' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: style.dot, flexShrink: 0 }} />
                        {typeLabel(a.type)}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Icon size={13} color={style.color} />
                        {a.label}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.detail}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && !isError && filtered.length > 0 && (
          <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('pages.adminLogs.rows')}</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                style={{ height: '28px', padding: '0 0.5rem', border: '1px solid var(--border)', borderRadius: '5px', fontSize: '0.8rem', color: 'var(--text-color)', background: 'var(--bg-card)', cursor: 'pointer', outline: 'none' }}
              >
                {PAGE_SIZES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, filtered.length)} {t('pages.adminLogs.of')} {filtered.length}
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
    </div>
  );
}
