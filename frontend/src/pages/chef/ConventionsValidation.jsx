import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../components/PageHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText, CheckCircle, XCircle, Eye, AlertTriangle,
  Clock, Upload, User, Building, FileSearch,
} from 'lucide-react';
import api from '../../services/api';
import { dateLocale } from '../../utils/dateLocale';

const SLABadge = ({ joursRestants }) => {
  const { t } = useTranslation();
  if (joursRestants === null || joursRestants === undefined) return null;
  const overdue = joursRestants < 0;
  const urgent  = joursRestants <= 1;
  const color = overdue ? '#b91c1c' : urgent ? '#92400e' : '#15803d';
  const bg    = overdue ? '#fee2e2' : urgent ? '#fef9c3' : '#dcfce7';
  const label = overdue
    ? t('pages.chefConventions.overdueLabel', { days: Math.abs(joursRestants) })
    : joursRestants === 0 ? t('pages.chefConventions.lastDay')
    : t('pages.chefConventions.daysLeft', { count: joursRestants });
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.55rem', borderRadius: '999px', background: bg, color, fontSize: '0.72rem', fontWeight: 700 }}>
      <Clock size={11} /> {label}
    </span>
  );
};

const RejectionModal = ({ isOpen, onClose, onConfirm, studentName, isPending }) => {
  const { t } = useTranslation();
  const [motif, setMotif] = useState('');
  if (!isOpen) return null;
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}
    >
      <div style={{ background: 'var(--bg-card)', borderRadius: '10px', width: '100%', maxWidth: '460px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <XCircle size={15} color="#ef4444" />
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>{t('pages.chefConventions.rejectTitle')}</span>
        </div>
        <div style={{ padding: '1rem' }}>
          <p style={{ margin: '0 0 0.85rem', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {t('pages.chefConventions.rejectReason', { name: studentName })}
          </p>
          <textarea
            placeholder={t('pages.chefConventions.rejectPlaceholder')}
            value={motif}
            onChange={e => setMotif(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', height: '100px', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.82rem', resize: 'none', outline: 'none', marginBottom: '0.85rem' }}
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={onClose}
              style={{ flex: 1, height: '36px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-card)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-color)' }}
            >
              {t('pages.chefConventions.cancel')}
            </button>
            <button
              onClick={() => onConfirm(motif)}
              disabled={!motif.trim() || isPending}
              style={{ flex: 1, height: '36px', border: 'none', borderRadius: '6px', background: '#ef4444', color: '#fff', cursor: !motif.trim() || isPending ? 'not-allowed' : 'pointer', opacity: !motif.trim() || isPending ? 0.6 : 1, fontSize: '0.82rem', fontWeight: 600 }}
            >
              {isPending ? t('pages.chefConventions.rejecting') : t('pages.chefConventions.confirmReject')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ConventionCard = ({ conv, queryClient }) => {
  const { t, i18n } = useTranslation();
  const convId = conv.id || conv.id_convention;
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [fileName, setFileName] = useState('');
  const [actionError, setActionError] = useState('');
  const fileRef = useRef(null);

  const validateMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      if (fileRef.current?.files?.length > 0) formData.append('fichier_convention', fileRef.current.files[0]);
      const result = await api.safeRequest(api.post(`conventions/${convId}/valider/`, formData));
      if (result.ok) return result.value.data;
      throw result.error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['conventions-en-attente'] }); setActionError(''); },
    onError: (err) => setActionError(err.message || t('pages.chefConventions.validationFailed')),
  });

  const refuseMutation = useMutation({
    mutationFn: async (motif) => {
      const result = await api.safeRequest(api.post(`conventions/${convId}/refuser/`, { motif_refus: motif }));
      if (result.ok) return result.value.data;
      throw result.error;
    },
    onSuccess: () => { setShowRejectModal(false); queryClient.invalidateQueries({ queryKey: ['conventions-en-attente'] }); setActionError(''); },
    onError: (err) => setActionError(err.message || t('pages.chefConventions.rejectionFailed')),
  });

  const isPending = validateMutation.isPending || refuseMutation.isPending;

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
      <RejectionModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={m => refuseMutation.mutate(m)}
        studentName={conv.etudiant_nom}
        isPending={refuseMutation.isPending}
      />

      {/* Card header */}
      <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '7px', background: '#eef2ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileText size={15} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {t('pages.chefConventions.convNumber', { number: conv.numero_convention || convId })}
              </span>
              <SLABadge joursRestants={conv.jours_restants} />
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
              {t('pages.chefConventions.receivedOn', { date: new Date(conv.cree_le).toLocaleDateString(dateLocale(i18n.language)) })}
              {conv.deadline && ` · ${t('pages.chefConventions.expiresOn', { date: new Date(conv.deadline).toLocaleDateString(dateLocale(i18n.language)) })}`}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {conv.fichier_convention && (
            <button
              onClick={() => window.open(conv.fichier_convention, '_blank')}
              style={{ height: '30px', padding: '0 0.75rem', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-card)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-color)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Eye size={12} /> {t('pages.chefConventions.template')}
            </button>
          )}
          {conv.fichier_signe && (
            <button
              onClick={() => window.open(conv.fichier_signe, '_blank')}
              style={{ height: '30px', padding: '0 0.75rem', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-card)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-color)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Eye size={12} /> {t('pages.chefConventions.signed')}
            </button>
          )}
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
          {[
            { label: t('pages.chefConventions.student'), value: conv.etudiant_nom,   Icon: User     },
            { label: t('pages.chefConventions.company'), value: conv.entreprise_nom, Icon: Building },
            { label: t('pages.chefConventions.offer'),   value: conv.offre_titre,    Icon: null     },
          ].map(({ label, value, Icon }) => (
            <div key={label} style={{ border: '1px solid var(--border)', borderRadius: '7px', padding: '0.65rem 0.85rem' }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>{label}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {Icon && <Icon size={12} color="#9ca3af" />}
                {value || '—'}
              </div>
            </div>
          ))}
        </div>

        {/* Signature status + actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {[
              { label: t('pages.chefConventions.signedStudent'),  done: !!conv.signe_par_etudiant_le   },
              { label: t('pages.chefConventions.signedCompany'),  done: !!conv.signe_par_entreprise_le },
            ].map(({ label, done }) => (
              <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: 500, color: done ? '#15803d' : 'var(--text-muted)' }}>
                <CheckCircle size={13} color={done ? '#22c55e' : 'var(--border)'} />
                {label}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input ref={fileRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={e => setFileName(e.target.files[0]?.name || '')} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={isPending}
              style={{ height: '30px', padding: '0 0.75rem', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-card)', cursor: isPending ? 'not-allowed' : 'pointer', fontSize: '0.75rem', fontWeight: 600, color: fileName ? '#15803d' : 'var(--text-color)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Upload size={12} /> {fileName ? t('pages.chefConventions.documentAttached') : t('pages.chefConventions.attachPdf')}
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={isPending}
              style={{ height: '30px', padding: '0 0.75rem', border: '1px solid #fecaca', borderRadius: '6px', background: '#fff5f5', cursor: isPending ? 'not-allowed' : 'pointer', fontSize: '0.75rem', fontWeight: 600, color: '#b91c1c', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <XCircle size={12} /> {t('pages.chefConventions.reject')}
            </button>
            <button
              onClick={() => validateMutation.mutate()}
              disabled={isPending}
              style={{ height: '30px', padding: '0 0.85rem', border: 'none', borderRadius: '6px', background: '#15803d', color: '#fff', cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.7 : 1, fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <CheckCircle size={12} /> {validateMutation.isPending ? t('pages.chefConventions.validating') : t('pages.chefConventions.validate')}
            </button>
          </div>
        </div>

        {actionError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.85rem', borderRadius: '6px', background: '#fee2e2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '0.78rem', fontWeight: 600 }}>
            <AlertTriangle size={13} /> {actionError}
          </div>
        )}
      </div>
    </div>
  );
};

const ConventionsValidation = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: conventionsData, isLoading, isError, error } = useQuery({
    queryKey: ['conventions-en-attente'],
    queryFn: async () => {
      const result = await api.safeRequest(api.get('conventions/en-attente/'));
      if (result.ok) return result.value.data;
      throw result.error;
    },
  });

  const conventions = Array.isArray(conventionsData) ? conventionsData : (conventionsData?.results || []);
  const overdue = conventions.filter(c => (c.jours_restants ?? 1) < 0).length;
  const urgent  = conventions.filter(c => c.jours_restants >= 0 && c.jours_restants <= 1).length;

  return (
    <div style={{ padding: '0 0 2rem' }}>

      <PageHeader
        eyebrow={t('pages.chefConventions.eyebrow')}
        title={t('pages.chefConventions.title')}
        subtitle={t('pages.chefConventions.subtitle')}
      />

      {/* Stat chips */}
      {!isLoading && !isError && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: t('pages.chefConventions.statPending'), value: conventions.length, color: '#6366f1', bg: '#eef2ff', icon: <FileSearch size={18} /> },
            { label: t('pages.chefConventions.statOverdue'), value: overdue,            color: '#b91c1c', bg: '#fee2e2', icon: <AlertTriangle size={18} /> },
            { label: t('pages.chefConventions.statUrgent'),  value: urgent,             color: '#92400e', bg: '#fef9c3', icon: <Clock size={18} /> },
          ].map(s => (
            <div
              key={s.label}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem', transition: 'transform 0.18s ease, box-shadow 0.18s ease' }}>
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
      )}

      {/* Content */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', height: '180px' }} />
          ))}
        </div>
      ) : isError ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid #fecaca', borderRadius: '8px', padding: '2.5rem', textAlign: 'center' }}>
          <AlertTriangle size={32} color="#ef4444" style={{ marginBottom: '0.75rem' }} />
          <p style={{ margin: 0, color: '#b91c1c', fontWeight: 600, fontSize: '0.875rem' }}>{error?.message || t('pages.chefConventions.errorConnection')}</p>
        </div>
      ) : conventions.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)', borderRadius: '8px', padding: '4rem', textAlign: 'center' }}>
          <CheckCircle size={36} color="#22c55e" style={{ marginBottom: '0.75rem', opacity: 0.6 }} />
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.3rem' }}>{t('pages.chefConventions.allGood')}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{t('pages.chefConventions.noPending')}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {conventions.map(conv => (
            <ConventionCard key={conv.id || conv.id_convention} conv={conv} queryClient={queryClient} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ConventionsValidation;
