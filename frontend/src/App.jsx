import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, Briefcase } from 'lucide-react';
import ErrorBoundary from './components/common/ErrorBoundary';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyAccount from './pages/VerifyAccount';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Offers from './pages/Offers';
import OfferDetail from './pages/OfferDetail';
import Candidatures from './pages/Candidatures';
import MyInternship from './pages/MyInternship';
import Profile from './pages/Profile';
import Evaluations from './pages/Evaluations';
import Absences from './pages/Absences';
import Favoris from './pages/Favoris';

// Entreprise Pages
import ProfileEntreprise from './pages/entreprise/ProfileEntreprise';
import MesOffres from './pages/entreprise/MesOffres';
import CreerOffre from './pages/entreprise/CreerOffre';
import CandidaturesOffre from './pages/entreprise/CandidaturesOffre';
import EntrepriseConventions from './pages/entreprise/Conventions';
import EntrepriseEvaluations from './pages/entreprise/Evaluations';
import MesStagiaires from './pages/entreprise/MesStagiaires';
import EntrepriseAbsences from './pages/entreprise/Absences';
import EditOffre, { EditOffreForm } from './pages/entreprise/EditOffre';
import GestionCandidatures from './pages/entreprise/GestionCandidatures';

// Chef de Département Pages
import ConventionsValidation from './pages/chef/ConventionsValidation';
import ChefRapports from './pages/chef/Rapports';
import Analytics from './pages/chef/Analytics';
import AbsencesChef from './pages/chef/AbsencesChef';
import StagiairesChef from './pages/chef/StagiairesChef';
import GuideAdmin from './pages/chef/GuideAdmin';

// Admin Pages
import ChefManagement from './pages/admin/ChefManagement';
import UserManagement from './pages/admin/UserManagement';
import OfferModeration from './pages/admin/OfferModeration';
import AdminArchives from './pages/admin/Archives';
import AdminAnalytics from './pages/admin/Analytics';
import AdminEvaluations from './pages/admin/Evaluations';
import AdminLogs from './pages/admin/Logs';

// Shared Pages
import Settings from './pages/Settings';
import Help from './pages/Help';
import Notifications from './pages/Notifications';

// Error Handling
import ErrorToast from './components/common/ErrorToast';
import { errorBus } from './utils/errorBus';

import useLayoutStore from './store/layoutStore';
import LandingPage from './pages/LandingPage';

/* ═══════════════════════════════════════════════════════════════
   POPUP OVERLAY WRAPPER — shared between offer detail and edit
═══════════════════════════════════════════════════════════════ */
const PopupOverlay = ({ onClose, header, children, maxWidth = '560px' }) => (
  <div
    style={{
      position: 'fixed', inset: 0,
      backgroundColor: 'rgba(0,0,0,0.45)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1100, padding: '1.5rem',
    }}
    onClick={e => { if (e.target === e.currentTarget) onClose(); }}
  >
    <div style={{
      backgroundColor: 'var(--surface-card)',
      borderRadius: '10px',
      width: '100%',
      maxWidth,
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
    }}>
      {/* Modal header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid var(--surface-border)',
        position: 'sticky', top: 0, backgroundColor: 'var(--surface-card)', zIndex: 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Briefcase size={18} />
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-main)' }}>{header.title}</div>
            {header.subtitle && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '500' }}>{header.subtitle}</div>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid var(--surface-border)', backgroundColor: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <X size={15} />
        </button>
      </div>
      {/* Modal body */}
      {children}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   POPUP ROUTE COMPONENTS
═══════════════════════════════════════════════════════════════ */

/* Offer detail popup — reuses the existing modal mode of OfferDetail */
const OfferDetailPopup = () => {
  const navigate = useNavigate();
  return <OfferDetail onClose={() => navigate(-1)} />;
};

/* Edit offer popup */
const EditOffrePopup = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const handleClose = () => navigate(-1);
  return (
    <PopupOverlay
      onClose={handleClose}
      maxWidth="700px"
      header={{ title: t('pages.entreprise.editOffre.pageTitle'), subtitle: t('pages.entreprise.editOffre.pageSubtitle') }}
    >
      <div style={{ padding: '1.5rem' }}>
        <EditOffreForm id={id} isPopup onClose={handleClose} />
      </div>
    </PopupOverlay>
  );
};

/* ── Auto-redirect handlers for direct URL access ─────────────
   When someone navigates directly to a popup URL without
   background context, redirect to add the background location
   so the list page shows behind the popup.
──────────────────────────────────────────────────────────────*/
const OfferDetailRouteHandler = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  useEffect(() => {
    navigate(`/espace/offres/${id}`, {
      replace: true,
      state: { backgroundLocation: { pathname: '/espace/offres', search: '', hash: '' } },
    });
  }, []);
  return null;
};

const EditOffreRouteHandler = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  useEffect(() => {
    navigate(`/espace/entreprise/offres/${id}/edit`, {
      replace: true,
      state: { backgroundLocation: { pathname: '/espace/entreprise/offres', search: '', hash: '' } },
    });
  }, []);
  return null;
};

/* ═══════════════════════════════════════════════════════════════
   APP
═══════════════════════════════════════════════════════════════ */
function App() {
  const [globalError, setGlobalError] = useState(null);
  const isDarkMode = useLayoutStore((state) => state.isDarkMode);
  const language   = useLayoutStore((state) => state.language);
  const location = useLocation();
  const backgroundLocation = location.state?.backgroundLocation;
  const { i18n } = useTranslation();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const lang = language || 'fr';
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    if (i18n.language !== lang) i18n.changeLanguage(lang);
  }, [language]);

  useEffect(() => {
    const unsubscribe = errorBus.subscribe((error) => {
      setGlobalError(error);
    });
    return unsubscribe;
  }, []);

  return (
    <>
      <ErrorBoundary>
        {/* ── Background / regular routes ─────────────────────── */}
        <Routes location={backgroundLocation || location}>
          {/* Public / Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-account" element={<VerifyAccount />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          {/* Private / Dashboard Routes */}
          <Route element={<DashboardLayout />}>
            <Route path="/espace" element={<Dashboard />} />
            <Route path="/espace/profil" element={<Profile />} />
            <Route path="/espace/offres" element={<Offers />} />
            {/* Redirect direct URL access to popup mode */}
            <Route path="/espace/offres/:id" element={<OfferDetailRouteHandler />} />
            <Route path="/espace/candidatures" element={<Candidatures />} />
            <Route path="/espace/mon-stage" element={<MyInternship />} />
            <Route path="/espace/evaluations" element={<Evaluations />} />
            <Route path="/espace/absences" element={<Absences />} />
            <Route path="/espace/favoris" element={<Favoris />} />
            <Route path="/espace/settings" element={<Settings />} />
            <Route path="/espace/help" element={<Help />} />
            <Route path="/espace/notifications" element={<Notifications />} />

            {/* Entreprise Routes */}
            <Route path="/espace/entreprise/profil" element={<ProfileEntreprise />} />
            <Route path="/espace/entreprise/offres" element={<MesOffres />} />
            <Route path="/espace/entreprise/creer-offre" element={<CreerOffre />} />
            {/* Redirect direct URL access to popup mode */}
            <Route path="/espace/entreprise/offres/:id/edit" element={<EditOffreRouteHandler />} />
            <Route path="/espace/entreprise/candidatures" element={<GestionCandidatures />} />
            <Route path="/espace/entreprise/offres/:id/candidatures" element={<CandidaturesOffre />} />
            <Route path="/espace/entreprise/password" element={<Settings />} />
            <Route path="/espace/entreprise/absences" element={<EntrepriseAbsences />} />
            <Route path="/espace/entreprise/conventions" element={<EntrepriseConventions />} />
            <Route path="/espace/entreprise/evaluations" element={<EntrepriseEvaluations />} />
            <Route path="/espace/entreprise/mes-stagiaires" element={<MesStagiaires />} />

            {/* Chef de Département Routes */}
            <Route path="/espace/chef/conventions" element={<ConventionsValidation />} />
            <Route path="/espace/chef/rapports" element={<ChefRapports />} />
            <Route path="/espace/chef/absences" element={<AbsencesChef />} />
            <Route path="/espace/chef/analytics" element={<Analytics />} />
            <Route path="/espace/chef/stagiaires" element={<StagiairesChef />} />
            <Route path="/espace/chef/guide" element={<GuideAdmin />} />

            {/* Admin Routes */}
            <Route path="/espace/admin/chefs" element={<ChefManagement />} />
            <Route path="/espace/admin/utilisateurs" element={<UserManagement />} />
            <Route path="/espace/admin/offres" element={<OfferModeration />} />
            <Route path="/espace/admin/archives" element={<AdminArchives />} />
            <Route path="/espace/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/espace/admin/evaluations" element={<AdminEvaluations />} />
            <Route path="/espace/admin/logs" element={<AdminLogs />} />
          </Route>

          {/* Landing page */}
          <Route path="/" element={<LandingPage />} />
          <Route path="*" element={<Navigate to="/espace" replace />} />
        </Routes>

        {/* ── Popup routes — rendered on top of background ────── */}
        {backgroundLocation && (
          <Routes>
            <Route path="/espace/offres/:id" element={<OfferDetailPopup />} />
            <Route path="/espace/entreprise/offres/:id/edit" element={<EditOffrePopup />} />
          </Routes>
        )}
      </ErrorBoundary>

      <ErrorToast
        error={globalError}
        onClose={() => setGlobalError(null)}
      />
    </>
  );
}

export default App;
