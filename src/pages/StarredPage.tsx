import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDate } from '@/lib/utils';
import type { InboxEmail, Email } from '@/types';

export default function StarredPage() {
  const { t, lang } = useLanguage();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<InboxEmail | Email | null>(null);

  const { data: starredInbox = [], isLoading: iLoading } = useQuery({
    queryKey: ['starred-inbox'],
    queryFn: async () => {
      const { data, error } = await supabase.from('inbox').select('*').eq('is_starred', true).order('received_at', { ascending: false });
      if (error) throw error;
      return data as InboxEmail[];
    },
  });

  const { data: starredSent = [], isLoading: sLoading } = useQuery({
    queryKey: ['starred-sent'],
    queryFn: async () => {
      const { data, error } = await supabase.from('emails').select('*').eq('is_starred', true).order('sent_at', { ascending: false });
      if (error) throw error;
      return data as Email[];
    },
  });

  const unstar = useMutation({
    mutationFn: async ({ id, table }: { id: string; table: 'inbox' | 'emails' }) => {
      const { error } = await supabase.from(table).update({ is_starred: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['starred-inbox'] }); queryClient.invalidateQueries({ queryKey: ['starred-sent'] }); queryClient.invalidateQueries({ queryKey: ['inbox'] }); queryClient.invalidateQueries({ queryKey: ['sent'] }); },
  });

  const allItems = [
    ...starredInbox.map(e => ({ ...e, table: 'inbox' as const, date: e.received_at, label: e.from_email })),
    ...starredSent.map(e => ({ ...e, table: 'emails' as const, date: e.sent_at, label: 'To: ' + e.to_email })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="h-full flex flex-col">
      <div className="mb-5">
        <h2 className="text-2xl font-black text-slate-800">{t('starred')}</h2>
        <span className="text-sm text-slate-500">{allItems.length} starred messages</span>
      </div>
      {(iLoading || sLoading) ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />)}</div>
      ) : allItems.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-20">
          <div className="text-5xl mb-3">⭐</div>
          <p className="font-semibold text-lg">No starred messages</p>
          <p className="text-sm mt-1 text-slate-300">Star important emails to find them quickly</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {allItems.map(item => (
            <div key={item.id} onClick={() => setSelected(item)}
              className="group flex items-center gap-3 p-3.5 rounded-2xl border border-amber-100 bg-amber-50/40 hover:bg-amber-50 hover:shadow-md cursor-pointer transition-all">
              <span className="text-amber-400 text-xl flex-shrink-0">★</span>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                {item.label.slice(-item.label.length).slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-slate-800 truncate">{item.subject}</span>
                  <span className="text-xs text-slate-400 flex-shrink-0">{formatDate(item.date, lang)}</span>
                </div>
                <p className="text-xs text-slate-500 truncate">{item.label}</p>
              </div>
              <button onClick={e => { e.stopPropagation(); unstar.mutate({ id: item.id, table: item.table }); }}
                className="opacity-0 group-hover:opacity-100 text-amber-400 hover:text-slate-300 text-xl transition-all">★</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
