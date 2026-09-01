import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authService, mapSupabaseUser } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LoginPage() {
  const { login, user, loading: authLoading } = useAuth();
  const { t, isRtl } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [forgotMode, setForgotMode] = useState(false);

  useEffect(() => {
    if (!authLoading && user) navigate('/', { replace: true });
    // Pre-fill email if remembered
    const savedEmail = localStorage.getItem('mf_remember_email');
    if (savedEmail) setEmail(savedEmail);
  }, [user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await authService.signInWithPassword(email, password);
      if (rememberMe) localStorage.setItem('mf_remember_email', email);
      else localStorage.removeItem('mf_remember_email');
      login(mapSupabaseUser(u));
      navigate('/');
    } catch (err: any) {
      toast.error(err.message);
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Please enter your email first'); return; }
    setLoading(true);
    try {
      await authService.sendOtp(email);
      toast.success('Recovery code sent to ' + email);
      navigate('/signup');
    } catch (err: any) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 p-4" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-15 animate-pulse" style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-10 animate-pulse" style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 70%)', animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="glass-card rounded-3xl p-8 shadow-2xl border border-white/60">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center shadow-xl"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 24px rgba(99,102,241,0.35)' }}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-black glow-text-blue">{t('appName')}</h1>
            <p className="text-slate-500 text-sm mt-1">{forgotMode ? t('forgotPassword') : t('welcome')}</p>
          </div>

          {!forgotMode ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">{t('email')}</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="input-field" placeholder="you@example.com" autoComplete="email" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">{t('password')}</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                    className="input-field pr-12" placeholder="••••••••" autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm">
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => setRememberMe(!rememberMe)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer ${rememberMe ? 'border-emerald-500' : 'border-slate-300'}`}
                    style={rememberMe ? { background: 'linear-gradient(135deg, #10b981, #0d9488)', borderColor: '#10b981' } : {}}>
                    {rememberMe && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                  </div>
                  <span className="text-sm text-slate-600">{t('rememberMe')}</span>
                </label>
                <button type="button" onClick={() => setForgotMode(true)}
                  className="text-sm font-semibold hover:underline transition-colors" style={{ color: '#6366f1' }}>
                  {t('forgotPassword')}
                </button>
              </div>

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}>
                {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('loading')}</> : t('login')}
              </button>

              <p className="text-center text-sm text-slate-500">
                <button type="button" onClick={() => navigate('/signup')}
                  className="font-semibold hover:underline" style={{ color: '#10b981' }}>{t('noAccount')}</button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-sm text-blue-700 font-medium">
                Enter your email and we'll send a recovery code.
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">{t('email')}</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="input-field" placeholder="you@example.com" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-white text-sm font-bold shadow-lg transition-all hover:scale-[1.02] disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                {loading ? t('loading') : 'Send Recovery Code'}
              </button>
              <button type="button" onClick={() => setForgotMode(false)} className="w-full text-sm text-slate-500 hover:text-slate-700 font-medium">← {t('back')}</button>
            </form>
          )}
        </div>

        {/* Welcome page link */}
        <div className="text-center mt-4">
          <button onClick={() => navigate('/welcome')} className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors">
            ← Back to Welcome page
          </button>
        </div>
      </div>
    </div>
  );
}
