import { Hono } from 'hono'
import { getClient } from '../lib/supabase.js'

type Env = { Variables: { token: string } }
const elders = new Hono<Env>()

const daysSince = (dischargeDate: string | null): number | null =>
  dischargeDate ? Math.floor((Date.now() - new Date(dischargeDate).getTime()) / 86_400_000) : null

// GET /api/elders — worker's caseload with today's activities, call state, open flags
elders.get('/', async (c) => {
  const token = c.get('token') as string
  const sb = getClient(token)
  const today = new Date().toISOString().split('T')[0]

  const { data: elderRows, error } = await sb.from('elders').select('*').order('risk_tier')
  if (error) return c.json({ error: error.message }, 500)

  // risk sort order
  const riskOrder = { risk: 0, watch: 1, stable: 2 }
  elderRows.sort((a: any, b: any) => (riskOrder[a.risk_tier as keyof typeof riskOrder] ?? 3) - (riskOrder[b.risk_tier as keyof typeof riskOrder] ?? 3))

  const ids = elderRows.map((e: any) => e.id)

  const [{ data: acts }, { data: calls }, { data: openFlags }] = await Promise.all([
    sb.from('activity_records').select('*').in('elder_id', ids).eq('record_date', today),
    sb.from('daily_calls').select('*').in('elder_id', ids).gte('scheduled_at', `${today}T00:00:00`).lt('scheduled_at', `${today}T23:59:59`),
    sb.from('flags').select('*').in('elder_id', ids).eq('resolved', false),
  ])

  const result = elderRows.map((e: any) => {
    const todayActs = (acts || []).filter((a: any) => a.elder_id === e.id)
    const call      = (calls || []).find((c: any) => c.elder_id === e.id) ?? null
    const flags     = (openFlags || []).filter((f: any) => f.elder_id === e.id)
    return { ...e, day_since_discharge: daysSince(e.discharge_date), today_activities: todayActs, latest_call: call, open_flags: flags }
  })

  return c.json(result)
})

// GET /api/elders/:id — full elder detail
elders.get('/:id', async (c) => {
  const token = c.get('token') as string
  const sb = getClient(token)
  const id = c.req.param('id')
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 6)
  const weekAgoStr = weekAgo.toISOString().split('T')[0]

  const [{ data: elder }, { data: acts }, { data: vitals }, { data: flags },
         { data: plan }, { data: calls }, { data: family }] = await Promise.all([
    sb.from('elders').select('*').eq('id', id).single(),
    sb.from('activity_records').select('*').eq('elder_id', id).gte('record_date', weekAgoStr).order('record_date'),
    sb.from('vitals').select('*').eq('elder_id', id).order('measured_at', { ascending: false }),
    sb.from('flags').select('*').eq('elder_id', id).eq('resolved', false),
    sb.from('care_plan_items').select('*').eq('elder_id', id),
    sb.from('daily_calls').select('*').eq('elder_id', id).order('scheduled_at', { ascending: false }).limit(7),
    sb.from('family_members').select('*').eq('elder_id', id),
  ])

  if (!elder) return c.json({ error: 'Not found' }, 404)
  return c.json({ ...elder, day_since_discharge: daysSince(elder.discharge_date), activities: acts, vitals, open_flags: flags, care_plan: plan, recent_calls: calls, family })
})

// PATCH /api/elders/:id/risk — override risk tier
elders.patch('/:id/risk', async (c) => {
  const token = c.get('token') as string
  const sb = getClient(token)
  const id = c.req.param('id')
  const { risk_tier, risk_note_en, risk_note_zh } = await c.req.json()
  const { error } = await sb.from('elders').update({ risk_tier, risk_note_en, risk_note_zh }).eq('id', id)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ ok: true })
})

export default elders
