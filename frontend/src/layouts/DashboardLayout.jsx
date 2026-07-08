import { Outlet, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Briefcase,
  FileText,
  Settings,
  LogOut,
  User as UserIcon,
  ClipboardCheck,
  GraduationCap,
  Search,
  Menu,
  Calendar,
  Activity,
  UserPlus,
  Users,
  Heart,
  UserCheck,
  Clock,
  ShieldCheck,
  Lock,
  HelpCircle,
  Sun,
  Moon,
  ScrollText,
  Archive,
} from 'lucide-react';

import useAuthStore from '../store/authStore';
import useLayoutStore from '../store/layoutStore';
import NotificationBar from '../components/NotificationBar';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { logoutUser } from '../services/authService';
import useIdleTimer from '../hooks/useIdleTimer';
import './DashboardLayout.css';

// Déconnexion automatique après 30 minutes sans la moindre interaction.
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
};

const pageTransition = {
  duration: 0.22,
  ease: [0.4, 0, 0.2, 1],
};

const NavLink = ({ to, icon: Icon, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link to={to} className={`nav-link ${isActive ? 'active' : ''}`}>
      {Icon && <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />}
      <span>{children}</span>
    </Link>
  );
};

const BottomNav = ({ user, location, t }) => {
  const navItems =
    user?.role === 'Étudiant' ? [
      { to: '/espace/offres',       icon: Search,   label: t('nav.bottom.offers') },
      { to: '/espace/candidatures', icon: FileText, label: t('nav.bottom.applications') },
      { to: '/espace/mon-stage',    icon: Briefcase,label: t('nav.bottom.internship') },
      { to: '/espace/absences',     icon: Clock,    label: t('nav.bottom.absences') },
      { to: '/espace/profil',       icon: UserIcon, label: t('nav.bottom.profile') },
    ] : user?.role === 'Entreprise' ? [
      { to: '/espace/entreprise/offres',         icon: Briefcase, label: t('nav.bottom.offers') },
      { to: '/espace/entreprise/candidatures',   icon: Users,     label: t('nav.bottom.applications') },
      { to: '/espace/entreprise/mes-stagiaires', icon: UserCheck, label: t('nav.bottom.interns') },
      { to: '/espace/entreprise/profil',         icon: UserIcon,  label: t('nav.bottom.profile') },
    ] : user?.role === 'Chef_Departement' ? [
      { to: '/espace/chef/analytics',   icon: Activity, label: t('nav.bottom.overview') },
      { to: '/espace/chef/conventions', icon: FileText, label: t('nav.bottom.contracts') },
      { to: '/espace/chef/stagiaires',  icon: Users,    label: t('nav.bottom.interns') },
      { to: '/espace/profil',           icon: UserIcon, label: t('nav.bottom.profile') },
    ] : [
      { to: '/espace/admin/analytics',    icon: Activity, label: t('nav.bottom.overview') },
      { to: '/espace/admin/utilisateurs', icon: Users,    label: t('nav.bottom.users') },
      { to: '/espace/admin/offres',       icon: Briefcase,label: t('nav.bottom.offers') },
      { to: '/espace/profil',             icon: UserIcon, label: t('nav.bottom.profile') },
    ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive = location.pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`bottom-nav-item${isActive ? ' active' : ''}`}
          >
            <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

const DashboardLayout = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { isDarkMode, isSidebarOpen, toggleDarkMode, toggleSidebar } = useLayoutStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const handleLogout = async (reason) => {
    await logoutUser({ reason });
    navigate('/login', { replace: true, state: reason ? { reason } : undefined });
  };

  // Le hook doit être appelé à chaque rendu (règle des Hooks React) : il est
  // donc placé avant le "return" anticipé ci-dessous, mais désactivé via
  // `enabled` tant qu'aucun utilisateur n'est connecté.
  useIdleTimer({
    timeout: INACTIVITY_TIMEOUT_MS,
    enabled: isAuthenticated,
    onIdle: () => handleLogout('idle'),
  });

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const displayName = user?.profil_etudiant
    ? `${user.profil_etudiant.prenom} ${user.profil_etudiant.nom}`.trim()
    : user?.profil_entreprise
    ? user.profil_entreprise.nom
    : user?.profil_chef
    ? `${user.profil_chef.prenom} ${user.profil_chef.nom}`.trim()
    : user?.courriel || t('nav.roles.student');

  const avatarLetter = (
    user?.profil_etudiant?.prenom?.[0] ||
    user?.profil_entreprise?.nom?.[0] ||
    user?.profil_chef?.prenom?.[0] ||
    user?.courriel?.[0] ||
    'U'
  ).toUpperCase();

  const roleLabel =
    user?.role === 'Étudiant'         ? t('nav.roles.student')  :
    user?.role === 'Entreprise'        ? t('nav.roles.company')  :
    user?.role === 'Chef_Departement'  ? t('nav.roles.chef')     :
    user?.role === 'Admin'             ? t('nav.roles.admin')    :
    user?.role?.replace('_', ' ') || '';

  const sidebarTransform = isSidebarOpen
    ? 'translateX(0)'
    : isRTL ? 'translateX(100%)' : 'translateX(-100%)';

  return (
    <div className="dashboard-container">
      {/* ── Sidebar ── */}
      <aside className="sidebar" style={{ transform: sidebarTransform }}>
        <div className="sidebar-logo">
          <div className="logo-icon">
            <GraduationCap color="#FFFFFF" size={17} />
          </div>
          <div className="logo-text-group">
            <h2 className="logo-text">{t('brand.name')}</h2>
            <div className="logo-subtext">{t('brand.tagline')}</div>
          </div>
        </div>

        <nav className="nav-container">
          {user?.role === 'Étudiant' && (
            <>
              <p className="nav-section-label">{t('nav.sections.main')}</p>
              <NavLink to="/espace/profil"         icon={UserIcon}      >{t('nav.items.profile')}</NavLink>
              <NavLink to="/espace/offres"          icon={Search}        >{t('nav.items.offers')}</NavLink>
              <NavLink to="/espace/candidatures"    icon={FileText}      >{t('nav.items.candidatures')}</NavLink>
              <NavLink to="/espace/mon-stage"       icon={Briefcase}     >{t('nav.items.internship')}</NavLink>
              <NavLink to="/espace/absences"        icon={Clock}         >{t('nav.items.absences')}</NavLink>
              <NavLink to="/espace/favoris"         icon={Heart}         >{t('nav.items.favorites')}</NavLink>
              <NavLink to="/espace/evaluations"     icon={ClipboardCheck}>{t('nav.items.evaluations')}</NavLink>
              <div className="nav-section-divider">
                <p className="nav-section-label">{t('nav.sections.account')}</p>
                <NavLink to="/espace/settings"      icon={Lock}          >{t('nav.items.security')}</NavLink>
                <NavLink to="/espace/help"          icon={HelpCircle}    >{t('nav.items.help')}</NavLink>
                <div onClick={() => handleLogout()} style={{ cursor: 'pointer' }}>
                  <NavLink to="#" icon={LogOut}>{t('nav.items.logout')}</NavLink>
                </div>
              </div>
            </>
          )}

          {user?.role === 'Entreprise' && (
            <>
              <p className="nav-section-label">{t('nav.sections.management')}</p>
              <NavLink to="/espace/entreprise/profil"        icon={UserIcon}      >{t('nav.items.profile')}</NavLink>
              <NavLink to="/espace/entreprise/offres"        icon={Briefcase}     >{t('nav.items.offerManagement')}</NavLink>
              <NavLink to="/espace/entreprise/candidatures"  icon={Users}         >{t('nav.items.candidatureManagement')}</NavLink>
              <NavLink to="/espace/entreprise/mes-stagiaires"icon={UserCheck}     >{t('nav.items.interns')}</NavLink>
              <NavLink to="/espace/entreprise/absences"      icon={Clock}         >{t('nav.items.absences')}</NavLink>
              <NavLink to="/espace/entreprise/conventions"   icon={FileText}      >{t('nav.items.conventions')}</NavLink>
              <NavLink to="/espace/entreprise/evaluations"   icon={ShieldCheck}   >{t('nav.items.companyEvaluations')}</NavLink>
              <div className="nav-section-divider">
                <p className="nav-section-label">{t('nav.sections.account')}</p>
                <NavLink to="/espace/entreprise/password" icon={Lock}>{t('nav.items.password')}</NavLink>
                <div onClick={() => handleLogout()} style={{ cursor: 'pointer' }}>
                  <NavLink to="#" icon={LogOut}>{t('nav.items.logout')}</NavLink>
                </div>
              </div>
            </>
          )}

          {user?.role === 'Chef_Departement' && (
            <>
              <p className="nav-section-label">{t('nav.sections.supervision')}</p>
              <NavLink to="/espace/chef/analytics"   icon={Activity}     >{t('nav.items.overview')}</NavLink>
              <NavLink to="/espace/chef/conventions" icon={FileText}     >{t('nav.items.conventionValidation')}</NavLink>
              <NavLink to="/espace/chef/stagiaires"  icon={Users}        >{t('nav.items.internDirectory')}</NavLink>
              <NavLink to="/espace/chef/rapports"    icon={ClipboardCheck}>{t('nav.items.reports')}</NavLink>
              <NavLink to="/espace/chef/absences"    icon={Calendar}     >{t('nav.items.absences')}</NavLink>
              <div className="nav-section-divider">
                <p className="nav-section-label">{t('nav.sections.account')}</p>
                <NavLink to="/espace/chef/guide" icon={HelpCircle}>{t('nav.items.adminGuide')}</NavLink>
                <NavLink to="/espace/profil"     icon={Settings}  >{t('nav.items.profile')}</NavLink>
                <div onClick={() => handleLogout()} style={{ cursor: 'pointer' }}>
                  <NavLink to="#" icon={LogOut}>{t('nav.items.logout')}</NavLink>
                </div>
              </div>
            </>
          )}

          {user?.role === 'Admin' && (
            <>
              <p className="nav-section-label">{t('nav.sections.administration')}</p>
              <NavLink to="/espace/admin/analytics"    icon={Activity}      >{t('nav.items.overview')}</NavLink>
              <NavLink to="/espace/admin/chefs"        icon={UserPlus}      >{t('nav.items.chefManagement')}</NavLink>
              <NavLink to="/espace/admin/utilisateurs" icon={Users}         >{t('nav.items.userManagement')}</NavLink>
              <NavLink to="/espace/admin/offres"       icon={Briefcase}     >{t('nav.items.offerModeration')}</NavLink>
              <NavLink to="/espace/admin/archives"     icon={Archive}       >{t('nav.items.archives')}</NavLink>
              <NavLink to="/espace/admin/evaluations"  icon={ClipboardCheck}>{t('nav.items.auditEvaluations')}</NavLink>
              <NavLink to="/espace/admin/logs"         icon={ScrollText}    >{t('nav.items.activityLog')}</NavLink>
              <div className="nav-section-divider">
                <p className="nav-section-label">{t('nav.sections.account')}</p>
                <NavLink to="/espace/profil" icon={Settings}>{t('nav.items.settings')}</NavLink>
                <div onClick={() => handleLogout()} style={{ cursor: 'pointer' }}>
                  <NavLink to="#" icon={LogOut}>{t('nav.items.logout')}</NavLink>
                </div>
              </div>
            </>
          )}
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{avatarLetter}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{displayName}</div>
            <div className="sidebar-user-role">{user?.courriel || roleLabel}</div>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className={`main-content${isSidebarOpen ? ' sidebar-open' : ''}`}>
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              onClick={toggleSidebar}
              className="icon-button"
              aria-label={t('topbar.toggleSidebar')}
            >
              <Menu size={20} />
            </button>
          </div>

          <div className="topbar-actions">
            <LanguageSwitcher />

            <button
              onClick={toggleDarkMode}
              className="icon-button"
              title={t('topbar.toggleDarkMode')}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <NotificationBar />

            <button
              onClick={() => handleLogout()}
              className="icon-button logout-button"
              title={t('topbar.logout')}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={location.pathname}
            className="page-main"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>

      <BottomNav user={user} location={location} t={t} />
    </div>
  );
};

export default DashboardLayout;
