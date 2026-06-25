// internHub Design System — palette officielle
// Primary  = #1B6EF3 (Bleu Vif — confiance, navigation, CTA)
// Action   = #10B981 (Émeraude — succès, croissance)
// Accent   = #F59E0B (Ambre — notifications, highlights)
// Neutral  = #F1F5F9 (Slate — fonds, cartes, sections)
// Text     = #0F172A (Slate 900 — lisibilité optimale)

export const palette = {
  // ── Brand Blue ──
  blue: {
    50:  '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#1B6EF3',  // primary
    600: '#1557CC',  // primary-hover
    700: '#1043A0',
    800: '#0D3380',
    900: '#082460',
  },
  // ── Slate / Neutral ──
  slate: {
    50:  '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
  // ── Emerald (success / action) ──
  emerald: {
    50:  '#ECFDF5',
    100: '#D1FAE5',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
  },
  // ── Amber (accent / warning) ──
  amber: {
    50:  '#FFFBEB',
    100: '#FEF3C7',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
  },
  // ── Red (danger) ──
  red: {
    50:  '#FEF2F2',
    100: '#FEE2E2',
    400: '#EF4444',
    500: '#DC2626',
    600: '#B91C1C',
  },
  // ── Indigo (AI gradient) ──
  indigo: {
    400: '#818CF8',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
  },
  white: '#FFFFFF',
};

export const light = {
  bg:           palette.slate[50],     // #F8FAFC
  bgCard:       palette.white,
  bgInput:      palette.white,
  bgMuted:      palette.slate[100],    // #F1F5F9
  border:       palette.slate[200],    // #E2E8F0
  text:         palette.slate[900],    // #0F172A
  textSub:      palette.slate[700],    // #334155
  textMuted:    palette.slate[400],    // #94A3B8
  primary:      palette.blue[500],     // #1B6EF3
  primaryLight: palette.blue[300],     // #93C5FD
  primarySoft:  palette.blue[50],      // #EFF6FF
  action:       palette.emerald[500],  // #10B981
  actionSoft:   palette.emerald[50],   // #ECFDF5
  success:      palette.emerald[500],  // #10B981
  successSoft:  palette.emerald[50],
  accent:       palette.amber[500],    // #F59E0B
  accentSoft:   palette.amber[50],     // #FFFBEB
  warning:      palette.amber[500],    // #F59E0B
  danger:       palette.red[400],      // #EF4444
  errorSurface: palette.red[50],       // #FEF2F2
  errorText:    palette.red[400],
  overlay:      'rgba(15,23,42,0.5)',
  star:         palette.amber[500],
  gradientStart: palette.slate[50],
  gradientEnd:   palette.slate[100],
};

export const dark = {
  bg:           palette.slate[900],    // #0F172A
  bgCard:       palette.slate[800],    // #1E293B
  bgInput:      palette.slate[800],
  bgMuted:      '#162032',
  border:       'rgba(255,255,255,0.08)',
  text:         palette.slate[50],     // #F8FAFC
  textSub:      palette.slate[300],    // #CBD5E1
  textMuted:    palette.slate[500],    // #64748B
  primary:      palette.blue[300],     // #93C5FD
  primaryLight: palette.blue[200],
  primarySoft:  'rgba(27,110,243,0.15)',
  action:       palette.emerald[400],  // #34D399
  actionSoft:   'rgba(16,185,129,0.15)',
  success:      palette.emerald[400],
  successSoft:  'rgba(16,185,129,0.15)',
  accent:       palette.amber[400],    // #FBBF24
  accentSoft:   'rgba(245,158,11,0.15)',
  warning:      palette.amber[400],
  danger:       palette.red[400],
  errorSurface: 'rgba(239,68,68,0.12)',
  errorText:    '#EF4444',
  overlay:      'rgba(0,0,0,0.75)',
  star:         palette.amber[400],
  gradientStart: palette.slate[900],
  gradientEnd:   palette.slate[800],
};

export function getColors(isDark) {
  return isDark ? dark : light;
}
