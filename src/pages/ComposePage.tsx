import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Draft } from '@/types';

const LABELS = [
  { key: 'work', label: 'Work', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { key: 'personal', label: 'Personal', color: 'bg-green-100 text-green-700 border-green-200' },
  { key: 'finance', label: 'Finance', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { key: 'travel', label: 'Travel', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { key: 'important', label: 'Important', color: 'bg-red-100 text-red-700 border-red-200' },
  { key: 'other', label: 'Other', color: 'bg-slate-100 text-slate-700 border-slate-200' },
];

export default function ComposePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const draftId = useRef<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [to, setTo] = useState(searchParams.get('reply') || '');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState(searchParams.get('subject') || '');
  const [body, setBody] = useState(() => {
    const fwd = searchParams.get('forward');
    if (fwd) return `\n\n---------- Forwarded message ----------\n${decodeURIComponent(fwd)}`;
    return '';
  });
  const [label, setLabel] = useState('');
  const [sending, setSending] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);

  // Load from localStorage draft or DB draft
  useEffect(() => {
    if (!searchParams.get('reply') && !searchParams.get('forward')) {
      const saved = localStorage.getItem('mf_draft');
      if (saved) {
        const draft = JSON.parse(saved);
        setTo(draft.to || '');
        setSubject(draft.subject || '');
        setBody(draft.body || '');
        setCc(draft.cc || '');
        setBcc(draft.bcc || '');
        if (draft.draftId) draftId.current = draft.draftId;
      }
    }
  }, []);

  // Auto-save to DB
  const saveDraftToDB = async () => {
    if (!user) return;
    const payload = { to_email: to, subject, body, updated_at: new Date().toISOString() };
    if (draftId.current) {
      await supabase.from('drafts').update(payload).eq('id', draftId.current);
    } else {
      const { data } = await supabase.from('drafts').insert({ ...payload, user_id: user.id }).select().single();
      if (data) draftId.current = data.id;
    }
    setLastSaved(new Date());
    queryClient.invalidateQueries({ queryKey: ['drafts'] });
    queryClient.invalidateQueries({ queryKey: ['draft-count'] });
    // Also save to localStorage for offline fallback
    localStorage.setItem('mf_draft', JSON.stringify({ to, subject, body, cc, bcc, draftId: draftId.current }));
  };

  useEffect(() => {
    if (!searchParams.get('reply') && !searchParams.get('forward') && (to || subject || body)) {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => saveDraftToDB(), 10000);
    }
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [to, subject, body, cc, bcc]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to || !subject || !body) { toast.error('Please fill all required fields'); return; }
    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { to, subject, body, cc, bcc },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) {
        let errorMessage = error.message;
        if (error instanceof FunctionsHttpError) {
          try {
            const statusCode = error.context?.status ?? 500;
            const textContent = await error.context?.text();
            errorMessage = `[Code: ${statusCode}] ${textContent || error.message}`;
          } catch { errorMessage = error.message; }
        }
        throw new Error(errorMessage);
      }
      // Delete draft if exists
      if (draftId.current) {
        await supabase.from('drafts').delete().eq('id', draftId.current);
        queryClient.invalidateQueries({ queryKey: ['drafts'] });
        queryClient.invalidateQueries({ queryKey: ['draft-count'] });
      }
      localStorage.removeItem('mf_draft');
      toast.success(t('emailSent'));
      setTimeout(() => navigate('/sent'), 1200);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleManualSave = async () => {
    await saveDraftToDB();
    toast.success(t('draftSaved'));
  };

  const handleDiscard = async () => {
    if (draftId.current) {
      await supabase.from('drafts').delete().eq('id', draftId.current);
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      queryClient.invalidateQueries({ queryKey: ['draft-count'] });
    }
    localStorage.removeItem('mf_draft');
    navigate(-1);
  };

  return (
    <div className="h-full flex flex-col max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-black text-slate-800">{t('compose')}</h2>
        <div className="flex items-center gap-2">
          {lastSaved && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button onClick={handleDiscard} className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium transition-colors">✕ Discard</button>
        </div>
      </div>

      <form onSubmit={handleSend} className="flex-1 flex flex-col gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm overflow-hidden flex-1 flex flex-col">
          {/* From */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100">
            <span className="text-[10px] font-black text-slate-400 w-10 flex-shrink-0">FROM</span>
            <span className="text-sm text-slate-600">{user?.email}</span>
          </div>
          {/* To */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100">
            <span className="text-[10px] font-black text-slate-400 w-10 flex-shrink-0">{t('to').toUpperCase()}</span>
            <input type="email" value={to} onChange={e => setTo(e.target.value)} required placeholder="recipient@example.com"
              className="flex-1 bg-transparent text-slate-800 placeholder-slate-300 outline-none text-sm" />
            <button type="button" onClick={() => setShowCcBcc(!showCcBcc)} className="text-xs font-bold text-slate-400 hover:text-slate-600 flex gap-1.5 transition-colors">
              <span>Cc</span><span>Bcc</span>
            </button>
          </div>
          {showCcBcc && (
            <>
              <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100">
                <span className="text-[10px] font-black text-slate-400 w-10 flex-shrink-0">CC</span>
                <input type="text" value={cc} onChange={e => setCc(e.target.value)} placeholder="cc@example.com"
                  className="flex-1 bg-transparent text-slate-800 placeholder-slate-300 outline-none text-sm" />
              </div>
              <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100">
                <span className="text-[10px] font-black text-slate-400 w-10 flex-shrink-0">BCC</span>
                <input type="text" value={bcc} onChange={e => setBcc(e.target.value)} placeholder="bcc@example.com"
                  className="flex-1 bg-transparent text-slate-800 placeholder-slate-300 outline-none text-sm" />
              </div>
            </>
          )}
          {/* Subject */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100">
            <span className="text-[10px] font-black text-slate-400 w-10 flex-shrink-0">SUBJ</span>
            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} required placeholder="Email subject..."
              className="flex-1 bg-transparent text-slate-800 placeholder-slate-300 outline-none text-sm font-semibold" />
          </div>

          {/* Label picker */}
          {showLabels && (
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
              <div className="flex flex-wrap gap-2">
                {LABELS.map(lb => (
                  <button key={lb.key} type="button" onClick={() => setLabel(label === lb.key ? '' : lb.key)}
                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${lb.color} ${label === lb.key ? 'ring-2 ring-offset-1 ring-slate-400' : 'opacity-70 hover:opacity-100'}`}>
                    {label === lb.key ? '✓ ' : ''}{lb.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Formatting toolbar */}
          <div className="flex items-center gap-1 px-5 py-2 border-b border-slate-100 bg-slate-50/50">
            {[
              { label: 'B', active: bold, toggle: () => setBold(!bold), style: 'font-black' },
              { label: 'I', active: italic, toggle: () => setItalic(!italic), style: 'italic' },
              { label: 'U', active: underline, toggle: () => setUnderline(!underline), style: 'underline' },
            ].map(btn => (
              <button key={btn.label} type="button" onClick={btn.toggle}
                className={`w-8 h-8 rounded-lg text-sm transition-all ${btn.active ? 'bg-slate-700 text-white' : 'bg-white hover:bg-slate-100 text-slate-600'} ${btn.style} border border-slate-200`}>
                {btn.label}
              </button>
            ))}
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <button type="button" onClick={() => setShowLabels(!showLabels)}
              className={`px-2 h-8 rounded-lg text-xs font-semibold transition-all border ${showLabels || label ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'}`}>
              🏷️ {label ? LABELS.find(l => l.key === label)?.label : 'Label'}
            </button>
            <div className="flex-1" />
            <span className="text-xs text-slate-300">{body.length} chars</span>
          </div>

          {/* Body */}
          <div className="flex-1 px-5 py-4 min-h-[180px]">
            <textarea value={body} onChange={e => setBody(e.target.value)} required placeholder="Write your message here..." rows={10}
              className={`w-full bg-transparent text-slate-700 placeholder-slate-300 outline-none resize-none text-sm leading-relaxed ${bold ? 'font-bold' : ''} ${italic ? 'italic' : ''} ${underline ? 'underline' : ''}`}
            />
            {/* Signature */}
            {localStorage.getItem('mf_signature') && (
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400 whitespace-pre-wrap">
                {localStorage.getItem('mf_signature')}
              </div>
            )}
          </div>
        </div>

        {showSchedule && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-700">📅 Schedule:</span>
            <input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
              className="flex-1 text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-400" />
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <button type="submit" disabled={sending}
            className="flex items-center gap-2 px-7 py-3 rounded-xl text-white text-sm font-bold shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #10b981, #0d9488, #0ea5e9)', boxShadow: '0 4px 20px rgba(16,185,129,0.4)' }}>
            {sending ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('sending')}</>
            ) : (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>{t('send')}</>
            )}
          </button>
          <button type="button" onClick={handleManualSave} className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium transition-colors flex items-center gap-1.5">
            💾 {t('saveDraft')}
          </button>
          <button type="button" onClick={() => setShowSchedule(!showSchedule)} className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium transition-colors flex items-center gap-1.5">
            📅 {t('scheduleSend')}
          </button>
        </div>
      </form>
    </div>
  );
}
