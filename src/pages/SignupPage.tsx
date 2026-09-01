import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authService, mapSupabaseUser } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

function PasswordStrength({ password }: { password: string }) {
  const getStrength = () => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };
  const score = getStrength();
  const labels = ['', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const colors = ['bg-slate-200', 'bg-red-400', 'bg-amber-400', 'bg-emerald-400', 'bg-emerald-600'];
  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1,2,3,4].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= score ? colors[score] : 'bg-slate-200'}`} />
        ))}
      </div>
      <p className={`text-xs font-semibold ${score <= 1 ? 'text-red-500' : score === 2 ? 'text-amber-500' : 'text-emerald-600'}`}>
        {labels[score]}
      </p>
    </div>
  );
}

type Step = 'email' | 'otp' | 'password';

export default function SignupPage() {
  const { login } = useAuth();
  const { t, isRtl } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.sendOtp(email);
      toast.success(t('otpSent'));
      setStep('otp');
    } catch (err: any) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) { toast.error('Please enter the full code'); return; }
    setLoading(true);
    try {
      const u = await authService.verifyOtpAndSetPassword(email, otp, 'temp_' + Date.now());
      toast.success('Email verified!');
      setStep('password');
    } catch (err: any) {
      // Try just verifying without setting password
      try {
        const { supabase } = await import('@/lib/supabase');
        const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
        if (error) throw error;
        toast.success('Email verified!');
        setStep('password');
      } catch (err2: any) {
        toast.error(err2.message || err.message);
      }
    } finally { setLoading(false); }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error(t('passwordMismatch')); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data, error } = await supabase.auth.updateUser({
        password,
        data: { username: email.split('@')[0] },
      });
      if (error) throw error;
      login(mapSupabaseUser(data.user!));
      navigate('/');
    } catch (err: any) {
      toast.error(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/40 p-4" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 animate-pulse" style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 70%)' }} />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full opacity-15 animate-pulse" style={{ background: 'radial-gradient(circle, #0ea5e9 0%, transparent 70%)', animationDelay: '1.5s' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="glass-card rounded-3xl p-8 shadow-2xl border border-white/60">
          {/* Logo */}
          <div className="text-center mb-7">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center shadow-xl"
              style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)', boxShadow: '0 8px 24px rgba(16,185,129,0.35)' }}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-black glow-text-emerald">{t('appName')}</h1>
            <p className="text-slate-500 text-sm mt-1">{t('createAccount')}</p>
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 mb-7">
            {(['email','otp','password'] as Step[]).map((s, i) => (
              <React.Fragment key={s}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                  step === s ? 'text-white shadow-lg' :
                  ['email','otp','password'].indexOf(step) > i ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                }`}
                  style={step === s ? { background: 'linear-gradient(135deg, #10b981, #0d9488)', boxShadow: '0 4px 12px rgba(16,185,129,0.35)' } : {}}>
                  {['email','otp','password'].indexOf(step) > i ? '✓' : i + 1}
                </div>
                {i < 2 && <div className={`w-10 h-0.5 rounded-full transition-all ${['email','otp','password'].indexOf(step) > i ? '' : 'bg-slate-200'}`}
                  style={['email','otp','password'].indexOf(step) > i ? { background: 'linear-gradient(90deg, #10b981, #0d9488)' } : {}} />}
              </React.Fragment>
            ))}
          </div>

          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">{t('email')}</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="input-field" placeholder="you@example.com" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('sending')}</> : t('sendOtp')}
              </button>
              <p className="text-center text-sm text-slate-500">
                <button type="button" onClick={() => navigate('/login')} className="font-semibold hover:underline" style={{ color: '#10b981' }}>{t('haveAccount')}</button>
              </p>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3 rounded-xl text-sm text-center" style={{ background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.2)', border: '1px solid' }}>
                <p className="text-emerald-700 font-medium">{t('otpSent')}</p>
                <p className="font-bold text-emerald-800 mt-0.5">{email}</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">{t('enterOtp')}</label>
                <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} required
                  className="input-field text-center text-3xl tracking-[0.6em] font-black" placeholder="• • • •" maxLength={6} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? t('loading') : t('verifyOtp')}
              </button>
              <button type="button" onClick={() => setStep('email')} className="w-full text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors">← {t('back')}</button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleSetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">{t('password')}</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                    className="input-field pr-12" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm">
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>
                <PasswordStrength password={password} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">{t('confirmPassword')}</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                  className={`input-field ${confirm && confirm !== password ? 'border-red-300 focus:border-red-400 focus:ring-red-50' : ''}`} placeholder="••••••••" />
                {confirm && confirm !== password && <p className="mt-1 text-xs text-red-500 font-medium">⚠️ {t('passwordMismatch')}</p>}
              </div>
              <button type="submit" disabled={loading || (!!confirm && confirm !== password)} className="btn-primary w-full">
                {loading ? t('loading') : t('createAccount')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
