import { Outlet, Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const ROLE_HOME = {
  'Étudiant':         '/espace/offres',
  'Entreprise':       '/espace/entreprise/offres',
  'Chef_Departement': '/espace/chef/analytics',
  'Admin':            '/espace/admin/analytics',
};

const AuthLayout = () => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to={ROLE_HOME[user?.role] ?? '/espace'} replace />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      backgroundColor: 'var(--surface-ground)',
      boxSizing: 'border-box'
    }}>
      <Outlet />
    </div>
  );
};

export default AuthLayout;
