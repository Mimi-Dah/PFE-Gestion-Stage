const Sk = ({ w = '100%', h = 16, r = 8, style: extra = {} }) => (
  <div className="skeleton" style={{ width: w, height: h, borderRadius: r, flexShrink: 0, ...extra }} />
);

const PageHeader = () => (
  <div style={{ marginBottom: '3rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
      <Sk w={44} h={44} r={12} />
      <Sk w={260} h={26} />
    </div>
    <Sk w={400} h={15} style={{ marginLeft: '3.5rem' }} />
  </div>
);

const TableSkeleton = ({ rows }) => (
  <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
    <PageHeader />
    <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', padding: '1rem 1.5rem', borderBottom: '1px solid var(--surface-border)', background: 'var(--surface-section)' }}>
        {Array.from({ length: 5 }).map((_, i) => <Sk key={i} w="70%" h={12} />)}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr 1fr', gap: '1rem', padding: '1.25rem 1.5rem', borderBottom: i < rows - 1 ? '1px solid var(--surface-border)' : 'none', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Sk w={36} h={36} r="50%" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <Sk w="80%" h={14} style={{ marginBottom: 6 }} />
              <Sk w="60%" h={12} />
            </div>
          </div>
          <Sk w="70%" h={14} />
          <Sk w="60%" h={14} />
          <Sk w={72} h={22} r={4} />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Sk w={64} h={32} r={8} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const CardsSkeleton = ({ rows }) => (
  <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
    <PageHeader />
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="glass-panel" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '2rem', alignItems: 'center' }}>
          <Sk w={52} h={52} r={12} style={{ flexShrink: 0 }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Sk w={200} h={16} />
              <Sk w={70} h={22} r={4} />
            </div>
            <Sk w="70%" h={13} style={{ marginBottom: 6 }} />
            <Sk w="50%" h={13} />
          </div>
          <Sk w={88} h={36} r={8} style={{ flexShrink: 0 }} />
        </div>
      ))}
    </div>
  </div>
);

const DashboardSkeleton = () => (
  <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
    <div style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
      <div>
        <Sk w={180} h={14} style={{ marginBottom: 16 }} />
        <Sk w={380} h={36} style={{ marginBottom: 16 }} />
        <Sk w={300} h={16} />
      </div>
      <Sk w={160} h={56} r={16} />
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', marginBottom: '2.5rem' }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <Sk w={48} h={48} r={12} />
            <Sk w={60} h={20} r={10} />
          </div>
          <Sk w={80} h={32} style={{ marginBottom: 8 }} />
          <Sk w={120} h={14} style={{ marginBottom: 12 }} />
          <Sk w="100%" h={4} r={2} />
        </div>
      ))}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="glass-panel" style={{ padding: '2rem' }}>
          <Sk w={200} h={20} style={{ marginBottom: 24 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <Sk w={36} h={36} r={8} style={{ flexShrink: 0 }} />
                <Sk w="70%" h={14} />
                <Sk w={60} h={14} style={{ marginLeft: 'auto', flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const TimelineSkeleton = ({ rows }) => (
  <div className="glass-panel" style={{ padding: '3rem', position: 'relative' }}>
    <div style={{ position: 'absolute', left: '4.75rem', top: '3rem', bottom: '3rem', width: '2px', backgroundColor: 'var(--surface-border)' }} />
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: '2rem', alignItems: 'center', padding: '0.875rem 0', borderBottom: i < rows - 1 ? '1px solid var(--surface-border)' : 'none' }}>
          <Sk w={40} h={40} r="50%" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
              <Sk w={200} h={15} />
              <Sk w={72} h={22} r={4} />
            </div>
            <Sk w="55%" h={12} />
          </div>
          <Sk w={80} h={12} style={{ flexShrink: 0 }} />
        </div>
      ))}
    </div>
  </div>
);

const DetailSkeleton = () => (
  <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
    <Sk w={120} h={14} style={{ marginBottom: 32 }} />
    <div style={{ marginBottom: '2rem' }}>
      <Sk w={280} h={28} style={{ marginBottom: 12 }} />
      <Sk w={360} h={16} />
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2.5rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          <Sk w={200} h={20} style={{ marginBottom: 24 }} />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <Sk w="40%" h={14} />
              <Sk w="35%" h={14} />
            </div>
          ))}
        </div>
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          <Sk w={160} h={20} style={{ marginBottom: 24 }} />
          <Sk w="100%" h={100} r={8} style={{ marginBottom: 20 }} />
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Sk w={140} h={44} r={10} />
            <Sk w={140} h={44} r={10} />
          </div>
        </div>
      </div>
      <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
        <Sk w={120} h={18} style={{ marginBottom: 24 }} />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ marginBottom: '1.25rem' }}>
            <Sk w="50%" h={12} style={{ marginBottom: 8 }} />
            <Sk w="80%" h={15} />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function SkeletonLoader({ variant = 'table', rows }) {
  if (variant === 'table')     return <TableSkeleton rows={rows ?? 5} />;
  if (variant === 'cards')     return <CardsSkeleton rows={rows ?? 4} />;
  if (variant === 'dashboard') return <DashboardSkeleton />;
  if (variant === 'timeline')  return <TimelineSkeleton rows={rows ?? 6} />;
  if (variant === 'detail')    return <DetailSkeleton />;
  return null;
}
