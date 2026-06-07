import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { recordCheckIn } from '../services/checkin';
import { callSession } from '../services/callSession';
import { getCallMetrics } from '../services/metrics';

const activityStatus = z
  .enum(['done', 'missed', 'unknown'])
  .describe("'done' if they did it today, 'missed' if they did not, 'unknown' if not discussed");

/**
 * The single tool the check-in agent must call ONCE at the end of every call. It turns the
 * conversation into the structured rows the dashboard + family app read: a daily_call,
 * activity_records for the six tracked activities, and flags for anything a nurse should see.
 */
export const logDailyCheckIn = createTool({
  id: 'log-daily-check-in',
  description:
    'Record the outcome of the daily check-in call. Call this exactly once, at the END of the call, ' +
    'summarising everything you learned about the six daily activities, any health concerns worth a ' +
    "nurse's attention, and a short plain-language recap for the family in both English and Cantonese.",
  inputSchema: z.object({
    activities: z
      .object({
        med: activityStatus.describe('Took prescribed medication today'),
        meal: activityStatus.describe('Ate meals today'),
        walk: activityStatus.describe('Moved around / walked today'),
        water: activityStatus.describe('Drank enough fluids today'),
        sleep: activityStatus.describe('Slept reasonably last night'),
        mood: activityStatus.describe('Mood / spirits are okay today'),
      })
      .describe('Status of each of the six daily activities, from what the elder said'),
    flags: z
      .array(
        z.object({
          severity: z
            .enum(['watch', 'risk'])
            .describe("'risk' for urgent concerns (breathlessness, chest pain, a fall, no answer), 'watch' otherwise"),
          label_en: z.string().describe('Short concern in English, e.g. "Reported dizziness when standing"'),
          label_zh: z.string().optional().describe('Same concern in Traditional Chinese (Cantonese register)'),
        }),
      )
      .describe('Health concerns raised during the call. Empty array if nothing of note.'),
    summary_en: z.string().describe('1–2 sentence plain-language recap of the call, in English'),
    summary_zh: z.string().optional().describe('Same recap in Traditional Chinese (Cantonese register)'),
  }),
  execute: async ({ context }) => {
    const elderId = callSession.elderId;
    if (!elderId) {
      console.error('[Tool] logDailyCheckIn called with no active elder in the call session.');
      return { status: 'error', message: 'No elder is associated with this call; nothing was saved.' };
    }
    try {
      const result = await recordCheckIn(elderId, {
        activities: context.activities,
        flags: context.flags,
        summary_en: context.summary_en,
        summary_zh: context.summary_zh,
        voiceMetrics: getCallMetrics(),
      });
      callSession.logged = true;
      return {
        status: 'success',
        message: `Saved check-in for ${elderId}: ${result.activitiesWritten} activities, ${result.flagsWritten} flags, risk now ${result.newRiskTier}.`,
        ...result,
      };
    } catch (err: any) {
      console.error('[Tool] logDailyCheckIn failed:', err);
      return { status: 'error', message: err.message ?? 'Failed to save check-in.' };
    }
  },
});
