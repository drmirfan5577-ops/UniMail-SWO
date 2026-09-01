import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Contact } from '@/types';
import { toast } from 'sonner';

const AVATAR_COLORS = ['#10b981','#0ea5e9','#8b5cf6','#f43f5e','#f59e0b','#06b6d4','#6366f1','#ec4899'];

export default function ContactsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Contact | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', notes: '', avatar_color: '#10b981' });

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('contacts').select('*').order('name');
      if (error) throw error;
      return data as Contact[];
    },
  });

  const saveContact = useMutation({
    mutationFn: async (contact: Partial<Contact> & { name: string; email: string }) => {
      if (editing) {
        const { error } = await supabase.from('contacts').update({ ...contact, updated_at: new Date().toISOString() }).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('contacts').insert({ ...contact, user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success(t('settingsSaved'));
      setEditing(null); setShowNew(false);
      setForm({ name: '', email: '', phone: '', company: '', notes: '', avatar_color: '#10b981' });
    },
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contacts'] }); toast.success('Contact deleted'); },
  });

  const filtered = contacts.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (c: Contact) => {
    setEditing(c);
    setForm({ name: c.name, email: c.email, phone: c.phone || '', company: c.company || '', notes: c.notes || '', avatar_color: c.avatar_color });
    setShowNew(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) { toast.error('Name and email are required'); return; }
    saveContact.mutate(form);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1">
          <h2 className="text-2xl font-black text-slate-800">{t('contacts')}</h2>
          <span className="text-sm text-slate-500">{contacts.length} {t('totalContacts')}</span>
        </div>
        <button onClick={() => { setEditing(null); setShowNew(true); setForm({ name:'',email:'',phone:'',company:'',notes:'',avatar_color:'#10b981' }); }}
          className="px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-md transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}>
          + {t('newContact')}
        </button>
      </div>

      <div className="relative mb-4">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`${t('search')} contacts...`}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white/80 placeholder-slate-300 outline-none text-sm focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-20">
          <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="font-semibold text-lg">{t('noContacts')}</p>
          <button onClick={() => setShowNew(true)} className="mt-4 px-5 py-2.5 rounded-xl text-white text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}>
            {t('addContact')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto pr-1">
          {filtered.map(contact => (
            <div key={contact.id} className="group p-4 rounded-2xl border border-slate-100 bg-white/80 hover:border-slate-200 hover:shadow-md transition-all">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-base font-black flex-shrink-0 shadow-md"
                  style={{ background: contact.avatar_color }}>
                  {contact.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 truncate">{contact.name}</p>
                  <p className="text-sm text-slate-500 truncate">{contact.email}</p>
                  {contact.company && <p className="text-xs text-slate-400 truncate mt-0.5">{contact.company}</p>}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(contact)} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-600 flex items-center justify-center text-xs transition-colors">✏️</button>
                  <button onClick={() => { if (confirm('Delete this contact?')) deleteContact.mutate(contact.id); }}
                    className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600 flex items-center justify-center text-xs transition-colors">🗑</button>
                </div>
              </div>
              {contact.phone && <p className="mt-2 text-xs text-slate-400 flex items-center gap-1">📞 {contact.phone}</p>}
            </div>
          ))}
        </div>
      )}

      {/* New/Edit Contact Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl shadow-2xl border border-white/60 animate-slide-in"
            style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)' }}>
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800">{editing ? t('editContact') : t('newContact')}</h3>
              <button onClick={() => { setShowNew(false); setEditing(null); }} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Avatar color */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Avatar Color</label>
                <div className="flex gap-2">
                  {AVATAR_COLORS.map(color => (
                    <button key={color} type="button" onClick={() => setForm(f => ({ ...f, avatar_color: color }))}
                      className={`w-8 h-8 rounded-xl transition-all hover:scale-110 ${form.avatar_color === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`}
                      style={{ background: color }} />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('name')} *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                  className="input-field" placeholder="Full Name" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('email')} *</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required
                  className="input-field" placeholder="email@example.com" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('phone')}</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="input-field" placeholder="+1 234 567 890" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('company')}</label>
                  <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                    className="input-field" placeholder="Company Inc." />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('notes')}</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                  className="input-field resize-none" placeholder="Optional notes..." />
              </div>
              <button type="submit" disabled={saveContact.isPending}
                className="btn-primary w-full">{saveContact.isPending ? t('loading') : t('saveContact')}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
