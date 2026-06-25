import { MapPin, Clock, Building2, ArrowRight } from 'lucide-react';

const InternCard = ({
  title    = 'Stage Développeur Full-Stack',
  company  = 'TechCorp Maroc',
  location = 'Casablanca',
  duration = '6 mois',
  type     = 'Temps plein',
  logo,
  urgent   = false,
  onApply,
  onDetails,
}) => {
  return (
    <div className="card hover-lift" style={{ padding: 0, overflow: 'hidden' }}>

      <div className="flex items-start justify-between pl-5 pr-4 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: 44, height: 44, borderRadius: 10,
              background: logo ? 'transparent' : 'var(--primary-light)',
              color: 'var(--primary)', fontWeight: 800,
              fontSize: '1.1rem', fontFamily: 'var(--font-heading)',
            }}
          >
            {logo
              ? <img src={logo} alt={company} style={{ width: '100%', borderRadius: 10 }} />
              : company.charAt(0).toUpperCase()
            }
          </div>

          <div>
            <p
              className="text-left"
              style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', margin: 0 }}
            >
              {company}
            </p>
            {type && (
              <span className="badge badge-info ml-0 mt-1" style={{ display: 'inline-flex' }}>
                {type}
              </span>
            )}
          </div>
        </div>

        {urgent && (
          <span className="badge badge-danger flex-shrink-0">
            Urgent
          </span>
        )}
      </div>

      <div className="pl-5 pr-5">
        <h3
          className="text-left"
          style={{
            fontSize: '0.9375rem', fontWeight: 700,
            color: 'var(--text-main)', margin: '0 0 0.75rem', lineHeight: 1.3,
          }}
        >
          {title}
        </h3>
      </div>

      <div
        className="flex flex-wrap gap-3 pl-5 pr-5 pb-4"
        style={{ borderBottom: '1px solid var(--surface-border)' }}
      >
        <span
          className="flex items-center gap-1"
          style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}
        >
          <MapPin size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          {location}
        </span>

        <span
          className="flex items-center gap-1"
          style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}
        >
          <Clock size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          {duration}
        </span>
      </div>

      <div className="flex items-center justify-between pl-5 pr-4 py-3">
        <button
          className="secondary flex items-center gap-1"
          onClick={onDetails}
          style={{ fontSize: '0.8125rem', padding: '6px 14px', borderRadius: 8 }}
        >
          <Building2 size={13} />
          Détails
        </button>

        <button
          className="primary flex items-center gap-2"
          onClick={onApply}
          style={{ fontSize: '0.8125rem', padding: '6px 16px', borderRadius: 8 }}
        >
          Postuler
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default InternCard;
