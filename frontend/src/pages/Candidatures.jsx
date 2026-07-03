import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader';
import {
  Calendar,
  Clock,
  MapPin,
  Trash2,
  ChevronRight,
  CheckCircle2,
  XCircle,
  FileText,
  PlayCircle,
  BadgeCheck,
  AlertCircle,
  Search,
  X,
} from 'lucide-react';
import api from '../services/api';
import OfferDetail from './OfferDetail';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import { dateLocale } from '../utils/dateLocale';
import './Offers.css';
import './Candidatures.css';

/* ── Status config (colors/icons only — labels come from i18n) ── */
const STATUS_CONFIG = {
  En_attente:          { color: '#D97706', bg: '#FFFBEB', border: 'rgba(245,158,11,.2)',  icon: Clock        },
  Acceptée:            { color: '#059669', bg: '#ECFDF5', border: 'rgba(34,197,94,.2)',   icon: CheckCircle2 },
  Refusée:             { color: '#DC2626', bg: '#FEF2F2', border: 'rgba(239,68,68,.2)',   icon: XCircle      },
  Retirée:             { color: '#64748B', bg: '#F8FAFC', border: 'rgba(148,163,184,.2)', icon: Trash2       },
  Convention_en_cours: { color: '#1B6EF3', bg: '#EFF6FF', border: 'rgba(27,110,243,.2)',  icon: FileText     },
  Stage_actif:         { color: '#059669', bg: '#ECFDF5', border: 'rgba(34,197,94,.2)',   icon: PlayCircle   },
  Terminé:             { color: '#64748B', bg: '#F8FAFC', border: 'rgba(148,163,184,.2)', icon: BadgeCheck   },
};
const getStatus = (s) => STATUS_CONFIG[s] ?? STATUS_CONFIG['En_attente'];

/* ── Company palette ─────────────────────────────────────────── */
const CO_PALETTES = [
  { bg: '#EFF6FF', color: '#2563EB' },
  { bg: '#F5F3FF', color: '#7C3AED' },
  { bg: '#ECFDF5', color: '#059669' },
  { bg: '#FFF7ED', color: '#EA580C' },
  { bg: '#FDF2F8', color: '#DB2777' },
  { bg: '#FEFCE8', color: '#D97706' },
];
const getCompanyPalette = (name) =>
  CO_PALETTES[(name?.charCodeAt(0) ?? 0) % CO_PALETTES.length];
const getInitials = (name) => {
  if (!name) return '??';
  const words = name.trim().split(/\s+/);
  return words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
};

/* ═══════════════════════════════════════════════════════════════
   CANDIDATURES PAGE
══════════════════════════════════════════════════════════════ */
const Candidatures = () => {
  const { t, i18n } = useTranslation();
  const navigate    = useNavigate();
  const queryClient = useQueryClient();

  const [selectedOfferId, setSelectedOfferId] = useState(null);
  const [searchTerm, setSearchTerm]           = useState('');
  const [statusFilter, setStatusFilter]       = useState('');

  const CHIPS = [
    { key: '',                     label: t('pages.candidatures.chips.all') },
    { key: 'En_attente',           label: t('pages.candidatures.chips.pending') },
    { key: 'Acceptée',             label: t('pages.candidatures.chips.accepted') },
    { key: 'Convention_en_cours',  label: t('pages.candidatures.chips.convention') },
    { key: 'Stage_actif',          label: t('pages.candidatures.chips.active') },
    { key: 'Refusée',              label: t('pages.candidatures.chips.refused') },
    { key: 'Terminé',              label: t('pages.candidatures.chips.finished') },
  ];

  const { data: candidaturesData, isLoading, isError } = useQuery({
    queryKey: ['mes-candidatures'],
    queryFn: async () => {
      const res = await api.get('candidatures/mes-candidatures/').catch(() => api.get('candidatures/'));
      return res.data;
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: (id) => api.delete(`candidatures/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mes-candidatures'] }),
  });

  const all = Array.isArray(candidaturesData) ? candidaturesData : candidaturesData?.results || [];

  const candidatures = all.filter(c => {
    const matchStatus = !statusFilter || c.statut === statusFilter;
    const matchSearch = !searchTerm || (() => {
      const q = searchTerm.toLowerCase();
      return (
        c.offre_detail?.titre?.toLowerCase().includes(q) ||
        c.offre_detail?.entreprise?.nom?.toLowerCase().includes(q) ||
        c.offre_detail?.domaine?.toLowerCase().includes(q)
      );
    })();
    return matchStatus && matchSearch;
  });

  const countByStatus = (key) => key ? all.filter(c => c.statut === key).length : all.length;

  if (isLoading) return <SkeletonLoader variant="cards" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── Page header ─────────────────────────────────────────── */}
      <PageHeader
        eyebrow={t('pages.candidatures.eyebrow')}
        title={t('pages.candidatures.title')}
        subtitle={t('pages.candidatures.subtitle')}
      />

      {/* ── Unified toolbar: chips left, search right ───────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '-1rem', marginBottom: '0.5rem' }}>

        {/* Status chips — left/center */}
        {all.length > 0 && (
          <div className="offers-chips-bar" style={{ flex: 1 }}>
            {CHIPS.map(chip => {
              const cnt = countByStatus(chip.key);
              if (cnt === 0 && chip.key) return null;
              return (
                <button
                  key={chip.key}
                  className={`offers-chip${statusFilter === chip.key ? ' active' : ''}`}
                  onClick={() => setStatusFilter(chip.key)}
                >
                  {chip.label}
                  <span style={{
                    minWidth: '18px', height: '18px', padding: '0 4px',
                    background: statusFilter === chip.key ? 'rgba(255,255,255,0.25)' : 'var(--n200)',
                    color: statusFilter === chip.key ? '#fff' : 'var(--n600)',
                    fontSize: '10px', fontWeight: '700', borderRadius: '9999px',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {cnt}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Search — right */}
        <div className="offers-search-wrap" style={{ flexShrink: 0 }}>
          <Search size={14} style={{ color: 'var(--n400)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder={t('pages.candidatures.searchPlaceholder')}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{ border: 'none', background: 'none', color: 'var(--n400)', cursor: 'pointer', padding: 0, display: 'flex', flexShrink: 0 }}
            >
              <X size={14} />
            </button>
          )}
        </div>

      </div>

      {/* ── Result count ────────────────────────────────────────── */}
      {!isError && (
        <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-main)' }}>
          {candidatures.length}{' '}
          <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>
            {t('pages.candidatures.count', { count: candidatures.length })}
          </span>
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────── */}
      {isError && (
        <div className="offers-error">
          <AlertCircle size={40} color="#EF4444" />
          <p>{t('pages.candidatures.error')}</p>
        </div>
      )}

      {/* ── Empty ─────────────────────────────────────────────── */}
      {!isError && candidatures.length === 0 && (
        <div className="offers-empty">
          <FileText size={48} style={{ color: 'var(--n300)' }} />
          <h3>
            {searchTerm || statusFilter
              ? t('pages.candidatures.emptyNoResults')
              : t('pages.candidatures.emptyTitle')}
          </h3>
          <p>
            {searchTerm || statusFilter
              ? t('pages.candidatures.emptyFilterSubtitle')
              : t('pages.candidatures.emptySubtitle')}
          </p>
          {searchTerm || statusFilter ? (
            <button className="offers-empty-btn" onClick={() => { setSearchTerm(''); setStatusFilter(''); }}>
              {t('pages.candidatures.resetFilters')}
            </button>
          ) : (
            <button className="offers-empty-btn" onClick={() => navigate('/espace/offres')}>
              {t('pages.candidatures.browseOffers')}
            </button>
          )}
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────── */}
      {!isError && candidatures.length > 0 && (
        <div className="cand-table-wrap">
          <table className="cand-table">
            <thead>
              <tr>
                <th>{t('pages.candidatures.colOffer')}</th>
                <th>{t('pages.candidatures.colCompany')}</th>
                <th>{t('pages.candidatures.colDate')}</th>
                <th>{t('pages.candidatures.colStatus')}</th>
                <th style={{ textAlign: 'right' }}>{t('pages.candidatures.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {candidatures.map(cand => {
                const id          = cand.id || cand.id_candidature;
                const offre       = cand.offre_detail || {};
                const offreId     = cand.offre || cand.id_offre;
                const companyName = offre.entreprise?.nom || '—';
                const co          = getCompanyPalette(companyName);
                const st          = getStatus(cand.statut);
                const StatusIcon  = st.icon;
                const isPending   = cand.statut === 'En_attente';
                const isActive    = ['Acceptée', 'Stage_actif', 'Validée'].includes(cand.statut);
                const appliedDate = cand.postule_le
                  ? new Date(cand.postule_le).toLocaleDateString(dateLocale(i18n.language), { day: 'numeric', month: 'short', year: 'numeric' })
                  : '—';

                return (
                  <tr key={id} className="cand-row">
                    {/* Offer title */}
                    <td className="cand-td cand-td-main">
                      <button
                        className="cand-offer-link"
                        onClick={() => offreId && setSelectedOfferId(offreId)}
                      >
                        {offre.titre || `Offre #${offreId}`}
                      </button>
                      {offre.localisation && (
                        <span className="cand-offer-meta"><MapPin size={11} />{offre.localisation}</span>
                      )}
                    </td>

                    {/* Company */}
                    <td className="cand-td">
                      <div className="cand-company">
                        <div className="cand-avatar" style={{ background: co.bg, color: co.color }}>
                          {getInitials(companyName)}
                        </div>
                        <span className="cand-company-name">{companyName}</span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="cand-td cand-td-date">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={13} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />
                        {appliedDate}
                      </span>
                    </td>

                    {/* Status badge */}
                    <td className="cand-td">
                      <span className="cand-badge" style={{ color: st.color, background: st.bg, border: `1px solid ${st.border}` }}>
                        <StatusIcon size={11} />
                        {t('pages.candidatures.status.' + cand.statut)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="cand-td cand-td-actions">
                      {isActive && (
                        <button
                          className="cand-btn-follow"
                          onClick={() => navigate('/espace/mon-stage')}
                        >
                          <PlayCircle size={13} />
                          {t('pages.candidatures.follow')}
                        </button>
                      )}
                      <button
                        className="cand-btn-view"
                        onClick={() => offreId && setSelectedOfferId(offreId)}
                      >
                        {t('pages.candidatures.view')} <ChevronRight size={13} />
                      </button>
                      {isPending && (
                        <button
                          className="cand-btn-delete"
                          disabled={withdrawMutation.isPending}
                          onClick={() => {
                            if (window.confirm(t('pages.candidatures.confirmCancel'))) withdrawMutation.mutate(id);
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Offer detail modal ──────────────────────────────────── */}
      {selectedOfferId && (
        <OfferDetail
          modalId={selectedOfferId}
          onClose={() => setSelectedOfferId(null)}
        />
      )}
    </div>
  );
};

export default Candidatures;
