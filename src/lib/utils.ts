import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string, lang = 'en'): string {
  const date = new Date(dateStr);
  const locale = lang === 'ur' ? 'ur-PK' : lang === 'ar' ? 'ar-SA' : 'en-US';
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function truncate(str: string, len = 80): string {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '…' : str;
}

export function getInitials(email: string): string {
  return email.slice(0, 2).toUpperCase();
}
