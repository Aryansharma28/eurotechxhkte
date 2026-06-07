import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import twilio from 'twilio';

export const checkOrderStatus = createTool({
  id: 'check-order-status',
  description: 'Checks the status of an order given an order ID.',
  inputSchema: z.object({
    orderId: z.string().describe('The alphanumeric order ID to check.'),
  }),
  execute: async ({ context }) => {
    console.log(`[Tool] Invoked checkOrderStatus with orderId: ${context.orderId}`);
    
    // Simulated database lookup
    const statuses = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      orderId: context.orderId,
      status: randomStatus,
      estimatedDelivery: '2026-06-15',
    };
  },
});

export const callUser = createTool({
  id: 'call-user',
  description: 'Initiates a phone call to the user using Twilio, connecting them to the Gemini AI voice agent.',
  inputSchema: z.object({}),
  execute: async () => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    const toNumber = process.env.USER_PHONE_NUMBER;
    const tunnelUrl = process.env.TUNNEL_URL;

    if (!accountSid || !authToken || !fromNumber || !toNumber || !tunnelUrl) {
      throw new Error('Missing Twilio credentials or phone numbers in environment variables.');
    }

    const client = twilio(accountSid, authToken);

    console.log(`[Tool] Initiating outbound call from ${fromNumber} to ${toNumber}...`);
    const call = await client.calls.create({
      url: `${tunnelUrl}/incoming-call`,
      to: toNumber,
      from: fromNumber,
    });

    return {
      status: 'success',
      callSid: call.sid,
      message: `Call successfully initiated to ${toNumber}.`,
    };
  },
});
