import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { mapSupabaseUser } from '@/lib/auth';
import type { AuthUser } from '@/types';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

async function recordLoginEvent(userId: string, eventType: 'login' | 'logout') {
  const ua = navigator.userAgent;
  const device = /mobile/i.test(ua) ? 'Mobile' : /tablet/i.test(ua) ? 'Tablet' : 'Desktop';
  const browser = ua.includes('Chrome') ? 'Chrome' : ua.includes('Firefox') ? 'Firefox' : ua.includes('Safari') ? 'Safari' : 'Unknown';
  const { error } = await supabase.from('login_logs').insert({
    user_id: userId,
    event_type: eventType,
    user_agent: ua.slice(0, 200),
    device: `${device} / ${browser}`,
    location: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown',
  });
  if (error) console.warn('Failed to record login event', error.message);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const login = (u: AuthUser) => setUser(u);
  const logout = () => setUser(null);

  useEffect(() => {
    let mounted = true;

    // Never leave the app stuck on the loading screen if the session check stalls
    const fallback = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 5000);

    const finish = () => {
      clearTimeout(fallback);
      if (mounted) setLoading(false);
    };

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (mounted && session?.user) login(mapSupabaseUser(session.user));
      })
      .catch((err) => console.error('Failed to restore session', err))
      .finally(finish);

    // Keep this callback synchronous: calling other Supabase methods inside it
    // can deadlock the auth client, so side effects are deferred with setTimeout.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_IN' && session?.user) {
        login(mapSupabaseUser(session.user));
        finish();
        const userId = session.user.id;
        setTimeout(() => {
          recordLoginEvent(userId, 'login').catch(() => {});
        }, 0);
      } else if (event === 'SIGNED_OUT') {
        logout();
        finish();
      } else if ((event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') && session?.user) {
        login(mapSupabaseUser(session.user));
        if (event === 'INITIAL_SESSION') finish();
      } else if (event === 'INITIAL_SESSION') {
        finish();
      }
    });

    return () => {
      mounted = false;
      clearTimeout(fallback);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
