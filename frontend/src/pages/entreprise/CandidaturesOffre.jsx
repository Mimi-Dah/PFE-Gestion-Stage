import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../components/PageHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  MessageSquare,
  FileSignature,
  AlertCircle,
  Eye,
  ExternalLink
} from 'lucide-react';
import api, { mediaUrl } from '../../services/api';

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
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '2rem' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ backgroundColor: 'var(--surface-section)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '860px', height: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontWeight: '700', fontSize: '1rem' }}>CV — {name}</span>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <a href={url} download target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>
              <ExternalLink size={14} /> {downloadLabel}
            </a>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--text-muted)', lineHeight: 1, padding: '0 0.25rem', boxShadow: 'none' }}>×</button>
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

const CandidaturesOffre = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState('');
  const [cvPreview, setCvPreview] = useState(null);

  const { data: candidaturesData, isLoading, isError, error } = useQuery({
    queryKey: ['candidatures-offre', id],
    queryFn: async () => {
      const result = await api.safeRequest(api.get(`candidatures/offre/${id}/`));
      if (result.ok) return result.value.data;
      throw result.error;
    }
  });

  const candidatures = Array.isArray(candidaturesData) ? candidaturesData : (candidaturesData?.results || []);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ candId, statut }) => {
      const result = await api.safeRequest(api.patch(`candidatures/${candId}/statut/`, { statut }));
      if (result.ok) return result.value.data;
      throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidatures-offre', id] });
      setActionError('');
    },
    onError: (err) => {
      setActionError(err.message || t('pages.entreprise.candidaturesOffre.errorLoading'));
    }
  });

  if (isLoading) return (
    <div style={{ padding: '5rem', textAlign: 'center' }}>
      {t('pages.entreprise.candidaturesOffre.loading')}
    </div>
  );
  if (isError) return (
    <div style={{ padding: '5rem', textAlign: 'center', color: 'var(--error)' }}>
      {error?.message || t('pages.entreprise.candidaturesOffre.errorLoading')}
    </div>
  );

  return (
    <div>
      {cvPreview && (
        <CVModal
          url={cvPreview.url}
          name={cvPreview.name}
          onClose={() => setCvPreview(null)}
          downloadLabel={t('pages.entreprise.gestionCandidatures.download')}
        />
      )}
      <Link
        to="/espace/entreprise/offres"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: '600' }}
      >
        <ArrowLeft size={15} />
        {t('pages.entreprise.candidaturesOffre.backToOffers')}
      </Link>

      <PageHeader
        eyebrow={t('pages.entreprise.candidaturesOffre.eyebrow')}
        title={t('pages.entreprise.candidaturesOffre.title', { id })}
        subtitle={t('pages.entreprise.candidaturesOffre.subtitle')}
      />

      {actionError && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
          {actionError}
        </div>
      )}

      {candidatures.length === 0 ? (
        <div className="vl-card" style={{ textAlign: 'center', padding: '5rem', border: '2px dashed var(--surface-border)' }}>
          <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
            {t('pages.entreprise.candidaturesOffre.noApps')}
          </p>
        </div>
      ) : (
        <div className="vl-card">
          <table className="vl-table">
            <thead>
              <tr>
                {[
                  t('pages.entreprise.candidaturesOffre.colCandidate'),
                  t('pages.entreprise.candidaturesOffre.colContact'),
                  t('pages.entreprise.candidaturesOffre.colDate'),
                  t('pages.entreprise.candidaturesOffre.colStatus'),
                  t('pages.entreprise.candidaturesOffre.colActions'),
                ].map((h, i) => (
                  <th key={h} className={i === 4 ? 'vl-th vl-th-r' : 'vl-th'}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {candidatures.map((cand) => {
                const student = cand.etudiant_detail || {};
                const avColor = `vl-c${(student.prenom?.charCodeAt(0)||0) % 6}`;
                const initls  = ((student.prenom?.[0]||'')+(student.nom?.[0]||'')).toUpperCase()||'?';
                const statusStyle = cand.statut === 'Acceptée'
                  ? { color: 'var(--success)', bg: 'var(--success-light)' }
                  : cand.statut === 'Refusée'
                  ? { color: 'var(--error)', bg: 'var(--error-light)' }
                  : { color: 'var(--warning)', bg: 'var(--warning-light)' };
                return (
                  <tr key={cand.id || cand.id_candidature} className="vl-row">
                    <td className="vl-td">
                      <div className="vl-identity">
                        <div className={`vl-avt ${avColor}`} style={{ overflow: 'hidden' }}>
                          {student.photo ? <img src={student.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initls}
                        </div>
                        <div>
                          <div className="vl-name">{student.prenom} {student.nom}</div>
                          <div className="vl-sub">{student.niveau_academique || 'Student'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="vl-td" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Mail size={11} />{student.user?.courriel}</span>
                        {student.cv && (
                          <button className="vl-btn p-btn" onClick={() => setCvPreview({ url: mediaUrl(student.cv), name: `${student.prenom} ${student.nom}` })} style={{ width: 'auto', padding: '0.2rem 0.6rem', fontSize: '0.73rem' }}>
                            <Eye size={11} /> CV
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="vl-td" style={{ fontSize: '0.875rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Calendar size={13} />{new Date(cand.postule_le).toLocaleDateString('en-GB')}
                      </div>
                    </td>
                    <td className="vl-td">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.28rem 0.75rem', borderRadius: '100px', backgroundColor: statusStyle.bg, color: statusStyle.color, fontSize: '0.73rem', fontWeight: '700' }}>
                        {cand.statut.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="vl-td-r">
                      <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                        {cand.statut === 'En_attente' && (
                          <>
                            <button className="vl-btn s-btn" onClick={() => updateStatusMutation.mutate({ candId: cand.id || cand.id_candidature, statut: 'Acceptée' })} disabled={updateStatusMutation.isPending} title={t('pages.entreprise.candidaturesOffre.titleAccept')}>
                              <CheckCircle size={13} />
                            </button>
                            <button className="vl-btn danger" onClick={() => updateStatusMutation.mutate({ candId: cand.id || cand.id_candidature, statut: 'Refusée' })} disabled={updateStatusMutation.isPending} title={t('pages.entreprise.candidaturesOffre.titleReject')}>
                              <XCircle size={13} />
                            </button>
                          </>
                        )}
                        {cand.statut === 'Acceptée' && (
                          <button className="vl-btn p-btn" onClick={() => navigate('/espace/entreprise/conventions')} title={t('pages.entreprise.candidaturesOffre.titleConvention')}>
                            <FileSignature size={13} />
                          </button>
                        )}
                        {cand.statut === 'Stage_actif' && (
                          <button className="vl-btn danger" onClick={async () => { const m = prompt('Reason:'); if (!m) return; const r = await api.safeRequest(api.post('absences/', { candidature: cand.id || cand.id_candidature, date_absence: new Date().toISOString().split('T')[0], motif_signalement: m })); if (r.ok) alert('Reported.'); }} title={t('pages.entreprise.candidaturesOffre.titleAbsence')}>
                            <AlertCircle size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="vl-footer">
            <span>{t('pages.entreprise.candidaturesOffre.count_other', { count: candidatures.length })}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidaturesOffre;
