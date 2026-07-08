import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../components/PageHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Star, Search, CheckCircle, AlertCircle, X, ClipboardCheck,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight,
  ThumbsUp, Clock,
} from 'lucide-react';
import api from '../../services/api';

const PAGE_SIZES = [10, 25, 50];

const CRITERIA_IDS = ['comportement', 'adaptabilite', 'travail_equipe', 'qualite_travail'];

const REC_CFG = {
  Oui:         { color: '#15803d', bg: '#dcfce7', dot: '#22c55e' },
  Non:         { color: '#b91c1c', bg: '#fee2e2', dot: '#ef4444' },
  'Peut-être': { color: '#92400e', bg: '#fef9c3', dot: '#f59e0b' },
};

const RecBadge = ({ value }) => {
  const { t } = useTranslation();
  const cfg = REC_CFG[value] || REC_CFG['Peut-être'];
  const LABELS = {
    Oui: t('pages.entreprise.evaluations.recYes'),
    Non: t('pages.entreprise.evaluations.recNo'),
    'Peut-être': t('pages.entreprise.evaluations.recMaybe'),
  };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.55rem', borderRadius: '999px', background: cfg.bg, color: cfg.color, fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {LABELS[value] || value}
    </span>
  );
};

const StatutBadge = ({ statut }) => {
  const { t } = useTranslation();
  const actif = statut === 'Stage_actif';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.55rem', borderRadius: '999px', background: actif ? '#eef2ff' : '#dcfce7', color: actif ? '#4338ca' : '#15803d', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: actif ? '#6366f1' : '#22c55e', flexShrink: 0 }} />
      {actif ? t('pages.entreprise.evaluations.statusOngoing') : t('pages.entreprise.evaluations.statusCompleted')}
    </span>
  );
};

const TH = ({ children, col, sort, onSort, style = {} }) => {
  const active = sort?.col === col;
  return (
    <th onClick={() => col && onSort?.(col)} style={{
      padding: '0.75rem 1rem', fontSize: '0.72rem', fontWeight: 700,
      color: active ? 'var(--text-main)' : 'var(--text-muted)', textTransform: 'uppercase',
      letterSpacing: '0.05em', textAlign: 'left', background: 'var(--surface-section)',
      borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
      cursor: col ? 'pointer' : 'default', userSelect: 'none', ...style,
    }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
        {children}
        {col && (active
          ? sort.dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />
          : <ArrowUpDown size={11} style={{ opacity: 0.35 }} />
        )}
      </span>
    </th>
  );
};

const RatingPicker = ({ value, onChange, max = 5 }) => {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem' }}>
      <div style={{ display: 'inline-flex', gap: '0.15rem' }} onMouseLeave={() => setHovered(0)}>
        {Array.from({ length: max }, (_, i) => i + 1).map(n => (
          <button key={n} type="button" onClick={() => onChange(n)} onMouseEnter={() => setHovered(n)}
            style={{
              padding: '2px', margin: 0, border: 'none', background: 'transparent',
              cursor: 'pointer', lineHeight: 0, transition: 'transform 0.1s',
              transform: n === display ? 'scale(1.12)' : 'scale(1)',
            }}>
            <Star
              size={20}
              fill={n <= display ? '#f59e0b' : 'none'}
              color={n <= display ? '#f59e0b' : 'var(--text-subtle)'}
              strokeWidth={1.75}
            />
          </button>
        ))}
      </div>
      <span style={{ minWidth: '1rem', textAlign: 'center', fontWeight: 800, fontSize: '0.9rem', color: '#1b6ef3' }}>
        {value}
      </span>
    </div>
  );
};

const AvgScoreBadge = ({ value }) => (
  <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.2rem', padding: '0.2rem 0.55rem', borderRadius: '6px', background: 'var(--surface-section)', color: 'var(--text-main)', fontWeight: 700, fontSize: '0.82rem' }}>
    {value.toFixed(1)}<span style={{ fontSize: '0.65rem', fontWeight: 500, color: 'var(--text-muted)' }}>/5</span>
  </span>
);

const DEFAULT_FORM = { comportement: 5, adaptabilite: 5, travail_equipe: 5, qualite_travail: 5, recommanderait: 'Oui', commentaires: '' };

const EvalModal = ({ student, onClose, onSubmit, isPending, errorMsg }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const name = `${student.etudiant_detail?.prenom} ${student.etudiant_detail?.nom}`;

  const CRITERIA = [
    { id: 'comportement',    label: t('pages.entreprise.evaluations.critComportement') },
    { id: 'adaptabilite',    label: t('pages.entreprise.evaluations.critAdaptabilite') },
    { id: 'travail_equipe',  label: t('pages.entreprise.evaluations.critTravailEquipe') },
    { id: 'qualite_travail', label: t('pages.entreprise.evaluations.critQualiteTravail') },
  ];

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}
    >
      <div style={{ background: 'var(--bg-card)', borderRadius: '10px', width: '100%', maxWidth: '480px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {t('pages.entreprise.evaluations.evalFormTitle')}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#1b6ef3', fontWeight: 600, marginTop: '0.1rem' }}>
              {name} — {student.offre_detail?.titre}
            </div>
          </div>
          <button onClick={onClose} style={{ width: '26px', height: '26px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <X size={13} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

          {errorMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.85rem', borderRadius: '6px', background: '#fee2e2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '0.78rem', fontWeight: 600 }}>
              <AlertCircle size={13} /> {errorMsg}
            </div>
          )}

          {/* Criteria 2-col grid */}
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
              {t('pages.entreprise.evaluations.criteriaTitle')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              {CRITERIA.map(c => (
                <div key={c.id} style={{ border: '1px solid var(--border)', borderRadius: '7px', padding: '0.6rem 0.75rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>{c.label}</div>
                  <RatingPicker value={form[c.id]} onChange={val => setForm(f => ({ ...f, [c.id]: val }))} />
                </div>
              ))}
            </div>
          </div>

          {/* Recommendation */}
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              {t('pages.entreprise.evaluations.recQuestion')}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[
                { val: 'Oui',       label: t('pages.entreprise.evaluations.recYes') },
                { val: 'Non',       label: t('pages.entreprise.evaluations.recNo') },
                { val: 'Peut-être', label: t('pages.entreprise.evaluations.recMaybe') },
              ].map(({ val: choice, label }) => {
                const sel = form.recommanderait === choice;
                const cfg = REC_CFG[choice];
                return (
                  <button key={choice} type="button"
                    onClick={() => setForm(f => ({ ...f, recommanderait: choice }))}
                    style={{ flex: 1, height: '34px', border: `2px solid ${sel ? cfg.dot : 'var(--border)'}`, borderRadius: '7px', background: sel ? cfg.bg : 'var(--bg-card)', color: sel ? cfg.color : 'var(--text-color)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700 }}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comments */}
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              {t('pages.entreprise.evaluations.commentsLabel')}
            </div>
            <textarea rows={3} required
              value={form.commentaires}
              onChange={e => setForm(f => ({ ...f, commentaires: e.target.value }))}
              placeholder={t('pages.entreprise.evaluations.commentsPlaceholder')}
              style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem 0.75rem', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.82rem', color: 'var(--text-main)', background: 'var(--bg-card)', outline: 'none', resize: 'vertical' }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, height: '36px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-card)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-color)' }}>
              {t('pages.entreprise.evaluations.cancelBtn')}
            </button>
            <button type="button" disabled={isPending}
              onClick={() => onSubmit({ ...form, etudiant: student.etudiant, offre: student.offre })}
              style={{ flex: 2, height: '36px', border: 'none', borderRadius: '6px', background: '#1b6ef3', color: '#fff', cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.7 : 1, fontSize: '0.82rem', fontWeight: 600 }}>
              {isPending ? t('pages.entreprise.evaluations.savingBtn') : t('pages.entreprise.evaluations.submitBtn')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EntrepriseEvaluations = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeStudent, setActiveStudent] = useState(null);
  const [evalError, setEvalError]         = useState('');
  const [toast, setToast]                 = useState(null);

  const [pendingSearch, setPendingSearch]     = useState('');
  const [pendingSort, setPendingSort]         = useState({ col: '', dir: 'asc' });
  const [pendingPage, setPendingPage]         = useState(1);
  const [pendingPageSize, setPendingPageSize] = useState(10);

  const [histSort, setHistSort]         = useState({ col: 'cree_le', dir: 'desc' });
  const [histPage, setHistPage]         = useState(1);
  const [histPageSize, setHistPageSize] = useState(10);

  const { data: studentsData, isLoading: loadingStudents } = useQuery({
    queryKey: ['accepted-students-eval'],
    queryFn: async () => {
      const r = await api.get('candidatures/?statut=Stage_actif,Terminé');
      return r.data;
    },
  });

  const { data: evalsData, isLoading: loadingEvals } = useQuery({
    queryKey: ['my-evaluations-history'],
    queryFn: async () => {
      const r = await api.get('evaluations/');
      return r.data;
    },
  });

  const { data: reportsData } = useQuery({
    queryKey: ['entreprise-rapports'],
    queryFn: async () => {
      const r = await api.get('rapports/');
      return r.data;
    },
  });

  const students     = Array.isArray(studentsData) ? studentsData : (studentsData?.results || []);
  const evalsHistory = Array.isArray(evalsData)    ? evalsData    : (evalsData?.results   || []);
  const reports      = Array.isArray(reportsData)  ? reportsData  : (reportsData?.results || []);

  const evalMutation = useMutation({
    mutationFn: data => api.post('evaluations/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accepted-students-eval'] });
      queryClient.invalidateQueries({ queryKey: ['my-evaluations-history'] });
      setActiveStudent(null);
      setEvalError('');
      setToast({ type: 'success', text: t('pages.entreprise.evaluations.evalSaved') });
      setTimeout(() => setToast(null), 3000);
    },
    onError: err => {
      const text =
        err.response?.data?.error?.message ||
        err.response?.data?.error?.details?.non_field_errors?.[0] ||
        err.message ||
        'Save error.';
      setEvalError(text);
    },
  });

  const pending = useMemo(() => students.filter(s => !evalsHistory.some(e => e.etudiant === s.etudiant && e.offre === s.offre)), [students, evalsHistory]);

  const filteredPending = useMemo(() => {
    const q = pendingSearch.toLowerCase();
    let list = pending.filter(s =>
      `${s.etudiant_detail?.prenom} ${s.etudiant_detail?.nom}`.toLowerCase().includes(q) ||
      (s.offre_detail?.titre || '').toLowerCase().includes(q)
    );
    if (pendingSort.col) {
      list = [...list].sort((a, b) => {
        let av = pendingSort.col === 'name'
          ? `${a.etudiant_detail?.prenom} ${a.etudiant_detail?.nom}`.toLowerCase()
          : (a[pendingSort.col] ?? '');
        let bv = pendingSort.col === 'name'
          ? `${b.etudiant_detail?.prenom} ${b.etudiant_detail?.nom}`.toLowerCase()
          : (b[pendingSort.col] ?? '');
        if (typeof av === 'string') av = av.toLowerCase();
        if (typeof bv === 'string') bv = bv.toLowerCase();
        return pendingSort.dir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
      });
    }
    return list;
  }, [pending, pendingSearch, pendingSort]);

  const filteredHist = useMemo(() => {
    let list = [...evalsHistory].sort((a, b) => {
      let av = a[histSort.col] ?? '', bv = b[histSort.col] ?? '';
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      return histSort.dir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return list;
  }, [evalsHistory, histSort]);

  const pendingTotal = Math.max(1, Math.ceil(filteredPending.length / pendingPageSize));
  const pendingRows  = filteredPending.slice((pendingPage - 1) * pendingPageSize, pendingPage * pendingPageSize);

  const histTotal = Math.max(1, Math.ceil(filteredHist.length / histPageSize));
  const histRows  = filteredHist.slice((histPage - 1) * histPageSize, histPage * histPageSize);

  const avgNote = evalsHistory.length > 0
    ? (evalsHistory.reduce((s, e) => s + (e.note_globale || 0), 0) / evalsHistory.length).toFixed(1)
    : '—';

  const Pager = ({ page, total, onPage, pageSize, onPageSize }) => (
    <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('pages.entreprise.evaluations.rows')}</span>
        <select value={pageSize} onChange={e => { onPageSize(Number(e.target.value)); onPage(1); }}
          style={{ height: '28px', padding: '0 0.5rem', border: '1px solid var(--border)', borderRadius: '5px', fontSize: '0.8rem', color: 'var(--text-color)', background: 'var(--bg-card)', cursor: 'pointer', outline: 'none' }}>
          {PAGE_SIZES.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        <button onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1}
          style={{ height: '28px', width: '28px', border: '1px solid var(--border)', borderRadius: '5px', background: 'var(--bg-card)', cursor: page === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: page === 1 ? 'var(--border)' : 'var(--text-color)' }}>
          <ChevronLeft size={14} />
        </button>
        {Array.from({ length: Math.min(5, total) }, (_, i) => {
          let n = i + 1;
          if (total > 5) {
            if (page <= 3) n = i + 1;
            else if (page >= total - 2) n = total - 4 + i;
            else n = page - 2 + i;
          }
          return (
            <button key={n} onClick={() => onPage(n)}
              style={{ height: '28px', minWidth: '28px', padding: '0 0.25rem', border: `1px solid ${page === n ? '#1b6ef3' : 'var(--border)'}`, borderRadius: '5px', background: page === n ? '#1b6ef3' : 'var(--bg-card)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: page === n ? 600 : 400, color: page === n ? '#fff' : 'var(--text-color)' }}>
              {n}
            </button>
          );
        })}
        <button onClick={() => onPage(Math.min(total, page + 1))} disabled={page === total}
          style={{ height: '28px', width: '28px', border: '1px solid var(--border)', borderRadius: '5px', background: 'var(--bg-card)', cursor: page === total ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: page === total ? 'var(--border)' : 'var(--text-color)' }}>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <style>{`
        .eval-stat-card { transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease; }
        .eval-stat-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-2px); border-color: #CBD5E1; }
        .eval-btn-eval { transition: background 0.15s, color 0.15s; }
        .eval-btn-eval:hover { background: #1b6ef3 !important; color: #fff !important; }
        .eval-link { color: inherit; text-decoration: none; }
        .eval-link:hover { text-decoration: underline; }
      `}</style>

      <PageHeader
        eyebrow={t('pages.entreprise.evaluations.eyebrow')}
        title={t('pages.entreprise.evaluations.title')}
        subtitle={t('pages.entreprise.evaluations.subtitle')}
      />

      {/* Toast */}
      {toast && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.7rem 1rem', borderRadius: '7px', background: toast.type === 'success' ? '#dcfce7' : '#fee2e2', border: `1px solid ${toast.type === 'success' ? '#86efac' : '#fecaca'}`, color: toast.type === 'success' ? '#15803d' : '#b91c1c', fontSize: '0.82rem', fontWeight: 600 }}>
          {toast.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {toast.text}
        </div>
      )}

      {/* Stat chips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { label: t('pages.entreprise.evaluations.statTracked'),  value: students.length,     color: '#6366f1', bg: '#eef2ff', icon: <ClipboardCheck size={18} /> },
          { label: t('pages.entreprise.evaluations.statPending'),  value: pending.length,      color: '#92400e', bg: '#fef9c3', icon: <AlertCircle size={18} /> },
          { label: t('pages.entreprise.evaluations.statDone'),     value: evalsHistory.length, color: '#15803d', bg: '#dcfce7', icon: <CheckCircle size={18} /> },
          { label: t('pages.entreprise.evaluations.statAvg'),      value: avgNote,             color: '#1d4ed8', bg: '#dbeafe', icon: <Star size={18} /> },
        ].map(s => (
          <div key={s.label} className="eval-stat-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
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

      {/* --- Pending table --- */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
            {t('pages.entreprise.evaluations.pendingTable')} <span style={{ color: 'var(--text-subtle)', fontWeight: 400 }}>({filteredPending.length})</span>
          </span>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)', pointerEvents: 'none' }} />
            <input type="text" value={pendingSearch}
              onChange={e => { setPendingSearch(e.target.value); setPendingPage(1); }}
              placeholder={t('pages.entreprise.evaluations.searchPlaceholder')}
              style={{ height: '34px', paddingLeft: '2rem', paddingRight: '0.75rem', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.85rem', outline: 'none', width: '220px', color: 'var(--text-main)', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <TH col="name" sort={pendingSort} onSort={col => { setPendingSort(s => ({ col, dir: s.col === col && s.dir === 'asc' ? 'desc' : 'asc' })); setPendingPage(1); }}>
                  {t('pages.entreprise.evaluations.colIntern')}
                </TH>
                <TH>{t('pages.entreprise.evaluations.colOffer')}</TH>
                <TH col="statut" sort={pendingSort} onSort={col => { setPendingSort(s => ({ col, dir: s.col === col && s.dir === 'asc' ? 'desc' : 'asc' })); setPendingPage(1); }} style={{ width: '110px' }}>
                  {t('pages.entreprise.evaluations.colStatus')}
                </TH>
                <TH style={{ width: '100px', textAlign: 'right' }}>
                  {t('pages.entreprise.evaluations.colAction')}
                </TH>
              </tr>
            </thead>
            <tbody>
              {loadingStudents || loadingEvals ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {[200, 160, 80, 70].map((w, j) => (
                      <td key={j} style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #f3f4f6' }}>
                        <div style={{ height: '13px', width: `${w}px`, background: 'var(--surface-section)', borderRadius: '4px' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : pendingRows.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.875rem' }}>
                    {pending.length === 0 ? t('pages.entreprise.evaluations.allEvaluated') : t('pages.entreprise.evaluations.noIntern')}
                  </td>
                </tr>
              ) : pendingRows.map(s => {
                const hue = (s.etudiant_detail?.prenom?.charCodeAt(0) || 65) % 360;
                const initials = ((s.etudiant_detail?.prenom?.[0] || '') + (s.etudiant_detail?.nom?.[0] || '')).toUpperCase() || '?';
                const hasReport = reports.some(r => r.etudiant === s.etudiant && r.offre === s.offre);
                return (
                  <tr key={s.id_candidature || s.id}
                    style={{ borderBottom: '1px solid #f3f4f6' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-section)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0, background: `hsl(${hue},55%,90%)`, color: `hsl(${hue},55%,32%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem', overflow: 'hidden' }}>
                          {s.etudiant_detail?.photo
                            ? <img src={s.etudiant_detail.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : initials}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                            <Link className="eval-link" to="/espace/entreprise/mes-stagiaires">
                              {s.etudiant_detail?.prenom} {s.etudiant_detail?.nom}
                            </Link>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {s.etudiant_detail?.niveau_academique || 'Student'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.offre
                        ? <Link className="eval-link" to={`/espace/entreprise/offres/${s.offre}/candidatures`}>{s.offre_detail?.titre || '—'}</Link>
                        : (s.offre_detail?.titre || '—')}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <StatutBadge statut={s.statut} />
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      {hasReport ? (
                        <button
                          onClick={() => { setActiveStudent(s); setEvalError(''); }}
                          className="eval-btn-eval"
                          style={{ height: '30px', padding: '0 0.75rem', border: '1px solid #1b6ef3', borderRadius: '6px', background: '#eef2ff', color: '#1b6ef3', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap' }}
                        >
                          {t('pages.entreprise.evaluations.evaluate')}
                        </button>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', height: '30px', padding: '0 0.75rem', borderRadius: '6px', background: 'var(--surface-section)', border: '1px solid var(--border)', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          <Clock size={11} /> {t('pages.entreprise.evaluations.reportPending')}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!loadingStudents && filteredPending.length > pendingPageSize && (
          <Pager page={pendingPage} total={pendingTotal} onPage={setPendingPage} pageSize={pendingPageSize} onPageSize={setPendingPageSize} />
        )}
      </div>

      {/* --- History table --- */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
            {t('pages.entreprise.evaluations.historyTable')} <span style={{ color: 'var(--text-subtle)', fontWeight: 400 }}>({evalsHistory.length})</span>
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <TH col="cree_le" sort={histSort} onSort={col => { setHistSort(s => ({ col, dir: s.col === col && s.dir === 'asc' ? 'desc' : 'asc' })); setHistPage(1); }} style={{ width: '110px' }}>
                  {t('pages.entreprise.evaluations.colDate')}
                </TH>
                <TH>{t('pages.entreprise.evaluations.colIntern')}</TH>
                <TH col="note_globale" sort={histSort} onSort={col => { setHistSort(s => ({ col, dir: s.col === col && s.dir === 'asc' ? 'desc' : 'asc' })); setHistPage(1); }} style={{ width: '110px' }}>
                  {t('pages.entreprise.evaluations.colScore')}
                </TH>
                <TH style={{ width: '120px' }}>{t('pages.entreprise.evaluations.colCriteria')}</TH>
                <TH col="recommanderait" sort={histSort} onSort={col => { setHistSort(s => ({ col, dir: s.col === col && s.dir === 'asc' ? 'desc' : 'asc' })); setHistPage(1); }} style={{ width: '120px' }}>
                  {t('pages.entreprise.evaluations.colRec')}
                </TH>
                <TH>{t('pages.entreprise.evaluations.colComments')}</TH>
              </tr>
            </thead>
            <tbody>
              {loadingEvals ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    {[80, 160, 70, 80, 90, 200].map((w, j) => (
                      <td key={j} style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #f3f4f6' }}>
                        <div style={{ height: '13px', width: `${w}px`, background: 'var(--surface-section)', borderRadius: '4px' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : histRows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.875rem' }}>
                    {t('pages.entreprise.evaluations.noHistory')}
                  </td>
                </tr>
              ) : histRows.map(ev => {
                const nom = ev.etudiant_nom || `Stagiaire #${ev.etudiant}`;
                const hue = (nom.charCodeAt(0) || 65) % 360;
                const avgCriteria = ((ev.comportement + ev.adaptabilite + ev.travail_equipe + ev.qualite_travail) / 4);
                return (
                  <tr key={ev.id_evaluation}
                    style={{ borderBottom: '1px solid #f3f4f6' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-section)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', fontWeight: 600 }}>
                      {new Date(ev.cree_le).toLocaleDateString('en-GB')}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, background: `hsl(${hue},55%,90%)`, color: `hsl(${hue},55%,32%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>
                          {nom.charAt(0).toUpperCase()}
                        </div>
                        <Link className="eval-link" to="/espace/entreprise/mes-stagiaires" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>{nom}</Link>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.6rem', borderRadius: '6px', background: '#fef9c3', color: '#92400e', fontWeight: 800, fontSize: '0.88rem' }}>
                        {ev.note_globale?.toFixed(1)}<span style={{ fontSize: '0.65rem', opacity: 0.7 }}>/20</span>
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <AvgScoreBadge value={avgCriteria} />
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <RecBadge value={ev.recommanderait} />
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ev.commentaires}>
                      {ev.commentaires ? `"${ev.commentaires}"` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!loadingEvals && evalsHistory.length > histPageSize && (
          <Pager page={histPage} total={histTotal} onPage={setHistPage} pageSize={histPageSize} onPageSize={setHistPageSize} />
        )}
      </div>

      {/* Eval modal */}
      {activeStudent && (
        <EvalModal
          student={activeStudent}
          onClose={() => setActiveStudent(null)}
          onSubmit={data => evalMutation.mutate(data)}
          isPending={evalMutation.isPending}
          errorMsg={evalError}
        />
      )}
    </div>
  );
};

export default EntrepriseEvaluations;
