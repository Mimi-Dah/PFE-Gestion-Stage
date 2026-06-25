import api from './api';

const EvaluationService = {
  list: (tab = 'entreprise') => {
    const endpoint = tab === 'auto' ? 'evaluations/auto/' : 'evaluations/';
    return api.get(endpoint).then(r => r.data);
  },
};

export default EvaluationService;
