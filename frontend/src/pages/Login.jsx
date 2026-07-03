import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm as useReactHookForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  Eye,
  EyeOff,
  GraduationCap,
  Mail,
  Lock,
  ArrowRight,
  Sun,
  Moon,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import useLayoutStore from '../store/layoutStore';
import api from '../services/api';

const Field = ({ label, error, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
    <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-color)' }}>
      {label}
    </label>
    {children}
    {error && (
      <span style={{ fontSize: '0.73rem', color: '#EF4444', fontWeight: '600' }}>
        {error}
      </span>
    )}
  </div>
);

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useReactHookForm();
  const [apiError, setApiError]         = useState('');
  const [isLoading, setIsLoading]       = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const setAuth  = useAuthStore((state) => state.setAuth);
  const { isDarkMode, toggleDarkMode } = useLayoutStore();
  const { t } = useTranslation();

  const inputBase = {
    width: '100%',
    padding: '0.75rem 0.875rem 0.75rem 2.75rem',
    borderRadius: '8px',
    border: '1.5px solid var(--border)',
    backgroundColor: 'var(--bg-input)',
    color: 'var(--text-main)',
    fontSize: '0.9375rem',
    fontWeight: '500',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s, background-color 0.15s',
  };

  const iconStyle = {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-subtle)',
    pointerEvents: 'none',
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setApiError('');
    const { email, password } = data;
    const loginResult = await api.safeRequest(
      api.post('auth/login/', { courriel: email, password })
    );
    if (loginResult.ok) {
      const { access, refresh } = loginResult.value.data;
      const meResult = await api.safeRequest(
        api.get('auth/me/', { headers: { Authorization: `Bearer ${access}` } })
      );
      if (meResult.ok) {
        const user = meResult.value.data;
        setAuth(user, access, refresh);
        const roleHome = {
          'Étudiant':         '/espace/offres',
          'Entreprise':       '/espace/entreprise/offres',
          'Chef_Departement': '/espace/chef/analytics',
          'Admin':            '/espace/admin/analytics',
        };
        navigate(roleHome[user.role] ?? '/espace');
      } else {
        setApiError(t('auth.login.errorDefault'));
      }
    } else {
      setApiError(loginResult.error.message || t('auth.login.errorDefault'));
    }
    setIsLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-main)',
      position: 'relative',
      overflow: 'hidden',
      padding: '2rem 1rem',
      boxSizing: 'border-box',
    }}>
      <div
        className="animate-fade-in"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 20px 60px -10px rgba(0,0,0,0.12)',
          padding: '2rem 2rem',
          width: '100%',
          maxWidth: '450px',
          position: 'relative',
          zIndex: 1,
          border: '1px solid var(--border)',
        }}
      >
        <button
          onClick={toggleDarkMode}
          title={isDarkMode ? 'Mode clair' : 'Mode sombre'}
          style={{
            position: 'absolute', top: '1rem', right: '1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 32, height: 32, borderRadius: 8,
            border: '1px solid var(--border)', background: 'transparent',
            color: 'var(--text-subtle)', cursor: 'pointer',
          }}
        >
          {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '1.375rem' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 16px rgba(99,102,241,0.35)',
            marginBottom: '0.75rem',
          }}>
            <GraduationCap size={22} color="#fff" />
          </div>
          <span style={{ fontSize: '1.125rem', fontWeight: '900', color: 'var(--text-main)', letterSpacing: '-0.04em', marginBottom: '0.625rem' }}>
            intern<span style={{ color: '#6366F1' }}>Hub</span>
          </span>
          <h1 style={{ fontSize: '1.375rem', fontWeight: '900', color: 'var(--text-main)', letterSpacing: '-0.04em', margin: '0 0 0.25rem' }}>
            {t('auth.login.title')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '500', margin: 0 }}>
            {t('auth.login.subtitle')}
          </p>
        </div>

        {apiError && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            backgroundColor: 'rgba(239,68,68,0.07)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            color: '#DC2626',
            fontSize: '0.85rem',
            fontWeight: '600',
          }}>
            <Lock size={14} style={{ flexShrink: 0 }} />
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <Field label={t('auth.login.email')} error={errors.email?.message}>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={iconStyle} />
              <input
                type="email"
                placeholder={t('auth.login.emailPlaceholder')}
                {...register('email', { required: t('common.required') })}
                style={inputBase}
                onFocus={e => {
                  e.target.style.borderColor = '#6366F1';
                  e.target.style.setProperty('background-color', 'var(--bg-card)');
                }}
                onBlur={e => {
                  e.target.style.setProperty('border-color', 'var(--border)');
                  e.target.style.setProperty('background-color', 'var(--bg-input)');
                }}
              />
            </div>
          </Field>

          <Field
            label={
              <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                {t('auth.login.password')}
                <Link
                  to="/forgot-password"
                  style={{ fontSize: '0.78rem', color: '#6366F1', fontWeight: '700', textDecoration: 'none' }}
                >
                  {t('auth.login.forgotPassword')}
                </Link>
              </span>
            }
            error={errors.password?.message}
          >
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={iconStyle} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={t('auth.login.passwordPlaceholder')}
                {...register('password', { required: t('common.required') })}
                style={{ ...inputBase, paddingRight: '2.75rem' }}
                onFocus={e => {
                  e.target.style.borderColor = '#6366F1';
                  e.target.style.setProperty('background-color', 'var(--bg-card)');
                }}
                onBlur={e => {
                  e.target.style.setProperty('border-color', 'var(--border)');
                  e.target.style.setProperty('background-color', 'var(--bg-input)');
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-subtle)', padding: '4px', display: 'flex', alignItems: 'center',
                }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </Field>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: '0.25rem',
              padding: '0.875rem',
              borderRadius: '8px',
              background: isLoading ? '#94A3B8' : '#6366F1',
              color: '#fff',
              fontSize: '0.9375rem',
              fontWeight: '700',
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              width: '100%',
              boxShadow: isLoading ? 'none' : '0 4px 14px rgba(99,102,241,0.4)',
              transition: 'opacity 0.15s, transform 0.1s',
            }}
            onMouseEnter={e => { if (!isLoading) e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
          >
            {isLoading ? t('auth.login.submitting') : t('auth.login.submit')}
            {!isLoading && <ArrowRight size={16} />}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1rem 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {t('auth.login.or')}
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '500', margin: 0 }}>
          {t('auth.login.noAccount')}{' '}
          <Link to="/register" style={{ color: '#6366F1', fontWeight: '800', textDecoration: 'none' }}>
            {t('auth.login.createAccount')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
