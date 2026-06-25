import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  FileCheck,
  Upload,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  FileText,
  CalendarDays,
  Building2,
  GraduationCap,
  ArrowUpRight,
  Briefcase,
} from 'lucide-react';
import api, { mediaUrl } from '../../services/api';

const sig = (date, locale = 'fr-FR') => (date ? new Date(date).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' }) : null);

const STATUS_COLORS = {
  Validée:    { color: '#10b981', bg: 'rgba(16,185,129,.1)', border: 'rgba(16,185,129,.25)' },
  'En attente': { color: '#f59e0b', bg: 'rgba(245,158,11,.1)', border: 'rgba(245,158,11,.25)' },
  default:    { color: '#6b7280', bg: 'rgba(107,114,128,.1)', border: 'rgba(107,114,128,.25)' },
};

const ConventionCard = ({ conv, uploadingId, onUpload, onView, featured }) => {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language || 'fr';
  const convId = conv.id || conv.id_convention;
  const bothSigned = !!(conv.signe_par_etudiant_le && conv.signe_par_entreprise_le);
  const isValidated = bothSigned;
  const derivedStatut = bothSigned ? 'Validée' : 'En attente';
  const statusColor = STATUS_COLORS[derivedStatut];
  const statusLabel = bothSigned ? t('pages.entreprise.conventions.statusValidated') : t('pages.entreprise.conventions.statusPending');

  const avatarColors = ['#6366f1', '#8b5cf6', '#ec4899', '#0ea5e9', '#10b981'];
  const avatarBg = avatarColors[(convId || 0) % avatarColors.length];

  if (featured) {
    return (
      <div style={{
        gridColumn: '1 / -1',
        background: 'var(--surface-card, #fff)',
        borderRadius: '20px',
        border: '1px solid var(--surface-border, #e5e7eb)',
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: '1fr 1.5fr',
        boxShadow: '0 4px 24px rgba(0,0,0,.06)',
        transition: 'box-shadow .2s',
      }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 40px rgba(0,0,0,.12)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,.06)'}
      >
        {/* Left visual panel */}
        <div style={{
          background: `linear-gradient(135deg, ${avatarBg}22 0%, ${avatarBg}44 100%)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem',
          gap: '1rem',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: `${avatarBg}18` }} />
          <div style={{ position: 'absolute', bottom: '-60px', left: '-30px', width: '220px', height: '220px', borderRadius: '50%', background: `${avatarBg}12` }} />
          <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, boxShadow: `0 8px 24px ${avatarBg}55` }}>
            <FileText size={36} color="#fff" />
          </div>
          <div style={{ textAlign: 'center', zIndex: 1 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: avatarBg, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              {t('pages.entreprise.conventions.conventionLabel')}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-color, #111)' }}>#{conv.numero_convention || convId}</div>
          </div>
        </div>

        {/* Right content */}
        <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.85rem', borderRadius: '999px', background: statusColor.bg, color: statusColor.color, border: `1px solid ${statusColor.border}`, fontSize: '0.75rem', fontWeight: '700', letterSpacing: '.04em' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor.color }} />
              {statusLabel}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #6b7280)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <CalendarDays size={13} />
              {sig(conv.cree_le, dateLocale) || t('pages.entreprise.conventions.recent')}
            </span>
          </div>

          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '800', margin: '0 0 0.4rem', lineHeight: 1.2, color: 'var(--text-color, #111)' }}>
              Convention #{conv.numero_convention || convId}
            </h2>
            {conv.offre_titre && (
              <p style={{ margin: 0, color: 'var(--text-secondary, #6b7280)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Briefcase size={14} /> {conv.offre_titre}
              </p>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {[
              { icon: GraduationCap, label: t('pages.entreprise.conventions.internLabel'),   name: conv.etudiant_nom,   signed: !!conv.signe_par_etudiant_le,   date: conv.signe_par_etudiant_le },
              { icon: Building2,     label: t('pages.entreprise.conventions.companyLabel'),  name: conv.entreprise_nom, signed: !!conv.signe_par_entreprise_le, date: conv.signe_par_entreprise_le },
            ].map(({ icon: Icon, label, name, signed, date }) => (
              <div key={label} style={{ padding: '1rem', borderRadius: '12px', background: signed ? 'rgba(16,185,129,.06)' : 'var(--surface-hover, #f8f9fa)', border: `1px solid ${signed ? 'rgba(16,185,129,.2)' : 'var(--surface-border, #e5e7eb)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <Icon size={14} color={signed ? '#10b981' : '#9ca3af'} />
                  <span style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-secondary, #6b7280)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</span>
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-color, #111)', marginBottom: '0.2rem' }}>
                  {name || '—'}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: signed ? '#10b981' : '#9ca3af' }}>
                  {signed ? (sig(date, dateLocale) || t('pages.entreprise.conventions.signed')) : t('pages.entreprise.conventions.awaitingSignature')}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
            {(conv.fichier_convention || conv.fichier_signe) && (
              <button onClick={onView} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1.5px solid var(--primary, #1B6EF3)', background: 'transparent', color: 'var(--primary, #1B6EF3)', fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer' }}>
                <Eye size={15} />{conv.fichier_signe ? t('pages.entreprise.conventions.viewSigned') : t('pages.entreprise.conventions.viewTemplate')} <ArrowUpRight size={14} />
              </button>
            )}
            {!isValidated && (
              <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', borderRadius: '12px', background: 'var(--primary, #1B6EF3)', color: '#fff', fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer' }}>
                <Upload size={15} />
                {uploadingId === convId ? t('pages.entreprise.conventions.uploading') : t('pages.entreprise.conventions.signUpload')}
                <input type="file" onChange={(e) => onUpload(e, convId)} style={{ display: 'none' }} disabled={uploadingId === convId} />
              </label>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--surface-card, #fff)',
      borderRadius: '16px',
      border: '1px solid var(--surface-border, #e5e7eb)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 2px 12px rgba(0,0,0,.05)',
      transition: 'box-shadow .2s, transform .2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Card header visual */}
      <div style={{ height: '120px', background: `linear-gradient(135deg, ${avatarBg}22 0%, ${avatarBg}44 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: `${avatarBg}20` }} />
        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${avatarBg}55` }}>
          <FileText size={22} color="#fff" />
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.7rem', borderRadius: '999px', background: statusColor.bg, color: statusColor.color, border: `1px solid ${statusColor.border}`, fontSize: '0.7rem', fontWeight: '700', letterSpacing: '.04em', backdropFilter: 'blur(4px)', zIndex: 1 }}>
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: statusColor.color }} />
          {statusLabel}
        </span>
      </div>

      {/* Card body */}
      <div style={{ padding: '1.25rem 1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-secondary, #9ca3af)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
            {t('pages.entreprise.conventions.applicationLabel', { n: conv.candidature })}
          </div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-color, #111)', lineHeight: 1.3 }}>
            Convention #{conv.numero_convention || convId}
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {[
            { icon: GraduationCap, name: conv.etudiant_nom,   signed: !!conv.signe_par_etudiant_le,   date: conv.signe_par_etudiant_le },
            { icon: Building2,     name: conv.entreprise_nom, signed: !!conv.signe_par_entreprise_le, date: conv.signe_par_entreprise_le },
          ].map(({ icon: Icon, name, signed, date }, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-color, #374151)', fontWeight: '600' }}>
                <Icon size={12} color="#9ca3af" /> {name || '—'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: '700', color: signed ? '#10b981' : '#f59e0b' }}>
                {signed ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                {signed ? (sig(date, dateLocale) || t('pages.entreprise.conventions.signed')) : t('pages.entreprise.conventions.pending')}
              </span>
            </div>
          ))}
          {conv.offre_titre && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.73rem', color: 'var(--text-secondary, #6b7280)', marginTop: '0.1rem' }}>
              <Briefcase size={11} color="#9ca3af" />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.offre_titre}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card footer */}
      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--surface-border, #e5e7eb)', display: 'flex', gap: '0.5rem' }}>
        {(conv.fichier_convention || conv.fichier_signe) && (
          <button onClick={onView} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.6rem', borderRadius: '10px', border: '1.5px solid var(--surface-border, #e5e7eb)', background: 'transparent', color: 'var(--text-color, #374151)', fontWeight: '700', fontSize: '0.78rem', cursor: 'pointer' }}>
            <Eye size={13} />{conv.fichier_signe ? t('pages.entreprise.conventions.viewSigned') : t('pages.entreprise.conventions.viewTemplate')}
          </button>
        )}
        {!isValidated && (
          <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.6rem', borderRadius: '10px', background: 'var(--primary, #1B6EF3)', color: '#fff', fontWeight: '700', fontSize: '0.78rem', cursor: 'pointer' }}>
            <Upload size={13} />
            {uploadingId === convId ? t('pages.entreprise.conventions.uploading') : t('pages.entreprise.conventions.sign')}
            <input type="file" onChange={(e) => onUpload(e, convId)} style={{ display: 'none' }} disabled={uploadingId === convId} />
          </label>
        )}
        {isValidated && !(conv.fichier_convention || conv.fichier_signe) && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.6rem', borderRadius: '10px', background: 'rgba(16,185,129,.08)', color: '#10b981', fontWeight: '700', fontSize: '0.78rem' }}>
            <CheckCircle2 size={13} /> {t('pages.entreprise.conventions.complete')}
          </div>
        )}
      </div>
    </div>
  );
};

const Conventions = () => {
  const { t } = useTranslation();
  const [uploadingId, setUploadingId] = useState(null);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const { data: conventionsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['entreprise-conventions'],
    queryFn: async () => {
      const response = await api.get('conventions/');
      return response.data;
    }
  });

  const conventions = Array.isArray(conventionsData) ? conventionsData : (conventionsData?.results || []);

  const filtered = conventions.filter(c => {
    const isSigned = !!(c.signe_par_etudiant_le && c.signe_par_entreprise_le);
    const matchSearch = search === '' ||
      (c.numero_convention || '').toLowerCase().includes(search.toLowerCase()) ||
      String(c.candidature).includes(search);
    const matchFilter =
      filter === 'all' ||
      (filter === 'validee' && isSigned) ||
      (filter === 'attente' && !isSigned);
    return matchSearch && matchFilter;
  });

  const handleFileUpload = async (e, conventionId) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('fichier_signe', selectedFile);
    setUploadingId(conventionId);
    setMessage('');
    try {
      await api.post(`conventions/${conventionId}/signer-entreprise/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage('success');
      refetch();
    } catch {
      setMessage('error');
    } finally {
      setUploadingId(null);
    }
  };

  const handleView = (conv) => {
    const url = mediaUrl(conv.fichier_signe || conv.fichier_convention);
    if (url) window.open(url, '_blank');
  };

  const stats = {
    total:    conventions.length,
    validees: conventions.filter(c => !!(c.signe_par_etudiant_le && c.signe_par_entreprise_le)).length,
    attente:  conventions.filter(c => !(c.signe_par_etudiant_le && c.signe_par_entreprise_le)).length,
  };

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', gap: '1rem', color: 'var(--text-secondary, #6b7280)' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--primary, #1B6EF3)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      {t('pages.entreprise.conventions.loading')}
    </div>
  );

  if (isError) return (
    <div style={{ padding: '4rem', textAlign: 'center' }}>
      <AlertCircle size={40} color="#ef4444" style={{ marginBottom: '1rem' }} />
      <p style={{ color: '#ef4444', fontWeight: '600' }}>{t('pages.entreprise.conventions.errorLoading')}</p>
    </div>
  );

  return (
    <div style={{ maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <p style={{ margin: '0 0 0.4rem', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--primary, #1B6EF3)' }}>
              {t('pages.entreprise.conventions.eyebrow')}
            </p>
            <h1 style={{ margin: '0 0 0.5rem', fontSize: '2.2rem', fontWeight: '800', lineHeight: 1.1, color: 'var(--text-color, #111)' }}>
              {t('pages.entreprise.conventions.title')}
            </h1>
            <p style={{ margin: 0, color: 'var(--text-secondary, #6b7280)', fontSize: '1rem' }}>
              {t('pages.entreprise.conventions.subtitle')}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexShrink: 0 }}>
            {[
              { label: t('pages.entreprise.conventions.statTotal'),     value: stats.total,    color: 'var(--primary, #1B6EF3)' },
              { label: t('pages.entreprise.conventions.statValidated'), value: stats.validees, color: '#10b981' },
              { label: t('pages.entreprise.conventions.statPending'),   value: stats.attente,  color: '#f59e0b' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center', padding: '0.75rem 1.25rem', background: 'var(--surface-card, #fff)', borderRadius: '14px', border: '1px solid var(--surface-border, #e5e7eb)', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: '800', color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-secondary, #9ca3af)', textTransform: 'uppercase', letterSpacing: '.05em', marginTop: '0.2rem' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search & filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
          <Search size={15} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary, #9ca3af)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('pages.entreprise.conventions.searchPlaceholder')}
            style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '1rem', paddingTop: '0.65rem', paddingBottom: '0.65rem', borderRadius: '12px', border: '1.5px solid var(--surface-border, #e5e7eb)', background: 'var(--surface-card, #fff)', fontSize: '0.875rem', color: 'var(--text-color, #111)', outline: 'none', boxSizing: 'border-box', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}
            onFocus={e => e.target.style.borderColor = 'var(--primary, #1B6EF3)'}
            onBlur={e => e.target.style.borderColor = 'var(--surface-border, #e5e7eb)'}
          />
        </div>
        <div style={{ display: 'flex', background: 'var(--surface-card, #fff)', borderRadius: '12px', border: '1.5px solid var(--surface-border, #e5e7eb)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
          {[
            { key: 'all',     label: t('pages.entreprise.conventions.filterAll') },
            { key: 'validee', label: t('pages.entreprise.conventions.filterValidated') },
            { key: 'attente', label: t('pages.entreprise.conventions.filterPending') },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{ padding: '0.65rem 1.1rem', border: 'none', background: filter === f.key ? 'var(--primary, #1B6EF3)' : 'transparent', color: filter === f.key ? '#fff' : 'var(--text-secondary, #6b7280)', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', transition: 'all .15s' }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toast message */}
      {message && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', borderRadius: '14px', marginBottom: '1.5rem', background: message === 'success' ? 'rgba(16,185,129,.1)' : 'rgba(239,68,68,.1)', color: message === 'success' ? '#10b981' : '#ef4444', border: `1px solid ${message === 'success' ? 'rgba(16,185,129,.25)' : 'rgba(239,68,68,.25)'}`, fontWeight: '600', fontSize: '0.875rem' }}>
          {message === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {message === 'success' ? t('pages.entreprise.conventions.successMsg') : t('pages.entreprise.conventions.errorMsg')}
          <button onClick={() => setMessage('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: '700', fontSize: '1rem', lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'var(--surface-card, #fff)', borderRadius: '20px', border: '2px dashed var(--surface-border, #e5e7eb)' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: 'var(--surface-hover, #f3f4f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <FileCheck size={32} color="#9ca3af" />
          </div>
          <h3 style={{ margin: '0 0 0.5rem', fontWeight: '800', fontSize: '1.2rem' }}>
            {search || filter !== 'all' ? t('pages.entreprise.conventions.emptyNoResults') : t('pages.entreprise.conventions.emptyNoActive')}
          </h3>
          <p style={{ color: 'var(--text-secondary, #6b7280)', margin: 0 }}>
            {search || filter !== 'all' ? t('pages.entreprise.conventions.emptyFilterHint') : t('pages.entreprise.conventions.emptyNoAppsHint')}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {filtered.map((conv) => (
            <ConventionCard
              key={conv.id || conv.id_convention}
              conv={conv}
              uploadingId={uploadingId}
              onUpload={handleFileUpload}
              onView={() => handleView(conv)}
            />
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Conventions;
