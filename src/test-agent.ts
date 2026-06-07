import { voiceAgent } from './mastra/agent';
import * as dotenv from 'dotenv';

dotenv.config();

// Ensure Google AI SDK provider picks up the key
if (process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
  process.env.GOOGLE_API_KEY = process.env.GEMINI_API_KEY;
}

async function main() {
  console.log('Sending message to agent...');
  try {
    const response = await voiceAgent.generate('Hi! Can you check the status of my order #XYZ-98765?');
    console.log('\n--- Agent Response ---');
    console.log(response.text);
    console.log('----------------------');
  } catch (error) {
    console.error('Error running agent test:', error);
  }
}

main();
