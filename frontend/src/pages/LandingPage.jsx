import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  GraduationCap, Building2, Landmark, Menu, X, ArrowRight,
  Search, Users, FileText, Briefcase, TrendingUp, Shield,
  ChevronRight, MessageCircle, BarChart2, Globe,
} from 'lucide-react';
import useLayoutStore from '../store/layoutStore';

/* ── Compact language switcher for the landing page ── */
const LANGS = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English',  flag: '🇬🇧' },
  { code: 'ar', label: 'العربية',  flag: '🇸🇦' },
];

function LpLangSwitcher() {
  const { i18n } = useTranslation();
  const { language, setLanguage } = useLayoutStore();
  const [open, setOpen] = useState(false);
  const current = LANGS.find(l => l.code === language) || LANGS[0];

  const pick = (code) => {
    i18n.changeLanguage(code);
    setLanguage(code);
    localStorage.setItem('internhub-lang', code);
    document.documentElement.setAttribute('lang', code);
    document.documentElement.setAttribute('dir', code === 'ar' ? 'rtl' : 'ltr');
    setOpen(false);
  };

  useEffect(() => {
    const fn = (e) => { if (!e.target.closest('.lp-ls')) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  return (
    <div className="lp-ls" style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '.4375rem .875rem', borderRadius: 8,
          border: '1.5px solid #e2e8f0', background: '#fff',
          fontSize: '.8125rem', fontWeight: 600, color: '#475569',
          cursor: 'pointer', transition: 'border-color .15s, color .15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#c7d2fe'; e.currentTarget.style.color = '#6366F1'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; }}
      >
        <Globe size={14} />
        {current.flag} {current.code.toUpperCase()}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)',
          right: 0, minWidth: 148, background: '#fff',
          border: '1px solid #e2e8f0', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,.10)',
          zIndex: 2000, overflow: 'hidden',
        }}>
          {LANGS.map(l => (
            <button key={l.code} onClick={() => pick(l.code)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '0.625rem 0.875rem', background: language === l.code ? '#eef2ff' : 'transparent',
              border: 'none', cursor: 'pointer', fontSize: '.875rem',
              fontWeight: language === l.code ? 700 : 500,
              color: language === l.code ? '#6366F1' : '#475569',
              textAlign: 'start',
            }}>
              <span style={{ fontSize: '1rem' }}>{l.flag}</span>
              <span>{l.label}</span>
              {language === l.code && (
                <span style={{ marginInlineStart: 'auto', width: 7, height: 7, borderRadius: '50%', background: '#6366F1', flexShrink: 0 }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const FEATURES = [
    { icon: <Search size={22} strokeWidth={1.75} /> },
    { icon: <FileText size={22} strokeWidth={1.75} /> },
    { icon: <TrendingUp size={22} strokeWidth={1.75} /> },
    { icon: <MessageCircle size={22} strokeWidth={1.75} /> },
    { icon: <Briefcase size={22} strokeWidth={1.75} /> },
    { icon: <BarChart2 size={22} strokeWidth={1.75} /> },
    { icon: <Shield size={22} strokeWidth={1.75} /> },
    { icon: <Users size={22} strokeWidth={1.75} /> },
  ];

  const WHO_ICONS = [
    { icon: <GraduationCap size={28} strokeWidth={1.75} />, color: '#6366F1', bg: '#EEF2FF' },
    { icon: <Building2    size={28} strokeWidth={1.75} />, color: '#8B5CF6', bg: '#F5F3FF' },
    { icon: <Landmark     size={28} strokeWidth={1.75} />, color: '#06B6D4', bg: '#ECFEFF' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .lp {
          font-family: "Inter var", "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          color: #475569; background: #fff;
          overflow-x: hidden; line-height: 1.5;
          --p:   #6366F1;
          --ph:  #4f46e5;
          --pl:  #eef2ff;
          --pb:  #c7d2fe;
          --pv:  #8B5CF6;
          --t1:  #0f172a;
          --t2:  #475569;
          --bdr: #e2e8f0;
          --sec: #f8fafc;
          --r1: 6px; --r2: 10px; --r3: 14px; --r4: 20px;
          --sh-sm: 0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04);
          --sh-md: 0 4px 6px -1px rgba(0,0,0,.07),0 2px 4px -1px rgba(0,0,0,.04);
          --sh-lg: 0 10px 15px -3px rgba(0,0,0,.08),0 4px 6px -2px rgba(0,0,0,.04);
        }

        /* ── NAV ── */
        .lp-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
          background: rgba(255,255,255,.97);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid transparent;
          transition: box-shadow .25s, border-color .25s;
        }
        .lp-nav.scrolled { box-shadow: 0 1px 0 var(--bdr), 0 4px 16px rgba(0,0,0,.06); border-bottom-color: var(--bdr); }
        .lp-nav-inner {
          max-width: 1280px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          height: 66px; padding: 0 2rem; gap: 1rem;
        }
        .lp-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .lp-logo-icon {
          width: 34px; height: 34px; border-radius: 9px;
          background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 8px rgba(99,102,241,.3);
        }
        .lp-logo-text { font-size: 1.0625rem; font-weight: 700; color: var(--t1); }
        .lp-logo-text span { color: var(--p); }

        .lp-nav-links { display: flex; align-items: center; gap: .125rem; }
        .lp-nav-link {
          color: var(--t2); text-decoration: none; font-size: .875rem; font-weight: 500;
          padding: .4375rem .9rem; border-radius: var(--r1);
          transition: color .15s, background .15s; white-space: nowrap;
        }
        .lp-nav-link:hover { color: var(--t1); background: var(--sec); }

        .lp-nav-cta { display: flex; align-items: center; gap: .625rem; flex-shrink: 0; }
        .lp-btn-out {
          color: var(--t2); text-decoration: none; font-size: .875rem; font-weight: 600;
          padding: .46875rem 1.125rem; border-radius: var(--r2);
          border: 1.5px solid var(--bdr); background: #fff; white-space: nowrap;
          transition: border-color .15s, color .15s;
        }
        .lp-btn-out:hover { border-color: var(--pb); color: var(--p); }
        .lp-btn-pri {
          display: inline-flex; align-items: center; gap: 5px;
          color: #fff; text-decoration: none; font-size: .875rem; font-weight: 600;
          padding: .5rem 1.125rem; border-radius: var(--r2); white-space: nowrap;
          background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
          box-shadow: 0 1px 4px rgba(99,102,241,.3);
          transition: opacity .15s, box-shadow .15s;
        }
        .lp-btn-pri:hover { opacity: .9; box-shadow: 0 4px 14px rgba(99,102,241,.4); }

        .lp-burger {
          display: none !important; background: transparent;
          border: 1.5px solid var(--bdr); border-radius: var(--r1); color: var(--t2);
          padding: .4rem; cursor: pointer;
          align-items: center; justify-content: center;
        }
        .lp-mob { display: none; }
        @media (max-width: 960px) {
          .lp-nav-links,.lp-nav-cta { display: none !important; }
          .lp-burger { display: flex !important; }
          .lp-mob {
            display: flex; flex-direction: column; gap: .25rem;
            padding: .75rem 1.5rem 1.25rem;
            background: #fff; border-top: 1px solid var(--bdr);
          }
          .lp-mob a { color: var(--t2); text-decoration: none; padding: .65rem .75rem; font-size: .9375rem; font-weight: 500; border-radius: var(--r1); }
          .lp-mob a:hover { background: var(--sec); }
        }

        /* ── RTL nav overrides ── */
        [dir="rtl"] .lp-nav-inner { direction: rtl; }
        [dir="rtl"] .lp-mob { direction: rtl; text-align: start; }
        [dir="rtl"] .lp-ls > div { right: auto; left: 0; }

        /* ── HERO ── */
        @keyframes lp-fade-up { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes lp-pulse { 0%,100%{transform:scale(1);opacity:.4} 50%{transform:scale(2.2);opacity:0} }

        .lp-hero {
          padding-top: 7rem;
          background: linear-gradient(180deg, #EEF2FF 0%, #F5F8FF 45%, #ffffff 100%);
          text-align: center;
          overflow: hidden;
          position: relative;
        }
        .lp-hero-bg {
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 80% 55% at 50% -5%,  rgba(99,102,241,.13) 0%, transparent 60%),
            radial-gradient(ellipse 45% 40% at 92%  28%, rgba(139,92,246,.09) 0%, transparent 52%),
            radial-gradient(ellipse 40% 35% at 8%   75%, rgba(99,102,241,.06) 0%, transparent 52%);
        }
        .lp-hero-inner {
          max-width: 760px; margin: 0 auto; padding: 0 1.5rem 3.5rem;
          position: relative; z-index: 1;
          animation: lp-fade-up .65s ease both;
        }
        .lp-hero-badge {
          display: inline-flex; align-items: center; gap: 9px;
          background: var(--pl); border: 1px solid var(--pb);
          border-radius: 100px; padding: 5px 16px 5px 9px; margin-bottom: 1.75rem;
        }
        [dir="rtl"] .lp-hero-badge { padding: 5px 9px 5px 16px; }
        .lp-hero-badge-pulse {
          width: 8px; height: 8px; border-radius: 50%; background: var(--p);
          position: relative; flex-shrink: 0;
        }
        .lp-hero-badge-pulse::before {
          content: ''; position: absolute; inset: -4px; border-radius: 50%;
          background: var(--p); opacity: .4;
          animation: lp-pulse 2.2s ease infinite;
        }
        .lp-hero-badge-txt { color: var(--p); font-size: .8125rem; font-weight: 600; letter-spacing: .01em; }

        .lp-hero-h1 {
          font-size: clamp(2.25rem, 5.5vw, 3.875rem);
          font-weight: 800; line-height: 1.1; letter-spacing: -.035em;
          color: var(--t1); margin-bottom: 1.25rem;
        }
        [dir="rtl"] .lp-hero-h1 { letter-spacing: 0; }
        .lp-hero-h1 .acc {
          background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .lp-hero-sub {
          font-size: 1.0625rem; color: var(--t2); line-height: 1.8;
          margin: 0 auto 2rem; max-width: 520px;
        }
        .lp-hero-btns { display: flex; gap: .75rem; flex-wrap: wrap; justify-content: center; }
        .lp-hero-btn-main {
          display: inline-flex; align-items: center; gap: 8px;
          background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); color: #fff; text-decoration: none;
          padding: .875rem 2rem; border-radius: var(--r2);
          font-size: .9375rem; font-weight: 700;
          box-shadow: 0 4px 20px rgba(99,102,241,.35);
          transition: opacity .15s, box-shadow .15s, transform .15s;
        }
        .lp-hero-btn-main:hover { opacity: .9; transform: translateY(-2px); box-shadow: 0 10px 36px rgba(99,102,241,.45); }
        .lp-hero-btn-sec {
          display: inline-flex; align-items: center; gap: 7px;
          color: var(--t2); text-decoration: none;
          padding: .875rem 2rem; border-radius: var(--r2);
          font-size: .9375rem; font-weight: 600;
          border: 1.5px solid var(--bdr); background: #fff;
          transition: border-color .15s, color .15s;
        }
        .lp-hero-btn-sec:hover { border-color: var(--pb); color: var(--p); }

        /* Dashboard mockup */
        .lp-hero-mockup-wrap {
          max-width: 1060px; margin: 3.5rem auto 0;
          padding: 0 2rem;
          position: relative; z-index: 1;
        }
        .lp-mockup {
          background: #fff;
          border-radius: 14px 14px 0 0;
          box-shadow:
            0 0 0 1px rgba(0,0,0,.06),
            0 20px 60px rgba(0,0,0,.12),
            0 8px 20px rgba(0,0,0,.06);
          overflow: hidden;
        }
        .lp-mockup-bar {
          background: #F1F5F9; border-bottom: 1px solid #E2E8F0;
          padding: .625rem 1rem;
          display: flex; align-items: center; gap: .4rem;
        }
        .lp-mock-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
        .lp-mockup-url {
          flex: 0 0 auto; background: #fff; border-radius: 5px;
          border: 1px solid #e2e8f0; padding: .2rem .875rem;
          font-size: .625rem; color: #94A3B8; margin: 0 auto;
          width: 260px; text-align: center;
        }
        .lp-mockup-body { display: flex; flex-direction: column; height: 420px; }

        /* ── App topbar ── */
        .lp-mock-app-topbar {
          height: 32px; background: #fff; border-bottom: 1px solid #E2E8F0;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 .875rem; flex-shrink: 0;
        }
        .lp-mock-topbar-burger {
          display: flex; flex-direction: column; justify-content: center; gap: 2px; width: 14px;
        }
        .lp-mock-topbar-burger span { display: block; height: 1.5px; background: #64748B; border-radius: 2px; }
        .lp-mock-topbar-right { display: flex; align-items: center; gap: 6px; }
        .lp-mock-topbar-icon { width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; color: #94A3B8; }
        .lp-mock-topbar-admin {
          padding: 2px 8px; border-radius: 100px; background: #EEF2FF; color: #6366F1;
          font-size: .3rem; font-weight: 700; border: 1px solid #C7D2FE;
        }

        /* ── Sidebar + content wrapper ── */
        .lp-mock-app-content { display: flex; flex: 1; min-height: 0; overflow: hidden; }

        /* ── Sidebar (white) ── */
        .lp-mock-sidebar {
          width: 148px; background: #fff; border-right: 1px solid #E2E8F0;
          display: flex; flex-direction: column; padding: .625rem 0 .5rem;
          flex-shrink: 0; overflow: hidden;
        }
        .lp-mock-sb-logo {
          display: flex; align-items: center; gap: .3rem;
          padding: 0 .625rem .5rem; border-bottom: 1px solid #F1F5F9; margin-bottom: .375rem;
        }
        .lp-mock-sb-logo-icon {
          width: 20px; height: 20px; border-radius: 5px;
          background: linear-gradient(135deg, #6366F1, #8B5CF6);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .lp-mock-sb-logo-name { font-size: .42rem; font-weight: 800; color: #0F172A; }
        .lp-mock-sb-logo-sub  { font-size: .28rem; color: #94A3B8; margin-top: .05rem; }
        .lp-mock-sb-section {
          font-size: .27rem; font-weight: 700; color: #94A3B8;
          text-transform: uppercase; letter-spacing: .08em;
          padding: .375rem .625rem .2rem;
        }
        .lp-mock-sb-item {
          display: flex; align-items: center; gap: .3rem;
          padding: .25rem .625rem; margin: .05rem .3rem;
          border-radius: 5px; font-size: .355rem; font-weight: 500; color: #64748B;
        }
        .lp-mock-sb-item.active { background: #EEF2FF; color: #6366F1; font-weight: 700; }
        .lp-mock-sb-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
        .lp-mock-sb-user {
          margin-top: auto; padding: .4rem .625rem 0; border-top: 1px solid #F1F5F9;
          display: flex; align-items: center; gap: .3rem;
        }
        .lp-mock-sb-av {
          width: 16px; height: 16px; border-radius: 50%; background: #EEF2FF; color: #6366F1;
          display: flex; align-items: center; justify-content: center;
          font-size: .32rem; font-weight: 800; flex-shrink: 0;
        }
        .lp-mock-sb-email { font-size: .29rem; color: #64748B; }

        .lp-mock-main {
          flex: 1; padding: .75rem 1rem; background: #F8FAFC; overflow: hidden;
          display: flex; flex-direction: column; gap: .45rem;
        }

        /* ── Admin-analytics mockup ── */
        .lp-mock-analytics-hd {
          display: flex; justify-content: space-between; align-items: flex-end; gap: .5rem;
        }
        .lp-mock-eyebrow {
          display: flex; align-items: center; gap: 3px;
          font-size: .3rem; font-weight: 700; color: #6366F1;
          text-transform: uppercase; letter-spacing: .08em; margin-bottom: .15rem;
        }
        .lp-mock-eyebrow-dot { width: 4px; height: 4px; border-radius: 50%; background: #6366F1; flex-shrink: 0; }
        .lp-mock-page-title { font-size: .6875rem; font-weight: 800; color: #0F172A; line-height: 1; letter-spacing: -.02em; }
        .lp-mock-page-sub { font-size: .3rem; color: #64748B; margin-top: .15rem; }
        .lp-mock-hd-right { display: flex; align-items: center; gap: .3rem; flex-shrink: 0; }
        .lp-mock-live-badge {
          display: flex; align-items: center; gap: 3px; padding: 2px 8px; border-radius: 100px;
          background: #dcfce7; border: 1px solid rgba(16,185,129,.25);
          font-size: .3rem; font-weight: 700; color: #059669; white-space: nowrap;
        }
        .lp-mock-live-dot { width: 5px; height: 5px; border-radius: 50%; background: #10b981; flex-shrink: 0; box-shadow: 0 0 4px #10b981; }
        .lp-mock-export-btn {
          display: flex; align-items: center; gap: 3px; padding: 2px 8px; border-radius: 6px;
          background: #fff; border: 1px solid #E2E8F0;
          font-size: .3rem; font-weight: 600; color: #475569; white-space: nowrap;
        }

        /* KPI grid */
        .lp-mock-kpi-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: .375rem; }
        .lp-mock-kpi {
          background: #fff; border-radius: 6px; border: 1px solid #E2E8F0;
          padding: .4rem .5rem; display: flex; flex-direction: column; gap: .2rem;
          transition: box-shadow .15s;
        }
        .lp-mock-kpi-top { display: flex; justify-content: space-between; align-items: flex-start; }
        .lp-mock-kpi-label {
          font-size: .275rem; font-weight: 700; color: #94A3B8;
          text-transform: uppercase; letter-spacing: .07em; margin-bottom: .1rem;
        }
        .lp-mock-kpi-value { font-size: .7rem; font-weight: 800; color: #0F172A; line-height: 1; letter-spacing: -.02em; }
        .lp-mock-kpi-icon {
          width: 14px; height: 14px; border-radius: 4px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .lp-mock-kpi-foot {
          padding-top: .2rem; border-top: 1px solid #f1f5f9;
          font-size: .275rem; font-weight: 600; color: #94A3B8;
        }

        /* 2-col: table + donut */
        .lp-mock-2col { display: grid; grid-template-columns: 1fr .6fr; gap: .375rem; flex: 1; min-height: 0; }
        .lp-mock-tbl-card {
          background: #fff; border-radius: 6px; border: 1px solid #E2E8F0;
          overflow: hidden; display: flex; flex-direction: column;
        }
        .lp-mock-tbl-hd {
          padding: .35rem .5rem; border-bottom: 1px solid #F1F5F9;
          display: flex; align-items: center; justify-content: space-between; background: #fff;
        }
        .lp-mock-tbl-hd-left { display: flex; flex-direction: column; gap: .1rem; }
        .lp-mock-tbl-hd-title {
          display: flex; align-items: center; gap: 4px;
          font-size: .4rem; font-weight: 800; color: #0F172A;
        }
        .lp-mock-tbl-badge {
          padding: 0 4px; border-radius: 100px;
          font-size: .3rem; font-weight: 800; background: #f1f5f9; color: #64748b;
        }
        .lp-mock-tbl-hd-sub { font-size: .3rem; color: #94A3B8; }
        .lp-mock-voir-tout {
          display: flex; align-items: center; gap: 2px; padding: 2px 7px; border-radius: 6px;
          background: #fff; border: 1px solid #E2E8F0;
          font-size: .3rem; font-weight: 600; color: #475569; white-space: nowrap; flex-shrink: 0;
        }
        .lp-mock-tbl-head {
          display: flex; gap: .25rem; padding: .22rem .5rem;
          background: #f8fafc; border-bottom: 1px solid #f1f5f9;
        }
        .lp-mock-tbl-hth {
          font-size: .27rem; font-weight: 700; color: #94A3B8;
          text-transform: uppercase; letter-spacing: .07em;
        }
        .lp-mock-tbl-row {
          display: flex; align-items: center; gap: .3rem;
          padding: .28rem .5rem; border-bottom: 1px solid #f8fafc;
          border-left: 2px solid transparent;
        }
        .lp-mock-tbl-row:last-child { border-bottom: none; }
        .lp-mock-tbl-avt {
          width: 13px; height: 13px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: .3rem; font-weight: 800; flex-shrink: 0;
        }
        .lp-mock-tbl-name { font-size: .35rem; font-weight: 600; color: #0F172A; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .lp-mock-tbl-co  { font-size: .325rem; color: #64748B; white-space: nowrap; }
        .lp-mock-tbl-status {
          font-size: .275rem; font-weight: 700; color: #059669;
          background: #dcfce7; padding: 1px 4px; border-radius: 100px; white-space: nowrap;
        }
        .lp-mock-tbl-ft {
          padding: .25rem .5rem; border-top: 1px solid #f1f5f9;
          background: #f8fafc; display: flex; justify-content: space-between;
          font-size: .28rem; color: #94A3B8; font-weight: 600; margin-top: auto;
        }

        /* Donut card */
        .lp-mock-donut-card {
          background: #fff; border-radius: 6px; border: 1px solid #E2E8F0;
          padding: .4rem .5rem; display: flex; flex-direction: column; gap: .35rem;
        }
        .lp-mock-donut-hd-row { display: flex; align-items: center; gap: .3rem; }
        .lp-mock-donut-hd-icon {
          width: 14px; height: 14px; border-radius: 4px;
          background: #EEF2FF; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .lp-mock-donut-hd { font-size: .4rem; font-weight: 800; color: #0F172A; line-height: 1; }
        .lp-mock-donut-sub { font-size: .28rem; color: #94A3B8; margin-top: .1rem; }
        .lp-mock-donut-body { display: flex; align-items: center; gap: .5rem; flex: 1; }
        .lp-mock-donut-legend { display: flex; flex-direction: column; gap: .3rem; flex: 1; }
        .lp-mock-donut-leg-row { display: flex; align-items: center; gap: .25rem; }
        .lp-mock-donut-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .lp-mock-donut-leg-label { font-size: .3rem; color: #64748B; flex: 1; }
        .lp-mock-donut-leg-pct {
          font-size: .3rem; font-weight: 700; padding: 1px 4px; border-radius: 100px;
        }
        .lp-mock-donut-leg-val { font-size: .35rem; font-weight: 800; color: #0F172A; }

        @media (max-width: 700px) {
          .lp-hero-mockup-wrap { display: none; }
          .lp-hero { padding-bottom: 3rem; }
        }
        @media (max-width: 600px) {
          .lp-hero-h1 { letter-spacing: -.025em; }
          .lp-hero-btns { flex-direction: column; align-items: stretch; }
          .lp-hero-btn-main, .lp-hero-btn-sec { justify-content: center; }
        }

        /* ── STATS BAR ── */
        .lp-stats-bar {
          border-top: 1px solid var(--bdr); border-bottom: 1px solid var(--bdr);
          padding: 2.25rem 2rem; background: #fff;
        }
        .lp-stats-grid {
          max-width: 1200px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem;
        }
        .lp-stat-item { text-align: center; }
        .lp-stat-value { font-size: 2rem; font-weight: 900; color: var(--p); line-height: 1; margin-bottom: .375rem; }
        .lp-stat-label { font-size: .875rem; color: var(--t2); }
        @media (max-width: 640px) { .lp-stats-grid { grid-template-columns: repeat(2, 1fr); gap: 1.5rem; } }

        /* ── SECTION SHARED ── */
        .lp-sec { padding: 5.5rem 2rem; }
        .lp-sec-alt { background: var(--sec); }
        .lp-inner { max-width: 1200px; margin: 0 auto; }
        .lp-hd { text-align: center; margin-bottom: 3rem; }
        .lp-tag {
          display: inline-block; border-radius: 100px; padding: 3px 12px;
          font-size: .6875rem; font-weight: 600; letter-spacing: .07em; text-transform: uppercase;
          margin-bottom: .75rem; background: var(--pl); color: var(--p); border: 1px solid var(--pb);
        }
        .lp-h2 {
          font-size: clamp(1.625rem, 3vw, 2.25rem); font-weight: 800;
          color: var(--t1); letter-spacing: -.025em; line-height: 1.2; margin-bottom: .875rem;
        }
        [dir="rtl"] .lp-h2 { letter-spacing: 0; }
        .lp-h2 .c { color: var(--p); }
        .lp-desc { color: var(--t2); font-size: 1rem; line-height: 1.75; max-width: 560px; margin: 0 auto; }

        /* ── FEATURES ── */
        .lp-feat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; }
        .lp-feat-card {
          background: #fff; border: 1px solid var(--bdr);
          border-radius: var(--r3); padding: 1.625rem 1.375rem;
          transition: box-shadow .2s, transform .2s, border-color .2s;
        }
        .lp-feat-card:hover { box-shadow: var(--sh-md); transform: translateY(-3px); border-color: var(--pb); }
        .lp-feat-ico {
          width: 48px; height: 48px; border-radius: 12px; margin-bottom: 1rem;
          background: var(--pl); color: var(--p);
          display: flex; align-items: center; justify-content: center;
        }
        .lp-feat-ttl { font-size: .9375rem; font-weight: 700; color: var(--t1); margin-bottom: .375rem; }
        .lp-feat-dsc { font-size: .8125rem; color: #64748b; line-height: 1.7; }
        @media (max-width: 1024px) { .lp-feat-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 480px)  { .lp-feat-grid { grid-template-columns: 1fr; } }

        /* ── WHO ── */
        .lp-who-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
        .lp-who-card {
          padding: 2rem 1.75rem; border-radius: var(--r3);
          border: 1px solid var(--bdr); background: #fff;
          box-shadow: var(--sh-sm);
          transition: box-shadow .2s, transform .2s, border-color .2s;
        }
        .lp-who-card:hover { box-shadow: var(--sh-lg); transform: translateY(-4px); border-color: var(--pb); }
        .lp-who-ico {
          width: 56px; height: 56px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center; margin-bottom: 1.25rem;
        }
        .lp-who-card h3 { font-size: 1.0625rem; font-weight: 700; color: var(--t1); margin-bottom: .625rem; }
        .lp-who-card p  { color: var(--t2); font-size: .9375rem; line-height: 1.8; }
        .lp-who-more {
          display: inline-flex; align-items: center; gap: 4px;
          color: var(--p); font-size: .875rem; font-weight: 600;
          text-decoration: none; margin-top: 1.125rem;
          transition: gap .15s;
        }
        .lp-who-more:hover { gap: 7px; }
        @media (max-width: 860px) { .lp-who-grid { grid-template-columns: 1fr; max-width: 420px; margin: 0 auto; } }

        /* ── HOW IT WORKS ── */
        .lp-how-steps {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 0; position: relative;
        }
        .lp-how-steps::before {
          content: '';
          position: absolute; top: 27px;
          left: calc(100% / 8); right: calc(100% / 8);
          height: 2px;
          background: linear-gradient(90deg, #6366F1, #8B5CF6);
          z-index: 0;
        }
        [dir="rtl"] .lp-how-steps::before {
          background: linear-gradient(270deg, #6366F1, #8B5CF6);
        }
        .lp-how-step { display: flex; flex-direction: column; align-items: center; gap: 1.25rem; text-align: center; padding: 0 .75rem; }
        .lp-how-circle {
          width: 56px; height: 56px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.25rem; font-weight: 800;
          box-shadow: 0 6px 20px rgba(99,102,241,.3);
          position: relative; z-index: 1;
        }
        .lp-how-step-ttl { font-size: 1rem; font-weight: 700; color: var(--t1); }
        .lp-how-step-dsc { color: #64748b; font-size: .875rem; line-height: 1.75; margin-top: -.25rem; }
        @media (max-width: 700px) {
          .lp-how-steps { grid-template-columns: repeat(2, 1fr); gap: 2.5rem; }
          .lp-how-steps::before { display: none; }
        }
        @media (max-width: 440px) { .lp-how-steps { grid-template-columns: 1fr; } }

        /* ── CTA SECTION ── */
        .lp-cta-sec {
          background: linear-gradient(135deg, #6366F1 0%, #7C3AED 100%);
          padding: 5.5rem 2rem; text-align: center; position: relative; overflow: hidden;
        }
        .lp-cta-sec::before {
          content: '';
          position: absolute; inset: 0; pointer-events: none;
          background-image: radial-gradient(circle, rgba(255,255,255,.08) 1px, transparent 1px);
          background-size: 28px 28px;
        }
        .lp-cta-h2 {
          font-size: clamp(1.75rem, 3.5vw, 2.625rem); font-weight: 800;
          color: #fff; margin-bottom: 1rem; letter-spacing: -.025em;
          position: relative; z-index: 1;
        }
        [dir="rtl"] .lp-cta-h2 { letter-spacing: 0; }
        .lp-cta-sub {
          color: rgba(255,255,255,.78); font-size: 1rem; line-height: 1.75;
          margin: 0 auto 2.5rem; max-width: 500px;
          position: relative; z-index: 1;
        }
        .lp-cta-btns {
          display: flex; gap: .75rem; justify-content: center; flex-wrap: wrap;
          position: relative; z-index: 1;
        }
        .lp-cta-btn-main {
          display: inline-flex; align-items: center; gap: 8px;
          background: #fff; color: #6366F1;
          padding: .875rem 2rem; border-radius: var(--r2);
          font-size: .9375rem; font-weight: 700; text-decoration: none;
          box-shadow: 0 4px 16px rgba(0,0,0,.12);
          transition: opacity .15s, transform .15s;
        }
        .lp-cta-btn-main:hover { opacity: .95; transform: translateY(-2px); }
        .lp-cta-btn-sec {
          display: inline-flex; align-items: center; gap: 7px;
          color: rgba(255,255,255,.9); background: rgba(255,255,255,.12);
          border: 1.5px solid rgba(255,255,255,.3);
          padding: .875rem 2rem; border-radius: var(--r2);
          font-size: .9375rem; font-weight: 600; text-decoration: none;
          transition: background .15s;
        }
        .lp-cta-btn-sec:hover { background: rgba(255,255,255,.2); }

        /* ── FOOTER ── */
        .lp-footer { background: #080f1e; padding: 3rem 2rem 1.5rem; }
        .lp-ft-in  { max-width: 1200px; margin: 0 auto; }
        .lp-ft-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 2rem; margin-bottom: 2rem; }
        .lp-ft-logo { display: flex; align-items: center; gap: 8px; text-decoration: none; margin-bottom: .875rem; }
        .lp-ft-logo-ico { width: 30px; height: 30px; border-radius: 7px; background: linear-gradient(135deg, #6366F1, #8B5CF6); display: flex; align-items: center; justify-content: center; }
        .lp-ft-logo-txt { font-size: 1rem; font-weight: 700; color: #fff; }
        .lp-ft-brand { color: rgba(255,255,255,.35); font-size: .875rem; line-height: 1.75; max-width: 220px; }
        .lp-ft-col h4 { color: rgba(255,255,255,.5); font-weight: 600; font-size: .6875rem; letter-spacing: .1em; text-transform: uppercase; margin-bottom: 1.125rem; }
        .lp-ft-col ul { list-style: none; display: flex; flex-direction: column; gap: .625rem; }
        .lp-ft-col a { color: rgba(255,255,255,.35); text-decoration: none; font-size: .875rem; transition: color .15s; }
        .lp-ft-col a:hover { color: rgba(255,255,255,.8); }
        .lp-ft-btm {
          border-top: 1px solid rgba(255,255,255,.07); padding-top: 1.5rem;
          display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: .75rem;
        }
        .lp-ft-btm p { color: rgba(255,255,255,.25); font-size: .8125rem; }
        @media (max-width: 1024px) { .lp-ft-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 640px)  { .lp-ft-grid { grid-template-columns: 1fr; } }
        @media (max-width: 520px)  { .lp-ft-grid { grid-template-columns: 1fr; } }

        /* ── RTL footer ── */
        [dir="rtl"] .lp-ft-grid { direction: rtl; }
        [dir="rtl"] .lp-ft-brand { max-width: unset; }
        [dir="rtl"] .lp-ft-btm { direction: rtl; }
      `}</style>

      <div className="lp">

        {/* ── NAV ── */}
        <nav className={`lp-nav${scrolled ? ' scrolled' : ''}`}>
          <div className="lp-nav-inner">
            <Link to="/" className="lp-logo">
              <div className="lp-logo-icon"><GraduationCap size={17} color="#fff" /></div>
              <span className="lp-logo-text">intern<span>Hub</span></span>
            </Link>
            <div className="lp-nav-links">
              <a href="#accueil"  className="lp-nav-link">{t('landing.nav.home')}</a>
              <a href="#features" className="lp-nav-link">{t('landing.nav.features')}</a>
              <a href="#apropos"  className="lp-nav-link">{t('landing.nav.about')}</a>
              <a href="#comment"  className="lp-nav-link">{t('landing.nav.howItWorks')}</a>
            </div>
            <div className="lp-nav-cta">
              <LpLangSwitcher />
              <Link to="/login"    className="lp-btn-out">{t('landing.nav.login')}</Link>
              <Link to="/register" className="lp-btn-pri">{t('landing.nav.register')} <ChevronRight size={14} /></Link>
            </div>
            <button className="lp-burger" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
          {menuOpen && (
            <div className="lp-mob">
              <a href="#accueil"  onClick={() => setMenuOpen(false)}>{t('landing.nav.home')}</a>
              <a href="#features" onClick={() => setMenuOpen(false)}>{t('landing.nav.features')}</a>
              <a href="#apropos"  onClick={() => setMenuOpen(false)}>{t('landing.nav.about')}</a>
              <a href="#comment"  onClick={() => setMenuOpen(false)}>{t('landing.nav.howItWorks')}</a>
              <div style={{ display:'flex', flexDirection:'column', gap:'.5rem', marginTop:'.5rem', paddingTop:'.5rem', borderTop:'1px solid var(--bdr)' }}>
                <LpLangSwitcher />
                <Link to="/login"    onClick={() => setMenuOpen(false)} style={{ padding:'.65rem .75rem', border:'1.5px solid var(--bdr)', borderRadius:'var(--r2)', textAlign:'center', color:'var(--t2)', textDecoration:'none', fontWeight:600 }}>{t('landing.nav.login')}</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} style={{ padding:'.65rem .75rem', background:'linear-gradient(135deg,#6366F1,#8B5CF6)', borderRadius:'var(--r2)', textAlign:'center', color:'#fff', textDecoration:'none', fontWeight:600 }}>{t('landing.nav.register')}</Link>
              </div>
            </div>
          )}
        </nav>

        {/* ── HERO ── */}
        <section id="accueil" className="lp-hero">
          <div className="lp-hero-bg" />

          <div className="lp-hero-inner">
            <div className="lp-hero-badge">
              <span className="lp-hero-badge-pulse" />
              <span className="lp-hero-badge-txt">{t('landing.hero.badge')}</span>
            </div>

            <h1 className="lp-hero-h1">
              {t('landing.hero.h1Before')} <span className="acc">{t('landing.hero.h1Accent')}</span>{t('landing.hero.h1After') ? ' ' + t('landing.hero.h1After') : ''}
            </h1>

            <p className="lp-hero-sub">{t('landing.hero.subtitle')}</p>

            <div className="lp-hero-btns">
              <Link to="/register" className="lp-hero-btn-main">{t('landing.hero.cta')} <ArrowRight size={16} /></Link>
              <Link to="/login"    className="lp-hero-btn-sec">{t('landing.hero.ctaSecondary')}</Link>
            </div>
          </div>

          {/* Dashboard mockup — kept in French as a realistic UI preview */}
          <div className="lp-hero-mockup-wrap">
            <div className="lp-mockup">
              <div className="lp-mockup-bar">
                <span className="lp-mock-dot" style={{ background:'#FF5F57' }} />
                <span className="lp-mock-dot" style={{ background:'#FEBC2E' }} />
                <span className="lp-mock-dot" style={{ background:'#28C840' }} />
                <span className="lp-mockup-url">internhub.app/espace/admin/analytics</span>
              </div>
              <div className="lp-mockup-body">
                <div className="lp-mock-app-topbar">
                  <div className="lp-mock-topbar-burger"><span /><span /><span /></div>
                  <div className="lp-mock-topbar-right">
                    <div className="lp-mock-topbar-icon">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                    </div>
                    <div className="lp-mock-topbar-icon">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                    </div>
                    <span className="lp-mock-topbar-admin">ADMIN</span>
                    <div className="lp-mock-topbar-icon">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    </div>
                  </div>
                </div>
                <div className="lp-mock-app-content">
                  <div className="lp-mock-sidebar">
                    <div className="lp-mock-sb-logo">
                      <div className="lp-mock-sb-logo-icon"><GraduationCap size={11} color="#fff" /></div>
                      <div>
                        <div className="lp-mock-sb-logo-name">internHub</div>
                        <div className="lp-mock-sb-logo-sub">Gestion de stages</div>
                      </div>
                    </div>
                    <div className="lp-mock-sb-section">Administration</div>
                    {[
                      { label:"Vue d'ensemble", active: true },
                      { label:'Gestion des Chefs' },
                      { label:'Utilisateurs' },
                      { label:'Modération Offres' },
                      { label:'Archives' },
                      { label:"Journal d'Activité" },
                    ].map(({ label, active }) => (
                      <div key={label} className={`lp-mock-sb-item${active ? ' active' : ''}`}>
                        <span className="lp-mock-sb-dot" />{label}
                      </div>
                    ))}
                    <div className="lp-mock-sb-section" style={{ marginTop: '.25rem' }}>Compte</div>
                    {['Paramètres','Déconnexion'].map(l => (
                      <div key={l} className="lp-mock-sb-item"><span className="lp-mock-sb-dot" />{l}</div>
                    ))}
                    <div className="lp-mock-sb-user">
                      <div className="lp-mock-sb-av">A</div>
                      <div>
                        <div className="lp-mock-sb-email" style={{ color:'#0F172A', fontWeight:700, fontSize:'.3rem' }}>admin</div>
                        <div className="lp-mock-sb-email">admin@internhub.app</div>
                      </div>
                    </div>
                  </div>
                  <div className="lp-mock-main">
                    <div className="lp-mock-analytics-hd">
                      <div>
                        <div className="lp-mock-eyebrow"><span className="lp-mock-eyebrow-dot" />Administration · Tableau de bord</div>
                        <div className="lp-mock-page-title">Tableau de Bord Global</div>
                        <div className="lp-mock-page-sub">Supervision en temps réel de la plateforme</div>
                      </div>
                      <div className="lp-mock-hd-right">
                        <div className="lp-mock-live-badge"><span className="lp-mock-live-dot" /> Système actif</div>
                        <div className="lp-mock-export-btn">
                          <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          Exporter PDF
                        </div>
                      </div>
                    </div>
                    <div className="lp-mock-kpi-grid">
                      {[
                        { label:'Étudiants',     value:'1 247', sub:'10 en stage actuellement', color:'#0D9488', bg:'rgba(20,184,166,.12)' },
                        { label:'Entreprises',    value:'89',    sub:'8 offres actives publiées', color:'#EA580C', bg:'rgba(249,115,22,.12)' },
                        { label:'Offres Actives', value:'47',    sub:'Sur 12 offres au total',    color:'#1B6EF3', bg:'rgba(27,110,243,.12)' },
                        { label:'Candidatures',   value:'342',   sub:'40% taux de placement',     color:'#7C3AED', bg:'rgba(139,92,246,.12)' },
                      ].map(({ label, value, sub, color, bg }) => (
                        <div key={label} className="lp-mock-kpi" style={{ borderTop: `2px solid ${color}` }}>
                          <div className="lp-mock-kpi-top">
                            <div>
                              <div className="lp-mock-kpi-label">{label}</div>
                              <div className="lp-mock-kpi-value">{value}</div>
                            </div>
                            <div className="lp-mock-kpi-icon" style={{ background: bg }}>
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                            </div>
                          </div>
                          <div className="lp-mock-kpi-foot" style={{ color }}>↑ {sub}</div>
                        </div>
                      ))}
                    </div>
                    <div className="lp-mock-2col">
                      <div className="lp-mock-tbl-card">
                        <div className="lp-mock-tbl-hd">
                          <div className="lp-mock-tbl-hd-left">
                            <div className="lp-mock-tbl-hd-title">Placements Récents <span className="lp-mock-tbl-badge">5</span></div>
                            <div className="lp-mock-tbl-hd-sub">Derniers étudiants placés en stage</div>
                          </div>
                          <div className="lp-mock-voir-tout">
                            Voir tout
                            <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                          </div>
                        </div>
                        <div className="lp-mock-tbl-head">
                          <span className="lp-mock-tbl-hth" style={{ flex:1 }}>Étudiant</span>
                          <span className="lp-mock-tbl-hth" style={{ flex:1 }}>Entreprise</span>
                          <span className="lp-mock-tbl-hth">Statut</span>
                        </div>
                        {[
                          { name:'Amina Djouder', co:'TechCorp DZ', av:'rgba(27,110,243,.12)',  fg:'#1B6EF3' },
                          { name:'Karim Benali',  co:'StartupX',    av:'rgba(16,184,166,.12)',  fg:'#0D9488' },
                          { name:'Sara Lamine',   co:'InnoLab',     av:'rgba(249,115,22,.12)',  fg:'#EA580C' },
                          { name:'Omar Drouiche', co:'DataWorks',   av:'rgba(139,92,246,.12)',  fg:'#7C3AED' },
                        ].map(row => (
                          <div key={row.name} className="lp-mock-tbl-row">
                            <div className="lp-mock-tbl-avt" style={{ background: row.av, color: row.fg }}>{row.name[0]}</div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div className="lp-mock-tbl-name">{row.name}</div>
                              <div style={{ fontSize:'.28rem', color:'#94A3B8' }}>Stagiaire</div>
                            </div>
                            <span className="lp-mock-tbl-co" style={{ flex:1 }}>{row.co}</span>
                            <span className="lp-mock-tbl-status">● Placé</span>
                          </div>
                        ))}
                        <div className="lp-mock-tbl-ft">
                          <span>5 placements récents</span>
                          <span style={{ color:'#059669' }}>40% taux global</span>
                        </div>
                      </div>
                      <div className="lp-mock-donut-card">
                        <div className="lp-mock-donut-hd-row">
                          <div className="lp-mock-donut-hd-icon">
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                          </div>
                          <div>
                            <div className="lp-mock-donut-hd">Pipeline</div>
                            <div className="lp-mock-donut-sub">Répartition des candidatures</div>
                          </div>
                        </div>
                        <div className="lp-mock-donut-body">
                          <svg viewBox="0 0 100 100" width="80" height="80" style={{ flexShrink:0 }}>
                            <circle cx="50" cy="50" r="36" fill="none" stroke="#F1F5F9" strokeWidth="13" />
                            <circle cx="50" cy="50" r="36" fill="none" stroke="#10b981" strokeWidth="13" strokeDasharray="43 183" strokeLinecap="round" transform="rotate(-90 50 50)" />
                            <circle cx="50" cy="50" r="36" fill="none" stroke="#1B6EF3" strokeWidth="13" strokeDasharray="52 174" strokeDashoffset="-45" strokeLinecap="round" transform="rotate(-90 50 50)" />
                            <circle cx="50" cy="50" r="36" fill="none" stroke="#f59e0b" strokeWidth="13" strokeDasharray="131 95" strokeDashoffset="-99" strokeLinecap="round" transform="rotate(-90 50 50)" />
                            <text x="50" y="47" textAnchor="middle" fontSize="13" fontWeight="800" fill="#0F172A">43</text>
                            <text x="50" y="57" textAnchor="middle" fontSize="6" fill="#94A3B8" fontWeight="600">TOTAL</text>
                          </svg>
                          <div className="lp-mock-donut-legend">
                            {[
                              { c:'#10b981', label:'Terminés',     val:'8',  pct:'19%', bg:'rgba(16,185,129,.1)' },
                              { c:'#1B6EF3', label:'En cours',     val:'10', pct:'23%', bg:'rgba(27,110,243,.1)' },
                              { c:'#f59e0b', label:'Candidatures', val:'25', pct:'58%', bg:'rgba(245,158,11,.1)' },
                            ].map(s => (
                              <div key={s.label} className="lp-mock-donut-leg-row">
                                <span className="lp-mock-donut-dot" style={{ background: s.c }} />
                                <span className="lp-mock-donut-leg-label">{s.label}</span>
                                <span className="lp-mock-donut-leg-val">{s.val}</span>
                                <span className="lp-mock-donut-leg-pct" style={{ color: s.c, background: s.bg }}>{s.pct}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS BAR ── */}
        <div className="lp-stats-bar">
          <div className="lp-stats-grid">
            {[
              { value:'500+', key:'students'     },
              { value:'200+', key:'companies'    },
              { value:'50+',  key:'schools'      },
              { value:'98%',  key:'satisfaction' },
            ].map(s => (
              <div key={s.key} className="lp-stat-item">
                <div className="lp-stat-value">{s.value}</div>
                <div className="lp-stat-label">{t(`landing.stats.${s.key}`)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FEATURES ── */}
        <section id="features" className="lp-sec lp-sec-alt">
          <div className="lp-inner">
            <div className="lp-hd">
              <span className="lp-tag">{t('landing.features.tag')}</span>
              <h2 className="lp-h2">{t('landing.features.h2Before')} <span className="c">{t('landing.features.h2Accent')}</span>{t('landing.features.h2After')}</h2>
              <p className="lp-desc">{t('landing.features.desc')}</p>
            </div>
            <div className="lp-feat-grid">
              {FEATURES.map((f, i) => (
                <div key={i} className="lp-feat-card">
                  <div className="lp-feat-ico">{f.icon}</div>
                  <div className="lp-feat-ttl">{t(`landing.features.items.${i}.title`)}</div>
                  <div className="lp-feat-dsc">{t(`landing.features.items.${i}.desc`)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHO WE ARE ── */}
        <section id="apropos" className="lp-sec">
          <div className="lp-inner">
            <div className="lp-hd">
              <span className="lp-tag">{t('landing.about.tag')}</span>
              <h2 className="lp-h2">{t('landing.about.h2Before')} <span className="c">{t('landing.about.h2Accent')}</span>{t('landing.about.h2After')}</h2>
              <p className="lp-desc">{t('landing.about.desc')}</p>
            </div>
            <div className="lp-who-grid">
              {WHO_ICONS.map((w, i) => (
                <div key={i} className="lp-who-card">
                  <div className="lp-who-ico" style={{ background: w.bg, color: w.color }}>{w.icon}</div>
                  <h3>{t(`landing.about.cards.${i}.title`)}</h3>
                  <p>{t(`landing.about.cards.${i}.desc`)}</p>
                  <a href="#" className="lp-who-more">
                    {t('landing.about.learnMore')} {isRTL ? null : <ChevronRight size={14} />}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="comment" className="lp-sec lp-sec-alt">
          <div className="lp-inner">
            <div className="lp-hd">
              <span className="lp-tag">{t('landing.howItWorks.tag')}</span>
              <h2 className="lp-h2">{t('landing.howItWorks.h2Before')} <span className="c">{t('landing.howItWorks.h2Accent')}</span>{t('landing.howItWorks.h2After')}</h2>
              <p className="lp-desc">{t('landing.howItWorks.desc')}</p>
            </div>
            <div className="lp-how-steps">
              {[1,2,3,4].map((n, i) => (
                <div key={n} className="lp-how-step">
                  <div className="lp-how-circle">{n}</div>
                  <div className="lp-how-step-ttl">{t(`landing.howItWorks.steps.${i}.title`)}</div>
                  <div className="lp-how-step-dsc">{t(`landing.howItWorks.steps.${i}.desc`)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="lp-cta-sec">
          <h2 className="lp-cta-h2">{t('landing.cta.title')}</h2>
          <p className="lp-cta-sub">{t('landing.cta.subtitle')}</p>
          <div className="lp-cta-btns">
            <Link to="/register" className="lp-cta-btn-main">{t('landing.cta.main')} <ArrowRight size={16}/></Link>
            <Link to="/login"    className="lp-cta-btn-sec">{t('landing.cta.secondary')}</Link>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="lp-footer">
          <div className="lp-ft-in">
            <div className="lp-ft-grid">
              <div>
                <Link to="/" className="lp-ft-logo">
                  <div className="lp-ft-logo-ico"><GraduationCap size={16} color="#fff" /></div>
                  <span className="lp-ft-logo-txt">internHub</span>
                </Link>
                <p className="lp-ft-brand">{t('landing.footer.brand')}</p>
              </div>
              <div className="lp-ft-col">
                <h4>{t('landing.footer.platform')}</h4>
                <ul>
                  {(t('landing.footer.platformLinks', { returnObjects: true }) || []).map((l, i) => (
                    <li key={i}><a href="#">{l}</a></li>
                  ))}
                </ul>
              </div>
              <div className="lp-ft-col">
                <h4>{t('landing.footer.info')}</h4>
                <ul>
                  {(t('landing.footer.infoLinks', { returnObjects: true }) || []).map((l, i) => (
                    <li key={i}><a href="#">{l}</a></li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="lp-ft-btm">
              <p>{t('landing.footer.copyright')}</p>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
