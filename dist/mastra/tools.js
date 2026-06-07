"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkOrderStatus = void 0;
const tools_1 = require("@mastra/core/tools");
const zod_1 = require("zod");
exports.checkOrderStatus = (0, tools_1.createTool)({
    id: 'check-order-status',
    description: 'Checks the status of an order given an order ID.',
    inputSchema: zod_1.z.object({
        orderId: zod_1.z.string().describe('The alphanumeric order ID to check.'),
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
