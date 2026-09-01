import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import type { EmailAccount } from '@/types';
import { toast } from 'sonner';

const PROVIDERS = [
  { id: 'uniorbi', name: 'UniOrbi Mail', domain: 'uniorbi.com', emoji: '🌐', from: '#10b981', to: '#0d9488', desc: 'Native UniOrbi account — full send/receive via Resend API' },
  { id: 'gmail', name: 'Gmail', domain: 'gmail.com', emoji: '📧', from: '#EA4335', to: '#FBBC05', desc: 'Connect your Google Gmail account via IMAP/SMTP' },
  { id: 'yahoo', name: 'Yahoo Mail', domain: 'yahoo.com', emoji: '📬', from: '#6001D2', to: '#7B1FA2', desc: 'Connect your Yahoo Mail account via IMAP/SMTP' },
  { id: 'outlook', name: 'Outlook / Hotmail', domain: 'outlook.com', emoji: '📮', from: '#0078D4', to: '#00B4D8', desc: 'Connect Microsoft Outlook or Hotmail via IMAP/SMTP' },
  { id: 'custom', name: 'Custom / Other', domain: 'custom', emoji: '✉️', from: '#64748b', to: '#475569', desc: 'Add any IMAP/SMTP email provider' },
];

const IMAP_PRESETS: Record<string, { imap: string; imapPort: number; smtp: string; smtpPort: number }> = {
  gmail: { imap: 'imap.gmail.com', imapPort: 993, smtp: 'smtp.gmail.com', smtpPort: 587 },
  yahoo: { imap: 'imap.mail.yahoo.com', imapPort: 993, smtp: 'smtp.mail.yahoo.com', smtpPort: 587 },
  outlook: { imap: 'outlook.office365.com', imapPort: 993, smtp: 'smtp.office365.com', smtpPort: 587 },
  uniorbi: { imap: 'imap.uniorbi.com', imapPort: 993, smtp: 'smtp.uniorbi.com', smtpPort: 587 },
  custom: { imap: '', imapPort: 993, smtp: '', smtpPort: 587 },
};

const STATUS_COLORS: Record<string, string> = {
  uniorbi: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  gmail: 'bg-red-50 text-red-700 border-red-200',
  yahoo: 'bg-purple-50 text-purple-700 border-purple-200',
  outlook: 'bg-blue-50 text-blue-700 border-blue-200',
  custom: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function AccountsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('uniorbi');
  const [form, setForm] = useState({ email: '', display_name: '', imap_host: '', imap_port: 993, smtp_host: '', smtp_port: 587 });

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['email-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('email_accounts').select('*').order('is_default', { ascending: false }).order('created_at');
      if (error) throw error;
      return data as EmailAccount[];
    },
  });

  const addAccount = useMutation({
    mutationFn: async () => {
      const preset = IMAP_PRESETS[selectedProvider];
      const { error } = await supabase.from('email_accounts').insert({
        user_id: user!.id,
        provider: selectedProvider,
        email: form.email,
        display_name: form.display_name || form.email.split('@')[0],
        is_default: accounts.length === 0,
        is_active: true,
        color: PROVIDERS.find(p => p.id === selectedProvider)?.from || '#10b981',
        icon: PROVIDERS.find(p => p.id === selectedProvider)?.emoji || '📧',
        imap_host: form.imap_host || preset.imap,
        imap_port: form.imap_port || preset.imapPort,
        smtp_host: form.smtp_host || preset.smtp,
        smtp_port: form.smtp_port || preset.smtpPort,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-accounts'] });
      toast.success('Account added!');
      setShowAdd(false);
      setForm({ email: '', display_name: '', imap_host: '', imap_port: 993, smtp_host: '', smtp_port: 587 });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const setDefault = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('email_accounts').update({ is_default: false }).neq('id', id);
      const { error } = await supabase.from('email_accounts').update({ is_default: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['email-accounts'] }); toast.success('Default account updated'); },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, val }: { id: string; val: boolean }) => {
      const { error } = await supabase.from('email_accounts').update({ is_active: val }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['email-accounts'] }),
  });

  const removeAccount = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('email_accounts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['email-accounts'] }); toast.success('Account removed'); },
  });

  const selectedProv = PROVIDERS.find(p => p.id === selectedProvider)!;

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1">
          <h2 className="text-2xl font-black text-slate-800">{t('manageAccounts')}</h2>
          <p className="text-sm text-slate-500 mt-0.5">Connect and manage all your email providers</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-md transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}>
          + {t('addAccount')}
        </button>
      </div>

      {/* Provider Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {PROVIDERS.map(prov => {
          const count = accounts.filter(a => a.provider === prov.id).length;
          return (
            <div key={prov.id} className={`p-4 rounded-2xl border-2 text-center transition-all cursor-pointer hover:shadow-md ${count > 0 ? 'border-opacity-40' : 'border-slate-100 bg-white/80'}`}
              style={count > 0 ? { borderColor: prov.from + '40', background: prov.from + '08' } : {}}
              onClick={() => { setSelectedProvider(prov.id); setShowAdd(true); }}>
              <div className="text-2xl mb-2">{prov.emoji}</div>
              <p className="text-xs font-bold text-slate-700">{prov.name}</p>
              {count > 0
                ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block" style={{ color: prov.from, background: prov.from + '20' }}>{count} connected</span>
                : <span className="text-[10px] text-slate-400 mt-1 block">Not connected</span>
              }
            </div>
          );
        })}
      </div>

      {/* Accounts list */}
      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />)}</div>
      ) : accounts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="text-5xl mb-4">📭</div>
          <p className="font-bold text-lg">No accounts connected</p>
          <p className="text-sm mt-1">Add your first email account to get started</p>
          <button onClick={() => setShowAdd(true)} className="mt-5 px-5 py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}>
            + {t('addAccount')}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map(acc => {
            const prov = PROVIDERS.find(p => p.id === acc.provider) || PROVIDERS[4];
            return (
              <div key={acc.id} className={`p-4 rounded-2xl border transition-all hover:shadow-md ${acc.is_active ? 'bg-white/90 border-slate-100' : 'bg-slate-50/60 border-slate-100 opacity-60'}`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${prov.from}, ${prov.to})` }}>
                    {prov.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-slate-800">{acc.email}</p>
                      {acc.is_default && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">DEFAULT</span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_COLORS[acc.provider]}`}>
                        {prov.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{acc.display_name} • {acc.imap_host || 'No IMAP configured'}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className={`w-2 h-2 rounded-full ${acc.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span className="text-[10px] text-slate-400">{acc.is_active ? t('connected') : t('disconnected')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!acc.is_default && (
                      <button onClick={() => setDefault.mutate(acc.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">
                        {t('setDefault')}
                      </button>
                    )}
                    <button onClick={() => toggleActive.mutate({ id: acc.id, val: !acc.is_active })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${acc.is_active ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                      {acc.is_active ? t('disconnect') : t('connect')}
                    </button>
                    <button onClick={() => { if (confirm('Remove this account?')) removeAccount.mutate(acc.id); }}
                      className="w-8 h-8 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Account Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl shadow-2xl border border-white/60 animate-slide-in overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)' }}>
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800">{t('addAccount')}</h3>
              <button onClick={() => setShowAdd(false)} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Provider select */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">{t('provider')}</label>
                <div className="grid grid-cols-5 gap-2">
                  {PROVIDERS.map(prov => (
                    <button key={prov.id} type="button" onClick={() => setSelectedProvider(prov.id)}
                      className={`p-2 rounded-xl border-2 text-center transition-all text-xs ${selectedProvider === prov.id ? 'shadow-md' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                      style={selectedProvider === prov.id ? { borderColor: prov.from, background: prov.from + '12' } : {}}>
                      <div className="text-xl mb-1">{prov.emoji}</div>
                      <div className="font-semibold text-[9px] text-slate-600 leading-tight">{prov.name.split(' ')[0]}</div>
                    </button>
                  ))}
                </div>
                {selectedProv && <p className="mt-2 text-xs text-slate-400">{selectedProv.desc}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('accountEmail')}</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required
                  placeholder={`you@${selectedProv?.domain || 'example.com'}`} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Display Name</label>
                <input value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
                  placeholder="Your Name" className="input-field" />
              </div>

              {selectedProvider !== 'uniorbi' && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                  <p className="text-xs font-semibold text-amber-700 mb-3">⚙️ IMAP/SMTP Configuration</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">IMAP Host</label>
                      <input value={form.imap_host || IMAP_PRESETS[selectedProvider]?.imap} onChange={e => setForm(f => ({ ...f, imap_host: e.target.value }))} className="input-field text-xs py-2" placeholder="imap.example.com" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">IMAP Port</label>
                      <input type="number" value={form.imap_port} onChange={e => setForm(f => ({ ...f, imap_port: +e.target.value }))} className="input-field text-xs py-2" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">SMTP Host</label>
                      <input value={form.smtp_host || IMAP_PRESETS[selectedProvider]?.smtp} onChange={e => setForm(f => ({ ...f, smtp_host: e.target.value }))} className="input-field text-xs py-2" placeholder="smtp.example.com" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">SMTP Port</label>
                      <input type="number" value={form.smtp_port} onChange={e => setForm(f => ({ ...f, smtp_port: +e.target.value }))} className="input-field text-xs py-2" />
                    </div>
                  </div>
                  <p className="text-[10px] text-amber-600 mt-2">ℹ️ For Gmail/Yahoo/Outlook, enable IMAP in their settings and use App Password if 2FA is on.</p>
                </div>
              )}

              <button onClick={() => { if (!form.email) { toast.error('Email is required'); return; } addAccount.mutate(); }}
                disabled={addAccount.isPending}
                className="btn-primary w-full">
                {addAccount.isPending ? t('loading') : t('addAccount')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
