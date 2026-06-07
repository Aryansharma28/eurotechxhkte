import { Hono } from 'hono'
import { getClient } from '../lib/supabase.js'

type Env = { Variables: { token: string } }
const family = new Hono<Env>()

// GET /api/family/elder — the one elder linked to the authenticated family member
family.get('/elder', async (c) => {
  const token = c.get('token') as string
  const sb = getClient(token)
  const today = new Date().toISOString().split('T')[0]

  // find family member row for this user
  const { data: fm, error: fmErr } = await sb.from('family_members').select('*').single()
  if (fmErr || !fm) return c.json({ error: 'Family member record not found' }, 403)

  const elderId = fm.elder_id

  const [{ data: elder }, { data: acts }, { data: call }, { data: openFlags }, { data: calls }] = await Promise.all([
    sb.from('elders').select('*').eq('id', elderId).single(),
    sb.from('activity_records').select('*').eq('elder_id', elderId).eq('record_date', today),
    sb.from('daily_calls').select('*').eq('elder_id', elderId)
      .gte('scheduled_at', `${today}T00:00:00`).order('scheduled_at', { ascending: false }).limit(1).maybeSingle(),
    sb.from('flags').select('*').eq('elder_id', elderId).eq('resolved', false),
    sb.from('daily_calls').select('scheduled_at,state,summary_en,summary_zh')
      .eq('elder_id', elderId).order('scheduled_at', { ascending: false }).limit(7),
  ])

  return c.json({
    elder,
    family_member: fm,
    today_activities: acts,
    today_call: call,
    open_flags: openFlags,
    recent_calls: calls,
  })
})

export default family
