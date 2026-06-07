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
Object.defineProperty(exports, "__esModule", { value: true });
const agent_1 = require("./mastra/agent");
const node_audio_1 = require("@mastra/node-audio");
const stream_1 = require("stream");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
// Ensure Google AI SDK provider picks up the key
if (process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
    process.env.GOOGLE_API_KEY = process.env.GEMINI_API_KEY;
}
// 2x Resampler Transform: duplicates 24kHz 16-bit PCM samples to play smoothly on macOS 48kHz hardware
class Upsampler extends stream_1.Transform {
    _transform(chunk, encoding, callback) {
        try {
            const output = Buffer.alloc(chunk.length * 2);
            for (let i = 0; i < chunk.length; i += 2) {
                if (i + 1 < chunk.length) {
                    const sample = chunk.readInt16LE(i);
                    output.writeInt16LE(sample, i * 2);
                    output.writeInt16LE(sample, i * 2 + 2);
                }
            }
            callback(null, output);
        }
        catch (err) {
            callback(err);
        }
    }
}
async function main() {
    console.log('Starting Voice Agent test...');
    console.log('Connecting to Gemini Live API...');
    try {
        // 1. Establish the realtime connection
        await agent_1.voiceAgent.voice.connect();
        console.log('Connected! Agent is listening. Speak into your microphone...');
        // 2. Initialize Huddle to handle half-duplex mic/speaker toggling (prevents feedback loop)
        const huddle = (0, node_audio_1.createHuddle)({
            mic: {
                rate: 16000, // 16kHz
                channels: 1,
                device: 'default',
                threshold: 6, // Lower threshold so it easily captures your voice
            },
            speaker: {
                channels: 2, // 2 channels (stereo) avoids macOS CoreAudio mono mapping errors
                sampleRate: 48000, // Native macOS hardware rate to prevent speed distortion
                bitDepth: 16,
            }
        });
        huddle.start();
        // 3. Play the greeting
        await agent_1.voiceAgent.voice.speak('Hello! How can I help you today?');
        // 4. Play agent voice via huddle (automatically pauses mic to prevent echo)
        agent_1.voiceAgent.voice.on('speaker', (audioStream) => {
            console.log('[Agent] Speaking...');
            // Pipe Gemini's 24kHz stream through our 2x upsampler to feed the 48kHz speaker correctly
            const upsampledStream = audioStream.pipe(new Upsampler());
            huddle.play(upsampledStream);
        });
        // 5. Send microphone stream from Huddle to the agent
        const micStream = huddle.getMicrophoneStream();
        await agent_1.voiceAgent.voice.send(micStream);
        // Keep the process alive
        console.log('Press Ctrl+C to stop.');
        await new Promise(() => { });
    }
    catch (error) {
        console.error('Error in voice agent session:', error);
    }
}
main();
