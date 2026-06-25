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
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../services/api';

/* ── Shared micro-components ─────────────────────────────────── */

const Field = ({ label, aside, error, children, span2 = false }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', ...(span2 && { gridColumn: 'span 2' }) }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155' }}>{label}</label>
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
  border: '1.5px solid #E2E8F0',
  backgroundColor: '#F8FAFC',
  color: '#0F172A',
  fontSize: '0.9rem',
  fontWeight: '500',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s, background-color 0.15s',
};

const focusOn  = e => { e.target.style.borderColor = '#6366F1'; e.target.style.backgroundColor = '#fff'; };
const focusOff = e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.backgroundColor = '#F8FAFC'; };

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
      display: 'flex', alignItems: 'center', pointerEvents: 'none', color: '#94A3B8',
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

  const role     = watch('role');
  const password = watch('password');

  useEffect(() => {
    api.get('etablissements/departements/')
      .then(r => setDepartments(Array.isArray(r.data) ? r.data : r.data.results || []))
      .catch(() => {});
  }, []);

  const nextStep = async () => {
    let fields = [];
    if (step === 1) fields = ['role', 'email', 'password', 'confirmPassword'];
    if (step === 2) {
      if (role === 'Étudiant')  fields = ['prenom', 'nom', 'telephone', 'adresse', 'departement_id', 'niveau_academique'];
      if (role === 'Entreprise') fields = ['nom_entreprise', 'description', 'adresse_entreprise', 'telephone_entreprise', 'nom_contact', 'email_contact'];
    }
    if (await trigger(fields)) setStep(s => s + 1);
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
        color: '#94A3B8', display: 'flex', padding: '3px',
      }}>
      {show ? <EyeOff size={15} /> : <Eye size={15} />}
    </button>
  );

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#fff', position: 'relative', overflow: 'hidden',
      padding: '2rem 1rem', boxSizing: 'border-box',
    }}>

      {/* ── Card ── */}
      <div className="animate-fade-in" style={{
        backgroundColor: '#fff', borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 20px 60px -10px rgba(0,0,0,0.12)',
        border: '1px solid rgba(226,232,240,0.8)',
        padding: '1.75rem 2rem', width: '100%', maxWidth: '560px',
        position: 'relative', zIndex: 1,
        direction: isRTL ? 'rtl' : 'ltr',
      }}>

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
          <span style={{ fontSize: '1.125rem', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.04em', marginBottom: '0.5rem' }}>
            intern<span style={{ color: '#6366F1' }}>Hub</span>
          </span>
          <h1 style={{ fontSize: '1.375rem', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.04em', margin: '0 0 0.25rem' }}>
            {t('auth.register.title')}
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.875rem', fontWeight: '500', margin: 0 }}>
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
                    background: done || active ? '#6366F1' : '#F1F5F9',
                    border: `2px solid ${done || active ? '#6366F1' : '#E2E8F0'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: done || active ? '0 0 0 4px rgba(99,102,241,0.15)' : 'none',
                    transition: 'all 0.25s',
                  }}>
                    {done
                      ? <Check size={14} color="#fff" strokeWidth={3} />
                      : <span style={{ fontSize: '0.75rem', fontWeight: '800', color: active ? '#fff' : '#94A3B8' }}>{i}</span>
                    }
                  </div>
                  <span style={{
                    fontSize: '0.68rem', fontWeight: '700',
                    color: active ? '#6366F1' : done ? '#64748B' : '#94A3B8',
                    whiteSpace: 'nowrap',
                  }}>
                    {stepLabels[i - 1]}
                  </span>
                </div>
                {i < 3 && (
                  <div style={{
                    width: '72px', height: '2px', margin: '0 0.25rem', marginBottom: '1.25rem',
                    background: step > i ? '#6366F1' : '#E2E8F0',
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
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.5rem' }}>
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
                      border: `1.5px solid ${role === value ? '#6366F1' : '#E2E8F0'}`,
                      backgroundColor: role === value ? 'rgba(99,102,241,0.06)' : '#F8FAFC',
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
                        <div style={{ fontWeight: '800', fontSize: '0.8rem', color: role === value ? '#6366F1' : '#0F172A' }}>{t(labelKey)}</div>
                        <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: '500' }}>{t(hintKey)}</div>
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
                        display: 'flex', alignItems: 'center', pointerEvents: 'none', color: '#94A3B8',
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
            <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: role === 'Étudiant' ? '1fr 1fr' : '1fr', gap: '0.875rem' }}>
              {role === 'Étudiant' ? (
                <>
                  {[
                    { field: 'photo', icon: <Camera size={24} />,      title: t('auth.register.photo'), hint: t('auth.register.photoHint'), accept: 'image/*', color: '#6366F1' },
                    { field: 'cv',    icon: <UploadCloud size={24} />, title: t('auth.register.cv'),    hint: t('auth.register.cvHint'),    accept: '.pdf',    color: '#8B5CF6' },
                  ].map(({ field, icon, title, hint, accept, color }) => (
                    <label key={field} htmlFor={`file-${field}`} style={{
                      cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                      padding: '1.75rem 1rem', borderRadius: '10px',
                      border: '1.5px dashed #CBD5E1', backgroundColor: '#F8FAFC',
                      textAlign: 'center', transition: 'border-color 0.15s, background-color 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.backgroundColor = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.backgroundColor = '#F8FAFC'; }}
                    >
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</div>
                      <div style={{ fontWeight: '800', fontSize: '0.85rem', color: '#0F172A' }}>{title}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{hint}</div>
                      <div style={{ marginTop: '0.25rem', padding: '0.3rem 0.875rem', borderRadius: '6px', backgroundColor: `${color}12`, fontSize: '0.72rem', fontWeight: '800', color }}>
                        {t('auth.register.chooseFile')}
                      </div>
                      <input id={`file-${field}`} type="file" accept={accept} {...register(field)} style={{ display: 'none' }} />
                    </label>
                  ))}
                </>
              ) : (
                <label htmlFor="file-logo" style={{
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                  padding: '2.5rem 1.5rem', borderRadius: '10px',
                  border: '1.5px dashed #CBD5E1', backgroundColor: '#F8FAFC',
                  textAlign: 'center', transition: 'border-color 0.15s, background-color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.backgroundColor = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.backgroundColor = '#F8FAFC'; }}
                >
                  <div style={{ width: '56px', height: '56px', borderRadius: '14px', backgroundColor: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366F1' }}>
                    <Building2 size={28} />
                  </div>
                  <div style={{ fontWeight: '800', fontSize: '0.9rem', color: '#0F172A' }}>{t('auth.register.logo')}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{t('auth.register.logoHint')}</div>
                  <div style={{ marginTop: '0.25rem', padding: '0.35rem 1rem', borderRadius: '6px', backgroundColor: 'rgba(99,102,241,0.1)', fontSize: '0.75rem', fontWeight: '800', color: '#6366F1' }}>
                    {t('auth.register.chooseFile')}
                  </div>
                  <input id="file-logo" type="file" accept="image/*"
                    {...register('logo', { required: t('auth.register.errors.logoRequired') })}
                    style={{ display: 'none' }} />
                </label>
              )}
            </div>
          )}

          {/* ── Navigation buttons ── */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            {step > 1 ? (
              <button type="button" onClick={() => setStep(s => s - 1)}
                style={{ flexShrink: 0, padding: '0.75rem 1rem', borderRadius: '8px', border: '1.5px solid #E2E8F0', backgroundColor: 'transparent', color: '#334155', fontWeight: '700', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                {isRTL ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
                {t('auth.register.back')}
              </button>
            ) : (
              <Link to="/login" style={{ flexShrink: 0, textDecoration: 'none' }}>
                <button type="button"
                  style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1.5px solid #E2E8F0', backgroundColor: 'transparent', color: '#334155', fontWeight: '700', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {isRTL ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
                  {t('auth.register.loginLink')}
                </button>
              </Link>
            )}

            {step < 3 ? (
              <button type="button" onClick={nextStep}
                style={{ flex: 1, padding: '0.875rem', borderRadius: '8px', background: '#6366F1', color: '#fff', fontWeight: '700', fontSize: '0.9375rem', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}>
                {t('auth.register.nextStep')}
                {isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
              </button>
            ) : (
              <button type="submit" disabled={isLoading}
                style={{ flex: 1, padding: '0.875rem', borderRadius: '8px', background: isLoading ? '#94A3B8' : '#6366F1', color: '#fff', fontWeight: '700', fontSize: '0.9375rem', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: isLoading ? 'not-allowed' : 'pointer', boxShadow: isLoading ? 'none' : '0 4px 14px rgba(99,102,241,0.4)', opacity: isLoading ? 0.75 : 1 }}>
                {isLoading ? t('auth.register.submitting') : t('auth.register.submit')}
                {!isLoading && (isRTL ? <ArrowLeft size={16} /> : <ArrowRight size={16} />)}
              </button>
            )}
          </div>
        </form>

        {/* Login link */}
        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8rem', color: '#64748B', fontWeight: '500', margin: '1.25rem 0 0' }}>
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
