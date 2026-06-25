import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, GraduationCap, ArrowRight, ShieldCheck, Mail } from 'lucide-react';
import useLayoutStore from '../store/layoutStore';
import api from '../services/api';

const VerifyAccount = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useLayoutStore();

  const handleVerify = async () => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Lien de vérification invalide.');
      return;
    }

    setStatus('loading');
    const result = await api.safeRequest(api.post('auth/verify/', { token }));
    
    if (result.ok) {
      setStatus('success');
      setMessage('Votre compte a été vérifié avec succès !');
      setTimeout(() => navigate('/login'), 3000);
    } else {
      setStatus('error');
      setMessage(result.error?.message || 'Le lien a expiré ou est invalide.');
    }
  };

  const bgGradient = isDarkMode ? '#111111' : '#F8FAFC';
  const textColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const mutedTextColor = isDarkMode ? '#94A3B8' : '#64748B';
  const cardBg = isDarkMode ? '#1E1E1E' : '#FAF9F6';
  const inputBorder = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(15, 23, 42, 0.08)';

  return (
    <div style={{ minHeight: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bgGradient, padding: '2rem', position: 'relative', overflow: 'hidden', transition: 'all 0.5s ease' }}>
      <div style={{ position: 'absolute', top: '20%', left: '20%', width: '30%', height: '30%', background: 'var(--primary-glow)', filter: 'blur(100px)', opacity: isDarkMode ? 0.15 : 0.3, pointerEvents: 'none' }} />
      
      <div className="animate-fade-in" style={{ width: '100%', maxWidth: '550px', position: 'relative', zIndex: 10, textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={28} color="white" />
          </div>
          <span style={{ fontSize: '1.8rem', fontWeight: '950', color: textColor, letterSpacing: '-0.04em' }}>internHub</span>
        </div>

        <div className="glass-panel" style={{ padding: '4rem', backgroundColor: cardBg, border: `1px solid ${inputBorder}` }}>
          {status === 'idle' && (
            <>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2.5rem', color: 'var(--primary)' }}>
                <Mail size={40} />
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: '950', color: textColor, marginBottom: '1rem' }}>Vérification du Compte</h2>
              <p style={{ color: mutedTextColor, fontSize: '1.1rem', marginBottom: '3rem', lineHeight: 1.6, fontWeight: '600' }}>
                Cliquez sur le bouton ci-dessous pour confirmer votre adresse courriel et activer votre accès.
              </p>
              <button onClick={handleVerify} className="primary" style={{ width: '100%', padding: '1.25rem', borderRadius: '12px', fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                Vérifier mon Compte
                <ArrowRight size={20} />
              </button>
            </>
          )}

          {status === 'loading' && (
            <div style={{ padding: '2rem 0' }}>
               <div style={{ width: '50px', height: '50px', border: `4px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 2rem' }} />
               <p style={{ color: textColor, fontSize: '1.2rem', fontWeight: '800' }}>Vérification en cours...</p>
            </div>
          )}

          {status === 'success' && (
            <>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2.5rem', color: '#10b981' }}>
                <CheckCircle2 size={48} />
              </div>
              <h2 style={{ fontSize: '2.2rem', fontWeight: '950', color: textColor, marginBottom: '1rem' }}>Compte Activé !</h2>
              <p style={{ color: mutedTextColor, fontSize: '1.1rem', marginBottom: '2.5rem', fontWeight: '600' }}>{message}</p>
              <button onClick={() => navigate('/login')} className="primary" style={{ width: '100%', padding: '1.25rem', borderRadius: '12px', fontSize: '1rem', fontWeight: '700' }}>
                Aller à la Connexion
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2.5rem', color: '#ef4444' }}>
                <AlertCircle size={48} />
              </div>
              <h2 style={{ fontSize: '2.2rem', fontWeight: '950', color: textColor, marginBottom: '1rem' }}>Échec de Vérification</h2>
              <p style={{ color: mutedTextColor, fontSize: '1.1rem', marginBottom: '2.5rem', fontWeight: '600' }}>{message}</p>
              <button onClick={() => navigate('/login')} className="secondary" style={{ width: '100%', padding: '1.25rem', borderRadius: '12px', border: `1px solid ${inputBorder}`, color: textColor, fontWeight: '700' }}>
                Retour à la Connexion
              </button>
            </>
          )}
        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default VerifyAccount;
