import React from 'react';

const MetricCircle = ({ value, label, color = "var(--primary)" }) => {
  // Ensure we are showing the value out of 5 even if the data is scaled differently
  const displayValue = value > 5 ? (value / 4).toFixed(1) : value;
  const percentage = (displayValue / 5) * 100;
  const strokeDasharray = `${percentage * 2.82} 282`;
  
  return (
    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: '80px', height: '80px', marginBottom: '1.25rem' }}>
        <svg width="80" height="80" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="var(--surface-hover)" strokeWidth="8" />
          <circle 
            cx="50" cy="50" r="45" 
            fill="none" 
            stroke={color} 
            strokeWidth="8" 
            strokeDasharray={strokeDasharray}
            strokeDashoffset="0"
            transform="rotate(-90 50 50)"
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        </svg>
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          lineHeight: 1
        }}>
          <span style={{ fontSize: '1.5rem', fontWeight: '950', color: 'var(--text-main)' }}>{displayValue}</span>
          <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', opacity: 0.6 }}>/5</span>
        </div>
      </div>
      <span style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
    </div>
  );
};

export default MetricCircle;
