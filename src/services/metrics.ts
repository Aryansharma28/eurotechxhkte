import * as fs from 'fs/promises';
import * as path from 'path';

const METRICS_FILE_PATH = path.join(__dirname, '../../metrics.json');

interface VocalMetrics {
  timestamp: string;
  durationSeconds: number;
  rms: number; // Volume / Loudness
  averagePitch: number; // F0 (Hz)
  pitchStdDev: number; // Monopitch indicator
  jitter: number; // Frequency instability
  shimmer: number; // Amplitude instability
  hnr: number; // Harmonics-to-noise ratio (hoarseness indicator)
  parkinsonSignal: number; // Parkinson's Likelihood Score (0% to 100%)
}

/** Final per-conversation result stored to metrics.json */
interface ConversationResult {
  callTimestamp: string;       // When the call started
  callEndTimestamp: string;    // When the call ended
  totalDurationSeconds: number;
  turnCount: number;           // Number of valid voiced turns analyzed
  avgJitter: number;
  avgShimmer: number;
  avgHnr: number;
  avgPitchStdDev: number;
  avgRms: number;
  parkinsonSignal: number;     // Single aggregated score (0–100%)
}

/**
 * Parses a 16-bit signed PCM buffer into an array of floats normalized between -1.0 and 1.0.
 */
function pcmBufferToFloats(buffer: Buffer): Float32Array {
  const numSamples = Math.floor(buffer.length / 2);
  const floats = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const intSample = buffer.readInt16LE(i * 2);
    floats[i] = intSample / 32768.0;
  }
  return floats;
}

/**
 * Calculates a combined Parkinson's voice signal score (0% to 100%)
 * based on clinical acoustic thresholds for hypokinetic dysarthria.
 */
export function calculateParkinsonSignal(
  jitter: number,
  shimmer: number,
  hnr: number,
  pitchStdDev: number,
  rms: number
): number {
  // Guard: if there's no voiced speech detected or signal is near-silence, signal probability is 0
  if (rms < 0.005 || (jitter === 0 && shimmer === 0 && hnr === 0)) {
    return 0;
  }

  let severityScore = 0;
  let totalChecks = 0;

  // NOTE: Thresholds are calibrated for phone-quality audio (8kHz mu-law -> 16kHz PCM).
  // Phone transcoding introduces significant noise, so raw values are always worse than
  // studio recordings. Thresholds are loosened proportionally to avoid false positives.

  // 1. Jitter check (frequency perturbation)
  // Studio: Healthy < 1.04% | Parkinson's > 1.5%
  // Phone-adjusted: Healthy < 6% (0.06) | Parkinson's > 15% (0.15)
  if (jitter > 0) {
    totalChecks++;
    if (jitter > 0.15) {
      severityScore += 1.0;
    } else if (jitter > 0.06) {
      severityScore += 0.5;
    }
  }

  // 2. Shimmer check (amplitude perturbation)
  // Studio: Healthy < 3.8% | Parkinson's > 5%
  // Phone-adjusted: Healthy < 20% (0.20) | Parkinson's > 35% (0.35)
  if (shimmer > 0) {
    totalChecks++;
    if (shimmer > 0.35) {
      severityScore += 1.0;
    } else if (shimmer > 0.20) {
      severityScore += 0.5;
    }
  }

  // 3. HNR is EXCLUDED from phone-audio scoring.
  // G.711 mu-law (8kHz) codec quantization noise completely dominates autocorrelation-based
  // HNR estimation, making all callers appear dysphonic regardless of actual voice quality.
  // HNR is still measured and stored for reference, but not used in the score.

  // 4. Pitch Standard Deviation check (monopitch)
  // Studio: Healthy > 15 Hz | Parkinson's < 10 Hz
  // These values are codec-independent so thresholds remain the same
  if (pitchStdDev > 0) {
    totalChecks++;
    if (pitchStdDev < 10) {
      severityScore += 1.0;
    } else if (pitchStdDev < 20) {
      severityScore += 0.5;
    }
  }

  // 5. RMS check (hypophonia / loudness)
  // Studio: Healthy > 0.04 | Parkinson's < 0.015
  // Phone-adjusted: Healthy > 0.04 | Parkinson's < 0.015 (same — loudness is codec-independent)
  if (rms > 0) {
    totalChecks++;
    if (rms < 0.015) {
      severityScore += 1.0;
    } else if (rms < 0.03) {
      severityScore += 0.5;
    }
  }

  if (totalChecks === 0) return 0;

  // Calculate percentage: (severityScore / totalChecks) * 100
  const scorePercentage = (severityScore / totalChecks) * 100;
  return Math.round(scorePercentage);
}

/**
 * Calculates vocal metrics from a speech turn buffer (16kHz 16-bit linear PCM).
 * Uses autocorrelation for pitch detection and period analysis.
 */
export function analyzeSpeechVoice(buffer: Buffer): VocalMetrics {
  const sampleRate = 16000;
  const samples = pcmBufferToFloats(buffer);
  const durationSeconds = samples.length / sampleRate;

  // 1. Calculate overall RMS (Loudness)
  let sumSquares = 0;
  for (let i = 0; i < samples.length; i++) {
    sumSquares += samples[i] * samples[i];
  }
  const rms = Math.sqrt(sumSquares / samples.length);

  // 2. Framed analysis for Pitch, Jitter, Shimmer, and HNR
  // Frame size: 480 samples (30ms at 16kHz)
  // Hop size: 240 samples (15ms)
  const frameSize = 480;
  const hopSize = 240;
  const minLag = Math.floor(sampleRate / 400); // 400Hz max pitch (40 samples)
  const maxLag = Math.floor(sampleRate / 50);  // 50Hz min pitch (320 samples)

  const pitches: number[] = [];
  const periods: number[] = [];
  const peakAmplitudes: number[] = [];
  const hnrs: number[] = [];

  for (let offset = 0; offset + frameSize < samples.length; offset += hopSize) {
    const frame = samples.subarray(offset, offset + frameSize);

    // Calculate autocorrelation
    let maxCorrelation = -1;
    let pitchLag = -1;
    let zeroLagAutocorr = 0;

    for (let j = 0; j < frameSize; j++) {
      zeroLagAutocorr += frame[j] * frame[j];
    }

    if (zeroLagAutocorr < 0.001) continue; // Skip silent frames

    // Search for fundamental period in lag range
    for (let lag = minLag; lag <= maxLag; lag++) {
      let r = 0;
      for (let j = 0; j < frameSize - lag; j++) {
        r += frame[j] * frame[j + lag];
      }
      
      const normalizedR = r / zeroLagAutocorr;
      if (normalizedR > maxCorrelation) {
        maxCorrelation = normalizedR;
        pitchLag = lag;
      }
    }

    // Voice Activity Detection (Voicing threshold)
    if (maxCorrelation > 0.35 && pitchLag !== -1) {
      const pitch = sampleRate / pitchLag;
      pitches.push(pitch);
      periods.push(pitchLag);

      // Find peak amplitude in this voiced frame
      let peakAmp = 0;
      for (let j = 0; j < frameSize; j++) {
        const absVal = Math.abs(frame[j]);
        if (absVal > peakAmp) peakAmp = absVal;
      }
      peakAmplitudes.push(peakAmp);

      // Calculate HNR: ratio of periodic to noise energy
      const periodicEnergy = zeroLagAutocorr * maxCorrelation;
      const noiseEnergy = Math.max(0.0001, zeroLagAutocorr - periodicEnergy);
      const hnrDb = 10 * Math.log10(periodicEnergy / noiseEnergy);
      hnrs.push(hnrDb);
    }
  }

  // 3. Summarize metrics across voiced frames
  let averagePitch = 0;
  let pitchStdDev = 0;
  let jitter = 0;
  let shimmer = 0;
  let averageHnr = 0;

  if (pitches.length > 0) {
    // Average Pitch
    const pitchSum = pitches.reduce((sum, p) => sum + p, 0);
    averagePitch = pitchSum / pitches.length;

    // Pitch Standard Deviation (Monopitch indicator)
    const variance = pitches.reduce((sum, p) => sum + Math.pow(p - averagePitch, 2), 0) / pitches.length;
    pitchStdDev = Math.sqrt(variance);

    // HNR average
    averageHnr = hnrs.reduce((sum, h) => sum + h, 0) / hnrs.length;

    // Jitter (relative average perturbation in period duration)
    let jitterSum = 0;
    let jitterCount = 0;
    for (let i = 1; i < periods.length; i++) {
      jitterSum += Math.abs(periods[i] - periods[i - 1]);
      jitterCount++;
    }
    // Normalized by average period
    const avgPeriod = periods.reduce((sum, p) => sum + p, 0) / periods.length;
    jitter = jitterCount > 0 ? (jitterSum / jitterCount) / avgPeriod : 0;

    // Shimmer (relative average perturbation in peak amplitude)
    let shimmerSum = 0;
    let shimmerCount = 0;
    for (let i = 1; i < peakAmplitudes.length; i++) {
      shimmerSum += Math.abs(peakAmplitudes[i] - peakAmplitudes[i - 1]);
      shimmerCount++;
    }
    const avgAmplitude = peakAmplitudes.reduce((sum, a) => sum + a, 0) / peakAmplitudes.length;
    shimmer = (shimmerCount > 0 && avgAmplitude > 0.001) ? (shimmerSum / shimmerCount) / avgAmplitude : 0;
  }

  // 4. Calculate Combined Parkinson's Likelihood Signal
  const parkinsonSignal = calculateParkinsonSignal(
    jitter,
    shimmer,
    averageHnr,
    pitchStdDev,
    rms
  );

  return {
    timestamp: new Date().toISOString(),
    durationSeconds: parseFloat(durationSeconds.toFixed(2)),
    rms: parseFloat(rms.toFixed(5)),
    averagePitch: parseFloat(averagePitch.toFixed(1)),
    pitchStdDev: parseFloat(pitchStdDev.toFixed(2)),
    jitter: parseFloat(jitter.toFixed(5)),
    shimmer: parseFloat(shimmer.toFixed(5)),
    hnr: parseFloat(averageHnr.toFixed(2)),
    parkinsonSignal,
  };
}

/**
 * Aggregates all per-turn VocalMetrics from a conversation into a single ConversationResult.
 * Uses duration-weighted averages of raw biomarkers, then scores once.
 * This is more accurate than averaging per-turn Parkinson scores.
 *
 * @param turns All valid voiced turns collected during the call.
 * @param callTimestamp ISO timestamp of when the call started.
 */
export function aggregateConversationMetrics(
  turns: VocalMetrics[],
  callTimestamp: string
): ConversationResult | null {
  // Filter to only valid voiced turns
  const validTurns = turns.filter(t => t.averagePitch > 0 && t.durationSeconds >= 0.5);

  if (validTurns.length === 0) {
    console.log('[Metrics] No valid voiced turns to aggregate.');
    return null;
  }

  const totalDuration = validTurns.reduce((sum, t) => sum + t.durationSeconds, 0);

  // Duration-weighted average of each raw biomarker
  const wavg = (field: keyof VocalMetrics) =>
    validTurns.reduce((sum, t) => sum + (t[field] as number) * t.durationSeconds, 0) / totalDuration;

  const avgJitter = wavg('jitter');
  const avgShimmer = wavg('shimmer');
  const avgHnr = wavg('hnr');
  const avgPitchStdDev = wavg('pitchStdDev');
  const avgRms = wavg('rms');

  // Score ONCE on the aggregated values
  const parkinsonSignal = calculateParkinsonSignal(avgJitter, avgShimmer, avgHnr, avgPitchStdDev, avgRms);

  return {
    callTimestamp,
    callEndTimestamp: new Date().toISOString(),
    totalDurationSeconds: parseFloat(totalDuration.toFixed(2)),
    turnCount: validTurns.length,
    avgJitter: parseFloat(avgJitter.toFixed(5)),
    avgShimmer: parseFloat(avgShimmer.toFixed(5)),
    avgHnr: parseFloat(avgHnr.toFixed(2)),
    avgPitchStdDev: parseFloat(avgPitchStdDev.toFixed(2)),
    avgRms: parseFloat(avgRms.toFixed(5)),
    parkinsonSignal,
  };
}

/**
 * Saves a final ConversationResult to the metrics.json file.
 */
export async function saveConversationResult(result: ConversationResult): Promise<void> {
  try {
    let currentData: any[] = [];
    try {
      const fileContent = await fs.readFile(METRICS_FILE_PATH, 'utf-8');
      currentData = JSON.parse(fileContent);
      if (!Array.isArray(currentData)) {
        currentData = [];
      }
    } catch (readError: any) {
      if (readError.code !== 'ENOENT') {
        console.error('[Metrics] Error reading metrics file:', readError);
      }
    }

    currentData.push(result);
    await fs.writeFile(METRICS_FILE_PATH, JSON.stringify(currentData, null, 2), 'utf-8');
    console.log(
      `[Metrics] Saved conversation result: ${result.turnCount} turns, ` +
      `${result.totalDurationSeconds}s total, ParkinsonSignal=${result.parkinsonSignal}%`
    );
  } catch (writeError) {
    console.error('[Metrics] Failed to save conversation result:', writeError);
  }
}

/**
 * Analyzes a single speech turn buffer and returns VocalMetrics (without saving).
 * Used to collect per-turn data for end-of-call aggregation.
 *
 * @param turnBuffer Concatenated PCM audio buffer for the user's speech turn.
 */
export function analyzeTurn(turnBuffer: Buffer): VocalMetrics | null {
  const metrics = analyzeSpeechVoice(turnBuffer);
  if (metrics.averagePitch > 0 && metrics.durationSeconds >= 0.5) {
    return metrics;
  }
  console.log(`[Metrics] Discarded silent or too short audio turn (duration: ${metrics.durationSeconds}s, pitch: ${metrics.averagePitch}Hz)`);
  return null;
}
