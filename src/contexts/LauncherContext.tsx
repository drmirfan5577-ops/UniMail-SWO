import React, { createContext, useContext, useState } from 'react';
import type { LauncherStyle } from '@/types';

interface LauncherContextType {
  launcher: LauncherStyle;
  setLauncher: (l: LauncherStyle) => void;
  launched: boolean;
  setLaunched: (v: boolean) => void;
}

const LauncherContext = createContext<LauncherContextType>({
  launcher: 2,
  setLauncher: () => {},
  launched: false,
  setLaunched: () => {},
});

export function LauncherProvider({ children }: { children: React.ReactNode }) {
  const [launcher, setLauncherState] = useState<LauncherStyle>(() => {
    const v = localStorage.getItem('mf_launcher');
    return v ? (Number(v) as LauncherStyle) : 2;
  });

  // Auto-launch after short splash (stored flag - only show splash once per session)
  const [launched, setLaunchedState] = useState(() => {
    return sessionStorage.getItem('mf_session_launched') === 'true';
  });

  const setLauncher = (l: LauncherStyle) => {
    setLauncherState(l);
    localStorage.setItem('mf_launcher', String(l));
  };

  const setLaunched = (v: boolean) => {
    setLaunchedState(v);
    if (v) sessionStorage.setItem('mf_session_launched', 'true');
  };

  return (
    <LauncherContext.Provider value={{ launcher, setLauncher, launched, setLaunched }}>
      {children}
    </LauncherContext.Provider>
  );
}

export const useLauncher = () => useContext(LauncherContext);
