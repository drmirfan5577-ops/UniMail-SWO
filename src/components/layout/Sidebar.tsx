import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authService } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

function Icon({ d }: { d: string }) {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} /></svg>;
}

const NAV_ICONS = {
  inbox: "M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4",
  unified: "M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12",
  compose: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  sent: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8",
  star: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
  archive: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4",
  spam: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
  trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  allmail: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z",
  contacts: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  analytics: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  settings: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  accounts: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  record: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  integrations: "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
};

const PROVIDER_STYLES: Record<string, { from: string; to: string; emoji: string }> = {
  uniorbi: { from: '#10b981', to: '#0d9488', emoji: '🌐' },
  gmail: { from: '#EA4335', to: '#FBBC05', emoji: '📧' },
  yahoo: { from: '#6001D2', to: '#7B1FA2', emoji: '📬' },
  outlook: { from: '#0078D4', to: '#00B4D8', emoji: '📮' },
  custom: { from: '#64748b', to: '#475569', emoji: '✉️' },
};

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth();
  const { t, isRtl } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [expandAccounts, setExpandAccounts] = useState(true);

  const appName = localStorage.getItem('mf_appName') || t('appName');

  const { data: unread = 0 } = useQuery({
    queryKey: ['unread-count'],
    queryFn: async () => {
      const { count } = await supabase.from('inbox').select('*', { count: 'exact', head: true }).eq('is_read', false).eq('is_trashed', false).eq('is_spam', false);
      return count || 0;
    },
    refetchInterval: 30000,
  });

  const { data: spamCount = 0 } = useQuery({
    queryKey: ['spam-count'],
    queryFn: async () => {
      const { count } = await supabase.from('inbox').select('*', { count: 'exact', head: true }).eq('is_spam', true);
      return count || 0;
    },
    refetchInterval: 60000,
  });

  const { data: draftCount = 0 } = useQuery({
    queryKey: ['draft-count'],
    queryFn: async () => {
      const { count } = await supabase.from('drafts').select('*', { count: 'exact', head: true });
      return count || 0;
    },
    refetchInterval: 60000,
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['email-accounts'],
    queryFn: async () => {
      const { data } = await supabase.from('email_accounts').select('*').eq('is_active', true).order('is_default', { ascending: false });
      return data || [];
    },
  });

  const handleLogout = async () => {
    await authService.signOut();
    logout();
    toast.success('Signed out');
    navigate('/login');
  };

  type NavItem = { to: string; icon: string; label: string; exact?: boolean; badge?: number; gradient: string };

  const NavItemComp = ({ to, icon, label, exact, badge, gradient }: NavItem) => (
    <NavLink to={to} end={exact} onClick={onClose}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group relative ${
          isActive ? 'text-white shadow-md' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
        }`
      }
      style={({ isActive }) => isActive ? { background: `linear-gradient(135deg, ${gradient})`, boxShadow: '0 4px 12px rgba(0,0,0,0.12)' } : {}}>
      <span className="flex-shrink-0"><Icon d={NAV_ICONS[icon as keyof typeof NAV_ICONS] || NAV_ICONS.inbox} /></span>
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
      {!collapsed && badge !== undefined && badge > 0 && (
        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black min-w-[18px] text-center bg-white/30 text-white backdrop-blur-sm">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </NavLink>
  );

  return (
    <aside className={`h-full flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'} glass-sidebar border-r border-slate-100/60 overflow-y-auto`}>
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 pb-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
          style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}>
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <span className="font-black text-base block leading-tight" style={{ background: 'linear-gradient(135deg, #10b981, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {appName}
            </span>
            <span className="text-[10px] font-semibold text-slate-400 block">uniorbi.com</span>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)}
          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center flex-shrink-0 transition-colors">
          <svg className={`w-4 h-4 text-slate-500 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Compose CTA */}
      {!collapsed && (
        <div className="px-3 mb-3">
          <NavLink to="/compose" onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-white text-sm font-bold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #10b981, #0d9488, #0ea5e9)', boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            {t('compose')}
          </NavLink>
        </div>
      )}

      <div className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {/* Main */}
        <NavItemComp to="/" icon="inbox" label={t('inbox')} exact badge={unread} gradient="#10b981, #0d9488" />
        <NavItemComp to="/unified" icon="unified" label={t('unifiedInbox')} gradient="#6366f1, #8b5cf6" />
        <NavItemComp to="/starred" icon="star" label={t('starred')} gradient="#f59e0b, #f97316" />
        <NavItemComp to="/sent" icon="sent" label={t('sent')} gradient="#3b82f6, #6366f1" />
        <NavItemComp to="/drafts" icon="compose" label={t('drafts')} badge={draftCount} gradient="#8b5cf6, #a855f7" />

        {/* Folders */}
        {!collapsed && <p className="text-[10px] font-black text-slate-300 uppercase tracking-wider px-1 pt-3 pb-1">Folders</p>}
        <NavItemComp to="/archive" icon="archive" label={t('archive')} gradient="#64748b, #475569" />
        <NavItemComp to="/all-mail" icon="allmail" label={t('all')} gradient="#64748b, #475569" />
        <NavItemComp to="/spam" icon="spam" label={t('spam')} badge={spamCount} gradient="#f97316, #ef4444" />
        <NavItemComp to="/trash" icon="trash" label={t('trash')} gradient="#ef4444, #dc2626" />

        {/* Accounts */}
        {!collapsed && (
          <div className="pt-3">
            <button onClick={() => setExpandAccounts(!expandAccounts)}
              className="w-full flex items-center justify-between px-1 pb-1">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-wider">Accounts</p>
              <svg className={`w-3 h-3 text-slate-300 transition-transform ${expandAccounts ? '' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>
        )}
        {expandAccounts && (
          <>
            <NavItemComp to="/accounts" icon="accounts" label={t('manageAccounts')} gradient="#10b981, #0d9488" />
            {accounts.slice(0, 4).map((acc: any) => {
              const ps = PROVIDER_STYLES[acc.provider] || PROVIDER_STYLES.custom;
              return (
                <NavLink key={acc.id} to={`/accounts?provider=${acc.provider}`} onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-all">
                  <span className="w-5 h-5 rounded-md flex items-center justify-center text-xs flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${ps.from}, ${ps.to})` }}>
                    <span className="text-white text-[9px]">{acc.email.slice(0, 1).toUpperCase()}</span>
                  </span>
                  {!collapsed && <span className="truncate flex-1">{acc.email}</span>}
                  {!collapsed && acc.is_default && <span className="text-[9px] text-emerald-500 font-bold">DEFAULT</span>}
                </NavLink>
              );
            })}
            {!collapsed && (
              <NavLink to="/accounts" onClick={onClose}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                {t('addAccount')}
              </NavLink>
            )}
          </>
        )}

        {/* Tools */}
        {!collapsed && <p className="text-[10px] font-black text-slate-300 uppercase tracking-wider px-1 pt-3 pb-1">Tools</p>}
        <NavItemComp to="/contacts" icon="contacts" label={t('contacts')} gradient="#06b6d4, #0ea5e9" />
        <NavItemComp to="/analytics" icon="analytics" label={t('analytics')} gradient="#8b5cf6, #6366f1" />
        <NavItemComp to="/record-room" icon="record" label={t('recordRoom')} gradient="#f59e0b, #d97706" />
        <NavItemComp to="/integrations" icon="integrations" label={t('integrations')} gradient="#64748b, #475569" />
        <NavItemComp to="/settings" icon="settings" label={t('settings')} gradient="#64748b, #475569" />
      </div>

      {/* Theme toggle */}
      <div className="px-3 py-2 flex-shrink-0">
        <button onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors">
          <span className="flex-shrink-0 text-base">{theme === 'light' ? '🌙' : '☀️'}</span>
          {!collapsed && <span>{theme === 'light' ? t('darkMode') : t('lightMode')}</span>}
        </button>
      </div>

      {/* User */}
      <div className="px-3 pb-4 border-t border-slate-100 pt-3 flex-shrink-0">
        <div className={`flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-black flex-shrink-0 shadow-sm"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            {user?.email?.slice(0, 2).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-700 truncate">{user?.username}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          )}
          {!collapsed && (
            <button onClick={handleLogout} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors" title={t('logout')}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
