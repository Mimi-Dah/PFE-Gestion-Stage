import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Bell, Clock, CheckCheck, BellOff,
  ClipboardCheck, FileText, Star, BarChart2, AlertTriangle, ChevronRight, ChevronLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

/* ── Type config (icons/colors only — labels come from i18n) ── */
const TYPE_CFG = {
  candidature: { icon: ClipboardCheck, color: 'var(--primary)',  bg: 'var(--primary-light)'  },
  convention:  { icon: FileText,       color: 'var(--accent)',   bg: 'var(--accent-light)'   },
  evaluation:  { icon: Star,           color: 'var(--warning)',  bg: 'var(--warning-light)'  },
  rapport:     { icon: BarChart2,      color: 'var(--success)',  bg: 'var(--success-light)'  },
  absence:     { icon: AlertTriangle,  color: 'var(--error)',    bg: 'var(--error-light)'    },
};
const DEFAULT_CFG = { icon: Bell, color: 'var(--secondary)', bg: 'var(--n100)' };
const getCategory = (type_event) => {
  const t = (type_event ?? '').toLowerCase();
  return Object.keys(TYPE_CFG).find(k => t.includes(k)) ?? null;
};
const getCfg = (type_event) => TYPE_CFG[getCategory(type_event)] ?? DEFAULT_CFG;

/* ── Shared measurements (px) ─────────────────────────────────── */
const LINE_X  = 19;
const PAD_L   = 56;
const ICON_SZ = 40;

/* ─────────────────────────────────────────────────────────────── */
const Notifications = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const queryClient = useQueryClient();
  const navigate    = useNavigate();
  const [filter, setFilter] = useState('all');

  const fmtTime = (iso) => {
    const d = new Date(iso), now = new Date();
    const diffSec = Math.floor((now - d) / 1000);
    if (diffSec < 3600) {
      try {
        const rtf = new Intl.RelativeTimeFormat(i18n.language, { numeric: 'auto' });
        const m = Math.floor(diffSec / 60);
        return m < 1 ? rtf.format(0, 'second') : rtf.format(-m, 'minute');
      } catch { /* fallback */ }
    }
    if (diffSec < 86400) {
      try {
        const rtf = new Intl.RelativeTimeFormat(i18n.language, { numeric: 'auto' });
        return rtf.format(-Math.floor(diffSec / 3600), 'hour');
      } catch { /* fallback */ }
    }
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) +
      ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  const groupByDate = (list) => {
    const today = new Date(), yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const groups = {};
    list.forEach(n => {
      const d = new Date(n.cree_le);
      const key =
        d.toDateString() === today.toDateString()     ? t('pages.notifications.groups.today')     :
        d.toDateString() === yesterday.toDateString() ? t('pages.notifications.groups.yesterday') :
        d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
      (groups[key] = groups[key] || []).push(n);
    });
    return Object.entries(groups);
  };

  const FILTERS = [
    { key: 'all',         label: t('pages.notifications.filters.all')         },
    { key: 'candidature', label: t('pages.notifications.filters.candidature') },
    { key: 'convention',  label: t('pages.notifications.filters.convention')  },
    { key: 'evaluation',  label: t('pages.notifications.filters.evaluation')  },
    { key: 'rapport',     label: t('pages.notifications.filters.rapport')     },
    { key: 'absence',     label: t('pages.notifications.filters.absence')     },
  ];

  const { data: raw, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn:  () => api.get('notifications/').then(r => r.data),
  });

  const all  = Array.isArray(raw) ? raw : (raw?.results || []);
  const list = filter === 'all' ? all : all.filter(n => getCategory(n.type_event) === filter);
  const unread = all.filter(n => !n.est_lue).length;

  const markOne = useMutation({
    mutationFn: (id) => api.patch(`notifications/${id}/marquer-lue/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const markAll = useMutation({
    mutationFn: () => api.patch('notifications/tout-marquer-lue/'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const handleClick = (n) => {
    if (!n.est_lue) markOne.mutate(n.id_notification);
    if (n.lien)     navigate(n.lien);
  };

  const getCfgWithLabel = (type_event) => {
    const cat = getCategory(type_event);
    const base = TYPE_CFG[cat] ?? DEFAULT_CFG;
    const labelKey = cat ? `pages.notifications.types.${cat}` : 'pages.notifications.types.default';
    return { ...base, label: t(labelKey) };
  };

  const grouped = groupByDate(list);

  return (
    <div className="animate-fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>

      {/* ══ Page header ══════════════════════════════════════ */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap',
        marginBottom: '2rem',
      }}>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.3rem 0.75rem', borderRadius: 6, marginBottom: '0.6rem',
            backgroundColor: 'var(--primary-light)', color: 'var(--primary)',
            fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase',
          }}>
            <Bell size={11} /> {t('pages.notifications.eyebrow')}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.03em' }}>
              {t('pages.notifications.title')}
            </h1>
            {unread > 0 && (
              <span style={{
                padding: '0.18rem 0.7rem', borderRadius: 999,
                backgroundColor: 'var(--primary)', color: '#fff',
                fontSize: '0.82rem', fontWeight: 800,
              }}>
                {unread}
              </span>
            )}
          </div>

          <p style={{ margin: '0.4rem 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {unread > 0
              ? t('pages.notifications.unread', { count: unread })
              : t('pages.notifications.allRead')}
          </p>
        </div>

        {unread > 0 && (
          <button
            className="secondary"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.65rem 1.2rem', borderRadius: 10, fontSize: '0.875rem',
              alignSelf: 'flex-end',
            }}
          >
            <CheckCheck size={16} /> {t('pages.notifications.markAllRead')}
          </button>
        )}
      </div>

      {/* ══ Filter pills ═════════════════════════════════════ */}
      {!isLoading && all.length > 0 && (
        <div style={{
          display: 'flex', gap: '0.4rem', flexWrap: 'wrap',
          padding: '0.35rem', borderRadius: 12, marginBottom: '2.5rem',
          backgroundColor: 'var(--surface-section)',
          border: '1px solid var(--surface-border)',
        }}>
          {FILTERS.map(f => {
            const cnt = f.key === 'all'
              ? all.length
              : all.filter(n => getCategory(n.type_event) === f.key).length;
            if (cnt === 0 && f.key !== 'all') return null;
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.42rem 0.9rem', borderRadius: 8, border: 'none',
                  fontSize: '0.82rem', fontWeight: active ? 700 : 500, cursor: 'pointer',
                  transition: 'all 0.15s',
                  backgroundColor: active ? 'var(--bg-card)' : 'transparent',
                  color: active ? 'var(--text-main)' : 'var(--text-muted)',
                  boxShadow: active ? 'var(--shadow-sm)' : 'none',
                }}
              >
                {f.label}
                <span style={{
                  padding: '0.1rem 0.45rem', borderRadius: 999,
                  fontSize: '0.7rem', fontWeight: 700,
                  backgroundColor: active ? 'var(--primary-light)' : 'var(--n200)',
                  color: active ? 'var(--primary)' : 'var(--text-muted)',
                }}>
                  {cnt}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ══ Loading skeleton ═════════════════════════════════ */}
      {isLoading && (
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute',
            left: isRTL ? 'auto' : LINE_X,
            right: isRTL ? LINE_X : 'auto',
            top: 0, bottom: 0,
            width: 2, backgroundColor: 'var(--surface-border)',
          }} />
          <div style={{ paddingLeft: isRTL ? 0 : PAD_L, paddingRight: isRTL ? PAD_L : 0 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ position: 'relative', marginBottom: '1.5rem' }}>
                <div style={{
                  position: 'absolute',
                  left: isRTL ? 'auto' : -PAD_L,
                  right: isRTL ? -PAD_L : 'auto',
                  top: '50%', transform: 'translateY(-50%)',
                  width: ICON_SZ, height: ICON_SZ, borderRadius: '50%',
                  backgroundColor: 'var(--surface-section)',
                  border: '2px solid var(--surface-border)',
                }} />
                <div style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--surface-border)',
                  borderRadius: 14, padding: '1.1rem 1.4rem',
                }}>
                  <div style={{ height: 10, width: '25%', borderRadius: 6, backgroundColor: 'var(--surface-hover)', marginBottom: 10 }} />
                  <div style={{ height: 13, width: '55%', borderRadius: 6, backgroundColor: 'var(--surface-hover)', marginBottom: 8  }} />
                  <div style={{ height: 10, width: '75%', borderRadius: 6, backgroundColor: 'var(--surface-hover)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ Empty state ══════════════════════════════════════ */}
      {!isLoading && list.length === 0 && (
        <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20, margin: '0 auto 1.5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'var(--surface-section)',
            border: '2px dashed var(--surface-border)',
            color: 'var(--text-subtle)',
          }}>
            <BellOff size={34} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            {filter === 'all'
              ? t('pages.notifications.emptyAll')
              : t('pages.notifications.emptyFilter', { label: FILTERS.find(f => f.key === filter)?.label.toLowerCase() })}
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: 360, marginInline: 'auto', lineHeight: 1.6, fontSize: '0.9rem' }}>
            {t('pages.notifications.emptySubtitle')}
          </p>
        </div>
      )}

      {/* ══ Timeline ═════════════════════════════════════════ */}
      {!isLoading && list.length > 0 && grouped.map(([dateLabel, items], gi) => (
        <div key={dateLabel} style={{ marginBottom: '2.5rem' }}>

          {/* Date separator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            marginBottom: '1.25rem', marginTop: gi > 0 ? '0.5rem' : 0,
          }}>
            <span style={{
              fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em',
              textTransform: 'uppercase', whiteSpace: 'nowrap',
              color: 'var(--text-muted)',
              padding: '0.28rem 0.8rem', borderRadius: 999,
              backgroundColor: 'var(--surface-section)',
              border: '1px solid var(--surface-border)',
            }}>
              {dateLabel}
            </span>
            <div style={{ flex: 1, height: 1, backgroundColor: 'var(--surface-border)' }} />
          </div>

          {/* Items + vertical line */}
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute',
              left: isRTL ? 'auto' : LINE_X,
              right: isRTL ? LINE_X : 'auto',
              top: 0, bottom: 24,
              width: 2,
              background: 'linear-gradient(180deg, var(--surface-border) 0%, transparent 100%)',
            }} />

            <div style={{ paddingLeft: isRTL ? 0 : PAD_L, paddingRight: isRTL ? PAD_L : 0 }}>
              {items.map((notif, idx) => {
                const cfg = getCfgWithLabel(notif.type_event);
                const Icon = cfg.icon;
                const isNew = !notif.est_lue;

                return (
                  <div
                    key={notif.id_notification}
                    style={{ position: 'relative', marginBottom: idx < items.length - 1 ? '1.1rem' : 0 }}
                  >
                    <div style={{
                      position: 'absolute',
                      left: isRTL ? 'auto' : -PAD_L,
                      right: isRTL ? -PAD_L : 'auto',
                      top: '50%', transform: 'translateY(-50%)',
                      width: ICON_SZ, height: ICON_SZ, borderRadius: '50%',
                      backgroundColor: 'var(--bg-card)',
                      border: `2px solid ${isNew ? cfg.color : 'var(--surface-border)'}`,
                      boxShadow: isNew ? `0 0 0 4px ${cfg.bg}` : 'var(--shadow-sm)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      zIndex: 1, transition: 'all 0.2s', flexShrink: 0,
                    }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: '50%',
                        backgroundColor: cfg.bg, color: cfg.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon size={13} />
                      </div>
                    </div>

                    <div
                      className="notif-card"
                      onClick={() => handleClick(notif)}
                      style={{
                        backgroundColor: isNew ? cfg.bg : 'var(--bg-card)',
                        border: `1.5px solid ${isNew ? cfg.color + '40' : 'var(--surface-border)'}`,
                        borderRadius: 14,
                        padding: '1rem 1.25rem',
                        cursor: notif.lien ? 'pointer' : 'default',
                        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                      }}
                      onMouseEnter={e => {
                        if (!notif.lien) return;
                        e.currentTarget.style.transform  = `translateX(${isRTL ? '-' : ''}4px)`;
                        e.currentTarget.style.boxShadow  = 'var(--shadow-md)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform  = 'translateX(0)';
                        e.currentTarget.style.boxShadow  = 'none';
                      }}
                    >
                      <div style={{
                        display: 'flex', alignItems: 'center',
                        gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.4rem',
                      }}>
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 900,
                          letterSpacing: '0.1em', textTransform: 'uppercase',
                          color: cfg.color,
                          padding: '0.15rem 0.55rem', borderRadius: 999,
                          backgroundColor: isNew ? 'rgba(255,255,255,0.55)' : cfg.bg,
                        }}>
                          {cfg.label}
                        </span>
                        <span style={{
                          fontSize: '0.73rem', color: 'var(--text-subtle)',
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                        }}>
                          <Clock size={10} /> {fmtTime(notif.cree_le)}
                        </span>
                        {isNew && (
                          <span style={{
                            marginInlineStart: 'auto',
                            fontSize: '0.65rem', fontWeight: 900,
                            padding: '0.15rem 0.55rem', borderRadius: 999,
                            color: 'var(--primary)', backgroundColor: 'var(--primary-light)',
                          }}>
                            {t('pages.notifications.new')}
                          </span>
                        )}
                      </div>

                      <p style={{
                        margin: '0 0 0.3rem',
                        fontWeight: isNew ? 700 : 600,
                        fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.4,
                      }}>
                        {notif.titre}
                      </p>

                      <p style={{
                        margin: 0,
                        fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.55,
                      }}>
                        {notif.message}
                      </p>

                      {notif.lien && (
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          marginTop: '0.65rem',
                          fontSize: '0.77rem', fontWeight: 700, color: cfg.color,
                        }}>
                          {t('pages.notifications.viewDetails')} {isRTL ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Notifications;
