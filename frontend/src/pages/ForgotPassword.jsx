import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Mail, ArrowLeft, CheckCircle2, GraduationCap, ArrowRight, AlertCircle } from 'lucide-react';
import api from '../services/api';

const Field = ({ label, error, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
    <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155' }}>{label}</label>
    {children}
    {error && (
      <span style={{ fontSize: '0.73rem', color: '#EF4444', fontWeight: '600' }}>{error}</span>
    )}
  </div>
);

const ForgotPassword = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [status, setStatus] = useState(null);
  const [apiMessage, setApiMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const inputBase = {
    width: '100%',
    padding: '0.75rem 0.875rem 0.75rem 2.75rem',
    borderRadius: '8px',
    border: '1.5px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
    fontSize: '0.9375rem',
    fontWeight: '500',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s, background-color 0.15s',
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setStatus(null);
    const result = await api.safeRequest(api.post('auth/password-reset/', { courriel: data.email }));
    if (result.ok) {
      setStatus('success');
      setApiMessage(t('auth.forgotPassword.successMessage'));
    } else {
      setStatus('error');
      setApiMessage(result.error?.message || t('common.error'));
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
      backgroundColor: '#fff',
      position: 'relative',
      overflow: 'hidden',
      padding: '2rem 1rem',
      boxSizing: 'border-box',
    }}>
      <div
        className="animate-fade-in"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 20px 60px -10px rgba(0,0,0,0.12)',
          padding: '2rem 2rem',
          width: '100%',
          maxWidth: '450px',
          position: 'relative',
          zIndex: 1,
          border: '1px solid rgba(226,232,240,0.8)',
        }}
      >
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
          <span style={{ fontSize: '1.125rem', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.04em', marginBottom: '0.625rem' }}>
            intern<span style={{ color: '#6366F1' }}>Hub</span>
          </span>
          <h1 style={{ fontSize: '1.375rem', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.04em', margin: '0 0 0.25rem' }}>
            {t('auth.forgotPassword.title')}
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.875rem', fontWeight: '500', margin: 0 }}>
            {t('auth.forgotPassword.subtitle')}
          </p>
        </div>

        {status === 'success' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            backgroundColor: 'rgba(16,185,129,0.07)',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            color: '#059669',
            fontSize: '0.85rem',
            fontWeight: '600',
          }}>
            <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
            {apiMessage}
          </div>
        )}

        {status === 'error' && (
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
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            {apiMessage}
          </div>
        )}

        {status !== 'success' && (
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <Field label={t('auth.forgotPassword.email')} error={errors.email?.message}>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
                <input
                  type="email"
                  placeholder={t('auth.forgotPassword.emailPlaceholder')}
                  {...register('email', { required: t('common.required') })}
                  style={inputBase}
                  onFocus={e => { e.target.style.borderColor = '#6366F1'; e.target.style.backgroundColor = '#fff'; }}
                  onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.backgroundColor = '#F8FAFC'; }}
                />
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
              {isLoading ? t('auth.forgotPassword.submitting') : t('auth.forgotPassword.submit')}
              {!isLoading && <ArrowRight size={16} />}
            </button>
          </form>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1rem 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#64748B', fontWeight: '500', margin: 0 }}>
          <Link
            to="/login"
            style={{ color: '#6366F1', fontWeight: '800', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <ArrowLeft size={14} /> {t('auth.forgotPassword.backToLogin')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
