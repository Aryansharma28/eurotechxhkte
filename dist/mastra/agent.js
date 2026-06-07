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
exports.voiceAgent = void 0;
const agent_1 = require("@mastra/core/agent");
const voice_google_gemini_live_1 = require("@mastra/voice-google-gemini-live");
const tools_1 = require("./tools");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
// Initialize the Gemini Live Voice module.
const voice = new voice_google_gemini_live_1.GeminiLiveVoice({
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-3.1-flash-live-preview',
    speaker: 'Puck',
});
exports.voiceAgent = new agent_1.Agent({
    id: 'twilio-voice-agent',
    name: 'Customer Support Voice Agent',
    instructions: `You are a helpful customer support agent. You converse with users over a phone call.
Keep your responses concise and conversational, as you are speaking out loud on a phone.
If a user asks about an order, ask for their order ID and use the checkOrderStatus tool to find the status.`,
    model: 'google/gemini-2.5-flash',
    voice: voice,
    tools: {
        checkOrderStatus: tools_1.checkOrderStatus,
    },
});
