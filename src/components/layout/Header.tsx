import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import type { Language } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const PAGE_TITLES: Record<string, string> = {
  '/': 'inbox', '/sent': 'sent', '/compose': 'compose', '/contacts': 'contacts',
  '/analytics': 'analytics', '/settings': 'settings', '/starred': 'starred',
  '/spam': 'spam', '/trash': 'trash', '/archive': 'archive', '/all-mail': 'all',
  '/unified': 'unifiedInbox', '/accounts': 'accounts', '/record-room': 'recordRoom',
  '/integrations': 'integrations', '/drafts': 'drafts',
};

export default function Header({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { t, lang, setLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [pwaPrompt, setPwaPrompt] = useState<any>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setPwaPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handlePwaInstall = async () => {
    if (!pwaPrompt) return;
    pwaPrompt.prompt();
    const { outcome } = await pwaPrompt.userChoice;
    if (outcome === 'accepted') { toast.success('UniMail installed!'); setPwaPrompt(null); }
  };

  const { data: unread = 0 } = useQuery({
    queryKey: ['unread-count'],
    queryFn: async () => {
      const { count } = await supabase.from('inbox').select('*', { count: 'exact', head: true }).eq('is_read', false).eq('is_trashed', false).eq('is_spam', false);
      return count || 0;
    },
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (showSearch) searchRef.current?.focus();
  }, [showSearch]);

  const langs: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'EN', flag: '🇺🇸' },
    { code: 'ur', label: 'UR', flag: '🇵🇰' },
    { code: 'ar', label: 'AR', flag: '🇸🇦' },
  ];
  const current = langs.find(l => l.code === lang)!;
  const pageKey = PAGE_TITLES[location.pathname] || 'inbox';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/?search=${encodeURIComponent(search.trim())}`);
      setShowSearch(false);
      setSearch('');
    }
  };

  return (
    <header className="glass-header flex items-center gap-3 px-4 py-3.5 border-b border-slate-100/60" style={{ borderBottom: '1px solid rgba(226,232,240,0.6)' }}>
      {/* Mobile menu */}
      <button onClick={onMenuToggle} className="lg:hidden w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors flex-shrink-0">
        <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Page title */}
      <div className="hidden sm:block">
        <h1 className="text-base font-black text-slate-700 capitalize">{t(pageKey as any)}</h1>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-xl mx-2">
        {showSearch ? (
          <form onSubmit={handleSearch} className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)} placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 placeholder-slate-300 outline-none text-sm focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all" />
            <button type="button" onClick={() => setShowSearch(false)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </form>
        ) : (
          <button onClick={() => setShowSearch(true)}
            className="hidden sm:flex items-center gap-2 w-full max-w-sm bg-slate-50 hover:bg-slate-100 rounded-xl px-4 py-2.5 transition-colors">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-sm text-slate-400">{t('search')}</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
        {/* Mobile search */}
        <button onClick={() => setShowSearch(!showSearch)}
          className="sm:hidden w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors">
          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button onClick={() => setShowNotif(!showNotif)}
            className="relative w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-[9px] font-black flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #f43f5e, #e11d48)' }}>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          {showNotif && (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl shadow-xl border border-white/60 z-50 overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)' }}>
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-800 text-sm">Notifications</span>
                {unread > 0 && <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}>{unread} new</span>}
              </div>
              <div className="p-4">
                {unread > 0 ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white text-sm">📧</div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{unread} unread {unread === 1 ? 'email' : 'emails'}</p>
                      <p className="text-xs text-slate-500">In your inbox</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 text-center py-4">All caught up! 🎉</p>
                )}
              </div>
            </div>
          )}
          {showNotif && <div className="fixed inset-0 z-40" onClick={() => setShowNotif(false)} />}
        </div>

        {/* Language */}
        <div className="relative">
          <button onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-sm font-semibold text-slate-600 transition-colors">
            <span>{current.flag}</span>
            <span className="hidden sm:block text-xs">{current.label}</span>
            <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showLangMenu && (
            <div className="absolute right-0 top-full mt-2 w-36 rounded-xl shadow-xl border border-white/60 py-1 z-50"
              style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)' }}>
              {langs.map(l => (
                <button key={l.code} onClick={() => { setLang(l.code); setShowLangMenu(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-slate-50 transition-colors ${lang === l.code ? 'font-bold text-emerald-600' : 'text-slate-700'}`}>
                  <span>{l.flag}</span>
                  <span>{l.code === 'en' ? 'English' : l.code === 'ur' ? 'اردو' : 'عربي'}</span>
                  {lang === l.code && <span className="ml-auto text-emerald-500">✓</span>}
                </button>
              ))}
            </div>
          )}
          {showLangMenu && <div className="fixed inset-0 z-40" onClick={() => setShowLangMenu(false)} />}
        </div>

        {/* PWA Install */}
        {pwaPrompt && (
          <button onClick={handlePwaInstall}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-bold shadow-sm transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            title={t('pwaInstall')}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Install
          </button>
        )}

        {/* Theme */}
        <button onClick={toggleTheme}
          className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-base transition-colors">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        {/* Compose */}
        <button onClick={() => navigate('/compose')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-sm font-bold shadow-md transition-all hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden md:block">{t('compose')}</span>
        </button>
      </div>
    </header>
  );
}
