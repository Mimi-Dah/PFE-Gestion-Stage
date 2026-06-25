const LOCALE_MAP = { fr: 'fr-FR', en: 'en-US', ar: 'ar-EG' };

export const dateLocale = (lang) => LOCALE_MAP[lang] || 'fr-FR';
