import express from 'express';
import expressWs from 'express-ws';
import { voiceAgent } from './mastra/agent';
import { PassThrough } from 'stream';
import * as dotenv from 'dotenv';
import twilio from 'twilio';
import { processIncomingAudio } from './services/metrics';

// Load environment variables
dotenv.config();

const { app } = expressWs(express());
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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
app.post('/incoming-call', (req, res) => {
  const host = req.headers.host;
  console.log(`[Twilio] Incoming call received.`);
  
  // Respond with TwiML to connect the call to our WebSocket stream
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Connecting to Gemini AI support...</Say>
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
      } else if (data.event === 'media') {
        // Convert Twilio 8kHz mu-law to Gemini 16kHz PCM before writing to inputStream
        const muLawBuffer = Buffer.from(data.media.payload, 'base64');
        const pcmBuffer = transcodeTwilioToGemini(muLawBuffer);
        inputStream.write(pcmBuffer);

        // Process audio metrics asynchronously
        processIncomingAudio(muLawBuffer).catch(err => {
          console.error('[Metrics] Error processing audio chunk:', err);
        });
      } else if (data.event === 'stop') {
        console.log(`[Twilio] Stream stopped.`);
        ws.close();
      }
    } catch (err) {
      console.error(`[WebSocket] Error processing message:`, err);
    }
  });

  try {
    // 2. Connect to Gemini Voice
    await voiceAgent.voice.connect();
    isConnected = true;
    console.log(`[Gemini] Voice connected`);

    // 3. Start sending the input stream to Gemini
    voiceAgent.voice.send(inputStream).catch(err => {
      console.error(`[Gemini] Error sending stream:`, err);
    });

    // 4. Listen for agent's voice output and errors
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

    // Trigger initial greeting from the agent now that Gemini is connected
    console.log(`[Gemini] Triggering initial greeting...`);
    voiceAgent.voice.speak('Hello! How can I help you today?').catch(err => {
      console.error(`[Gemini] Error sending initial greeting:`, err);
    });

    ws.on('close', () => {
      console.log(`[WebSocket] Client disconnected.`);
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
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  const toNumber = process.env.USER_PHONE_NUMBER;
  const tunnelUrl = process.env.TUNNEL_URL || `https://${req.headers.host}`;

  if (!accountSid || !authToken || !fromNumber || !toNumber) {
    return res.status(400).send('Missing Twilio credentials or phone numbers in environment variables.');
  }

  try {
    const client = twilio(accountSid, authToken);
    console.log(`[Twilio] Initiating outbound call from ${fromNumber} to ${toNumber}...`);
    const call = await client.calls.create({
      url: `${tunnelUrl}/incoming-call`,
      to: toNumber,
      from: fromNumber,
    });
    res.send(`Call successfully initiated! Call SID: ${call.sid}`);
  } catch (error: any) {
    console.error('[Twilio] Failed to trigger call:', error);
    res.status(500).send(`Failed to trigger call: ${error.message}`);
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`For Twilio, set your webhook URL to: http://<your-ngrok-url>/incoming-call`);

  // Start the scheduler (disabled for now)
  // startScheduler();
});

async function triggerCall() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  const toNumber = process.env.USER_PHONE_NUMBER;
  const tunnelUrl = process.env.TUNNEL_URL || 'https://120157576de4e6.lhr.life';

  if (!accountSid || !authToken || !fromNumber || !toNumber || !tunnelUrl) {
    console.error('[Scheduler] Missing Twilio credentials or tunnel URL.');
    return;
  }

  try {
    const client = twilio(accountSid, authToken);
    console.log(`[Scheduler] Initiating outbound call from ${fromNumber} to ${toNumber}...`);
    const call = await client.calls.create({
      url: `${tunnelUrl}/incoming-call`,
      to: toNumber,
      from: fromNumber,
    });
    console.log(`[Scheduler] Call successfully initiated! Call SID: ${call.sid}`);
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
