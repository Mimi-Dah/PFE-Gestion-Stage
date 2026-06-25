import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../components/PageHeader';
import {
  User, Building, Search, Download, X,
  ShieldAlert, Users, ClipboardCheck,
  ArrowUpDown, ArrowUp, ArrowDown,
  ChevronLeft, ChevronRight, CalendarX, Clock,
} from 'lucide-react';
import api from '../../services/api';
import { dateLocale } from '../../utils/dateLocale';

const PAGE_SIZES = [10, 25, 50];

const TH = ({ children, col, sort, onSort, style = {} }) => {
  const active = col != null && sort?.col === col;
  return (
    <th
      onClick={() => col != null && onSort?.(col)}
      style={{
        padding: '0.75rem 1rem',
        fontSize: '0.7rem',
        fontWeight: 700,
        color: active ? '#1b6ef3' : '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        textAlign: 'left',
        background: '#f1f5f9',
        border: '1px solid #d1d9e0',
        whiteSpace: 'nowrap',
        cursor: col != null ? 'pointer' : 'default',
        userSelect: 'none',
        ...style,
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
        {children}
        {col != null && (active
          ? sort.dir === 'asc'
            ? <ArrowUp size={11} color="#1b6ef3" />
            : <ArrowDown size={11} color="#1b6ef3" />
          : <ArrowUpDown size={11} style={{ opacity: 0.28 }} />
        )}
      </span>
    </th>
  );
};

const Badge = ({ color, dot, children }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
    fontSize: '0.8rem', fontWeight: 600, color,
    whiteSpace: 'nowrap',
  }}>
    {dot && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: dot, flexShrink: 0 }} />}
    {children}
  </span>
);

const AbsencesModal = ({ data, onClose }) => {
  const { t, i18n } = useTranslation();
  if (!data) return null;
  const { student, absences } = data;
  const prenom = student.etudiant_detail?.prenom || '';
  const nom    = student.etudiant_detail?.nom || '';

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}
    >
      <div style={{ background: '#fff', borderRadius: '14px', width: '100%', maxWidth: '460px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(15,23,42,0.18)', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CalendarX size={17} />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>{t('pages.chefStagiaires.absencesTitle')} · {prenom} {nom}</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                {t('pages.chefStagiaires.absencesReported', { count: absences.length })}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: '28px', height: '28px', border: '1px solid #e2e8f0', borderRadius: '7px', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#334155'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            <X size={13} />
          </button>
        </div>
        <div style={{ padding: '1rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {absences.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem 0.875rem', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.7rem', fontWeight: 700, marginTop: '0.1rem' }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.845rem', fontWeight: 600, color: '#7f1d1d', lineHeight: 1.55 }}>
                  {a.motif_signalement || t('pages.chefStagiaires.reasonMissing')}
                </div>
                {a.date_signalement && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.71rem', color: '#b91c1c', marginTop: '0.3rem', opacity: 0.75 }}>
                    <Clock size={11} />
                    {new Date(a.date_signalement).toLocaleDateString(dateLocale(i18n.language), { day: '2-digit', month: 'long', year: 'numeric' })}
                  </div>
                )}
              </div>
            </div>
          ))}
          <button
            onClick={onClose}
            style={{ width: '100%', height: '36px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'transparent', cursor: 'pointer', fontSize: '0.845rem', fontWeight: 600, color: '#334155', marginTop: '0.25rem' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {t('pages.chefStagiaires.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

const StagiairesChef = () => {
  const { t } = useTranslation();
  const [absencesModal, setAbsencesModal] = useState(null);
  const [search, setSearch]               = useState('');
  const [sort, setSort]                   = useState({ col: 'nom', dir: 'asc' });
  const [page, setPage]                   = useState(1);
  const [pageSize, setPageSize]           = useState(10);

  const { data: candidaturesData, isLoading } = useQuery({
    queryKey: ['chef-stagiaires'],
    queryFn: async () => {
      const r = await api.safeRequest(api.get('candidatures/?statut=Stage_actif,Terminé'));
      if (r.ok) return r.value.data;
      throw r.error;
    },
  });
  const candidatures = Array.isArray(candidaturesData) ? candidaturesData : (candidaturesData?.results || []);

  const { data: reportsData } = useQuery({
    queryKey: ['chef-reports'],
    queryFn: async () => {
      const r = await api.safeRequest(api.get('rapports/'));
      if (r.ok) return r.value.data;
      throw r.error;
    },
  });
  const reports = Array.isArray(reportsData) ? reportsData : (reportsData?.results || []);

  const { data: absencesData } = useQuery({
    queryKey: ['chef-absences-all'],
    queryFn: async () => {
      const r = await api.safeRequest(api.get('absences/'));
      if (r.ok) return r.value.data;
      throw r.error;
    },
  });
  const absences = Array.isArray(absencesData) ? absencesData : (absencesData?.results || []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = candidatures.filter(c =>
      `${c.etudiant_detail?.prenom} ${c.etudiant_detail?.nom}`.toLowerCase().includes(q) ||
      (c.offre_detail?.entreprise?.nom || '').toLowerCase().includes(q) ||
      (c.offre_detail?.titre || '').toLowerCase().includes(q)
    );
    list = [...list].sort((a, b) => {
      const an = `${a.etudiant_detail?.prenom} ${a.etudiant_detail?.nom}`.toLowerCase();
      const bn = `${b.etudiant_detail?.prenom} ${b.etudiant_detail?.nom}`.toLowerCase();
      const ae = (a.offre_detail?.entreprise?.nom || '').toLowerCase();
      const be = (b.offre_detail?.entreprise?.nom || '').toLowerCase();
      const av = sort.col === 'entreprise' ? ae : an;
      const bv = sort.col === 'entreprise' ? be : bn;
      return sort.dir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return list;
  }, [candidatures, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows       = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (col) => {
    setSort(s => ({ col, dir: s.col === col && s.dir === 'asc' ? 'desc' : 'asc' }));
    setPage(1);
  };

  const actifs     = candidatures.filter(c => c.statut === 'Stage_actif').length;
  const withReport = candidatures.filter(c => reports.find(r => r.etudiant === c.etudiant && r.offre === c.offre)).length;

  const statCards = [
    { label: t('pages.chefStagiaires.statTotal'),   value: candidatures.length, color: '#6366f1', bg: '#eef2ff', icon: <Users size={17} /> },
    { label: t('pages.chefStagiaires.statActive'),  value: actifs,              color: '#16a34a', bg: '#f0fdf4', icon: <User size={17} /> },
    { label: t('pages.chefStagiaires.statReports'), value: withReport,          color: '#b45309', bg: '#fffbeb', icon: <ClipboardCheck size={17} /> },
  ];

  return (
    <div style={{ padding: '0 0 2.5rem' }}>

      <PageHeader
        eyebrow={t('pages.chefStagiaires.eyebrow')}
        title={t('pages.chefStagiaires.title')}
        subtitle={t('pages.chefStagiaires.subtitle')}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
        {statCards.map(s => (
          <div
            key={s.label}
            style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem', transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.15s', cursor: 'default' }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = s.color;
              e.currentTarget.style.boxShadow = `0 4px 16px rgba(0,0,0,0.08)`;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>{s.value}</div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 500, marginTop: '0.15rem' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.75rem' }}>
        {t('pages.chefStagiaires.sectionLabel')}
      </p>

      <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,23,42,0.06)' }}>

        <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder={t('pages.chefStagiaires.searchPlaceholder')}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ height: '36px', paddingLeft: '2.1rem', paddingRight: '0.875rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.82rem', outline: 'none', width: '240px', color: '#334155', boxSizing: 'border-box', background: '#ffffff' }}
              onFocus={e => e.currentTarget.style.borderColor = '#93c5fd'}
              onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <TH col="nom"        sort={sort} onSort={handleSort}>{t('pages.chefStagiaires.colStagiaire')}</TH>
                <TH col="entreprise" sort={sort} onSort={handleSort}>{t('pages.chefStagiaires.colEntreprise')}</TH>
                <TH style={{ width: '80px' }}>{t('pages.chefStagiaires.colAbsences')}</TH>
                <TH style={{ width: '100px' }}>{t('pages.chefStagiaires.colRapport')}</TH>
                <TH style={{ width: '100px' }}>{t('pages.chefStagiaires.colStatut')}</TH>
                <TH style={{ width: '100px', textAlign: 'center' }}>{t('pages.chefStagiaires.colActions')}</TH>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {[180, 200, 50, 80, 80, 80].map((w, j) => (
                      <td key={j} style={{ padding: '0.875rem 1rem', border: '1px solid #d1d9e0' }}>
                        <div style={{ height: '13px', width: `${w}px`, background: '#f1f5f9', borderRadius: '6px', animation: 'pulse 1.5s ease-in-out infinite' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '4rem', textAlign: 'center', border: '1px solid #d1d9e0' }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                      {search
                        ? t('pages.chefStagiaires.noSearchResults', { search })
                        : t('pages.chefStagiaires.noStagiaires')}
                    </div>
                  </td>
                </tr>
              ) : rows.map((cand, idx) => {
                const report       = reports.find(r => r.etudiant === cand.etudiant && r.offre === cand.offre);
                const studAbsences = absences.filter(a => a.candidature === cand.id_candidature);
                const isActif      = cand.statut === 'Stage_actif';
                const prenom       = cand.etudiant_detail?.prenom || '';
                const nom          = cand.etudiant_detail?.nom || '';
                const initials     = ((prenom[0] || '') + (nom[0] || '')).toUpperCase() || '?';
                const hue          = (prenom.charCodeAt(0) || 65) % 360;

                return (
                  <tr key={cand.id_candidature}>
                    <td style={{ padding: '0.875rem 1rem', border: '1px solid #d1d9e0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                          background: `hsl(${hue},55%,90%)`, color: `hsl(${hue},55%,32%)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.01em',
                        }}>
                          {initials}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1b6ef3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {prenom} {nom}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                            {cand.etudiant_detail?.niveau_academique || t('pages.chefStagiaires.student')}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '0.875rem 1rem', border: '1px solid #d1d9e0', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.845rem', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <Building size={12} color="#94a3b8" style={{ flexShrink: 0 }} />
                        {cand.offre_detail?.entreprise?.nom || '—'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {cand.offre_detail?.titre}
                      </div>
                    </td>

                    <td style={{ padding: '0.875rem 1rem', border: '1px solid #d1d9e0' }}>
                      {studAbsences.length > 0 ? (
                        <Badge color="#b91c1c" dot="#f87171">
                          {studAbsences.length}
                        </Badge>
                      ) : (
                        <span style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>—</span>
                      )}
                    </td>

                    <td style={{ padding: '0.875rem 1rem', border: '1px solid #d1d9e0' }}>
                      {report ? (
                        <Badge color="#16a34a" dot="#22c55e">{t('pages.chefStagiaires.submitted')}</Badge>
                      ) : (
                        <span style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>—</span>
                      )}
                    </td>

                    <td style={{ padding: '0.875rem 1rem', border: '1px solid #d1d9e0' }}>
                      <Badge
                        color={isActif ? '#16a34a' : '#94a3b8'}
                        dot={isActif ? '#22c55e' : '#cbd5e1'}
                      >
                        {isActif ? t('pages.chefStagiaires.active') : t('pages.chefStagiaires.finished')}
                      </Badge>
                    </td>

                    <td style={{ padding: '0.875rem 1rem', border: '1px solid #d1d9e0' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', justifyContent: 'center' }}>

                        {report ? (
                          <button
                            onClick={() => window.open(report.fichier, '_blank')}
                            title={t('pages.chefStagiaires.downloadReport')}
                            style={{ height: '30px', width: '30px', border: '1.5px solid #e2e8f0', borderRadius: '7px', background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexShrink: 0 }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#1e293b'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}
                          >
                            <Download size={13} />
                          </button>
                        ) : <span style={{ display: 'inline-block', width: '30px', flexShrink: 0 }} />}

                        {studAbsences.length > 0 ? (
                          <button
                            onClick={() => setAbsencesModal({ student: cand, absences: studAbsences })}
                            title={t('pages.chefStagiaires.seeAbsences')}
                            style={{ height: '30px', width: '30px', border: '1.5px solid #fca5a5', borderRadius: '7px', background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b91c1c', flexShrink: 0 }}
                            onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                            onMouseLeave={e => e.currentTarget.style.background = '#fef2f2'}
                          >
                            <ShieldAlert size={13} />
                          </button>
                        ) : <span style={{ display: 'inline-block', width: '30px', flexShrink: 0 }} />}

                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!isLoading && filtered.length > 0 && (
          <div style={{ padding: '0.875rem 1.25rem', borderTop: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', background: '#fafafa' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>{t('pages.chefStagiaires.rows')}</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                style={{ height: '30px', padding: '0 0.5rem', border: '1.5px solid #e2e8f0', borderRadius: '6px', fontSize: '0.78rem', color: '#334155', background: '#ffffff', cursor: 'pointer', outline: 'none' }}
              >
                {PAGE_SIZES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, filtered.length)} {t('pages.chefStagiaires.of')} {filtered.length}
            </span>

            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ height: '30px', width: '30px', border: '1.5px solid #e2e8f0', borderRadius: '6px', background: '#ffffff', cursor: page === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: page === 1 ? '#e2e8f0' : '#64748b', opacity: page === 1 ? 0.5 : 1 }}
              >
                <ChevronLeft size={14} />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let n = i + 1;
                if (totalPages > 5) {
                  if (page <= 3) n = i + 1;
                  else if (page >= totalPages - 2) n = totalPages - 4 + i;
                  else n = page - 2 + i;
                }
                const active = page === n;
                return (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    style={{ height: '30px', minWidth: '30px', padding: '0 0.3rem', border: `1.5px solid ${active ? '#1b6ef3' : '#e2e8f0'}`, borderRadius: '6px', background: active ? '#1b6ef3' : '#ffffff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: active ? 700 : 400, color: active ? '#ffffff' : '#64748b' }}
                  >
                    {n}
                  </button>
                );
              })}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ height: '30px', width: '30px', border: '1.5px solid #e2e8f0', borderRadius: '6px', background: '#ffffff', cursor: page === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: page === totalPages ? '#e2e8f0' : '#64748b', opacity: page === totalPages ? 0.5 : 1 }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <AbsencesModal data={absencesModal} onClose={() => setAbsencesModal(null)} />
    </div>
  );
};

export default StagiairesChef;
