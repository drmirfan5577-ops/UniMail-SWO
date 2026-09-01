export interface AuthUser {
  id: string;
  email: string;
  username: string;
  avatar?: string;
}

export interface Email {
  id: string;
  user_id: string;
  from_email: string;
  to_email: string;
  subject: string;
  body: string;
  sent_at: string;
  resend_id?: string;
  is_starred?: boolean;
  is_trashed?: boolean;
  label?: string;
}

export interface InboxEmail {
  id: string;
  user_id: string;
  from_email: string;
  to_email: string;
  subject: string;
  body: string;
  is_read: boolean;
  received_at: string;
  is_starred?: boolean;
  is_important?: boolean;
  is_archived?: boolean;
  is_spam?: boolean;
  is_trashed?: boolean;
  label?: string;
  folder?: string;
  category?: 'primary' | 'social' | 'promotions' | 'updates' | 'forums';
}

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  notes?: string;
  avatar_color: string;
  created_at: string;
  updated_at: string;
}

export interface Draft {
  id: string;
  user_id: string;
  to_email: string;
  subject: string;
  body: string;
  updated_at: string;
}

export interface EmailAccount {
  id: string;
  user_id: string;
  provider: 'uniorbi' | 'gmail' | 'yahoo' | 'outlook' | 'custom';
  email: string;
  display_name?: string;
  is_default: boolean;
  is_active: boolean;
  color: string;
  icon: string;
  imap_host?: string;
  imap_port?: number;
  smtp_host?: string;
  smtp_port?: number;
  created_at: string;
}

export interface Label {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface DomainRecord {
  id: string;
  user_id: string;
  domain: string;
  registrar?: string;
  registration_date?: string;
  expiry_date?: string;
  auto_renew: boolean;
  status: 'active' | 'expired' | 'pending' | 'transferred';
  notes?: string;
  category: 'domain' | 'hosting' | 'ssl' | 'dns' | 'other';
  created_at: string;
  updated_at: string;
}

export interface LoginLog {
  id: string;
  user_id: string;
  event_type: 'login' | 'logout' | 'failed';
  ip_address?: string;
  user_agent?: string;
  device?: string;
  location?: string;
  created_at: string;
}

export type Theme = 'light' | 'dark';
export type Language = 'en' | 'ur' | 'ar';
export type LauncherStyle = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type InboxTab = 'primary' | 'social' | 'promotions' | 'updates' | 'forums';

export interface AdminSettings {
  appName: string;
  primaryColor: string;
  accentColor: string;
  defaultLauncher: LauncherStyle;
  defaultLanguage: Language;
  defaultTheme: Theme;
  showAnimations: boolean;
  autoSave: boolean;
}
