import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!

export function getClient(token?: string) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    }
  })
}

export function getAdminClient() {
  return createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// Verify a Supabase JWT and return the authenticated user's id.
// This validates the token with Supabase (defense-in-depth beyond RLS) and gives us
// a concrete user id to scope identity lookups by — instead of a bare `.single()`
// that trusts RLS to leave exactly one visible row.
export async function getUserId(token: string): Promise<string | null> {
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data, error } = await sb.auth.getUser(token)
  if (error) return null
  return data.user?.id ?? null
}
