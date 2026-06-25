import api from './api';

const AuthService = {
  login: async (credentials) => {
    const { email, password } = credentials;
    return await api.safeRequest(api.post('auth/login/', { courriel: email, password }));
  },

  register: async ({ email, first_name, last_name, password, role, universite, departement, specialite, niveau, matricule }) => {
    const formData = new FormData();
    formData.append('courriel',          email);
    formData.append('prenom',            first_name);
    formData.append('nom',               last_name);
    formData.append('password',          password);
    formData.append('role',              role);
    if (universite)       formData.append('universite',       universite);
    if (specialite)       formData.append('specialite',       specialite);
    if (matricule)        formData.append('matricule',        matricule);
    if (niveau)           formData.append('niveau_academique', niveau);
    if (departement)      formData.append('departement',      departement);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);

    if (__DEV__) {
      console.debug('[REGISTER] POST auth/register/', { courriel: email, prenom: first_name, nom: last_name, role });
    }

    const result = await api.safeRequest(
      api.post('auth/register/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        signal: controller.signal,
      })
    );

    clearTimeout(timer);

    if (__DEV__) {
      if (result.ok) {
        console.debug('[REGISTER] ✓ 201 créé →', result.value.data);
      } else {
        const e = result.error;
        console.debug('[REGISTER] ✗', e?.name, e?.code, e?.message, e?.response?.data ?? '(pas de réponse)');
      }
    }

    return result;
  },

  getUserProfile: async () => {
    return await api.safeRequest(api.get('auth/me/'));
  },

  logout: async () => {
    // Token clearing is handled by the store
  },
};

export default AuthService;
