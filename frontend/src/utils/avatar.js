/* Verona-style avatar helpers — used across all list pages */

/** Returns a CSS class name (vl-c0 … vl-c5) based on the first char of a name */
export const avC = (name) => {
  if (!name) return 'vl-c5';
  return `vl-c${name.charCodeAt(0) % 6}`;
};

/** Returns up to 2 uppercase initials from firstName + lastName */
export const initials = (first, last) =>
  ((first?.[0] || '') + (last?.[0] || '')).toUpperCase() || '?';

/** Single-string initials (e.g. company name "Google" → "GO") */
export const initialsFrom = (name) => {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};
