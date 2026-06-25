import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye, EyeOff, Lock, ShieldCheck,
  AlertCircle, CheckCircle2, ShieldAlert,
} from 'lucide-react';
import api from '../services/api';

const PasswordField = ({ id, label, placeholder, registration, error, showState, onToggle }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
    <label htmlFor={id} style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
      {label}
    </label>
    <div style={{ position: 'relative' }}>
      <input
        id={id}
        type={showState ? 'text' : 'password'}
        placeholder={placeholder}
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '0.6rem 2.75rem 0.6rem 0.85rem',
          borderRadius: '6px', border: `1px solid ${error ? '#ef4444' : 'var(--border)'}`,
          background: 'var(--bg-card)', color: 'var(--text-main)',
          fontSize: '0.875rem', outline: 'none',
        }}
        {...registration}
      />
      <button
        type="button"
        onClick={onToggle}
        style={{
          position: 'absolute', right: '0.65rem', top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', padding: 0,
          color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center',
        }}
      >
        {showState ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
    {error && (
      <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <AlertCircle size={12} /> {error.message}
      </span>
    )}
  </div>
);

const Settings = () => {
  const { t } = useTranslation();
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [status, setStatus] = useState(null);
  const [apiMessage, setApiMessage] = useState('');

  const schema = useMemo(() => z.object({
    ancien_password: z.string().min(1, t('pages.settings.validation.currentRequired')),
    nouveau_password: z
      .string()
      .min(8, t('pages.settings.validation.minLength'))
      .regex(/[A-Z]/, t('pages.settings.validation.uppercase'))
      .regex(/[0-9]/, t('pages.settings.validation.digit')),
    confirm_password: z.string().min(1, t('pages.settings.validation.confirmRequired')),
  }).refine((d) => d.nouveau_password === d.confirm_password, {
    message: t('pages.settings.validation.mismatch'),
    path: ['confirm_password'],
  }), [t]);

  const TIPS = t('pages.settings.tips', { returnObjects: true });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const toggle = (field) => setShow((s) => ({ ...s, [field]: !s[field] }));

  const onSubmit = async (data) => {
    setStatus(null);
    setApiMessage('');
    const result = await api.safeRequest(
      api.post('auth/change-password/', {
        ancien_password: data.ancien_password,
        nouveau_password: data.nouveau_password,
      })
    );
    if (result.ok) {
      setStatus('success');
      setApiMessage(t('pages.settings.successMsg'));
      reset();
    } else {
      setStatus('error');
      setApiMessage(result.error?.message || t('pages.settings.errorMsg'));
    }
  };

  return (
    <div style={{ padding: '0 0 2rem' }}>
      <PageHeader
        eyebrow={t('pages.settings.eyebrow')}
        title={t('pages.settings.title')}
        subtitle={t('pages.settings.subtitle')}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: '1.25rem', alignItems: 'start' }}>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '7px', background: '#eef2ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Lock size={15} />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>{t('pages.settings.changePasswordTitle')}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('pages.settings.changePasswordSubtitle')}</div>
            </div>
          </div>

          <div style={{ padding: '1.25rem' }}>
            {status && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.65rem',
                padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1.25rem',
                background: status === 'success' ? '#dcfce7' : '#fee2e2',
                color: status === 'success' ? '#15803d' : '#b91c1c',
                border: `1px solid ${status === 'success' ? '#bbf7d0' : '#fecaca'}`,
                fontSize: '0.82rem', fontWeight: 600,
              }}>
                {status === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                {apiMessage}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <PasswordField
                id="ancien_password"
                label={t('pages.settings.currentPassword')}
                placeholder={t('pages.settings.currentPasswordPlaceholder')}
                registration={register('ancien_password')}
                error={errors.ancien_password}
                showState={show.current}
                onToggle={() => toggle('current')}
              />
              <PasswordField
                id="nouveau_password"
                label={t('pages.settings.newPassword')}
                placeholder={t('pages.settings.newPasswordPlaceholder')}
                registration={register('nouveau_password')}
                error={errors.nouveau_password}
                showState={show.new}
                onToggle={() => toggle('new')}
              />
              <PasswordField
                id="confirm_password"
                label={t('pages.settings.confirmPassword')}
                placeholder={t('pages.settings.confirmPasswordPlaceholder')}
                registration={register('confirm_password')}
                error={errors.confirm_password}
                showState={show.confirm}
                onToggle={() => toggle('confirm')}
              />

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  marginTop: '0.25rem', height: '38px',
                  background: '#1b6ef3', color: '#fff',
                  border: 'none', borderRadius: '6px',
                  fontSize: '0.875rem', fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? t('pages.settings.updating') : t('pages.settings.updateBtn')}
              </button>
            </form>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '7px', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ShieldCheck size={15} />
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>{t('pages.settings.tipsTitle')}</span>
            </div>
            <ul style={{ margin: 0, padding: '1rem 1.25rem', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {Array.isArray(TIPS) && TIPS.map((tip) => (
                <li key={tip} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.82rem', color: 'var(--text-color)', fontWeight: 500 }}>
                  <CheckCircle2 size={13} color="#22c55e" style={{ flexShrink: 0, marginTop: '1px' }} />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '1rem 1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <ShieldAlert size={16} color="#92400e" style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#92400e', fontWeight: 500, lineHeight: 1.6 }}>
              {t('pages.settings.sessionWarning')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
