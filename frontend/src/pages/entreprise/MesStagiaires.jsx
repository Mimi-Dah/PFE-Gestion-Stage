import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../components/PageHeader';
import {
  Users, Search, Calendar, AlertCircle, CheckCircle,
  Mail, Phone, ClipboardCheck, User, FileText, Star,
  Clock, ChevronDown, ChevronUp, X, Activity
} from 'lucide-react';
import api from '../../services/api';
import SkeletonLoader from '../../components/ui/SkeletonLoader';

/* ─────────────────────────────────────────────
   Verona primitives
───────────────────────────────────────────── */

const Panel = ({ title, icon: Icon, iconColor, iconBg, children, headerRight, noPad = false }) => (
  <div style={{
    border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden',
    background: 'var(--bg-card)', boxShadow: '0 1px 4px rgba(0,0,0,.06)',
  }}>
    <div style={{
      padding: '0.875rem 1.25rem', background: 'var(--surface-section)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        {Icon && (
          <div style={{ width: 28, height: 28, borderRadius: '6px', background: iconBg || 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={15} color={iconColor || 'var(--primary)'} />
          </div>
        )}
        <span style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-main)' }}>{title}</span>
      </div>
      {headerRight && <div>{headerRight}</div>}
    </div>
    <div style={noPad ? {} : { padding: '1.25rem' }}>{children}</div>
  </div>
);

const TabView = ({ tabs }) => {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 1.25rem' }}>
        {tabs.map((tab, i) => (
          <button key={i} onClick={() => setActive(i)} style={{
            padding: '0.7rem 1rem', border: 'none', background: 'transparent',
            borderBottom: active === i ? '2px solid var(--primary)' : '2px solid transparent',
            color: active === i ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: active === i ? 700 : 500, fontSize: '0.85rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
            marginBottom: '-1px', transition: 'all 0.15s',
          }}>
            {tab.icon && <tab.icon size={14} />}
            {tab.label}
            {tab.count != null && (
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 18, height: 18, borderRadius: '100px', background: active === i ? 'var(--primary)' : 'var(--n200)', color: active === i ? '#fff' : 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 800, padding: '0 4px' }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
      <div style={{ padding: '1.25rem' }}>{tabs[active].content}</div>
    </div>
  );
};

const VFieldset = ({ legend, legendIcon: LI, children, legendColor = 'var(--text-muted)' }) => (
  <fieldset style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '0.875rem 1rem', margin: 0, background: 'var(--bg-card)' }}>
    <legend style={{ padding: '0 0.4rem', fontSize: '0.72rem', fontWeight: 700, color: legendColor, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
      {LI && <LI size={11} />}{legend}
    </legend>
    {children}
  </fieldset>
);

const Divider = () => (
  <div style={{ height: '1px', background: 'var(--border)', margin: '0.25rem 0' }} />
);

/* ─────────────────────────────────────────────
   Stat panel
───────────────────────────────────────────── */

const StatPanel = ({ icon: Icon, label, value, color, bg }) => (
  <div className="ms-stat-card" style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-card)', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
    <div style={{ padding: '0.7rem 1rem', background: 'var(--surface-section)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ width: 24, height: 24, borderRadius: '5px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={13} color={color} />
      </div>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
    </div>
    <div style={{ padding: '0.875rem 1rem' }}>
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   Intern card (toggleable Verona Panel)
───────────────────────────────────────────── */

const InternCard = ({ intern, reports, evaluations, onSignalAbsence, onEndStage }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(true);
  const prenom   = intern.etudiant_detail?.prenom || '';
  const nom      = intern.etudiant_detail?.nom    || '';
  const initials = ((prenom[0] || '') + (nom[0] || '')).toUpperCase() || '?';
  const avColor  = `vl-c${(prenom.charCodeAt(0) || 0) % 6}`;
  const isActive = intern.statut === 'Stage_actif';

  const report     = reports.find(r => r.etudiant === intern.etudiant && r.offre === intern.offre);
  const evaluation = evaluations.find(e => e.etudiant === intern.etudiant && e.offre === intern.offre);

  const duree = intern.offre_detail?.duree_semaines
    ? Math.round(intern.offre_detail.duree_semaines)
    : (intern.offre_detail?.date_debut && intern.offre_detail?.date_fin
        ? Math.round((new Date(intern.offre_detail.date_fin) - new Date(intern.offre_detail.date_debut)) / (7 * 24 * 3600 * 1000))
        : null);

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-card)', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>

      {/* Panel header — toggleable */}
      <div
        onClick={() => setOpen(o => !o)}
        className="ms-intern-header"
        style={{
          padding: '0.875rem 1.25rem',
          background: 'var(--surface-section)',
          borderBottom: open ? '1px solid var(--border)' : 'none',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          cursor: 'pointer', userSelect: 'none',
        }}
      >
        {intern.etudiant_detail?.photo ? (
          <img src={intern.etudiant_detail.photo} alt="" style={{ width: 38, height: 38, borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div className={`vl-avt ${avColor}`} style={{ width: 38, height: 38, borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800, flexShrink: 0 }}>
            {initials}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.2 }}>{prenom} {nom}</div>
          <div style={{ fontSize: '0.76rem', color: 'var(--primary)', fontWeight: 600, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {intern.offre
              ? <Link className="ms-link" to={`/espace/entreprise/offres/${intern.offre}/candidatures`} onClick={e => e.stopPropagation()}>{intern.offre_detail?.titre}</Link>
              : intern.offre_detail?.titre}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
            padding: '0.2rem 0.6rem', borderRadius: '100px',
            background: isActive ? 'var(--success-light)' : 'var(--n100)',
            color: isActive ? 'var(--success)' : 'var(--text-muted)',
            fontSize: '0.68rem', fontWeight: 700,
          }}>
            {isActive ? <CheckCircle size={10} /> : <Clock size={10} />}
            {isActive ? t('pages.entreprise.mesStagiaires.statusOngoing') : t('pages.entreprise.mesStagiaires.statusCompleted')}
          </span>
          <ChevronDown size={14} color="var(--text-muted)" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0 }} />
        </div>
      </div>

      {/* Panel body */}
      {open && (
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

          {/* Contact & dates */}
          <VFieldset legend={t('pages.entreprise.mesStagiaires.infoLegend')} legendIcon={User} legendColor="var(--text-muted)">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginTop: '0.25rem' }}>
              {[
                { icon: Mail,     color: 'var(--primary)', text: intern.etudiant_detail?.user?.courriel || '—' },
                { icon: Phone,    color: 'var(--primary)', text: intern.etudiant_detail?.telephone || t('pages.entreprise.mesStagiaires.notProvided') },
                { icon: Calendar, color: 'var(--success)', text: new Date(intern.postule_le).toLocaleDateString('en-GB') },
                { icon: Clock,    color: 'var(--success)', text: duree ? t('pages.entreprise.mesStagiaires.weeksText', { n: duree }) : t('pages.entreprise.mesStagiaires.durationNA') },
              ].map(({ icon: Icon, color, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-color)' }}>
                  <Icon size={12} color={color} style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</span>
                </div>
              ))}
            </div>
          </VFieldset>

          {/* Documents */}
          <VFieldset legend={t('pages.entreprise.mesStagiaires.docsLegend')} legendIcon={FileText} legendColor="var(--primary)">
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
              {report ? (
                <button
                  className="secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', color: 'var(--primary)', borderColor: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  onClick={() => window.open(report.fichier, '_blank')}
                >
                  <FileText size={12} /> {t('pages.entreprise.mesStagiaires.viewReport')}
                </button>
              ) : (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.75rem', background: 'var(--surface-section)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                  <FileText size={12} /> {t('pages.entreprise.mesStagiaires.reportPending')}
                </span>
              )}
              {evaluation && (
                <Link to="/espace/entreprise/evaluations" style={{ textDecoration: 'none' }}>
                  <button
                    className="secondary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', color: 'var(--warning)', borderColor: 'var(--warning)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Star size={12} fill="currentColor" /> {evaluation.note_globale}/20
                  </button>
                </Link>
              )}
            </div>
          </VFieldset>

          {/* Actions */}
          {isActive && (
            <>
              <Divider />
              <div style={{ display: 'flex', gap: '0.625rem' }}>
                <button
                  className="secondary"
                  style={{ flex: 1, color: 'var(--error)', borderColor: 'rgba(239,68,68,0.3)', background: 'var(--error-light)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.55rem' }}
                  onClick={() => onSignalAbsence(intern)}
                >
                  <AlertCircle size={13} /> {t('pages.entreprise.mesStagiaires.reportAbsence')}
                </button>
                <button
                  className="primary"
                  style={{ flex: 1, background: 'var(--success)', borderColor: 'var(--success)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.55rem' }}
                  onClick={() => onEndStage(intern)}
                >
                  <CheckCircle size={13} /> {t('pages.entreprise.mesStagiaires.endInternship')}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Absence modal
───────────────────────────────────────────── */

const AbsenceModal = ({ intern, onClose, onSubmit, isPending }) => {
  const { t } = useTranslation();
  const [motif, setMotif] = useState('');
  const prenom = intern?.etudiant_detail?.prenom || '';
  const nom    = intern?.etudiant_detail?.nom    || '';
  const initials = ((prenom[0] || '') + (nom[0] || '')).toUpperCase() || '?';
  const avColor  = `vl-c${(prenom.charCodeAt(0) || 0) % 6}`;

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '460px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,.2)', overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{ padding: '1rem 1.25rem', background: 'var(--surface-section)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: '6px', background: 'var(--error-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={15} color="var(--error)" />
            </div>
            <span style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-main)' }}>
              {t('pages.entreprise.mesStagiaires.absenceModalTitle')}
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 2 }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Student info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem', background: 'var(--surface-section)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <div className={`vl-avt ${avColor}`} style={{ width: 38, height: 38, borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800, flexShrink: 0 }}>
              {initials}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)' }}>{prenom} {nom}</div>
              <div style={{ fontSize: '0.775rem', color: 'var(--primary)', fontWeight: 600 }}>{intern?.offre_detail?.titre}</div>
            </div>
          </div>

          {/* Fieldset for motif */}
          <VFieldset legend={t('pages.entreprise.mesStagiaires.absenceReason')} legendIcon={ClipboardCheck} legendColor="var(--error)">
            <textarea
              placeholder={t('pages.entreprise.mesStagiaires.absencePlaceholder')}
              value={motif}
              onChange={e => setMotif(e.target.value)}
              style={{
                width: '100%', marginTop: '0.5rem', padding: '0.75rem',
                borderRadius: '6px', border: '1px solid var(--border)',
                fontSize: '0.875rem', resize: 'vertical', minHeight: '90px',
                background: 'var(--bg-input)', color: 'var(--text-main)',
                boxSizing: 'border-box', fontFamily: 'inherit',
              }}
            />
          </VFieldset>
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="secondary" onClick={onClose} style={{ padding: '0.55rem 1.1rem' }}>
            {t('pages.entreprise.mesStagiaires.cancel')}
          </button>
          <button
            className="primary"
            style={{ padding: '0.55rem 1.25rem', background: 'var(--error)', borderColor: 'var(--error)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            disabled={!motif.trim() || isPending}
            onClick={() => onSubmit({ id: intern.id_candidature, motif })}
          >
            <AlertCircle size={14} /> {isPending ? t('pages.entreprise.mesStagiaires.sending') : t('pages.entreprise.mesStagiaires.report')}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Confirm modal
───────────────────────────────────────────── */

const ConfirmModal = ({ intern, onClose, onConfirm, isPending }) => {
  const { t } = useTranslation();
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '400px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,.2)', overflow: 'hidden' }}
      >
        <div style={{ padding: '1rem 1.25rem', background: 'var(--surface-section)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: '6px', background: 'var(--success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={15} color="var(--success)" />
            </div>
            <span style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-main)' }}>
              {t('pages.entreprise.mesStagiaires.confirmTitle')}
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '1.25rem' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-color)', lineHeight: 1.65 }}>
            {t('pages.entreprise.mesStagiaires.confirmMsg', {
              name: `${intern?.etudiant_detail?.prenom} ${intern?.etudiant_detail?.nom}`,
            })}
          </p>
        </div>
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="secondary" onClick={onClose} style={{ padding: '0.55rem 1.1rem' }}>
            {t('pages.entreprise.mesStagiaires.cancel')}
          </button>
          <button
            className="primary"
            style={{ padding: '0.55rem 1.25rem', background: 'var(--success)', borderColor: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            disabled={isPending}
            onClick={onConfirm}
          >
            <CheckCircle size={14} /> {t('pages.entreprise.mesStagiaires.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */

const MesStagiaires = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchTerm,    setSearchTerm]    = useState('');
  const [absenceTarget, setAbsenceTarget] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [toast,         setToast]         = useState(null);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const { data: internsData, isLoading, isError } = useQuery({
    queryKey: ['mes-stagiaires'],
    queryFn: async () => {
      const r = await api.safeRequest(api.get('candidatures/?statut=Stage_actif,Terminé'));
      if (r.ok) return r.value.data;
      throw r.error;
    }
  });

  const { data: reportsData }     = useQuery({ queryKey: ['mes-stagiaires-rapports'], queryFn: async () => { const r = await api.safeRequest(api.get('rapports/'));     if (r.ok) return r.value.data; throw r.error; } });
  const { data: evaluationsData } = useQuery({ queryKey: ['mes-stagiaires-evals'],   queryFn: async () => { const r = await api.safeRequest(api.get('evaluations/')); if (r.ok) return r.value.data; throw r.error; } });

  const interns     = Array.isArray(internsData)     ? internsData     : (internsData?.results     || []);
  const reports     = Array.isArray(reportsData)     ? reportsData     : (reportsData?.results     || []);
  const evaluations = Array.isArray(evaluationsData) ? evaluationsData : (evaluationsData?.results || []);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, statut }) => {
      const r = await api.safeRequest(api.patch(`candidatures/${id}/statut/`, { statut }));
      if (r.ok) return r.value.data;
      throw r.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mes-stagiaires'] });
      showToast('success', t('pages.entreprise.mesStagiaires.toastCompleted'));
      setConfirmTarget(null);
    },
    onError: (e) => showToast('error', e.message || t('pages.entreprise.mesStagiaires.toastError')),
  });

  const signalAbsenceMutation = useMutation({
    mutationFn: async ({ id, motif }) => {
      const r = await api.safeRequest(api.post('absences/', { candidature: id, date_absence: new Date().toISOString().split('T')[0], motif_signalement: motif }));
      if (r.ok) return r.value.data;
      throw r.error;
    },
    onSuccess: () => {
      showToast('success', t('pages.entreprise.mesStagiaires.toastAbsence'));
      setAbsenceTarget(null);
    },
    onError: (e) => showToast('error', e.message || t('pages.entreprise.mesStagiaires.toastError')),
  });

  const q = searchTerm.toLowerCase();
  const filtered = useMemo(() => interns.filter(i => {
    const name = `${i.etudiant_detail?.prenom} ${i.etudiant_detail?.nom}`.toLowerCase();
    return !q || name.includes(q) || (i.offre_detail?.titre || '').toLowerCase().includes(q);
  }), [interns, q]);

  const active   = filtered.filter(i => i.statut === 'Stage_actif');
  const finished = filtered.filter(i => i.statut !== 'Stage_actif');

  const cardGrid = (list) => list.length === 0 ? (
    <div style={{ textAlign: 'center', padding: '3rem 2rem', border: '1px dashed var(--border)', borderRadius: '8px', color: 'var(--text-muted)' }}>
      <Users size={36} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
      <p style={{ margin: 0, fontWeight: 600 }}>
        {searchTerm ? t('pages.entreprise.mesStagiaires.noResults') : t('pages.entreprise.mesStagiaires.noInterns')}
      </p>
    </div>
  ) : (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
      {list.map(intern => (
        <InternCard
          key={intern.id_candidature}
          intern={intern}
          reports={reports}
          evaluations={evaluations}
          onSignalAbsence={setAbsenceTarget}
          onEndStage={setConfirmTarget}
        />
      ))}
    </div>
  );

  if (isLoading) return <SkeletonLoader variant="table" />;
  if (isError)   return (
    <div style={{ padding: '5rem', textAlign: 'center', color: 'var(--error)' }}>
      {t('pages.entreprise.mesStagiaires.errorLoading')}
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <style>{`
        .ms-stat-card { transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease; }
        .ms-stat-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-2px); border-color: #CBD5E1; }
        .ms-intern-header { transition: filter 0.15s; }
        .ms-intern-header:hover { filter: brightness(0.96); }
        .ms-link { color: inherit; text-decoration: none; }
        .ms-link:hover { text-decoration: underline; }
      `}</style>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '8px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Users size={20} color="var(--primary)" />
          </div>
          <PageHeader
            eyebrow={t('pages.entreprise.mesStagiaires.eyebrow')}
            title={t('pages.entreprise.mesStagiaires.title')}
            subtitle={t('pages.entreprise.mesStagiaires.subtitle')}
          />
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1.25rem', borderRadius: '8px', border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,.25)' : 'rgba(239,68,68,.25)'}`, background: toast.type === 'success' ? 'var(--success-light)' : 'var(--error-light)', color: toast.type === 'success' ? 'var(--success)' : 'var(--error)', fontWeight: 600, fontSize: '0.875rem' }}>
          {toast.type === 'success' ? <CheckCircle size={17} /> : <AlertCircle size={17} />}
          {toast.text}
          <button onClick={() => setToast(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}>&times;</button>
        </div>
      )}

      {/* ── Stats row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <StatPanel icon={Users}       label={t('pages.entreprise.mesStagiaires.statTotal')}     value={interns.length}                                          color="var(--primary)" bg="var(--primary-light)" />
        <StatPanel icon={Activity}    label={t('pages.entreprise.mesStagiaires.statOngoing')}   value={interns.filter(i => i.statut === 'Stage_actif').length}   color="var(--success)" bg="var(--success-light)" />
        <StatPanel icon={CheckCircle} label={t('pages.entreprise.mesStagiaires.statCompleted')} value={interns.filter(i => i.statut !== 'Stage_actif').length}   color="var(--accent)"  bg="var(--accent-light)"  />
      </div>

      {/* ── Main panel with tabview ── */}
      <Panel
        title={t('pages.entreprise.mesStagiaires.panelTitle')}
        icon={Users}
        iconColor="var(--primary)"
        iconBg="var(--primary-light)"
        noPad
        headerRight={
          <div className="vl-search" style={{ width: 240 }}>
            <Search size={13} style={{ position: 'absolute', left: '0.7rem', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder={t('pages.entreprise.mesStagiaires.searchPlaceholder')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', paddingLeft: '2.1rem', fontSize: '0.82rem' }}
            />
          </div>
        }
      >
        <TabView tabs={[
          { label: t('pages.entreprise.mesStagiaires.tabOngoing'),   icon: Activity,     count: active.length,   content: cardGrid(active)   },
          { label: t('pages.entreprise.mesStagiaires.tabCompleted'),  icon: CheckCircle,  count: finished.length, content: cardGrid(finished) },
        ]} />
      </Panel>

      {/* ── Modals ── */}
      {absenceTarget && (
        <AbsenceModal
          intern={absenceTarget}
          onClose={() => setAbsenceTarget(null)}
          onSubmit={signalAbsenceMutation.mutate}
          isPending={signalAbsenceMutation.isPending}
        />
      )}

      {confirmTarget && (
        <ConfirmModal
          intern={confirmTarget}
          onClose={() => setConfirmTarget(null)}
          onConfirm={() => updateStatusMutation.mutate({ id: confirmTarget.id_candidature, statut: 'Terminé' })}
          isPending={updateStatusMutation.isPending}
        />
      )}
    </div>
  );
};

export default MesStagiaires;
