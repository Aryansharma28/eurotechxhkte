import * as fs from 'fs/promises';
import * as path from 'path';

const METRICS_FILE_PATH = path.join(__dirname, '../../metrics.json');

/**
 * Calculates the metric score for an incoming audio chunk.
 * Currently returns the number of bytes of the incoming message.
 * 
 * @param chunk The raw incoming audio buffer (mu-law or PCM).
 * @returns The calculated metric score.
 */
export function scoreAudioChunk(chunk: Buffer): number {
  // Currently calculates the number of bytes of the incoming chunk.
  // This can be replaced with more advanced voice/audio metrics later.
  return chunk.length;
}

/**
 * Saves a calculated metric score.
 * Currently saves to a local JSON file, but can be updated to save to a database later.
 * 
 * @param score The calculated metric score to save.
 */
export async function saveMetric(score: number): Promise<void> {
  const timestamp = new Date().toISOString();
  const newEntry = { timestamp, score };

  try {
    let currentData: any[] = [];
    try {
      const fileContent = await fs.readFile(METRICS_FILE_PATH, 'utf-8');
      currentData = JSON.parse(fileContent);
      if (!Array.isArray(currentData)) {
        currentData = [];
      }
    } catch (readError: any) {
      // If the file doesn't exist (ENOENT), we start with an empty array
      if (readError.code !== 'ENOENT') {
        console.error('[Metrics] Error reading metrics file:', readError);
      }
    }

    currentData.push(newEntry);
    await fs.writeFile(METRICS_FILE_PATH, JSON.stringify(currentData, null, 2), 'utf-8');
  } catch (writeError) {
    console.error('[Metrics] Failed to save metric:', writeError);
  }
}

/**
 * Orchestrates the processing of an incoming audio chunk:
 * 1. Computes the score via scoreAudioChunk.
 * 2. Saves the score via saveMetric.
 * 
 * @param chunk The raw incoming audio buffer.
 */
export async function processIncomingAudio(chunk: Buffer): Promise<void> {
  const score = scoreAudioChunk(chunk);
  await saveMetric(score);
}
