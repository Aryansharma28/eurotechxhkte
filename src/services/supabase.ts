import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

// The voice server writes call outcomes on behalf of the *system* (a phone call has no
// logged-in user / JWT), so it uses the service-role key, which bypasses RLS. This must
// stay server-side only — never ship the service-role key to the browser.
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

let _sb: SupabaseClient | null = null;
if (url && key) {
  _sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
} else {
  console.warn('[Supabase] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — check-in writes will fail until configured.');
}

export const sb = _sb;

export function assertDb(): SupabaseClient {
  if (!_sb) {
    throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.');
  }
  return _sb;
}
