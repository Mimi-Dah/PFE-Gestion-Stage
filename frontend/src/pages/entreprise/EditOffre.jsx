import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Save, Briefcase, MapPin, Calendar, CircleDollarSign, Users, Wifi } from 'lucide-react';
import api from '../../services/api';

const fieldLabel = {
  display: 'flex', alignItems: 'center', gap: '5px',
  fontSize: '0.75rem', fontWeight: '700',
  color: 'var(--text-muted)', textTransform: 'uppercase',
  letterSpacing: '0.05em', marginBottom: '0.4rem',
};

/* ── Form body — shared between page and popup modes ────────── */
const EditOffreForm = ({ id, isPopup, onClose }) => {
  const { t } = useTranslation();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [isLoading, setIsLoading]   = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [apiError, setApiError]     = useState('');
  const navigate = useNavigate();

  const { data: departements = [] } = useQuery({
    queryKey: ['departements'],
    queryFn: async () => {
      const res = await api.get('etablissements/departements/');
      return res.data.results ?? res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const fetchOffer = async () => {
      const result = await api.safeRequest(api.get(`offres/${id}/`));
      if (result.ok) {
        const data = result.value.data;
        reset({ ...data, departement_id: data.departement ?? '' });
      } else {
        setApiError(t('pages.entreprise.editOffre.errorLoad'));
      }
      setIsFetching(false);
    };
    fetchOffer();
  }, [id, reset, t]);

  const handleClose = () => {
    if (onClose) onClose();
    else navigate('/espace/entreprise/offres');
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setApiError('');
    const updateData = { ...data };
    delete updateData.id;
    delete updateData.id_offre;
    delete updateData.entreprise;
    delete updateData.publie_le;
    delete updateData.duree_semaines;
    delete updateData.departement;
    if (updateData.departement_id) updateData.departement_id = Number(updateData.departement_id);
    const result = await api.safeRequest(api.patch(`offres/${id}/`, updateData));
    if (result.ok) {
      handleClose();
    } else {
      setApiError(result.error.message || t('pages.entreprise.editOffre.errorLoad'));
    }
    setIsLoading(false);
  };

  if (isFetching) return (
    <div style={{ padding: isPopup ? '3rem' : '5rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '600' }}>
      {t('pages.entreprise.editOffre.loading')}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {apiError && (
        <div style={{ backgroundColor: 'var(--error-light)', color: 'var(--error)', padding: '0.875rem 1.125rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '600', border: '1px solid rgba(239,68,68,0.2)' }}>
          {apiError}
        </div>
      )}

      {/* Titre */}
      <div>
        <label htmlFor="titre" style={fieldLabel}>
          <Briefcase size={12} color="var(--primary)" />{t('pages.entreprise.editOffre.labelTitle')} <span style={{ color: 'var(--error)', marginLeft: 2 }}>*</span>
        </label>
        <input id="titre" {...register('titre', { required: t('pages.entreprise.editOffre.required') })} />
        {errors.titre && <span style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{errors.titre.message}</span>}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" style={fieldLabel}>
          {t('pages.entreprise.editOffre.labelDescription')} <span style={{ color: 'var(--error)', marginLeft: 2 }}>*</span>
        </label>
        <textarea id="description" rows="5" {...register('description', { required: t('pages.entreprise.editOffre.required'), minLength: 100 })} />
        {errors.description && <span style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{t('pages.entreprise.editOffre.minChars')}</span>}
      </div>

      {/* Exigences */}
      <div>
        <label htmlFor="exigences" style={fieldLabel}>{t('pages.entreprise.editOffre.labelSkills')}</label>
        <textarea id="exigences" rows="3" {...register('exigences')} />
      </div>

      {/* Row: Date début + Date fin */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label htmlFor="date_debut" style={fieldLabel}>
            <Calendar size={12} color="var(--primary)" />{t('pages.entreprise.editOffre.labelStartDate')} <span style={{ color: 'var(--error)', marginLeft: 2 }}>*</span>
          </label>
          <input id="date_debut" type="date" {...register('date_debut', { required: t('pages.entreprise.editOffre.required') })} />
          {errors.date_debut && <span style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{errors.date_debut.message}</span>}
        </div>
        <div>
          <label htmlFor="date_fin" style={fieldLabel}>
            <Calendar size={12} color="var(--primary)" />{t('pages.entreprise.editOffre.labelEndDate')} <span style={{ color: 'var(--error)', marginLeft: 2 }}>*</span>
          </label>
          <input id="date_fin" type="date" {...register('date_fin', { required: t('pages.entreprise.editOffre.required') })} />
          {errors.date_fin && <span style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{errors.date_fin.message}</span>}
        </div>
      </div>

      {/* Row: Localisation + Département */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label htmlFor="localisation" style={fieldLabel}>
            <MapPin size={12} color="var(--primary)" />{t('pages.entreprise.editOffre.labelLocation')} <span style={{ color: 'var(--error)', marginLeft: 2 }}>*</span>
          </label>
          <input id="localisation" {...register('localisation', { required: t('pages.entreprise.editOffre.required') })} />
          {errors.localisation && <span style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{errors.localisation.message}</span>}
        </div>
        <div>
          <label htmlFor="departement_id" style={fieldLabel}>
            {t('pages.entreprise.editOffre.labelDept')} <span style={{ color: 'var(--error)', marginLeft: 2 }}>*</span>
          </label>
          <select id="departement_id" {...register('departement_id', { required: t('pages.entreprise.editOffre.required') })}>
            <option value="">{t('pages.entreprise.editOffre.selectDept')}</option>
            {departements.map(d => (
              <option key={d.id} value={d.id}>{d.nom}</option>
            ))}
          </select>
          {errors.departement_id && <span style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{errors.departement_id.message}</span>}
        </div>
      </div>

      {/* Row: Gratification + Places + Statut */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        <div>
          <label htmlFor="gratification" style={fieldLabel}>
            <CircleDollarSign size={12} color="var(--primary)" />{t('pages.entreprise.editOffre.labelAllowance')}
          </label>
          <input id="gratification" type="number" step="0.01" {...register('gratification')} />
        </div>
        <div>
          <label htmlFor="places_disponibles" style={fieldLabel}>
            <Users size={12} color="var(--primary)" />{t('pages.entreprise.editOffre.labelPositions')} <span style={{ color: 'var(--error)', marginLeft: 2 }}>*</span>
          </label>
          <input id="places_disponibles" type="number" {...register('places_disponibles', { required: t('pages.entreprise.editOffre.required') })} />
          {errors.places_disponibles && <span style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{errors.places_disponibles.message}</span>}
        </div>
        <div>
          <label htmlFor="statut" style={fieldLabel}>{t('pages.entreprise.editOffre.labelStatus')}</label>
          <select id="statut" {...register('statut')}>
            <option value="Active">{t('pages.entreprise.editOffre.statusActive')}</option>
            <option value="Fermée">{t('pages.entreprise.editOffre.statusClosed')}</option>
            <option value="Archivée">{t('pages.entreprise.editOffre.statusArchived')}</option>
          </select>
        </div>
      </div>

      {/* Télétravail */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        <input id="teletravail" type="checkbox" {...register('teletravail')} style={{ width: 'auto', margin: 0 }} />
        <label htmlFor="teletravail" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)', cursor: 'pointer' }}>
          <Wifi size={14} color="var(--primary)" />{t('pages.entreprise.editOffre.labelRemote')}
        </label>
      </div>

      {/* Footer actions */}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid var(--surface-border)', paddingTop: '1.25rem', marginTop: '0.25rem' }}>
        <button type="button" className="secondary" onClick={handleClose}>
          {t('pages.entreprise.editOffre.cancelBtn')}
        </button>
        <button type="submit" disabled={isLoading} style={{ padding: '0.6rem 1.375rem', borderRadius: '6px', border: 'none', backgroundColor: 'var(--primary)', color: '#fff', fontWeight: '700', fontSize: '0.875rem', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Save size={15} />
          {isLoading ? t('pages.entreprise.editOffre.saving') : t('pages.entreprise.editOffre.saveBtn')}
        </button>
      </div>

    </form>
  );
};

/* ── Page mode (standalone route) ───────────────────────────── */
const EditOffre = ({ onClose } = {}) => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  if (onClose) {
    return <EditOffreForm id={id} isPopup onClose={onClose} />;
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => navigate('/espace/entreprise/offres')}
          className="secondary"
          style={{ padding: '0.5rem 1rem', marginBottom: '1.25rem' }}
        >
          <ChevronLeft size={18} />
          {t('pages.entreprise.editOffre.backBtn')}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Briefcase size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>{t('pages.entreprise.editOffre.pageTitle')}</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.875rem', fontWeight: '500' }}>
              {t('pages.entreprise.editOffre.pageSubtitle')}
            </p>
          </div>
        </div>
      </div>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <EditOffreForm id={id} />
      </div>
    </div>
  );
};

export { EditOffreForm };
export default EditOffre;
