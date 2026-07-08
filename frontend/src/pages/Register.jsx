import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  User as UserIcon,
  Mail,
  Lock,
  Building2,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  ArrowRight,
  Camera,
  UploadCloud,
  GraduationCap,
  Eye,
  EyeOff,
  Check,
  Info,
  Phone,
  MapPin,
  Globe,
  Sun,
  Moon,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import useLayoutStore from '../store/layoutStore';
import api from '../services/api';

/* ── Shared micro-components ─────────────────────────────────── */

const Field = ({ label, aside, error, children, span2 = false }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', ...(span2 && { gridColumn: 'span 2' }) }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-color)' }}>{label}</label>
      {aside}
    </div>
    {children}
    {error && <span style={{ fontSize: '0.72rem', color: '#EF4444', fontWeight: '600' }}>{error}</span>}
  </div>
);

const inputBase = {
  width: '100%',
  padding: '0.75rem 0.875rem 0.75rem 2.625rem',
  borderRadius: '8px',
  border: '1.5px solid var(--border)',
  backgroundColor: 'var(--bg-input)',
  color: 'var(--text-main)',
  fontSize: '0.9rem',
  fontWeight: '500',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s, background-color 0.15s',
};

const focusOn  = e => {
  e.target.style.borderColor = '#6366F1';
  e.target.style.setProperty('background-color', 'var(--bg-card)');
};
const focusOff = e => {
  e.target.style.setProperty('border-color', 'var(--border)');
  e.target.style.setProperty('background-color', 'var(--bg-input)');
};

/* ── Main component ───────────────────────────────────────────── */

const Register = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  /* RTL-aware input style */
  const iStyle = (extra = {}) => ({
    ...inputBase,
    paddingLeft:  isRTL ? '0.875rem' : '2.625rem',
    paddingRight: isRTL ? '2.625rem' : '0.875rem',
    textAlign: isRTL ? 'right' : 'left',
    ...extra,
  });

  /* RTL-aware icon prefix */
  const IconPrefix = ({ children }) => (
    <div style={{
      position: 'absolute',
      left:  isRTL ? 'auto' : '12px',
      right: isRTL ? '12px' : 'auto',
      top: '50%', transform: 'translateY(-50%)',
      display: 'flex', alignItems: 'center', pointerEvents: 'none', color: 'var(--text-subtle)',
    }}>
      {children}
    </div>
  );

  const { register, handleSubmit, watch, trigger, formState: { errors } } = useForm();
  const [apiError, setApiError]       = useState('');
  const [isLoading, setIsLoading]     = useState(false);
  const [showPw, setShowPw]           = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [step, setStep]               = useState(1);
  const [departments, setDepartments] = useState([]);
  const navigate = useNavigate();
  const setAuth  = useAuthStore((state) => state.setAuth);
  const { isDarkMode, toggleDarkMode } = useLayoutStore();

  const role     = watch('role');
  const password = watch('password');
  const photo    = watch('photo');
  const cv       = watch('cv');
  const logo     = watch('logo');

  const [isAdvancing, setIsAdvancing] = useState(false);

  useEffect(() => {
    api.get('etablissements/departements/')
      .then(r => setDepartments(Array.isArray(r.data) ? r.data : r.data.results || []))
      .catch(() => {});
  }, []);

  const nextStep = async () => {
    if (isAdvancing) return;
    setIsAdvancing(true);
    let fields = [];
    if (step === 1) fields = ['role', 'email', 'password', 'confirmPassword'];
    if (step === 2) {
      if (role === 'Étudiant')  fields = ['prenom', 'nom', 'telephone', 'adresse', 'departement_id', 'niveau_academique'];
      if (role === 'Entreprise') fields = ['nom_entreprise', 'description', 'adresse_entreprise', 'telephone_entreprise', 'nom_contact', 'email_contact'];
    }
    if (await trigger(fields)) {
      setStep(s => Math.min(s + 1, 3));
    }
    setTimeout(() => setIsAdvancing(false), 500);
  };

  const onSubmit = async (data) => {
    if (step < 3) { nextStep(); return; }
    setIsLoading(true);
    setApiError('');
    try {
      const fd = new FormData();
      fd.append('courriel', data.email);
      fd.append('password', data.password);
      fd.append('role', data.role);
      if (data.role === 'Étudiant') {
        ['prenom','nom','telephone','adresse','niveau_academique','departement_id'].forEach(k => fd.append(k, data[k]));
        if (data.photo?.[0]) fd.append('photo', data.photo[0]);
        if (data.cv?.[0])    fd.append('cv',    data.cv[0]);
      } else {
        ['nom_entreprise','description','adresse_entreprise','telephone_entreprise','nom_contact','email_contact'].forEach(k => fd.append(k, data[k]));
        if (data.site_web)  fd.append('site_web', data.site_web);
        if (data.logo?.[0]) fd.append('logo', data.logo[0]);
      }
      const reg = await api.safeRequest(api.post('auth/register/', fd, { headers: { 'Content-Type': 'multipart/form-data' } }));
      if (!reg.ok) { setApiError(reg.error.message || t('auth.register.errors.registerFailed')); setIsLoading(false); return; }
      const login = await api.safeRequest(api.post('auth/login/', { courriel: data.email, password: data.password }));
      if (login.ok) {
        const { access, refresh } = login.value.data;
        const me = await api.safeRequest(api.get('auth/me/', { headers: { Authorization: `Bearer ${access}` } }));
        if (me.ok) { setAuth(me.value.data, access, refresh); navigate('/espace'); } else { navigate('/login'); }
      } else { navigate('/login'); }
    } catch {
      setApiError(t('auth.register.errors.systemError'));
    } finally {
      setIsLoading(false);
    }
  };

  const stepLabels = [
    t('auth.register.step1'),
    t('auth.register.step2'),
    t('auth.register.step3'),
  ];

  const stepSubtitles = [
    t('auth.register.step1Sub'),
    t('auth.register.step2Sub'),
    t('auth.register.step3Sub'),
  ];

  /* Eye-toggle button (swaps side in RTL) */
  const EyeBtn = ({ show, toggle }) => (
    <button type="button" onClick={toggle}
      style={{
        position: 'absolute',
        right: isRTL ? 'auto' : '10px',
        left:  isRTL ? '10px' : 'auto',
        top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--text-subtle)', display: 'flex', padding: '3px',
      }}>
      {show ? <EyeOff size={15} /> : <Eye size={15} />}
    </button>
  );

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'var(--bg-main)', position: 'relative', overflow: 'hidden',
      padding: '2rem 1rem', boxSizing: 'border-box',
    }}>

      {/* ── Card ── */}
      <div className="animate-fade-in" style={{
        backgroundColor: 'var(--bg-card)', borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 20px 60px -10px rgba(0,0,0,0.12)',
        border: '1px solid var(--border)',
        padding: '1.75rem 2rem', width: '100%', maxWidth: '560px',
        position: 'relative', zIndex: 1,
        direction: isRTL ? 'rtl' : 'ltr',
      }}>

        {/* ── Dark mode toggle ── */}
        <button
          type="button"
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

        {/* ── Header ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 16px rgba(99,102,241,0.35)', marginBottom: '0.75rem',
          }}>
            <GraduationCap size={22} color="#fff" />
          </div>
          <span style={{ fontSize: '1.125rem', fontWeight: '900', color: 'var(--text-main)', letterSpacing: '-0.04em', marginBottom: '0.5rem' }}>
            intern<span style={{ color: '#6366F1' }}>Hub</span>
          </span>
          <h1 style={{ fontSize: '1.375rem', fontWeight: '900', color: 'var(--text-main)', letterSpacing: '-0.04em', margin: '0 0 0.25rem' }}>
            {t('auth.register.title')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '500', margin: 0 }}>
            {stepSubtitles[step - 1]}
          </p>
        </div>

        {/* ── Stepper ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.375rem' }}>
          {[1, 2, 3].map((i) => {
            const done   = step > i;
            const active = step === i;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: done || active ? '#6366F1' : 'var(--surface-section)',
                    border: `2px solid ${done || active ? '#6366F1' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: done || active ? '0 0 0 4px rgba(99,102,241,0.15)' : 'none',
                    transition: 'all 0.25s',
                  }}>
                    {done
                      ? <Check size={14} color="#fff" strokeWidth={3} />
                      : <span style={{ fontSize: '0.75rem', fontWeight: '800', color: active ? '#fff' : 'var(--text-subtle)' }}>{i}</span>
                    }
                  </div>
                  <span style={{
                    fontSize: '0.68rem', fontWeight: '700',
                    color: active ? '#6366F1' : done ? 'var(--text-muted)' : 'var(--text-subtle)',
                    whiteSpace: 'nowrap',
                  }}>
                    {stepLabels[i - 1]}
                  </span>
                </div>
                {i < 3 && (
                  <div style={{
                    width: '72px', height: '2px', margin: '0 0.25rem', marginBottom: '1.25rem',
                    background: step > i ? '#6366F1' : 'var(--border)',
                    transition: 'background 0.3s',
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Error banner ── */}
        {apiError && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            backgroundColor: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem',
            color: '#DC2626', fontSize: '0.85rem', fontWeight: '600',
          }}>
            <Info size={14} style={{ flexShrink: 0 }} /> {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>

              {/* Role picker */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-color)', display: 'block', marginBottom: '0.5rem' }}>
                  {t('auth.register.roleLabel')}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {[
                    { value: 'Étudiant',  labelKey: 'auth.register.roles.student', hintKey: 'auth.register.roles.studentHint' },
                    { value: 'Entreprise', labelKey: 'auth.register.roles.company', hintKey: 'auth.register.roles.companyHint' },
                  ].map(({ value, labelKey, hintKey }) => (
                    <label key={value} style={{
                      cursor: 'pointer',
                      padding: '1.25rem 1rem', borderRadius: '10px',
                      border: `1.5px solid ${role === value ? '#6366F1' : 'var(--border)'}`,
                      backgroundColor: role === value ? 'rgba(99,102,241,0.06)' : 'var(--bg-input)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                      transition: 'all 0.2s',
                    }}>
                      <input type="radio" value={value}
                        {...register('role', { required: t('auth.register.errors.roleRequired') })}
                        style={{ display: 'none' }}
                      />
                      <div style={{
                        width: '48px', height: '48px', borderRadius: '12px',
                        background: role === value ? '#6366F1' : value === 'Étudiant' ? 'rgba(99,102,241,0.1)' : 'rgba(139,92,246,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: role === value ? '#fff' : value === 'Étudiant' ? '#6366F1' : '#8B5CF6',
                        transition: 'all 0.2s',
                      }}>
                        {value === 'Étudiant' ? <UserIcon size={22} /> : <Building2 size={22} />}
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: '800', fontSize: '0.8rem', color: role === value ? '#6366F1' : 'var(--text-main)' }}>{t(labelKey)}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', fontWeight: '500' }}>{t(hintKey)}</div>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.role && <span style={{ fontSize: '0.72rem', color: '#EF4444', fontWeight: '600', marginTop: '0.25rem', display: 'block' }}>{errors.role.message}</span>}
              </div>

              {/* Email */}
              <Field label={t('auth.register.email')} error={errors.email?.message}>
                <div style={{ position: 'relative' }}>
                  <IconPrefix><Mail size={15} /></IconPrefix>
                  <input type="email" placeholder={t('auth.register.emailPlaceholder')}
                    {...register('email', { required: t('auth.register.errors.required') })}
                    style={iStyle()} onFocus={focusOn} onBlur={focusOff}
                  />
                </div>
              </Field>

              {/* Passwords */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <Field label={t('auth.register.password')} error={errors.password?.message}>
                  <div style={{ position: 'relative' }}>
                    <IconPrefix><Lock size={15} /></IconPrefix>
                    <input type={showPw ? 'text' : 'password'} placeholder="••••••••"
                      {...register('password', {
                        required: t('auth.register.errors.required'),
                        minLength: { value: 8, message: t('auth.register.errors.minLength') },
                      })}
                      style={iStyle({ paddingRight: isRTL ? '2.625rem' : '2.5rem', paddingLeft: isRTL ? '2.5rem' : '2.625rem' })}
                      onFocus={focusOn} onBlur={focusOff}
                    />
                    <EyeBtn show={showPw} toggle={() => setShowPw(!showPw)} />
                  </div>
                </Field>
                <Field label={t('auth.register.confirmPassword')} error={errors.confirmPassword?.message}>
                  <div style={{ position: 'relative' }}>
                    <IconPrefix><Lock size={15} /></IconPrefix>
                    <input type={showConfirm ? 'text' : 'password'} placeholder="••••••••"
                      {...register('confirmPassword', {
                        validate: v => v === password || t('auth.register.errors.passwordMismatch'),
                      })}
                      style={iStyle({ paddingRight: isRTL ? '2.625rem' : '2.5rem', paddingLeft: isRTL ? '2.5rem' : '2.625rem' })}
                      onFocus={focusOn} onBlur={focusOff}
                    />
                    <EyeBtn show={showConfirm} toggle={() => setShowConfirm(!showConfirm)} />
                  </div>
                </Field>
              </div>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
              {role === 'Étudiant' ? (
                <>
                  <Field label={t('auth.register.prenom')} error={errors.prenom && t('auth.register.errors.required')}>
                    <div style={{ position: 'relative' }}>
                      <IconPrefix><UserIcon size={15} /></IconPrefix>
                      <input {...register('prenom', { required: true })} placeholder="Jean"
                        style={iStyle()} onFocus={focusOn} onBlur={focusOff} />
                    </div>
                  </Field>
                  <Field label={t('auth.register.nom')} error={errors.nom && t('auth.register.errors.required')}>
                    <div style={{ position: 'relative' }}>
                      <IconPrefix><UserIcon size={15} /></IconPrefix>
                      <input {...register('nom', { required: true })} placeholder="Dupont"
                        style={iStyle()} onFocus={focusOn} onBlur={focusOff} />
                    </div>
                  </Field>
                  <Field label={t('auth.register.telephone')} error={errors.telephone && t('auth.register.errors.required')}>
                    <div style={{ position: 'relative' }}>
                      <IconPrefix><Phone size={15} /></IconPrefix>
                      <input {...register('telephone', { required: true })} placeholder="+222 ..."
                        style={iStyle()} onFocus={focusOn} onBlur={focusOff} />
                    </div>
                  </Field>
                  <Field label={t('auth.register.departement')} error={errors.departement_id && t('auth.register.errors.required')}>
                    <select {...register('departement_id', { required: true })}
                      style={{ ...iStyle(), paddingLeft: isRTL ? '0.875rem' : '0.875rem', appearance: 'none' }}
                      onFocus={focusOn} onBlur={focusOff}>
                      <option value="">{t('auth.register.departmentPlaceholder')}</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
                    </select>
                  </Field>
                  <Field label={t('auth.register.niveau')} error={errors.niveau_academique && t('auth.register.errors.required')} span2>
                    <div style={{ position: 'relative' }}>
                      <IconPrefix><GraduationCap size={15} /></IconPrefix>
                      <input {...register('niveau_academique', { required: true })}
                        placeholder={t('auth.register.academicPlaceholder')}
                        style={iStyle()} onFocus={focusOn} onBlur={focusOff} />
                    </div>
                  </Field>
                  <Field label={t('auth.register.adresse')} error={errors.adresse && t('auth.register.errors.required')} span2>
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        position: 'absolute',
                        left: isRTL ? 'auto' : '12px',
                        right: isRTL ? '12px' : 'auto',
                        top: '14px',
                        display: 'flex', alignItems: 'center', pointerEvents: 'none', color: 'var(--text-subtle)',
                      }}>
                        <MapPin size={15} />
                      </div>
                      <textarea rows={2} {...register('adresse', { required: true })}
                        placeholder={t('auth.register.addressPlaceholder')}
                        style={{ ...iStyle(), resize: 'none', lineHeight: 1.5 }}
                        onFocus={focusOn} onBlur={focusOff} />
                    </div>
                  </Field>
                </>
              ) : (
                <>
                  <Field label={t('auth.register.nomEntreprise')} error={errors.nom_entreprise && t('auth.register.errors.required')} span2>
                    <div style={{ position: 'relative' }}>
                      <IconPrefix><Building2 size={15} /></IconPrefix>
                      <input {...register('nom_entreprise', { required: true })}
                        placeholder={t('auth.register.companyNamePlaceholder')}
                        style={iStyle()} onFocus={focusOn} onBlur={focusOff} />
                    </div>
                  </Field>
                  <Field label={t('auth.register.description')} error={errors.description && t('auth.register.errors.required')} span2>
                    <textarea rows={2} {...register('description', { required: true })}
                      placeholder={t('auth.register.descPlaceholder')}
                      style={{ ...inputBase, paddingLeft: '0.875rem', paddingRight: '0.875rem', resize: 'none', lineHeight: 1.5, textAlign: isRTL ? 'right' : 'left' }}
                      onFocus={focusOn} onBlur={focusOff} />
                  </Field>
                  <Field label={t('auth.register.telephoneEntreprise')} error={errors.telephone_entreprise && t('auth.register.errors.required')}>
                    <div style={{ position: 'relative' }}>
                      <IconPrefix><Phone size={15} /></IconPrefix>
                      <input {...register('telephone_entreprise', { required: true })} placeholder="+222 ..."
                        style={iStyle()} onFocus={focusOn} onBlur={focusOff} />
                    </div>
                  </Field>
                  <Field label={t('auth.register.siteWeb')}>
                    <div style={{ position: 'relative' }}>
                      <IconPrefix><Globe size={15} /></IconPrefix>
                      <input type="url" {...register('site_web')} placeholder="https://…"
                        style={iStyle()} onFocus={focusOn} onBlur={focusOff} />
                    </div>
                  </Field>
                  <Field label={t('auth.register.nomContact')} error={errors.nom_contact && t('auth.register.errors.required')}>
                    <div style={{ position: 'relative' }}>
                      <IconPrefix><UserIcon size={15} /></IconPrefix>
                      <input {...register('nom_contact', { required: true })}
                        placeholder={t('auth.register.hrManagerPlaceholder')}
                        style={iStyle()} onFocus={focusOn} onBlur={focusOff} />
                    </div>
                  </Field>
                  <Field label={t('auth.register.emailContact')} error={errors.email_contact && t('auth.register.errors.required')}>
                    <div style={{ position: 'relative' }}>
                      <IconPrefix><Mail size={15} /></IconPrefix>
                      <input type="email" {...register('email_contact', { required: true })}
                        placeholder={t('auth.register.hrEmailPlaceholder')}
                        style={iStyle()} onFocus={focusOn} onBlur={focusOff} />
                    </div>
                  </Field>
                  <Field label={t('auth.register.adresseEntreprise')} error={errors.adresse_entreprise && t('auth.register.errors.required')} span2>
                    <div style={{ position: 'relative' }}>
                      <IconPrefix><MapPin size={15} /></IconPrefix>
                      <input {...register('adresse_entreprise', { required: true })}
                        placeholder={t('auth.register.companyAddressPlaceholder')}
                        style={iStyle()} onFocus={focusOn} onBlur={focusOff} />
                    </div>
                  </Field>
                </>
              )}
            </div>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {/* Info banner */}
              <div style={{
                padding: '0.65rem 1rem', borderRadius: '8px', fontSize: '0.8rem',
                background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)',
                color: '#6366F1', fontWeight: '500',
              }}>
                {role === 'Étudiant'
                  ? '📎 ' + (t('auth.register.photoHint') || 'Formats acceptés : JPG, PNG pour la photo · PDF pour le CV')
                  : '🏢 ' + (t('auth.register.logoHint') || 'Téléchargez le logo de votre entreprise (JPG ou PNG)')}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: role === 'Étudiant' ? '1fr 1fr' : '1fr', gap: '0.875rem' }}>
                {role === 'Étudiant' ? (
                  <>
                    {[
                      { field: 'photo', icon: <Camera size={24} />,      title: t('auth.register.photo'), hint: t('auth.register.photoHint'), accept: 'image/*', color: '#6366F1', val: photo },
                      { field: 'cv',    icon: <UploadCloud size={24} />, title: t('auth.register.cv'),    hint: t('auth.register.cvHint'),    accept: '.pdf',    color: '#8B5CF6', val: cv },
                    ].map(({ field, icon, title, hint, accept, color, val }) => (
                      <label key={field} htmlFor={`file-${field}`} style={{
                        cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                        padding: '1.75rem 1rem', borderRadius: '10px',
                        border: `1.5px dashed ${val && val[0] ? color : 'var(--border)'}`,
                        backgroundColor: val && val[0] ? `${color}08` : 'var(--bg-input)',
                        textAlign: 'center', transition: 'border-color 0.15s, background-color 0.15s',
                        minHeight: '160px', justifyContent: 'center',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.setProperty('background-color', 'var(--bg-card)'); }}
                      onMouseLeave={e => { e.currentTarget.style.setProperty('border-color', val && val[0] ? color : 'var(--border)'); e.currentTarget.style.setProperty('background-color', val && val[0] ? `${color}08` : 'var(--bg-input)'); }}
                      >
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: val && val[0] ? `${color}20` : `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</div>
                        <div style={{ fontWeight: '800', fontSize: '0.85rem', color: 'var(--text-main)' }}>{title}</div>
                        <div style={{ marginTop: '0.25rem', padding: '0.3rem 0.875rem', borderRadius: '6px', backgroundColor: val && val[0] ? `${color}25` : `${color}12`, fontSize: '0.72rem', fontWeight: '800', color, wordBreak: 'break-all', maxWidth: '100%' }}>
                          {val && val[0] ? `✓ ${val[0].name}` : t('auth.register.chooseFile')}
                        </div>
                        <input id={`file-${field}`} type="file" accept={accept} {...register(field)} style={{ display: 'none' }} />
                      </label>
                    ))}
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label htmlFor="file-logo" style={{
                      cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                      padding: '2.5rem 1.5rem', borderRadius: '10px',
                      border: `1.5px dashed ${errors.logo ? '#EF4444' : logo && logo[0] ? '#6366F1' : 'var(--border)'}`,
                      backgroundColor: logo && logo[0] ? 'rgba(99,102,241,0.06)' : 'var(--bg-input)',
                      textAlign: 'center', transition: 'border-color 0.15s, background-color 0.15s',
                      minHeight: '180px', justifyContent: 'center',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.setProperty('background-color', 'var(--bg-card)'); }}
                    onMouseLeave={e => { e.currentTarget.style.setProperty('border-color', errors.logo ? '#EF4444' : logo && logo[0] ? '#6366F1' : 'var(--border)'); e.currentTarget.style.setProperty('background-color', logo && logo[0] ? 'rgba(99,102,241,0.06)' : 'var(--bg-input)'); }}
                    >
                      <div style={{ width: '56px', height: '56px', borderRadius: '14px', backgroundColor: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366F1' }}>
                        <Building2 size={28} />
                      </div>
                      <div style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-main)' }}>{t('auth.register.logo')}</div>
                      <div style={{ marginTop: '0.25rem', padding: '0.35rem 1rem', borderRadius: '6px', backgroundColor: logo && logo[0] ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)', fontSize: '0.75rem', fontWeight: '800', color: '#6366F1', wordBreak: 'break-all', maxWidth: '100%' }}>
                        {logo && logo[0] ? `✓ ${logo[0].name}` : t('auth.register.chooseFile')}
                      </div>
                      <input id="file-logo" type="file" accept="image/*"
                        {...register('logo', { required: t('auth.register.errors.logoRequired') })}
                        style={{ display: 'none' }} />
                    </label>
                    {errors.logo && <span style={{ fontSize: '0.75rem', color: '#EF4444', fontWeight: '600', textAlign: 'center' }}>{errors.logo.message}</span>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Navigation buttons ── */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            {step > 1 ? (
              <button type="button" onClick={() => setStep(s => s - 1)}
                style={{ flexShrink: 0, padding: '0.75rem 1rem', borderRadius: '8px', border: '1.5px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-color)', fontWeight: '700', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                {isRTL ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
                {t('auth.register.back')}
              </button>
            ) : (
              <Link to="/login" style={{ flexShrink: 0, textDecoration: 'none' }}>
                <button type="button"
                  style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1.5px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-color)', fontWeight: '700', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {isRTL ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
                  {t('auth.register.loginLink')}
                </button>
              </Link>
            )}

            {step < 3 ? (
              <button type="button" onClick={nextStep} disabled={isAdvancing}
                style={{ flex: 1, padding: '0.875rem', borderRadius: '8px', background: isAdvancing ? '#94A3B8' : '#6366F1', color: '#fff', fontWeight: '700', fontSize: '0.9375rem', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: isAdvancing ? 'not-allowed' : 'pointer', boxShadow: isAdvancing ? 'none' : '0 4px 14px rgba(99,102,241,0.4)', opacity: isAdvancing ? 0.75 : 1 }}>
                {t('auth.register.nextStep')}
                {isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
              </button>
            ) : (
              <button type="submit" disabled={isLoading || isAdvancing}
                style={{ flex: 1, padding: '0.875rem', borderRadius: '8px', background: (isLoading || isAdvancing) ? '#94A3B8' : '#6366F1', color: '#fff', fontWeight: '700', fontSize: '0.9375rem', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: (isLoading || isAdvancing) ? 'not-allowed' : 'pointer', boxShadow: (isLoading || isAdvancing) ? 'none' : '0 4px 14px rgba(99,102,241,0.4)', opacity: (isLoading || isAdvancing) ? 0.75 : 1 }}>
                {isLoading ? t('auth.register.submitting') : t('auth.register.submit')}
                {!isLoading && (isRTL ? <ArrowLeft size={16} /> : <ArrowRight size={16} />)}
              </button>
            )}
          </div>
        </form>

        {/* Login link */}
        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500', margin: '1.25rem 0 0' }}>
          {t('auth.register.alreadyAccount')}{' '}
          <Link to="/login" style={{ color: '#6366F1', fontWeight: '800', textDecoration: 'none' }}>
            {t('auth.register.login')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
