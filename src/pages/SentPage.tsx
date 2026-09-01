import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import type { Email } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function SentPage() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Email | null>(null);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const { data: emails = [], isLoading } = useQuery({
    queryKey: ['sent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('emails')
        .select('*')
        .eq('is_trashed', false)
        .order('sent_at', { ascending: false });
      if (error) throw error;
      return data as Email[];
    },
    refetchInterval: 30000,
  });

  const toggleStar = useMutation({
    mutationFn: async ({ id, val }: { id: string; val: boolean }) => {
      const { error } = await supabase.from('emails').update({ is_starred: val }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sent'] }),
  });

  const moveTrash = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('emails').update({ is_trashed: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sent'] }); toast.success('Moved to trash'); setSelected(null); },
  });

  const filtered = emails
    .filter(e => !search || e.subject.toLowerCase().includes(search.toLowerCase()) || e.to_email.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortOrder === 'newest' ? new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime() : new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime());

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1">
          <h2 className="text-2xl font-black text-slate-800">{t('sent')}</h2>
          <span className="text-sm text-slate-500">{emails.length} messages</span>
        </div>
        <button onClick={() => setSortOrder(s => s === 'newest' ? 'oldest' : 'newest')}
          className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">
          {sortOrder === 'newest' ? '↓ ' + t('newest') : '↑ ' + t('oldest')}
        </button>
        <button onClick={() => navigate('/compose')}
          className="px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-md transition-all hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
          + {t('compose')}
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('searchPlaceholder')}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white/80 text-slate-700 placeholder-slate-300 outline-none text-sm transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
      </div>

      {isLoading ? (
        <div className="flex-1 space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-20">
          <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <p className="font-semibold text-lg">{t('noEmails')}</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {filtered.map(email => (
            <div key={email.id}
              onClick={() => setSelected(email)}
              className="group flex items-center gap-3 p-3.5 rounded-2xl border bg-white/80 border-slate-100 hover:border-slate-200 hover:shadow-md transition-all cursor-pointer">
              {/* Star */}
              <button onClick={e => { e.stopPropagation(); toggleStar.mutate({ id: email.id, val: !email.is_starred }); }}
                className={`flex-shrink-0 w-5 h-5 text-lg transition-all hover:scale-125 ${email.is_starred ? 'text-amber-400' : 'text-slate-200 hover:text-amber-300'}`}>★</button>
              {/* Avatar */}
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700 flex-shrink-0">
                {email.to_email.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold truncate text-slate-700">To: {email.to_email}</span>
                  <span className="text-xs text-slate-400 flex-shrink-0">{formatDate(email.sent_at, lang)}</span>
                </div>
                <p className="text-sm truncate mt-0.5 text-slate-800 font-medium">{email.subject}</p>
                <p className="text-xs text-slate-400 truncate mt-0.5">{email.body}</p>
              </div>
              <div className="flex items-center gap-1">
                {email.is_starred && <span className="text-amber-400 text-sm">★</span>}
                <svg className="w-4 h-4 text-slate-300 group-hover:text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Viewer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl shadow-2xl border border-white/60 max-h-[90vh] flex flex-col animate-slide-in"
            style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)' }}>
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800 truncate pr-4">{selected.subject}</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleStar.mutate({ id: selected.id, val: !selected.is_starred })}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${selected.is_starred ? 'text-amber-400 bg-amber-50' : 'text-slate-300 bg-slate-50 hover:bg-amber-50'}`}>★</button>
                <button onClick={() => setSelected(null)} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            <div className="px-6 py-4 border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">
                  {selected.to_email.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">To: {selected.to_email}</p>
                  <p className="text-xs text-slate-400">{formatDate(selected.sent_at, lang)}</p>
                </div>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">{selected.body}</p>
            </div>
            <div className="p-6 border-t border-slate-100 flex gap-3">
              <button onClick={() => { navigate(`/compose?forward=${encodeURIComponent(selected.body)}&subject=${encodeURIComponent('Fwd: ' + selected.subject)}`); setSelected(null); }}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}>
                ↪ {t('forward')}
              </button>
              <button onClick={() => moveTrash.mutate(selected.id)}
                className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-sm font-semibold transition-colors">
                🗑 {t('delete')}
              </button>
              <button onClick={() => setSelected(null)} className="ml-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors">
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
