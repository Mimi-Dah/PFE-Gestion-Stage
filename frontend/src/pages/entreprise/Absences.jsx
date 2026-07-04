import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../components/PageHeader';
import {
  AlertCircle, CheckCircle, XCircle, Clock, Plus, X,
  UserX, Calendar, Search, ArrowUpDown, ArrowUp, ArrowDown,
  ChevronLeft, ChevronRight, Eye, FileText, Check,
} from 'lucide-react';
import api, { mediaUrl } from '../../services/api';
import { dateLocale } from '../../utils/dateLocale';

const PAGE_SIZES = [10, 25, 50];

const STATUS_FILTER_GROUPS = {
  Signaler: ['Signaler', 'En_attente_approbation'],
};

const STATUT_STYLE = {
  Signaler:                { color: '#92400e', bg: '#fef9c3', dot: '#f59e0b' },
  En_attente_approbation:  { color: '#1e40af', bg: '#dbeafe', dot: '#3b82f6' },
  Justifiée:               { color: '#15803d', bg: '#dcfce7', dot: '#22c55e' },
  Non_justifiée:           { color: '#b91c1c', bg: '#fee2e2', dot: '#ef4444' },
};

const StatutBadge = ({ statut }) => {
  const { t } = useTranslation();
  const cfg = STATUT_STYLE[statut] || STATUT_STYLE.Signaler;
  const LABELS = {
    Signaler:               t('pages.entreprise.absences.statusReported'),
    En_attente_approbation: t('pages.entreprise.absences.statusPending'),
    Justifiée:              t('pages.entreprise.absences.statusJustified'),
    Non_justifiée:          t('pages.entreprise.absences.statusUnjustified'),
  };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.55rem', borderRadius: '999px', background: cfg.bg, color: cfg.color, fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {LABELS[statut] || statut}
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

const SignalModal = ({ onClose, interns, onSubmit, isPending }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    candidature: '',
    date_absence: new Date().toISOString().split('T')[0],
    motif_signalement: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.candidature) { setError(t('pages.entreprise.absences.selectRequired')); return; }
    if (!form.motif_signalement.trim()) { setError(t('pages.entreprise.absences.reasonRequired')); return; }
    setError('');
    onSubmit({ ...form, candidature: Number(form.candidature) });
  };

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}
    >
      <div style={{ background: 'var(--bg-card)', borderRadius: '10px', width: '100%', maxWidth: '460px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {t('pages.entreprise.absences.modalTitle')}
          </span>
          <button onClick={onClose} style={{ width: '26px', height: '26px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <X size={13} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1rem' }}>
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.85rem', borderRadius: '6px', marginBottom: '0.85rem', background: '#fee2e2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '0.78rem', fontWeight: 600 }}>
              <AlertCircle size={13} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                {t('pages.entreprise.absences.internLabel')}
              </label>
              <select
                value={form.candidature}
                onChange={e => setForm(f => ({ ...f, candidature: e.target.value }))}
                style={{ width: '100%', height: '34px', padding: '0 0.75rem', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.82rem', color: 'var(--text-main)', background: 'var(--bg-card)', outline: 'none', boxSizing: 'border-box' }}
              >
                <option value="">{t('pages.entreprise.absences.selectIntern')}</option>
                {interns.map(i => (
                  <option key={i.id_candidature} value={i.id_candidature}>
                    {i.etudiant_detail?.prenom} {i.etudiant_detail?.nom} — {i.offre_detail?.titre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                <Calendar size={12} /> {t('pages.entreprise.absences.dateLabel')}
              </label>
              <input
                type="date"
                value={form.date_absence}
                max={new Date().toISOString().split('T')[0]}
                onChange={e => setForm(f => ({ ...f, date_absence: e.target.value }))}
                style={{ width: '100%', height: '34px', padding: '0 0.75rem', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.82rem', color: 'var(--text-main)', background: 'var(--bg-card)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                {t('pages.entreprise.absences.reasonLabel')}
              </label>
              <textarea
                rows={3}
                placeholder={t('pages.entreprise.absences.reasonPlaceholder')}
                value={form.motif_signalement}
                onChange={e => setForm(f => ({ ...f, motif_signalement: e.target.value }))}
                style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem 0.75rem', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.82rem', color: 'var(--text-main)', background: 'var(--bg-card)', outline: 'none', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.15rem' }}>
              <button type="button" onClick={onClose}
                style={{ flex: 1, height: '36px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-card)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-color)' }}>
                {t('pages.entreprise.absences.cancelBtn')}
              </button>
              <button type="submit" disabled={isPending}
                style={{ flex: 1, height: '36px', border: 'none', borderRadius: '6px', background: '#1b6ef3', color: '#fff', cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.7 : 1, fontSize: '0.82rem', fontWeight: 600 }}>
                {isPending ? t('pages.entreprise.absences.sendingBtn') : t('pages.entreprise.absences.reportBtnSubmit')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const EntrepriseAbsences = () => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [showForm, setShowForm]       = useState(false);
  const [selected, setSelected]       = useState(null);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [sort, setSort]               = useState({ col: 'date_absence', dir: 'desc' });
  const [page, setPage]               = useState(1);
  const [pageSize, setPageSize]       = useState(10);

  const { data: absencesData, isLoading, isError } = useQuery({
    queryKey: ['entreprise-absences'],
    queryFn: async () => {
      const r = await api.safeRequest(api.get('absences/'));
      if (r.ok) return r.value.data;
      throw r.error;
    },
  });

  const { data: internsData } = useQuery({
    queryKey: ['stagiaires-actifs'],
    queryFn: async () => {
      const r = await api.safeRequest(api.get('candidatures/?statut=Stage_actif'));
      if (r.ok) return r.value.data;
      throw r.error;
    },
  });

  const absences = Array.isArray(absencesData) ? absencesData : (absencesData?.results || []);
  const interns  = Array.isArray(internsData)  ? internsData  : (internsData?.results  || []);

  const signalMutation = useMutation({
    mutationFn: async (data) => {
      const r = await api.safeRequest(api.post('absences/', data));
      if (r.ok) return r.value.data;
      throw r.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entreprise-absences'] });
      setShowForm(false);
    },
    onError: () => {},
  });

  const validateMutation = useMutation({
    mutationFn: async ({ id, statut }) => {
      const r = await api.safeRequest(api.post(`absences/${id}/valider/`, { statut }));
      if (r.ok) return r.value.data;
      throw r.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entreprise-absences'] });
      setSelected(null);
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = absences.filter(a => {
      if (statusFilter && !(STATUS_FILTER_GROUPS[statusFilter] || [statusFilter]).includes(a.statut)) return false;
      return (
        `${a.etudiant_prenom} ${a.etudiant_nom}`.toLowerCase().includes(q) ||
        (a.offre_titre || '').toLowerCase().includes(q) ||
        (a.motif_signalement || '').toLowerCase().includes(q)
      );
    });
    list = [...list].sort((a, b) => {
      let av = a[sort.col] ?? '', bv = b[sort.col] ?? '';
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      return sort.dir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return list;
  }, [absences, search, sort, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (col) => {
    setSort(s => ({ col, dir: s.col === col && s.dir === 'asc' ? 'desc' : 'asc' }));
    setPage(1);
  };

  const counts = {
    signalees:      absences.filter(a => a.statut === 'Signaler' || a.statut === 'En_attente_approbation').length,
    justifiees:     absences.filter(a => a.statut === 'Justifiée').length,
    non_justifiees: absences.filter(a => a.statut === 'Non_justifiée').length,
  };

  return (
    <div style={{ padding: '0 0 2rem' }}>
      <style>{`
        .abs-stat-card { transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease; cursor: pointer; }
        .abs-stat-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-2px); border-color: #CBD5E1; }
        .abs-stat-card.active { box-shadow: 0 0 0 2px var(--active-ring); transform: translateY(-2px); border-color: var(--active-ring); }
      `}</style>

      <PageHeader
        eyebrow={t('pages.entreprise.absences.eyebrow')}
        title={t('pages.entreprise.absences.title')}
        subtitle={t('pages.entreprise.absences.subtitle')}
        actions={
          <button
            onClick={() => setShowForm(true)}
            style={{ height: '34px', padding: '0 0.85rem', border: 'none', borderRadius: '6px', background: '#1b6ef3', color: '#fff', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Plus size={13} /> {t('pages.entreprise.absences.reportBtn')}
          </button>
        }
      />

      {/* Stat chips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: t('pages.entreprise.absences.statTotal'),       value: absences.length,       color: '#6366f1', bg: '#eef2ff', ring: '#6366f1', icon: <UserX size={18} />,       filter: null },
          { label: t('pages.entreprise.absences.statPending'),     value: counts.signalees,      color: '#92400e', bg: '#fef9c3', ring: '#f59e0b', icon: <Clock size={18} />,        filter: 'Signaler' },
          { label: t('pages.entreprise.absences.statJustified'),   value: counts.justifiees,     color: '#15803d', bg: '#dcfce7', ring: '#22c55e', icon: <CheckCircle size={18} />,  filter: 'Justifiée' },
          { label: t('pages.entreprise.absences.statUnjustified'), value: counts.non_justifiees, color: '#b91c1c', bg: '#fee2e2', ring: '#ef4444', icon: <XCircle size={18} />,      filter: 'Non_justifiée' },
        ].map(s => {
          const isActive = statusFilter === s.filter;
          return (
            <div
              key={s.label}
              className={`abs-stat-card${isActive ? ' active' : ''}`}
              style={{ '--active-ring': s.ring, background: 'var(--bg-card)', border: `1px solid ${isActive ? s.ring : 'var(--border)'}`, borderRadius: '8px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}
              onClick={() => { setStatusFilter(isActive ? null : s.filter); setPage(1); }}
              title={isActive ? 'Cliquer pour réinitialiser le filtre' : `Filtrer par : ${s.label}`}
            >
              <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', color: isActive ? s.color : 'var(--text-muted)', fontWeight: isActive ? 700 : 500 }}>{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table card */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
            {t('pages.entreprise.absences.tableTitle')} <span style={{ color: 'var(--text-subtle)', fontWeight: 400, fontSize: '0.85rem' }}>({filtered.length})</span>
          </span>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder={t('pages.entreprise.absences.searchPlaceholder')}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ height: '34px', paddingLeft: '2rem', paddingRight: '0.75rem', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.85rem', outline: 'none', width: '230px', color: 'var(--text-main)', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <TH col="etudiant_prenom" sort={sort} onSort={handleSort}>{t('pages.entreprise.absences.colIntern')}</TH>
                <TH col="offre_titre"     sort={sort} onSort={handleSort}>{t('pages.entreprise.absences.colOffer')}</TH>
                <TH col="date_absence"    sort={sort} onSort={handleSort} style={{ width: '120px' }}>{t('pages.entreprise.absences.colDate')}</TH>
                <TH style={{ width: '220px' }}>{t('pages.entreprise.absences.colReason')}</TH>
                <TH style={{ width: '200px' }}>{t('pages.entreprise.absences.colJustification')}</TH>
                <TH col="statut" sort={sort} onSort={handleSort} style={{ width: '120px' }}>{t('pages.entreprise.absences.colStatus')}</TH>
                <TH style={{ width: '60px', textAlign: 'right' }}></TH>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {[160, 140, 90, 180, 160, 90].map((w, j) => (
                      <td key={j} style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #f3f4f6' }}>
                        <div style={{ height: '13px', width: `${w}px`, background: 'var(--surface-section)', borderRadius: '4px' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#b91c1c', fontSize: '0.875rem', fontWeight: 600 }}>
                    {t('pages.entreprise.absences.errorLoading')}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.875rem' }}>
                    {absences.length === 0 ? t('pages.entreprise.absences.noAbsences') : t('pages.entreprise.absences.noFound')}
                  </td>
                </tr>
              ) : rows.map(absence => {
                const hue     = (absence.etudiant_prenom?.charCodeAt(0) || 65) % 360;
                const initials = ((absence.etudiant_prenom?.[0] || '') + (absence.etudiant_nom?.[0] || '')).toUpperCase() || '?';
                return (
                  <tr key={absence.id_absence || absence.id}
                    style={{ borderBottom: '1px solid #f3f4f6' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-section)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0, background: `hsl(${hue},55%,90%)`, color: `hsl(${hue},55%,32%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem' }}>
                          {initials}
                        </div>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                          {absence.etudiant_prenom} {absence.etudiant_nom}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {absence.offre_titre || '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Calendar size={12} />
                        {new Date(absence.date_absence).toLocaleDateString('en-GB')}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: 'var(--text-color)', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={absence.motif_signalement}>
                      {absence.motif_signalement || '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={absence.justification}>
                      {absence.justification
                        ? <span style={{ color: '#15803d' }}>{absence.justification}</span>
                        : <span style={{ color: 'var(--text-subtle)', fontStyle: 'italic' }}>—</span>}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <StatutBadge statut={absence.statut} />
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelected(absence)}
                        style={{ width: 32, height: 32, border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#1e293b'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && filtered.length > 0 && (
          <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('pages.entreprise.absences.rows')}</span>
              <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                style={{ height: '28px', padding: '0 0.5rem', border: '1px solid var(--border)', borderRadius: '5px', fontSize: '0.8rem', color: 'var(--text-color)', background: 'var(--bg-card)', cursor: 'pointer', outline: 'none' }}>
                {PAGE_SIZES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, filtered.length)} {t('pages.entreprise.absences.of')} {filtered.length}
            </span>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ height: '28px', width: '28px', border: '1px solid var(--border)', borderRadius: '5px', background: 'var(--bg-card)', cursor: page === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: page === 1 ? 'var(--border)' : 'var(--text-color)' }}>
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let n = i + 1;
                if (totalPages > 5) {
                  if (page <= 3) n = i + 1;
                  else if (page >= totalPages - 2) n = totalPages - 4 + i;
                  else n = page - 2 + i;
                }
                return (
                  <button key={n} onClick={() => setPage(n)}
                    style={{ height: '28px', minWidth: '28px', padding: '0 0.25rem', border: `1px solid ${page === n ? '#1b6ef3' : 'var(--border)'}`, borderRadius: '5px', background: page === n ? '#1b6ef3' : 'var(--bg-card)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: page === n ? 600 : 400, color: page === n ? '#fff' : 'var(--text-color)' }}>
                    {n}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ height: '28px', width: '28px', border: '1px solid var(--border)', borderRadius: '5px', background: 'var(--bg-card)', cursor: page === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: page === totalPages ? 'var(--border)' : 'var(--text-color)' }}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Signal modal */}
      {showForm && (
        <SignalModal
          onClose={() => setShowForm(false)}
          interns={interns}
          onSubmit={data => signalMutation.mutate(data)}
          isPending={signalMutation.isPending}
        />
      )}

      {/* Validation Modal */}
      {selected && (() => {
        const s          = STATUT_STYLE[selected.statut] || STATUT_STYLE.Signaler;
        const hue        = (selected.etudiant_prenom?.charCodeAt(0) || 65) % 360;
        const ini        = ((selected.etudiant_prenom?.[0] || '') + (selected.etudiant_nom?.[0] || '')).toUpperCase() || '?';
        const canDecide  = selected.statut === 'En_attente_approbation';
        const isApproved = selected.statut === 'Justifiée';
        const LABELS = {
          Signaler:               t('pages.entreprise.absences.statusReported'),
          En_attente_approbation: t('pages.entreprise.absences.statusPending'),
          Justifiée:              t('pages.entreprise.absences.statusJustified'),
          Non_justifiée:          t('pages.entreprise.absences.statusUnjustified'),
        };
        const statusLabel = LABELS[selected.statut] || selected.statut;
        
        return (
          <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', width: '100%', maxWidth: 520, maxHeight: '90vh', borderRadius: 16, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

              {/* Header */}
              <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: `hsl(${hue},55%,90%)`, color: `hsl(${hue},55%,32%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.05rem', flexShrink: 0 }}>{ini}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>{selected.etudiant_prenom} {selected.etudiant_nom}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{selected.offre_titre || t('pages.entreprise.absences.stageDefault')}</div>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid #e2e8f0', background: 'var(--bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Meta chips */}
              <div style={{ borderTop: '1px solid #e2e8f0', padding: '0.75rem 1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flexShrink: 0, background: '#f8fafc' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.75rem', borderRadius: 999, border: '1px solid #e2e8f0', background: '#fff', fontSize: '0.78rem', color: 'var(--text-color)', fontWeight: 500 }}>
                  <Calendar size={12} color="#94a3b8" />{new Date(selected.date_absence).toLocaleDateString(dateLocale(i18n.language), { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600, padding: '0.3rem 0.75rem', borderRadius: 999, background: s.bg, color: s.color }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />{statusLabel}
                </span>
              </div>

              {/* Body */}
              <div style={{ overflowY: 'auto', flex: 1, padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1rem 1.25rem' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem' }}>{t('pages.entreprise.absences.reportedReason')}</div>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-color)', lineHeight: 1.65, fontStyle: 'italic' }}>"{selected.motif_signalement}"</p>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1rem 1.25rem' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem' }}>{t('pages.entreprise.absences.studentJustification')}</div>
                  {selected.justification ? (
                    <>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-color)', lineHeight: 1.65 }}>{selected.justification}</p>
                      {selected.document_justificatif && (
                        <a href={mediaUrl(selected.document_justificatif)} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.75rem', padding: '0.45rem 0.85rem', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 7, color: '#4338ca', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600 }}>
                          <FileText size={13} /> {t('pages.entreprise.absences.seeDocument')}
                        </a>
                      )}
                    </>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertCircle size={14} color="#f59e0b" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '0.82rem', color: '#92400e', fontWeight: 500 }}>{t('pages.entreprise.absences.noJustification')}</span>
                    </div>
                  )}
                </div>

              </div>

              {/* Footer */}
              <div style={{ borderTop: '1px solid #e2e8f0', padding: '1rem 1.5rem', flexShrink: 0 }}>
                {canDecide ? (
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      onClick={() => validateMutation.mutate({ id: selected.id_absence, statut: 'Non_justifiée' })}
                      disabled={validateMutation.isPending}
                      style={{ flex: 1, height: 40, border: '1px solid #fecaca', borderRadius: 9, background: '#fff', cursor: validateMutation.isPending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: '#dc2626', transition: 'background 0.15s' }}
                      onMouseEnter={e => !validateMutation.isPending && (e.currentTarget.style.background = '#fff5f5')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                    >
                      <X size={14} /> {t('pages.entreprise.absences.reject')}
                    </button>
                    <button
                      onClick={() => validateMutation.mutate({ id: selected.id_absence, statut: 'Justifiée' })}
                      disabled={validateMutation.isPending}
                      style={{ flex: 2, height: 40, border: 'none', borderRadius: 9, background: '#15803d', cursor: validateMutation.isPending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: '#fff', transition: 'background 0.15s' }}
                      onMouseEnter={e => !validateMutation.isPending && (e.currentTarget.style.background = '#166534')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#15803d')}
                    >
                      <Check size={14} /> {t('pages.entreprise.absences.approveJustification')}
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: 9, background: isApproved ? '#dcfce7' : selected.statut === 'Non_justifiée' ? '#fee2e2' : '#f3f4f6', border: `1px solid ${isApproved ? '#86efac' : selected.statut === 'Non_justifiée' ? '#fecaca' : '#e5e7eb'}` }}>
                      {isApproved ? <CheckCircle size={16} color="#15803d" /> : selected.statut === 'Non_justifiée' ? <XCircle size={16} color="#dc2626" /> : <Clock size={16} color="#9ca3af" />}
                      <span style={{ fontWeight: 600, fontSize: '0.875rem', color: isApproved ? '#15803d' : selected.statut === 'Non_justifiée' ? '#dc2626' : '#6b7280' }}>
                        {isApproved ? t('pages.entreprise.absences.absenceJustified') : selected.statut === 'Non_justifiée' ? t('pages.entreprise.absences.absenceUnjustified') : t('pages.entreprise.absences.waitingSubmission')}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default EntrepriseAbsences;
