import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import type { DomainRecord, LoginLog } from '@/types';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  active: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  expired: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  pending: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  transferred: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
};

const CATEGORY_ICONS: Record<string, string> = {
  domain: '🌐', hosting: '🖥️', ssl: '🔒', dns: '📡', other: '📄',
};

function getDaysUntilExpiry(dateStr?: string): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function RecordRoomPage() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'domains' | 'logs'>('domains');
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<DomainRecord | null>(null);
  const [form, setForm] = useState({
    domain: '', registrar: '', registration_date: '', expiry_date: '',
    auto_renew: false, status: 'active', notes: '', category: 'domain',
  });

  const { data: records = [], isLoading: recLoading } = useQuery({
    queryKey: ['domain-records'],
    queryFn: async () => {
      const { data, error } = await supabase.from('domain_records').select('*').order('expiry_date', { nullsFirst: true });
      if (error) throw error;
      return data as DomainRecord[];
    },
  });

  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['login-logs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('login_logs').select('*').order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return data as LoginLog[];
    },
    enabled: tab === 'logs',
  });

  const saveDomain = useMutation({
    mutationFn: async () => {
      if (editItem) {
        const { error } = await supabase.from('domain_records').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('domain_records').insert({ ...form, user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domain-records'] });
      toast.success(editItem ? 'Domain updated' : 'Domain added');
      setShowAdd(false); setEditItem(null);
      setForm({ domain: '', registrar: '', registration_date: '', expiry_date: '', auto_renew: false, status: 'active', notes: '', category: 'domain' });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteDomain = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('domain_records').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['domain-records'] }); toast.success('Domain removed'); },
  });

  const openEdit = (r: DomainRecord) => {
    setEditItem(r);
    setForm({
      domain: r.domain, registrar: r.registrar || '', registration_date: r.registration_date || '',
      expiry_date: r.expiry_date || '', auto_renew: r.auto_renew, status: r.status, notes: r.notes || '', category: r.category,
    });
    setShowAdd(true);
  };

  const expiringSoon = records.filter(r => { const d = getDaysUntilExpiry(r.expiry_date); return d !== null && d <= 30 && d > 0; });
  const expired = records.filter(r => { const d = getDaysUntilExpiry(r.expiry_date); return d !== null && d <= 0; });

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1">
          <h2 className="text-2xl font-black text-slate-800">{t('recordRoom')}</h2>
          <p className="text-xs text-slate-400 mt-0.5">Domain records, renewals, expiries & login history</p>
        </div>
        {tab === 'domains' && (
          <button onClick={() => { setShowAdd(true); setEditItem(null); }}
            className="px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-md hover:scale-105 transition-all"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            + {t('addDomain')}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {[{ id: 'domains', icon: '🌐', label: t('domainRecords') }, { id: 'logs', icon: '📋', label: t('loginLogs') }].map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === tb.id ? 'text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            style={tab === tb.id ? { background: 'linear-gradient(135deg, #f59e0b, #d97706)' } : {}}>
            <span>{tb.icon}</span> {tb.label}
          </button>
        ))}
      </div>

      {tab === 'domains' && (
        <>
          {/* Alerts */}
          {expired.length > 0 && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 mb-4 flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-bold text-red-700 text-sm">{expired.length} domain(s) EXPIRED!</p>
                <p className="text-xs text-red-500">{expired.map(r => r.domain).join(', ')}</p>
              </div>
            </div>
          )}
          {expiringSoon.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 mb-4 flex items-center gap-3">
              <span className="text-2xl">⏰</span>
              <div>
                <p className="font-bold text-amber-700 text-sm">{expiringSoon.length} domain(s) expiring soon!</p>
                <p className="text-xs text-amber-600">{expiringSoon.map(r => `${r.domain} (${getDaysUntilExpiry(r.expiry_date)}d)`).join(' • ')}</p>
              </div>
            </div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Total Records', val: records.length, icon: '🌐', color: 'from-amber-400 to-orange-500' },
              { label: 'Active', val: records.filter(r => r.status === 'active').length, icon: '✅', color: 'from-emerald-400 to-teal-500' },
              { label: 'Expiring Soon', val: expiringSoon.length, icon: '⏳', color: 'from-amber-400 to-yellow-500' },
              { label: 'Expired', val: expired.length, icon: '🔴', color: 'from-red-400 to-rose-500' },
            ].map((s, i) => (
              <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-white/80 text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
                <p className={`text-2xl font-black bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.val}</p>
                <p className="text-xs text-slate-500 font-medium">{s.label}</p>
              </div>
            ))}
          </div>

          {recLoading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />)}</div>
          ) : records.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-slate-400">
              <div className="text-5xl mb-3">🗂️</div>
              <p className="font-semibold text-lg">No domain records yet</p>
              <button onClick={() => setShowAdd(true)} className="mt-4 px-5 py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                + {t('addDomain')}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map(rec => {
                const days = getDaysUntilExpiry(rec.expiry_date);
                const st = STATUS_STYLES[rec.status] || STATUS_STYLES.active;
                return (
                  <div key={rec.id} className="p-4 rounded-2xl border border-slate-100 bg-white/90 hover:shadow-md transition-all">
                    <div className="flex items-start gap-4">
                      <div className="text-2xl flex-shrink-0">{CATEGORY_ICONS[rec.category] || '📄'}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-black text-slate-800 text-base">{rec.domain}</p>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${st.bg} ${st.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            {rec.status.toUpperCase()}
                          </span>
                          {rec.auto_renew && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">AUTO-RENEW</span>}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-slate-500">
                          {rec.registrar && <span>🏢 {rec.registrar}</span>}
                          {rec.registration_date && <span>📅 Reg: {new Date(rec.registration_date).toLocaleDateString()}</span>}
                          {rec.expiry_date && (
                            <span className={days !== null && days <= 30 ? (days <= 0 ? 'text-red-600 font-bold' : 'text-amber-600 font-bold') : ''}>
                              ⏰ Expires: {new Date(rec.expiry_date).toLocaleDateString()}
                              {days !== null && ` (${days > 0 ? days + 'd' : 'EXPIRED'})`}
                            </span>
                          )}
                        </div>
                        {rec.notes && <p className="text-xs text-slate-400 mt-1 italic">📝 {rec.notes}</p>}
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button onClick={() => openEdit(rec)} className="w-8 h-8 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-600 flex items-center justify-center text-xs transition-colors">✏️</button>
                        <button onClick={() => { if (confirm('Delete this record?')) deleteDomain.mutate(rec.id); }}
                          className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center text-xs transition-colors">🗑</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'logs' && (
        <>
          {logsLoading ? (
            <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />)}</div>
          ) : logs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-slate-400">
              <div className="text-5xl mb-3">📋</div>
              <p className="font-semibold text-lg">{t('noLogs')}</p>
              <p className="text-sm mt-1">Login and logout events will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map(log => (
                <div key={log.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 bg-white/80 hover:shadow-sm transition-all">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${
                    log.event_type === 'login' ? 'bg-emerald-100 text-emerald-700' :
                    log.event_type === 'logout' ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-700'
                  }`}>
                    {log.event_type === 'login' ? '✅' : log.event_type === 'logout' ? '👋' : '❌'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-700 capitalize">{log.event_type}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {log.device && `${log.device} • `}{log.ip_address && `IP: ${log.ip_address} • `}{log.location || 'Unknown location'}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 flex-shrink-0">{formatDate(log.created_at, lang)}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add/Edit Domain Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl shadow-2xl border border-white/60 animate-slide-in overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)' }}>
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800">{editItem ? 'Edit Domain Record' : t('addDomain')}</h3>
              <button onClick={() => { setShowAdd(false); setEditItem(null); }} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Domain / Name *</label>
                <input value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} required className="input-field" placeholder="example.com" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input-field">
                    {['domain', 'hosting', 'ssl', 'dns', 'other'].map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="input-field">
                    {['active', 'expired', 'pending', 'transferred'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Registrar</label>
                <input value={form.registrar} onChange={e => setForm(f => ({ ...f, registrar: e.target.value }))} className="input-field" placeholder="GoDaddy, Namecheap, Cloudflare..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Registration Date</label>
                  <input type="date" value={form.registration_date} onChange={e => setForm(f => ({ ...f, registration_date: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Expiry Date</label>
                  <input type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} className="input-field" />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div><p className="font-semibold text-sm text-slate-700">Auto Renew</p><p className="text-xs text-slate-400">Automatic domain renewal reminder</p></div>
                <button onClick={() => setForm(f => ({ ...f, auto_renew: !f.auto_renew }))}
                  className={`w-11 h-6 rounded-full transition-all relative flex-shrink-0 ${form.auto_renew ? '' : 'bg-slate-200'}`}
                  style={form.auto_renew ? { background: 'linear-gradient(135deg, #10b981, #0d9488)' } : {}}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-all ${form.auto_renew ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="input-field resize-none" placeholder="Additional notes..." />
              </div>
              <button onClick={() => { if (!form.domain) { toast.error('Domain is required'); return; } saveDomain.mutate(); }}
                disabled={saveDomain.isPending} className="w-full py-3 rounded-xl text-white font-bold transition-all hover:scale-[1.02] disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                {saveDomain.isPending ? t('loading') : editItem ? 'Update Record' : 'Save Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
