import React, { useState } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLauncher } from '@/contexts/LauncherContext';
import type { Language, LauncherStyle } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Label } from '@/types';

const ADMIN_PASSWORD = '1122abcd';

const LAUNCHER_DATA = [
  { id: 1, name: 'Crystal White', style: 'from-white via-slate-50 to-blue-50', icon: '💎', gradient: 'from-blue-400 to-cyan-400' },
  { id: 2, name: 'Emerald Dream', style: 'from-white via-emerald-50 to-teal-50', icon: '🌿', gradient: 'from-emerald-400 to-teal-500' },
  { id: 3, name: 'Crimson Bloom', style: 'from-white via-rose-50 to-pink-50', icon: '🌹', gradient: 'from-rose-400 to-pink-500' },
  { id: 4, name: 'Sapphire Mist', style: 'from-white via-indigo-50 to-purple-50', icon: '🔮', gradient: 'from-indigo-400 to-purple-500' },
  { id: 5, name: 'Golden Hour', style: 'from-white via-amber-50 to-yellow-50', icon: '✨', gradient: 'from-amber-400 to-yellow-500' },
  { id: 6, name: 'Ocean Pulse', style: 'from-white via-sky-50 to-cyan-50', icon: '🌊', gradient: 'from-sky-400 to-cyan-500' },
  { id: 7, name: 'Violet Storm', style: 'from-white via-violet-50 to-fuchsia-50', icon: '⚡', gradient: 'from-violet-400 to-fuchsia-500' },
  { id: 8, name: 'Mint Fresh', style: 'from-white via-green-50 to-lime-50', icon: '🍃', gradient: 'from-green-400 to-lime-500' },
  { id: 9, name: 'Coral Reef', style: 'from-white via-orange-50 to-red-50', icon: '🪸', gradient: 'from-orange-400 to-red-500' },
  { id: 10, name: 'Aurora Borealis', style: 'from-white via-teal-50 to-emerald-50', icon: '🌌', gradient: 'from-teal-400 to-emerald-500' },
];

const LABEL_COLORS_LIST = ['#10b981','#3b82f6','#8b5cf6','#ef4444','#f59e0b','#06b6d4','#ec4899','#84cc16'];

type SettingsTab = 'general' | 'appearance' | 'launcher' | 'language' | 'labels' | 'accounts' | 'notifications' | 'security' | 'about';

export default function SettingsPage() {
  const { t, lang, setLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { launcher, setLauncher } = useLauncher();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [pw, setPw] = useState('');
  const [tab, setTab] = useState<SettingsTab>('general');
  const [appName, setAppName] = useState(localStorage.getItem('mf_appName') || 'UniMail');
  const [animations, setAnimations] = useState(localStorage.getItem('mf_animations') !== 'false');
  const [autoSave, setAutoSave] = useState(localStorage.getItem('mf_autosave') !== 'false');
  const [density, setDensity] = useState(localStorage.getItem('mf_density') || 'comfortable');
  const [notifSound, setNotifSound] = useState(localStorage.getItem('mf_notif_sound') !== 'false');
  const [notifDesktop, setNotifDesktop] = useState(localStorage.getItem('mf_notif_desktop') !== 'false');
  const [signature, setSignature] = useState(localStorage.getItem('mf_signature') || '');
  const [displayName, setDisplayName] = useState(localStorage.getItem('mf_display_name') || user?.username || '');
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#10b981');

  const { data: labels = [] } = useQuery({
    queryKey: ['labels'],
    queryFn: async () => {
      const { data, error } = await supabase.from('labels').select('*').order('name');
      if (error) throw error;
      return data as Label[];
    },
  });

  const createLabel = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('labels').insert({ user_id: user!.id, name: newLabelName, color: newLabelColor });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['labels'] }); setNewLabelName(''); toast.success('Label created'); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteLabel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('labels').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['labels'] }); toast.success('Label deleted'); },
  });

  const handleAdminUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) { setAdminUnlocked(true); setPw(''); toast.success('Admin unlocked'); }
    else { toast.error(t('wrongPassword')); setPw(''); }
  };

  const handleSave = () => {
    localStorage.setItem('mf_appName', appName);
    localStorage.setItem('mf_animations', String(animations));
    localStorage.setItem('mf_autosave', String(autoSave));
    localStorage.setItem('mf_density', density);
    localStorage.setItem('mf_notif_sound', String(notifSound));
    localStorage.setItem('mf_notif_desktop', String(notifDesktop));
    localStorage.setItem('mf_signature', signature);
    localStorage.setItem('mf_display_name', displayName);
    toast.success(t('settingsSaved'));
  };

  const handleLogout = async () => { await authService.signOut(); logout(); navigate('/login'); };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button onClick={onChange} className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${value ? '' : 'bg-slate-200'}`}
      style={value ? { background: 'linear-gradient(135deg, #10b981, #0d9488)' } : {}}>
      <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-all ${value ? 'translate-x-6' : 'translate-x-0.5'}`} />
    </button>
  );

  const AdminGate = ({ children }: { children: React.ReactNode }) => {
    if (adminUnlocked) return <>{children}</>;
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-700 mb-1">Admin Required</h3>
        <p className="text-sm text-slate-400 mb-5">Enter admin password to access these settings</p>
        <form onSubmit={handleAdminUnlock} className="flex gap-3 w-full max-w-xs">
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} required placeholder={t('enterAdminPw')} className="input-field flex-1 text-center" />
          <button type="submit" className="px-4 py-2 rounded-xl text-white font-semibold text-sm" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>{t('unlock')}</button>
        </form>
      </div>
    );
  };

  const settingsTabs: { id: SettingsTab; icon: string; label: string }[] = [
    { id: 'general', icon: '⚙️', label: t('general') },
    { id: 'appearance', icon: '🎨', label: t('appearance') },
    { id: 'launcher', icon: '🚀', label: t('launcherSettings') },
    { id: 'language', icon: '🌐', label: t('languageSettings') },
    { id: 'labels', icon: '🏷️', label: t('labels') },
    { id: 'accounts', icon: '👤', label: t('accounts') },
    { id: 'notifications', icon: '🔔', label: t('notificationSettings') },
    { id: 'security', icon: '🔐', label: t('privacySettings') },
    { id: 'about', icon: 'ℹ️', label: t('about') },
  ];

  return (
    <div className="h-full flex gap-6 overflow-hidden">
      {/* Tabs sidebar */}
      <div className="w-52 flex-shrink-0 space-y-1 overflow-y-auto">
        {settingsTabs.map(st => (
          <button key={st.id} onClick={() => setTab(st.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${tab === st.id ? 'text-white shadow-md' : 'text-slate-600 bg-white/80 hover:bg-slate-50'}`}
            style={tab === st.id ? { background: 'linear-gradient(135deg, #10b981, #0d9488)', boxShadow: '0 4px 12px rgba(16,185,129,0.25)' } : {}}>
            <span>{st.icon}</span><span>{st.label}</span>
          </button>
        ))}
        <div className="pt-2">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-500 bg-white/80 hover:bg-rose-50 transition-colors text-left">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            {t('logout')}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pr-1">
        {/* General */}
        {tab === 'general' && (
          <div className="space-y-5">
            <div><h2 className="text-xl font-black text-slate-800">{t('general')}</h2></div>
            <div className="p-5 rounded-2xl border border-slate-100 bg-white/80">
              <div className="flex items-center gap-4 mb-1">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-black shadow-md" style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}>
                  {user?.email?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-slate-800">{user?.username}</p>
                  <p className="text-sm text-slate-500">{user?.email}</p>
                </div>
              </div>
            </div>
            <AdminGate>
              <div className="p-5 rounded-2xl border border-slate-100 bg-white/80 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">App Name</label>
                  <input value={appName} onChange={e => setAppName(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Display Name</label>
                  <input value={displayName} onChange={e => setDisplayName(e.target.value)} className="input-field" placeholder="Your Name" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Email Signature</label>
                  <textarea value={signature} onChange={e => setSignature(e.target.value)} rows={3} className="input-field resize-none" placeholder="-- Your signature..." />
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div><p className="font-semibold text-slate-700 text-sm">{t('autoSave')}</p><p className="text-xs text-slate-400">Auto-save drafts to database every 10s</p></div>
                  <Toggle value={autoSave} onChange={() => setAutoSave(!autoSave)} />
                </div>
              </div>
            </AdminGate>
            <button onClick={handleSave} className="btn-primary">{t('saveSettings')}</button>
          </div>
        )}

        {/* Appearance */}
        {tab === 'appearance' && (
          <div className="space-y-5">
            <div><h2 className="text-xl font-black text-slate-800">{t('appearance')}</h2></div>
            <div className="p-5 rounded-2xl border border-slate-100 bg-white/80 space-y-4">
              <h3 className="font-bold text-slate-700">Theme</h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => theme === 'dark' && toggleTheme()} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${theme === 'light' ? 'border-emerald-400 bg-emerald-50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}>
                  <span className="text-3xl">☀️</span>
                  <span className={`font-bold text-sm ${theme === 'light' ? 'text-emerald-700' : 'text-slate-600'}`}>{t('lightMode')}</span>
                </button>
                <button onClick={() => theme === 'light' && toggleTheme()} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${theme === 'dark' ? 'border-emerald-400 bg-slate-800' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}>
                  <span className="text-3xl">🌙</span>
                  <span className={`font-bold text-sm ${theme === 'dark' ? 'text-emerald-400' : 'text-slate-600'}`}>{t('darkMode')}</span>
                </button>
              </div>
              <h3 className="font-bold text-slate-700 pt-2">Density</h3>
              <div className="grid grid-cols-3 gap-2">
                {['compact','comfortable','spacious'].map(d => (
                  <button key={d} onClick={() => setDensity(d)}
                    className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all capitalize ${density === d ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200'}`}>
                    {d}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div><p className="font-semibold text-slate-700 text-sm">{t('animations')}</p><p className="text-xs text-slate-400">Smooth UI transitions</p></div>
                <Toggle value={animations} onChange={() => setAnimations(!animations)} />
              </div>
            </div>
            <button onClick={handleSave} className="btn-primary">{t('saveSettings')}</button>
          </div>
        )}

        {/* Launcher */}
        {tab === 'launcher' && (
          <div className="space-y-5">
            <div><h2 className="text-xl font-black text-slate-800">{t('launcherSettings')}</h2>
            <p className="text-sm text-slate-500 mt-0.5">Choose the visual theme at app startup</p></div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {LAUNCHER_DATA.map(l => (
                <button key={l.id} onClick={() => setLauncher(l.id as LauncherStyle)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all hover:scale-105 bg-gradient-to-br ${l.style} ${launcher === l.id ? 'border-emerald-400 shadow-lg shadow-emerald-100' : 'border-white/80 hover:border-slate-200'}`}>
                  {launcher === l.id && (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center mb-2">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </div>
                  )}
                  <div className={`text-2xl mb-2 launcher-icon-${l.id}`}>{l.icon}</div>
                  <div className={`text-xs font-bold bg-gradient-to-r ${l.gradient} bg-clip-text text-transparent`}>{l.name}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Language */}
        {tab === 'language' && (
          <div className="space-y-5">
            <div><h2 className="text-xl font-black text-slate-800">{t('languageSettings')}</h2></div>
            <div className="grid grid-cols-3 gap-3">
              {([['en','English','🇺🇸'],['ur','اردو','🇵🇰'],['ar','عربي','🇸🇦']] as [Language, string, string][]).map(([code, label, flag]) => (
                <button key={code} onClick={() => setLang(code)}
                  className={`p-5 rounded-2xl border-2 transition-all text-center flex flex-col items-center gap-2 ${lang === code ? 'border-emerald-400 bg-emerald-50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}>
                  <span className="text-3xl">{flag}</span>
                  <span className={`font-bold text-sm ${lang === code ? 'text-emerald-700' : 'text-slate-600'}`}>{label}</span>
                  {lang === code && <span className="text-xs text-emerald-500 font-semibold">✓ Active</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Labels */}
        {tab === 'labels' && (
          <div className="space-y-5">
            <div><h2 className="text-xl font-black text-slate-800">{t('manageLabels')}</h2>
            <p className="text-sm text-slate-500 mt-0.5">Create color-coded labels for organizing emails</p></div>
            <div className="p-5 rounded-2xl border border-slate-100 bg-white/80 space-y-4">
              <h3 className="font-bold text-slate-700 text-sm">{t('addLabel')}</h3>
              <div className="flex gap-3">
                <input value={newLabelName} onChange={e => setNewLabelName(e.target.value)}
                  placeholder="Label name..." className="input-field flex-1" />
                <div className="flex gap-1.5">
                  {LABEL_COLORS_LIST.map(c => (
                    <button key={c} type="button" onClick={() => setNewLabelColor(c)}
                      className={`w-8 h-8 rounded-xl transition-all hover:scale-110 flex-shrink-0 ${newLabelColor === c ? 'ring-2 ring-offset-1 ring-slate-500 scale-110' : ''}`}
                      style={{ background: c }} />
                  ))}
                </div>
                <button onClick={() => { if (!newLabelName.trim()) return; createLabel.mutate(); }}
                  disabled={createLabel.isPending || !newLabelName.trim()}
                  className="px-4 py-2 rounded-xl text-white font-bold text-sm transition-all hover:scale-105 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}>
                  + Add
                </button>
              </div>
            </div>
            {labels.length > 0 && (
              <div className="space-y-2">
                {labels.map(lb => (
                  <div key={lb.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 bg-white/80">
                    <div className="w-8 h-8 rounded-xl flex-shrink-0" style={{ background: lb.color }} />
                    <span className="flex-1 font-semibold text-slate-700">{lb.name}</span>
                    <button onClick={() => deleteLabel.mutate(lb.id)} className="w-8 h-8 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Accounts shortcut */}
        {tab === 'accounts' && (
          <div className="space-y-5">
            <div><h2 className="text-xl font-black text-slate-800">{t('accounts')}</h2></div>
            <div className="p-5 rounded-2xl border border-slate-100 bg-white/80 text-center">
              <div className="text-5xl mb-3">📬</div>
              <p className="text-slate-600 font-semibold mb-4">Manage all your connected email accounts in the Accounts Manager.</p>
              <button onClick={() => navigate('/accounts')} className="btn-primary mx-auto">{t('manageAccounts')}</button>
            </div>
          </div>
        )}

        {/* Notifications */}
        {tab === 'notifications' && (
          <div className="space-y-5">
            <div><h2 className="text-xl font-black text-slate-800">{t('notificationSettings')}</h2></div>
            <div className="p-5 rounded-2xl border border-slate-100 bg-white/80 space-y-4">
              {[
                { label: 'Desktop Notifications', sub: 'Show browser notifications for new emails', val: notifDesktop, set: () => setNotifDesktop(!notifDesktop) },
                { label: 'Sound Alerts', sub: 'Play sound when receiving emails', val: notifSound, set: () => setNotifSound(!notifSound) },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div><p className="font-semibold text-slate-700 text-sm">{item.label}</p><p className="text-xs text-slate-400">{item.sub}</p></div>
                  <Toggle value={item.val} onChange={item.set} />
                </div>
              ))}
            </div>
            <button onClick={handleSave} className="btn-primary">{t('saveSettings')}</button>
          </div>
        )}

        {/* Security */}
        {tab === 'security' && (
          <div className="space-y-5">
            <div><h2 className="text-xl font-black text-slate-800">{t('privacySettings')}</h2></div>
            <AdminGate>
              <div className="space-y-3">
                <div className="p-5 rounded-2xl border border-slate-100 bg-white/80">
                  <h3 className="font-bold text-slate-700 mb-3">Security Status</h3>
                  <div className="space-y-2">
                    {[
                      { icon: '✅', label: 'Email OTP Verification', desc: 'Active — all signups require email verification', bg: 'bg-emerald-100' },
                      { icon: '🔒', label: 'PKCE Auth Flow', desc: 'Active — industry standard OAuth protection', bg: 'bg-blue-100' },
                      { icon: '🛡️', label: 'Row Level Security', desc: 'Active — database-level per-user access control', bg: 'bg-purple-100' },
                      { icon: '📧', label: 'Resend API (Server-Side)', desc: 'API key stored in server secrets — never exposed to client', bg: 'bg-amber-100' },
                      { icon: '🌐', label: 'PWA Service Worker', desc: 'Active — offline caching and app installation', bg: 'bg-teal-100' },
                    ].map((s, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center flex-shrink-0`}>{s.icon}</div>
                        <div><p className="text-sm font-semibold text-slate-700">{s.label}</p><p className="text-xs text-slate-400">{s.desc}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-5 rounded-2xl border border-red-100 bg-red-50">
                  <h3 className="font-bold text-red-700 mb-3">Danger Zone</h3>
                  <button onClick={handleLogout} className="px-5 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors">
                    Sign Out of All Sessions
                  </button>
                </div>
              </div>
            </AdminGate>
          </div>
        )}

        {/* About */}
        {tab === 'about' && (
          <div className="space-y-5">
            <div><h2 className="text-xl font-black text-slate-800">{t('about')}</h2></div>
            <div className="p-6 rounded-2xl border border-white/60 bg-white/80 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-3xl flex items-center justify-center shadow-xl"
                style={{ background: 'linear-gradient(135deg, #10b981, #0d9488, #0ea5e9)' }}>
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-black" style={{ background: 'linear-gradient(135deg, #10b981, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                UniMail
              </h3>
              <p className="text-slate-400 text-sm mt-0.5 font-medium">uniorbi.com</p>
              <p className="text-slate-500 text-sm mt-1">{t('tagline')}</p>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-700">Version 3.0 • Enterprise Edition</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: '⚛️', label: 'React 18', sub: 'UI Framework' },
                { icon: '🔷', label: 'TypeScript', sub: 'Type Safety' },
                { icon: '🗄️', label: 'Supabase', sub: 'Backend & Auth' },
                { icon: '📬', label: 'Resend', sub: 'Email Delivery' },
                { icon: '🎨', label: 'Tailwind CSS', sub: 'Styling' },
                { icon: '📱', label: 'PWA Ready', sub: 'Installable App' },
              ].map((tech, i) => (
                <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-white/80 flex items-center gap-3">
                  <span className="text-2xl">{tech.icon}</span>
                  <div><p className="text-sm font-bold text-slate-700">{tech.label}</p><p className="text-xs text-slate-400">{tech.sub}</p></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
