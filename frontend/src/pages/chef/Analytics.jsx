import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../components/PageHeader';
import {
  Users, Briefcase, CheckCircle, Award,
  Clock, ChevronRight,
  FileText, Calendar,
} from 'lucide-react';
import api from '../../services/api';
import SkeletonLoader from '../../components/ui/SkeletonLoader';

const StatCard = ({ icon: Icon, label, value, trend, subtext, iconBg, iconColor, to }) => {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  return (
    <div
      className="glass-panel"
      onClick={() => to && navigate(to)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '22px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px',
        cursor: to ? 'pointer' : 'default',
        transform: hovered && to ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered && to ? '0 12px 28px rgba(0,0,0,0.1)' : undefined,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: '0 0 8px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {label}
        </p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
          <span style={{ fontSize: '2.125rem', fontWeight: '700', color: 'var(--text-main)', lineHeight: 1 }}>{value}</span>
          {subtext && <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: '500' }}>{subtext}</span>}
        </div>
        {trend && <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--success)', fontWeight: '600' }}>{trend}</p>}
      </div>
      <div style={{
        width: 52, height: 52, borderRadius: 14, background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor, flexShrink: 0,
        transition: 'transform 0.2s ease',
        transform: hovered && to ? 'scale(1.12)' : 'scale(1)',
      }}>
        <Icon size={24} />
      </div>
    </div>
  );
};

const CandidatureDonut = ({ candidature_stats }) => {
  const { t } = useTranslation();
  const [animated, setAnimated] = useState(false);
  const [selected, setSelected] = useState(null);
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
  if (!Array.isArray(candidature_stats) || candidature_stats.length === 0) return null;
  const total = candidature_stats.reduce((a, s) => a + s.count, 0);
  if (total === 0) return null;

  const cx = 50, cy = 50, r = 38;
  const circ = 2 * Math.PI * r;
  const GAP = circ * 0.018;

  let cum = 0;
  const slices = candidature_stats.map((s, i) => {
    const pct = s.count / total;
    const slice = { ...s, pct, start: cum, color: COLORS[i % COLORS.length] };
    cum += pct;
    return slice;
  });

  const sel = selected !== null ? slices[selected] : null;

  return (
    <div className="glass-panel" style={{ padding: '20px 22px' }}>
      <h3 style={{ margin: '0 0 20px', fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>
        {t('pages.chefAnalytics.candidatureStatus')}
      </h3>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ position: 'relative', width: 130, height: 130, flexShrink: 0 }}>
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.10))' }}>
            <circle cx={cx} cy={cy} r={r} fill="none" style={{ stroke: '#f3f4f6', strokeWidth: 11 }} />
            {slices.map((s, i) => {
              const isActive = selected === null || selected === i;
              const sw = selected === i ? 14 : 11;
              const segLen = animated ? Math.max(0, s.pct * circ - GAP) : 0;
              const offset = circ - s.start * circ;
              return (
                <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                  style={{
                    stroke: s.color,
                    strokeWidth: sw,
                    opacity: isActive ? 1 : 0.18,
                    strokeDasharray: `${segLen} ${circ - segLen}`,
                    strokeDashoffset: offset,
                    strokeLinecap: 'round',
                    transform: 'rotate(-90deg)', transformOrigin: '50% 50%',
                    cursor: 'pointer',
                    transition: `stroke-dasharray ${0.8 + i * 0.2}s cubic-bezier(0.4,0,0.2,1) ${i * 0.15}s, opacity 0.25s ease, stroke-width 0.25s ease`,
                  }}
                  onClick={() => setSelected(prev => prev === i ? null : i)}
                />
              );
            })}
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            {sel ? (
              <>
                <span style={{ fontSize: '1.5rem', fontWeight: '800', color: sel.color, lineHeight: 1, transition: 'color 0.2s' }}>
                  {Math.round(sel.pct * 100)}%
                </span>
                <span style={{ fontSize: '0.55rem', color: sel.color, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3, textAlign: 'center', maxWidth: 50, lineHeight: 1.2 }}>
                  {t(`pages.candidatures.status.${sel.statut}`, { defaultValue: (sel.statut || '').replace(/_/g, ' ') })}
                </span>
              </>
            ) : (
              <>
                <span style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)', lineHeight: 1 }}>{total}</span>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
                  {t('pages.chefAnalytics.total')}
                </span>
              </>
            )}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {slices.map((s, i) => {
            const isActive = selected === null || selected === i;
            return (
              <div
                key={i}
                onClick={() => setSelected(prev => prev === i ? null : i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  cursor: 'pointer', opacity: isActive ? 1 : 0.35,
                  transition: 'opacity 0.25s ease',
                }}
              >
                <div style={{ width: 11, height: 11, borderRadius: '50%', background: s.color, flexShrink: 0, boxShadow: selected === i ? `0 0 0 4px ${s.color}35` : `0 0 0 3px ${s.color}25`, transition: 'box-shadow 0.25s ease' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1px', whiteSpace: 'nowrap' }}>
                    {t(`pages.candidatures.status.${s.statut}`, { defaultValue: (s.statut || '').replace(/_/g, ' ') })}
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', lineHeight: 1 }}>{s.count}</div>
                </div>
                <span style={{
                  fontSize: '0.68rem', fontWeight: '700', color: s.color,
                  background: selected === i ? `${s.color}30` : `${s.color}18`,
                  padding: '2px 7px', borderRadius: '9999px', whiteSpace: 'nowrap',
                  transition: 'background 0.25s ease',
                }}>
                  {Math.round(s.pct * 100)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const QuickActions = () => {
  const { t } = useTranslation();
  const ACTIONS = [
    { label: t('pages.chefAnalytics.validateConventions'), link: '/espace/chef/conventions', Icon: FileText,  color: 'var(--primary)', bg: 'var(--primary-light)' },
    { label: t('pages.chefAnalytics.evaluateReports'),    link: '/espace/chef/rapports',    Icon: Award,     color: 'var(--accent)',   bg: 'var(--accent-light)'  },
    { label: t('pages.chefAnalytics.checkAbsences'),      link: '/espace/chef/absences',    Icon: Calendar,  color: 'var(--warning)',  bg: 'var(--warning-light)' },
    { label: t('pages.chefAnalytics.internList'),         link: '/espace/chef/stagiaires',  Icon: Users,     color: 'var(--success)',  bg: 'var(--success-light)' },
  ];

  return (
    <>
      <h3 style={{ margin: '0 0 14px', fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>
        {t('pages.chefAnalytics.quickActionsTitle')}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {ACTIONS.map((a, i) => (
          <button
            key={i}
            onClick={() => window.location.href = a.link}
            style={{
              width: '100%', padding: '12px 14px', borderRadius: '10px',
              background: 'var(--surface-ground)', border: '1px solid var(--surface-border)',
              display: 'flex', alignItems: 'center', gap: '12px',
              cursor: 'pointer', transition: 'all 0.12s ease', textAlign: 'left',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = a.bg; e.currentTarget.style.borderColor = a.color; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-ground)'; e.currentTarget.style.borderColor = 'var(--surface-border)'; }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 9, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.color, flexShrink: 0 }}>
              <a.Icon size={17} />
            </div>
            <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)' }}>{a.label}</span>
            <ChevronRight size={15} color="var(--text-muted)" />
          </button>
        ))}
      </div>
    </>
  );
};

const LevelPerformance = ({ data }) => {
  const { t } = useTranslation();
  if (!data || data.length === 0) return null;
  const half = Math.ceil(data.length / 2);
  const col1 = data.slice(0, half);
  const col2 = data.slice(half);

  const LevelRow = ({ row }) => {
    const rate = row.total > 0 ? Math.round((row.en_stage / row.total) * 100) : 0;
    return (
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '7px' }}>
          <div>
            <div style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-main)' }}>{row.niveau_academique}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {row.total} {t('pages.chefAnalytics.enrolled')} · {row.en_stage} {t('pages.chefAnalytics.inStage')}
            </div>
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--primary)', flexShrink: 0, marginLeft: '8px' }}>{rate}%</span>
        </div>
        <div style={{ height: 7, backgroundColor: 'var(--surface-section)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{
            width: `${rate}%`, height: '100%',
            background: rate >= 50
              ? 'linear-gradient(90deg, var(--success), #34D399)'
              : rate >= 25
              ? 'linear-gradient(90deg, var(--primary), var(--accent))'
              : 'linear-gradient(90deg, var(--warning), #FCD34D)',
            borderRadius: 10,
            transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
          }} />
        </div>
      </div>
    );
  };

  return (
    <div className="glass-panel" style={{ padding: '20px 28px', marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ margin: '0 0 3px', fontWeight: '700', color: 'var(--text-main)' }}>
            {t('pages.chefAnalytics.levelTitle')}
          </h3>
          <p style={{ margin: 0, fontSize: '0.8rem' }}>{t('pages.chefAnalytics.levelSubtitle')}</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          {[
            { color: 'linear-gradient(90deg, var(--success), #34D399)',         label: '≥ 50%'  },
            { color: 'linear-gradient(90deg, var(--primary), var(--accent))',   label: '25–50%' },
            { color: 'linear-gradient(90deg, var(--warning), #FCD34D)',         label: '< 25%'  },
          ].map(l => (
            <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '500' }}>
              <span style={{ width: 22, height: 6, borderRadius: 3, background: l.color, display: 'inline-block', flexShrink: 0 }} />
              {l.label}
            </span>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 3rem' }}>
        <div>{col1.map((row, i) => <LevelRow key={i} row={row} />)}</div>
        <div>{col2.map((row, i) => <LevelRow key={i} row={row} />)}</div>
      </div>
    </div>
  );
};

const Analytics = () => {
  const { t } = useTranslation();
  const { data: stats, isLoading, isError, error } = useQuery({
    queryKey: ['chef-analytics'],
    queryFn: async () => {
      const result = await api.safeRequest(api.get('analytics/chef/'));
      if (result.ok) return result.value.data;
      throw result.error;
    },
  });

  if (isLoading) return <SkeletonLoader variant="dashboard" />;
  if (isError) return (
    <div style={{ padding: '5rem', textAlign: 'center' }}>
      <div style={{ color: 'var(--error)', fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.75rem' }}>
        {t('pages.chefAnalytics.errorLoading')}
      </div>
      <div style={{ color: 'var(--text-muted)' }}>{error?.message || t('pages.chefAnalytics.errorUnknown')}</div>
    </div>
  );

  const {
    overview = {},
    by_level = [],
    candidature_stats = [],
    recent_placements = [],
  } = stats ?? {};

  const AVATAR_PALETTE = [
    { bg: 'rgba(20,184,166,0.12)',  fg: '#0D9488' },
    { bg: 'rgba(249,115,22,0.12)',  fg: '#EA580C' },
    { bg: 'rgba(37,99,235,0.12)',   fg: '#2563EB' },
    { bg: 'rgba(139,92,246,0.12)',  fg: '#7C3AED' },
    { bg: 'rgba(236,72,153,0.12)',  fg: '#DB2777' },
    { bg: 'rgba(245,158,11,0.12)',  fg: '#D97706' },
  ];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto' }}>

      <PageHeader
        eyebrow={t('pages.chefAnalytics.eyebrow')}
        title={t('pages.chefAnalytics.title')}
        subtitle={t('pages.chefAnalytics.subtitle')}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '9999px', background: 'var(--primary-light)', border: '1px solid rgba(37,99,235,0.2)' }}>
            <Clock size={12} color="var(--primary)" />
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--primary)' }}>
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {t('pages.chefAnalytics.live')}
            </span>
          </div>
        }
      />

      <div className="grid-stats-4" style={{ marginBottom: '1.5rem' }}>
        <StatCard
          icon={Users}
          label={t('pages.chefAnalytics.statTotalStudents')}
          value={overview.total_students ?? '—'}
          trend={t('pages.chefAnalytics.statActiveCount', { count: overview.active_internships ?? 0 })}
          iconBg="rgba(20,184,166,0.12)" iconColor="#0D9488"
          to="/espace/chef/stagiaires"
        />
        <StatCard
          icon={Briefcase}
          label={t('pages.chefAnalytics.statActiveInternships')}
          value={overview.active_internships ?? '—'}
          trend={t('pages.chefAnalytics.statPlacementRate', { rate: Math.round(overview.placement_rate ?? 0) })}
          iconBg="rgba(249,115,22,0.12)" iconColor="#EA580C"
          to="/espace/chef/stagiaires"
        />
        <StatCard
          icon={Award}
          label={t('pages.chefAnalytics.statCompletedInternships')}
          value={overview.completed_internships ?? '—'}
          trend={t('pages.chefAnalytics.statTotalValidated')}
          iconBg="rgba(37,99,235,0.12)" iconColor="#2563EB"
          to="/espace/chef/stagiaires"
        />
        <StatCard
          icon={CheckCircle}
          label={t('pages.chefAnalytics.statAvgDept')}
          value={overview.average_performance ?? '—'}
          subtext="/ 20"
          iconBg="rgba(139,92,246,0.12)" iconColor="#7C3AED"
          to="/espace/chef/evaluations"
        />
      </div>

      <div className="grid-page-2col" style={{ gap: '1.5rem', alignItems: 'stretch' }}>

        <div className="glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>
              {t('pages.chefAnalytics.recentPlacements')}
            </h3>
            <button className="secondary" onClick={() => window.location.href = '/espace/chef/stagiaires'} style={{ fontSize: '0.75rem', padding: '5px 12px' }}>
              {t('pages.chefAnalytics.viewAll')} <ChevronRight size={12} style={{ marginLeft: 2 }} />
            </button>
          </div>

          {recent_placements.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>{t('pages.chefAnalytics.colStudent')}</th>
                  <th>{t('pages.chefAnalytics.colCompany')}</th>
                  <th>{t('pages.chefAnalytics.colStatus')}</th>
                  <th>{t('pages.chefAnalytics.colDate')}</th>
                </tr>
              </thead>
              <tbody>
                {recent_placements.map((p, idx) => {
                  const ac = AVATAR_PALETTE[idx % AVATAR_PALETTE.length];
                  const initLetter = (p.student || '').trim()[0] || '?';
                  return (
                    <tr key={idx}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: ac.bg, color: ac.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '700', flexShrink: 0 }}>
                            {initLetter.toUpperCase()}
                          </div>
                          <span style={{ fontWeight: '500', color: 'var(--text-main)', fontSize: '0.875rem' }}>{p.student || '—'}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{p.company || '—'}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.6875rem', padding: '3px 10px', borderRadius: '9999px', background: 'var(--success-light)', color: 'var(--success)', fontWeight: '600', border: '1px solid rgba(16,185,129,0.2)' }}>
                          <CheckCircle size={11} /> {t(`pages.candidatures.status.${p.status}`, { defaultValue: (p.status || '').replace(/_/g, ' ') })}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {p.date ? new Date(p.date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', padding: '3rem' }}>
              {t('pages.chefAnalytics.noRecentPlacements')}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minHeight: 0 }}>
          <CandidatureDonut candidature_stats={candidature_stats} />
          <div className="glass-panel" style={{ padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <QuickActions />
          </div>
        </div>
      </div>

      <LevelPerformance data={by_level} />
    </div>
  );
};

export default Analytics;
