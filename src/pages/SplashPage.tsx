import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLauncher } from '@/contexts/LauncherContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

const LAUNCHER_THEMES = [
  { id: 1, name: 'Crystal White', bg: 'from-white via-slate-50 to-blue-50', primary: '#3b82f6', secondary: '#06b6d4', icon: '💎', particles: ['#3b82f6','#06b6d4','#8b5cf6'] },
  { id: 2, name: 'Emerald Dream', bg: 'from-white via-emerald-50 to-teal-50', primary: '#10b981', secondary: '#0d9488', icon: '🌿', particles: ['#10b981','#0d9488','#06b6d4'] },
  { id: 3, name: 'Crimson Bloom', bg: 'from-white via-rose-50 to-pink-50', primary: '#f43f5e', secondary: '#ec4899', icon: '🌹', particles: ['#f43f5e','#ec4899','#db2777'] },
  { id: 4, name: 'Sapphire Mist', bg: 'from-white via-indigo-50 to-purple-50', primary: '#6366f1', secondary: '#8b5cf6', icon: '🔮', particles: ['#6366f1','#8b5cf6','#a855f7'] },
  { id: 5, name: 'Golden Hour', bg: 'from-white via-amber-50 to-yellow-50', primary: '#f59e0b', secondary: '#eab308', icon: '✨', particles: ['#f59e0b','#eab308','#f97316'] },
  { id: 6, name: 'Ocean Pulse', bg: 'from-white via-sky-50 to-cyan-50', primary: '#0ea5e9', secondary: '#06b6d4', icon: '🌊', particles: ['#0ea5e9','#06b6d4','#38bdf8'] },
  { id: 7, name: 'Violet Storm', bg: 'from-white via-violet-50 to-fuchsia-50', primary: '#7c3aed', secondary: '#d946ef', icon: '⚡', particles: ['#7c3aed','#d946ef','#c026d3'] },
  { id: 8, name: 'Mint Fresh', bg: 'from-white via-green-50 to-lime-50', primary: '#22c55e', secondary: '#84cc16', icon: '🍃', particles: ['#22c55e','#84cc16','#16a34a'] },
  { id: 9, name: 'Coral Reef', bg: 'from-white via-orange-50 to-red-50', primary: '#f97316', secondary: '#ef4444', icon: '🪸', particles: ['#f97316','#ef4444','#ea580c'] },
  { id: 10, name: 'Aurora Borealis', bg: 'from-white via-teal-50 to-emerald-50', primary: '#14b8a6', secondary: '#10b981', icon: '🌌', particles: ['#14b8a6','#10b981','#06b6d4'] },
];

export default function WelcomeSplashPage() {
  const { launcher } = useLauncher();
  const { setLaunched } = useLauncher();
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'entering' | 'loading' | 'ready'>('entering');
  const theme = LAUNCHER_THEMES.find(l => l.id === launcher) || LAUNCHER_THEMES[1];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number; color: string; life: number; maxLife: number }[] = [];

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -Math.random() * 1.5 - 0.5,
        size: Math.random() * 4 + 1,
        opacity: Math.random() * 0.8 + 0.2,
        color: theme.particles[Math.floor(Math.random() * theme.particles.length)],
        life: 0,
        maxLife: Math.random() * 150 + 80,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.life++;
        const lifeFrac = p.life / p.maxLife;
        const alpha = lifeFrac < 0.1 ? lifeFrac * 10 : lifeFrac > 0.7 ? (1 - lifeFrac) * (10/3) : 1;
        ctx.save();
        ctx.globalAlpha = p.opacity * alpha;
        ctx.shadowBlur = p.size * 8;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        if (p.life >= p.maxLife || p.y < -20) {
          particles[i] = { x: Math.random() * canvas.width, y: canvas.height + 10, vx: (Math.random() - 0.5) * 1.2, vy: -Math.random() * 1.5 - 0.5, size: Math.random() * 4 + 1, opacity: Math.random() * 0.8 + 0.2, color: theme.particles[Math.floor(Math.random() * theme.particles.length)], life: 0, maxLife: Math.random() * 150 + 80 };
        }
      }
      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    const enterTimer = setTimeout(() => setPhase('loading'), 400);
    const progInterval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(progInterval); return 100; }
        return p + Math.random() * 8 + 3;
      });
    }, 80);

    const readyTimer = setTimeout(() => setPhase('ready'), 1800);

    return () => {
      cancelAnimationFrame(animRef.current);
      clearTimeout(enterTimer);
      clearTimeout(readyTimer);
      clearInterval(progInterval);
    };
  }, [launcher]);

  const handleEnter = () => {
    setLaunched(true);
    if (user) navigate('/');
    else navigate('/login');
  };

  useEffect(() => {
    if (phase === 'ready') {
      const timer = setTimeout(handleEnter, 400);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  return (
    <div className={`fixed inset-0 bg-gradient-to-br ${theme.bg} flex flex-col items-center justify-center overflow-hidden`}>
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ opacity: 0.6 }} />

      {/* Animated rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="absolute rounded-full border opacity-20"
            style={{
              width: `${(i + 1) * 180}px`, height: `${(i + 1) * 180}px`,
              borderColor: theme.primary,
              animation: `pulse ${2 + i * 0.5}s ease-in-out infinite ${i * 0.3}s`,
            }} />
        ))}
      </div>

      {/* Scanning lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="absolute h-px w-full"
            style={{
              top: `${25 * (i + 1)}%`,
              background: `linear-gradient(90deg, transparent, ${theme.primary}40, ${theme.secondary}40, transparent)`,
              animation: `shimmer ${2.5 + i * 0.7}s linear infinite ${i * 0.9}s`,
              backgroundSize: '200% 100%',
            }} />
        ))}
      </div>

      {/* Main content */}
      <div className={`relative z-10 text-center transition-all duration-700 ${phase !== 'entering' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Icon */}
        <div className="relative mx-auto w-28 h-28 mb-6">
          <div className="w-28 h-28 rounded-3xl flex items-center justify-center text-5xl shadow-2xl"
            style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`, boxShadow: `0 20px 60px ${theme.primary}50` }}>
            {theme.icon}
          </div>
          {/* Glow ring */}
          <div className="absolute inset-0 rounded-3xl animate-ping opacity-20"
            style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }} />
        </div>

        {/* App name */}
        <h1 className="text-5xl font-black mb-2"
          style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: `drop-shadow(0 0 20px ${theme.primary}60)` }}>
          {localStorage.getItem('mf_appName') || 'UniMail'}
        </h1>

        <p className="text-slate-500 text-base font-medium mb-2">{t('tagline')}</p>
        <p className="text-xs font-bold mb-8" style={{ color: theme.primary }}>uniorbi.com</p>

        {/* Theme badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-8"
          style={{ borderColor: `${theme.primary}30`, background: `${theme.primary}08` }}>
          <span className="w-2 h-2 rounded-full animate-ping" style={{ background: theme.primary }} />
          <span className="text-xs font-bold" style={{ color: theme.primary }}>{theme.name}</span>
        </div>

        {/* Progress bar */}
        <div className="w-64 mx-auto">
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-3">
            <div className="h-1.5 rounded-full transition-all duration-150"
              style={{ width: `${Math.min(progress, 100)}%`, background: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})`, boxShadow: `0 0 12px ${theme.primary}60` }} />
          </div>
          <p className="text-xs text-slate-400 font-medium">
            {phase === 'ready' ? '✓ Ready' : `Loading… ${Math.min(Math.round(progress), 100)}%`}
          </p>
        </div>
      </div>

      {/* Bottom branding */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-xs text-slate-300 font-medium">UniMail • uniorbi.com • Enterprise Edition</p>
      </div>
    </div>
  );
}
