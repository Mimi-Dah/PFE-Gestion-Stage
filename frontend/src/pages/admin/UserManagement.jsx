import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, Search, Filter, Shield, Building2, User as UserIcon,
  CheckCircle2, XCircle, Mail, Calendar, Clock, KeyRound,
  ShieldAlert, ChevronRight, ChevronLeft, UserCheck, Pencil, X,
} from 'lucide-react';
import api from '../../services/api';
import { dateLocale } from '../../utils/dateLocale';

const PAGE_SIZE = 15;

/* ── shared micro-components ─────────────────────────────────── */

const Tag = ({ color, bg, icon: Icon, children }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
    padding: '0.28rem 0.75rem', borderRadius: '100px',
    fontSize: '0.73rem', fontWeight: '700',
    backgroundColor: bg, color,
  }}>
    {Icon && <Icon size={11} />}{children}
  </span>
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

const PageBtn = ({ children, onClick, disabled, active, title }) => (
  <button
    onClick={onClick} disabled={disabled} title={title}
    style={{
      minWidth: '32px', height: '32px', padding: '0 0.5rem', borderRadius: '6px',
      border: active ? '1.5px solid var(--primary)' : '1px solid var(--surface-border)',
      backgroundColor: active ? 'var(--primary)' : 'var(--surface-card)',
      color: active ? '#fff' : disabled ? 'var(--text-muted)' : 'var(--text-main)',
      fontWeight: '700', fontSize: '0.8rem', cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      opacity: disabled ? 0.4 : 1, transition: 'all 0.15s',
    }}
  >{children}</button>
);

/* ── role config ──────────────────────────────────────────────── */

const ROLES = {
  'Étudiant':         { color: 'var(--primary)',   bg: 'var(--primary-light)',  Icon: UserIcon   },
  'Entreprise':       { color: 'var(--success)',   bg: 'var(--success-light)',  Icon: Building2  },
  'Chef_Departement': { color: 'var(--accent)',    bg: 'var(--accent-light)',   Icon: Shield     },
  'Admin':            { color: 'var(--text-main)', bg: 'var(--surface-hover)',  Icon: ShieldAlert},
};

/* ── main component ───────────────────────────────────────────── */

const UserManagement = () => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const location    = useLocation();
  const initialRole = new URLSearchParams(location.search).get('role') || 'All';
  const [searchInput, setSearchInput]         = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter]           = useState(initialRole);
  const [page, setPage]                       = useState(1);
  const [resetMsg, setResetMsg]               = useState('');
  const [editingUser, setEditingUser]         = useState(null);
  const [selectedRole, setSelectedRole]       = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => { setPage(1); }, [debouncedSearch, roleFilter]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', { page, search: debouncedSearch, role: roleFilter }],
    queryFn: async () => {
      const params = new URLSearchParams({ page });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (roleFilter !== 'All') params.set('role', roleFilter);
      return (await api.get(`admin/utilisateurs/?${params}`)).data;
    },
    placeholderData: prev => prev,
  });

  const users      = data?.results ?? [];
  const totalCount = data?.count   ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const pageNumbers = (() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const left  = Math.max(2, page - 1);
    const right = Math.min(totalPages - 1, page + 1);
    const pages = [1];
    if (left > 2) pages.push('...');
    for (let p = left; p <= right; p++) pages.push(p);
    if (right < totalPages - 1) pages.push('...');
    pages.push(totalPages);
    return pages;
  })();

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }) => api.patch(`admin/utilisateurs/${id}/`, { is_active }),
    onMutate: async ({ id, is_active }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-users'] });
      const snap = queryClient.getQueriesData({ queryKey: ['admin-users'] });
      queryClient.setQueriesData({ queryKey: ['admin-users'] }, old => {
        if (!old?.results) return old;
        return { ...old, results: old.results.map(u => u.id_utilisateur === id ? { ...u, is_active } : u) };
      });
      return { snap };
    },
    onError: (_e, _v, ctx) => ctx?.snap?.forEach(([k, v]) => queryClient.setQueryData(k, v)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id) => api.post(`admin/utilisateurs/${id}/reset-password/`),
    onSuccess: () => {
      setResetMsg(t('pages.adminUserManagement.resetSuccess'));
      setTimeout(() => setResetMsg(''), 3000);
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ id, role }) => api.patch(`admin/utilisateurs/${id}/`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditingUser(null);
    },
    onError: err => alert(err.response?.data?.detail || err.message || t('pages.adminUserManagement.roleDialog.errorRoleChange')),
  });

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '4rem' }}>

      {/* Toast */}
      {resetMsg && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.875rem 1.25rem', borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          backgroundColor: 'var(--success)', color: '#fff',
          fontWeight: '700', fontSize: '0.875rem',
        }}>
          <CheckCircle2 size={16} /> {resetMsg}
        </div>
      )}

      <PageHeader
        eyebrow={t('nav.sections.administration')}
        title={t('pages.adminUserManagement.title')}
        subtitle={t('pages.adminUserManagement.subtitle')}
      />

      {/* CRUD card */}
      <div className="vl-card">

        {/* Toolbar */}
        <div className="vl-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div className="vl-search">
              <Search size={15} />
              <input
                type="text"
                placeholder={t('pages.adminUserManagement.searchPlaceholder')}
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
              />
            </div>
            <div className="vl-pills">
              {['All','Étudiant','Entreprise','Chef_Departement','Admin'].map(r => (
                <button key={r} className={`vl-pill${roleFilter === r ? ' active' : ''}`} onClick={() => setRoleFilter(r)}>
                  {r === 'All'
                    ? t('pages.adminUserManagement.all')
                    : r === 'Chef_Departement'
                    ? t('pages.adminUserManagement.chefsLabel')
                    : t(`pages.adminUserManagement.roleLabels.${r}`, { defaultValue: r })}
                </button>
              ))}
            </div>
          </div>
          {totalCount > 0 && (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700' }}>
              {t('pages.adminUserManagement.userCount', { count: totalCount })}
            </span>
          )}
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="vl-table">
            <thead>
              <tr>
                {[
                  t('pages.adminUserManagement.colAccount'),
                  t('pages.adminUserManagement.colRole'),
                  t('pages.adminUserManagement.colVerification'),
                  t('pages.adminUserManagement.colStatus'),
                  '',
                ].map((h, i) => (
                  <th key={i} className={i === 4 ? 'vl-th vl-th-r' : 'vl-th'}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i}><td colSpan={5} style={{ padding: '0.875rem 1.25rem' }}>
                    <div style={{ height: '32px', backgroundColor: 'var(--surface-section)', borderRadius: '6px', animation: 'pulse 2s infinite' }} />
                  </td></tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '5rem 1.25rem', textAlign: 'center' }}>
                  <Users size={36} style={{ color: 'var(--text-muted)', opacity: 0.35, display: 'block', margin: '0 auto 0.75rem' }} />
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '600' }}>
                    {t('pages.adminUserManagement.noUsers')}
                  </div>
                </td></tr>
              ) : users.map(user => {
                const roleConf = ROLES[user.role] || ROLES['Étudiant'];
                const avColor = `vl-c${(user.courriel?.charCodeAt(0) || 0) % 6}`;
                return (
                  <tr key={user.id_utilisateur} className="vl-row">
                    <td className="vl-td">
                      <div className="vl-identity">
                        <div className={`vl-avt ${avColor}`}>
                          {(user.courriel?.[0] || '?').toUpperCase()}
                        </div>
                        <div>
                          <div className="vl-name">{user.courriel}</div>
                          <div className="vl-sub"><Calendar size={11} />{new Date(user.cree_le).toLocaleDateString(dateLocale(i18n.language))}</div>
                        </div>
                      </div>
                    </td>
                    <td className="vl-td">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Tag color={roleConf.color} bg={roleConf.bg} icon={roleConf.Icon}>
                          {t(`pages.adminUserManagement.roleLabels.${user.role}`, { defaultValue: user.role.replace('_', ' ') })}
                        </Tag>
                        <IconBtn onClick={() => { setEditingUser(user); setSelectedRole(user.role); }} title={t('pages.adminUserManagement.changeRoleTitle')}>
                          <Pencil size={12} />
                        </IconBtn>
                      </div>
                    </td>
                    <td className="vl-td">
                      {user.is_verified
                        ? <Tag color="var(--success)" bg="var(--success-light)" icon={CheckCircle2}>{t('pages.adminUserManagement.verified')}</Tag>
                        : <Tag color="var(--warning)" bg="var(--warning-light)" icon={Clock}>{t('pages.adminUserManagement.pending')}</Tag>
                      }
                    </td>
                    <td className="vl-td">
                      <button
                        onClick={() => toggleStatusMutation.mutate({ id: user.id_utilisateur, is_active: !user.is_active })}
                        title={user.is_active ? t('pages.adminUserManagement.banTitle') : t('pages.adminUserManagement.activateTitle')}
                        className="vl-badge"
                        style={{
                          cursor: 'pointer', border: '1px solid',
                          background: user.is_active ? 'var(--success-light)' : 'var(--error-light)',
                          borderColor: user.is_active ? 'rgba(16,185,129,.2)' : 'rgba(239,68,68,.2)',
                          color: user.is_active ? 'var(--success)' : 'var(--error)',
                        }}
                      >
                        {user.is_active ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                        {user.is_active ? t('pages.adminUserManagement.active') : t('pages.adminUserManagement.banned')}
                      </button>
                    </td>
                    <td className="vl-td-r">
                      <button
                        onClick={() => resetPasswordMutation.mutate(user.id_utilisateur)}
                        disabled={resetPasswordMutation.isPending}
                        title={t('pages.adminUserManagement.resetTitle')}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                          padding: '0.45rem 0.875rem', borderRadius: '8px',
                          border: '1px solid var(--surface-border)',
                          background: 'transparent', color: 'var(--text-muted)',
                          fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-section)'; e.currentTarget.style.color = 'var(--text-main)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                      >
                        <KeyRound size={13} /> {t('pages.adminUserManagement.resetBtn')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="vl-footer">
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              {t('pages.adminUserManagement.page', { page, total: totalPages, count: totalCount })}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <PageBtn onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                <ChevronLeft size={14} />
              </PageBtn>
              {pageNumbers.map((p, idx) =>
                p === '...'
                  ? <span key={`e${idx}`} style={{ padding: '0 0.35rem', color: 'var(--text-muted)', fontWeight: '700', fontSize: '0.85rem' }}>…</span>
                  : <PageBtn key={p} onClick={() => setPage(p)} active={p === page}>{p}</PageBtn>
              )}
              <PageBtn onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
                <ChevronRight size={14} />
              </PageBtn>
            </div>
          </div>
        )}
      </div>

      {/* ── ROLE CHANGE DIALOG ── */}
      {editingUser && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}
          onClick={e => { if (e.target === e.currentTarget) setEditingUser(null); }}
        >
          <div style={{ backgroundColor: 'var(--surface-card)', borderRadius: '10px', width: '100%', maxWidth: '440px', boxShadow: '0 24px 64px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--surface-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-main)' }}>{t('pages.adminUserManagement.roleDialog.title')}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '500' }}>{editingUser.courriel}</div>
                </div>
              </div>
              <IconBtn onClick={() => setEditingUser(null)} title={t('pages.adminUserManagement.roleDialog.close')}><X size={15} /></IconBtn>
            </div>

            {/* Body */}
            <div style={{ padding: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                {t('pages.adminUserManagement.roleDialog.newRole')}
              </label>
              <select
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.875rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface-card)', color: 'var(--text-main)', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', outline: 'none' }}
              >
                <option value="Étudiant">{t('pages.adminUserManagement.roleDialog.optStudent')}</option>
                <option value="Entreprise">{t('pages.adminUserManagement.roleDialog.optCompany')}</option>
                <option value="Chef_Departement">{t('pages.adminUserManagement.roleDialog.optChef')}</option>
                <option value="Admin">{t('pages.adminUserManagement.roleDialog.optAdmin')}</option>
              </select>

              {selectedRole !== editingUser.role && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.875rem', padding: '0.75rem 1rem', borderRadius: '6px', backgroundColor: 'var(--warning-light)', color: 'var(--warning)', fontSize: '0.8rem', fontWeight: '700', border: '1px solid var(--warning)33' }}>
                  <ShieldAlert size={14} />
                  {t('pages.adminUserManagement.roleDialog.warning')}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', gap: '0.75rem', padding: '1rem 1.5rem', borderTop: '1px solid var(--surface-border)', justifyContent: 'flex-end' }}>
              <button onClick={() => setEditingUser(null)} style={{ padding: '0.6rem 1.125rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer' }}>
                {t('pages.adminUserManagement.roleDialog.cancel')}
              </button>
              <button
                onClick={() => changeRoleMutation.mutate({ id: editingUser.id_utilisateur, role: selectedRole })}
                disabled={selectedRole === editingUser.role || changeRoleMutation.isPending}
                style={{ padding: '0.6rem 1.375rem', borderRadius: '6px', border: 'none', backgroundColor: 'var(--primary)', color: '#fff', fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer', opacity: (selectedRole === editingUser.role || changeRoleMutation.isPending) ? 0.6 : 1 }}
              >
                {changeRoleMutation.isPending
                  ? t('pages.adminUserManagement.roleDialog.updating')
                  : t('pages.adminUserManagement.roleDialog.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
