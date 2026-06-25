import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Lock, CheckCircle2, GraduationCap, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';
import useLayoutStore from '../store/layoutStore';
import api from '../services/api';

const ResetPassword = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [apiMessage, setApiMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isDarkMode, toggleDarkMode } = useLayoutStore();

  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  const onSubmit = async (data) => {
    if (!uid || !token) {
      setStatus('error');
      setApiMessage('Lien de réinitialisation invalide ou expiré.');
      return;
    }
    setIsLoading(true);
    setStatus(null);
    const result = await api.safeRequest(api.post('auth/password-reset/confirm/', {
      uid,
      token,
      new_password: data.nouveau_password,
    }));
    
    if (result.ok) {
      setStatus('success');
      setApiMessage('Votre mot de passe a été réinitialisé avec succès.');
      setTimeout(() => navigate('/login'), 3000);
    } else {
      setStatus('error');
      setApiMessage(result.error?.message || 'Code invalide ou expiré.');
    }
    setIsLoading(false);
  };

  const bgGradient = isDarkMode ? '#111111' : '#F8FAFC';
  const textColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const mutedTextColor = isDarkMode ? '#94A3B8' : '#64748B';
  const cardBg = isDarkMode ? '#1E1E1E' : '#FAF9F6';
  const inputBg = isDarkMode ? '#252525' : '#F8FAFC';
  const inputBorder = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(15, 23, 42, 0.08)';

  return (
    <div style={{ minHeight: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bgGradient, padding: '2rem', position: 'relative', overflow: 'hidden', transition: 'all 0.5s ease' }}>
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%', background: 'var(--accent-glow)', filter: 'blur(120px)', opacity: isDarkMode ? 0.15 : 0.3, pointerEvents: 'none' }} />
      
      <div className="animate-fade-in" style={{ width: '100%', maxWidth: '500px', position: 'relative', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={24} color="white" />
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: '950', color: textColor, letterSpacing: '-0.04em' }}>internHub</span>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '950', color: textColor, margin: 0 }}>Réinitialisation</h1>
          <p style={{ color: mutedTextColor, fontSize: '1.1rem', marginTop: '1rem', fontWeight: '600' }}>Créez votre nouveau mot de passe sécurisé.</p>
        </div>

        <div className="glass-panel" style={{ padding: '3.5rem', backgroundColor: cardBg, border: `1px solid ${inputBorder}` }}>
          {status && (
            <div style={{ backgroundColor: status === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: status === 'success' ? '#10b981' : '#ef4444', padding: '1.25rem 1.5rem', borderRadius: '14px', marginBottom: '2rem', fontSize: '0.95rem', fontWeight: '800', border: `1px solid ${status === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
               {status === 'success' ? <CheckCircle2 size={18} /> : <Lock size={18} />}
               {apiMessage}
            </div>
          )}

          {status !== 'success' && (
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {(!uid || !token) && (
                <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '1rem 1.5rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={16} /> Lien invalide. Demandez un nouveau lien de réinitialisation.
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ fontSize: '0.9rem', color: isDarkMode ? 'rgba(255,255,255,0.7)' : '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Nouveau Mot de Passe</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={20} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: isDarkMode ? 'rgba(255,255,255,0.3)' : '#94a3b8' }} />
                  <input type={showPassword ? "text" : "password"} placeholder="••••••••" {...register('nouveau_password', { required: 'Requis', minLength: { value: 8, message: '8 caractères minimum' } })} style={{ width: '100%', padding: '1.1rem 3.5rem 1.1rem 3.5rem', borderRadius: '12px', border: `1px solid ${inputBorder}`, backgroundColor: inputBg, color: textColor, fontSize: '1rem', fontWeight: '600' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: isDarkMode ? 'rgba(255,255,255,0.3)' : '#94a3b8', padding: '0.5rem', display: 'flex' }}>
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.nouveau_password && <span style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: '700' }}>{errors.nouveau_password.message}</span>}
              </div>

              <button type="submit" className="primary" style={{ padding: '1.25rem', borderRadius: '12px', fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }} disabled={isLoading}>
                {isLoading ? 'Mise à jour...' : 'Confirmer'}
                {!isLoading && <ArrowRight size={20} />}
              </button>
            </form>
          )}

          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <Link to="/login" style={{ fontSize: '0.9rem', color: mutedTextColor, textDecoration: 'none', fontWeight: '800' }}>
               Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
