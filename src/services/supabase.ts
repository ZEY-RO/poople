import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Development sessions stay local and never send test games to production.
// Both optional services share one client, without an unused auth session.
const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
let url = '';
let client: SupabaseClient | null = null;
if (!import.meta.env.DEV && rawUrl && key) {
  try {
    const parsed = new URL(rawUrl.replace(/\/+$/, '').replace(/\/rest\/v1$/, ''));
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      url = parsed.origin + parsed.pathname.replace(/\/+$/, '');
      client = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        realtime: { params: { eventsPerSecond: 10 } }
      });
    }
  } catch {
    // Invalid optional configuration must not prevent the game from loading.
  }
}

export const supabase = client;
export const isRemoteConfigured = client !== null;
export const remoteConfig = { url, key };
