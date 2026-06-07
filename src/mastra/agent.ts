import { Agent } from '@mastra/core/agent';
import { GeminiLiveVoice } from '@mastra/voice-google-gemini-live';
import { checkOrderStatus, callUser } from './tools';
import * as dotenv from 'dotenv';

dotenv.config();

// Initialize the Gemini Live Voice module.
const voice = new GeminiLiveVoice({
  apiKey: process.env.GEMINI_API_KEY,
  model: 'gemini-3.1-flash-live-preview',
  speaker: 'Puck',
  debug: true,
});

export const voiceAgent = new Agent({
  id: 'twilio-voice-agent',
  name: 'Customer Support Voice Agent',
  instructions: `You are a helpful customer support agent. You converse with users over a phone call.
Keep your responses concise and conversational, as you are speaking out loud on a phone.
If a user asks about an order, ask for their order ID and use the checkOrderStatus tool to find the status.
If a user asks you to call them (or call their number), use the callUser tool to initiate the call.`,
  model: 'google/gemini-2.5-flash',
  voice: voice as any,
  tools: {
    checkOrderStatus,
    callUser,
  },
});
