/**
 * CareBridge seed script — run once to populate Supabase with demo data.
 * Uses the service-role key (bypasses RLS) so it must NEVER run in production.
 *
 *   cd backend && npx tsx src/db/seed.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in backend/.env
 */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url  = process.env.SUPABASE_URL!
const key  = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!key) {
  console.error('SUPABASE_SERVICE_ROLE_KEY missing from .env — cannot seed')
  process.exit(1)
}

const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

// ─── helpers ───────────────────────────────────────────────────────────────

async function createUser(email: string, password: string, role: 'worker' | 'family', nameEn: string, nameZh: string) {
  const { data, error } = await sb.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { role, name_en: nameEn, name_zh: nameZh }
  })
  if (error && !error.message.includes('already registered')) throw error
  if (error?.message.includes('already registered')) {
    const { data: list } = await sb.auth.admin.listUsers()
    return list.users.find(u => u.email === email)!
  }
  return data.user!
}

async function upsert(table: string, rows: object | object[], onConflict?: string) {
  const q = sb.from(table).upsert(rows as any, onConflict ? { onConflict } : undefined)
  const { error } = await q
  if (error) throw new Error(`upsert ${table}: ${error.message}`)
}

// ─── 1. Worker: Karen Tsang ────────────────────────────────────────────────

console.log('Creating worker account…')
const karenUser = await createUser('karen@carebridge.hk', 'hackathon123', 'worker', 'Karen Tsang', '曾家欣')

await upsert('profiles', { id: karenUser.id, role: 'worker', name_en: 'Karen Tsang', name_zh: '曾家欣' }, 'id')

const { data: workerRow, error: wErr } = await sb.from('workers')
  .upsert({ profile_id: karenUser.id, name_en: 'Karen Tsang', name_zh: '曾家欣',
            role_en: 'Community geriatric nurse', role_zh: '社區老人科護士',
            team: 'Kowloon East Transitional Care', phone: '+852 8100 2233' }, { onConflict: 'profile_id' })
  .select('id').single()
if (wErr) throw wErr
const workerId = workerRow.id

// ─── 2. Elders ─────────────────────────────────────────────────────────────

const today = new Date()
const daysAgo = (n: number) => { const d = new Date(today); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0] }

const eldersData = [
  { id: 'wong',   name_en: 'Wong Mei-ling',   name_zh: '黃美玲', age: 78, sex: 'F',
    dx_en: 'Pneumonia + COPD',         dx_zh: '肺炎 · 慢阻肺病',
    discharge_date: daysAgo(8),  risk_tier: 'watch',
    risk_note_en: 'Dizziness + lives alone. Falls risk if it persists.',
    risk_note_zh: '頭暈加獨居，持續或有跌倒風險。',
    lives_en: 'Lives alone · Sham Shui Po', lives_zh: '獨居 · 深水埗', phone: '+852 5100 0001' },
  { id: 'chan',   name_en: 'Chan Kwok-keung', name_zh: '陳國強', age: 82, sex: 'M',
    dx_en: 'Congestive heart failure',  dx_zh: '充血性心臟衰竭',
    discharge_date: daysAgo(4),  risk_tier: 'risk',
    risk_note_en: 'Day 4 CHF, weight up 1.8 kg in 3 days + missed call. Possible fluid overload.',
    risk_note_zh: '出院第 4 天，3 日內體重升 1.8 公斤兼未接電話，疑似積水。',
    lives_en: 'Lives with spouse · Kwun Tong', lives_zh: '與配偶同住 · 觀塘', phone: '+852 5100 0002' },
  { id: 'lee',    name_en: 'Lee Sau-ying',    name_zh: '李秀英', age: 75, sex: 'F',
    dx_en: 'Hip fracture — post-op',    dx_zh: '髖部骨折 · 術後',
    discharge_date: daysAgo(15), risk_tier: 'stable',
    risk_note_en: 'Recovering well. Maintain mobility momentum.',
    risk_note_zh: '復原良好，維持活動進度。',
    lives_en: 'Lives with son · Tseung Kwan O', lives_zh: '與兒子同住 · 將軍澳', phone: '+852 5100 0003' },
  { id: 'cheung', name_en: 'Cheung Chi-ming', name_zh: '張志明', age: 80, sex: 'M',
    dx_en: 'Stroke recovery + diabetes', dx_zh: '中風復康 · 糖尿病',
    discharge_date: daysAgo(11), risk_tier: 'watch',
    risk_note_en: 'Medication adherence slipping (3 misses this week) + diabetic.',
    risk_note_zh: '服藥依從性下降（本週漏 3 次）兼糖尿。',
    lives_en: 'Lives alone · Wong Tai Sin', lives_zh: '獨居 · 黃大仙', phone: '+852 5100 0004' },
  { id: 'ho',     name_en: 'Ho Yuen-wah',     name_zh: '何婉華', age: 71, sex: 'F',
    dx_en: 'Post-op + recurrent UTI',   dx_zh: '術後 · 反覆尿道炎',
    discharge_date: daysAgo(21), risk_tier: 'stable',
    risk_note_en: 'Stable, near graduation. Reinforce hydration.',
    risk_note_zh: '穩定，接近結案，加強飲水。',
    lives_en: 'Lives with spouse · Tai Po', lives_zh: '與配偶同住 · 大埔', phone: '+852 5100 0005' },
]

console.log('Upserting elders…')
await upsert('elders', eldersData.map(e => ({ ...e, assigned_worker_id: workerId })), 'id')

// ─── 3. Family accounts (one per elder) ────────────────────────────────────

const familyData = [
  { elderId: 'wong',   email: 'family-wong@carebridge.hk',   nameEn: 'Wong Ka-yan',     nameZh: '黃嘉欣',   rel: 'daughter', phone: '+852 9123 4567' },
  { elderId: 'chan',   email: 'family-chan@carebridge.hk',    nameEn: 'Chan Wai-man',    nameZh: '陳偉文',   rel: 'son',      phone: '+852 9876 5432' },
  { elderId: 'lee',    email: 'family-lee@carebridge.hk',     nameEn: 'Lee Chun-hei',   nameZh: '李俊熙',   rel: 'son',      phone: '+852 9555 1212' },
  { elderId: 'cheung', email: 'family-cheung@carebridge.hk',  nameEn: 'Cheung Mei',     nameZh: '張薇',     rel: 'daughter', phone: '+852 9333 8080' },
  { elderId: 'ho',     email: 'family-ho@carebridge.hk',      nameEn: 'Ho Lai-fong',    nameZh: '何麗芳',   rel: 'daughter', phone: '+852 9444 2323' },
]

console.log('Creating family accounts…')
for (const f of familyData) {
  const user = await createUser(f.email, 'hackathon123', 'family', f.nameEn, f.nameZh)
  await upsert('profiles', { id: user.id, role: 'family', name_en: f.nameEn, name_zh: f.nameZh }, 'id')
  await upsert('family_members', {
    elder_id: f.elderId, profile_id: user.id,
    name_en: f.nameEn, name_zh: f.nameZh,
    relationship_en: f.rel, phone: f.phone
  }, 'elder_id,profile_id')
}

// ─── 4. Activity records (7 days × 6 activities per elder) ─────────────────

const ACTS = ['med','meal','walk','water','sleep','mood']

// week grid: rows = activities, cols = Mon-Sun (last = today)
const weekGrids: Record<string, number[][]> = {
  wong:   [[1,1,1,1,1,1,1],[1,1,1,1,1,1,1],[1,1,0,1,1,1,0],[1,1,1,0,1,1,1],[1,0,1,1,0,1,1],[1,1,1,1,1,0,0]],
  chan:   [[1,1,1,0,1,0,0],[1,1,1,1,0,1,0],[1,0,0,1,0,0,0],[1,1,0,1,0,0,0],[1,1,0,0,1,0,0],[1,1,1,0,0,0,0]],
  lee:    [[1,1,1,1,1,1,1],[1,1,1,1,1,1,1],[1,1,1,1,1,1,1],[1,1,1,1,1,1,1],[1,1,1,1,0,1,1],[1,1,1,1,1,1,1]],
  cheung: [[1,0,1,1,0,1,0],[1,1,1,1,1,1,1],[1,1,1,0,1,1,1],[1,1,1,1,1,1,1],[1,1,1,1,1,0,1],[1,1,1,1,1,1,1]],
  ho:     [[1,1,1,1,1,1,1],[1,1,1,1,1,1,1],[1,1,1,1,1,1,1],[1,1,1,1,1,1,1],[1,1,1,1,1,1,1],[1,1,1,1,1,1,1]],
}

console.log('Seeding activity records…')
const actRows: object[] = []
for (const [elderId, grid] of Object.entries(weekGrids)) {
  for (let col = 0; col < 7; col++) {
    const d = new Date(today); d.setDate(d.getDate() - (6 - col))
    const dateStr = d.toISOString().split('T')[0]
    for (let row = 0; row < 6; row++) {
      const v = grid[row][col]
      actRows.push({
        elder_id: elderId, record_date: dateStr,
        activity_key: ACTS[row],
        status: v === 1 ? 'done' : 'missed',
        source: 'call'
      })
    }
  }
}
await upsert('activity_records', actRows, 'elder_id,record_date,activity_key')

// ─── 5. Flags ──────────────────────────────────────────────────────────────

console.log('Seeding flags…')
await upsert('flags', [
  { elder_id: 'chan',   kind: 'missed-call',  severity: 'risk',  label_en: 'Missed daily call — 2 attempts, no answer', label_zh: '未接每日電話 — 已試兩次無人接聽', source: 'call',  resolved: false },
  { elder_id: 'chan',   kind: 'weight-gain',  severity: 'risk',  label_en: 'Weight up 1.8 kg in 3 days — possible fluid overload', label_zh: '3 日內體重升 1.8 公斤，疑似積水', source: 'call',  resolved: false },
  { elder_id: 'wong',  kind: 'dizziness',    severity: 'watch', label_en: 'Reported mild dizziness when standing', label_zh: '起身時感輕微頭暈', source: 'call', resolved: false },
  { elder_id: 'cheung', kind: 'missed-meds', severity: 'watch', label_en: 'Missed morning medication — 3rd time this week', label_zh: '漏服早上藥物 — 本週第 3 次', source: 'call', resolved: false },
])

// ─── 6. Vitals ─────────────────────────────────────────────────────────────

console.log('Seeding vitals…')
await upsert('vitals', [
  { elder_id: 'wong',   vital_key: 'SpO₂',   value: '94%',       trend: null,      status: 'watch' },
  { elder_id: 'wong',   vital_key: 'Temp',   value: '37.1°C',    trend: null,      status: 'ok' },
  { elder_id: 'wong',   vital_key: 'HR',     value: '82 bpm',    trend: null,      status: 'ok' },
  { elder_id: 'chan',   vital_key: 'Weight', value: '+1.8 kg ↑', trend: 'up',      status: 'risk' },
  { elder_id: 'chan',   vital_key: 'BP',     value: '152/94',    trend: null,      status: 'watch' },
  { elder_id: 'chan',   vital_key: 'HR',     value: '98 bpm',    trend: null,      status: 'watch' },
  { elder_id: 'lee',    vital_key: 'Pain',   value: '2 / 10',    trend: null,      status: 'ok' },
  { elder_id: 'lee',    vital_key: 'Steps',  value: '1,240',     trend: null,      status: 'ok' },
  { elder_id: 'lee',    vital_key: 'BP',     value: '128/80',    trend: null,      status: 'ok' },
  { elder_id: 'cheung', vital_key: 'Glucose', value: '9.8 mmol', trend: null,      status: 'watch' },
  { elder_id: 'cheung', vital_key: 'BP',     value: '138/86',    trend: null,      status: 'ok' },
  { elder_id: 'cheung', vital_key: 'Adher.', value: '71%',       trend: null,      status: 'watch' },
  { elder_id: 'ho',    vital_key: 'Temp',   value: '36.6°C',    trend: null,      status: 'ok' },
  { elder_id: 'ho',    vital_key: 'Fluid',  value: '1.8 L',     trend: null,      status: 'ok' },
  { elder_id: 'ho',    vital_key: 'BP',     value: '122/78',    trend: null,      status: 'ok' },
])

// ─── 7. Visits (today's schedule) ──────────────────────────────────────────

console.log('Seeding visits…')
const todayStr = today.toISOString().split('T')[0]
await upsert('visits', [
  { elder_id: 'chan',   worker_id: workerId, scheduled_at: `${todayStr}T11:00:00+08:00`, type_en: 'Urgent home visit', type_zh: '緊急家訪', location: 'Kwun Tong',      state: 'due' },
  { elder_id: 'wong',  worker_id: workerId, scheduled_at: `${todayStr}T14:30:00+08:00`, type_en: 'Routine check-in',  type_zh: '例行家訪', location: 'Sham Shui Po',   state: 'upcoming' },
  { elder_id: 'cheung', worker_id: workerId, scheduled_at: `${todayStr}T16:00:00+08:00`, type_en: 'Pillbox setup',    type_zh: '藥盒安排', location: 'Wong Tai Sin',   state: 'upcoming' },
])

// ─── 8. Care plan items ─────────────────────────────────────────────────────

console.log('Seeding care plan items…')
await upsert('care_plan_items', [
  { elder_id: 'wong',   text_en: 'Daily inhaler — 2 puffs morning & night', done: true },
  { elder_id: 'wong',   text_en: 'Pulmonary rehab breathing exercise ×3/day', done: false },
  { elder_id: 'wong',   text_en: 'Follow-up chest clinic — 18 Jun', done: false },
  { elder_id: 'chan',   text_en: 'Daily weight — same time, before breakfast', done: false },
  { elder_id: 'chan',   text_en: 'Diuretic (furosemide) — morning', done: false },
  { elder_id: 'chan',   text_en: 'Low-salt diet — under 2g/day', done: true },
  { elder_id: 'chan',   text_en: 'Cardiology follow-up — 12 Jun', done: false },
  { elder_id: 'lee',    text_en: 'Physiotherapy walk ×2/day with frame', done: true },
  { elder_id: 'lee',    text_en: 'Calcium + vitamin D — daily', done: true },
  { elder_id: 'lee',    text_en: 'Ortho follow-up — 25 Jun', done: false },
  { elder_id: 'cheung', text_en: 'Metformin — twice daily with meals', done: false },
  { elder_id: 'cheung', text_en: 'Blood glucose check — morning', done: true },
  { elder_id: 'cheung', text_en: 'Speech therapy ×2/week', done: true },
  { elder_id: 'cheung', text_en: 'Neuro follow-up — 20 Jun', done: false },
  { elder_id: 'ho',    text_en: 'Hydration — 1.5L+ per day', done: true },
  { elder_id: 'ho',    text_en: 'Complete antibiotic course', done: true },
  { elder_id: 'ho',    text_en: 'Discharge from programme — 28 Jun', done: false },
])

// ─── 9. Daily call records ──────────────────────────────────────────────────

console.log('Seeding daily calls…')
await upsert('daily_calls', [
  { elder_id: 'wong',   state: 'done',     completed_at: `${todayStr}T09:32:00+08:00`,
    summary_en: 'Took inhaler and ate congee. Felt dizzy when standing up. Otherwise okay.',
    summary_zh: '已用吸入器，食咗粥。起身時感頭暈，其他情況正常。' },
  { elder_id: 'chan',   state: 'missed',   completed_at: null,
    summary_en: 'Daily call not answered — 2 attempts made.',
    summary_zh: '每日電話無人接聽 — 已試兩次。' },
  { elder_id: 'lee',    state: 'done',     completed_at: `${todayStr}T09:05:00+08:00`,
    summary_en: 'Walked to the lift lobby and back twice. Sleeping well. In good spirits.',
    summary_zh: '行到電梯大堂來回兩次，睡得好，心情不錯。' },
  { elder_id: 'cheung', state: 'done',    completed_at: `${todayStr}T09:48:00+08:00`,
    summary_en: 'Forgot morning pills again. Reminded. Daughter to set up pillbox.',
    summary_zh: '再次漏食早上藥，已提醒，女兒將安排藥盒。' },
  { elder_id: 'ho',    state: 'done',     completed_at: `${todayStr}T10:15:00+08:00`,
    summary_en: 'Feeling great, no symptoms. On track to graduate next week.',
    summary_zh: '狀態極好，無症狀，下週可結案。' },
])

console.log('\n✅ Seed complete!')
console.log('Demo logins (password: hackathon123):')
console.log('  Worker : karen@carebridge.hk')
console.log('  Family : family-wong@carebridge.hk  (sees Wong Mei-ling)')
console.log('           family-chan@carebridge.hk   (sees Chan Kwok-keung)')
console.log('           family-lee@carebridge.hk    (sees Lee Sau-ying)')
console.log('           family-cheung@carebridge.hk (sees Cheung Chi-ming)')
console.log('           family-ho@carebridge.hk     (sees Ho Yuen-wah)')
