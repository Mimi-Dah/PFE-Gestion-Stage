import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText, CheckCircle, AlertCircle, Clock,
  ShieldCheck, Briefcase, Activity, ClipboardCheck,
  BookOpen, Mail, HelpCircle, ChevronDown, ChevronUp,
  MessageCircle, Lock, Minus, UserCheck, Info, ChevronRight
} from 'lucide-react';

/* ─────────────────────────────────────────────
   Verona-style primitives
───────────────────────────────────────────── */

const Panel = ({ title, icon: Icon, iconColor, iconBg, toggleable = false, defaultOpen = true, children, headerRight }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: '8px',
      overflow: 'hidden',
      background: 'var(--bg-card)',
      boxShadow: '0 1px 4px rgba(0,0,0,.06)',
    }}>
      <div
        onClick={toggleable ? () => setOpen(o => !o) : undefined}
        style={{
          padding: '0.875rem 1.25rem',
          background: 'var(--surface-section)',
          borderBottom: open ? '1px solid var(--border)' : 'none',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: toggleable ? 'pointer' : 'default',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          {Icon && (
            <div style={{ width: 28, height: 28, borderRadius: '6px', background: iconBg || 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={15} color={iconColor || 'var(--primary)'} />
            </div>
          )}
          <span style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-main)' }}>{title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {headerRight}
          {toggleable && (
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 2 }}>
              {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
        </div>
      </div>
      {open && <div style={{ padding: '1.25rem' }}>{children}</div>}
    </div>
  );
};

const Accordion = ({ items }) => {
  const [openIdx, setOpenIdx] = useState(0);
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
      {items.map((item, i) => {
        const isOpen = openIdx === i;
        return (
          <div key={i} style={{ borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <button
              onClick={() => setOpenIdx(isOpen ? -1 : i)}
              style={{
                width: '100%', padding: '1rem 1.25rem',
                background: isOpen ? 'var(--primary-light)' : 'var(--bg-card)',
                border: 'none', cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                textAlign: 'left', transition: 'background 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {item.icon && (
                  <div style={{ width: 30, height: 30, borderRadius: '6px', background: isOpen ? 'var(--primary)' : item.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}>
                    <item.icon size={15} color={isOpen ? '#fff' : item.iconColor} />
                  </div>
                )}
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isOpen ? 'var(--primary)' : 'var(--text-main)' }}>
                  {item.header}
                </span>
              </div>
              <ChevronDown size={15} color="var(--text-muted)" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
            </button>
            {isOpen && (
              <div style={{ padding: '1.25rem 1.5rem', background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const Fieldset = ({ legend, legendIcon: LegendIcon, children, legendColor = 'var(--primary)' }) => (
  <fieldset style={{
    border: '1px solid var(--border)', borderRadius: '8px',
    padding: '1.25rem', margin: 0,
    background: 'var(--bg-card)',
    boxShadow: '0 1px 4px rgba(0,0,0,.06)',
  }}>
    <legend style={{
      padding: '0 0.5rem', fontSize: '0.82rem', fontWeight: 700,
      color: legendColor,
      display: 'flex', alignItems: 'center', gap: '0.35rem',
    }}>
      {LegendIcon && <LegendIcon size={13} />}
      {legend}
    </legend>
    {children}
  </fieldset>
);

const Divider = ({ label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1rem 0' }}>
    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
    {label && (
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>
    )}
    {!label && <Minus size={12} color="var(--text-subtle)" />}
    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
  </div>
);

const TabView = ({ tabs }) => {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.25rem' }}>
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            style={{
              padding: '0.65rem 1.1rem', border: 'none', background: 'transparent',
              borderBottom: active === i ? '2px solid var(--primary)' : '2px solid transparent',
              color: active === i ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: active === i ? 700 : 500, fontSize: '0.85rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
              marginBottom: '-1px', transition: 'all 0.15s',
            }}
          >
            {tab.icon && <tab.icon size={14} />}
            {tab.label}
          </button>
        ))}
      </div>
      {tabs[active].content}
    </div>
  );
};

const StepRow = ({ icon, color, bg, title, text }) => (
  <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
    <div style={{ width: 32, height: 32, borderRadius: '50%', background: bg, border: `1px solid ${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
      <icon.type size={15} color={color} />
    </div>
    <div>
      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)' }}>{title}</div>
      <p style={{ margin: '0.2rem 0 0', fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{text}</p>
    </div>
  </div>
);

const ContactRow = ({ icon: Icon, label, email, color, bg }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
    <div style={{ width: 36, height: 36, borderRadius: '8px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={16} color={color} />
    </div>
    <div>
      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-main)' }}>{label}</div>
      <div style={{ fontSize: '0.775rem', color: 'var(--primary)', fontWeight: 600, marginTop: 1 }}>{email}</div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   Accordion content blocks
───────────────────────────────────────────── */

const ConventionContent = () => {
  const { t } = useTranslation();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-color)', lineHeight: 1.7 }}>
        {t('pages.chefGuide.conventionIntro')}
      </p>
      <Divider />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        {[
          { icon: <CheckCircle size={15} />, color: 'var(--success)', bg: 'var(--success-light)', title: t('pages.chefGuide.conventionStep1Title'), text: t('pages.chefGuide.conventionStep1Text') },
          { icon: <Clock size={15} />,       color: 'var(--warning)', bg: 'var(--warning-light)', title: t('pages.chefGuide.conventionStep2Title'), text: t('pages.chefGuide.conventionStep2Text') },
          { icon: <Activity size={15} />,    color: 'var(--primary)', bg: 'var(--primary-light)', title: t('pages.chefGuide.conventionStep3Title'), text: t('pages.chefGuide.conventionStep3Text') },
        ].map(s => (
          <StepRow key={s.title} icon={s.icon} color={s.color} bg={s.bg} title={s.title} text={s.text} />
        ))}
      </div>
    </div>
  );
};

const SupervisionContent = () => {
  const { t } = useTranslation();
  return (
    <TabView tabs={[
      {
        label: t('pages.chefGuide.supervisionTab1'), icon: AlertCircle,
        content: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-color)', lineHeight: 1.7 }}>
              {t('pages.chefGuide.absencesIntro')}
            </p>
            <Fieldset legend={t('pages.chefGuide.absencesProcedure')} legendIcon={Info} legendColor="var(--error)">
              <ul style={{ margin: 0, padding: '0 0 0 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {[
                  t('pages.chefGuide.absenceStep1'),
                  t('pages.chefGuide.absenceStep2'),
                  t('pages.chefGuide.absenceStep3'),
                  t('pages.chefGuide.absenceStep4'),
                ].map(s => (
                  <li key={s} style={{ fontSize: '0.85rem', color: 'var(--text-color)', lineHeight: 1.6 }}>{s}</li>
                ))}
              </ul>
            </Fieldset>
          </div>
        )
      },
      {
        label: t('pages.chefGuide.supervisionTab2'), icon: ClipboardCheck,
        content: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-color)', lineHeight: 1.7 }}>
              {t('pages.chefGuide.reportsIntro')}
            </p>
            <Fieldset legend={t('pages.chefGuide.reportsEvalCriteria')} legendIcon={Info} legendColor="var(--primary)">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {[
                  { label: t('pages.chefGuide.reportsCriteria1'), color: 'var(--primary)'  },
                  { label: t('pages.chefGuide.reportsCriteria2'), color: 'var(--success)'  },
                  { label: t('pages.chefGuide.reportsCriteria3'), color: 'var(--warning)'  },
                  { label: t('pages.chefGuide.reportsCriteria4'), color: 'var(--accent)'   },
                ].map(c => (
                  <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-color)' }}>
                    <ChevronRight size={13} color={c.color} />{c.label}
                  </div>
                ))}
              </div>
            </Fieldset>
          </div>
        )
      },
    ]} />
  );
};

const ClotureContent = () => {
  const { t } = useTranslation();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-color)', lineHeight: 1.75 }}>
        {t('pages.chefGuide.closureIntro')}
      </p>
      <Divider label={t('pages.chefGuide.closureRequired')} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
        {[
          { icon: UserCheck,   label: t('pages.chefGuide.closure1Label'), sub: t('pages.chefGuide.closure1Sub'), color: 'var(--success)', bg: 'var(--success-light)' },
          { icon: Briefcase,   label: t('pages.chefGuide.closure2Label'), sub: t('pages.chefGuide.closure2Sub'), color: 'var(--accent)',  bg: 'var(--accent-light)'  },
          { icon: ShieldCheck, label: t('pages.chefGuide.closure3Label'), sub: t('pages.chefGuide.closure3Sub'), color: 'var(--primary)', bg: 'var(--primary-light)' },
          { icon: CheckCircle, label: t('pages.chefGuide.closure4Label'), sub: t('pages.chefGuide.closure4Sub'), color: 'var(--warning)', bg: 'var(--warning-light)' },
        ].map(({ icon: Icon, label, sub, color, bg }) => (
          <div key={label} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.875rem', background: 'var(--surface-section)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <div style={{ width: 32, height: 32, borderRadius: '6px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={15} color={color} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-main)' }}>{label}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */

const GuideAdmin = () => {
  const { t } = useTranslation();

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '8px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <BookOpen size={20} color="var(--primary)" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, lineHeight: 1.2 }}>{t('pages.chefGuide.title')}</h1>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {t('pages.chefGuide.subtitle')}
            </p>
          </div>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.8rem', borderRadius: '100px', background: 'var(--surface-section)', border: '1px solid var(--border)', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', flexShrink: 0 }}>
          <Info size={11} /> v2026.05-B
        </span>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.25rem', alignItems: 'start' }}>

        {/* ── Left: accordion sections ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          <Panel
            title={t('pages.chefGuide.aboutTitle')}
            icon={Info}
            iconColor="var(--accent)"
            iconBg="var(--accent-light)"
            toggleable
            defaultOpen={false}
          >
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-color)', lineHeight: 1.75 }}>
              {t('pages.chefGuide.aboutContent')}
            </p>
          </Panel>

          <Panel title={t('pages.chefGuide.proceduresTitle')} icon={FileText} iconColor="var(--primary)" iconBg="var(--primary-light)">
            <Accordion items={[
              {
                header: t('pages.chefGuide.conventionHeader'),
                icon: FileText, iconColor: 'var(--primary)', iconBg: 'var(--primary-light)',
                content: <ConventionContent />,
              },
              {
                header: t('pages.chefGuide.supervisionHeader'),
                icon: Activity, iconColor: 'var(--success)', iconBg: 'var(--success-light)',
                content: <SupervisionContent />,
              },
              {
                header: t('pages.chefGuide.closureHeader'),
                icon: ShieldCheck, iconColor: 'var(--warning)', iconBg: 'var(--warning-light)',
                content: <ClotureContent />,
              },
            ]} />
          </Panel>

        </div>

        {/* ── Right: sidebar panels ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Support panel */}
          <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
            <div style={{ padding: '0.875rem 1.25rem', background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <HelpCircle size={16} color="#fff" />
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>{t('pages.chefGuide.supportTitle')}</span>
            </div>
            <div style={{ padding: '1.25rem', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { icon: Clock, text: t('pages.chefGuide.supportItem1') },
                { icon: Lock,  text: t('pages.chefGuide.supportItem2') },
              ].map(({ icon: Icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={15} color="var(--primary)" />
                  </div>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-color)', lineHeight: 1.6, paddingTop: 6 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contacts */}
          <Fieldset legend={t('pages.chefGuide.contactsTitle')} legendIcon={Mail} legendColor="var(--primary)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <ContactRow icon={Mail}          label={t('pages.chefGuide.contact1Label')} email={t('pages.chefGuide.contact1Email')} color="var(--primary)" bg="var(--primary-light)" />
              <Divider />
              <ContactRow icon={Briefcase}     label={t('pages.chefGuide.contact2Label')} email={t('pages.chefGuide.contact2Email')} color="var(--accent)"  bg="var(--accent-light)"  />
              <Divider />
              <ContactRow icon={MessageCircle} label={t('pages.chefGuide.contact3Label')} email={t('pages.chefGuide.contact3Email')} color="var(--success)" bg="var(--success-light)" />
            </div>
          </Fieldset>

          {/* Reminders */}
          <Panel title={t('pages.chefGuide.remindersTitle')} icon={CheckCircle} iconColor="var(--success)" iconBg="var(--success-light)" toggleable defaultOpen>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {[
                { dot: 'var(--primary)', text: t('pages.chefGuide.reminder1') },
                { dot: 'var(--success)', text: t('pages.chefGuide.reminder2') },
                { dot: 'var(--warning)', text: t('pages.chefGuide.reminder3') },
                { dot: 'var(--error)',   text: t('pages.chefGuide.reminder4') },
              ].map(({ dot, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.83rem', color: 'var(--text-color)' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0 }} />
                  {text}
                </div>
              ))}
            </div>
          </Panel>

        </div>
      </div>
    </div>
  );
};

export default GuideAdmin;
