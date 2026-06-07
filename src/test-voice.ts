import { voiceAgent } from './mastra/agent';
import { createHuddle } from '@mastra/node-audio';
import { Transform } from 'stream';
import * as dotenv from 'dotenv';

dotenv.config();

// Ensure Google AI SDK provider picks up the key
if (process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
  process.env.GOOGLE_API_KEY = process.env.GEMINI_API_KEY;
}

// 2x Resampler Transform: duplicates 24kHz 16-bit PCM samples to play smoothly on macOS 48kHz hardware
class Upsampler extends Transform {
  _transform(chunk: Buffer, encoding: string, callback: Function) {
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
    } catch (err) {
      callback(err);
    }
  }
}

async function main() {
  console.log('Starting Voice Agent test...');
  console.log('Connecting to Gemini Live API...');
  
  try {
    // 1. Establish the realtime connection
    await voiceAgent.voice.connect();
    console.log('Connected! Agent is listening. Speak into your microphone...');
    
    // 2. Initialize Huddle to handle half-duplex mic/speaker toggling (prevents feedback loop)
    const huddle = createHuddle({
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
    await voiceAgent.voice.speak('Hello! How can I help you today?');

    // 4. Play agent voice via huddle (automatically pauses mic to prevent echo)
    voiceAgent.voice.on('speaker', (audioStream: any) => {
      console.log('[Agent] Speaking...');
      
      // Pipe Gemini's 24kHz stream through our 2x upsampler to feed the 48kHz speaker correctly
      const upsampledStream = audioStream.pipe(new Upsampler());
      huddle.play(upsampledStream);
    });

    // 5. Send microphone stream from Huddle to the agent
    const micStream = huddle.getMicrophoneStream();
    await voiceAgent.voice.send(micStream);
    
    // Keep the process alive
    console.log('Press Ctrl+C to stop.');
    await new Promise(() => {});
  } catch (error) {
    console.error('Error in voice agent session:', error);
  }
}

main();
