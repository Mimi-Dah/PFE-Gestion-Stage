import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ClipboardCheck, Briefcase, Clock, CheckCircle2,
  UserPlus, Calendar, AlertCircle, Zap, ShieldCheck,
  ChevronRight, Heart, ArrowRight, CheckCircle,
  Activity,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import PageHeader from '../components/PageHeader';

const AVATAR_PALETTE = [
  { bg: 'rgba(20,184,166,0.12)',  fg: '#0D9488' },
  { bg: 'rgba(249,115,22,0.12)',  fg: '#EA580C' },
  { bg: 'rgba(37,99,235,0.12)',   fg: '#2563EB' },
  { bg: 'rgba(139,92,246,0.12)',  fg: '#7C3AED' },
  { bg: 'rgba(236,72,153,0.12)',  fg: '#DB2777' },
  { bg: 'rgba(245,158,11,0.12)',  fg: '#D97706' },
];

const StatCard = ({ label, value, trend, icon: Icon, iconBg, iconColor, link, onClick }) => (
  <div
    className="glass-panel"
    onClick={onClick}
    style={{ padding: '22px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', cursor: link ? 'pointer' : 'default' }}
  >
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ margin: '0 0 8px', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {label}
      </p>
      <div style={{ fontSize: '2.125rem', fontWeight: '700', color: 'var(--text-main)', lineHeight: 1, marginBottom: '10px' }}>
        {value}
      </div>
      {trend && <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--success)', fontWeight: '600' }}>{trend}</p>}
    </div>
    <div style={{ width: 52, height: 52, borderRadius: 14, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor, flexShrink: 0 }}>
      <Icon size={24} />
    </div>
  </div>
);

const StatusBadge = ({ statut }) => {
  const s = statut?.replace(/_/g, ' ') || 'En attente';
  const isOk = ['Acceptée', 'Validée', 'Placé'].some(v => statut?.includes(v));
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.6875rem', padding: '3px 10px', borderRadius: '9999px', fontWeight: '600', border: '1px solid', background: isOk ? 'var(--success-light)' : 'rgba(245,158,11,.1)', color: isOk ? 'var(--success)' : '#D97706', borderColor: isOk ? 'rgba(16,185,129,.2)' : 'rgba(245,158,11,.2)' }}>
      {isOk ? <CheckCircle size={11} /> : <Clock size={11} />} {s}
    </span>
  );
};

const NextStepsPanel = ({ steps, navigate, progressPct, t }) => (
  <div className="glass-panel" style={{ overflow: 'hidden' }}>
    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ShieldCheck size={16} color="var(--primary)" /> {t('pages.dashboard.nextSteps')}
      </h3>
      <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary)' }}>{progressPct}%</span>
    </div>
    <div style={{ padding: '8px 0' }}>
      {steps.map((task, i) => (
        <div
          key={i}
          onClick={() => task.link !== '#' && navigate(task.link)}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 20px', cursor: task.link !== '#' ? 'pointer' : 'default', transition: 'background .15s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover, #f8f9fa)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: task.done ? 'var(--success)' : 'var(--text-muted)' }}>
            {task.done ? <CheckCircle2 size={18} /> : <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid var(--surface-border)' }} />}
          </div>
          <span style={{ flex: 1, fontSize: '0.875rem', color: task.done ? 'var(--text-muted)' : 'var(--text-main)', textDecoration: task.done ? 'line-through' : 'none', fontWeight: task.done ? '400' : '500' }}>
            {task.label}
          </span>
          <ChevronRight size={14} color="var(--text-muted)" />
        </div>
      ))}
    </div>
    <div style={{ padding: '12px 20px', borderTop: '1px solid var(--surface-border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
        <span>{t('pages.dashboard.progress')}</span><span>{progressPct}%</span>
      </div>
      <div style={{ height: 5, background: 'var(--surface-section)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg, var(--primary), #60a5fa)', borderRadius: 10, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const role = user?.role || 'Étudiant';

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['dashboard-stats', role],
    queryFn: async () => {
      let endpoint = 'candidatures/';
      if (role === 'Entreprise') endpoint = 'offres/mes-offres/';
      if (role === 'Chef_Departement') endpoint = 'conventions/';
      if (role === 'Admin') endpoint = 'admin/chefs/';
      const response = await api.get(endpoint);
      return response.data;
    }
  });

  const displayName = useMemo(() => {
    if (user?.profil_entreprise?.nom) return user.profil_entreprise.nom;
    if (user?.profil_etudiant?.prenom) return user.profil_etudiant.prenom;
    return user?.courriel?.split('@')[0] ?? 'vous';
  }, [user]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return t('pages.dashboard.greetingMorning');
    if (h < 18) return t('pages.dashboard.greetingAfternoon');
    return t('pages.dashboard.greetingEvening');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  const results = Array.isArray(statsData) ? statsData : (statsData?.results || []);

  const getConfig = () => {
    switch (role) {
      case 'Entreprise': return {
        eyebrow: 'Espace entreprise',
        subtitle: "Voici l'état de vos offres et de votre pipeline de talents.",
        stats: [
          { label: 'Mes Offres', value: isLoading ? '—' : results.length, trend: 'Offres publiées', icon: Briefcase, iconBg: 'rgba(37,99,235,0.12)', iconColor: '#2563EB', link: '/espace/entreprise/offres' },
          { label: 'Candidatures', value: isLoading ? '—' : results.reduce((a, c) => a + (c.candidatures_count || 0), 0), trend: 'Total reçues', icon: ClipboardCheck, iconBg: 'rgba(20,184,166,0.12)', iconColor: '#0D9488', link: '/espace/entreprise/candidatures' },
          { label: 'À réviser', value: isLoading ? '—' : results.reduce((a, c) => a + (c.pending_count || 0), 0), trend: 'En attente de traitement', icon: Clock, iconBg: 'rgba(245,158,11,0.12)', iconColor: '#D97706', link: '/espace/entreprise/candidatures' },
        ],
        tableTitle: 'Activité Récente',
        tableHead: ['Offre', 'Candidatures', 'Statut'],
        tableRows: results.slice(0, 6).map((r, i) => ({
          avatar: (r.titre || '?')[0].toUpperCase(),
          col1: r.titre || `Offre #${r.id}`,
          col2: r.candidatures_count ?? 0,
          statut: r.statut || 'Active',
          palette: AVATAR_PALETTE[i % AVATAR_PALETTE.length],
        })),
        nextSteps: [
          { label: 'Publier une nouvelle offre', done: results.length > 0, link: '/espace/entreprise/creer-offre' },
          { label: 'Réviser les candidatures', done: results.every(o => (o.pending_count || 0) === 0), link: '/espace/entreprise/candidatures' },
          { label: 'Vérifier le profil entreprise', done: !!user?.profil_entreprise?.logo, link: '/espace/entreprise/profil' },
        ],
      };
      case 'Chef_Departement': return {
        eyebrow: 'Chef de département',
        subtitle: "Voici l'état de votre département et des conventions en attente.",
        stats: [
          { label: 'Conventions', value: isLoading ? '—' : results.length, trend: 'Conventions totales', icon: ClipboardCheck, iconBg: 'rgba(37,99,235,0.12)', iconColor: '#2563EB', link: '/espace/chef/conventions' },
          { label: 'En attente', value: isLoading ? '—' : results.filter(c => c.statut === 'En_attente_validation').length, trend: 'À valider', icon: Clock, iconBg: 'rgba(245,158,11,0.12)', iconColor: '#D97706', link: '/espace/chef/conventions' },
          { label: 'Stages actifs', value: isLoading ? '—' : results.filter(c => c.statut === 'Validée').length, trend: 'Conventions validées', icon: CheckCircle2, iconBg: 'rgba(20,184,166,0.12)', iconColor: '#0D9488', link: '/espace/chef/conventions' },
        ],
        tableTitle: 'Événements Académiques',
        tableHead: ['Convention', 'Candidature', 'Statut'],
        tableRows: results.slice(0, 6).map((r, i) => ({
          avatar: (r.numero_convention || String(r.id || '?'))[0].toUpperCase(),
          col1: r.numero_convention || `Convention #${r.id}`,
          col2: `Candidature #${r.candidature}`,
          statut: r.statut || 'En attente',
          palette: AVATAR_PALETTE[i % AVATAR_PALETTE.length],
        })),
        nextSteps: [
          { label: 'Valider les conventions', done: results.filter(c => c.statut === 'En_attente_validation').length === 0, link: '/espace/chef/conventions' },
          { label: 'Réviser les rapports', done: false, link: '/espace/chef/rapports' },
          { label: 'Consulter les statistiques', done: true, link: '/espace/chef/analytics' },
        ],
      };
      case 'Admin': return {
        eyebrow: 'Administration',
        subtitle: 'Supervision globale des utilisateurs et des offres.',
        stats: [
          { label: 'Chefs Dépt.', value: isLoading ? '—' : results.length, trend: 'Responsables actifs', icon: UserPlus, iconBg: 'rgba(37,99,235,0.12)', iconColor: '#2563EB', link: '/espace/admin/chefs' },
          { label: 'Modération', value: '0', trend: 'Offres en attente', icon: Clock, iconBg: 'rgba(245,158,11,0.12)', iconColor: '#D97706', link: '/espace/admin/offres' },
          { label: 'Utilisateurs', value: '128', trend: 'Utilisateurs enregistrés', icon: CheckCircle2, iconBg: 'rgba(20,184,166,0.12)', iconColor: '#0D9488', link: '/espace/admin/utilisateurs' },
        ],
        tableTitle: 'Opérations Système',
        tableHead: ['Chef', 'Département', 'Statut'],
        tableRows: results.slice(0, 6).map((r, i) => ({
          avatar: (r.nom || r.courriel || '?')[0].toUpperCase(),
          col1: r.nom || r.courriel || `Chef #${r.id}`,
          col2: r.departement || '—',
          statut: 'Actif',
          palette: AVATAR_PALETTE[i % AVATAR_PALETTE.length],
        })),
        nextSteps: [
          { label: 'Gérer les chefs de dépt.', done: results.length > 0, link: '/espace/admin/chefs' },
          { label: 'Modérer les offres', done: true, link: '/espace/admin/offres' },
          { label: 'Configuration globale', done: false, link: '/espace/profil' },
        ],
      };
      default: { // Étudiant
        const hasCV = !!user?.profil_etudiant?.cv;
        const hasApplied = results.length > 0;
        const profileComplete = !!user?.profil_etudiant?.telephone;
        return {
          eyebrow: 'Espace étudiant',
          subtitle: 'Suivez vos candidatures et trouvez votre prochaine opportunité.',
          stats: [
            { label: 'Candidatures', value: isLoading ? '—' : results.length, trend: 'Candidatures envoyées', icon: ClipboardCheck, iconBg: 'rgba(37,99,235,0.12)', iconColor: '#2563EB', link: '/espace/candidatures' },
            { label: 'Favoris', value: isLoading ? '—' : (user?.favoris_count || '0'), trend: 'Offres sauvegardées', icon: Heart, iconBg: 'rgba(236,72,153,0.12)', iconColor: '#DB2777', link: '/espace/favoris' },
            { label: 'Profil', value: hasCV ? '100%' : '50%', trend: hasCV ? 'Profil complet' : 'Ajoutez votre CV', icon: Zap, iconBg: 'rgba(139,92,246,0.12)', iconColor: '#7C3AED', link: '/espace/profil' },
          ],
          tableTitle: 'Activité de Candidature',
          tableHead: ['Offre', 'Entreprise', 'Statut'],
          tableRows: results.slice(0, 6).map((r, i) => ({
            avatar: (r.offre_titre || r.titre || '?')[0].toUpperCase(),
            col1: r.offre_titre || r.titre || `Offre #${r.id}`,
            col2: r.entreprise_nom || '—',
            statut: r.statut || 'En attente',
            palette: AVATAR_PALETTE[i % AVATAR_PALETTE.length],
          })),
          nextSteps: [
            { label: 'Téléverser votre CV (PDF)', done: hasCV, link: '/espace/profil' },
            { label: 'Postuler à des offres', done: hasApplied, link: '/espace/offres' },
            { label: 'Compléter votre profil', done: profileComplete, link: '/espace/profil' },
          ],
        };
      }
    }
  };

  const config = getConfig();
  const doneCount = config.nextSteps?.filter(s => s.done).length ?? 0;
  const progressPct = Math.round((doneCount / (config.nextSteps?.length ?? 1)) * 100);

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto' }}>

      <PageHeader
        eyebrow={config.eyebrow}
        title={<>{greeting}, <span style={{ color: 'var(--primary)' }}>{displayName}</span></>}
        subtitle={config.subtitle}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '9999px', background: 'var(--primary-light)', border: '1px solid rgba(37,99,235,0.2)' }}>
            <Calendar size={12} color="var(--primary)" />
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--primary)' }}>{today}</span>
          </div>
        }
      />

      <div className="grid-stats-3" style={{ marginBottom: '1.5rem' }}>
        {config.stats.map((stat, i) => (
          <StatCard
            key={i}
            {...stat}
            onClick={stat.link ? () => navigate(stat.link) : undefined}
          />
        ))}
      </div>

      <div className="grid-page-2col" style={{ gap: '1.5rem', alignItems: 'stretch' }}>

        <div className="glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={15} color="var(--primary)" /> {config.tableTitle}
            </h3>
            <button className="secondary" onClick={() => navigate(config.stats[0]?.link || '/espace')} style={{ fontSize: '0.75rem', padding: '5px 12px' }}>
              Voir tout <ChevronRight size={12} style={{ marginLeft: 2 }} />
            </button>
          </div>

          {config.tableRows.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '3rem', color: 'var(--text-muted)' }}>
              <AlertCircle size={32} color="var(--text-muted)" style={{ opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>Aucun enregistrement récent à afficher.</p>
              <button className="secondary" onClick={() => navigate('/espace/offres')} style={{ fontSize: '0.8rem' }}>
                Explorer internHub <ArrowRight size={13} />
              </button>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  {config.tableHead.map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {config.tableRows.map((row, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: row.palette.bg, color: row.palette.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '700', flexShrink: 0 }}>
                          {row.avatar}
                        </div>
                        <span style={{ fontWeight: '500', color: 'var(--text-main)', fontSize: '0.875rem' }}>{row.col1}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{row.col2}</td>
                    <td><StatusBadge statut={row.statut} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <NextStepsPanel steps={config.nextSteps} navigate={navigate} progressPct={progressPct} />

          <div className="glass-panel" style={{ padding: '18px 20px', background: 'linear-gradient(135deg, var(--primary-light) 0%, rgba(99,102,241,0.08) 100%)', border: '1px solid rgba(37,99,235,0.15)' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Zap size={17} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>Conseil du jour</div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Un CV à jour augmente vos chances de réponse de 60%. Pensez à vérifier vos documents !
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
