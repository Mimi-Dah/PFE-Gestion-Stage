import { useState } from 'react';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import DatePicker from '../../components/DatePicker';

const CreerOffre = () => {
  const { t } = useTranslation();
  const { register, handleSubmit, control, formState: { errors } } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const navigate = useNavigate();

  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return '';
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) return '';
    const diffDays = Math.floor((end - start) / (1000 * 60 * 60 * 24));
    const months = Math.floor(diffDays / 30);
    const weeks = Math.floor((diffDays % 30) / 7);
    const days = diffDays % 7;
    const parts = [];
    if (months > 0) parts.push(t('pages.entreprise.mesOffres.month_other', { count: months }));
    if (weeks > 0)  parts.push(t('pages.entreprise.mesOffres.wk'));
    if (months === 0 && weeks === 0 && days > 0) parts.push(`${days}d`);
    return parts.join(' ');
  };

  const { data: departements = [] } = useQuery({
    queryKey: ['departements'],
    queryFn: async () => {
      const res = await api.get('etablissements/departements/');
      return res.data.results ?? res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const dateDebut = useWatch({ control, name: 'date_debut' });
  const dateFin   = useWatch({ control, name: 'date_fin' });
  const duree = calculateDuration(dateDebut, dateFin);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setApiError('');
    if (data.departement_id) data.departement_id = Number(data.departement_id);
    const result = await api.safeRequest(api.post('offres/', data));
    if (result.ok) {
      navigate('/espace/entreprise/offres');
    } else {
      setApiError(result.error.message || t('pages.entreprise.creerOffre.errorGeneral'));
    }
    setIsLoading(false);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '860px', margin: '0 auto' }}>
      <div className="page-hero">
        <h1>{t('pages.entreprise.creerOffre.title')}</h1>
        <p>{t('pages.entreprise.creerOffre.subtitle')}</p>
      </div>

      {apiError && (
        <div style={{
          backgroundColor: 'var(--error-light)',
          color: 'var(--error)',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          border: '1px solid rgba(239,68,68,0.2)',
          fontWeight: '600',
          fontSize: '0.9rem',
        }}>
          {apiError}
        </div>
      )}

      <div className="card" style={{ padding: '2.5rem' }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Row 1: Titre + Département */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label htmlFor="titre">{t('pages.entreprise.creerOffre.labelTitle')} <span style={{ color: 'var(--error)' }}>*</span></label>
              <input
                id="titre"
                placeholder={t('pages.entreprise.creerOffre.placeholderTitle')}
                {...register('titre', { required: t('pages.entreprise.creerOffre.required') })}
              />
              {errors.titre && <span style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.titre.message}</span>}
            </div>
            <div>
              <label htmlFor="departement_id">{t('pages.entreprise.creerOffre.labelDept')} <span style={{ color: 'var(--error)' }}>*</span></label>
              <select
                id="departement_id"
                {...register('departement_id', { required: t('pages.entreprise.creerOffre.required') })}
              >
                <option value="">{t('pages.entreprise.creerOffre.selectDept')}</option>
                {departements.map(d => (
                  <option key={d.id} value={d.id}>{d.nom}</option>
                ))}
              </select>
              {errors.departement_id && <span style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.departement_id.message}</span>}
            </div>
          </div>

          {/* Row 2: Date début + Date fin */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label htmlFor="date_debut">{t('pages.entreprise.creerOffre.labelStartDate')} <span style={{ color: 'var(--error)' }}>*</span></label>
              <Controller
                name="date_debut"
                control={control}
                rules={{ required: t('pages.entreprise.creerOffre.required') }}
                render={({ field }) => (
                  <DatePicker
                    id="date_debut"
                    value={field.value}
                    onChange={field.onChange}
                    error={!!errors.date_debut}
                  />
                )}
              />
              {errors.date_debut && <span style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.date_debut.message}</span>}
            </div>
            <div>
              <label htmlFor="date_fin">{t('pages.entreprise.creerOffre.labelEndDate')} <span style={{ color: 'var(--error)' }}>*</span></label>
              <Controller
                name="date_fin"
                control={control}
                rules={{ required: t('pages.entreprise.creerOffre.required') }}
                render={({ field }) => (
                  <DatePicker
                    id="date_fin"
                    value={field.value}
                    onChange={field.onChange}
                    error={!!errors.date_fin}
                  />
                )}
              />
              {errors.date_fin && <span style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.date_fin.message}</span>}
            </div>
          </div>

          {/* Row 3: Durée auto-calculée */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label>{t('pages.entreprise.creerOffre.labelDuration')}</label>
            <input
              readOnly
              value={duree}
              placeholder={t('pages.entreprise.creerOffre.placeholderDuration')}
              style={{
                backgroundColor: 'var(--surface-hover)',
                color: duree ? 'var(--text-main)' : 'var(--text-muted)',
                cursor: 'default',
                fontStyle: duree ? 'normal' : 'italic',
              }}
            />
          </div>

          {/* Row 4: Missions */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="description">{t('pages.entreprise.creerOffre.labelMissions')} <span style={{ color: 'var(--error)' }}>*</span></label>
            <textarea
              id="description"
              rows="4"
              placeholder={t('pages.entreprise.creerOffre.placeholderMissions')}
              {...register('description', {
                required: t('pages.entreprise.creerOffre.required'),
                minLength: { value: 30, message: t('pages.entreprise.creerOffre.min30') },
              })}
            />
            {errors.description && <span style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.description.message}</span>}
          </div>

          {/* Row 5: Compétences requises */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="exigences">{t('pages.entreprise.creerOffre.labelSkills')}</label>
            <textarea
              id="exigences"
              rows="3"
              placeholder={t('pages.entreprise.creerOffre.placeholderSkills')}
              {...register('exigences')}
            />
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--surface-border)', margin: '2rem 0' }} />

          {/* Row 6: Localisation + Gratification */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label htmlFor="localisation">{t('pages.entreprise.creerOffre.labelLocation')} <span style={{ color: 'var(--error)' }}>*</span></label>
              <input
                id="localisation"
                placeholder={t('pages.entreprise.creerOffre.placeholderLocation')}
                {...register('localisation', { required: t('pages.entreprise.creerOffre.required') })}
              />
              {errors.localisation && <span style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.localisation.message}</span>}
            </div>
            <div>
              <label htmlFor="gratification">{t('pages.entreprise.creerOffre.labelStipend')}</label>
              <input
                id="gratification"
                type="number"
                placeholder={t('pages.entreprise.creerOffre.placeholderStipend')}
                {...register('gratification')}
              />
            </div>
          </div>

          {/* Row 7: Places disponibles + Télétravail */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div>
              <label htmlFor="places_disponibles">{t('pages.entreprise.creerOffre.labelSpots')} <span style={{ color: 'var(--error)' }}>*</span></label>
              <input
                id="places_disponibles"
                type="number"
                defaultValue={1}
                min={1}
                {...register('places_disponibles', { required: t('pages.entreprise.creerOffre.required') })}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.8125rem 1.125rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                background: 'var(--surface-card)',
                cursor: 'pointer',
              }}>
                <input
                  id="teletravail"
                  type="checkbox"
                  {...register('teletravail')}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer', flexShrink: 0 }}
                />
                <label htmlFor="teletravail" style={{ margin: 0, textTransform: 'none', fontSize: '0.9375rem', fontWeight: '500', color: 'var(--text-color)', cursor: 'pointer', letterSpacing: 0 }}>
                  {t('pages.entreprise.creerOffre.labelRemote')}
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="secondary"
              onClick={() => navigate('/espace/entreprise/offres')}
            >
              {t('pages.entreprise.creerOffre.cancelBtn')}
            </button>
            <button
              type="submit"
              className={`primary ${isLoading ? 'loading-btn' : ''}`}
              disabled={isLoading}
              style={{ padding: '0.75rem 2rem', fontWeight: '700' }}
            >
              {isLoading ? t('pages.entreprise.creerOffre.publishing') : t('pages.entreprise.creerOffre.publishBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreerOffre;
