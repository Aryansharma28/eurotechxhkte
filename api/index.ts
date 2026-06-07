import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { handle } from 'hono/vercel'
import { createMiddleware } from 'hono/factory'
import { createClient } from '@supabase/supabase-js'

export const config = { runtime: 'nodejs' }

// ── Supabase helpers ──────────────────────────────────────────────────────────

function getClient(token?: string) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    global: { headers: token ? { Authorization: `Bearer ${token}` } : {} },
  })
}

function getAdminClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function getUserId(token: string): Promise<string | null> {
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)
  const { data, error } = await sb.auth.getUser(token)
  if (error) return null
  return data.user?.id ?? null
}

// ── Auth middleware ───────────────────────────────────────────────────────────

type Env = { Variables: { token: string } }

const auth = createMiddleware<Env>(async (c, next) => {
  const header = c.req.header('Authorization')
  if (!header?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  c.set('token', header.slice(7))
  await next()
})

// ── App ───────────────────────────────────────────────────────────────────────

const app = new Hono<Env>().basePath('/api')

app.use('*', cors({ origin: '*', allowHeaders: ['Authorization', 'Content-Type'] }))
app.get('/', (c) => c.json({ status: 'ok', project: 'CareBridge 康橋' }))
app.use('*', auth)

// ── /api/elders ───────────────────────────────────────────────────────────────

const daysSince = (d: string | null) =>
  d ? Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000) : null

app.get('/elders', async (c) => {
  const token = c.get('token')
  const sb = getClient(token)
  const today = new Date().toISOString().split('T')[0]

  const { data: elderRows, error } = await sb.from('elders').select('*').order('risk_tier')
  if (error) return c.json({ error: error.message }, 500)

  const riskOrder: Record<string, number> = { risk: 0, watch: 1, stable: 2 }
  elderRows.sort((a: any, b: any) => (riskOrder[a.risk_tier] ?? 3) - (riskOrder[b.risk_tier] ?? 3))
  const ids = elderRows.map((e: any) => e.id)

  const [{ data: acts }, { data: calls }, { data: openFlags }] = await Promise.all([
    sb.from('activity_records').select('*').in('elder_id', ids).eq('record_date', today),
    sb.from('daily_calls').select('*').in('elder_id', ids)
      .gte('scheduled_at', `${today}T00:00:00`).lt('scheduled_at', `${today}T23:59:59`),
    sb.from('flags').select('*').in('elder_id', ids).eq('resolved', false),
  ])

  return c.json(elderRows.map((e: any) => ({
    ...e,
    day_since_discharge: daysSince(e.discharge_date),
    today_activities: (acts || []).filter((a: any) => a.elder_id === e.id),
    latest_call: (calls || []).find((call: any) => call.elder_id === e.id) ?? null,
    open_flags: (openFlags || []).filter((f: any) => f.elder_id === e.id),
  })))
})

// ── /api/visits ───────────────────────────────────────────────────────────────

app.get('/visits', async (c) => {
  const token = c.get('token')
  const sb = getClient(token)
  const today = new Date().toISOString().split('T')[0]

  const userId = await getUserId(token)
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)
  const { data: worker } = await sb.from('workers').select('id').eq('profile_id', userId).maybeSingle()
  if (!worker) return c.json({ error: 'Worker not found' }, 403)

  const { data, error } = await sb.from('visits')
    .select('*, elder:elders(id,name_en,name_zh,dx_en,dx_zh,lives_en)')
    .eq('worker_id', worker.id)
    .gte('scheduled_at', `${today}T00:00:00`)
    .lt('scheduled_at', `${today}T23:59:59`)
    .order('scheduled_at')

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

app.post('/visits', async (c) => {
  const token = c.get('token')
  const sb = getClient(token)
  const { elder_id, notes, checked_acts, quick_flags, visit_id } = await c.req.json()

  const userId = await getUserId(token)
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)
  const { data: worker } = await sb.from('workers').select('id').eq('profile_id', userId).maybeSingle()
  if (!worker) return c.json({ error: 'Worker not found' }, 403)

  const today = new Date().toISOString().split('T')[0]

  if (visit_id) {
    await sb.from('visits').update({ state: 'done', notes, checked_acts, quick_flags }).eq('id', visit_id)
  } else {
    await sb.from('visits').insert({
      elder_id, worker_id: worker.id, state: 'done', notes, checked_acts, quick_flags,
      scheduled_at: new Date().toISOString(),
    })
  }

  if (checked_acts?.length) {
    await sb.from('activity_records').upsert(
      checked_acts.map((key: string) => ({
        elder_id, record_date: today, activity_key: key, status: 'done', source: 'visit',
      })),
      { onConflict: 'elder_id,record_date,activity_key' }
    )
  }

  if (quick_flags?.length) {
    await sb.from('flags').insert(quick_flags.map((label: string) => ({
      elder_id, kind: 'visit-flag',
      severity: label.toLowerCase().includes('gp') || label.toLowerCase().includes('falls') ? 'risk' : 'watch',
      label_en: label, source: 'visit', resolved: false,
    })))
  }

  const { data: openFlags } = await sb.from('flags').select('severity').eq('elder_id', elder_id).eq('resolved', false)
  let newRisk = 'stable'
  if (openFlags?.some((f: any) => f.severity === 'risk')) newRisk = 'risk'
  else if (openFlags?.some((f: any) => f.severity === 'watch')) newRisk = 'watch'
  await sb.from('elders').update({ risk_tier: newRisk }).eq('id', elder_id)

  return c.json({ ok: true, new_risk_tier: newRisk })
})

// ── /api/flags ────────────────────────────────────────────────────────────────

app.get('/flags', async (c) => {
  const token = c.get('token')
  const sb = getClient(token)

  const { data, error } = await sb.from('flags')
    .select('*, elder:elders(id,name_en,name_zh)')
    .eq('resolved', false)
    .order('raised_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json((data || []).sort((a: any, b: any) =>
    (a.severity === 'risk' ? 0 : 1) - (b.severity === 'risk' ? 0 : 1)))
})

app.patch('/flags/:id/resolve', async (c) => {
  const token = c.get('token')
  const sb = getClient(token)
  const { error } = await sb.from('flags')
    .update({ resolved: true, resolved_at: new Date().toISOString() })
    .eq('id', c.req.param('id'))
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ ok: true })
})

// ── /api/family ───────────────────────────────────────────────────────────────

app.get('/family/elder', async (c) => {
  const token = c.get('token')
  const sb = getClient(token)
  const today = new Date().toISOString().split('T')[0]

  const userId = await getUserId(token)
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)
  const { data: fmRows, error: fmErr } = await sb.from('family_members').select('*').eq('profile_id', userId).limit(1)
  const fm = fmRows?.[0]
  if (fmErr || !fm) return c.json({ error: 'Family member record not found' }, 403)

  const elderId = fm.elder_id

  const [{ data: elder }, { data: acts }, { data: call }, { data: openFlags }, { data: calls }, { data: plan }] =
    await Promise.all([
      sb.from('elders').select('*').eq('id', elderId).single(),
      sb.from('activity_records').select('*').eq('elder_id', elderId).eq('record_date', today),
      sb.from('daily_calls').select('*').eq('elder_id', elderId)
        .gte('scheduled_at', `${today}T00:00:00`).order('scheduled_at', { ascending: false }).limit(1).maybeSingle(),
      sb.from('flags').select('*').eq('elder_id', elderId).eq('resolved', false),
      sb.from('daily_calls').select('scheduled_at,state,summary_en,summary_zh')
        .eq('elder_id', elderId).order('scheduled_at', { ascending: false }).limit(7),
      sb.from('care_plan_items').select('*').eq('elder_id', elderId),
    ])

  let worker: any = null
  if ((elder as any)?.assigned_worker_id) {
    const { data: w } = await getAdminClient().from('workers')
      .select('name_en,name_zh,role_en,role_zh,phone')
      .eq('id', (elder as any).assigned_worker_id)
      .single()
    worker = w
  }

  return c.json({
    elder: elder ? { ...elder, day_since_discharge: daysSince(elder.discharge_date) } : elder,
    family_member: fm,
    today_activities: acts,
    today_call: call,
    open_flags: openFlags,
    recent_calls: calls,
    care_plan: plan,
    worker: worker ?? { name_en: 'Karen Tsang', name_zh: '曾家欣', role_en: 'Community geriatric nurse', phone: '+852 8100 2233' },
  })
})

export default handle(app)
