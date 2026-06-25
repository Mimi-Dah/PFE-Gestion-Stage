const DRF_CODE_MESSAGES = {
  unique:                    'Cette valeur est déjà utilisée.',
  required:                  'Ce champ est requis.',
  blank:                     'Ce champ ne peut pas être vide.',
  null:                      'Ce champ ne peut pas être nul.',
  invalid:                   'Format invalide.',
  min_length:                'Trop court.',
  max_length:                'Trop long.',
  does_not_exist:            'Valeur introuvable.',
  password_too_short:        'Mot de passe trop court (8 caractères minimum).',
  password_too_common:       'Mot de passe trop commun.',
  password_too_similar:      'Mot de passe trop similaire à vos informations personnelles.',
  password_entirely_numeric: 'Le mot de passe ne peut pas être uniquement numérique.',
};

// Surcharges par champ — priorité sur le dictionnaire générique
const FIELD_OVERRIDES = {
  courriel: {
    unique:   'Cet email est déjà utilisé.',
    invalid:  "Format d'email invalide.",
    required: "L'email est requis.",
    blank:    "L'email ne peut pas être vide.",
  },
  password: {
    required: 'Le mot de passe est requis.',
    blank:    'Le mot de passe ne peut pas être vide.',
  },
};

/**
 * Traduit un item d'erreur DRF en message français.
 * Accepte { message, code } (format post-fix backend) ou string (fallback).
 */
function translateItem(field, item) {
  const code = item?.code ?? null;
  const overrides = FIELD_OVERRIDES[field] ?? {};

  if (code && overrides[code])          return overrides[code];
  if (code && DRF_CODE_MESSAGES[code])  return DRF_CODE_MESSAGES[code];
  if (typeof item === 'string')         return item;
  if (item?.message)                    return item.message;
  return 'Champ invalide.';
}

/**
 * Convertit l'objet details du backend en messages français par champ.
 * Entrée  : { courriel: [{code, message}], password: [...] }
 * Sortie  : { courriel: "Cet email est déjà utilisé.", password: "..." }
 */
export function formatValidationErrors(details) {
  if (!details || typeof details !== 'object' || Array.isArray(details)) return {};

  const result = {};
  for (const [field, items] of Object.entries(details)) {
    const list = Array.isArray(items) ? items : [items];
    if (list.length > 0) {
      result[field] = translateItem(field, list[0]);
    }
  }
  return result;
}

/**
 * Retourne le premier message d'erreur sous forme de string (pour Alert ou boîte globale).
 */
export function getFirstValidationMessage(details) {
  const fieldMessages = formatValidationErrors(details);
  return Object.values(fieldMessages)[0] ?? 'Certains champs sont invalides.';
}

/**
 * Traduit une erreur API globale (non-validation) en message français.
 * Utilisable sur tous les écrans : Login, ForgotPassword, ResetPassword, etc.
 */
export function translateError(err) {
  if (!err) return 'Une erreur inattendue est survenue.';
  if (err.code === 'NETWORK_ERROR')    return 'Serveur inaccessible. Vérifiez votre connexion.';
  if (err.code === 'UNAUTHORIZED')     return 'Email ou mot de passe incorrect.';
  if (err.code === 'VALIDATION_ERROR') return getFirstValidationMessage(err.details);
  return err.message || 'Une erreur inattendue est survenue.';
}
