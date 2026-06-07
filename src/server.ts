import express from 'express';
import expressWs from 'express-ws';
import { voiceAgent } from './mastra/agent';
import { PassThrough } from 'stream';
import * as dotenv from 'dotenv';
import path from 'path';
import twilio from 'twilio';
import { processIncomingAudio, resetCallMetrics, getCallMetrics } from './services/metrics';
import { startCallSession, endCallSession, callSession } from './services/callSession';
import { recordCheckIn, recordMissedCall, findElderByPhone, CheckInPayload } from './services/checkin';
import { fetchPatient } from './services/supabase';

// Load .env from root, fall back to voice-wt/.env for local dev
dotenv.config();
dotenv.config({ path: path.join(process.cwd(), 'voice-wt', '.env'), override: false });

const { app } = expressWs(express());
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Tracks outbound calls so the statusCallback can find the elder + retry count.
const pendingCalls = new Map<string, { elderId: string | null; toNumber: string; attempt: number }>();

async function placeCall(
  elderId: string | null,
  toNumber: string,
  tunnelUrl: string,
  attempt: number,
): Promise<string> {
  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
  if (attempt === 1 && elderId) startCallSession(elderId);
  const call = await client.calls.create({
    url: `${tunnelUrl}/incoming-call`,
    to: toNumber,
    from: process.env.TWILIO_PHONE_NUMBER!,
    statusCallback: `${tunnelUrl}/call-status`,
    statusCallbackMethod: 'POST',
    statusCallbackEvent: ['completed'],
  });
  pendingCalls.set(call.sid, { elderId, toNumber, attempt });
  console.log(`[Twilio] Call ${call.sid} placed (attempt ${attempt}, elder=${elderId})`);
  return call.sid;
}

// --- Audio Transcoding Tables and Functions ---
const bias = 132;
const mulawToPcmTable = new Int16Array(256);
for (let i = 0; i < 256; i++) {
  let u = ~i;
  let sign = (u & 0x80);
  let exponent = (u & 0x70) >> 4;
  let mantissa = (u & 0x0F);
  let sample = (mantissa << 3) + bias;
  sample <<= exponent;
  sample -= bias;
  mulawToPcmTable[i] = sign ? -sample : sample;
}

function pcmToMulaw(pcmSample: number): number {
  let sign = (pcmSample < 0) ? 0x80 : 0x00;
  if (pcmSample < 0) pcmSample = -pcmSample;
  if (pcmSample > 32635) pcmSample = 32635;
  pcmSample += bias;
  let exponent = 7;
  for (let mask = 0x4000; (pcmSample & mask) === 0 && exponent > 0; mask >>= 1) {
    exponent--;
  }
  let mantissa = (pcmSample >> (exponent + 3)) & 0x0F;
  return ~(sign | (exponent << 4) | mantissa);
}

// Convert Twilio 8kHz mu-law to Gemini 16kHz 16-bit PCM
function transcodeTwilioToGemini(muLawBuffer: Buffer): Buffer {
  const pcmBuffer = Buffer.alloc(muLawBuffer.length * 4); // 8-bit -> 16-bit (x2) + 2x upsample (x2) = 4x
  let offset = 0;
  for (let i = 0; i < muLawBuffer.length; i++) {
    const pcmSample = mulawToPcmTable[muLawBuffer[i]];
    // Write sample twice to double sample rate from 8kHz to 16kHz
    pcmBuffer.writeInt16LE(pcmSample, offset);
    pcmBuffer.writeInt16LE(pcmSample, offset + 2);
    offset += 4;
  }
  return pcmBuffer;
}

// Convert Gemini 24kHz 16-bit PCM to Twilio 8kHz mu-law
function transcodeGeminiToTwilio(pcmBuffer: Buffer): Buffer {
  const muLawBuffer = Buffer.alloc(Math.floor(pcmBuffer.length / 6)); // 16-bit -> 8-bit (1/2) + 3x downsample (1/3) = 1/6
  let offset = 0;
  for (let i = 0; i < pcmBuffer.length; i += 6) { // Step by 6 bytes (3 samples of 16-bit PCM)
    if (i + 1 < pcmBuffer.length) {
      const pcmSample = pcmBuffer.readInt16LE(i);
      muLawBuffer[offset] = pcmToMulaw(pcmSample);
      offset++;
    }
  }
  return muLawBuffer;
}
// ----------------------------------------------

// Handle incoming Twilio call
app.post('/incoming-call', async (req, res) => {
  const host = req.headers.host;
  console.log(`[Twilio] Incoming call received.`);

  // Decide which elder this call is for. Outbound calls placed via /make-call already set
  // the session; for any other call, resolve by the caller's number, falling back to
  // DEMO_ELDER_ID so the demo always has someone to log against.
  if (!callSession.elderId) {
    let elderId: string | null = process.env.DEMO_ELDER_ID || null;
    const from = (req.body && req.body.From) as string | undefined;
    if (from) {
      try { elderId = (await findElderByPhone(from)) || elderId; }
      catch (e) { console.warn('[Twilio] Could not resolve elder by phone:', e); }
    }
    startCallSession(elderId);
  }

  // Respond with TwiML to connect the call to our WebSocket stream
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Connecting your CareBridge check-in call.</Say>
  <Connect>
    <Stream url="wss://${host}/media-stream" />
  </Connect>
</Response>`;

  res.type('text/xml');
  res.send(twiml);
});

// Handle the WebSocket stream from Twilio
app.ws('/media-stream', async (ws, req) => {
  console.log(`[WebSocket] Client connected to /media-stream`);
  let streamSid: string | null = null;
  let isConnected = false;

  // We use a PassThrough stream to simulate a microphone stream for Mastra
  const inputStream = new PassThrough();

  // 1. Handle incoming messages from Twilio IMMEDIATELY to avoid dropping the 'start' event
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.event !== 'media') {
        console.log(`[WebSocket] Message received. Event: ${data.event}`, JSON.stringify(data));
      }

      if (data.event === 'start') {
        streamSid = data.start.streamSid;
        console.log(`[Twilio] Stream started. streamSid: ${streamSid}`);
        // Fresh acoustic metrics for this call; ensure an elder is set as a last resort.
        resetCallMetrics();
        if (!callSession.elderId && process.env.DEMO_ELDER_ID) {
          startCallSession(process.env.DEMO_ELDER_ID);
        }
      } else if (data.event === 'media') {
        // Convert Twilio 8kHz mu-law to Gemini 16kHz PCM before writing to inputStream
        const muLawBuffer = Buffer.from(data.media.payload, 'base64');
        const pcmBuffer = transcodeTwilioToGemini(muLawBuffer);
        inputStream.write(pcmBuffer);

        // Fold this chunk into the real (acoustic) voice metrics for the call
        try {
          processIncomingAudio(muLawBuffer);
        } catch (err) {
          console.error('[Metrics] Error processing audio chunk:', err);
        }
      } else if (data.event === 'stop') {
        console.log(`[Twilio] Stream stopped.`);
        ws.close();
      }
    } catch (err) {
      console.error(`[WebSocket] Error processing message:`, err);
    }
  });

  try {
    // 2. Fetch patient context before connecting so dynamic instructions have data
    if (callSession.elderId && !callSession.patient) {
      callSession.patient = await fetchPatient(callSession.elderId);
      if (callSession.patient) {
        console.log(`[CallSession] Patient loaded: ${callSession.patient.name_en} (${callSession.elderId})`);
      } else {
        console.warn(`[CallSession] Could not load patient context for elder=${callSession.elderId}`);
      }
    }

    // 3. Connect to Gemini Voice (instructions resolved here with patient context)
    await voiceAgent.voice.connect();
    isConnected = true;
    console.log(`[Gemini] Voice connected`);

    // 4. Start sending the input stream to Gemini
    voiceAgent.voice.send(inputStream).catch(err => {
      console.error(`[Gemini] Error sending stream:`, err);
    });

    // 5. Listen for agent's voice output and errors
    const onSpeaking = (data: any) => {
      const audio = data?.audio;
      if (audio) {
        console.log(`[Gemini] Agent spoke a chunk of size: ${audio.length || audio.byteLength} bytes`);
      }
      if (streamSid && ws.readyState === ws.OPEN && audio) {
        // Transcode 24kHz PCM to Twilio 8kHz mu-law
        const inputBuffer = Buffer.isBuffer(audio)
          ? audio
          : (typeof audio === 'string'
              ? Buffer.from(audio, 'base64')
              : Buffer.from(audio));
        const transcodedAudio = transcodeGeminiToTwilio(inputBuffer);

        ws.send(JSON.stringify({
          event: 'media',
          streamSid: streamSid,
          media: {
            payload: transcodedAudio.toString('base64')
          }
        }));
      }
    };

    const onError = (err: any) => {
      console.error(`[Gemini] Voice error:`, err);
    };

    voiceAgent.voice.on('speaking', onSpeaking);
    voiceAgent.voice.on('error', onError);

    // 6. Personalized opening greeting using the patient's name
    const p = callSession.patient;
    const greeting = p
      ? `喂，你好！我係康橋嘅關懷助理。請問係${p.name_zh}${p.sex === 'F' ? '婆婆' : '伯伯'}嗎？今日打嚟同你做健康問候，請問你而家點呀？`
      : '喂，你好！我係康橋嘅關懷助理，打嚟同你做今日嘅健康問候。請問你今日點呀？';

    console.log(`[Gemini] Triggering initial greeting...`);
    voiceAgent.voice.speak(greeting).catch(err => {
      console.error(`[Gemini] Error sending initial greeting:`, err);
    });

    ws.on('close', () => {
      console.log(`[WebSocket] Client disconnected.`);
      const metrics = getCallMetrics();
      console.log(`[Metrics] Call voice metrics — pause ratio: ${metrics.pauseRatio}, speech: ${metrics.speechMs}ms, total: ${metrics.totalMs}ms`);
      if (!callSession.logged) {
        console.warn('[CallSession] Call ended without a structured check-in (agent did not call logDailyCheckIn).');
      }
      endCallSession();
      inputStream.end();
      voiceAgent.voice.off('speaking', onSpeaking);
      voiceAgent.voice.off('error', onError);
      voiceAgent.voice.close();
    });

  } catch (err) {
    console.error(`[WebSocket] Setup error:`, err);
    ws.close();
  }
});

app.get('/make-call', async (req, res) => {
  const toNumber = process.env.USER_PHONE_NUMBER;
  const tunnelUrl = process.env.TUNNEL_URL || `https://${req.headers.host}`;

  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER || !toNumber) {
    return res.status(400).send('Missing Twilio credentials or phone numbers in environment variables.');
  }

  const elderId = (req.query.elderId as string) || process.env.DEMO_ELDER_ID || null;

  try {
    const sid = await placeCall(elderId, toNumber, tunnelUrl, 1);
    res.send(`Call successfully initiated! Call SID: ${sid}`);
  } catch (error: any) {
    console.error('[Twilio] Failed to trigger call:', error);
    res.status(500).send(`Failed to trigger call: ${error.message}`);
  }
});

// Twilio posts here when a call ends. Handles no-answer: retry once after 30 min, then flag.
app.post('/call-status', async (req, res) => {
  res.sendStatus(204);

  const callSid = req.body.CallSid as string;
  const callStatus = req.body.CallStatus as string;

  const pending = pendingCalls.get(callSid);
  if (!pending) return;
  pendingCalls.delete(callSid);

  if (!['no-answer', 'busy', 'failed'].includes(callStatus)) return;

  const { elderId, toNumber, attempt } = pending;
  const tunnelUrl = process.env.TUNNEL_URL || '';
  console.log(`[CallStatus] ${callSid} → ${callStatus} (attempt ${attempt}, elder=${elderId})`);

  if (attempt === 1) {
    console.log(`[CallStatus] Scheduling retry for elder=${elderId} in 30 min`);
    setTimeout(async () => {
      try { await placeCall(elderId, toNumber, tunnelUrl, 2); }
      catch (err) { console.error('[CallStatus] Retry call failed:', err); }
    }, 30 * 60 * 1000);
  } else {
    if (!elderId) {
      console.warn('[CallStatus] Cannot flag: no elderId for this call');
      return;
    }
    try {
      const result = await recordMissedCall(elderId);
      console.log(`[MissedCall] Flagged elder=${elderId} → risk=${result.newRiskTier}`);
    } catch (err) {
      console.error('[MissedCall] Failed to record missed call:', err);
    }
  }
});

// Prove the call → dashboard loop WITHOUT placing a real phone call.
// GET /simulate-call?elderId=wong  →  writes a realistic daily check-in to Supabase,
// exactly as the live agent's logDailyCheckIn tool would, then returns the result.
app.get('/simulate-call', async (req, res) => {
  const elderId = (req.query.elderId as string) || process.env.DEMO_ELDER_ID || 'wong';
  const sample: CheckInPayload = {
    activities: { med: 'done', meal: 'done', walk: 'missed', water: 'done', sleep: 'missed', mood: 'done' },
    flags: [
      { severity: 'watch', label_en: 'Reported feeling dizzy when standing up this morning', label_zh: '今早起身時感到頭暈' },
    ],
    summary_en: 'Took medication and ate breakfast. Slept poorly and felt dizzy when standing. Otherwise in good spirits.',
    summary_zh: '已服藥及食早餐。昨晚睡得不好，起身時感頭暈，其餘狀態不錯。',
    voiceMetrics: { pauseRatio: 0.22, speechMs: 48000 },
  };
  try {
    const result = await recordCheckIn(elderId, sample);
    res.json({ simulated: true, elderId, ...result });
  } catch (err: any) {
    console.error('[Simulate] Failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`For Twilio, set your webhook URL to: http://<your-ngrok-url>/incoming-call`);

  // Start the scheduler (disabled for now)
  // startScheduler();
});

async function triggerCall() {
  const toNumber = process.env.USER_PHONE_NUMBER;
  const tunnelUrl = process.env.TUNNEL_URL || 'https://120157576de4e6.lhr.life';
  const elderId = process.env.DEMO_ELDER_ID || null;

  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER || !toNumber) {
    console.error('[Scheduler] Missing Twilio credentials or phone numbers.');
    return;
  }

  try {
    const sid = await placeCall(elderId, toNumber, tunnelUrl, 1);
    console.log(`[Scheduler] Call initiated. SID: ${sid}`);
  } catch (error: any) {
    console.error('[Scheduler] Failed to trigger call:', error);
  }
}

function startScheduler() {
  const targetTime = new Date();
  targetTime.setHours(2);
  targetTime.setMinutes(25);
  targetTime.setSeconds(0);
  targetTime.setMilliseconds(0);

  let delay = targetTime.getTime() - Date.now();
  if (delay < 0) {
    delay = 0; // If it already passed, start immediately
  }

  console.log(`[Scheduler] Scheduled to start calling every 10 hours starting at 02:25 AM (in ${Math.round(delay / 1000)} seconds)...`);

  setTimeout(() => {
    console.log(`[Scheduler] 02:25 AM reached! Triggering first call...`);
    triggerCall();

    setInterval(() => {
      console.log(`[Scheduler] 10 hours elapsed. Triggering next call...`);
      triggerCall();
    }, 10 * 60 * 60 * 1000);
  }, delay);
}
