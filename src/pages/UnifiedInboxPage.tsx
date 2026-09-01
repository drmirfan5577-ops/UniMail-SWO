import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDate } from '@/lib/utils';
import type { InboxEmail, Email } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

type UnifiedEmail = {
  id: string; from_email: string; to_email: string; subject: string;
  body: string; date: string; is_read?: boolean; is_starred?: boolean;
  type: 'inbox' | 'sent';
};

export default function UnifiedInboxPage() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<UnifiedEmail | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 'inbox' | 'sent'>('all');

  const { data: inboxEmails = [], isLoading: inboxLoading } = useQuery({
    queryKey: ['unified-inbox'],
    queryFn: async () => {
      const { data, error } = await supabase.from('inbox').select('*').eq('is_trashed', false).eq('is_spam', false).order('received_at', { ascending: false });
      if (error) throw error;
      return (data as InboxEmail[]).map(e => ({ ...e, date: e.received_at, type: 'inbox' as const }));
    },
    refetchInterval: 30000,
  });

  const { data: sentEmails = [], isLoading: sentLoading } = useQuery({
    queryKey: ['unified-sent'],
    queryFn: async () => {
      const { data, error } = await supabase.from('emails').select('*').eq('is_trashed', false).order('sent_at', { ascending: false });
      if (error) throw error;
      return (data as Email[]).map(e => ({ ...e, date: e.sent_at, is_read: true, type: 'sent' as const }));
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('inbox').update({ is_read: true }).eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['unified-inbox'] }),
  });

  const unified: UnifiedEmail[] = useMemo(() => {
    let list: UnifiedEmail[] = [];
    if (typeFilter !== 'sent') list = [...list, ...inboxEmails as UnifiedEmail[]];
    if (typeFilter !== 'inbox') list = [...list, ...sentEmails as UnifiedEmail[]];
    list = list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e => e.subject.toLowerCase().includes(q) || e.from_email.toLowerCase().includes(q) || e.to_email.toLowerCase().includes(q));
    }
    return list;
  }, [inboxEmails, sentEmails, typeFilter, search]);

  const unread = inboxEmails.filter(e => !e.is_read).length;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-800">{t('unifiedInbox')}</h2>
            {unread > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                {unread} unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">All emails from all accounts in one view</p>
        </div>
        <button onClick={() => navigate('/compose')}
          className="px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-md hover:scale-105 transition-all"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          + {t('compose')}
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(['all', 'inbox', 'sent'] as const).map(f => (
          <button key={f} onClick={() => setTypeFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${typeFilter === f ? 'text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            style={typeFilter === f ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' } : {}}>
            {f === 'all' ? '📬 All' : f === 'inbox' ? '📥 ' + t('inbox') : '📤 ' + t('sent')}
          </button>
        ))}
        <div className="flex-1" />
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search all mail..."
            className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white/80 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all" />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Total', val: unified.length, color: 'from-slate-400 to-slate-500' },
          { label: 'Received', val: inboxEmails.length, color: 'from-emerald-400 to-teal-500' },
          { label: 'Sent', val: sentEmails.length, color: 'from-blue-400 to-indigo-500' },
        ].map((s, i) => (
          <div key={i} className="p-3 rounded-xl border border-slate-100 bg-white/80 text-center">
            <p className={`text-2xl font-black bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.val}</p>
            <p className="text-xs text-slate-500 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Emails */}
      {inboxLoading || sentLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-18 rounded-2xl bg-slate-100 animate-pulse" />)}</div>
      ) : unified.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-16">
          <div className="text-5xl mb-3">📬</div>
          <p className="font-semibold text-lg">No emails found</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {unified.map(email => (
            <div key={`${email.type}-${email.id}`}
              onClick={() => { setSelected(email); if (email.type === 'inbox' && !email.is_read) markRead.mutate(email.id); }}
              className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all hover:shadow-md ${
                email.type === 'inbox' && !email.is_read
                  ? 'bg-indigo-50/60 border-indigo-100 hover:border-indigo-200'
                  : 'bg-white/80 border-slate-100 hover:border-slate-200'
              }`}>
              {/* Type badge */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${email.type === 'inbox' ? 'text-white' : 'bg-blue-100 text-blue-600'}`}
                style={email.type === 'inbox' ? { background: 'linear-gradient(135deg, #10b981, #0d9488)' } : {}}>
                {email.type === 'inbox' ? '↓' : '↑'}
              </div>

              {/* Avatar */}
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: email.type === 'inbox' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
                {(email.type === 'inbox' ? email.from_email : email.to_email).slice(0, 2).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm truncate ${email.type === 'inbox' && !email.is_read ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>
                    {email.type === 'inbox' ? email.from_email : `To: ${email.to_email}`}
                  </span>
                  <span className="text-xs text-slate-400 flex-shrink-0">{formatDate(email.date, lang)}</span>
                </div>
                <p className={`text-sm truncate mt-0.5 ${email.type === 'inbox' && !email.is_read ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>{email.subject}</p>
                <p className="text-xs text-slate-400 truncate mt-0.5">{email.body.slice(0, 80)}</p>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${email.type === 'inbox' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                  {email.type === 'inbox' ? 'IN' : 'OUT'}
                </span>
                {email.type === 'inbox' && !email.is_read && <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }} />}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Viewer Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl shadow-2xl border border-white/60 max-h-[85vh] flex flex-col animate-slide-in"
            style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)' }}>
            <div className="flex items-start justify-between p-6 border-b border-slate-100">
              <div className="flex-1 pr-4">
                <h3 className="text-lg font-black text-slate-800">{selected.subject}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {selected.type === 'inbox' ? `From: ${selected.from_email}` : `To: ${selected.to_email}`} • {formatDate(selected.date, lang)}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">{selected.body}</p>
            </div>
            {selected.type === 'inbox' && (
              <div className="p-5 border-t border-slate-100 flex gap-2">
                <button onClick={() => { navigate(`/compose?reply=${encodeURIComponent(selected.from_email)}&subject=${encodeURIComponent('Re: ' + selected.subject)}`); setSelected(null); }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  ↩ {t('reply')}
                </button>
                <button onClick={() => setSelected(null)} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors">
                  {t('close')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
