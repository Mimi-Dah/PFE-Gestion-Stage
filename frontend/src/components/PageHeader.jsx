const PageHeader = ({ eyebrow, title, subtitle, actions }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
    <div>
      {eyebrow && (
        <p style={{ margin: '0 0 0.35rem', fontSize: '0.72rem', fontWeight: '700', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--primary, #1B6EF3)' }}>
          {eyebrow}
        </p>
      )}
      <h1 style={{ margin: '0 0 0.4rem', fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: '800', lineHeight: 1.15, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {subtitle}
        </p>
      )}
    </div>
    {actions && <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>{actions}</div>}
  </div>
);

export default PageHeader;
