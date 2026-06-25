import { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserPlus, ShieldCheck, Trash2, Mail, Search, X,
  CheckCircle2, AlertCircle, GraduationCap, ShieldAlert, AlertTriangle,
} from 'lucide-react';
import api from '../../services/api';

const Tag = ({ color, bg, children }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
    padding: '0.28rem 0.75rem', borderRadius: '100px',
    fontSize: '0.73rem', fontWeight: '700',
    backgroundColor: bg, color,
  }}>{children}</span>
);

const IconBtn = ({ onClick, title, danger, children, disabled }) => (
  <button
    onClick={onClick} title={title} disabled={disabled}
    style={{
      width: '32px', height: '32px', borderRadius: '6px', border: '1px solid',
      borderColor: danger ? 'var(--error)33' : 'var(--border)',
      backgroundColor: danger ? 'var(--error-light)' : 'transparent',
      color: danger ? 'var(--error)' : 'var(--text-muted)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
      opacity: disabled ? 0.5 : 1,
    }}
    onMouseEnter={e => {
      if (disabled) return;
      e.currentTarget.style.backgroundColor = danger ? 'var(--error)' : 'var(--surface-section)';
      e.currentTarget.style.color = danger ? '#fff' : 'var(--text-main)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.backgroundColor = danger ? 'var(--error-light)' : 'transparent';
      e.currentTarget.style.color = danger ? 'var(--error)' : 'var(--text-muted)';
    }}
  >{children}</button>
);

const FormField = ({ label, children }) => (
  <div>
    <label style={{
      display: 'block', fontSize: '0.75rem', fontWeight: '700',
      color: 'var(--text-muted)', textTransform: 'uppercase',
      letterSpacing: '0.05em', marginBottom: '0.4rem',
    }}>{label}</label>
    {children}
  </div>
);

const inputStyle = {
  width: '100%', padding: '0.6rem 0.875rem', borderRadius: '6px',
  border: '1px solid var(--border)', backgroundColor: 'var(--surface-card)',
  color: 'var(--text-main)', fontSize: '0.875rem', fontWeight: '500',
  outline: 'none', boxSizing: 'border-box',
};

const ChefManagement = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget]  = useState(null);
  const [searchTerm, setSearchTerm]      = useState('');
  const [toast, setToast]                = useState(null);
  const [formData, setFormData]          = useState({
    courriel: '', password: '', prenom: '', nom: '', departement_id: '',
  });

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const resetForm = () =>
    setFormData({ courriel: '', password: '', prenom: '', nom: '', departement_id: '' });

  const { data: chefsRaw, isLoading } = useQuery({
    queryKey: ['admin-chefs'],
    queryFn: async () => {
      const resp = await api.get('admin/chefs/');
      return resp.data;
    },
  });
  const chefs = Array.isArray(chefsRaw)
    ? chefsRaw
    : Array.isArray(chefsRaw?.results)
    ? chefsRaw.results
    : [];

  const { data: departmentsRaw } = useQuery({
    queryKey: ['departments-list'],
    queryFn: async () => {
      const resp = await api.get('departements/');
      return resp.data;
    },
  });
  const departments = Array.isArray(departmentsRaw)
    ? departmentsRaw
    : Array.isArray(departmentsRaw?.results)
    ? departmentsRaw.results
    : [];

  const createMutation = useMutation({
    mutationFn: (data) => api.post('admin/chefs/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-chefs'] });
      setIsCreateOpen(false);
      resetForm();
      showToast('success', t('pages.adminChefManagement.toast.created'));
    },
    onError: (err) => {
      const backendErr = err.response?.data?.error;
      const msg = typeof backendErr === 'string'
        ? backendErr
        : backendErr?.message || err.message || t('pages.adminChefManagement.toast.createError');
      showToast('error', msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`admin/chefs/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-chefs'] });
      setDeleteTarget(null);
      showToast('success', t('pages.adminChefManagement.toast.deleted'));
    },
    onError: () => showToast('error', t('pages.adminChefManagement.toast.deleteError')),
  });

  const deptName = (chef) => {
    if (chef.departement_nom) return chef.departement_nom;
    const id = chef.departement ?? chef.departement_id;
    return departments.find(d => d.id === id)?.nom || '—';
  };

  const filtered = chefs.filter(c =>
    [c.nom, c.prenom, c.departement_nom, deptName(c)].some(v =>
      v?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '4rem' }}>

      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.875rem 1.25rem', borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          backgroundColor: toast.type === 'success' ? 'var(--success)' : 'var(--error)',
          color: '#fff', fontWeight: '700', fontSize: '0.875rem',
        }}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <PageHeader
        eyebrow={t('nav.sections.administration')}
        title={t('pages.adminChefManagement.title')}
        subtitle={t('pages.adminChefManagement.subtitle')}
      />

      <div className="vl-card">

        <div className="vl-toolbar">
          <button
            onClick={() => setIsCreateOpen(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.55rem 1.125rem', borderRadius: '6px', border: 'none',
              backgroundColor: 'var(--primary)', color: '#fff',
              fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer',
              boxShadow: '0 2px 8px var(--primary-glow)',
            }}
          >
            <UserPlus size={15} /> {t('pages.adminChefManagement.newChef')}
          </button>

          <div className="vl-search">
            <Search size={15} />
            <input
              type="text"
              placeholder={t('pages.adminChefManagement.searchPlaceholder')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="vl-table">
            <thead>
              <tr>
                {[
                  t('pages.adminChefManagement.colHead'),
                  t('pages.adminChefManagement.colDepartment'),
                  t('pages.adminChefManagement.colEmail'),
                  t('pages.adminChefManagement.colStatus'),
                  '',
                ].map((h, i) => (
                  <th key={i} className={i === 4 ? 'vl-th vl-th-r' : 'vl-th'}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <tr key={i}><td colSpan={5} style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ height: '32px', backgroundColor: 'var(--surface-section)', borderRadius: '6px', animation: 'pulse 2s infinite' }} />
                  </td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '5rem 1.25rem', textAlign: 'center' }}>
                  <ShieldAlert size={36} style={{ color: 'var(--text-muted)', opacity: 0.35, display: 'block', margin: '0 auto 0.75rem' }} />
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '600' }}>
                    {t('pages.adminChefManagement.noChefs')}
                  </div>
                </td></tr>
              ) : filtered.map(chef => {
                const initials = ((chef.prenom?.[0] || '') + (chef.nom?.[0] || '')).toUpperCase();
                const avColor = `vl-c${(chef.prenom?.charCodeAt(0) || 0) % 6}`;
                return (
                  <tr key={chef.id} className="vl-row">
                    <td className="vl-td">
                      <div className="vl-identity">
                        <div className={`vl-avt ${avColor}`}>{initials}</div>
                        <div>
                          <div className="vl-name">{chef.prenom} {chef.nom}</div>
                          <div className="vl-sub"><Mail size={11} />{chef.user?.courriel}</div>
                        </div>
                      </div>
                    </td>
                    <td className="vl-td">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)' }}>
                        <GraduationCap size={14} color="var(--primary)" />
                        {deptName(chef)}
                      </div>
                    </td>
                    <td className="vl-td" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Mail size={12} />{chef.user?.courriel}
                      </div>
                    </td>
                    <td className="vl-td">
                      <span className="vl-badge" style={{ color: 'var(--success)', background: 'var(--success-light)', borderColor: 'rgba(16,185,129,.2)' }}>
                        <ShieldCheck size={11} /> {t('pages.adminChefManagement.verified')}
                      </span>
                    </td>
                    <td className="vl-td-r">
                      <IconBtn
                        onClick={() => setDeleteTarget(chef)}
                        title={t('pages.adminChefManagement.deleteTitle')}
                        danger
                      >
                        <Trash2 size={14} />
                      </IconBtn>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="vl-footer">
          <span>
            {t('pages.adminChefManagement.chefCount', { count: filtered.length })}
          </span>
        </div>
      </div>

      {/* ── CREATE DIALOG ── */}
      {isCreateOpen && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}
          onClick={e => { if (e.target === e.currentTarget) { setIsCreateOpen(false); resetForm(); } }}
        >
          <div style={{
            backgroundColor: 'var(--surface-card)', borderRadius: '10px',
            width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--surface-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserPlus size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-main)' }}>
                    {t('pages.adminChefManagement.createDialog.title')}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                    {t('pages.adminChefManagement.createDialog.subtitle')}
                  </div>
                </div>
              </div>
              <IconBtn onClick={() => { setIsCreateOpen(false); resetForm(); }} title={t('pages.adminChefManagement.createDialog.close')}>
                <X size={15} />
              </IconBtn>
            </div>

            <form
              onSubmit={e => { e.preventDefault(); createMutation.mutate(formData); }}
              style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.125rem' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <FormField label={t('pages.adminChefManagement.createDialog.firstName')}>
                  <input
                    required type="text"
                    placeholder={t('pages.adminChefManagement.createDialog.firstNamePlaceholder')}
                    value={formData.prenom}
                    onChange={e => setFormData({ ...formData, prenom: e.target.value })}
                    style={inputStyle}
                  />
                </FormField>
                <FormField label={t('pages.adminChefManagement.createDialog.lastName')}>
                  <input
                    required type="text"
                    placeholder={t('pages.adminChefManagement.createDialog.lastNamePlaceholder')}
                    value={formData.nom}
                    onChange={e => setFormData({ ...formData, nom: e.target.value })}
                    style={inputStyle}
                  />
                </FormField>
              </div>

              <FormField label={t('pages.adminChefManagement.createDialog.email')}>
                <input
                  required type="email"
                  placeholder={t('pages.adminChefManagement.createDialog.emailPlaceholder')}
                  value={formData.courriel}
                  onChange={e => setFormData({ ...formData, courriel: e.target.value })}
                  style={inputStyle}
                />
              </FormField>

              <FormField label={t('pages.adminChefManagement.createDialog.password')}>
                <input
                  required type="password" placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  style={inputStyle}
                />
              </FormField>

              <FormField label={t('pages.adminChefManagement.createDialog.department')}>
                <select
                  required value={formData.departement_id}
                  onChange={e => setFormData({ ...formData, departement_id: e.target.value })}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="">{t('pages.adminChefManagement.createDialog.selectDept')}</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.nom}</option>
                  ))}
                </select>
              </FormField>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid var(--surface-border)', paddingTop: '1.25rem', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => { setIsCreateOpen(false); resetForm(); }}
                  style={{ padding: '0.6rem 1.25rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer' }}
                >
                  {t('pages.adminChefManagement.createDialog.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  style={{ padding: '0.6rem 1.375rem', borderRadius: '6px', border: 'none', backgroundColor: 'var(--primary)', color: '#fff', fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer', opacity: createMutation.isPending ? 0.7 : 1 }}
                >
                  {createMutation.isPending
                    ? t('pages.adminChefManagement.createDialog.creating')
                    : t('pages.adminChefManagement.createDialog.submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION ── */}
      {deleteTarget && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, padding: '1.5rem' }}
          onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null); }}
        >
          <div style={{ backgroundColor: 'var(--surface-card)', borderRadius: '10px', width: '100%', maxWidth: '400px', boxShadow: '0 24px 64px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            <div style={{ padding: '2rem 1.5rem 1.5rem', textAlign: 'center' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: 'var(--error-light)', color: 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.125rem' }}>
                <AlertTriangle size={24} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 0.5rem' }}>
                {t('pages.adminChefManagement.deleteDialog.title')}
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '500', lineHeight: 1.65, margin: 0 }}>
                {t('pages.adminChefManagement.deleteDialog.message')}{' '}
                <strong style={{ color: 'var(--text-main)' }}>
                  {deleteTarget.prenom} {deleteTarget.nom}
                </strong>
                {t('pages.adminChefManagement.deleteDialog.irreversible')}
              </p>
            </div>
            <div style={{ display: 'flex', borderTop: '1px solid var(--surface-border)' }}>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{ flex: 1, padding: '0.875rem', border: 'none', backgroundColor: 'transparent', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', borderRight: '1px solid var(--surface-border)' }}
              >
                {t('pages.adminChefManagement.deleteDialog.no')}
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                style={{ flex: 1, padding: '0.875rem', border: 'none', backgroundColor: 'transparent', color: 'var(--error)', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', opacity: deleteMutation.isPending ? 0.7 : 1 }}
              >
                {deleteMutation.isPending
                  ? t('pages.adminChefManagement.deleteDialog.deleting')
                  : t('pages.adminChefManagement.deleteDialog.yesDelete')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ChefManagement;
