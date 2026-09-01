import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

// Particle system
interface Particle {
  x: number; y: number; vx: number; vy: number;
  size: number; opacity: number; color: string; life: number;
}

const COLORS = ['#10b981','#0ea5e9','#8b5cf6','#f43f5e','#f59e0b','#06b6d4','#6366f1'];

export default function WelcomePage() {
  const { t, isRtl } = useLanguage();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const [ready, setReady] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    { icon: '🧠', key: 'feature1' as const, descKey: 'feature1Desc' as const, color: 'from-emerald-400 to-teal-500', shadow: 'shadow-emerald-200' },
    { icon: '🔐', key: 'feature2' as const, descKey: 'feature2Desc' as const, color: 'from-blue-400 to-indigo-500', shadow: 'shadow-blue-200' },
    { icon: '⚡', key: 'feature3' as const, descKey: 'feature3Desc' as const, color: 'from-amber-400 to-orange-500', shadow: 'shadow-amber-200' },
    { icon: '✨', key: 'feature4' as const, descKey: 'feature4Desc' as const, color: 'from-rose-400 to-pink-500', shadow: 'shadow-rose-200' },
  ];

  // Canvas particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Spawn initial particles
    for (let i = 0; i < 80; i++) {
      particlesRef.current.push(createParticle(canvas.width, canvas.height));
    }

    function createParticle(w: number, h: number): Particle {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -Math.random() * 0.8 - 0.2,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.6 + 0.2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        life: Math.random() * 200 + 100,
      };
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        p.opacity *= 0.998;

        // Draw glow particle
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.shadowBlur = p.size * 6;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (p.life <= 0 || p.y < -10) {
          particles[i] = createParticle(canvas.width, canvas.height);
          particles[i].y = canvas.height + 10;
        }
      }

      // Spawn occasional burst particles
      if (Math.random() < 0.3) {
        particles.push(createParticle(canvas.width, canvas.height));
        if (particles.length > 120) particles.shift();
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    const timer = setTimeout(() => { setReady(true); draw(); }, 100);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Feature carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature(f => (f + 1) % features.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { value: '99.9%', label: 'Uptime SLA' },
    { value: '256-bit', label: 'Encryption' },
    { value: '<50ms', label: 'Delivery Speed' },
    { value: '∞', label: 'Storage' },
  ];

  return (
    <div className="relative min-h-screen bg-white overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Particle canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" style={{ opacity: 0.55 }} />

      {/* Ambient gradient orbs */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 70%)', animation: 'pulse 4s ease-in-out infinite' }} />
        <div className="absolute -top-20 right-0 w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)', animation: 'pulse 5s ease-in-out infinite 1s' }} />
        <div className="absolute bottom-0 left-1/3 w-[600px] h-[600px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #0ea5e9 0%, transparent 70%)', animation: 'pulse 6s ease-in-out infinite 2s' }} />
        <div className="absolute bottom-20 right-10 w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #f43f5e 0%, transparent 70%)', animation: 'pulse 4.5s ease-in-out infinite 0.5s' }} />
      </div>

      {/* Animated scanning lines - tube light effect */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="absolute h-px w-full opacity-[0.06]"
            style={{
              top: `${20 * (i + 1)}%`,
              background: 'linear-gradient(90deg, transparent, #10b981, #0ea5e9, #8b5cf6, transparent)',
              animation: `shimmer ${3 + i * 0.5}s linear infinite ${i * 0.7}s`,
              backgroundSize: '200% 100%',
            }} />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Nav */}
        <nav className="flex items-center justify-between px-8 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xl font-black" style={{
              background: 'linear-gradient(135deg, #10b981, #0ea5e9, #8b5cf6)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 12px rgba(16,185,129,0.4))',
            }}>
                UniMail
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')}
              className="px-5 py-2 rounded-xl text-slate-600 hover:text-slate-800 font-semibold text-sm transition-colors hover:bg-slate-50">
              {t('login')}
            </button>
            <button onClick={() => navigate('/signup')}
              className="px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-lg transition-all hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)', boxShadow: '0 4px 20px rgba(16,185,129,0.35)' }}>
              {t('getStarted')}
            </button>
          </div>
        </nav>

        {/* HERO */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-16 text-center">
          {/* Live badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 border transition-all ${ready ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{
              background: 'rgba(16,185,129,0.08)',
              borderColor: 'rgba(16,185,129,0.25)',
              transitionDuration: '600ms',
            }}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
            <span className="w-2 h-2 rounded-full bg-emerald-500 absolute" />
            <span className="text-emerald-700 text-xs font-bold tracking-wider">LIVE • ENTERPRISE EMAIL PLATFORM</span>
          </div>

          {/* Main title */}
          <h1 className={`text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6 transition-all ${ready ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDuration: '700ms', transitionDelay: '100ms' }}>
            <span style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #10b981 70%, #0ea5e9 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 2px 8px rgba(16,185,129,0.2))',
            }}>
              {t('welcomeTitle')}
            </span>
          </h1>

          <p className={`text-xl text-slate-500 max-w-2xl mb-10 leading-relaxed transition-all ${ready ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDuration: '700ms', transitionDelay: '200ms' }}>
            {t('welcomeSubtitle')}
          </p>

          {/* CTA buttons */}
          <div className={`flex flex-col sm:flex-row items-center gap-4 mb-16 transition-all ${ready ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDuration: '700ms', transitionDelay: '300ms' }}>
            <button onClick={() => navigate('/signup')}
              className="group px-10 py-4 rounded-2xl text-white text-base font-bold shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
              style={{ background: 'linear-gradient(135deg, #10b981, #0d9488, #0ea5e9)', boxShadow: '0 8px 32px rgba(16,185,129,0.4)' }}>
              <span>{t('getStarted')}</span>
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
            <button onClick={() => navigate('/login')}
              className="px-10 py-4 rounded-2xl text-slate-700 text-base font-bold border-2 border-slate-200 hover:border-slate-300 bg-white/80 backdrop-blur transition-all hover:scale-105 active:scale-95">
              {t('signIn')} →
            </button>
          </div>

          {/* Stats bar */}
          <div className={`flex flex-wrap justify-center gap-8 mb-16 transition-all ${ready ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDuration: '700ms', transitionDelay: '400ms' }}>
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-black" style={{
                  background: 'linear-gradient(135deg, #10b981, #0ea5e9)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.3))',
                }}>{stat.value}</div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Feature cards */}
          <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl w-full transition-all ${ready ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDuration: '700ms', transitionDelay: '500ms' }}>
            {features.map((f, i) => (
              <div key={i}
                className={`relative overflow-hidden rounded-2xl p-5 border transition-all cursor-pointer hover:scale-105 hover:-translate-y-1 ${currentFeature === i ? 'border-emerald-200 bg-white shadow-xl' : 'border-slate-100 bg-white/60 shadow-sm'}`}
                onClick={() => setCurrentFeature(i)}
                style={{ transitionDuration: '300ms' }}>
                {currentFeature === i && (
                  <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-5 rounded-2xl`} />
                )}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 shadow-md ${f.shadow} bg-gradient-to-br ${f.color}`}>
                  {f.icon}
                </div>
                <p className="text-sm font-bold text-slate-800 mb-1">{t(f.key)}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{t(f.descKey)}</p>
                {currentFeature === i && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-b-2xl" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom wave decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-0">
          <svg viewBox="0 0 1440 120" className="w-full h-full" preserveAspectRatio="none">
            <path d="M0,60 C360,120 1080,0 1440,60 L1440,120 L0,120 Z"
              fill="rgba(16,185,129,0.04)" />
            <path d="M0,80 C480,20 960,100 1440,40 L1440,120 L0,120 Z"
              fill="rgba(14,165,233,0.04)" />
          </svg>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-center pb-8">
          <p className="text-xs text-slate-400">
            © 2026 UniMail • uniorbi.com • World-class Multi-Account Email Platform
          </p>
        </div>
      </div>
    </div>
  );
}
