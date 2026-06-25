import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../components/PageHeader';
import {
  Trash2, Users, Edit, Briefcase, Plus,
  AlertTriangle, CheckCircle2, AlertCircle, Search,
} from 'lucide-react';

import api from '../../services/api';
import SkeletonLoader from '../../components/ui/SkeletonLoader';

/* ── shared micro-components ─────────────────────────────────── */

const Tag = ({ color, bg, children }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
    padding: '0.28rem 0.75rem', borderRadius: '100px',
    fontSize: '0.73rem', fontWeight: '700',
    backgroundColor: bg, color,
  }}>{children}</span>
);

const IconBtn = ({ onClick, title, danger, as: As = 'button', to, children, disabled }) => {
  const style = {
    width: '32px', height: '32px', borderRadius: '6px', border: '1px solid',
    borderColor: danger ? 'var(--error)33' : 'var(--border)',
    backgroundColor: danger ? 'var(--error-light)' : 'transparent',
    color: danger ? 'var(--error)' : 'var(--text-muted)',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
    opacity: disabled ? 0.5 : 1, textDecoration: 'none',
  };
  const enter = e => {
    if (disabled) return;
    e.currentTarget.style.backgroundColor = danger ? 'var(--error)' : 'var(--surface-section)';
    e.currentTarget.style.color = danger ? '#fff' : 'var(--text-main)';
  };
  const leave = e => {
    e.currentTarget.style.backgroundColor = danger ? 'var(--error-light)' : 'transparent';
    e.currentTarget.style.color = danger ? 'var(--error)' : 'var(--text-muted)';
  };
  if (As === Link) return (
    <Link to={to} title={title} style={style} onMouseEnter={enter} onMouseLeave={leave}>{children}</Link>
  );
  return (
    <button onClick={onClick} title={title} disabled={disabled} style={style} onMouseEnter={enter} onMouseLeave={leave}>
      {children}
    </button>
  );
};

/* ── main component ───────────────────────────────────────────── */

const MesOffres = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch]             = useState('');
  const [toast, setToast]               = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const { data: raw, isLoading, isError } = useQuery({
    queryKey: ['mes-offres'],
    queryFn: async () => (await api.get('offres/mes-offres/')).data,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`offres/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries(['mes-offres']);
      setDeleteTarget(null);
      showToast('success', t('pages.entreprise.mesOffres.deleteSuccess'));
    },
    onError: (err) => {
      const backendErr = err.response?.data?.error;
      showToast('error', typeof backendErr === 'string' ? backendErr : backendErr?.message || t('pages.entreprise.mesOffres.deleteError'));
    },
  });

  const offres = Array.isArray(raw) ? raw : (raw?.results ?? []);
  const filtered = search
    ? offres.filter(o =>
        o.titre?.toLowerCase().includes(search.toLowerCase()) ||
        o.domaine?.toLowerCase().includes(search.toLowerCase())
      )
    : offres;

  if (isLoading) return <SkeletonLoader variant="table" />;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '4rem' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.875rem 1.25rem', borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          backgroundColor: toast.type === 'success' ? 'var(--success)' : 'var(--error)',
          color: '#fff', fontWeight: '700', fontSize: '0.875rem',
        }}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <PageHeader
        eyebrow={t('pages.entreprise.mesOffres.eyebrow')}
        title={t('pages.entreprise.mesOffres.title')}
        subtitle={t('pages.entreprise.mesOffres.subtitle')}
      />

      {isError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1.25rem', borderRadius: '8px', backgroundColor: 'var(--error-light)', color: 'var(--error)', fontWeight: '700', fontSize: '0.875rem', border: '1px solid var(--error)33', marginBottom: '1.5rem' }}>
          <AlertCircle size={16} /> {t('pages.entreprise.mesOffres.errorLoading')}
        </div>
      )}

      {/* CRUD card */}
      <div className="vl-card">

        {/* Toolbar */}
        <div className="vl-toolbar">
          <Link to="/espace/entreprise/creer-offre" style={{ textDecoration: 'none' }}>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1.125rem', borderRadius: '6px', border: 'none', backgroundColor: 'var(--primary)', color: '#fff', fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer', boxShadow: '0 2px 8px var(--primary-glow)' }}>
              <Plus size={15} /> {t('pages.entreprise.mesOffres.newOffer')}
            </button>
          </Link>
          <div className="vl-search">
            <Search size={15} />
            <input type="text" placeholder={t('pages.entreprise.mesOffres.searchPlaceholder')} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div style={{ padding: '5rem 1.25rem', textAlign: 'center' }}>
            <Briefcase size={36} style={{ color: 'var(--text-muted)', opacity: 0.35, display: 'block', margin: '0 auto 0.75rem' }} />
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '600', marginBottom: '1.25rem' }}>
              {search ? t('pages.entreprise.mesOffres.noMatch') : t('pages.entreprise.mesOffres.noOffers')}
            </div>
            {!search && (
              <Link to="/espace/entreprise/creer-offre" style={{ textDecoration: 'none' }}>
                <button style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', borderRadius: '6px', border: 'none', backgroundColor: 'var(--primary)', color: '#fff', fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer' }}>
                  <Plus size={15} /> {t('pages.entreprise.mesOffres.postOffer')}
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="vl-table">
              <thead>
                <tr>
                  {[
                    t('pages.entreprise.mesOffres.colOffer'),
                    t('pages.entreprise.mesOffres.colDomain'),
                    t('pages.entreprise.mesOffres.colDuration'),
                    t('pages.entreprise.mesOffres.colStatus'),
                    t('pages.entreprise.mesOffres.colActions'),
                  ].map((h, i) => (
                    <th key={h} className={i === 4 ? 'vl-th vl-th-r' : 'vl-th'}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((offre) => {
                  const id = offre.id || offre.id_offre;
                  const wks = offre.duree_semaines ? Math.ceil(offre.duree_semaines / 4) : 0;
                  const duree = offre.duree_semaines
                    ? (offre.duree_semaines >= 4
                        ? `${wks} ${t('pages.entreprise.mesOffres.month_other')}`
                        : `${offre.duree_semaines} ${t('pages.entreprise.mesOffres.wk')}`)
                    : '—';
                  const isActive = offre.statut === 'Active';
                  return (
                    <tr key={id} className="vl-row">
                      <td className="vl-td">
                        <div className="vl-identity">
                          <div className={`vl-avt vl-c${(offre.titre?.charCodeAt(0)||0)%6}`}>
                            {(offre.titre?.[0]||'O').toUpperCase()}
                          </div>
                          <div>
                            <div className="vl-name">{offre.titre}</div>
                            {offre.domaine && <div className="vl-sub">{offre.domaine}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="vl-td" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                        {offre.domaine || '—'}
                      </td>
                      <td className="vl-td" style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: '600', whiteSpace: 'nowrap' }}>
                        {duree}
                      </td>
                      <td className="vl-td">
                        <span className="vl-badge" style={{
                          color: isActive ? 'var(--success)' : 'var(--text-muted)',
                          background: isActive ? 'var(--success-light)' : 'var(--n100)',
                          borderColor: isActive ? 'rgba(16,185,129,.2)' : 'var(--surface-border)',
                        }}>
                          <span className="vl-badge-dot" />
                          {isActive ? t('pages.entreprise.mesOffres.statusActive') : offre.statut}
                        </span>
                      </td>
                      <td className="vl-td-r">
                        <div style={{ display: 'inline-flex', gap: '0.375rem' }}>
                          <IconBtn as={Link} to={`/espace/entreprise/offres/${id}/candidatures`} title={t('pages.entreprise.mesOffres.titleViewApps')}>
                            <Users size={14} />
                          </IconBtn>
                          <IconBtn
                            onClick={() => navigate(`/espace/entreprise/offres/${id}/edit`, { state: { backgroundLocation: location } })}
                            title={t('pages.entreprise.mesOffres.titleEdit')}
                          >
                            <Edit size={14} />
                          </IconBtn>
                          <IconBtn onClick={() => setDeleteTarget(offre)} title={t('pages.entreprise.mesOffres.titleDelete')} danger>
                            <Trash2 size={14} />
                          </IconBtn>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="vl-footer">
          <span>{filtered.length} {filtered.length !== 1 ? t('pages.entreprise.mesOffres.footerCount_other', { count: filtered.length }).replace(/^\d+ /, '') : t('pages.entreprise.mesOffres.footerCount_one', { count: filtered.length }).replace(/^\d+ /, '')}</span>
        </div>
      </div>

      {/* ── DELETE CONFIRMATION ── */}
      {deleteTarget && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}
          onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null); }}
        >
          <div style={{ backgroundColor: 'var(--surface-card)', borderRadius: '10px', width: '100%', maxWidth: '400px', boxShadow: '0 24px 64px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            <div style={{ padding: '2rem 1.5rem 1.5rem', textAlign: 'center' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: 'var(--error-light)', color: 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.125rem' }}>
                <AlertTriangle size={24} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 0.5rem' }}>
                {t('pages.entreprise.mesOffres.deleteTitle')}
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '500', lineHeight: 1.65, margin: 0 }}>
                {t('pages.entreprise.mesOffres.deleteMsg')} <strong style={{ color: 'var(--text-main)' }}>"{deleteTarget.titre}"</strong>?{' '}
                {t('pages.entreprise.mesOffres.deleteWarn')}
              </p>
            </div>
            <div style={{ display: 'flex', borderTop: '1px solid var(--surface-border)' }}>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{ flex: 1, padding: '0.875rem', border: 'none', backgroundColor: 'transparent', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', borderRight: '1px solid var(--surface-border)' }}
              >{t('pages.entreprise.mesOffres.no')}</button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id || deleteTarget.id_offre)}
                disabled={deleteMutation.isPending}
                style={{ flex: 1, padding: '0.875rem', border: 'none', backgroundColor: 'transparent', color: 'var(--error)', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', opacity: deleteMutation.isPending ? 0.7 : 1 }}
              >{deleteMutation.isPending ? t('pages.entreprise.mesOffres.deleting') : t('pages.entreprise.mesOffres.yesDelete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MesOffres;
