/**
 * Real-time voice metrics for the daily call.
 *
 * The previous version of this file returned `chunk.length` (a byte count) and wrote it to
 * a JSON file — it measured nothing about the voice. This version computes a genuine
 * acoustic signal: it decodes Twilio's 8 kHz μ-law audio to PCM, measures per-chunk energy
 * (RMS), and classifies each chunk as speech or silence to accumulate a **pause ratio**
 * (silence time / total time) over the call. That's a real, explainable biomarker proxy —
 * no ML, no fabrication. Speech-rate / pitch / tremor would need transcript + pitch
 * tracking; those remain future work (and the dashboard charts are labelled illustrative
 * until they're wired to numbers like these).
 */

// μ-law → 16-bit PCM decode table (same algorithm as the transcoder in server.ts)
const BIAS = 132;
const MULAW_TO_PCM = new Int16Array(256);
for (let i = 0; i < 256; i++) {
  const u = ~i;
  const sign = u & 0x80;
  const exponent = (u & 0x70) >> 4;
  const mantissa = u & 0x0f;
  let sample = (mantissa << 3) + BIAS;
  sample <<= exponent;
  sample -= BIAS;
  MULAW_TO_PCM[i] = sign ? -sample : sample;
}

// Twilio media is 8 kHz mono μ-law: 1 byte = 1 sample, so 8 samples = 1 ms.
const SAMPLES_PER_MS = 8;
// RMS threshold (on 16-bit PCM, range ±32768) below which a chunk is treated as silence.
// ~500 sits comfortably above line noise but below speech; tune per telephony conditions.
const SILENCE_RMS_THRESHOLD = 500;

interface CallMetricsState {
  speechMs: number;
  silenceMs: number;
  chunks: number;
}

let state: CallMetricsState = { speechMs: 0, silenceMs: 0, chunks: 0 };

export function resetCallMetrics(): void {
  state = { speechMs: 0, silenceMs: 0, chunks: 0 };
}

/** Root-mean-square amplitude of a μ-law chunk, in 16-bit PCM units. */
function rmsOfMuLawChunk(chunk: Buffer): number {
  if (chunk.length === 0) return 0;
  let sumSquares = 0;
  for (let i = 0; i < chunk.length; i++) {
    const sample = MULAW_TO_PCM[chunk[i]];
    sumSquares += sample * sample;
  }
  return Math.sqrt(sumSquares / chunk.length);
}

/**
 * Process one incoming μ-law audio chunk from Twilio and fold it into the running metrics.
 * Synchronous and allocation-light — safe to call on every media frame.
 */
export function processIncomingAudio(chunk: Buffer): void {
  if (!chunk || chunk.length === 0) return;
  const rms = rmsOfMuLawChunk(chunk);
  const durationMs = chunk.length / SAMPLES_PER_MS;
  if (rms > SILENCE_RMS_THRESHOLD) {
    state.speechMs += durationMs;
  } else {
    state.silenceMs += durationMs;
  }
  state.chunks += 1;
}

export interface CallMetrics {
  pauseRatio: number; // silence / total, 0..1
  speechMs: number;
  silenceMs: number;
  totalMs: number;
}

/** Snapshot the metrics accumulated for the current call. */
export function getCallMetrics(): CallMetrics {
  const totalMs = state.speechMs + state.silenceMs;
  const pauseRatio = totalMs > 0 ? +(state.silenceMs / totalMs).toFixed(3) : 0;
  return {
    pauseRatio,
    speechMs: Math.round(state.speechMs),
    silenceMs: Math.round(state.silenceMs),
    totalMs: Math.round(totalMs),
  };
}
