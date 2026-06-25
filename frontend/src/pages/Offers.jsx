import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import OfferDetail from './OfferDetail';
import PageHeader from '../components/PageHeader';
import {
  Search,
  MapPin,
  Clock,
  Heart,
  Briefcase,
  SlidersHorizontal,
  GraduationCap,
  AlertCircle,
  ArrowRight,
  Building2,
  Wifi,
  Calendar,
  ChevronRight,
  X,
} from 'lucide-react';
import api from '../services/api';
import './Offers.css';

const EMPTY_FILTERS = {
  teletravail: '',
  localisation: '',
  entreprise__nom: '',
  duree_semaines: '',
  departement: '',
  ordering: '-publie_le',
};

/* ── Color palettes ──────────────────────────────────────────── */
const CO_PALETTES = [
  { bg: '#EFF6FF', color: '#2563EB' },
  { bg: '#F5F3FF', color: '#7C3AED' },
  { bg: '#ECFDF5', color: '#059669' },
  { bg: '#FFF7ED', color: '#EA580C' },
  { bg: '#FDF2F8', color: '#DB2777' },
  { bg: '#FEFCE8', color: '#D97706' },
];

const DOMAIN_PALETTES = [
  { bg: '#EFF6FF', color: '#1D4ED8' },
  { bg: '#F0FDF4', color: '#15803D' },
  { bg: '#FFF7ED', color: '#C2410C' },
  { bg: '#F5F3FF', color: '#6D28D9' },
  { bg: '#FDF2F8', color: '#BE185D' },
  { bg: '#ECFEFF', color: '#0E7490' },
];

const getCompanyPalette = (name) =>
  CO_PALETTES[(name?.charCodeAt(0) ?? 0) % CO_PALETTES.length];

const getDomainPalette = (domain) =>
  DOMAIN_PALETTES[(domain?.charCodeAt(0) ?? 0) % DOMAIN_PALETTES.length];

const getInitials = (name) => {
  if (!name) return '??';
  const words = name.trim().split(/\s+/);
  return words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
};

/* ── Featured offer card (landscape, full-width) ─────────────── */
const FeaturedCard = ({ offre, onFavori, onSelect, t }) => {
  const [hovered, setHovered] = useState(false);
  const id = offre.id || offre.id_offre;
  const co = getCompanyPalette(offre.entreprise?.nom);
  const domain = getDomainPalette(offre.domaine);

  return (
    <div
      className={`offer-featured${hovered ? ' hovered' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Left visual column */}
      <div
        className="offer-featured-visual"
        style={{ background: domain.bg, borderRight: `1px solid ${domain.color}22` }}
      >
        <div className="offer-featured-avatar-wrap">
          <div
            className="offer-featured-avatar"
            style={{ background: co.bg, color: co.color }}
          >
            {getInitials(offre.entreprise?.nom)}
          </div>
        </div>
        <div className="offer-featured-badges">
          {offre.teletravail && (
            <span className="offer-tag-remote"><Wifi size={10} />{t('pages.offers.remote')}</span>
          )}
          <span className="offer-tag-duration">
            <Clock size={10} />{offre.duree_semaines || '?'} {t('pages.offers.weeks')}
          </span>
        </div>
      </div>

      {/* Right content */}
      <div className="offer-featured-body">
        <div className="offer-featured-top">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {offre.domaine && (
              <span className="offer-domain-chip" style={{ background: domain.bg, color: domain.color }}>
                {offre.domaine}
              </span>
            )}
            <span style={{
              fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em',
              textTransform: 'uppercase', color: 'var(--n400)',
              padding: '3px 9px', background: 'var(--n100)', borderRadius: '6px',
            }}>
              {t('pages.offers.featured')}
            </span>
          </div>
          <button
            className={`offer-heart${offre.is_favori ? ' favorited' : ''}`}
            onClick={(e) => { e.stopPropagation(); onFavori.mutate(id); }}
          >
            <Heart size={15} fill={offre.is_favori ? 'currentColor' : 'none'} />
          </button>
        </div>

        <h2 className="offer-featured-title">{offre.titre}</h2>

        {offre.description && (
          <p className="offer-featured-desc">{offre.description}</p>
        )}

        <div className="offer-meta-row">
          {offre.entreprise?.nom && (
            <span className="offer-meta-item"><Building2 size={12} />{offre.entreprise.nom}</span>
          )}
          {offre.localisation && (
            <span className="offer-meta-item"><MapPin size={12} />{offre.localisation}</span>
          )}
        </div>

        <div className="offer-featured-footer">
          <div>
            <div className="offer-salary-label">{t('pages.offers.compensation')}</div>
            <div className={`offer-salary-value${offre.gratification ? ' paid' : ''}`}>
              {offre.gratification ? `${offre.gratification} MRU` : t('pages.offers.unpaid')}
            </div>
          </div>
          <button className="offer-cta-btn" onClick={() => onSelect(id)}>
            {t('pages.offers.viewOffer')} <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Regular offer card (blog-post style) ────────────────────── */
const OfferCard = ({ offre, onFavori, onSelect, t }) => {
  const [hovered, setHovered] = useState(false);
  const { i18n } = useTranslation();
  const id = offre.id || offre.id_offre;
  const co = getCompanyPalette(offre.entreprise?.nom);
  const domain = getDomainPalette(offre.domaine);
  const pubDate = offre.publie_le
    ? new Date(offre.publie_le).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' })
    : null;

  return (
    <div
      className={`offer-card${hovered ? ' hovered' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Thin top accent bar (color appears on hover) */}
      <div className="offer-card-accent" style={{ background: hovered ? domain.color : 'transparent' }} />

      {/* Header: domain chip + heart */}
      <div className="offer-card-header">
        {offre.domaine ? (
          <span className="offer-domain-chip" style={{ background: domain.bg, color: domain.color }}>
            {offre.domaine}
          </span>
        ) : <div />}
        <button
          className={`offer-heart${offre.is_favori ? ' favorited' : ''}`}
          onClick={(e) => { e.stopPropagation(); onFavori.mutate(id); }}
        >
          <Heart size={14} fill={offre.is_favori ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Title */}
      <h3 className="offer-card-title">{offre.titre}</h3>

      {/* Excerpt */}
      {offre.description && (
        <p className="offer-card-desc">{offre.description}</p>
      )}

      {/* Author row — company as "blog author" */}
      <div className="offer-author-row">
        <div className="offer-author-avatar" style={{ background: co.bg, color: co.color }}>
          {getInitials(offre.entreprise?.nom)}
        </div>
        <div className="offer-author-info">
          <div className="offer-author-name">{offre.entreprise?.nom || '—'}</div>
          <div className="offer-author-meta">
            {offre.localisation && <span><MapPin size={9} />{offre.localisation}</span>}
            {pubDate && <span><Calendar size={9} />{pubDate}</span>}
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="offer-tags-row">
        {offre.teletravail && (
          <span className="offer-tag-remote"><Wifi size={10} />{t('pages.offers.remote')}</span>
        )}
        <span className="offer-tag-duration">
          <Clock size={10} />{offre.duree_semaines || '?'} {t('pages.offers.weeks')}
        </span>
        {offre.domaine && (
          <span className="offer-tag-domain">{offre.domaine}</span>
        )}
      </div>

      {/* Footer: salary + CTA */}
      <div className="offer-card-footer">
        <div>
          <div className="offer-salary-label">{t('pages.offers.compensation')}</div>
          <div className={`offer-salary-value${offre.gratification ? ' paid' : ''}`}>
            {offre.gratification ? `${offre.gratification} MRU` : t('pages.offers.unpaid')}
          </div>
        </div>
        <button className="offer-details-link" onClick={() => onSelect(id)}>
          {t('pages.offers.details')} <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   OFFERS PAGE
═══════════════════════════════════════════════════════════════ */
const Offers = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm]         = useState('');
  const [showFilters, setShowFilters]       = useState(false);
  const [draftFilters, setDraftFilters]     = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [selectedOfferId, setSelectedOfferId] = useState(null);

  const queryClient = useQueryClient();

  const { data: departements = [] } = useQuery({
    queryKey: ['departements'],
    queryFn: async () => {
      const res = await api.get('etablissements/departements/');
      return res.data.results ?? res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: offres = [], isLoading, isError, error } = useQuery({
    queryKey: ['offres', searchTerm, appliedFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm)                     params.append('search', searchTerm);
      if (appliedFilters.teletravail)     params.append('teletravail', appliedFilters.teletravail);
      if (appliedFilters.localisation)    params.append('localisation', appliedFilters.localisation);
      if (appliedFilters.entreprise__nom) params.append('entreprise__nom', appliedFilters.entreprise__nom);
      if (appliedFilters.duree_semaines)  params.append('duree_semaines', appliedFilters.duree_semaines);
      if (appliedFilters.departement)     params.append('departement', appliedFilters.departement);
      if (appliedFilters.ordering)        params.append('ordering', appliedFilters.ordering);
      const res = await api.get(`offres/?${params.toString()}`);
      return res.data.results ?? res.data;
    },
  });

  const toggleFavori = useMutation({
    mutationFn: (id) => api.post(`offres/${id}/favori/`),
    onSuccess: () => queryClient.invalidateQueries(['offres']),
  });

  const applyQuickChip = (patch) => {
    const next = { ...EMPTY_FILTERS, ...patch };
    setDraftFilters(next);
    setAppliedFilters(next);
  };

  const clearAll = () => {
    setSearchTerm('');
    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
  };

  const activeFilterCount = Object.entries(appliedFilters)
    .filter(([k, v]) => k !== 'ordering' && v).length;

  const isAllActive = !appliedFilters.teletravail && !appliedFilters.duree_semaines;

  const featured = null; // all offers use the same card
  const rest = offres;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── Page header ─────────────────────────────────────────── */}
      <PageHeader eyebrow={t('pages.offers.eyebrow')} title={t('pages.offers.title')} subtitle={t('pages.offers.subtitle')} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap', marginTop: '-1rem', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div className="offers-search-wrap">
            <Search size={14} style={{ color: 'var(--n400)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder={t('pages.offers.searchPlaceholder')}
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

          <button
            className={`offers-filter-btn${showFilters ? ' active' : ''}`}
            onClick={() => setShowFilters(v => !v)}
          >
            <SlidersHorizontal size={13} />
            {t('pages.offers.filterBtn')}
            {activeFilterCount > 0 && (
              <span style={{
                minWidth: '18px', height: '18px', padding: '0 4px',
                background: showFilters ? '#fff' : 'var(--primary)',
                color: showFilters ? 'var(--n900)' : '#fff',
                fontSize: '10px', fontWeight: '700', borderRadius: '9999px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Quick chip filter bar ────────────────────────────────── */}
      <div className="offers-chips-bar">
        <button className={`offers-chip${isAllActive ? ' active' : ''}`} onClick={clearAll}>
          {t('pages.offers.chipAll')}
        </button>
        <button
          className={`offers-chip${appliedFilters.teletravail === 'true' ? ' active' : ''}`}
          onClick={() => applyQuickChip(appliedFilters.teletravail === 'true' ? {} : { teletravail: 'true' })}
        >
          <Wifi size={11} />{t('pages.offers.chipRemote')}
          {appliedFilters.teletravail === 'true' && <span className="offers-chip-remove">×</span>}
        </button>
        <button
          className={`offers-chip${appliedFilters.duree_semaines === '8' ? ' active' : ''}`}
          onClick={() => applyQuickChip(appliedFilters.duree_semaines === '8' ? {} : { duree_semaines: '8' })}
        >
          <Clock size={11} />{t('pages.offers.chip8w')}
          {appliedFilters.duree_semaines === '8' && <span className="offers-chip-remove">×</span>}
        </button>
        <button
          className={`offers-chip${appliedFilters.duree_semaines === '12' ? ' active' : ''}`}
          onClick={() => applyQuickChip(appliedFilters.duree_semaines === '12' ? {} : { duree_semaines: '12' })}
        >
          <Clock size={11} />{t('pages.offers.chip12w')}
          {appliedFilters.duree_semaines === '12' && <span className="offers-chip-remove">×</span>}
        </button>

        <div className="offers-divider" />

        <select
          value={appliedFilters.ordering}
          onChange={e => {
            const next = { ...appliedFilters, ordering: e.target.value };
            setDraftFilters(next);
            setAppliedFilters(next);
          }}
          style={{
            width: 'auto',
            padding: '6px 28px 6px 12px',
            border: '1.5px solid var(--n200)',
            borderRadius: '9999px',
            fontSize: '12.5px',
            fontWeight: '500',
            color: 'var(--n600)',
            background: 'var(--surface-card)',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <option value="-publie_le">{t('pages.offers.sortNewest')}</option>
          <option value="publie_le">{t('pages.offers.sortOldest')}</option>
          <option value="duree_semaines">{t('pages.offers.sortDurAsc')}</option>
          <option value="-duree_semaines">{t('pages.offers.sortDurDesc')}</option>
        </select>
      </div>

      {/* ── Advanced filter panel ───────────────────────────────── */}
      {showFilters && (
        <div className="offers-advanced-panel">
          <div className="offers-advanced-grid">
            <div className="offers-input-wrap">
              <MapPin size={14} />
              <input
                type="text" placeholder={t('pages.offers.filterCity')}
                value={draftFilters.localisation}
                onChange={e => setDraftFilters(p => ({ ...p, localisation: e.target.value }))}
              />
            </div>
            <div className="offers-input-wrap">
              <Building2 size={14} />
              <input
                type="text" placeholder={t('pages.offers.filterCompany')}
                value={draftFilters.entreprise__nom}
                onChange={e => setDraftFilters(p => ({ ...p, entreprise__nom: e.target.value }))}
              />
            </div>
            <div className="offers-input-wrap">
              <GraduationCap size={14} />
              <select
                value={draftFilters.departement}
                onChange={e => setDraftFilters(p => ({ ...p, departement: e.target.value }))}
              >
                <option value="">{t('pages.offers.filterAllDepts')}</option>
                {departements.map(d => (
                  <option key={d.id} value={d.id}>{d.nom}</option>
                ))}
              </select>
            </div>
            <div className="offers-input-wrap">
              <Clock size={14} />
              <select
                value={draftFilters.duree_semaines}
                onChange={e => setDraftFilters(p => ({ ...p, duree_semaines: e.target.value }))}
              >
                <option value="">{t('pages.offers.filterAllDurations')}</option>
                <option value="4">{t('pages.offers.filter4w')}</option>
                <option value="8">{t('pages.offers.filter8w')}</option>
                <option value="12">{t('pages.offers.filter12w')}</option>
                <option value="24">{t('pages.offers.filter24w')}</option>
              </select>
            </div>
          </div>
          <div className="offers-panel-footer">
            <button className="offers-btn-reset" onClick={clearAll}>{t('pages.offers.reset')}</button>
            <button
              className="offers-btn-apply"
              onClick={() => { setAppliedFilters(draftFilters); setShowFilters(false); }}
            >
              {t('pages.offers.apply')}
            </button>
          </div>
        </div>
      )}

      {/* ── Result count ────────────────────────────────────────── */}
      {!isLoading && !isError && (
        <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-main)' }}>
          {offres.length}{' '}
          <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>
            {t('pages.offers.found', { count: offres.length })}
          </span>
        </div>
      )}

      {/* ── Loading skeletons ───────────────────────────────────── */}
      {isLoading && (
        <>
          <div className="offers-grid">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="offers-skeleton-card">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div className="skeleton" style={{ height: '20px', width: '80px', borderRadius: '9999px' }} />
                  <div className="skeleton" style={{ height: '22px', width: '22px', borderRadius: '6px' }} />
                </div>
                <div className="skeleton" style={{ height: '20px', width: '85%', marginTop: '8px' }} />
                <div className="skeleton" style={{ height: '14px', width: '95%' }} />
                <div className="skeleton" style={{ height: '14px', width: '65%' }} />
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  <div className="skeleton" style={{ height: '22px', width: '65px', borderRadius: '7px' }} />
                  <div className="skeleton" style={{ height: '22px', width: '55px', borderRadius: '7px' }} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Error ─────────────────────────────────────────────── */}
      {isError && (
        <div className="offers-error">
          <AlertCircle size={40} color="#EF4444" />
          <p>{error?.message || t('pages.offers.error')}</p>
        </div>
      )}

      {/* ── Empty ─────────────────────────────────────────────── */}
      {!isLoading && !isError && offres.length === 0 && (
        <div className="offers-empty">
          <Briefcase size={48} style={{ color: 'var(--n300)' }} />
          <h3>{t('pages.offers.emptyTitle')}</h3>
          <p>{t('pages.offers.emptySubtitle')}</p>
          <button className="offers-empty-btn" onClick={clearAll}>
            {t('pages.offers.resetFilters')}
          </button>
        </div>
      )}

      {/* ── Offers grid ───────────────────────────────────────── */}
      {!isLoading && !isError && rest.length > 0 && (
        <div className="offers-grid" style={{ paddingBottom: '80px' }}>
          {rest.map(offre => (
            <OfferCard
              key={offre.id || offre.id_offre}
              offre={offre}
              onFavori={toggleFavori}
              onSelect={setSelectedOfferId}
              t={t}
            />
          ))}
        </div>
      )}

      {/* ── Offer detail modal ──────────────────────────────── */}
      {selectedOfferId && (
        <OfferDetail
          modalId={selectedOfferId}
          onClose={() => setSelectedOfferId(null)}
        />
      )}
    </div>
  );
};

export default Offers;
