import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useLauncher } from '@/contexts/LauncherContext';

const LAUNCHER_GRADIENTS: Record<number, string> = {
  1: 'from-slate-50 via-white to-blue-50',
  2: 'from-white via-emerald-50/30 to-teal-50/30',
  3: 'from-white via-rose-50/30 to-pink-50/20',
  4: 'from-white via-indigo-50/30 to-purple-50/20',
  5: 'from-white via-amber-50/30 to-yellow-50/20',
  6: 'from-white via-sky-50/30 to-cyan-50/20',
  7: 'from-white via-violet-50/30 to-fuchsia-50/20',
  8: 'from-white via-green-50/30 to-lime-50/20',
  9: 'from-white via-orange-50/30 to-red-50/20',
  10: 'from-white via-teal-50/30 to-emerald-50/20',
};

const LAUNCHER_ORBS: Record<number, [string, string, string]> = {
  1: ['bg-blue-200/25', 'bg-indigo-200/20', 'bg-cyan-200/15'],
  2: ['bg-emerald-200/25', 'bg-teal-200/20', 'bg-green-200/15'],
  3: ['bg-rose-200/25', 'bg-pink-200/20', 'bg-red-200/15'],
  4: ['bg-indigo-200/25', 'bg-purple-200/20', 'bg-violet-200/15'],
  5: ['bg-amber-200/25', 'bg-yellow-200/20', 'bg-orange-200/15'],
  6: ['bg-sky-200/25', 'bg-cyan-200/20', 'bg-blue-200/15'],
  7: ['bg-violet-200/25', 'bg-fuchsia-200/20', 'bg-purple-200/15'],
  8: ['bg-green-200/25', 'bg-lime-200/20', 'bg-emerald-200/15'],
  9: ['bg-orange-200/25', 'bg-red-200/20', 'bg-rose-200/15'],
  10: ['bg-teal-200/25', 'bg-emerald-200/20', 'bg-cyan-200/15'],
};

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { launcher } = useLauncher();

  const gradient = LAUNCHER_GRADIENTS[launcher] || LAUNCHER_GRADIENTS[1];
  const orbs = LAUNCHER_ORBS[launcher] || LAUNCHER_ORBS[1];

  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradient} flex`}>
      {/* Ambient background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className={`absolute -top-32 -left-32 w-96 h-96 ${orbs[0]} rounded-full blur-3xl animate-pulse`} />
        <div className={`absolute -bottom-32 -right-32 w-96 h-96 ${orbs[1]} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: '2s' }} />
        <div className={`absolute top-1/2 right-1/4 w-64 h-64 ${orbs[2]} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: '4s' }} />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex relative z-10">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden shadow-2xl">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>

        {/* Mobile FAB compose */}
        <button onClick={() => { window.location.href = '/compose'; }}
          className="lg:hidden fixed bottom-6 right-6 w-14 h-14 rounded-2xl text-white shadow-xl z-30 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)', boxShadow: '0 8px 24px rgba(16,185,129,0.4)' }}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );
}
