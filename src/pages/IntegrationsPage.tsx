import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface Integration {
  id: string;
  name: string;
  category: string;
  emoji: string;
  description: string;
  from: string;
  to: string;
  docsUrl: string;
  features: string[];
  configFields: { key: string; label: string; placeholder: string; type?: string }[];
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'resend', name: 'Resend', category: 'Email', emoji: '📬',
    description: 'Email delivery API for sending transactional and marketing emails. Already configured for UniOrbi Mail.',
    from: '#10b981', to: '#0d9488', docsUrl: 'https://resend.com/docs',
    features: ['Send emails via API', 'Delivery tracking', 'Webhook events', 'Domain verification'],
    configFields: [{ key: 'api_key', label: 'API Key', placeholder: 're_xxxxxxxxxxxx' }],
  },
  {
    id: 'supabase', name: 'Supabase', category: 'Backend', emoji: '🗄️',
    description: 'Backend-as-a-service: PostgreSQL database, authentication, real-time subscriptions, and storage.',
    from: '#3ECF8E', to: '#1a1a2e', docsUrl: 'https://supabase.com/docs',
    features: ['PostgreSQL database', 'Auth & user management', 'Real-time subscriptions', 'File storage'],
    configFields: [
      { key: 'url', label: 'Project URL', placeholder: 'https://xxxx.supabase.co' },
      { key: 'anon_key', label: 'Anon Key', placeholder: 'eyJxxx...' },
    ],
  },
  {
    id: 'cloudflare', name: 'Cloudflare', category: 'DNS / CDN', emoji: '☁️',
    description: 'DNS management, CDN, DDoS protection, SSL certificates, and domain registration.',
    from: '#F6821F', to: '#FBAD41', docsUrl: 'https://developers.cloudflare.com',
    features: ['DNS management', 'CDN & caching', 'SSL/TLS', 'DDoS protection', 'Email routing'],
    configFields: [
      { key: 'api_token', label: 'API Token', placeholder: 'Bearer xxxxxxxx' },
      { key: 'zone_id', label: 'Zone ID', placeholder: 'xxxxxxxxxxxxxxxx' },
    ],
  },
  {
    id: 'namecheap', name: 'Namecheap', category: 'Domain', emoji: '🏷️',
    description: 'Domain registrar for buying, renewing, and managing domain names with WhoisGuard protection.',
    from: '#DE3723', to: '#FF6B47', docsUrl: 'https://www.namecheap.com/support/api/intro',
    features: ['Domain registration', 'Domain renewal', 'WhoisGuard', 'DNS hosting'],
    configFields: [
      { key: 'api_user', label: 'API Username', placeholder: 'your_username' },
      { key: 'api_key', label: 'API Key', placeholder: 'xxxxxxxx' },
    ],
  },
  {
    id: 'godaddy', name: 'GoDaddy', category: 'Domain', emoji: '🤠',
    description: 'World\'s largest domain registrar — buy domains, hosting, and SSL certificates.',
    from: '#1BDBDB', to: '#00BF9A', docsUrl: 'https://developer.godaddy.com',
    features: ['Domain management', 'DNS records', 'SSL certificates', 'Web hosting'],
    configFields: [
      { key: 'api_key', label: 'API Key', placeholder: 'xxxxxxxx' },
      { key: 'api_secret', label: 'API Secret', placeholder: 'xxxxxxxx' },
    ],
  },
  {
    id: 'netlify', name: 'Netlify', category: 'Hosting', emoji: '🔷',
    description: 'Web hosting and serverless functions platform. Deploy with Git push or drag-and-drop.',
    from: '#00C7B7', to: '#00AD9F', docsUrl: 'https://docs.netlify.com',
    features: ['Static site hosting', 'Serverless functions', 'Form handling', 'Deploy previews', 'Custom domains'],
    configFields: [
      { key: 'token', label: 'Personal Access Token', placeholder: 'xxxxxxxxxxxxxxxxxxxx' },
      { key: 'site_id', label: 'Site ID (optional)', placeholder: 'your-site-id' },
    ],
  },
  {
    id: 'vercel', name: 'Vercel', category: 'Hosting', emoji: '▲',
    description: 'Frontend cloud platform for deploying and hosting web apps with zero configuration.',
    from: '#000000', to: '#333333', docsUrl: 'https://vercel.com/docs',
    features: ['Edge network CDN', 'Serverless functions', 'Automatic HTTPS', 'Git deployments', 'Analytics'],
    configFields: [
      { key: 'token', label: 'Access Token', placeholder: 'xxxxxxxxxxxxxxxxxxxx' },
    ],
  },
  {
    id: 'github', name: 'GitHub', category: 'Version Control', emoji: '🐙',
    description: 'Code hosting and collaboration platform. CI/CD, issue tracking, and project management.',
    from: '#24292F', to: '#161B22', docsUrl: 'https://docs.github.com/en/rest',
    features: ['Repository management', 'GitHub Actions CI/CD', 'Issue tracking', 'Pull requests', 'GitHub Pages'],
    configFields: [
      { key: 'token', label: 'Personal Access Token', placeholder: 'ghp_xxxxxxxxxxxx' },
      { key: 'repo', label: 'Repository (optional)', placeholder: 'owner/repo-name' },
    ],
  },
  {
    id: 'zoho', name: 'Zoho Mail', category: 'Email', emoji: '📮',
    description: 'Business email hosting with full suite of productivity apps. Connect your zoho.com emails.',
    from: '#E01E37', to: '#C9184A', docsUrl: 'https://www.zoho.com/mail/help/api',
    features: ['Business email', 'Calendar sync', 'Contacts sync', 'CRM integration'],
    configFields: [
      { key: 'client_id', label: 'Client ID', placeholder: 'xxxxxxxxxxxxxxxx' },
      { key: 'client_secret', label: 'Client Secret', placeholder: 'xxxxxxxxxxxxxxxx' },
    ],
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  'Email': 'bg-emerald-100 text-emerald-700',
  'Backend': 'bg-blue-100 text-blue-700',
  'DNS / CDN': 'bg-orange-100 text-orange-700',
  'Domain': 'bg-purple-100 text-purple-700',
  'Hosting': 'bg-teal-100 text-teal-700',
  'Version Control': 'bg-slate-100 text-slate-700',
};

export default function IntegrationsPage() {
  const { t } = useLanguage();
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [configs, setConfigs] = useState<Record<string, Record<string, string>>>({});
  const [connected, setConnected] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('unimail_integrations') || '{}'); } catch { return {}; }
  });
  const [filterCat, setFilterCat] = useState('All');

  const categories = ['All', ...Array.from(new Set(INTEGRATIONS.map(i => i.category)))];

  const handleSaveConfig = (id: string) => {
    const newConnected = { ...connected, [id]: true };
    setConnected(newConnected);
    localStorage.setItem('unimail_integrations', JSON.stringify(newConnected));
    toast.success(`${INTEGRATIONS.find(i => i.id === id)?.name} connected!`);
    setSelectedIntegration(null);
  };

  const handleDisconnect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newConnected = { ...connected, [id]: false };
    setConnected(newConnected);
    localStorage.setItem('unimail_integrations', JSON.stringify(newConnected));
    toast.success(`Disconnected`);
  };

  const filtered = filterCat === 'All' ? INTEGRATIONS : INTEGRATIONS.filter(i => i.category === filterCat);
  const connectedCount = Object.values(connected).filter(Boolean).length;

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-2xl font-black text-slate-800">{t('integrations')}</h2>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
            {connectedCount} / {INTEGRATIONS.length} connected
          </span>
        </div>
        <p className="text-sm text-slate-500">Connect UniMail with your tech stack — domains, hosting, email services, and more</p>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${filterCat === cat ? 'text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            style={filterCat === cat ? { background: 'linear-gradient(135deg, #64748b, #475569)' } : {}}>
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(integration => {
          const isConn = connected[integration.id];
          return (
            <div key={integration.id}
              onClick={() => setSelectedIntegration(integration)}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] ${isConn ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-100 bg-white/90 hover:border-slate-200'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${integration.from}, ${integration.to})` }}>
                  <span className="text-white text-xl">{integration.emoji}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${CATEGORY_COLORS[integration.category] || 'bg-slate-100 text-slate-600'}`}>
                    {integration.category}
                  </span>
                  {isConn && (
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-emerald-600">Live</span>
                    </div>
                  )}
                </div>
              </div>
              <h3 className="font-black text-slate-800 text-base mb-1">{integration.name}</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-2">{integration.description}</p>
              <div className="flex gap-2">
                <button
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${isConn ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'text-white hover:scale-105'}`}
                  style={!isConn ? { background: `linear-gradient(135deg, ${integration.from}, ${integration.to})` } : {}}>
                  {isConn ? '✓ Connected' : 'Connect'}
                </button>
                {isConn && (
                  <button onClick={e => handleDisconnect(integration.id, e)}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                    ✕
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Integration Detail Modal */}
      {selectedIntegration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl shadow-2xl border border-white/60 animate-slide-in overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)' }}>
            {/* Header gradient */}
            <div className="h-24 relative flex items-end px-6 pb-0"
              style={{ background: `linear-gradient(135deg, ${selectedIntegration.from}, ${selectedIntegration.to})` }}>
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl absolute -bottom-7 left-6 shadow-lg border-2 border-white/60">
                {selectedIntegration.emoji}
              </div>
              <button onClick={() => setSelectedIntegration(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="pt-10 px-6 pb-6 space-y-4">
              <div>
                <h3 className="text-xl font-black text-slate-800">{selectedIntegration.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{selectedIntegration.description}</p>
              </div>
              {/* Features */}
              <div className="grid grid-cols-2 gap-2">
                {selectedIntegration.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[9px] font-bold"
                      style={{ background: `linear-gradient(135deg, ${selectedIntegration.from}, ${selectedIntegration.to})` }}>✓</span>
                    {f}
                  </div>
                ))}
              </div>
              {/* Config fields */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Configuration</p>
                {selectedIntegration.configFields.map(field => (
                  <div key={field.key}>
                    <label className="block text-xs font-bold text-slate-600 mb-1">{field.label}</label>
                    <input
                      type={field.type || 'text'}
                      value={configs[selectedIntegration.id]?.[field.key] || ''}
                      onChange={e => setConfigs(c => ({ ...c, [selectedIntegration.id]: { ...c[selectedIntegration.id], [field.key]: e.target.value } }))}
                      placeholder={field.placeholder}
                      className="input-field font-mono text-xs"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleSaveConfig(selectedIntegration.id)}
                  className="flex-1 py-3 rounded-xl text-white font-bold text-sm transition-all hover:scale-[1.02]"
                  style={{ background: `linear-gradient(135deg, ${selectedIntegration.from}, ${selectedIntegration.to})` }}>
                  {connected[selectedIntegration.id] ? 'Update Connection' : 'Connect'}
                </button>
                <a href={selectedIntegration.docsUrl} target="_blank" rel="noopener noreferrer"
                  className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm transition-colors flex items-center gap-1">
                  📖 Docs
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
