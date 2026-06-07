import { Hono } from 'hono'
import { getClient, getAdminClient, getUserId } from '../lib/supabase.js'

type Env = { Variables: { token: string } }
const family = new Hono<Env>()

// GET /api/family/elder — the one elder linked to the authenticated family member
family.get('/elder', async (c) => {
  const token = c.get('token') as string
  const sb = getClient(token)
  const today = new Date().toISOString().split('T')[0]

  // resolve the authenticated family member by user id (not a bare .single()).
  // limit(1) keeps it safe even if a user is linked to more than one elder.
  const userId = await getUserId(token)
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)
  const { data: fmRows, error: fmErr } = await sb.from('family_members').select('*').eq('profile_id', userId).limit(1)
  const fm = fmRows?.[0]
  if (fmErr || !fm) return c.json({ error: 'Family member record not found' }, 403)

  const elderId = fm.elder_id

  const [{ data: elder }, { data: acts }, { data: call }, { data: openFlags }, { data: calls }, { data: plan }] = await Promise.all([
    sb.from('elders').select('*').eq('id', elderId).single(),
    sb.from('activity_records').select('*').eq('elder_id', elderId).eq('record_date', today),
    sb.from('daily_calls').select('*').eq('elder_id', elderId)
      .gte('scheduled_at', `${today}T00:00:00`).order('scheduled_at', { ascending: false }).limit(1).maybeSingle(),
    sb.from('flags').select('*').eq('elder_id', elderId).eq('resolved', false),
    sb.from('daily_calls').select('scheduled_at,state,summary_en,summary_zh')
      .eq('elder_id', elderId).order('scheduled_at', { ascending: false }).limit(7),
    sb.from('care_plan_items').select('*').eq('elder_id', elderId),
  ])

  // worker linked to this elder — service role bypasses RLS so family can see it
  let worker: any = null
  if ((elder as any)?.assigned_worker_id) {
    const sbAdmin = getAdminClient()
    const { data: w } = await sbAdmin.from('workers')
      .select('name_en,name_zh,role_en,role_zh,phone')
      .eq('id', (elder as any).assigned_worker_id)
      .single()
    worker = w
  }

  const daysSince = (d: string | null) => d ? Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000) : null

  return c.json({
    elder: elder ? { ...elder, day_since_discharge: daysSince(elder.discharge_date) } : elder,
    family_member: fm,
    today_activities: acts,
    today_call: call,
    open_flags: openFlags,
    recent_calls: calls,
    care_plan: plan,
    worker: worker ? worker : { name_en: 'Karen Tsang', name_zh: '曾家欣', role_en: 'Community geriatric nurse', phone: '+852 8100 2233' },
  })
})

export default family
