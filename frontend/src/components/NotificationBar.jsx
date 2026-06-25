import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Bell, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const NotificationBar = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('notifications/');
      return response.data;
    },
    refetchInterval: 30000,
  });

  const notifications = Array.isArray(notificationsData) ? notificationsData : (notificationsData?.results || []);
  const unreadCount = notifications.filter(n => !n.est_lue).length;

  const markReadMutation = useMutation({
    mutationFn: (id) => api.patch(`notifications/${id}/marquer-lue/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.patch('notifications/tout-marquer-lue/'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  const handleNotificationClick = (notif) => {
    if (!notif.est_lue) {
      markReadMutation.mutate(notif.id_notification);
    }
    if (notif.lien) {
      navigate(notif.lien);
      setIsOpen(false);
    }
  };

  const fmtTime = (iso) => {
    const d = new Date(iso);
    const diffSec = Math.floor((Date.now() - d) / 1000);
    try {
      const rtf = new Intl.RelativeTimeFormat(i18n.language, { numeric: 'auto' });
      if (diffSec < 60)   return rtf.format(0, 'second');
      if (diffSec < 3600) return rtf.format(-Math.floor(diffSec / 60), 'minute');
      if (diffSec < 86400) return rtf.format(-Math.floor(diffSec / 3600), 'hour');
    } catch { /* fallback */ }
    return d.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' }) +
      ' · ' + d.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="icon-button"
        style={{
          position: 'relative',
          backgroundColor: isOpen ? 'var(--primary-light)' : undefined,
          borderColor: isOpen ? 'rgba(27,110,243,0.3)' : undefined,
          color: isOpen ? 'var(--primary)' : undefined,
        }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: 4,
            right: 4,
            minWidth: unreadCount > 9 ? 16 : 14,
            height: unreadCount > 9 ? 16 : 14,
            padding: '0 3px',
            borderRadius: 999,
            backgroundColor: '#EF4444',
            color: '#fff',
            fontSize: '0.6rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
            border: '2px solid var(--bg-card)',
            pointerEvents: 'none',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '120%',
          right: isRTL ? 'auto' : 0,
          left: isRTL ? 0 : 'auto',
          width: '350px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid var(--border)',
          zIndex: 999,
          overflow: 'hidden',
          animation: 'slideDown 0.2s ease-out',
          direction: isRTL ? 'rtl' : 'ltr',
        }}>
          <style>{`
            @keyframes slideDown {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          <div style={{
            padding: '1.25rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: `linear-gradient(to ${isRTL ? 'left' : 'right'}, var(--bg-card), var(--bg-main))`
          }}>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700' }}>
              {t('pages.notifications.title')}
            </h4>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--primary)',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {t('pages.notifications.markAllRead')}
              </button>
            )}
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Bell size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p style={{ fontSize: '0.875rem' }}>{t('pages.notifications.emptyAll')}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {notifications.map((notif) => (
                  <div
                    key={notif.id_notification}
                    onClick={() => handleNotificationClick(notif)}
                    style={{
                      padding: '1rem 1.25rem',
                      borderBottom: '1px solid var(--border)',
                      backgroundColor: notif.est_lue ? 'transparent' : 'rgba(99, 102, 241, 0.03)',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease',
                      display: 'flex',
                      gap: '1rem'
                    }}
                  >
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: notif.est_lue ? 'transparent' : 'var(--primary)',
                      marginTop: '6px',
                      flexShrink: 0
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: notif.est_lue ? '500' : '700',
                        marginBottom: '0.25rem',
                        color: 'var(--text-main)'
                      }}>
                        {notif.titre}
                      </div>
                      <p style={{
                        fontSize: '0.8125rem',
                        color: 'var(--text-muted)',
                        margin: '0 0 0.5rem 0',
                        lineHeight: '1.4'
                      }}>
                        {notif.message}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                          <Clock size={12} />
                          {fmtTime(notif.cree_le)}
                        </span>
                        {!notif.est_lue && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                            {t('pages.notifications.new')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ padding: '0.875rem', textAlign: 'center', borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg-main)' }}>
            <button
              onClick={() => { setIsOpen(false); navigate('/espace/notifications'); }}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.8125rem', fontWeight: '600', cursor: 'pointer' }}
            >
              {t('pages.notifications.viewAll')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBar;
