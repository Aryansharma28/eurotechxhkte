/**
 * Standalone proof of the call → Supabase loop — no Twilio, no Gemini required.
 * Needs only SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in your .env.
 *
 *   npm run test:checkin                 # logs against DEMO_ELDER_ID (or 'wong')
 *   DEMO_ELDER_ID=chan npm run test:checkin
 *
 * Then refresh the social-worker dashboard: a new daily call, today's activities, a flag,
 * and a recomputed risk tier should appear for that elder. This is the whole product loop
 * the voice agent drives, exercised directly so you can verify it without a phone call.
 */
import * as dotenv from 'dotenv';
import { recordCheckIn } from './services/checkin';

dotenv.config();

const elderId = process.env.DEMO_ELDER_ID || 'wong';

recordCheckIn(elderId, {
  activities: { med: 'done', meal: 'done', walk: 'missed', water: 'done', sleep: 'missed', mood: 'done' },
  flags: [
    { severity: 'watch', label_en: 'Reported feeling dizzy when standing up this morning', label_zh: '今早起身時感到頭暈' },
  ],
  summary_en: 'Took medication and ate breakfast. Slept poorly and felt dizzy when standing. Otherwise in good spirits.',
  summary_zh: '已服藥及食早餐。昨晚睡得不好，起身時感頭暈，其餘狀態不錯。',
  voiceMetrics: { pauseRatio: 0.22, speechMs: 48000 },
})
  .then((r) => {
    console.log('✅ Check-in written to Supabase:', r);
    process.exit(0);
  })
  .catch((e) => {
    console.error('❌ Check-in failed:', e.message);
    process.exit(1);
  });
