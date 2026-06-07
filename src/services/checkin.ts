import { assertDb } from './supabase';

// The six daily activities tracked by the call (mirror of the schema's activity_key enum).
export type ActivityKey = 'med' | 'meal' | 'walk' | 'water' | 'sleep' | 'mood';
export type ActivityStatus = 'done' | 'missed' | 'unknown';

export interface CheckInFlag {
  severity: 'watch' | 'risk';
  label_en: string;
  label_zh?: string;
}

export interface CheckInPayload {
  activities: Record<ActivityKey, ActivityStatus>;
  flags: CheckInFlag[];
  summary_en: string;
  summary_zh?: string;
  /** Real acoustic metrics measured during the call (see services/metrics.ts). */
  voiceMetrics?: { pauseRatio?: number; speechMs?: number };
}

export interface CheckInResult {
  ok: boolean;
  callId?: string;
  activitiesWritten: number;
  flagsWritten: number;
  newRiskTier: string;
}

/**
 * Persist the outcome of a daily check-in call for one elder. This is the bridge that was
 * missing: it writes the structured data the dashboard already reads.
 *
 *   1. daily_calls   — one 'done' row with the bilingual summary
 *   2. activity_records — one row per known activity (done/missed), source 'call'
 *   3. flags         — one row per health concern raised on the call
 *   4. elders.risk_tier — recomputed from open flags (mirrors the visit save path)
 *
 * Used by both the live voice agent's `logDailyCheckIn` tool and the /simulate-call route.
 */
export async function recordCheckIn(elderId: string, payload: CheckInPayload): Promise<CheckInResult> {
  const sb = assertDb();
  const now = new Date();
  const nowIso = now.toISOString();
  const today = nowIso.split('T')[0];

  // 1. daily_calls — the call itself
  const { data: callRow, error: callErr } = await sb
    .from('daily_calls')
    .insert({
      elder_id: elderId,
      state: 'done',
      channel: 'voice-agent',
      scheduled_at: nowIso,
      completed_at: nowIso,
      summary_en: payload.summary_en,
      summary_zh: payload.summary_zh ?? payload.summary_en,
    })
    .select('id')
    .single();
  if (callErr) throw new Error(`daily_calls insert: ${callErr.message}`);
  const callId = callRow?.id as string | undefined;

  // 1b. Best-effort: attach real voice metrics if those columns exist
  //     (run backend/supabase/add_voice_metrics.sql). Silently ignored otherwise so the
  //     core loop never fails just because the optional migration hasn't been applied.
  if (callId && payload.voiceMetrics && (payload.voiceMetrics.pauseRatio != null || payload.voiceMetrics.speechMs != null)) {
    const { error: metricErr } = await sb
      .from('daily_calls')
      .update({ pause_ratio: payload.voiceMetrics.pauseRatio, speech_ms: payload.voiceMetrics.speechMs })
      .eq('id', callId);
    if (metricErr) {
      console.warn(`[CheckIn] Voice metrics not persisted (run add_voice_metrics.sql to enable): ${metricErr.message}`);
    }
  }

  // 2. activity_records — skip 'unknown' (the elder didn't say / wasn't asked)
  const actRows = (Object.entries(payload.activities) as [ActivityKey, ActivityStatus][])
    .filter(([, status]) => status === 'done' || status === 'missed')
    .map(([activity_key, status]) => ({
      elder_id: elderId,
      record_date: today,
      activity_key,
      status,
      source: 'call',
    }));
  if (actRows.length) {
    const { error: actErr } = await sb
      .from('activity_records')
      .upsert(actRows, { onConflict: 'elder_id,record_date,activity_key' });
    if (actErr) throw new Error(`activity_records upsert: ${actErr.message}`);
  }

  // 3. flags — new health concerns raised by the call
  const flagRows = (payload.flags || []).map((f) => ({
    elder_id: elderId,
    kind: 'call',
    severity: f.severity,
    label_en: f.label_en,
    label_zh: f.label_zh ?? f.label_en,
    source: 'call',
    resolved: false,
  }));
  if (flagRows.length) {
    const { error: flagErr } = await sb.from('flags').insert(flagRows);
    if (flagErr) throw new Error(`flags insert: ${flagErr.message}`);
  }

  // 4. recompute risk tier from open flags (same rule as the visit save path)
  const { data: openFlags } = await sb
    .from('flags')
    .select('severity')
    .eq('elder_id', elderId)
    .eq('resolved', false);
  let newRiskTier = 'stable';
  if (openFlags?.some((f: any) => f.severity === 'risk')) newRiskTier = 'risk';
  else if (openFlags?.some((f: any) => f.severity === 'watch')) newRiskTier = 'watch';
  await sb.from('elders').update({ risk_tier: newRiskTier }).eq('id', elderId);

  console.log(`[CheckIn] elder=${elderId} call=${callId} activities=${actRows.length} flags=${flagRows.length} → risk=${newRiskTier}`);

  return {
    ok: true,
    callId,
    activitiesWritten: actRows.length,
    flagsWritten: flagRows.length,
    newRiskTier,
  };
}

/**
 * Record a missed daily call after 2 unanswered attempts.
 * Writes a no-answer daily_calls row, inserts a flag, and recomputes risk tier.
 */
export async function recordMissedCall(elderId: string): Promise<CheckInResult> {
  const sb = assertDb();
  const nowIso = new Date().toISOString();

  const { data: callRow, error: callErr } = await sb
    .from('daily_calls')
    .insert({
      elder_id: elderId,
      state: 'no-answer',
      channel: 'voice-agent',
      scheduled_at: nowIso,
      completed_at: nowIso,
      summary_en: 'Missed daily call — 2 attempts, no answer',
      summary_zh: '未接每日電話 — 已試兩次無人接聽',
    })
    .select('id')
    .single();
  if (callErr) throw new Error(`daily_calls insert: ${callErr.message}`);
  const callId = callRow?.id as string | undefined;

  // Severity mirrors current risk tier: already-at-risk elders escalate immediately.
  const { data: elder } = await sb.from('elders').select('risk_tier').eq('id', elderId).single();
  const severity: 'risk' | 'watch' = elder?.risk_tier === 'risk' ? 'risk' : 'watch';

  const { error: flagErr } = await sb.from('flags').insert({
    elder_id: elderId,
    kind: 'call',
    severity,
    label_en: 'Missed daily call — 2 attempts, no answer',
    label_zh: '未接每日電話 — 已試兩次無人接聽',
    source: 'call',
    resolved: false,
  });
  if (flagErr) throw new Error(`flags insert: ${flagErr.message}`);

  const { data: openFlags } = await sb
    .from('flags')
    .select('severity')
    .eq('elder_id', elderId)
    .eq('resolved', false);
  let newRiskTier = 'stable';
  if (openFlags?.some((f: any) => f.severity === 'risk')) newRiskTier = 'risk';
  else if (openFlags?.some((f: any) => f.severity === 'watch')) newRiskTier = 'watch';
  await sb.from('elders').update({ risk_tier: newRiskTier }).eq('id', elderId);

  console.log(`[MissedCall] elder=${elderId} call=${callId} severity=${severity} → risk=${newRiskTier}`);
  return { ok: true, callId, activitiesWritten: 0, flagsWritten: 1, newRiskTier };
}

/** Resolve which elder a phone number belongs to (for inbound / routed calls). */
export async function findElderByPhone(phone: string): Promise<string | null> {
  const sb = assertDb();
  const { data } = await sb.from('elders').select('id').eq('phone', phone).maybeSingle();
  return (data?.id as string) ?? null;
}
