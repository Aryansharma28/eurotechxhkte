/**
 * Tracks the elder associated with the *currently active* phone call.
 *
 * This server handles one Twilio media stream at a time (the hackathon demo flow), so a
 * single module-level session is sufficient: the HTTP layer sets which elder is being
 * called, and the agent's `logDailyCheckIn` tool reads it back when it writes results.
 * For concurrent calls this would become a per-stream map keyed by streamSid.
 */
export interface PatientContext {
  id: string;
  name_en: string;
  name_zh: string;
  age: number;
  sex: string;
  dx_en: string;
  dx_zh: string;
  lives_en?: string;
  lives_zh?: string;
  risk_tier: string;
  risk_note_en?: string;
  risk_note_zh?: string;
}

export interface CallSession {
  elderId: string | null;
  startedAt: number | null;
  logged: boolean; // true once a structured check-in has been written for this call
  patient: PatientContext | null; // populated from Supabase before the voice connects
}

export const callSession: CallSession = {
  elderId: null,
  startedAt: null,
  logged: false,
  patient: null,
};

export function startCallSession(elderId: string | null): void {
  callSession.elderId = elderId;
  callSession.startedAt = Date.now();
  callSession.logged = false;
  callSession.patient = null;
  console.log(`[CallSession] Started for elder: ${elderId ?? '(unknown)'}`);
}

export function endCallSession(): void {
  callSession.elderId = null;
  callSession.startedAt = null;
  callSession.logged = false;
  callSession.patient = null;
}
