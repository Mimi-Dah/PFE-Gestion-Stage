import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users, Building2, Briefcase, FileText, CheckCircle,
  ChevronRight, Download, Loader2, TrendingUp, Activity,
  ArrowUpRight, BarChart3,
} from 'lucide-react';
import api from '../../services/api';
import SkeletonLoader from '../../components/ui/SkeletonLoader';

const KpiCard = ({ icon: Icon, label, value, sub, iconBg, iconColor, to, accentColor }) => {
  const navigate = useNavigate();
  const [hov, setHov] = useState(false);
  return (
    <div
      className="glass-panel"
      onClick={() => to && navigate(to)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '1.375rem 1.5rem',
        cursor: to ? 'pointer' : 'default',
        display: 'flex', flexDirection: 'column', gap: '1.125rem',
        borderTop: `3px solid ${hov ? accentColor : 'transparent'}`,
        transform: hov && to ? 'translateY(-3px)' : undefined,
        boxShadow: hov && to ? '0 12px 32px rgba(0,0,0,.10)' : undefined,
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ margin: '0 0 8px', fontSize: '0.6875rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
            {label}
          </p>
          <div style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--text-main)', lineHeight: 1, letterSpacing: '-0.04em', fontFamily: 'var(--font-heading)' }}>
            {value}
          </div>
        </div>
        <div style={{
          width: 48, height: 48, borderRadius: 14, background: iconBg, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor,
          transform: hov ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.2s ease',
        }}>
          <Icon size={22} strokeWidth={1.75} />
        </div>
      </div>
      <div style={{ paddingTop: '0.875rem', borderTop: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', gap: 5 }}>
        <TrendingUp size={12} color={accentColor} />
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '500' }}>{sub}</span>
      </div>
    </div>
  );
};

const PipelineDonut = ({ overview }) => {
  const { t } = useTranslation();
  const [animated, setAnimated] = useState(false);
  const [selected, setSelected] = useState(null);
  useEffect(() => { const timer = setTimeout(() => setAnimated(true), 80); return () => clearTimeout(timer); }, []);

  const segments = [
    { label: t('pages.adminAnalytics.pipeline.completed'),   value: overview.completed_internships ?? 0, color: '#10b981' },
    { label: t('pages.adminAnalytics.pipeline.active'),      value: overview.active_internships   ?? 0, color: '#1B6EF3' },
    { label: t('pages.adminAnalytics.pipeline.applications'),value: Math.max(0, (overview.total_candidatures ?? 0) - (overview.active_internships ?? 0) - (overview.completed_internships ?? 0)), color: '#f59e0b' },
  ].filter(s => s.value > 0);

  const total = segments.reduce((a, s) => a + s.value, 0);
  if (total === 0) return null;

  const cx = 50, cy = 50, r = 38, circ = 2 * Math.PI * r, GAP = circ * 0.018;
  let cumulative = 0;
  const slices = segments.map(s => {
    const pct = s.value / total;
    const slice = { ...s, pct, start: cumulative };
    cumulative += pct;
    return slice;
  });
  const sel = selected !== null ? slices[selected] : null;

  return (
    <div className="glass-panel" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.25rem' }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
          <Activity size={16} strokeWidth={2} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: '700', color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
            {t('pages.adminAnalytics.pipeline.title')}
          </h3>
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {t('pages.adminAnalytics.pipeline.subtitle')}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,.08))' }}>
            <circle cx={cx} cy={cy} r={r} fill="none" style={{ stroke: 'var(--surface-section)', strokeWidth: 10 }} />
            {slices.map((s, i) => {
              const isActive = selected === null || selected === i;
              const sw = selected === i ? 13 : 10;
              const segLen = animated ? Math.max(0, s.pct * circ - GAP) : 0;
              return (
                <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                  style={{
                    stroke: s.color, strokeWidth: sw,
                    opacity: isActive ? 1 : 0.15,
                    strokeDasharray: `${segLen} ${circ - segLen}`,
                    strokeDashoffset: circ - s.start * circ,
                    strokeLinecap: 'round',
                    transform: 'rotate(-90deg)', transformOrigin: '50% 50%',
                    cursor: 'pointer',
                    transition: `stroke-dasharray ${0.8 + i * 0.2}s cubic-bezier(0.4,0,0.2,1) ${i * 0.12}s, opacity 0.2s, stroke-width 0.2s`,
                  }}
                  onClick={() => setSelected(p => p === i ? null : i)}
                />
              );
            })}
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            {sel ? (
              <>
                <span style={{ fontSize: '1.375rem', fontWeight: '800', color: sel.color, lineHeight: 1 }}>{Math.round(sel.pct * 100)}%</span>
                <span style={{ fontSize: '0.5rem', color: sel.color, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3, textAlign: 'center', maxWidth: 46, lineHeight: 1.2 }}>{sel.label}</span>
              </>
            ) : (
              <>
                <span style={{ fontSize: '1.625rem', fontWeight: '800', color: 'var(--text-main)', lineHeight: 1 }}>{total}</span>
                <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
                  {t('pages.adminAnalytics.pipeline.total')}
                </span>
              </>
            )}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {slices.map((s, i) => (
            <div key={i} onClick={() => setSelected(p => p === i ? null : i)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', opacity: (selected === null || selected === i) ? 1 : 0.3, transition: 'opacity 0.2s' }}
            >
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0, boxShadow: selected === i ? `0 0 0 3px ${s.color}30` : 'none', transition: 'box-shadow 0.2s' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 1 }}>{s.label}</div>
                <div style={{ fontSize: '0.9375rem', fontWeight: '700', color: 'var(--text-main)', lineHeight: 1, fontFamily: 'var(--font-heading)' }}>{s.value}</div>
              </div>
              <span style={{ fontSize: '0.65rem', fontWeight: '700', color: s.color, background: `${s.color}18`, padding: '2px 8px', borderRadius: 100 }}>
                {Math.round(s.pct * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const IndicatorsPanel = ({ overview }) => {
  const { t } = useTranslation();
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const timer = setTimeout(() => setAnimated(true), 150); return () => clearTimeout(timer); }, []);

  const score = overview.average_performance ?? 0;
  const pct   = Math.min((score / 20) * 100, 100);
  const r     = 42, circ = 2 * Math.PI * r, dash = animated ? (pct / 100) * circ : 0;

  const metrics = [
    { label: t('pages.adminAnalytics.indicators.placementRate'),      value: `${overview.placement_rate ?? 0}%`,         color: '#10b981', bg: 'rgba(16,185,129,.1)' },
    { label: t('pages.adminAnalytics.indicators.activeInternships'),  value: overview.active_internships ?? 0,            color: '#1B6EF3', bg: 'rgba(27,110,243,.1)' },
    { label: t('pages.adminAnalytics.indicators.completedInternships'),value: overview.completed_internships ?? 0,        color: '#8b5cf6', bg: 'rgba(139,92,246,.1)' },
  ];

  return (
    <div className="glass-panel" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.25rem' }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(245,158,11,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
          <BarChart3 size={16} strokeWidth={2} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: '700', color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
            {t('pages.adminAnalytics.indicators.title')}
          </h3>
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {t('pages.adminAnalytics.indicators.subtitle')}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1.125rem', marginBottom: '1.125rem', borderBottom: '1px solid var(--surface-border)' }}>
        <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
            <circle cx="50" cy="50" r={r} fill="none" style={{ stroke: 'var(--surface-section)', strokeWidth: 8 }} />
            <circle cx="50" cy="50" r={r} fill="none"
              style={{ stroke: '#1B6EF3', strokeWidth: 8, strokeDasharray: `${dash} ${circ - dash}`, strokeLinecap: 'round', transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <span style={{ fontSize: '1.125rem', fontWeight: '800', color: 'var(--text-main)', lineHeight: 1 }}>{score}</span>
            <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)', fontWeight: '600', marginTop: 2 }}>/20</span>
          </div>
        </div>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: '0.8125rem', fontWeight: '700', color: 'var(--text-main)' }}>
            {t('pages.adminAnalytics.indicators.satisfactionScore')}
          </p>
          <p style={{ margin: '0 0 8px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {t('pages.adminAnalytics.indicators.evaluationAverage')}
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', borderRadius: 100, background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '0.7rem', fontWeight: '700' }}>
            <ArrowUpRight size={11} /> {t('pages.adminAnalytics.indicators.objectivePct', { pct: Math.round(pct) })}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {metrics.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.color }} />
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '500' }}>{m.label}</span>
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>{m.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const DeptPerformance = ({ data }) => {
  const { t } = useTranslation();
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const timer = setTimeout(() => setAnimated(true), 200); return () => clearTimeout(timer); }, []);

  if (!data || data.length === 0) return null;
  const half = Math.ceil(data.length / 2);

  const Row = ({ row }) => {
    const rate = row.total > 0 ? Math.round((row.en_stage / row.total) * 100) : 0;
    const color = rate >= 50 ? '#10b981' : rate >= 25 ? '#1B6EF3' : '#f59e0b';
    return (
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
          <div>
            <div style={{ fontSize: '0.84375rem', fontWeight: '600', color: 'var(--text-main)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {row.departement}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {row.total} {t('pages.adminAnalytics.departments.enrolled')} · {row.en_stage} {t('pages.adminAnalytics.departments.internship')}
            </div>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 100, background: `${color}15`, color, fontSize: '0.75rem', fontWeight: '700', flexShrink: 0, marginLeft: 8 }}>
            {rate}%
          </div>
        </div>
        <div style={{ height: 7, background: 'var(--surface-section)', borderRadius: 100, overflow: 'hidden' }}>
          <div style={{
            width: animated ? `${rate}%` : '0%', height: '100%', borderRadius: 100,
            background: rate >= 50 ? 'linear-gradient(90deg,#10b981,#34d399)' : rate >= 25 ? 'linear-gradient(90deg,#1B6EF3,#6366F1)' : 'linear-gradient(90deg,#f59e0b,#fcd34d)',
            transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)',
          }} />
        </div>
      </div>
    );
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
            <BarChart3 size={17} strokeWidth={1.75} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', letterSpacing: '-0.015em' }}>
              {t('pages.adminAnalytics.departments.title')}
            </h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {t('pages.adminAnalytics.departments.subtitle')}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          {[['#10b981', '≥ 50%'], ['#1B6EF3', '25–50%'], ['#f59e0b', '< 25%']].map(([c, l]) => (
            <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              <span style={{ width: 20, height: 6, borderRadius: 3, background: c, display: 'inline-block', opacity: 0.75 }} />{l}
            </span>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 3rem' }}>
        <div>{data.slice(0, half).map((r, i) => <Row key={i} row={r} />)}</div>
        <div>{data.slice(half).map((r, i) => <Row key={i} row={r} />)}</div>
      </div>
    </div>
  );
};

const AdminAnalytics = () => {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const response = await api.get('analytics/admin/report/', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      const disposition = response.headers['content-disposition'];
      const match = disposition && disposition.match(/filename="([^"]+)"/);
      link.download = match ? match[1] : 'internhub_rapport.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[PDF Export] Failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const { data: stats, isLoading, isError, error } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const result = await api.safeRequest(api.get('analytics/admin/'));
      if (result.ok) return result.value.data;
      throw result.error;
    },
  });

  const { data: offresRaw } = useQuery({
    queryKey: ['admin-offers'],
    queryFn: () => api.get('offres/').then(r => r.data),
  });
  const allOffers  = Array.isArray(offresRaw) ? offresRaw : (offresRaw?.results ?? []);
  const realTotal  = allOffers.length;
  const realActive = allOffers.filter(o => o.statut === 'Active').length;

  if (isLoading) return <SkeletonLoader variant="dashboard" />;
  if (isError) return (
    <div style={{ padding: '10rem 0', textAlign: 'center' }}>
      <div style={{ color: 'var(--error)', fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.75rem' }}>
        {t('pages.adminAnalytics.error.loading')}
      </div>
      <div style={{ color: 'var(--text-muted)' }}>{error?.message || t('pages.adminAnalytics.error.unknown')}</div>
    </div>
  );

  const { overview, by_department, recent_placements } = stats;

  const AVATAR_COLORS = [
    { bg: 'rgba(27,110,243,.12)',  fg: '#1B6EF3' },
    { bg: 'rgba(16,184,166,.12)',  fg: '#0D9488' },
    { bg: 'rgba(249,115,22,.12)',  fg: '#EA580C' },
    { bg: 'rgba(139,92,246,.12)',  fg: '#7C3AED' },
    { bg: 'rgba(236,72,153,.12)',  fg: '#DB2777' },
    { bg: 'rgba(245,158,11,.12)',  fg: '#D97706' },
  ];

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1400, margin: '0 auto' }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="page-hero-eyebrow">
            <Activity size={13} /> {t('pages.adminAnalytics.eyebrow')}
          </div>
          <h1 style={{ margin: 0 }}>{t('pages.adminAnalytics.title')}</h1>
          <p style={{ marginTop: 4, fontSize: '0.875rem' }}>{t('pages.adminAnalytics.subtitle')}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 100, background: 'var(--success-light)', border: '1px solid rgba(16,185,129,.25)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)', display: 'inline-block', boxShadow: '0 0 6px var(--success)' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--success)' }}>
              {t('pages.adminAnalytics.systemActive')}
            </span>
          </div>
          <button className="secondary" onClick={handleExportPDF} disabled={isExporting} style={{ opacity: isExporting ? 0.7 : 1 }}>
            {isExporting ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={15} />}
            {isExporting ? t('pages.adminAnalytics.exporting') : t('pages.adminAnalytics.exportPdf')}
          </button>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid-stats-4" style={{ marginBottom: '1.25rem' }}>
        <KpiCard
          icon={Users} label={t('pages.adminAnalytics.kpi.students')}
          accentColor="#0D9488" iconBg="rgba(20,184,166,.12)" iconColor="#0D9488"
          value={overview.total_students.toLocaleString()}
          sub={t('pages.adminAnalytics.kpi.studentsSub', { count: overview.active_internships ?? 0 })}
          to="/espace/admin/utilisateurs?role=Étudiant"
        />
        <KpiCard
          icon={Building2} label={t('pages.adminAnalytics.kpi.companies')}
          accentColor="#EA580C" iconBg="rgba(249,115,22,.12)" iconColor="#EA580C"
          value={overview.total_companies.toLocaleString()}
          sub={t('pages.adminAnalytics.kpi.companiesSub', { count: realActive })}
          to="/espace/admin/utilisateurs?role=Entreprise"
        />
        <KpiCard
          icon={Briefcase} label={t('pages.adminAnalytics.kpi.activeOffers')}
          accentColor="#1B6EF3" iconBg="rgba(27,110,243,.12)" iconColor="#1B6EF3"
          value={realActive.toLocaleString()}
          sub={t('pages.adminAnalytics.kpi.activeOffersSub', { total: realTotal })}
          to="/espace/admin/offres"
        />
        <KpiCard
          icon={FileText} label={t('pages.adminAnalytics.kpi.applications')}
          accentColor="#7C3AED" iconBg="rgba(139,92,246,.12)" iconColor="#7C3AED"
          value={overview.total_candidatures.toLocaleString()}
          sub={t('pages.adminAnalytics.kpi.applicationsSub', { rate: Math.round(overview.placement_rate ?? 0) })}
          to="/espace/admin/archives"
        />
      </div>

      {/* ── Main grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.25rem', alignItems: 'start' }}>

        {/* Recent placements table */}
        <div className="vl-card">
          <div className="vl-header">
            <div className="vl-hd-left">
              <h3 className="vl-hd-title">
                {t('pages.adminAnalytics.placements.title')}
                <span className="vl-count-badge">{recent_placements.length}</span>
              </h3>
              <p className="vl-hd-sub">{t('pages.adminAnalytics.placements.subtitle')}</p>
            </div>
            <button className="secondary" onClick={() => window.location.href = '/espace/admin/utilisateurs'} style={{ fontSize: '0.75rem', padding: '5px 12px' }}>
              {t('pages.adminAnalytics.placements.viewAll')} <ChevronRight size={12} style={{ marginLeft: 2 }} />
            </button>
          </div>

          <table className="vl-table">
            <thead>
              <tr>
                <th className="vl-th">{t('pages.adminAnalytics.placements.colStudent')}</th>
                <th className="vl-th">{t('pages.adminAnalytics.placements.colCompany')}</th>
                <th className="vl-th">{t('pages.adminAnalytics.placements.colStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {recent_placements.slice(0, 9).map((p, idx) => {
                const ac = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                return (
                  <tr key={idx} className="vl-row">
                    <td className="vl-td">
                      <div className="vl-identity">
                        <div className="vl-avt" style={{ background: ac.bg, color: ac.fg }}>
                          {(p.student || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="vl-name">{p.student}</div>
                          <div className="vl-sub">{t('pages.adminAnalytics.placements.intern')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="vl-td">
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-color)', fontWeight: '500' }}>{p.company}</span>
                    </td>
                    <td className="vl-td">
                      <span className="vl-badge" style={{ background: 'rgba(16,185,129,.1)', color: '#059669', border: '1px solid rgba(16,185,129,.2)' }}>
                        <span className="vl-badge-dot" />
                        {t('pages.adminAnalytics.placements.placed')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="vl-footer">
            <span>
              {recent_placements.length === 1
                ? t('pages.adminAnalytics.placements.recentSingular')
                : t('pages.adminAnalytics.placements.recentPlural', { count: recent_placements.length })}
            </span>
            <span style={{ color: 'var(--success)', fontWeight: '700' }}>
              {t('pages.adminAnalytics.placements.globalRate', { rate: Math.round(overview.placement_rate ?? 0) })}
            </span>
          </div>
        </div>

        {/* Side panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <PipelineDonut overview={overview} />
          <IndicatorsPanel overview={overview} />
        </div>
      </div>

      <DeptPerformance data={by_department} />

    </div>
  );
};

export default AdminAnalytics;
