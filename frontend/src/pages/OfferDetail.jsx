import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  MapPin,
  Clock,
  Calendar,
  CircleDollarSign,
  Send,
  Building2,
  Briefcase,
  Info,
  X,
  ChevronLeft,
  Heart,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Wifi,
} from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import './OfferDetail.css';

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
const getDomainPalette  = (domain) =>
  DOMAIN_PALETTES[(domain?.charCodeAt(0) ?? 0) % DOMAIN_PALETTES.length];
const getInitials = (name) => {
  if (!name) return '??';
  const words = name.trim().split(/\s+/);
  return words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
};

const LOCALE_MAP = { fr: 'fr-FR', en: 'en-US', ar: 'ar-DZ' };

/* ── Shared label style ─────────────────────────────────────── */
const fieldLabel = {
  display: 'block', fontSize: '0.75rem', fontWeight: '700',
  color: 'var(--text-muted)', textTransform: 'uppercase',
  letterSpacing: '0.05em', marginBottom: '0.4rem',
};
/* ── Read-only "input" cell ─────────────────────────────────── */
const inputBox = {
  width: '100%', padding: '0.6rem 0.875rem', borderRadius: '6px',
  border: '1px solid var(--surface-border)', backgroundColor: 'var(--surface-card)',
  color: 'var(--text-main)', fontSize: '0.875rem', fontWeight: '500',
  boxSizing: 'border-box', lineHeight: 1.5,
};

const DetailItem = ({ icon: Icon, label, value, paid, notSpecified }) => (
  <div>
    <label style={{ ...fieldLabel, display: 'flex', alignItems: 'center', gap: '5px' }}>
      <Icon size={12} color="var(--primary)" />{label}
    </label>
    <div style={{ ...inputBox, color: paid ? '#059669' : 'var(--text-main)', fontWeight: paid ? 600 : 500 }}>
      {value || notSpecified}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
const OfferDetail = ({ modalId, onClose }) => {
  const { id: routeId } = useParams();
  const id           = modalId ?? routeId;
  const isModal      = !!onClose;
  const navigate     = useNavigate();
  const location     = useLocation();
  const { user }     = useAuthStore();
  const queryClient  = useQueryClient();
  const { t, i18n } = useTranslation();
  const locale       = LOCALE_MAP[i18n.language] || 'fr-FR';

  const [isModalOpen,    setIsModalOpen]    = useState(false);
  const [motivationText, setMotivationText] = useState('');
  const [isApplying,     setIsApplying]     = useState(false);
  const [successMsg,     setSuccessMsg]     = useState('');
  const [errorMsg,       setErrorMsg]       = useState('');

  const { data: offer, isPending, isError } = useQuery({
    queryKey: ['offre', id],
    queryFn:  async () => (await api.get(`offres/${id}/`)).data,
    enabled:  !!id,
  });

  const toggleFavori = useMutation({
    mutationFn: () => api.post(`offres/${id}/favori/`),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['offre', id] }),
  });

  useEffect(() => {
    if (!isModal) {
      const params = new URLSearchParams(location.search);
      if (params.get('apply') === 'true' && offer && user?.role === 'Étudiant') {
        setIsModalOpen(true);
      }
    }
  }, [location.search, offer, user, isModal]);

  useEffect(() => {
    if (isModal) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isModal]);

  const handleApply = async () => {
    setIsApplying(true);
    setErrorMsg('');
    try {
      await api.post('candidatures/', {
        offre: offer.id || offer.id_offre,
        texte_lettre_motivation:
          motivationText ||
          'Je suis très intéressé(e) par cette offre et mon profil correspond aux exigences demandées.',
      });
      setSuccessMsg(t('pages.offerDetail.applicationSent'));
      setTimeout(() => navigate('/espace/candidatures'), 2000);
    } catch (err) {
      const d = err.response?.data;
      const msg =
        d?.non_field_errors?.[0] || d?.offre?.[0] || d?.profil?.[0] ||
        d?.detail || d?.error ||
        (d && typeof d === 'object'
          ? Object.values(d).flat().find(v => typeof v === 'string')
          : null) ||
        err.message || t('pages.offerDetail.unexpectedError');
      setErrorMsg(msg);
    } finally {
      setIsApplying(false);
    }
  };

  /* ── Loading / error states ─────────────────────────────────── */
  if (isPending) {
    if (isModal) return (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
        <div style={{ backgroundColor: 'var(--surface-card)', borderRadius: '10px', width: '100%', maxWidth: '640px', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          {t('pages.offerDetail.loading')}
        </div>
      </div>
    );
    return <SkeletonLoader variant="detail" />;
  }
  if (isError) {
    if (isModal) return (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
        <div style={{ backgroundColor: 'var(--surface-card)', borderRadius: '10px', width: '100%', maxWidth: '640px', padding: '3rem', textAlign: 'center', color: 'var(--error)' }}>
          {t('pages.offerDetail.error')}
          <button onClick={onClose} style={{ display: 'block', margin: '1rem auto 0', padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--surface-border)', background: 'transparent', cursor: 'pointer' }}>{t('pages.offerDetail.close')}</button>
        </div>
      </div>
    );
    return (
      <div style={{ padding: '8rem 0', textAlign: 'center', color: 'var(--error)', fontWeight: 600 }}>
        {t('pages.offerDetail.errorPage')}
      </div>
    );
  }
  if (!offer) return null;

  const companyName = offer.entreprise?.nom || 'Entreprise';
  const co          = getCompanyPalette(companyName);
  const domain      = getDomainPalette(offer.domaine);
  const isActive    = offer.statut === 'Active';

  const dateOpts = { day: 'numeric', month: 'long', year: 'numeric' };
  const pubDate   = offer.publie_le
    ? new Date(offer.publie_le).toLocaleDateString(locale, dateOpts)
    : null;
  const startDate = offer.date_debut
    ? new Date(offer.date_debut).toLocaleDateString(locale, dateOpts)
    : null;

  /* ── APPLICATION SUB-MODAL ──────────────────────────────────── */
  const applicationModal = isModalOpen && (
    <div
      className="od-modal-overlay"
      style={{ zIndex: 2000 }}
      onClick={e => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
    >
      <div className="od-modal animate-fade-in">
        <button className="od-modal-close" onClick={() => setIsModalOpen(false)}>
          <X size={16} />
        </button>

        <h2 className="od-modal-title">{t('pages.offerDetail.apply.title')}</h2>
        <p className="od-modal-sub">
          {t('pages.offerDetail.apply.applying')}{' '}
          <strong style={{ color: 'var(--primary)' }}>{offer.titre}</strong>{' '}
          {t('pages.offerDetail.apply.at')}{' '}
          <strong style={{ color: 'var(--primary)' }}>{companyName}</strong>.
        </p>

        {errorMsg && (
          <div className="od-error">
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            {errorMsg}
          </div>
        )}

        <div className="od-modal-field">
          <label className="od-modal-label">{t('pages.offerDetail.apply.motivationLabel')}</label>
          <textarea
            value={motivationText}
            onChange={e => setMotivationText(e.target.value)}
            placeholder={t('pages.offerDetail.apply.motivationPlaceholder')}
            rows={6}
            style={{ resize: 'none' }}
          />
          <div className="od-modal-hint">
            <Info size={13} color="var(--primary)" />
            {t('pages.offerDetail.apply.hint')}
          </div>
        </div>

        <div className="od-modal-actions">
          <button className="od-btn-cancel" onClick={() => setIsModalOpen(false)}>
            {t('pages.offerDetail.apply.cancel')}
          </button>
          <button className="od-btn-submit" onClick={handleApply} disabled={isApplying}>
            {isApplying ? t('pages.offerDetail.apply.sending') : t('pages.offerDetail.apply.submit')}
          </button>
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════
     MODAL MODE
  ══════════════════════════════════════════════════════════════ */
  if (isModal) {
    return (
      <>
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1.5rem' }}
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
          <div style={{ backgroundColor: 'var(--surface-card)', borderRadius: '10px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>

            {/* ── Header ─────────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--surface-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Briefcase size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-main)' }}>{offer.titre}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '500' }}>{companyName}</div>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid var(--surface-border)', backgroundColor: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                <X size={15} />
              </button>
            </div>

            {/* ── Body ───────────────────────────────────────────── */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>

              {/* Tags row */}
              <div>
                <label style={fieldLabel}>{t('pages.offerDetail.domainStatus')}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  {offer.domaine && (
                    <span className="od-chip" style={{ background: domain.bg, color: domain.color }}>{offer.domaine}</span>
                  )}
                  <span className={`od-chip ${isActive ? 'od-chip-active' : 'od-chip-inactive'}`}>
                    {isActive && <CheckCircle2 size={11} />}{offer.statut ? t('pages.offerDetail.status.' + offer.statut, { defaultValue: offer.statut }) : t('pages.offerDetail.unknown')}
                  </span>
                  {offer.teletravail && <span className="od-chip od-chip-remote"><Wifi size={11} />{t('pages.offerDetail.remote')}</span>}
                  {offer.duree_semaines && <span className="od-chip od-chip-muted"><Clock size={11} />{offer.duree_semaines} {t('pages.offerDetail.weeks')}</span>}
                </div>
              </div>

              {/* 2-col grid row 1 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <DetailItem icon={MapPin} label={t('pages.offerDetail.location')} value={offer.localisation} notSpecified={t('pages.offerDetail.notSpecified')} />
                <DetailItem icon={Clock}  label={t('pages.offerDetail.duration')} value={offer.duree_semaines ? `${offer.duree_semaines} ${t('pages.offerDetail.weeks')}` : null} notSpecified={t('pages.offerDetail.notSpecified')} />
              </div>

              {/* 2-col grid row 2 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <DetailItem icon={Calendar}         label={t('pages.offerDetail.startDate')}    value={startDate} notSpecified={t('pages.offerDetail.notSpecified')} />
                <DetailItem icon={CircleDollarSign} label={t('pages.offerDetail.compensation')} value={offer.gratification ? `${offer.gratification} ${t('pages.offerDetail.perMonth')}` : t('pages.offerDetail.unpaid')} paid={!!offer.gratification} notSpecified={t('pages.offerDetail.notSpecified')} />
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--surface-border)', margin: 0 }} />

              {/* Description */}
              <div>
                <label style={fieldLabel}>{t('pages.offerDetail.missionDesc')}</label>
                <div style={{ ...inputBox, minHeight: '80px', lineHeight: 1.75, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--text-color)', fontWeight: '400' }}>
                  {offer.description || t('pages.offerDetail.noDescription')}
                </div>
              </div>

              {/* Profil */}
              {offer.exigences && (
                <div>
                  <label style={fieldLabel}>{t('pages.offerDetail.profile')}</label>
                  <div style={{ ...inputBox, minHeight: '60px', lineHeight: 1.75, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--text-color)', fontWeight: '400' }}>
                    {offer.exigences}
                  </div>
                </div>
              )}

              {pubDate && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                  {t('pages.offerDetail.publishedOn', { date: pubDate })}
                </div>
              )}

              {successMsg && (
                <div className="od-success"><CheckCircle2 size={16} />{successMsg}</div>
              )}

              {/* ── Footer ─────────────────────────────────────────── */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid var(--surface-border)', paddingTop: '1.25rem', marginTop: '0.25rem' }}>
                {user?.role === 'Étudiant' ? (
                  <>
                    <button
                      onClick={() => toggleFavori.mutate()}
                      style={{ padding: '0.6rem 1rem', borderRadius: '6px', border: `1px solid ${offer.is_favori ? '#E11D48' : 'var(--surface-border)'}`, backgroundColor: offer.is_favori ? '#FFF1F2' : 'transparent', color: offer.is_favori ? '#E11D48' : 'var(--text-muted)', fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                      <Heart size={14} fill={offer.is_favori ? 'currentColor' : 'none'} />
                      {offer.is_favori ? t('pages.offerDetail.saved') : t('pages.offerDetail.save')}
                    </button>
                    {offer.is_applied ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '0.6rem 1rem', borderRadius: '6px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontWeight: '600', fontSize: '0.875rem' }}>
                        <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                        {t('pages.offerDetail.alreadyApplied')}
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsModalOpen(true)}
                        disabled={!isActive}
                        style={{ padding: '0.6rem 1.375rem', borderRadius: '6px', border: 'none', backgroundColor: 'var(--primary)', color: '#fff', fontWeight: '700', fontSize: '0.875rem', cursor: isActive ? 'pointer' : 'not-allowed', opacity: !isActive ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Send size={14} />
                        {isActive ? t('pages.offerDetail.applyNow') : t('pages.offerDetail.offerUnavailable')}
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={onClose}
                      style={{ padding: '0.6rem 1.25rem', borderRadius: '6px', border: '1px solid var(--surface-border)', backgroundColor: 'transparent', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer' }}
                    >
                      {t('pages.offerDetail.close')}
                    </button>
                    <div style={{ padding: '0.6rem 1rem', borderRadius: '6px', background: 'var(--surface-section)', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600', textAlign: 'center', border: '1px solid var(--surface-border)' }}>
                      {t('pages.offerDetail.loginToApply')}
                    </div>
                  </>
                )}
              </div>

            </div>
          </div>
        </div>

        {applicationModal}
      </>
    );
  }

  /* ══════════════════════════════════════════════════════════════
     PAGE MODE
  ══════════════════════════════════════════════════════════════ */
  return (
    <div className="animate-fade-in">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => navigate('/espace/offres')}
          className="secondary"
          style={{ padding: '0.5rem 1rem', marginBottom: '1.25rem' }}
        >
          <ChevronLeft size={18} />
          {t('pages.offerDetail.backToOffers')}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Briefcase size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>{offer.titre}</h1>
            <p style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0, fontSize: '0.875rem', fontWeight: '500' }}>
              <Building2 size={13} />
              <span>{companyName}</span>
              {pubDate && <><span>·</span><span>{t('pages.offerDetail.publishedOn', { date: pubDate })}</span></>}
            </p>
          </div>
        </div>
      </div>

      {/* ── Main card ─────────────────────────────────────────── */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>

        {/* Tags row */}
        <div>
          <label style={fieldLabel}>{t('pages.offerDetail.domainStatus')}</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {offer.domaine && (
              <span className="od-chip" style={{ background: domain.bg, color: domain.color }}>{offer.domaine}</span>
            )}
            <span className={`od-chip ${isActive ? 'od-chip-active' : 'od-chip-inactive'}`}>
              {isActive && <CheckCircle2 size={11} />}{offer.statut ? t('pages.offerDetail.status.' + offer.statut, { defaultValue: offer.statut }) : t('pages.offerDetail.unknown')}
            </span>
            {offer.teletravail && <span className="od-chip od-chip-remote"><Wifi size={11} />{t('pages.offerDetail.remote')}</span>}
            {offer.duree_semaines && <span className="od-chip od-chip-muted"><Clock size={11} />{offer.duree_semaines} {t('pages.offerDetail.weeks')}</span>}
          </div>
        </div>

        {/* 2-col grid row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <DetailItem icon={MapPin} label={t('pages.offerDetail.location')} value={offer.localisation} notSpecified={t('pages.offerDetail.notSpecified')} />
          <DetailItem icon={Clock}  label={t('pages.offerDetail.duration')} value={offer.duree_semaines ? `${offer.duree_semaines} ${t('pages.offerDetail.weeks')}` : null} notSpecified={t('pages.offerDetail.notSpecified')} />
        </div>

        {/* 2-col grid row 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <DetailItem icon={Calendar}         label={t('pages.offerDetail.startDate')}    value={startDate} notSpecified={t('pages.offerDetail.notSpecified')} />
          <DetailItem icon={CircleDollarSign} label={t('pages.offerDetail.compensation')} value={offer.gratification ? `${offer.gratification} ${t('pages.offerDetail.perMonth')}` : t('pages.offerDetail.unpaid')} paid={!!offer.gratification} notSpecified={t('pages.offerDetail.notSpecified')} />
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--surface-border)', margin: 0 }} />

        {/* Description */}
        <div>
          <label style={fieldLabel}>{t('pages.offerDetail.missionDesc')}</label>
          <div style={{ ...inputBox, minHeight: '80px', lineHeight: 1.75, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--text-color)', fontWeight: '400' }}>
            {offer.description || t('pages.offerDetail.noDescription')}
          </div>
        </div>

        {/* Profil Recherché */}
        {offer.exigences && (
          <div>
            <label style={fieldLabel}>{t('pages.offerDetail.profile')}</label>
            <div style={{ ...inputBox, minHeight: '60px', lineHeight: 1.75, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--text-color)', fontWeight: '400' }}>
              {offer.exigences}
            </div>
          </div>
        )}

        {/* À propos de l'entreprise */}
        <div>
          <label style={fieldLabel}>{t('pages.offerDetail.aboutCompany')}</label>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginTop: '0.25rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: co.bg, color: co.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px', flexShrink: 0 }}>
              {getInitials(companyName)}
            </div>
            <div>
              <p style={{ fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.25rem 0' }}>{companyName}</p>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.875rem', lineHeight: 1.6 }}>
                {t('pages.offerDetail.companyDesc')}
              </p>
            </div>
          </div>
        </div>

        {pubDate && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>
            {t('pages.offerDetail.publishedOn', { date: pubDate })}
          </div>
        )}

        {successMsg && (
          <div className="od-success"><CheckCircle2 size={16} />{successMsg}</div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid var(--surface-border)', paddingTop: '1.25rem', marginTop: '0.25rem' }}>
          {user?.role === 'Étudiant' ? (
            <>
              <button
                onClick={() => toggleFavori.mutate()}
                style={{ padding: '0.6rem 1rem', borderRadius: '6px', border: `1px solid ${offer.is_favori ? '#E11D48' : 'var(--surface-border)'}`, backgroundColor: offer.is_favori ? '#FFF1F2' : 'transparent', color: offer.is_favori ? '#E11D48' : 'var(--text-muted)', fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <Heart size={14} fill={offer.is_favori ? 'currentColor' : 'none'} />
                {offer.is_favori ? t('pages.offerDetail.saved') : t('pages.offerDetail.save')}
              </button>
              {offer.is_applied ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '0.6rem 1rem', borderRadius: '6px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontWeight: '600', fontSize: '0.875rem' }}>
                  <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                  {t('pages.offerDetail.alreadyApplied')}
                </div>
              ) : (
                <button
                  onClick={() => setIsModalOpen(true)}
                  disabled={!isActive}
                  style={{ padding: '0.6rem 1.375rem', borderRadius: '6px', border: 'none', backgroundColor: 'var(--primary)', color: '#fff', fontWeight: '700', fontSize: '0.875rem', cursor: isActive ? 'pointer' : 'not-allowed', opacity: !isActive ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={14} />
                  {isActive ? t('pages.offerDetail.applyNow') : t('pages.offerDetail.offerUnavailable')}
                </button>
              )}
            </>
          ) : (
            <div className="od-not-student">
              {t('pages.offerDetail.loginToApply')}
            </div>
          )}
        </div>

      </div>

      {/* Tip */}
      <div style={{ marginTop: '1rem', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', backgroundColor: 'var(--surface-section)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        <ShieldCheck size={15} color="var(--primary)" style={{ marginTop: '2px', flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          <strong style={{ color: 'var(--text-main)' }}>{t('pages.offerDetail.tipTitle')}</strong>{' '}
          {t('pages.offerDetail.tipBody')}{' '}
          <strong style={{ color: 'var(--success)' }}>{t('pages.offerDetail.tipPercent')}</strong>.
        </p>
      </div>

      {applicationModal}
    </div>
  );
};

export default OfferDetail;
