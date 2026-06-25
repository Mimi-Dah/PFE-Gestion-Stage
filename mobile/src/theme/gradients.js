import { palette } from './colors';

export const gradients = {
  // Fond clair neutre
  background:     [palette.slate[50], palette.slate[100]],
  backgroundDark: [palette.slate[900], palette.slate[800]],

  // CTA principal — bleu vif
  action:         [palette.blue[500], palette.blue[600]],

  // Brand — bleu profond
  primary:        [palette.blue[500], palette.blue[700]],

  // Accent — ambre
  accent:         [palette.amber[500], palette.amber[600]],

  // AI gradient — indigo (signature IA)
  ai:             [palette.indigo[500], palette.indigo[700]],

  // Legacy alias
  accentBlue:     [palette.indigo[500], palette.indigo[600]],
};
