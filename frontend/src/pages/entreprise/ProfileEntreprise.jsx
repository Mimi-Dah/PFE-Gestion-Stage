import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import {
  Building2, Globe, Mail, Save, CheckCircle2, AlertCircle,
  Camera, Pencil, X, Plus,
  Phone, MapPin, Calendar,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';

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

export default function ProfileEntreprise() {
  const { t } = useTranslation();
  const { user, setAuth, token } = useAuthStore();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const [tab, setTab]               = useState('overview');
  const [isLoading, setIsLoading]   = useState(false);
  const [message, setMessage]       = useState('');
  const [editing, setEditing]       = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);

  const p = user?.profil_entreprise || {};

  useEffect(() => {
    if (p) {
      Object.entries(p).forEach(([k, v]) => { if (k !== 'logo') setValue(k, v); });
    }
  }, [user]);

  const calculateCompletion = () => {
    const required = ['nom', 'description', 'adresse', 'telephone', 'nom_contact', 'email_contact'];
    return Math.round((required.filter(k => !!p[k]).length / required.length) * 100);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const getLogoUrl = () => {
    if (logoPreview) return logoPreview;
    if (p?.logo) {
      if (p.logo.startsWith('http') || p.logo.startsWith('data:')) return p.logo;
      const base = (api.defaults.baseURL || '').match(/^https?:\/\/[^/]+/)?.[0] || '';
      return `${base}${p.logo.startsWith('/') ? '' : '/'}${p.logo}`;
    }
    return null;
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setMessage('');
    const fd = new FormData();
    Object.keys(data).forEach(k => { if (data[k] != null) fd.append(k, data[k]); });
    const logoInput = document.getElementById('logo-input');
    if (logoInput?.files[0]) fd.append('logo', logoInput.files[0]);
    const result = await api.safeRequest(api.patch('auth/me/', fd));
    if (result.ok) {
      const me = await api.safeRequest(api.get('auth/me/'));
      if (me.ok) setAuth(me.value.data, token);
      setMessage(`success:${t('pages.entrepriseProfil.toast.success')}`);
      setEditing(false);
    } else {
      setMessage(`error:${result.error?.message || t('pages.entrepriseProfil.toast.error')}`);
    }
    setIsLoading(false);
    setTimeout(() => setMessage(''), 5000);
  };

  const logoUrl = getLogoUrl();
  const companyName = p?.nom || user?.courriel || 'Entreprise';
  const completionPercent = calculateCompletion();
  const memberSince = user?.cree_le
    ? new Date(user.cree_le).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';
  const siteHost = p?.site_web ? (() => { try { return new URL(p.site_web).hostname; } catch { return p.site_web; } })() : null;

  const TABS = [
    { id: 'overview', label: t('pages.entrepriseProfil.tabOverview') },
    { id: 'details',  label: t('pages.entrepriseProfil.tabDetails')  },
    { id: 'account',  label: t('pages.entrepriseProfil.tabAccount')  },
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
        {/* Left: Logo + Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0, minWidth: '240px' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '12px',
              background: logoUrl ? 'transparent' : '#E5E7EB', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid var(--border)',
            }}>
              {logoUrl
                ? <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <Building2 size={28} color="#9CA3AF" />
              }
            </div>
            <button type="button" onClick={() => document.getElementById('logo-input').click()} style={{
              position: 'absolute', bottom: 0, right: 0,
              width: '20px', height: '20px', borderRadius: '50%',
              background: '#111827', border: '2px solid #fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <Camera size={10} color="#fff" />
            </button>
            <input type="file" id="logo-input" style={{ display: 'none' }} accept="image/*" onChange={handleLogoChange} />
          </div>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main)' }}>{companyName}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginTop: '0.15rem' }}>{user?.courriel}</div>
            <span style={{
              display: 'inline-block', marginTop: '0.4rem',
              fontSize: '0.68rem', fontWeight: '700', padding: '0.18rem 0.6rem', borderRadius: '999px',
              background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE',
            }}>{t('pages.entrepriseProfil.badgeCompany')}</span>
          </div>
        </div>

        {/* Vertical separator */}
        <div style={{ width: '1px', background: 'var(--border)', alignSelf: 'stretch', margin: '0 1.5rem', flexShrink: 0 }} />

        {/* Right: chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: 0, overflow: 'hidden' }}>
          {p?.telephone && <InfoChip icon={<Phone size={15} />} label={t('pages.entrepriseProfil.chipPhone')} value={p.telephone} />}
          {siteHost && <InfoChip icon={<Globe size={15} />} label={t('pages.entrepriseProfil.chipWebsite')} value={siteHost} accent="#2563EB" />}
          <InfoChip icon={<Calendar size={15} />} label={t('pages.entrepriseProfil.chipMemberSince')} value={memberSince} />
          <InfoChip icon={<CheckCircle2 size={15} />} label={t('pages.entrepriseProfil.chipStatus')} value={t('pages.entrepriseProfil.chipActive')} accent="#16A34A" />
        </div>
      </div>

      {/* ── Tabs + Edit button ── */}
      <div style={{ borderBottom: '1px solid var(--border)', marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex' }}>
          {TABS.map(t => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)} style={{
              padding: '0.65rem 1.1rem', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: '0.875rem', fontWeight: tab === t.id ? '600' : '400',
              color: tab === t.id ? 'var(--text-main)' : 'var(--text-muted)',
              borderBottom: `2px solid ${tab === t.id ? 'var(--text-main)' : 'transparent'}`,
              marginBottom: '-1px',
            }}>
              {t.label}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setEditing(e => !e)} style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0, marginBottom: '-1px',
          background: editing ? '#FEF2F2' : '#111827',
          color: editing ? '#EF4444' : '#fff',
          border: editing ? '1px solid #FECACA' : 'none',
          padding: '0.48rem 0.95rem', borderRadius: '6px',
          cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600',
        }}>
          {editing ? <><X size={13} /> {t('pages.entrepriseProfil.cancelBtn')}</> : <><Pencil size={13} /> {t('pages.entrepriseProfil.editBtn')}</>}
        </button>
      </div>

      {/* ── Content ── */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '1.5rem' }}>

          {/* OVERVIEW */}
          {tab === 'overview' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-main)' }}>{t('pages.entrepriseProfil.overview.title')}</span>
                <button type="button" onClick={() => { setEditing(true); setTab('details'); }} style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444',
                  fontSize: '0.78rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem',
                }}>
                  <Plus size={13} /> {t('pages.entrepriseProfil.overview.addInfo')}
                </button>
              </div>

              <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', marginBottom: '1rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <TH>{t('pages.entrepriseProfil.overview.colName')}</TH>
                      <TH>{t('pages.entrepriseProfil.overview.colStatus')}</TH>
                      <TH>{t('pages.entrepriseProfil.overview.colCompletion')}</TH>
                      <TH>{t('pages.entrepriseProfil.overview.colMemberSince')}</TH>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <TD>{p?.nom || <span style={{ color: 'var(--text-subtle)' }}>—</span>}</TD>
                      <TD>
                        <span style={{ fontSize: '0.7rem', fontWeight: '600', padding: '0.2rem 0.6rem', borderRadius: '999px', background: '#DCFCE7', color: '#16A34A' }}>{t('pages.entrepriseProfil.overview.statusActive')}</span>

                      </TD>
                      <TD>
                        <span style={{ fontSize: '0.7rem', fontWeight: '600', padding: '0.2rem 0.6rem', borderRadius: '999px', background: completionPercent === 100 ? '#DCFCE7' : '#DBEAFE', color: completionPercent === 100 ? '#16A34A' : '#1D4ED8' }}>
                          {completionPercent}%
                        </span>
                      </TD>
                      <TD>{memberSince}</TD>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.6rem' }}>{t('pages.entrepriseProfil.overview.descTitle')}</div>
                  {p?.description
                    ? <p style={{ fontSize: '0.83rem', color: 'var(--text-color)', lineHeight: 1.7, margin: 0 }}>{p.description}</p>
                    : <span style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', fontStyle: 'italic' }}>{t('pages.entrepriseProfil.overview.noDesc')}</span>
                  }
                  <button type="button" onClick={() => { setEditing(true); setTab('details'); }} style={{ marginTop: '0.6rem', background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '0.78rem', fontWeight: '600', padding: 0 }}>
                    {t('pages.entrepriseProfil.overview.viewAll')}
                  </button>
                </div>
                <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.6rem' }}>{t('pages.entrepriseProfil.overview.hrTitle')}</div>
                  {[
                    { label: t('pages.entrepriseProfil.overview.manager'),  value: p?.nom_contact },
                    { label: t('pages.entrepriseProfil.overview.hrEmail'), value: p?.email_contact },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', width: '90px', flexShrink: 0 }}>{row.label}</span>
                      <span style={{ fontSize: '0.83rem', color: 'var(--text-color)' }}>{row.value || <span style={{ color: 'var(--text-subtle)' }}>—</span>}</span>
                    </div>
                  ))}
                  <button type="button" onClick={() => setTab('details')} style={{ marginTop: '0.4rem', background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '0.78rem', fontWeight: '600', padding: 0 }}>
                    {t('pages.entrepriseProfil.overview.viewAll')}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* INFORMATIONS (editable) */}
          {tab === 'details' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-main)' }}>{t('pages.entrepriseProfil.details.title')}</div>

              <FF label={t('pages.entrepriseProfil.details.descLabel')} error={errors.description?.message}>
                <textarea
                  rows={4}
                  {...register('description', { required: t('pages.entrepriseProfil.details.descRequired') })}
                  placeholder={t('pages.entrepriseProfil.details.descPlaceholder')}
                  style={{
                    borderRadius: '6px', border: '1px solid var(--border)', padding: '0.65rem 0.75rem',
                    width: '100%', fontSize: '0.875rem', background: 'var(--bg-card)', color: 'var(--text-main)',
                    lineHeight: 1.65, resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </FF>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <FF label={t('pages.entrepriseProfil.details.companyNameLabel')} error={errors.nom?.message}>
                  <input {...register('nom', { required: t('pages.entrepriseProfil.details.required') })} placeholder={t('pages.entrepriseProfil.details.companyNamePlaceholder')} style={iStyle} />
                </FF>
                <FF label={t('pages.entrepriseProfil.details.phoneLabel')} error={errors.telephone?.message}>
                  <input type="tel" {...register('telephone', { required: t('pages.entrepriseProfil.details.required') })} placeholder={t('pages.entrepriseProfil.details.phonePlaceholder')} style={iStyle} />
                </FF>
                <FF label={t('pages.entrepriseProfil.details.websiteLabel')}>
                  <input type="url" {...register('site_web')} placeholder={t('pages.entrepriseProfil.details.websitePlaceholder')} style={iStyle} />
                </FF>
                <FF label={t('pages.entrepriseProfil.details.addressLabel')} error={errors.adresse?.message}>
                  <input {...register('adresse', { required: t('pages.entrepriseProfil.details.required') })} placeholder={t('pages.entrepriseProfil.details.addressPlaceholder')} style={iStyle} />
                </FF>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-color)', marginBottom: '0.75rem' }}>{t('pages.entrepriseProfil.details.hrTitle')}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <FF label={t('pages.entrepriseProfil.details.managerLabel')} error={errors.nom_contact?.message}>
                    <input {...register('nom_contact', { required: t('pages.entrepriseProfil.details.required') })} placeholder={t('pages.entrepriseProfil.details.managerPlaceholder')} style={iStyle} />
                  </FF>
                  <FF label={t('pages.entrepriseProfil.details.hrEmailLabel')} error={errors.email_contact?.message}>
                    <input type="email" {...register('email_contact', { required: t('pages.entrepriseProfil.details.required') })} placeholder={t('pages.entrepriseProfil.details.hrEmailPlaceholder')} style={iStyle} />
                  </FF>
                </div>
              </div>
            </div>
          )}

          {/* ACCOUNT */}
          {tab === 'account' && (
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '1rem' }}>{t('pages.entrepriseProfil.account.title')}</div>
              <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                {[
                  { label: t('pages.entrepriseProfil.account.email'),        value: user?.courriel },
                  { label: t('pages.entrepriseProfil.account.accountType'),  value: t('pages.entrepriseProfil.account.partnerCompany'), badge: '#1D4ED8', badgeBg: '#DBEAFE' },
                  { label: t('pages.entrepriseProfil.account.memberSince'),  value: memberSince },
                  { label: t('pages.entrepriseProfil.account.status'),       value: t('pages.entrepriseProfil.account.active'),   badge: '#16A34A', badgeBg: '#DCFCE7' },
                  { label: t('pages.entrepriseProfil.account.verification'), value: t('pages.entrepriseProfil.account.verified'), badge: '#16A34A', badgeBg: '#DCFCE7' },
                ].map((row, i, arr) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '0.85rem 1rem', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: '600', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.07em', width: '160px', flexShrink: 0 }}>{row.label}</span>
                    {row.badge
                      ? <span style={{ fontSize: '0.7rem', fontWeight: '600', padding: '0.2rem 0.6rem', borderRadius: '999px', background: row.badgeBg, color: row.badge }}>{row.value}</span>
                      : <span style={{ fontSize: '0.875rem', color: 'var(--text-color)' }}>{row.value || '—'}</span>
                    }
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Save bar ── */}
        {editing && (
          <div style={{
            marginTop: '0.85rem', padding: '0.85rem 1.25rem',
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px',
            display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem',
          }}>
            <button type="button" onClick={() => setEditing(false)} style={{ padding: '0.48rem 1.1rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-color)', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}>
              {t('pages.entrepriseProfil.cancelBtn')}
            </button>
            <button type="submit" disabled={isLoading} style={{
              padding: '0.48rem 1.25rem', borderRadius: '6px',
              background: '#111827', color: '#fff', fontWeight: '600',
              border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem',
              opacity: isLoading ? 0.7 : 1,
            }}>
              <Save size={13} />{isLoading ? t('pages.entrepriseProfil.saveBar.saving') : t('pages.entrepriseProfil.saveBar.save')}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
