
// Fallback for demo purposes if environment variable is missing
export const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000/api';

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'wa_bot_token'
};

export const STATUS_COLORS = {
  Connected: 'text-green-600 bg-green-50 border-green-200',
  Disconnected: 'text-red-600 bg-red-50 border-red-200',
  Connecting: 'text-amber-600 bg-amber-50 border-amber-200'
};

export const STATUS_LABELS = {
  Connected: 'متصل',
  Disconnected: 'غير متصل',
  Connecting: 'جاري الاتصال...'
};
