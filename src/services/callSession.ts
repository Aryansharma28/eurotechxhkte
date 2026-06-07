/**
 * Tracks the elder associated with the *currently active* phone call.
 *
 * This server handles one Twilio media stream at a time (the hackathon demo flow), so a
 * single module-level session is sufficient: the HTTP layer sets which elder is being
 * called, and the agent's `logDailyCheckIn` tool reads it back when it writes results.
 * For concurrent calls this would become a per-stream map keyed by streamSid.
 */
export interface CallSession {
  elderId: string | null;
  startedAt: number | null;
  logged: boolean; // true once a structured check-in has been written for this call
}

export const callSession: CallSession = {
  elderId: null,
  startedAt: null,
  logged: false,
};

export function startCallSession(elderId: string | null): void {
  callSession.elderId = elderId;
  callSession.startedAt = Date.now();
  callSession.logged = false;
  console.log(`[CallSession] Started for elder: ${elderId ?? '(unknown)'}`);
}

export function endCallSession(): void {
  callSession.elderId = null;
  callSession.startedAt = null;
  callSession.logged = false;
}
