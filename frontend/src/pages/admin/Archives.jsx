import { useQuery } from '@tanstack/react-query';
import PageHeader from '../../components/PageHeader';
import { useTranslation } from 'react-i18next';
import {
  Search, Eye, Building2, MapPin, Clock, Calendar,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const PAGE_SIZES = [5, 10, 25, 50];

const TH = ({ children, col, sort, onSort, style = {} }) => {
  const active = sort?.col === col;
  return (
    <th
      onClick={() => col && onSort(col)}
      style={{
        padding: '0.75rem 1rem',
        fontSize: '0.72rem', fontWeight: 700,
        color: active ? 'var(--text-main)' : 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.05em',
        textAlign: 'left', background: 'var(--surface-section)',
        borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
        cursor: col ? 'pointer' : 'default', userSelect: 'none',
        ...style,
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
        {children}
        {col && (
          active
            ? sort.dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />
            : <ArrowUpDown size={11} style={{ opacity: 0.35 }} />
        )}
      </span>
    </th>
  );
};

export default function AdminArchives() {
  const { t } = useTranslation();
  const [search, setSearch]     = useState('');
  const [sort, setSort]         = useState({ col: 'publie_le', dir: 'desc' });
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: raw, isLoading } = useQuery({
    queryKey: ['admin-archives'],
    queryFn: () => api.get('offres/?statut=Archivée').then(r => r.data),
  });
  const offers = (Array.isArray(raw) ? raw : (raw?.results || [])).filter(o => o.statut === 'Archivée');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = offers.filter(o =>
      o.titre?.toLowerCase().includes(q) || (o.entreprise?.nom || '').toLowerCase().includes(q)
    );
    list = [...list].sort((a, b) => {
      let av = a[sort.col] ?? '', bv = b[sort.col] ?? '';
      if (sort.col === 'entreprise') { av = a.entreprise?.nom ?? ''; bv = b.entreprise?.nom ?? ''; }
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      return sort.dir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return list;
  }, [offers, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (col) => {
    setSort(s => ({ col, dir: s.col === col && s.dir === 'asc' ? 'desc' : 'asc' }));
    setPage(1);
  };

  return (
    <div style={{ padding: '0 0 2rem' }}>
      <PageHeader
        eyebrow={t('nav.sections.administration')}
        title={t('pages.adminArchives.title')}
        subtitle={t('pages.adminArchives.subtitle')}
      />

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{
          padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
        }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
            {t('pages.adminArchives.tableTitle')}{' '}
            <span style={{ color: 'var(--text-subtle)', fontWeight: 400 }}>({filtered.length})</span>
          </span>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)', pointerEvents: 'none' }} />
            <input
              type="text" placeholder={t('pages.adminArchives.searchPlaceholder')} value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{
                height: '34px', paddingLeft: '2rem', paddingRight: '0.75rem',
                border: '1px solid var(--border)', borderRadius: '6px',
                fontSize: '0.85rem', outline: 'none', width: '210px', color: 'var(--text-main)',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <TH col="titre"          sort={sort} onSort={handleSort}>{t('pages.adminArchives.colOffer')}</TH>
                <TH col="entreprise"     sort={sort} onSort={handleSort}>{t('pages.adminArchives.colCompany')}</TH>
                <TH col="localisation"   sort={sort} onSort={handleSort}>{t('pages.adminArchives.colLocation')}</TH>
                <TH col="duree_semaines" sort={sort} onSort={handleSort}>{t('pages.adminArchives.colDuration')}</TH>
                <TH col="publie_le"      sort={sort} onSort={handleSort}>{t('pages.adminArchives.colPublished')}</TH>
                <TH style={{ width: '70px' }}>{t('pages.adminArchives.colActions')}</TH>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {[180, 120, 100, 60, 80, 60].map((w, j) => (
                      <td key={j} style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #f3f4f6' }}>
                        <div style={{ height: '13px', width: `${w}px`, background: 'var(--surface-section)', borderRadius: '4px' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.875rem' }}>
                    {t('pages.adminArchives.noArchives')}
                  </td>
                </tr>
              ) : rows.map(offer => {
                const hue = (offer.titre?.charCodeAt(0) || 65) % 360;
                return (
                  <tr
                    key={offer.id_offre}
                    style={{ borderBottom: '1px solid #f3f4f6', opacity: 0.85 }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-section)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{
                          width: '34px', height: '34px', borderRadius: '8px', flexShrink: 0,
                          background: `hsl(${hue},20%,88%)`, color: `hsl(${hue},20%,40%)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.875rem',
                        }}>
                          {(offer.titre?.[0] || 'O').toUpperCase()}
                        </div>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {offer.titre}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.875rem', color: 'var(--text-color)', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Building2 size={13} color="#9ca3af" />{offer.entreprise?.nom || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.875rem', color: 'var(--text-color)', whiteSpace: 'nowrap' }}>
                      {offer.localisation
                        ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><MapPin size={13} color="#9ca3af" />{offer.localisation}</span>
                        : <span style={{ color: 'var(--text-subtle)' }}>—</span>}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.875rem', color: 'var(--text-color)', whiteSpace: 'nowrap' }}>
                      {offer.duree_semaines
                        ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Clock size={13} color="#9ca3af" />{offer.duree_semaines} {t('pages.adminArchives.weeks')}</span>
                        : <span style={{ color: 'var(--text-subtle)' }}>—</span>}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.875rem', color: 'var(--text-color)', whiteSpace: 'nowrap' }}>
                      {offer.publie_le
                        ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Calendar size={13} color="#9ca3af" />{new Date(offer.publie_le).toLocaleDateString()}</span>
                        : <span style={{ color: 'var(--text-subtle)' }}>—</span>}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <Link to={`/espace/offres/${offer.id_offre}`}>
                        <button
                          title={t('pages.adminArchives.viewTitle')}
                          style={{ width: '30px', height: '30px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-section)'; e.currentTarget.style.color = '#111827'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#6b7280'; }}
                        >
                          <Eye size={13} />
                        </button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && filtered.length > 0 && (
          <div style={{
            padding: '0.85rem 1.25rem', borderTop: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('pages.adminArchives.rows')}</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                style={{ height: '28px', padding: '0 0.5rem', border: '1px solid var(--border)', borderRadius: '5px', fontSize: '0.8rem', color: 'var(--text-color)', background: 'var(--bg-card)', cursor: 'pointer', outline: 'none' }}
              >
                {PAGE_SIZES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, filtered.length)} {t('pages.adminArchives.of')} {filtered.length}
            </span>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ height: '28px', width: '28px', border: '1px solid var(--border)', borderRadius: '5px', background: 'var(--bg-card)', cursor: page === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: page === 1 ? 'var(--border)' : 'var(--text-color)' }}>
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
                    style={{ height: '28px', minWidth: '28px', padding: '0 0.25rem', border: `1px solid ${page === n ? '#1b6ef3' : 'var(--border)'}`, borderRadius: '5px', background: page === n ? '#1b6ef3' : '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: page === n ? 600 : 400, color: page === n ? '#fff' : 'var(--text-color)' }}>
                    {n}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ height: '28px', width: '28px', border: '1px solid var(--border)', borderRadius: '5px', background: 'var(--bg-card)', cursor: page === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: page === totalPages ? 'var(--border)' : 'var(--text-color)' }}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
