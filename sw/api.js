/* CareBridge — API + auth wrapper (no bundler, plain global JS) */

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '/_/backend'
const SUPABASE_URL  = 'https://waeoxrhjrdiwknlokiai.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhZW94cmhqcmRpd2tubG9raWFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NzM1MzksImV4cCI6MjA5NjM0OTUzOX0.mGYykwWCbts4Yn55QdcIkTEtOp-XAZJh-v8AMT8R_R8'

// Supabase JS client (loaded via CDN before this file)
const _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON)

const API = {
  // ── token helpers ──────────────────────────────────────────────────────────
  getToken()      { return localStorage.getItem('cb_token') },
  setToken(t)     { localStorage.setItem('cb_token', t) },
  clearToken()    { localStorage.removeItem('cb_token') },
  getRole()       { return localStorage.getItem('cb_role') },
  setRole(r)      { localStorage.setItem('cb_role', r) },

  // ── Supabase auth ──────────────────────────────────────────────────────────
  async signIn(email, password) {
    const { data, error } = await _sb.auth.signInWithPassword({ email, password })
    if (error) throw error
    const token = data.session.access_token
    API.setToken(token)
    // role is in user_metadata (set at account creation time by seed)
    const role = data.user.user_metadata?.role ?? 'worker'
    API.setRole(role)
    return { token, role, user: data.user }
  },

  async signOut() {
    await _sb.auth.signOut()
    API.clearToken()
    localStorage.removeItem('cb_role')
  },

  // Restore session from Supabase (handles refresh tokens across page loads)
  async restoreSession() {
    const { data } = await _sb.auth.getSession()
    if (data.session) {
      API.setToken(data.session.access_token)
      const role = data.session.user.user_metadata?.role ?? 'worker'
      API.setRole(role)
      return { token: data.session.access_token, role }
    }
    return null
  },

  // ── HTTP helpers ───────────────────────────────────────────────────────────
  async _fetch(method, path, body) {
    const token = API.getToken()
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body != null ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(err.error || `HTTP ${res.status}`)
    }
    return res.json()
  },

  get:   (path)        => API._fetch('GET',   path, null),
  post:  (path, body)  => API._fetch('POST',  path, body),
  patch: (path, body)  => API._fetch('PATCH', path, body),
}

window.API = API
