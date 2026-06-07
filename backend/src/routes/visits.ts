import { Hono } from 'hono'
import { getClient } from '../lib/supabase.js'

type Env = { Variables: { token: string } }
const visits = new Hono<Env>()

// GET /api/visits — today's visits for authenticated worker
visits.get('/', async (c) => {
  const token = c.get('token') as string
  const sb = getClient(token)
  const today = new Date().toISOString().split('T')[0]

  // get worker id
  const { data: worker } = await sb.from('workers').select('id').single()
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

// POST /api/visits — save a completed visit
visits.post('/', async (c) => {
  const token = c.get('token') as string
  const sb = getClient(token)
  const body = await c.req.json()
  const { elder_id, notes, checked_acts, quick_flags, visit_id } = body

  // get worker id
  const { data: worker } = await sb.from('workers').select('id').single()
  if (!worker) return c.json({ error: 'Worker not found' }, 403)

  const today = new Date().toISOString().split('T')[0]

  // upsert visit record (if visit_id provided, mark existing done; else create new)
  const visitPayload: any = {
    elder_id, worker_id: worker.id,
    state: 'done', notes, checked_acts, quick_flags,
    scheduled_at: new Date().toISOString(),
  }
  if (visit_id) {
    await sb.from('visits').update({ state: 'done', notes, checked_acts, quick_flags }).eq('id', visit_id)
  } else {
    await sb.from('visits').insert(visitPayload)
  }

  // write activity records for checked activities
  if (checked_acts?.length) {
    const actRows = checked_acts.map((key: string) => ({
      elder_id, record_date: today, activity_key: key, status: 'done', source: 'visit'
    }))
    await sb.from('activity_records').upsert(actRows, { onConflict: 'elder_id,record_date,activity_key' })
  }

  // raise quick flags if any risk/watch chips ticked
  if (quick_flags?.length) {
    const flagRows = quick_flags.map((label: string) => ({
      elder_id,
      kind: 'visit-flag',
      severity: label.toLowerCase().includes('gp') || label.toLowerCase().includes('falls') ? 'risk' : 'watch',
      label_en: label,
      source: 'visit',
      resolved: false,
    }))
    await sb.from('flags').insert(flagRows)
  }

  // recompute risk: if any risk flag open → risk; watch flag → watch; else stable
  const { data: openFlags } = await sb.from('flags').select('severity').eq('elder_id', elder_id).eq('resolved', false)
  let newRisk = 'stable'
  if (openFlags?.some((f: any) => f.severity === 'risk'))  newRisk = 'risk'
  else if (openFlags?.some((f: any) => f.severity === 'watch')) newRisk = 'watch'
  await sb.from('elders').update({ risk_tier: newRisk }).eq('id', elder_id)

  return c.json({ ok: true, new_risk_tier: newRisk })
})

export default visits
