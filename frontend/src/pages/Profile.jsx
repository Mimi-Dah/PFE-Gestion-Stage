import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  User, Mail, Save, CheckCircle2,
  Camera, FileText, AlertCircle, FileDown, Eye,
  Pencil, X, GraduationCap, Calendar, Shield,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import api, { mediaUrl } from '../services/api';

const LOCALE_MAP = { fr: 'fr-FR', en: 'en-US', ar: 'ar-EG' };

const TH = ({ children }) => (
  <th style={{ padding: '0.6rem 0.85rem', fontSize: '0.68rem', fontWeight: '600', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left', background: 'var(--surface-section)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
    {children}
  </th>
);

const TD = ({ children }) => (
  <td style={{ padding: '0.85rem', fontSize: '0.875rem', color: 'var(--text-color)' }}>
    {children}
  </td>
);

const FF = ({ label, error, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
    <label style={{ fontSize: '0.67rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</label>
    {children}
    {error && <span style={{ color: '#EF4444', fontSize: '0.7rem' }}>{error}</span>}
  </div>
);

const iStyle = {
  height: '36px', borderRadius: '6px', border: '1px solid var(--border)',
  padding: '0 0.7rem', width: '100%', fontSize: '0.85rem',
  background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none', boxSizing: 'border-box',
};

const InfoChip = ({ icon, label, value, accent }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '0.45rem',
    padding: '0.5rem 0.75rem', borderRadius: '8px',
    background: accent ? `${accent}12` : 'var(--surface-section)',
    border: `1px solid ${accent ? `${accent}30` : 'var(--border)'}`,
    whiteSpace: 'nowrap',
  }}>
    <span style={{ color: accent || 'var(--text-subtle)', display: 'flex', flexShrink: 0 }}>{icon}</span>
    <div>
      <div style={{ fontSize: '0.58rem', fontWeight: '600', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: '0.78rem', fontWeight: '600', color: accent ? accent : 'var(--text-main)' }}>{value || '—'}</div>
    </div>
  </div>
);

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const { t, i18n } = useTranslation();
  const locale = LOCALE_MAP[i18n.language] || 'fr-FR';

  const isStudent = user?.role === 'Étudiant';
  const isChef = user?.role === 'Chef_Departement';
  const p = user?.profil_etudiant || {};
  const chef = user?.profil_chef || {};

  const [tab, setTab]               = useState(isStudent ? 'details' : 'account');
  const [isLoading, setIsLoading]   = useState(false);
  const [message, setMessage]       = useState('');
  const [editing, setEditing]       = useState(false);
  const [selectedCV, setSelectedCV] = useState(null);
  const [selectedLM, setSelectedLM] = useState(null);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    api.get('etablissements/departements/').then(r => {
      setDepartments(Array.isArray(r.data) ? r.data : r.data.results || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (isStudent && p) {
      Object.entries(p).forEach(([k, v]) => {
        if (!['photo', 'cv', 'lettre_motivation', 'departement'].includes(k)) setValue(k, v);
      });
    }
  }, [user, isStudent]);

  useEffect(() => {
    if (isStudent && departments.length > 0 && p?.departement) {
      setValue('departement', p.departement.id || p.departement);
    }
  }, [departments, user, isStudent]);

  const onSubmit = async (data) => {
    if (!isStudent) return;
    setIsLoading(true);
    setMessage('');
    try {
      const fd = new FormData();
      Object.keys(data).forEach(k => { if (data[k] != null) fd.append(k, data[k]); });
      ['photo', 'cv', 'lettre_motivation'].forEach((field, i) => {
        const f = document.getElementById(['photo-input', 'cv-input', 'lm-input'][i])?.files[0];
        if (f) fd.append(field, f);
      });
      await api.patch('auth/me/', fd);
      const me = await api.get('auth/me/');
      updateUser(me.data);
      setSelectedCV(null); setSelectedLM(null);
      setMessage(`success:${t('pages.profile.successMsg')}`);
      setEditing(false);
    } catch {
      setMessage(`error:${t('pages.profile.errorMsg')}`);
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const photoUrl = p?.photo ? mediaUrl(p.photo) : null;
  const fullName = isStudent
    ? `${p?.prenom || ''} ${p?.nom || ''}`.trim() || user?.courriel
    : isChef
      ? `${chef?.prenom || ''} ${chef?.nom || ''}`.trim() || user?.courriel
      : user?.courriel;
  const deptName = isChef
    ? chef?.departement_nom || chef?.departement?.nom || '—'
    : departments.find(d => d.id === (p?.departement?.id ?? p?.departement))?.nom
      || p?.departement?.nom || '—';

  const dateOpts = { day: 'numeric', month: 'short', year: 'numeric' };
  const memberSince = user?.cree_le
    ? new Date(user.cree_le).toLocaleDateString(locale, dateOpts)
    : '—';
  const birthDate = p?.date_de_naissance
    ? new Date(p.date_de_naissance).toLocaleDateString(locale, dateOpts)
    : null;

  const roleLabel = isStudent
    ? t('pages.profile.roleStudent')
    : isChef
      ? t('pages.profile.roleChef')
      : user?.role;

  const TABS = isStudent
    ? [
        { id: 'details',   label: t('pages.profile.tabDetails') },
        { id: 'documents', label: t('pages.profile.tabDocuments') },
      ]
    : [];

  const docs = [
    {
      inputId: 'cv-input',
      icon: <FileText size={19} color="#6366F1" />,
      iconBg: '#EEF2FF',
      label: t('pages.profile.cv'),
      preview: selectedCV,
      onChg: e => setSelectedCV(e.target.files[0]),
      available: p?.cv,
      url: p?.cv ? mediaUrl(p.cv) : null,
    },
    {
      inputId: 'lm-input',
      icon: <FileDown size={19} color="#22C55E" />,
      iconBg: '#F0FDF4',
      label: t('pages.profile.coverLetter'),
      preview: selectedLM,
      onChg: e => setSelectedLM(e.target.files[0]),
      available: p?.lettre_motivation,
      url: p?.lettre_motivation ? mediaUrl(p.lettre_motivation) : null,
    },
  ];

  return (
    <div className="animate-fade-in" style={{ padding: '0 0 4rem' }}>

      {/* ── Toast ── */}
      {message && (
        <div style={{
          padding: '0.65rem 1rem', borderRadius: '8px', marginBottom: '1rem',
          background: message.startsWith('success') ? '#F0FDF4' : '#FEF2F2',
          color: message.startsWith('success') ? '#16A34A' : '#DC2626',
          display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem',
          border: `1px solid ${message.startsWith('success') ? '#BBF7D0' : '#FECACA'}`,
        }}>
          {message.startsWith('success') ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          {message.split(':')[1]}
        </div>
      )}

      {/* ── Hero card ── */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px',
        padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0',
      }}>
        {/* Left: Avatar + Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0, minWidth: '240px' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: photoUrl ? 'transparent' : '#E5E7EB', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid var(--border)',
            }}>
              {photoUrl
                ? <img src={photoUrl} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <User size={28} color="#9CA3AF" />
              }
            </div>
            {isStudent && (
              <button type="button" onClick={() => document.getElementById('photo-input').click()} style={{
                position: 'absolute', bottom: 0, right: 0,
                width: '20px', height: '20px', borderRadius: '50%',
                background: '#111827', border: '2px solid #fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}>
                <Camera size={10} color="#fff" />
              </button>
            )}
            <input type="file" id="photo-input" style={{ display: 'none' }} accept="image/*"
              onChange={e => {
                const f = e.target.files[0];
                if (!f) return;
                const fd = new FormData();
                fd.append('photo', f);
                api.patch('auth/me/', fd).then(() => api.get('auth/me/').then(r => updateUser(r.data)));
              }}
            />
          </div>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main)' }}>{fullName}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginTop: '0.15rem' }}>{user?.courriel}</div>
            <span style={{
              display: 'inline-block', marginTop: '0.4rem',
              fontSize: '0.68rem', fontWeight: '700', padding: '0.18rem 0.6rem', borderRadius: '999px',
              background: isChef ? '#EEF2FF' : '#F0FDF4',
              color: isChef ? '#4F46E5' : '#16A34A',
              border: `1px solid ${isChef ? '#C7D2FE' : '#BBF7D0'}`,
            }}>{roleLabel}</span>
          </div>
        </div>

        {/* Vertical separator */}
        <div style={{ width: '1px', background: 'var(--border)', alignSelf: 'stretch', margin: '0 1.5rem', flexShrink: 0 }} />

        {/* Right: chips */}
        <div style={{ display: 'flex', gap: '0.65rem', flex: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          {(isChef || deptName !== '—') && (
            <InfoChip icon={<GraduationCap size={15} />} label={t('pages.profile.department')} value={deptName} accent="#4F46E5" />
          )}
          {isStudent && p?.niveau_academique && (
            <InfoChip icon={<Shield size={15} />} label={t('pages.profile.level')} value={p.niveau_academique} />
          )}
          <InfoChip icon={<Calendar size={15} />} label={t('pages.profile.memberSince')} value={memberSince} />
          <InfoChip icon={<CheckCircle2 size={15} />} label={t('pages.profile.status')} value={t('pages.profile.active')} accent="#16A34A" />
        </div>

        {/* Edit button (students only) */}
        {isStudent && (
          <button type="button" onClick={() => setEditing(e => !e)} style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0, marginLeft: '1rem',
            background: editing ? '#FEF2F2' : '#111827',
            color: editing ? '#EF4444' : '#fff',
            border: editing ? '1px solid #FECACA' : 'none',
            padding: '0.48rem 0.95rem', borderRadius: '6px',
            cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600',
          }}>
            {editing
              ? <><X size={13} /> {t('pages.profile.cancel')}</>
              : <><Pencil size={13} /> {t('pages.profile.edit')}</>}
          </button>
        )}
      </div>

      {/* ── Tabs (students only) ── */}
      {TABS.length > 0 && (
        <div style={{ borderBottom: '1px solid var(--border)', marginTop: '1.25rem' }}>
          <div style={{ display: 'flex' }}>
            {TABS.map(item => (
              <button key={item.id} type="button" onClick={() => setTab(item.id)} style={{
                padding: '0.65rem 1.1rem', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: '0.875rem', fontWeight: tab === item.id ? '600' : '400',
                color: tab === item.id ? 'var(--text-main)' : 'var(--text-muted)',
                borderBottom: `2px solid ${tab === item.id ? 'var(--text-main)' : 'transparent'}`,
                marginBottom: '-1px',
              }}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <form onSubmit={handleSubmit(onSubmit)}>
        {isStudent && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '1.5rem' }}>

            {/* INFORMATIONS */}
            {tab === 'details' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-main)' }}>{t('pages.profile.detailsTitle')}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <FF label={t('pages.profile.firstName')} error={errors.prenom?.message && t('pages.profile.required')}>
                    <input {...register('prenom', { required: true })} placeholder={t('pages.profile.firstNamePlaceholder')} style={iStyle} />
                  </FF>
                  <FF label={t('pages.profile.lastName')} error={errors.nom?.message && t('pages.profile.required')}>
                    <input {...register('nom', { required: true })} placeholder={t('pages.profile.lastNamePlaceholder')} style={iStyle} />
                  </FF>
                  <FF label={t('pages.profile.phone')}>
                    <input type="tel" {...register('telephone')} placeholder={t('pages.profile.phonePlaceholder')} style={iStyle} />
                  </FF>
                  <FF label={t('pages.profile.birthDate')}>
                    <input type="date" {...register('date_de_naissance')} style={iStyle} />
                  </FF>
                  <FF label={t('pages.profile.academicLevel')} error={errors.niveau_academique?.message && t('pages.profile.required')}>
                    <select {...register('niveau_academique', { required: true })} style={{ ...iStyle, cursor: 'pointer' }}>
                      <option value="">{t('pages.profile.choose')}</option>
                      {['Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2'].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </FF>
                  <FF label={t('pages.profile.dept')} error={errors.departement?.message && t('pages.profile.required')}>
                    <select {...register('departement', { required: true })} style={{ ...iStyle, cursor: 'pointer' }}>
                      <option value="">{t('pages.profile.choose')}</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
                    </select>
                  </FF>
                </div>
                <FF label={t('pages.profile.address')}>
                  <input {...register('adresse')} placeholder={t('pages.profile.addressPlaceholder')} style={iStyle} />
                </FF>
              </div>
            )}

            {/* DOCUMENTS */}
            {tab === 'documents' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.25rem' }}>{t('pages.profile.docsTitle')}</div>
                {docs.map(doc => (
                  <div key={doc.inputId} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-section)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: doc.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {doc.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-main)' }}>{doc.label}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.15rem' }}>
                        {doc.preview ? doc.preview.name : (doc.available ? t('pages.profile.fileAvailable') : t('pages.profile.notUploaded'))}
                      </div>
                    </div>
                    <input type="file" id={doc.inputId} style={{ display: 'none' }} accept=".pdf" onChange={doc.onChg} />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {doc.url && (
                        <button type="button" onClick={() => window.open(doc.url, '_blank')}
                          style={{ height: '30px', padding: '0 0.65rem', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-card)', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Eye size={12} /> {t('pages.profile.view')}
                        </button>
                      )}
                      <button type="button" onClick={() => document.getElementById(doc.inputId).click()}
                        style={{ height: '30px', padding: '0 0.65rem', border: '1px solid #111827', borderRadius: '6px', background: 'var(--bg-card)', cursor: 'pointer', color: 'var(--text-main)', fontSize: '0.75rem', fontWeight: '600' }}>
                        {t('pages.profile.change')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* ── Save bar ── */}
        {editing && (
          <div style={{
            marginTop: '0.85rem', padding: '0.85rem 1.25rem',
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px',
            display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem',
          }}>
            <button type="button" onClick={() => setEditing(false)} style={{ padding: '0.48rem 1.1rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-color)', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}>
              {t('pages.profile.cancel')}
            </button>
            <button type="submit" disabled={isLoading} style={{
              padding: '0.48rem 1.25rem', borderRadius: '6px',
              background: '#111827', color: '#fff', fontWeight: '600',
              border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem',
              opacity: isLoading ? 0.7 : 1,
            }}>
              <Save size={13} />{isLoading ? t('pages.profile.saving') : t('pages.profile.save')}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
