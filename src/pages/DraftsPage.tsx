import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Draft } from '@/types';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function DraftsPage() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: drafts = [], isLoading } = useQuery({
    queryKey: ['drafts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('drafts').select('*').order('updated_at', { ascending: false });
      if (error) throw error;
      return data as Draft[];
    },
  });

  const deleteDraft = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('drafts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['drafts'] }); toast.success('Draft deleted'); },
  });

  const openDraft = (draft: Draft) => {
    // Store draft in localStorage for compose page to pick up
    localStorage.setItem('mf_draft', JSON.stringify({ to: draft.to_email, subject: draft.subject, body: draft.body, draftId: draft.id }));
    navigate('/compose');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1">
          <h2 className="text-2xl font-black text-slate-800">{t('drafts')}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{drafts.length} draft{drafts.length !== 1 ? 's' : ''} saved</p>
        </div>
        <button onClick={() => navigate('/compose')}
          className="px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-md hover:scale-105 transition-all"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #a855f7)' }}>
          + {t('compose')}
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />)}</div>
      ) : drafts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="text-5xl mb-4">📝</div>
          <p className="font-semibold text-lg">No drafts saved</p>
          <p className="text-sm mt-1">Compose a new email to start drafting</p>
          <button onClick={() => navigate('/compose')} className="mt-5 px-5 py-2.5 rounded-xl text-white text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #a855f7)' }}>
            + New Draft
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {drafts.map(draft => (
            <div key={draft.id}
              className="flex items-center gap-3 p-4 rounded-2xl border border-violet-100 bg-violet-50/40 hover:border-violet-200 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => openDraft(draft)}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-violet-600 bg-violet-100 flex-shrink-0 font-bold">
                📝
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 truncate">{draft.subject || '(No Subject)'}</p>
                <p className="text-sm text-slate-500 truncate mt-0.5">To: {draft.to_email || '(No recipient)'}</p>
                <p className="text-xs text-slate-400 truncate mt-0.5">{draft.body?.slice(0, 80) || '(No message)'}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-slate-400">{formatDate(draft.updated_at, lang)}</span>
                <button onClick={e => { e.stopPropagation(); if (confirm('Delete draft?')) deleteDraft.mutate(draft.id); }}
                  className="w-8 h-8 rounded-xl opacity-0 group-hover:opacity-100 bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
