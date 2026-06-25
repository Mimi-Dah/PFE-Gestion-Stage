import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../components/PageHeader';
import { useTranslation } from 'react-i18next';
import {
  Eye, Archive, Search,
  ChevronLeft, ChevronRight, MapPin, Clock,
  Building2, Calendar, ArrowUpDown, ArrowUp, ArrowDown,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import ErrorToast from '../../components/common/ErrorToast';

const PAGE_SIZES = [5, 10, 25, 50];

const STATUS_STYLE = {
  Active:     { bg: '#dcfce7', color: '#15803d', dot: '#22c55e' },
  En_attente: { bg: '#fef9c3', color: '#92400e', dot: '#f59e0b' },
  Fermée:     { bg: '#fee2e2', color: '#b91c1c', dot: '#ef4444' },
  Archivée:   { bg: '#f3f4f6', color: 'var(--text-muted)', dot: 'var(--text-subtle)' },
};

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
        cursor: col ? 'pointer' : 'default',
        userSelect: 'none',
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

const StatusBadge = ({ statut, label }) => {
  const s = STATUS_STYLE[statut] || STATUS_STYLE.Archivée;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
      fontSize: '0.75rem', fontWeight: 600,
      padding: '0.25rem 0.65rem', borderRadius: '999px',
      background: s.bg, color: s.color, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {label}
    </span>
  );
};

export default function OfferModeration() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('All');
  const [sort, setSort]             = useState({ col: 'publie_le', dir: 'desc' });
  const [page, setPage]             = useState(1);
  const [pageSize, setPageSize]     = useState(10);

  const { data: raw, isLoading } = useQuery({
    queryKey: ['admin-offers'],
    queryFn: () => api.get('offres/').then(r => r.data),
  });
  const offers = Array.isArray(raw) ? raw : (raw?.results || []);

  const [blockError, setBlockError] = useState(null);

  const mutation = useMutation({
    mutationFn: ({ id }) => api.post(`offres/${id}/archive/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-offers'] }),
  });

  const statusLabel = (statut) => {
    const map = {
      Active:     t('pages.adminOfferModeration.statusActive'),
      En_attente: t('pages.adminOfferModeration.statusPending'),
      Fermée:     t('pages.adminOfferModeration.statusClosed'),
      Archivée:   t('pages.adminOfferModeration.statusArchived'),
    };
    return map[statut] || statut;
  };

  const filtered = useMemo(() => {
    let list = offers.filter(o => {
      const q = search.toLowerCase();
      return (
        (o.titre?.toLowerCase().includes(q) || (o.entreprise?.nom || '').toLowerCase().includes(q)) &&
        (statusFilter === 'All' || o.statut === statusFilter)
      );
    });
    list = [...list].sort((a, b) => {
      let av = a[sort.col] ?? '', bv = b[sort.col] ?? '';
      if (sort.col === 'entreprise') { av = a.entreprise?.nom ?? ''; bv = b.entreprise?.nom ?? ''; }
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      return sort.dir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return list;
  }, [offers, search, statusFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (col) => {
    setSort(s => ({ col, dir: s.col === col && s.dir === 'asc' ? 'desc' : 'asc' }));
    setPage(1);
  };

  const counts = {
    total:    offers.length,
    active:   offers.filter(o => o.statut === 'Active').length,
    pending:  offers.filter(o => o.statut === 'En_attente').length,
    archived: offers.filter(o => o.statut === 'Archivée').length,
  };

  return (
    <>
    <div style={{ padding: '0 0 2rem' }}>

      <PageHeader
        eyebrow={t('nav.sections.administration')}
        title={t('pages.adminOfferModeration.title')}
        subtitle={t('pages.adminOfferModeration.subtitle')}
      />

      {/* Stat chips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: t('pages.adminOfferModeration.statTotal'),    value: counts.total,    color: '#6366f1', bg: '#eef2ff' },
          { label: t('pages.adminOfferModeration.statActive'),   value: counts.active,   color: '#15803d', bg: '#dcfce7' },
          { label: t('pages.adminOfferModeration.statPending'),  value: counts.pending,  color: '#92400e', bg: '#fef9c3' },
          { label: t('pages.adminOfferModeration.statArchived'), value: counts.archived, color: 'var(--text-muted)', bg: '#f3f4f6' },
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
            <div style={{
              width: '42px', height: '42px', borderRadius: '8px', background: s.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: s.color }}>{s.value}</span>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-color)', fontWeight: 500 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{
          padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '1rem', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
            {t('pages.adminOfferModeration.tableTitle')}{' '}
            <span style={{ color: 'var(--text-subtle)', fontWeight: 400 }}>({filtered.length})</span>
          </span>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)', pointerEvents: 'none' }} />
              <input
                type="text" placeholder={t('pages.adminOfferModeration.searchPlaceholder')} value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                style={{
                  height: '34px', paddingLeft: '2rem', paddingRight: '0.75rem',
                  border: '1px solid var(--border)', borderRadius: '6px',
                  fontSize: '0.85rem', outline: 'none', width: '210px', color: 'var(--text-main)',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => { setStatus(e.target.value); setPage(1); }}
              style={{
                height: '34px', padding: '0 0.75rem',
                border: '1px solid var(--border)', borderRadius: '6px',
                fontSize: '0.85rem', color: 'var(--text-color)', background: 'var(--bg-card)',
                cursor: 'pointer', outline: 'none',
              }}
            >
              <option value="All">{t('pages.adminOfferModeration.allStatuses')}</option>
              <option value="Active">{t('pages.adminOfferModeration.statusActive')}</option>
              <option value="En_attente">{t('pages.adminOfferModeration.statusPending')}</option>
              <option value="Fermée">{t('pages.adminOfferModeration.statusClosed')}</option>
              <option value="Archivée">{t('pages.adminOfferModeration.statusArchived')}</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <TH col="titre"        sort={sort} onSort={handleSort}>{t('pages.adminOfferModeration.colOffer')}</TH>
                <TH col="entreprise"   sort={sort} onSort={handleSort}>{t('pages.adminOfferModeration.colCompany')}</TH>
                <TH col="localisation" sort={sort} onSort={handleSort}>{t('pages.adminOfferModeration.colLocation')}</TH>
                <TH col="duree_semaines" sort={sort} onSort={handleSort}>{t('pages.adminOfferModeration.colDuration')}</TH>
                <TH col="publie_le"    sort={sort} onSort={handleSort}>{t('pages.adminOfferModeration.colPublished')}</TH>
                <TH col="statut"       sort={sort} onSort={handleSort}>{t('pages.adminOfferModeration.colStatus')}</TH>
                <TH style={{ width: '130px' }}>{t('pages.adminOfferModeration.colActions')}</TH>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {[180, 120, 100, 60, 80, 80, 110].map((w, j) => (
                      <td key={j} style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #f3f4f6' }}>
                        <div style={{ height: '13px', width: `${w}px`, background: 'var(--surface-section)', borderRadius: '4px' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.875rem' }}>
                    {t('pages.adminOfferModeration.noOffers')}
                  </td>
                </tr>
              ) : rows.map(offer => {
                const hue = (offer.titre?.charCodeAt(0) || 65) % 360;
                return (
                  <tr
                    key={offer.id_offre}
                    style={{ borderBottom: '1px solid #f3f4f6' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-section)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{
                          width: '34px', height: '34px', borderRadius: '8px', flexShrink: 0,
                          background: `hsl(${hue},55%,90%)`, color: `hsl(${hue},55%,32%)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.875rem',
                        }}>
                          {(offer.titre?.[0] || 'O').toUpperCase()}
                        </div>
                        <span style={{
                          fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)',
                          maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {offer.titre}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.875rem', color: 'var(--text-color)', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Building2 size={13} color="#9ca3af" />
                        {offer.entreprise?.nom || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.875rem', color: 'var(--text-color)', whiteSpace: 'nowrap' }}>
                      {offer.localisation
                        ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><MapPin size={13} color="#9ca3af" />{offer.localisation}</span>
                        : <span style={{ color: 'var(--text-subtle)' }}>—</span>}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.875rem', color: 'var(--text-color)', whiteSpace: 'nowrap' }}>
                      {offer.duree_semaines
                        ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Clock size={13} color="#9ca3af" />{offer.duree_semaines} {t('pages.adminOfferModeration.weeks')}</span>
                        : <span style={{ color: 'var(--text-subtle)' }}>—</span>}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.875rem', color: 'var(--text-color)', whiteSpace: 'nowrap' }}>
                      {offer.publie_le
                        ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Calendar size={13} color="#9ca3af" />{new Date(offer.publie_le).toLocaleDateString()}</span>
                        : <span style={{ color: 'var(--text-subtle)' }}>—</span>}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <StatusBadge statut={offer.statut} label={statusLabel(offer.statut)} />
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <button
                          title={t('pages.adminOfferModeration.viewTitle')}
                          onClick={() => navigate(`/espace/offres/${offer.id_offre}`, { state: { backgroundLocation: location } })}
                          style={{ width: '30px', height: '30px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-section)'; e.currentTarget.style.color = '#111827'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#6b7280'; }}
                        >
                          <Eye size={13} />
                        </button>
                        {offer.statut === 'Active' && (
                          <button
                            onClick={() => setBlockError({ code: t('pages.adminOfferModeration.archiveBlockTitle'), message: t('pages.adminOfferModeration.archiveBlockMsg') })}
                            style={{ height: '30px', padding: '0 0.65rem', border: '1px solid #fecaca', borderRadius: '6px', background: 'var(--bg-card)', cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 600, color: '#dc2626', whiteSpace: 'nowrap', opacity: 0.6 }}
                          >
                            <Archive size={12} /> {t('pages.adminOfferModeration.archiveBtn')}
                          </button>
                        )}
                        {offer.statut === 'Fermée' && (
                          <button
                            onClick={() => mutation.mutate({ id: offer.id_offre })}
                            style={{ height: '30px', padding: '0 0.65rem', border: '1px solid #fecaca', borderRadius: '6px', background: 'var(--bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 600, color: '#dc2626', whiteSpace: 'nowrap' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
                            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                          >
                            <Archive size={12} /> {t('pages.adminOfferModeration.archiveBtn')}
                          </button>
                        )}
                      </div>
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
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '1rem', flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('pages.adminOfferModeration.rows')}</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                style={{ height: '28px', padding: '0 0.5rem', border: '1px solid var(--border)', borderRadius: '5px', fontSize: '0.8rem', color: 'var(--text-color)', background: 'var(--bg-card)', cursor: 'pointer', outline: 'none' }}
              >
                {PAGE_SIZES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, filtered.length)} {t('pages.adminOfferModeration.of')} {filtered.length}
            </span>

            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
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
                  <button
                    key={n} onClick={() => setPage(n)}
                    style={{ height: '28px', minWidth: '28px', padding: '0 0.25rem', border: `1px solid ${page === n ? '#1b6ef3' : 'var(--border)'}`, borderRadius: '5px', background: page === n ? '#1b6ef3' : '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: page === n ? 600 : 400, color: page === n ? '#fff' : 'var(--text-color)' }}
                  >
                    {n}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ height: '28px', width: '28px', border: '1px solid var(--border)', borderRadius: '5px', background: 'var(--bg-card)', cursor: page === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: page === totalPages ? 'var(--border)' : 'var(--text-color)' }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    <ErrorToast error={blockError} onClose={() => setBlockError(null)} />
    </>
  );
}
