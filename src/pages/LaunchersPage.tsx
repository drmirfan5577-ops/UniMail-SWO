import React from 'react';
import { useLauncher } from '@/contexts/LauncherContext';
import { useLanguage } from '@/contexts/LanguageContext';
import type { LauncherStyle } from '@/types';

const launchers: { id: LauncherStyle; name: string; style: string; icon: string; gradient: string; glow: string }[] = [
  { id: 1, name: 'Crystal White', style: 'from-white via-slate-50 to-blue-50', icon: '💎', gradient: 'from-blue-400 to-cyan-400', glow: 'glow-blue' },
  { id: 2, name: 'Emerald Dream', style: 'from-white via-emerald-50 to-teal-50', icon: '🌿', gradient: 'from-emerald-400 to-teal-500', glow: 'glow-emerald' },
  { id: 3, name: 'Crimson Bloom', style: 'from-white via-rose-50 to-pink-50', icon: '🌹', gradient: 'from-rose-400 to-pink-500', glow: 'glow-crimson' },
  { id: 4, name: 'Sapphire Mist', style: 'from-white via-indigo-50 to-purple-50', icon: '🔮', gradient: 'from-indigo-400 to-purple-500', glow: 'glow-indigo' },
  { id: 5, name: 'Golden Hour', style: 'from-white via-amber-50 to-yellow-50', icon: '✨', gradient: 'from-amber-400 to-yellow-500', glow: 'glow-amber' },
  { id: 6, name: 'Ocean Pulse', style: 'from-white via-sky-50 to-cyan-50', icon: '🌊', gradient: 'from-sky-400 to-cyan-500', glow: 'glow-sky' },
  { id: 7, name: 'Violet Storm', style: 'from-white via-violet-50 to-fuchsia-50', icon: '⚡', gradient: 'from-violet-400 to-fuchsia-500', glow: 'glow-violet' },
  { id: 8, name: 'Mint Fresh', style: 'from-white via-green-50 to-lime-50', icon: '🍃', gradient: 'from-green-400 to-lime-500', glow: 'glow-green' },
  { id: 9, name: 'Coral Reef', style: 'from-white via-orange-50 to-red-50', icon: '🪸', gradient: 'from-orange-400 to-red-500', glow: 'glow-orange' },
  { id: 10, name: 'Aurora Borealis', style: 'from-white via-teal-50 to-emerald-50', icon: '🌌', gradient: 'from-teal-400 to-emerald-500', glow: 'glow-teal' },
];

export default function LaunchersPage() {
  const { launcher, setLauncher, setLaunched } = useLauncher();
  const { t } = useLanguage();

  const handleSelect = (id: LauncherStyle) => {
    setLauncher(id);
    setLaunched(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex flex-col items-center justify-center p-6">
      {/* Animated orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-rose-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 text-center mb-10">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
            {t('appName')}
          </h1>
        </div>
        <h2 className="text-xl font-semibold text-slate-700">{t('selectLauncher')}</h2>
        <p className="text-slate-500 text-sm mt-1">Pick your visual theme to get started</p>
      </div>

      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 w-full max-w-5xl">
        {launchers.map(l => (
          <button
            key={l.id}
            onClick={() => handleSelect(l.id)}
            className={`group relative overflow-hidden rounded-2xl p-5 border-2 transition-all duration-300 hover:scale-105 hover:shadow-xl ${
              launcher === l.id
                ? 'border-emerald-400 shadow-lg shadow-emerald-100'
                : 'border-white/80 hover:border-slate-200'
            } bg-gradient-to-br ${l.style} backdrop-blur-sm`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${l.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
            {launcher === l.id && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <div className={`text-3xl mb-3 launcher-icon-${l.id}`}>{l.icon}</div>
            <div className={`text-xs font-bold bg-gradient-to-r ${l.gradient} bg-clip-text text-transparent`}>{l.name}</div>
          </button>
        ))}
      </div>

      <button
        onClick={() => setLaunched(true)}
        className="relative z-10 mt-8 px-10 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 transition-all hover:scale-105 active:scale-95"
      >
        {t('continue')} →
      </button>
    </div>
  );
}
