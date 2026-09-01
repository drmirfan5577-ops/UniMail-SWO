import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDate } from '@/lib/utils';
import type { InboxEmail } from '@/types';

export default function ArchivePage() {
  const { t, lang } = useLanguage();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<InboxEmail | null>(null);

  const { data: emails = [], isLoading } = useQuery({
    queryKey: ['archive'],
    queryFn: async () => {
      const { data, error } = await supabase.from('inbox').select('*').eq('is_archived', true).order('received_at', { ascending: false });
      if (error) throw error;
      return data as InboxEmail[];
    },
  });

  const restore = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('inbox').update({ is_archived: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['archive'] }); queryClient.invalidateQueries({ queryKey: ['inbox'] }); setSelected(null); },
  });

  return (
    <div className="h-full flex flex-col">
      <div className="mb-5">
        <h2 className="text-2xl font-black text-slate-800">{t('archive')}</h2>
        <span className="text-sm text-slate-500">{emails.length} archived messages</span>
      </div>
      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />)}</div>
      ) : emails.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-20">
          <div className="text-5xl mb-3">🗂️</div>
          <p className="font-semibold text-lg">Archive is empty</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {emails.map(email => (
            <div key={email.id} onClick={() => setSelected(email)}
              className="group flex items-center gap-3 p-3.5 rounded-2xl border border-slate-100 bg-white/80 hover:shadow-md cursor-pointer transition-all">
              <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-500 flex-shrink-0">
                {email.from_email.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-700 truncate">{email.from_email}</span>
                  <span className="text-xs text-slate-400 flex-shrink-0">{formatDate(email.received_at, lang)}</span>
                </div>
                <p className="text-sm text-slate-600 truncate">{email.subject}</p>
              </div>
              <button onClick={e => { e.stopPropagation(); restore.mutate(email.id); }}
                className="opacity-0 group-hover:opacity-100 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-semibold hover:bg-emerald-200 transition-all">
                {t('restore')}
              </button>
            </div>
          ))}
        </div>
      )}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl shadow-2xl border border-white/60 max-h-[85vh] flex flex-col animate-slide-in" style={{ background: 'rgba(255,255,255,0.97)' }}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-black text-slate-800 truncate pr-4">{selected.subject}</h3>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto">
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{selected.body}</p>
            </div>
            <div className="p-5 border-t border-slate-100 flex gap-2">
              <button onClick={() => restore.mutate(selected.id)} className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}>↩ {t('restore')}</button>
              <button onClick={() => setSelected(null)} className="ml-auto px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm font-medium">{t('close')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
