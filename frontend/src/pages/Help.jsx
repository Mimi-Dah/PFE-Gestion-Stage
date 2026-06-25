import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader';
import {
  ChevronDown, ChevronUp, Mail, BookOpen, Shield,
  Users, Briefcase, FileText, GraduationCap,
  MessageSquare, ShieldAlert, Zap, Info,
} from 'lucide-react';

const WORKFLOW_ICONS = [Briefcase, Users, FileText, GraduationCap, BookOpen, Shield];
const TERM_ICONS     = [ShieldAlert, Info, Shield, FileText];

const FaqItem = ({ question, answer }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%', background: 'none', border: 'none', boxShadow: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.85rem 0', textAlign: 'left', cursor: 'pointer',
          color: 'var(--text-main)', fontWeight: 600, fontSize: '0.875rem',
          gap: '1rem',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0, backgroundColor: open ? '#1b6ef3' : 'var(--border)' }} />
          {question}
        </span>
        <span style={{ color: open ? '#1b6ef3' : 'var(--text-muted)', flexShrink: 0 }}>
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </span>
      </button>
      {open && (
        <div style={{ paddingBottom: '0.85rem', paddingLeft: '1.1rem', fontSize: '0.82rem', lineHeight: 1.75, color: 'var(--text-muted)' }}>
          {answer}
        </div>
      )}
    </div>
  );
};

const CardShell = ({ icon, iconColor, iconBg, title, subtitle, children }) => (
  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
    <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '7px', background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{subtitle}</div>}
      </div>
    </div>
    <div style={{ padding: '1.25rem' }}>
      {children}
    </div>
  </div>
);

const WORKFLOW_COLORS = [
  { color: '#6366f1', bg: '#eef2ff' },
  { color: '#0ea5e9', bg: '#e0f2fe' },
  { color: '#15803d', bg: '#dcfce7' },
  { color: '#92400e', bg: '#fef9c3' },
  { color: '#6366f1', bg: '#eef2ff' },
  { color: '#15803d', bg: '#dcfce7' },
];

const Help = () => {
  const { t } = useTranslation();

  const workflowSteps = t('pages.help.workflow', { returnObjects: true });
  const faqItems      = t('pages.help.faq',      { returnObjects: true });
  const terms         = t('pages.help.terms',     { returnObjects: true });

  return (
    <div style={{ padding: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      <PageHeader
        eyebrow={t('pages.help.eyebrow')}
        title={t('pages.help.title')}
        subtitle={t('pages.help.subtitle')}
      />

      {/* Workflow */}
      <CardShell
        icon={<Zap size={15} />}
        iconColor="#6366f1"
        iconBg="#eef2ff"
        title={t('pages.help.workflowTitle')}
        subtitle={t('pages.help.workflowSubtitle')}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
          {Array.isArray(workflowSteps) && workflowSteps.map((step, i) => {
            const Icon = WORKFLOW_ICONS[i] || Briefcase;
            const { color, bg } = WORKFLOW_COLORS[i] || WORKFLOW_COLORS[0];
            return (
              <div key={i} style={{ border: '1px solid var(--border)', borderRadius: '7px', padding: '0.85rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', flexShrink: 0, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>{step.label}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{step.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </CardShell>

      {/* FAQ */}
      <CardShell
        icon={<MessageSquare size={15} />}
        iconColor="#0ea5e9"
        iconBg="#e0f2fe"
        title={t('pages.help.faqTitle')}
        subtitle={t('pages.help.faqSubtitle')}
      >
        <div style={{ borderTop: '1px solid var(--border)' }}>
          {Array.isArray(faqItems) && faqItems.map((item, i) => (
            <FaqItem key={i} question={item.q} answer={item.a} />
          ))}
        </div>
      </CardShell>

      {/* Terms of Use */}
      <CardShell
        icon={<Shield size={15} />}
        iconColor="#15803d"
        iconBg="#dcfce7"
        title={t('pages.help.termsTitle')}
        subtitle={t('pages.help.termsSubtitle')}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
          {Array.isArray(terms) && terms.map((term, i) => {
            const Icon = TERM_ICONS[i] || FileText;
            return (
              <div key={i} style={{ border: '1px solid var(--border)', borderRadius: '7px', padding: '0.85rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Icon size={13} color="#6b7280" />
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>{term.title}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', lineHeight: 1.7, color: 'var(--text-muted)' }}>{term.body}</p>
              </div>
            );
          })}
        </div>
      </CardShell>

      {/* Contact Support */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#eef2ff', color: '#6366f1', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Mail size={18} />
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.15rem' }}>{t('pages.help.contactTitle')}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t('pages.help.contactSubtitle')}</div>
        </div>
        <a
          href="mailto:support@stageflow.dz"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            height: '36px', padding: '0 1rem',
            borderRadius: '6px', background: '#1b6ef3', color: '#fff',
            fontWeight: 600, fontSize: '0.82rem', textDecoration: 'none', flexShrink: 0,
          }}
        >
          <Mail size={13} />
          {t('pages.help.contactBtn')}
        </a>
      </div>

    </div>
  );
};

export default Help;
