import { F } from './fonts';

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48, xxxl: 64, huge: 96 };

export const radius = { sm: 8, md: 12, lg: 16, card: 16, xl: 20, xxl: 24, pill: 999 };

export const shadow = {
  none: {},
  soft: { shadowColor: '#0F172A', shadowOpacity: 0.04, shadowRadius: 4,  shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  sm:   { shadowColor: '#0F172A', shadowOpacity: 0.06, shadowRadius: 6,  shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  md:   { shadowColor: '#0F172A', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  card: { shadowColor: '#0F172A', shadowOpacity: 0.06, shadowRadius: 8,  shadowOffset: { width: 0, height: 2 }, elevation: 2 },
};

// Typography — Plus Jakarta Sans (titres) + Inter (corps) — grille 8px
export const typography = {
  h1:      { fontFamily: F.displayBold,  fontSize: 28, lineHeight: 36, letterSpacing: -0.3 },
  h2:      { fontFamily: F.displayBold,  fontSize: 22, lineHeight: 30, letterSpacing: -0.2 },
  h3:      { fontFamily: F.displaySemi,  fontSize: 18, lineHeight: 26, letterSpacing: -0.1 },
  body:    { fontFamily: F.reg,          fontSize: 15, lineHeight: 24 },
  label:   { fontFamily: F.semi,         fontSize: 14, lineHeight: 20, letterSpacing: 0.1 },
  caption: { fontFamily: F.reg,          fontSize: 13, lineHeight: 20 },
  small:   { fontFamily: F.med,          fontSize: 12, lineHeight: 18 },
  button:  { fontFamily: F.semi,         fontSize: 15, letterSpacing: 0.2 },
  buttonSm:{ fontFamily: F.semi,         fontSize: 13, letterSpacing: 0.1 },
};
