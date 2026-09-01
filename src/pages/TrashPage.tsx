import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDate } from '@/lib/utils';
import type { InboxEmail, Email } from '@/types';
import { toast } from 'sonner';

export default function TrashPage() {
  const { t, lang } = useLanguage();
  const queryClient = useQueryClient();

  const { data: inboxTrash = [], isLoading: iLoading } = useQuery({
    queryKey: ['trash-inbox'],
    queryFn: async () => {
      const { data, error } = await supabase.from('inbox').select('*').eq('is_trashed', true).order('received_at', { ascending: false });
      if (error) throw error;
      return data as InboxEmail[];
    },
  });

  const { data: sentTrash = [], isLoading: sLoading } = useQuery({
    queryKey: ['trash-sent'],
    queryFn: async () => {
      const { data, error } = await supabase.from('emails').select('*').eq('is_trashed', true).order('sent_at', { ascending: false });
      if (error) throw error;
      return data as Email[];
    },
  });

  const restore = useMutation({
    mutationFn: async ({ id, table }: { id: string; table: 'inbox' | 'emails' }) => {
      const { error } = await supabase.from(table).update({ is_trashed: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['trash-inbox'] }); queryClient.invalidateQueries({ queryKey: ['trash-sent'] }); queryClient.invalidateQueries({ queryKey: ['inbox'] }); queryClient.invalidateQueries({ queryKey: ['sent'] }); toast.success('Restored'); },
  });

  const deletePermanently = useMutation({
    mutationFn: async ({ id, table }: { id: string; table: 'inbox' | 'emails' }) => {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['trash-inbox'] }); queryClient.invalidateQueries({ queryKey: ['trash-sent'] }); toast.success('Deleted permanently'); },
  });

  const emptyTrash = async () => {
    if (!confirm('Empty all trash permanently? This cannot be undone.')) return;
    await Promise.all([
      ...inboxTrash.map(e => supabase.from('inbox').delete().eq('id', e.id)),
      ...sentTrash.map(e => supabase.from('emails').delete().eq('id', e.id)),
    ]);
    queryClient.invalidateQueries({ queryKey: ['trash-inbox'] });
    queryClient.invalidateQueries({ queryKey: ['trash-sent'] });
    toast.success('Trash emptied');
  };

  const allItems = [
    ...inboxTrash.map(e => ({ id: e.id, table: 'inbox' as const, subject: e.subject, from: e.from_email, date: e.received_at, type: 'received' })),
    ...sentTrash.map(e => ({ id: e.id, table: 'emails' as const, subject: e.subject, from: e.to_email, date: e.sent_at, type: 'sent' })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1">
          <h2 className="text-2xl font-black text-slate-800">{t('trash')}</h2>
          <span className="text-sm text-slate-500">{allItems.length} items</span>
        </div>
        {allItems.length > 0 && (
          <button onClick={emptyTrash} className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-sm font-semibold transition-colors">
            🗑 {t('emptyTrash')}
          </button>
        )}
      </div>
      <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 mb-4">
        <p className="text-xs text-amber-700 font-medium">⏱ Items in trash are permanently deleted after 30 days.</p>
      </div>
      {(iLoading || sLoading) ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />)}</div>
      ) : allItems.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-20">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 text-2xl">🗑️</div>
          <p className="font-semibold">Trash is empty</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {allItems.map(item => (
            <div key={item.id} className="group flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 bg-white/80 hover:shadow-sm transition-all">
              <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0">
                {item.from.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-600 truncate">{item.subject}</span>
                  <span className="text-xs text-slate-400 flex-shrink-0">{formatDate(item.date, lang)}</span>
                </div>
                <p className="text-xs text-slate-400 truncate">{item.type === 'sent' ? 'Sent to: ' : 'From: '}{item.from}</p>
              </div>
              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => restore.mutate({ id: item.id, table: item.table })}
                  className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-semibold hover:bg-emerald-200 transition-colors">{t('restore')}</button>
                <button onClick={() => deletePermanently.mutate({ id: item.id, table: item.table })}
                  className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
