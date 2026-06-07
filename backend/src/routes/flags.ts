import { Hono } from 'hono'
import { getClient } from '../lib/supabase.js'

type Env = { Variables: { token: string } }
const flags = new Hono<Env>()

// GET /api/flags — open flags for worker's elders (sorted by severity)
flags.get('/', async (c) => {
  const token = c.get('token') as string
  const sb = getClient(token)

  const { data, error } = await sb.from('flags')
    .select('*, elder:elders(id,name_en,name_zh)')
    .eq('resolved', false)
    .order('raised_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)

  // sort: risk before watch
  const sorted = (data || []).sort((a: any, b: any) =>
    (a.severity === 'risk' ? 0 : 1) - (b.severity === 'risk' ? 0 : 1))

  return c.json(sorted)
})

// PATCH /api/flags/:id/resolve
flags.patch('/:id/resolve', async (c) => {
  const token = c.get('token') as string
  const sb = getClient(token)
  const id = c.req.param('id')

  const { error } = await sb.from('flags')
    .update({ resolved: true, resolved_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ ok: true })
})

export default flags
