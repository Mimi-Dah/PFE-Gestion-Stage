import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader';
import {
  MapPin,
  Clock,
  Heart,
  Calendar,
  Wifi,
  ChevronRight,
  Search,
  X,
  AlertCircle,
} from 'lucide-react';
import api from '../services/api';
import OfferDetail from './OfferDetail';
import './Offers.css';

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

/* ═══════════════════════════════════════════════════════════════
   FAVORIS PAGE
══════════════════════════════════════════════════════════════ */
const Favoris = () => {
  const { t } = useTranslation();
  const [selectedOfferId, setSelectedOfferId] = useState(null);
  const [searchTerm, setSearchTerm]           = useState('');
  const [hoveredId, setHoveredId]             = useState(null);
  const queryClient = useQueryClient();

  const { data: favorisData, isLoading, isError } = useQuery({
    queryKey: ['favoris'],
    queryFn: async () => (await api.get('offres/favoris/')).data,
  });

  const toggleFavori = useMutation({
    mutationFn: (offreId) => api.post(`offres/${offreId}/favori/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favoris'] }),
  });

  const rawList = Array.isArray(favorisData) ? favorisData : favorisData?.results || [];
  const allOffers = rawList.map(fav => ({ ...(fav.offre_details || fav), is_favori: true }));

  const offers = searchTerm
    ? allOffers.filter(o => {
        const q = searchTerm.toLowerCase();
        return (
          o.titre?.toLowerCase().includes(q) ||
          o.entreprise?.nom?.toLowerCase().includes(q) ||
          o.domaine?.toLowerCase().includes(q) ||
          o.localisation?.toLowerCase().includes(q)
        );
      })
    : allOffers;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── Page header ─────────────────────────────────────────── */}
      <PageHeader
        eyebrow={t('pages.favoris.eyebrow')}
        title={t('pages.favoris.title')}
        subtitle={t('pages.favoris.subtitle')}
      />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap', marginTop: '-1rem', marginBottom: '0.5rem' }}>
        <div className="offers-search-wrap">
          <Search size={14} style={{ color: 'var(--n400)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder={t('pages.favoris.searchPlaceholder')}
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
      {!isLoading && !isError && (
        <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-main)' }}>
          {offers.length}{' '}
          <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>
            {t('pages.favoris.count', { count: offers.length })}
          </span>
        </div>
      )}

      {/* ── Loading skeletons ───────────────────────────────────── */}
      {isLoading && (
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
      )}

      {/* ── Error ─────────────────────────────────────────────── */}
      {isError && (
        <div className="offers-error">
          <AlertCircle size={40} color="#EF4444" />
          <p>{t('pages.favoris.error')}</p>
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────── */}
      {!isLoading && !isError && offers.length === 0 && (
        <div className="offers-empty">
          <Heart
            size={48}
            style={{
              color: searchTerm ? 'var(--n300)' : '#E11D48',
              fill: searchTerm ? 'none' : '#E11D48',
            }}
          />
          <h3>{searchTerm ? t('pages.favoris.emptyNoResults') : t('pages.favoris.emptyTitle')}</h3>
          <p>
            {searchTerm
              ? t('pages.favoris.emptyFilterSubtitle')
              : t('pages.favoris.emptySubtitle')}
          </p>
          {searchTerm ? (
            <button className="offers-empty-btn" onClick={() => setSearchTerm('')}>
              {t('pages.favoris.resetSearch')}
            </button>
          ) : (
            <Link to="/espace/offres" style={{ textDecoration: 'none' }}>
              <button className="offers-empty-btn">{t('pages.favoris.browseOffers')}</button>
            </Link>
          )}
        </div>
      )}

      {/* ── Offers grid ───────────────────────────────────────── */}
      {!isLoading && !isError && offers.length > 0 && (
        <div className="offers-grid" style={{ paddingBottom: '80px' }}>
          {offers.map(offre => {
            const id      = offre.id || offre.id_offre;
            const co      = getCompanyPalette(offre.entreprise?.nom);
            const domain  = getDomainPalette(offre.domaine);
            const isHov   = hoveredId === id;
            const pubDate = offre.publie_le
              ? new Date(offre.publie_le).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
              : null;

            return (
              <div
                key={id}
                className={`offer-card${isHov ? ' hovered' : ''}`}
                onMouseEnter={() => setHoveredId(id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div className="offer-card-accent" style={{ background: isHov ? domain.color : 'transparent' }} />

                <div className="offer-card-header">
                  {offre.domaine ? (
                    <span className="offer-domain-chip" style={{ background: domain.bg, color: domain.color }}>
                      {offre.domaine}
                    </span>
                  ) : <div />}
                  <button
                    className="offer-heart favorited"
                    onClick={e => { e.stopPropagation(); toggleFavori.mutate(id); }}
                    title={t('pages.favoris.removeFromFavorites')}
                  >
                    <Heart size={14} fill="currentColor" />
                  </button>
                </div>

                <h3 className="offer-card-title">{offre.titre}</h3>

                {offre.description && (
                  <p className="offer-card-desc">{offre.description}</p>
                )}

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

                <div className="offer-tags-row">
                  {offre.teletravail && (
                    <span className="offer-tag-remote"><Wifi size={10} />{t('pages.favoris.remote')}</span>
                  )}
                  <span className="offer-tag-duration">
                    <Clock size={10} />{offre.duree_semaines || '?'} {t('pages.favoris.weeks')}
                  </span>
                  {offre.domaine && (
                    <span className="offer-tag-domain">{offre.domaine}</span>
                  )}
                </div>

                <div className="offer-card-footer">
                  <div>
                    <div className="offer-salary-label">{t('pages.favoris.compensation')}</div>
                    <div className={`offer-salary-value${offre.gratification ? ' paid' : ''}`}>
                      {offre.gratification ? `${offre.gratification} MRU` : t('pages.favoris.unpaid')}
                    </div>
                  </div>
                  <button className="offer-details-link" onClick={() => setSelectedOfferId(id)}>
                    {t('pages.favoris.details')} <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
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

export default Favoris;
