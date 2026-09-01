import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { LauncherProvider, useLauncher } from '@/contexts/LauncherContext';

import AppLayout from '@/components/layout/AppLayout';
import SplashPage from '@/pages/SplashPage';
import WelcomePage from '@/pages/WelcomePage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import InboxPage from '@/pages/InboxPage';
import SentPage from '@/pages/SentPage';
import ComposePage from '@/pages/ComposePage';
import StarredPage from '@/pages/StarredPage';
import SpamPage from '@/pages/SpamPage';
import TrashPage from '@/pages/TrashPage';
import ArchivePage from '@/pages/ArchivePage';
import ContactsPage from '@/pages/ContactsPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import SettingsPage from '@/pages/SettingsPage';
import AccountsPage from '@/pages/AccountsPage';
import UnifiedInboxPage from '@/pages/UnifiedInboxPage';
import RecordRoomPage from '@/pages/RecordRoomPage';
import IntegrationsPage from '@/pages/IntegrationsPage';
import DraftsPage from '@/pages/DraftsPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30000, retry: 1 } },
});

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg animate-pulse"
          style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}>
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-sm font-bold text-slate-400 mt-2">UniMail</p>
        <p className="text-xs text-slate-300">uniorbi.com</p>
        <div className="w-8 h-8 mx-auto mt-3 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { launched } = useLauncher();
  if (!launched) return <SplashPage />;

  return (
    <Routes>
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<InboxPage />} />
        <Route path="unified" element={<UnifiedInboxPage />} />
        <Route path="starred" element={<StarredPage />} />
        <Route path="sent" element={<SentPage />} />
        <Route path="drafts" element={<DraftsPage />} />
        <Route path="compose" element={<ComposePage />} />
        <Route path="archive" element={<ArchivePage />} />
        <Route path="all-mail" element={<InboxPage />} />
        <Route path="spam" element={<SpamPage />} />
        <Route path="trash" element={<TrashPage />} />
        <Route path="contacts" element={<ContactsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="record-room" element={<RecordRoomPage />} />
        <Route path="integrations" element={<IntegrationsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <LauncherProvider>
            <AuthProvider>
              <BrowserRouter>
                <AppRoutes />
                <Toaster
                  position="top-right"
                  toastOptions={{
                    style: {
                      borderRadius: '16px',
                      border: '1px solid rgba(255,255,255,0.6)',
                      backdropFilter: 'blur(20px)',
                      background: 'rgba(255,255,255,0.96)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                    },
                  }}
                />
              </BrowserRouter>
            </AuthProvider>
          </LauncherProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
