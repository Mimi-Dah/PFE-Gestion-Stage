import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const parseDate = (val) => {
  if (!val) return null;
  const d = new Date(val + 'T00:00:00');
  return isNaN(d.getTime()) ? null : d;
};

const toISODate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const sameDay = (a, b) =>
  a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export default function DatePicker({ value, onChange, placeholder = 'jj/mm/aaaa', id, error }) {
  const selected = parseDate(value);
  const today = new Date();
  const [view, setView] = useState({ year: (selected || today).getFullYear(), month: (selected || today).getMonth() });
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (selected) setView({ year: selected.getFullYear(), month: selected.getMonth() });
  }, [value]);

  const prevMonth = () => setView(v => {
    const d = new Date(v.year, v.month - 1, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const nextMonth = () => setView(v => {
    const d = new Date(v.year, v.month + 1, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const firstDay = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const cells = Array(firstDay).fill(null).concat(
    Array.from({ length: daysInMonth }, (_, i) => new Date(view.year, view.month, i + 1))
  );
  while (cells.length % 7 !== 0) cells.push(null);

  const displayValue = selected
    ? `${String(selected.getDate()).padStart(2, '0')}/${String(selected.getMonth() + 1).padStart(2, '0')}/${selected.getFullYear()}`
    : '';

  const pick = (d) => {
    onChange(toISODate(d));
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Input trigger */}
      <div
        id={id}
        tabIndex={0}
        role="button"
        onClick={() => setOpen(o => !o)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpen(o => !o); }}
        style={{
          width: '100%',
          padding: '0.8125rem 1.125rem',
          paddingRight: '2.75rem',
          borderRadius: 'var(--radius-md)',
          border: `1px solid ${error ? 'var(--error)' : open ? 'var(--accent)' : 'var(--border)'}`,
          background: 'var(--surface-card)',
          color: displayValue ? 'var(--text-main)' : 'var(--text-muted)',
          fontFamily: 'inherit',
          fontSize: '0.9375rem',
          fontWeight: displayValue ? '500' : '400',
          cursor: 'pointer',
          boxShadow: open ? '0 0 0 3px var(--accent-light)' : 'none',
          transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
          outline: 'none',
          userSelect: 'none',
          boxSizing: 'border-box',
        }}
      >
        {displayValue || <span style={{ opacity: 0.6 }}>{placeholder}</span>}
        <Calendar
          size={16}
          style={{
            position: 'absolute',
            right: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: open ? 'var(--accent)' : 'var(--text-muted)',
            pointerEvents: 'none',
            transition: 'color 0.2s',
          }}
        />
      </div>

      {/* Calendar popup */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          zIndex: 1000,
          background: 'var(--surface-overlay)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid var(--surface-border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          padding: '1.25rem',
          minWidth: '300px',
          animation: 'calFadeIn 0.15s ease',
        }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <button
              type="button"
              onClick={prevMonth}
              style={{
                background: 'var(--surface-hover)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                width: '32px',
                height: '32px',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <ChevronLeft size={16} />
            </button>

            <span style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-main)' }}>
              {MONTHS[view.month]} {view.year}
            </span>

            <button
              type="button"
              onClick={nextMonth}
              style={{
                background: 'var(--surface-hover)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                width: '32px',
                height: '32px',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day labels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '0.5rem' }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', padding: '4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const isSel = sameDay(day, selected);
              const isToday = sameDay(day, today);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => pick(day)}
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    background: isSel
                      ? 'linear-gradient(135deg, var(--primary), var(--accent))'
                      : 'transparent',
                    color: isSel ? '#fff' : isToday ? 'var(--primary)' : 'var(--text-color)',
                    fontWeight: isSel ? '700' : isToday ? '700' : '400',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    outline: isToday && !isSel ? '1px solid var(--primary)' : 'none',
                    transition: 'all 0.15s ease',
                    padding: 0,
                  }}
                  onMouseEnter={e => {
                    if (!isSel) e.currentTarget.style.background = 'var(--surface-hover)';
                  }}
                  onMouseLeave={e => {
                    if (!isSel) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          {/* Today shortcut */}
          <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--surface-border)', paddingTop: '0.75rem', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => pick(today)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer',
                padding: '0.25rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              Aujourd'hui
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes calFadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
