import React, { useState, useEffect } from 'react';
import { XCircle, AlertCircle, X } from 'lucide-react';

/**
 * Pattern: Graceful Degradation
 * A toast component to display errors without breaking the UI flow.
 */
const ErrorToast = ({ error, onClose, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(false);

  const handleClose = React.useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for transition
  }, [onClose]);

  useEffect(() => {
    if (error) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsVisible(true);
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [error, duration, handleClose]);

  if (!error) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '2rem',
      right: '2rem',
      zIndex: 9999,
      pointerEvents: isVisible ? 'auto' : 'none',
      transform: isVisible ? 'translateY(0)' : 'translateY(100px)',
      opacity: isVisible ? 1 : 0,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    }}>
      <div style={{
        backgroundColor: 'var(--bg-card)',
        color: 'var(--error)',
        padding: '1rem 1.25rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        minWidth: '300px',
        maxWidth: '450px'
      }}>
        <div style={{ 
          backgroundColor: 'rgba(239, 68, 68, 0.1)', 
          padding: '0.5rem', 
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {error.code === 'NETWORK_ERROR' ? <AlertCircle size={20} /> : <XCircle size={20} />}
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '700', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
            {error.code || 'ERROR'}
          </div>
          <p style={{ margin: 0, fontSize: '0.8125rem', opacity: 0.9, lineHeight: 1.4 }}>
            {error.message}
          </p>
        </div>

        <button 
          onClick={handleClose}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--text-muted)', 
            cursor: 'pointer',
            padding: '0.25rem',
            display: 'flex',
            borderRadius: '4px',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = 'var(--bg-main)'}
          onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default ErrorToast;
