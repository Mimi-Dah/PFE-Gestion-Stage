import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../components/PageHeader';
import {
  FileText, User, ExternalLink, Mail, Phone, Calendar,
  CheckCircle, XCircle, Eye, X,
} from 'lucide-react';
import api from '../../services/api';
import SkeletonLoader from '../../components/ui/SkeletonLoader';

/* ── CV preview modal ─────────────────────────────────────────── */

const CVModal = ({ url, name, onClose, downloadLabel }) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    let objectUrl;
    setLoading(true);
    setFetchError(false);
    fetch(url)
      .then(r => { if (!r.ok) throw new Error(); return r.blob(); })
      .then(blob => { objectUrl = URL.createObjectURL(blob); setBlobUrl(objectUrl); setLoading(false); })
      .catch(() => { setFetchError(true); setLoading(false); });
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [url]);

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '2rem' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ backgroundColor: 'var(--surface-card)', borderRadius: '10px', width: '100%', maxWidth: '860px', height: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid var(--surface-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={16} color="var(--primary)" />
            <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)' }}>CV — {name}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <a href={url} download target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '700', textDecoration: 'none' }}>
              <ExternalLink size={13} /> {downloadLabel}
            </a>
            <button onClick={onClose}
              style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={14} />
            </button>
          </div>
        </div>
        {loading && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Chargement…
          </div>
        )}
        {fetchError && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--error)', fontSize: '0.875rem' }}>
            Impossible de charger le fichier.
          </div>
        )}
        {blobUrl && (
          <embed src={blobUrl} type="application/pdf" style={{ flex: 1, border: 'none', width: '100%', height: '100%' }} />
        )}
      </div>
    </div>
  );
};

/* ── status style config (no label — label is computed via t()) ── */

const STATUS_STYLE = {
  En_attente:          { color: 'var(--text-muted)',  bg: 'var(--surface-border)', border: 'var(--border)' },
  Acceptée:            { color: 'var(--success)',     bg: 'var(--success-light)',  border: 'var(--success)33' },
  Convention_en_cours: { color: 'var(--primary)',     bg: 'var(--primary-light)', border: 'var(--primary)33' },
  Refusée:             { color: 'var(--error)',       bg: 'var(--error-light)',   border: 'var(--error)33' },
};

const StatusTag = ({ statut, label }) => {
  const s = STATUS_STYLE[statut] ?? STATUS_STYLE.En_attente;
  return (
    <span style={{
      display: 'inline-block', padding: '0.28rem 0.75rem', borderRadius: '100px',
      fontSize: '0.73rem', fontWeight: '700', whiteSpace: 'nowrap',
      color: s.color, backgroundColor: s.bg, border: `1px solid ${s.border}`,
    }}>{label}</span>
  );
};

/* ── main component ───────────────────────────────────────────── */

const GestionCandidatures = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [cvPreview, setCvPreview] = useState(null);
  const [filter, setFilter]       = useState('all');
  const [actionError, setActionError] = useState('');

  const STATUS_LABELS = {
    En_attente:          t('pages.entreprise.gestionCandidatures.statusNew'),
    Acceptée:            t('pages.entreprise.gestionCandidatures.statusAccepted'),
    Convention_en_cours: t('pages.entreprise.gestionCandidatures.statusConvention'),
    Refusée:             t('pages.entreprise.gestionCandidatures.statusRejected'),
  };

  const FILTERS = [
    { value: 'all',                label: t('pages.entreprise.gestionCandidatures.filterAll') },
    { value: 'En_attente',         label: t('pages.entreprise.gestionCandidatures.filterNew') },
    { value: 'Acceptée',           label: t('pages.entreprise.gestionCandidatures.filterAccepted') },
    { value: 'Convention_en_cours',label: t('pages.entreprise.gestionCandidatures.filterConvention') },
    { value: 'Refusée',            label: t('pages.entreprise.gestionCandidatures.filterRejected') },
  ];

  const { data: raw, isLoading } = useQuery({
    queryKey: ['entreprise-candidatures'],
    queryFn: async () => (await api.get('candidatures/')).data,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, statut }) => {
      const result = await api.safeRequest(api.patch(`candidatures/${id}/statut/`, { statut }));
      if (result.ok) return result.value.data;
      throw result.error;
    },
    onSuccess: () => {
      setActionError('');
      queryClient.invalidateQueries({ queryKey: ['entreprise-candidatures'] });
    },
    onError: (err) => {
      setActionError(err.message || t('pages.entreprise.gestionCandidatures.errorUpdating'));
    },
  });

  const all = Array.isArray(raw) ? raw : (raw?.results ?? []);
  const active = all.filter(c => Object.keys(STATUS_STYLE).includes(c.statut));
  const rows   = filter === 'all' ? active : active.filter(c => c.statut === filter);

  if (isLoading) return <SkeletonLoader variant="table" />;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
      {cvPreview && (
        <CVModal
          url={cvPreview.url}
          name={cvPreview.name}
          onClose={() => setCvPreview(null)}
          downloadLabel={t('pages.entreprise.gestionCandidatures.download')}
        />
      )}

      <PageHeader
        eyebrow={t('pages.entreprise.gestionCandidatures.eyebrow')}
        title={t('pages.entreprise.gestionCandidatures.title')}
        subtitle={t('pages.entreprise.gestionCandidatures.subtitle')}
      />

      {actionError && (
        <div style={{ backgroundColor: 'var(--error-light)', color: 'var(--error)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
          {actionError}
        </div>
      )}

      {/* CRUD card */}
      <div className="vl-card">

        {/* Toolbar: filter tabs + count */}
        <div className="vl-toolbar">
          <div className="vl-pills">
            {FILTERS.map(opt => {
              const count = opt.value === 'all' ? active.length : active.filter(c => c.statut === opt.value).length;
              return (
                <button key={opt.value} className={`vl-pill${filter === opt.value ? ' active' : ''}`} onClick={() => setFilter(opt.value)}>
                  {opt.label} <span style={{ fontSize: '0.7rem', opacity: 0.75 }}>({count})</span>
                </button>
              );
            })}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600' }}>
            {t('pages.entreprise.gestionCandidatures.results_other', { count: rows.length })}
          </span>
        </div>

        {/* Table */}
        {rows.length === 0 ? (
          <div style={{ padding: '5rem 1.25rem', textAlign: 'center' }}>
            <FileText size={36} style={{ color: 'var(--text-muted)', opacity: 0.35, display: 'block', margin: '0 auto 0.75rem' }} />
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '600' }}>
              {t('pages.entreprise.gestionCandidatures.noApps')}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="vl-table">
              <thead>
                <tr>
                  {[
                    t('pages.entreprise.gestionCandidatures.colCandidate'),
                    t('pages.entreprise.gestionCandidatures.colOffer'),
                    t('pages.entreprise.gestionCandidatures.colContact'),
                    t('pages.entreprise.gestionCandidatures.colDate'),
                    t('pages.entreprise.gestionCandidatures.colStatus'),
                    t('pages.entreprise.gestionCandidatures.colActions'),
                  ].map((h) => (
                    <th key={h} className="vl-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((cand) => {
                  const prenom = cand.etudiant_detail?.prenom || '';
                  const nom    = cand.etudiant_detail?.nom    || '';
                  const initls = ((prenom[0]||'') + (nom[0]||'')).toUpperCase() || '?';
                  const avColor = `vl-c${(prenom.charCodeAt(0)||0) % 6}`;
                  return (
                  <tr key={cand.id_candidature} className="vl-row">
                    <td className="vl-td">
                      <div className="vl-identity">
                        <div className={`vl-avt ${avColor}`} style={{ overflow: 'hidden' }}>
                          {cand.etudiant_detail?.photo
                            ? <img src={cand.etudiant_detail.photo} alt="" />
                            : initls}
                        </div>
                        <div>
                          <div className="vl-name">{prenom} {nom}</div>
                          <div className="vl-sub"><Mail size={11} />{cand.etudiant_detail?.user?.courriel ?? '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="vl-td" style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', maxWidth: 180 }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {cand.offre_detail?.titre ?? '—'}
                      </div>
                    </td>
                    <td className="vl-td">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                        {cand.etudiant_detail?.telephone && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Phone size={11} /> {cand.etudiant_detail.telephone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="vl-td" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Calendar size={12} /> {new Date(cand.postule_le).toLocaleDateString('en-GB')}
                      </span>
                    </td>
                    <td className="vl-td">
                      <StatusTag statut={cand.statut} label={STATUS_LABELS[cand.statut] || cand.statut} />
                    </td>
                    <td className="vl-td">
                      <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                        {cand.etudiant_detail?.cv ? (
                          <button className="vl-btn p-btn"
                            onClick={() => setCvPreview({ url: cand.etudiant_detail.cv, name: `${prenom} ${nom}` })}
                            title={t('pages.entreprise.gestionCandidatures.viewCV')}
                          >
                            <Eye size={13} />
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontStyle: 'italic', whiteSpace: 'nowrap' }}>
                            {t('pages.entreprise.gestionCandidatures.noCV')}
                          </span>
                        )}
                        {cand.statut === 'En_attente' && (
                          <>
                            <button className="vl-btn s-btn"
                              onClick={() => updateStatus.mutate({ id: cand.id_candidature, statut: 'Acceptée' })}
                              disabled={updateStatus.isPending}
                              title={t('pages.entreprise.gestionCandidatures.titleAccept')}
                            >
                              <CheckCircle size={13} />
                            </button>
                            <button className="vl-btn danger"
                              onClick={() => updateStatus.mutate({ id: cand.id_candidature, statut: 'Refusée' })}
                              disabled={updateStatus.isPending}
                              title={t('pages.entreprise.gestionCandidatures.titleReject')}
                            >
                              <XCircle size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer count */}
        <div className="vl-footer">
          <span>{t('pages.entreprise.gestionCandidatures.total_other', { count: active.length })}</span>
        </div>
      </div>
    </div>
  );
};

export default GestionCandidatures;
