import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDate } from '@/lib/utils';
import type { InboxEmail, InboxTab } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const TABS: InboxTab[] = ['primary','social','promotions','updates','forums'];
const LABEL_COLORS: Record<string, string> = {
  work: 'bg-blue-100 text-blue-700',
  personal: 'bg-green-100 text-green-700',
  important: 'bg-red-100 text-red-700',
  finance: 'bg-amber-100 text-amber-700',
  travel: 'bg-purple-100 text-purple-700',
  other: 'bg-slate-100 text-slate-600',
};

const AVAILABLE_LABELS = [
  { key: 'work', label: 'Work', color: 'bg-blue-100 text-blue-700' },
  { key: 'personal', label: 'Personal', color: 'bg-green-100 text-green-700' },
  { key: 'important', label: 'Important', color: 'bg-red-100 text-red-700' },
  { key: 'finance', label: 'Finance', color: 'bg-amber-100 text-amber-700' },
  { key: 'travel', label: 'Travel', color: 'bg-purple-100 text-purple-700' },
  { key: 'other', label: 'Other', color: 'bg-slate-100 text-slate-600' },
];

export default function InboxPage() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<InboxEmail | null>(null);
  const [activeTab, setActiveTab] = useState<InboxTab>('primary');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [filterUnread, setFilterUnread] = useState(false);
  const [filterStarred, setFilterStarred] = useState(false);
  const [labelingEmail, setLabelingEmail] = useState<InboxEmail | null>(null);

  const { data: allEmails = [], isLoading } = useQuery({
    queryKey: ['inbox'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inbox')
        .select('*')
        .eq('is_trashed', false)
        .eq('is_archived', false)
        .eq('is_spam', false)
        .order('received_at', { ascending: false });
      if (error) throw error;
      return data as InboxEmail[];
    },
    refetchInterval: 30000,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('inbox').update({ is_read: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inbox'] }),
  });

  const toggleStar = useMutation({
    mutationFn: async ({ id, val }: { id: string; val: boolean }) => {
      const { error } = await supabase.from('inbox').update({ is_starred: val }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inbox'] }),
  });

  const markSpam = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('inbox').update({ is_spam: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['inbox'] }); toast.success('Marked as spam'); setSelected(null); },
  });

  const moveTrash = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('inbox').update({ is_trashed: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['inbox'] }); toast.success('Moved to trash'); setSelected(null); },
  });

  const assignLabel = useMutation({
    mutationFn: async ({ id, lbl }: { id: string; lbl: string }) => {
      const { error } = await supabase.from('inbox').update({ label: lbl || null }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['inbox'] }); toast.success('Label applied'); setLabelingEmail(null); },
  });

  const archiveEmail = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('inbox').update({ is_archived: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['inbox'] }); toast.success('Archived'); setSelected(null); },
  });

  const bulkAction = useMutation({
    mutationFn: async ({ action }: { action: 'read' | 'trash' | 'archive' }) => {
      const ids = Array.from(selectedIds);
      const updates = action === 'read' ? { is_read: true } : action === 'trash' ? { is_trashed: true } : { is_archived: true };
      const { error } = await supabase.from('inbox').update(updates).in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['inbox'] }); setSelectedIds(new Set()); toast.success('Done'); },
  });

  const emails = useMemo(() => {
    let list = allEmails.filter(e => e.category === activeTab || (!e.category && activeTab === 'primary'));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e => e.subject.toLowerCase().includes(q) || e.from_email.toLowerCase().includes(q) || e.body.toLowerCase().includes(q));
    }
    if (filterUnread) list = list.filter(e => !e.is_read);
    if (filterStarred) list = list.filter(e => e.is_starred);
    if (sortOrder === 'oldest') list = [...list].reverse();
    return list;
  }, [allEmails, activeTab, search, filterUnread, filterStarred, sortOrder]);

  const unreadCount = allEmails.filter(e => !e.is_read).length;

  const handleOpen = (email: InboxEmail) => {
    setSelected(email);
    if (!email.is_read) markRead.mutate(email.id);
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header row */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-800">{t('inbox')}</h2>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-sm"
                style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}>
                {unreadCount} {t('unread')}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setFilterStarred(!filterStarred)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${filterStarred ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            ⭐ {t('starred')}
          </button>
          <button onClick={() => setFilterUnread(!filterUnread)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${filterUnread ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            📩 {t('unread')}
          </button>
          <button onClick={() => setSortOrder(s => s === 'newest' ? 'oldest' : 'newest')}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">
            {sortOrder === 'newest' ? '↓ ' + t('newest') : '↑ ' + t('oldest')}
          </button>
          <button onClick={() => navigate('/compose')}
            className="px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
            style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            {t('compose')}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('searchPlaceholder')}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white/80 text-slate-700 placeholder-slate-300 outline-none text-sm transition-all focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50" />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map(tab => {
          const count = allEmails.filter(e => (e.category === tab || (!e.category && tab === 'primary')) && !e.is_read).length;
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === tab
                  ? 'text-white shadow-md'
                  : 'text-slate-500 bg-slate-50 hover:bg-slate-100'
              }`}
              style={activeTab === tab ? { background: 'linear-gradient(135deg, #10b981, #0ea5e9)', boxShadow: '0 4px 12px rgba(16,185,129,0.25)' } : {}}>
              {tab === 'primary' && '📥'}
              {tab === 'social' && '👥'}
              {tab === 'promotions' && '🏷️'}
              {tab === 'updates' && '🔔'}
              {tab === 'forums' && '💬'}
              <span className="capitalize">{t(tab)}</span>
              {count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === tab ? 'bg-white/30 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 mb-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
          <span className="text-sm font-semibold text-blue-700">{selectedIds.size} selected</span>
          <div className="flex gap-2 ml-auto">
            <button onClick={() => bulkAction.mutate({ action: 'read' })}
              className="px-3 py-1.5 rounded-lg bg-white text-blue-700 text-xs font-semibold border border-blue-200 hover:bg-blue-50 transition-colors">{t('bulkRead')}</button>
            <button onClick={() => bulkAction.mutate({ action: 'archive' })}
              className="px-3 py-1.5 rounded-lg bg-white text-slate-700 text-xs font-semibold border border-slate-200 hover:bg-slate-50 transition-colors">{t('bulkArchive')}</button>
            <button onClick={() => bulkAction.mutate({ action: 'trash' })}
              className="px-3 py-1.5 rounded-lg bg-white text-red-600 text-xs font-semibold border border-red-100 hover:bg-red-50 transition-colors">{t('bulkDelete')}</button>
            <button onClick={() => setSelectedIds(new Set())} className="text-slate-400 hover:text-slate-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* Email list */}
      {isLoading ? (
        <div className="flex-1 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : emails.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-20">
          <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="font-semibold text-lg">{search ? t('noResults') : t('noEmails')}</p>
          <p className="text-sm mt-1 text-slate-300">{search ? 'Try different search terms' : 'Your inbox is clean!'}</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {emails.map(email => (
            <div key={email.id}
              className={`group relative flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all hover:shadow-md ${
                selectedIds.has(email.id) ? 'bg-blue-50 border-blue-200' :
                !email.is_read ? 'bg-gradient-to-r from-emerald-50/80 to-white border-emerald-100 hover:border-emerald-200' :
                'bg-white/80 border-slate-100 hover:border-slate-200'
              }`}
              onClick={() => handleOpen(email)}>
              {/* Checkbox */}
              <div onClick={e => toggleSelect(email.id, e)}
                className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                  selectedIds.has(email.id) ? 'border-blue-500 bg-blue-500' : 'border-slate-300 bg-white group-hover:border-slate-400'
                }`}>
                {selectedIds.has(email.id) && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
              </div>

              {/* Star */}
              <button onClick={e => { e.stopPropagation(); toggleStar.mutate({ id: email.id, val: !email.is_starred }); }}
                className={`flex-shrink-0 w-5 h-5 text-lg transition-all hover:scale-125 ${email.is_starred ? 'text-amber-400' : 'text-slate-200 hover:text-amber-300'}`}>
                ★
              </button>

              {/* Avatar */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${
                !email.is_read
                  ? 'text-white shadow-md'
                  : 'bg-slate-100 text-slate-500'
              }`}
                style={!email.is_read ? { background: 'linear-gradient(135deg, #10b981, #0d9488)', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' } : {}}>
                {email.from_email.slice(0, 2).toUpperCase()}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm truncate ${!email.is_read ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>
                    {email.from_email}
                  </span>
                  <span className="text-xs text-slate-400 flex-shrink-0">{formatDate(email.received_at, lang)}</span>
                </div>
                <p className={`text-sm truncate mt-0.5 ${!email.is_read ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                  {email.subject}
                </p>
                <p className="text-xs text-slate-400 truncate mt-0.5">{email.body}</p>
              </div>

              {/* Indicators */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {email.label && <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${LABEL_COLORS[email.label] || 'bg-slate-100 text-slate-600'}`}>{email.label}</span>}
                {email.is_important && <span className="text-amber-500 text-xs">!</span>}
                {!email.is_read && <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(135deg, #10b981, #0ea5e9)' }} />}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Email Viewer Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl shadow-2xl border border-white/60 max-h-[90vh] flex flex-col animate-slide-in"
            style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)' }}>
            {/* Modal header */}
            <div className="flex items-start justify-between p-6 border-b border-slate-100">
              <div className="flex-1 pr-4">
                <h3 className="text-lg font-black text-slate-800 leading-tight">{selected.subject}</h3>
                {selected.label && <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${LABEL_COLORS[selected.label] || 'bg-slate-100 text-slate-600'}`}>{selected.label}</span>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleStar.mutate({ id: selected.id, val: !selected.is_starred })}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all hover:scale-110 ${selected.is_starred ? 'text-amber-400 bg-amber-50' : 'text-slate-300 bg-slate-50 hover:bg-amber-50'}`}>
                  ★
                </button>
                <button onClick={() => setSelected(null)}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Sender info */}
            <div className="px-6 py-4 border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}>
                  {selected.from_email.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{selected.from_email}</p>
                  <p className="text-xs text-slate-400">To: {selected.to_email} • {formatDate(selected.received_at, lang)}</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1">
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">{selected.body}</p>
            </div>

            {/* Label picker row */}
            <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-400 mr-1">🏷️ Label:</span>
              {AVAILABLE_LABELS.map(lb => (
                <button key={lb.key} type="button"
                  onClick={() => assignLabel.mutate({ id: selected.id, lbl: selected.label === lb.key ? '' : lb.key })}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${lb.color} ${selected.label === lb.key ? 'ring-2 ring-offset-1 ring-slate-400' : 'opacity-60 hover:opacity-100'}`}>
                  {selected.label === lb.key ? '✓ ' : ''}{lb.label}
                </button>
              ))}
            </div>
            {/* Actions */}
            <div className="p-6 border-t border-slate-100 flex flex-wrap gap-2">
              <button
                onClick={() => { navigate(`/compose?reply=${encodeURIComponent(selected.from_email)}&subject=${encodeURIComponent('Re: ' + selected.subject)}`); setSelected(null); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-md transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                {t('reply')}
              </button>
              <button
                onClick={() => { navigate(`/compose?forward=${encodeURIComponent(selected.body)}&subject=${encodeURIComponent('Fwd: ' + selected.subject)}`); setSelected(null); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                {t('forward')}
              </button>
              <button onClick={() => archiveEmail.mutate(selected.id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                {t('archive')}
              </button>
              <button onClick={() => markSpam.mutate(selected.id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-sm font-semibold transition-colors ml-auto">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                {t('markSpam')}
              </button>
              <button onClick={() => moveTrash.mutate(selected.id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-sm font-semibold transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                {t('moveToTrash')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
