import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import type { InboxEmail, Email } from '@/types';

export default function AnalyticsPage() {
  const { t } = useLanguage();

  const { data: inboxEmails = [] } = useQuery({
    queryKey: ['inbox-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase.from('inbox').select('*').order('received_at', { ascending: false });
      if (error) throw error;
      return data as InboxEmail[];
    },
  });

  const { data: sentEmails = [] } = useQuery({
    queryKey: ['sent-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase.from('emails').select('*').order('sent_at', { ascending: false });
      if (error) throw error;
      return data as Email[];
    },
  });

  const unread = inboxEmails.filter(e => !e.is_read).length;
  const starred = inboxEmails.filter(e => e.is_starred).length;
  const spam = inboxEmails.filter(e => e.is_spam).length;

  // Top senders
  const senderMap: Record<string, number> = {};
  inboxEmails.forEach(e => { senderMap[e.from_email] = (senderMap[e.from_email] || 0) + 1; });
  const topSenders = Object.entries(senderMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Top recipients
  const recipientMap: Record<string, number> = {};
  sentEmails.forEach(e => { recipientMap[e.to_email] = (recipientMap[e.to_email] || 0) + 1; });
  const topRecipients = Object.entries(recipientMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Weekly activity (last 7 days)
  const weekActivity = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toDateString();
    const received = inboxEmails.filter(e => new Date(e.received_at).toDateString() === dayStr).length;
    const sent = sentEmails.filter(e => new Date(e.sent_at).toDateString() === dayStr).length;
    return { day: d.toLocaleDateString('en', { weekday: 'short' }), received, sent };
  });

  const maxActivity = Math.max(...weekActivity.map(d => Math.max(d.received, d.sent)), 1);

  const stats = [
    { label: t('receivedEmails'), value: inboxEmails.length, color: 'from-emerald-400 to-teal-500', icon: '📥', shadow: 'shadow-emerald-200' },
    { label: t('sentEmails'), value: sentEmails.length, color: 'from-blue-400 to-indigo-500', icon: '📤', shadow: 'shadow-blue-200' },
    { label: t('unreadEmails'), value: unread, color: 'from-amber-400 to-orange-500', icon: '📩', shadow: 'shadow-amber-200' },
    { label: t('starred'), value: starred, color: 'from-rose-400 to-pink-500', icon: '⭐', shadow: 'shadow-rose-200' },
  ];

  return (
    <div className="h-full flex flex-col overflow-y-auto space-y-6 pr-1">
      <div>
        <h2 className="text-2xl font-black text-slate-800">{t('analytics')}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{t('emailActivity')}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="p-5 rounded-2xl border border-white/60 bg-white/80 shadow-sm hover:shadow-md transition-all">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-3 shadow-md ${stat.shadow} bg-gradient-to-br ${stat.color}`}>
              {stat.icon}
            </div>
            <div className={`text-3xl font-black bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`}>{stat.value}</div>
            <div className="text-xs font-semibold text-slate-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Activity chart */}
      <div className="p-6 rounded-2xl border border-white/60 bg-white/80 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2">
          <span>📊</span> 7-Day {t('emailActivity')}
        </h3>
        <div className="flex items-end gap-3 h-40">
          {weekActivity.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="flex flex-col items-center gap-1 w-full" style={{ height: '120px', justifyContent: 'flex-end' }}>
                <div className="w-full rounded-t-lg transition-all"
                  style={{ height: `${(d.received / maxActivity) * 100}%`, minHeight: d.received > 0 ? '4px' : '0', background: 'linear-gradient(to top, #10b981, #0ea5e9)' }} />
                <div className="w-full rounded-t-lg"
                  style={{ height: `${(d.sent / maxActivity) * 100}%`, minHeight: d.sent > 0 ? '4px' : '0', background: 'linear-gradient(to top, #6366f1, #8b5cf6)', marginTop: '2px' }} />
              </div>
              <span className="text-xs text-slate-400 font-medium">{d.day}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(to right, #10b981, #0ea5e9)' }} />
            Received
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(to right, #6366f1, #8b5cf6)' }} />
            Sent
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Senders */}
        <div className="p-6 rounded-2xl border border-white/60 bg-white/80 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">👥 {t('topSenders')}</h3>
          {topSenders.length === 0 ? (
            <p className="text-slate-400 text-sm">No data yet</p>
          ) : (
            <div className="space-y-3">
              {topSenders.map(([email, count], i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}>
                    {email.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{email}</p>
                    <div className="h-1.5 bg-slate-100 rounded-full mt-1">
                      <div className="h-1.5 rounded-full" style={{ width: `${(count / (topSenders[0][1] || 1)) * 100}%`, background: 'linear-gradient(to right, #10b981, #0ea5e9)' }} />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-500 flex-shrink-0">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Recipients */}
        <div className="p-6 rounded-2xl border border-white/60 bg-white/80 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">📤 {t('topRecipients')}</h3>
          {topRecipients.length === 0 ? (
            <p className="text-slate-400 text-sm">No data yet</p>
          ) : (
            <div className="space-y-3">
              {topRecipients.map(([email, count], i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                    {email.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{email}</p>
                    <div className="h-1.5 bg-slate-100 rounded-full mt-1">
                      <div className="h-1.5 rounded-full" style={{ width: `${(count / (topRecipients[0][1] || 1)) * 100}%`, background: 'linear-gradient(to right, #6366f1, #8b5cf6)' }} />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-500 flex-shrink-0">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Storage */}
      <div className="p-6 rounded-2xl border border-white/60 bg-white/80 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">💾 {t('storageUsed')}</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-3 rounded-full" style={{ width: '8%', background: 'linear-gradient(to right, #10b981, #0ea5e9)' }} />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-xs text-slate-500">
                ~{Math.round((inboxEmails.reduce((a, e) => a + e.body.length, 0) + sentEmails.reduce((a, e) => a + e.body.length, 0)) / 1024)} KB used
              </span>
              <span className="text-xs text-slate-400">15 GB total</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
