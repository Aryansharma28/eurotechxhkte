"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_ws_1 = __importDefault(require("express-ws"));
const agent_1 = require("./mastra/agent");
const stream_1 = require("stream");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const { app } = (0, express_ws_1.default)((0, express_1.default)());
const port = process.env.PORT || 3000;
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
// --- Audio Transcoding Tables and Functions ---
const bias = 33;
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
function pcmToMulaw(pcmSample) {
    let sign = (pcmSample < 0) ? 0x80 : 0x00;
    if (pcmSample < 0)
        pcmSample = -pcmSample;
    if (pcmSample > 32635)
        pcmSample = 32635;
    pcmSample += bias;
    let exponent = 7;
    for (let mask = 0x4000; (pcmSample & mask) === 0 && exponent > 0; mask >>= 1) {
        exponent--;
    }
    let mantissa = (pcmSample >> (exponent + 3)) & 0x0F;
    return ~(sign | (exponent << 4) | mantissa);
}
// Convert Twilio 8kHz mu-law to Gemini 16kHz 16-bit PCM
function transcodeTwilioToGemini(muLawBuffer) {
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
function transcodeGeminiToTwilio(pcmBuffer) {
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
    let streamSid = null;
    let isConnected = false;
    // We use a PassThrough stream to simulate a microphone stream for Mastra
    const inputStream = new stream_1.PassThrough();
    try {
        // 1. Connect to Gemini Voice
        await agent_1.voiceAgent.voice.connect();
        isConnected = true;
        console.log(`[Gemini] Voice connected`);
        // 2. Start sending the input stream to Gemini
        agent_1.voiceAgent.voice.send(inputStream).catch(err => {
            console.error(`[Gemini] Error sending stream:`, err);
        });
        // 3. Listen for agent's voice output
        agent_1.voiceAgent.voice.on('speaking', (data) => {
            const audio = data?.audio;
            if (streamSid && ws.readyState === ws.OPEN && audio) {
                // Transcode 24kHz PCM to Twilio 8kHz mu-law
                const inputBuffer = Buffer.isBuffer(audio) ? audio : Buffer.from(audio);
                const transcodedAudio = transcodeGeminiToTwilio(inputBuffer);
                ws.send(JSON.stringify({
                    event: 'media',
                    streamSid: streamSid,
                    media: {
                        payload: transcodedAudio.toString('base64')
                    }
                }));
            }
        });
        // Trigger initial greeting from the agent
        await agent_1.voiceAgent.voice.speak('Hello! How can I help you today?');
        // 4. Handle incoming messages from Twilio
        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message.toString());
                if (data.event === 'start') {
                    streamSid = data.start.streamSid;
                    console.log(`[Twilio] Stream started. streamSid: ${streamSid}`);
                }
                else if (data.event === 'media') {
                    // Convert Twilio 8kHz mu-law to Gemini 16kHz PCM before writing to inputStream
                    const muLawBuffer = Buffer.from(data.media.payload, 'base64');
                    const pcmBuffer = transcodeTwilioToGemini(muLawBuffer);
                    inputStream.write(pcmBuffer);
                }
                else if (data.event === 'stop') {
                    console.log(`[Twilio] Stream stopped.`);
                    ws.close();
                }
            }
            catch (err) {
                console.error(`[WebSocket] Error processing message:`, err);
            }
        });
        ws.on('close', () => {
            console.log(`[WebSocket] Client disconnected.`);
            inputStream.end();
            agent_1.voiceAgent.voice.close();
        });
    }
    catch (err) {
        console.error(`[WebSocket] Setup error:`, err);
        ws.close();
    }
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`For Twilio, set your webhook URL to: http://<your-ngrok-url>/incoming-call`);
});
