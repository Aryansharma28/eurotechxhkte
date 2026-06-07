# HONESTY.md

> Mandatory disclosure for the hackathon. This file lives at the root of your repository. Judges cross-check it against your code and your technical video.
>
> **The deal:** disclosed shortcuts are **not** penalized — that is the entire point of this file. Hidden ones are. Undisclosed pre-built code is heavily penalized, each undisclosed mock carries a small penalty, and a faked demo is heavily penalized. Telling the truth here costs you nothing.

---

## 1. Team — who did what

| Member | GitHub handle | Main contributions |
|---|---|---|
| Aryan Sharma | aryansharma28 | Everything: frontend prototypes (all three roles), voice call pipeline (Twilio + Gemini Live), real-time acoustic signal processing (DSP from scratch), Supabase schema + RLS, Hono.js API, role-based auth, Vercel deployment, bilingual UX copy |
| kshitiz2099 | kshitiz2099 | 1 commit (minor contribution) |

---

## 2. What is fully working

- **End-to-end voice call pipeline** — Twilio places a real outbound call to the elder's phone number; audio streams over WebSocket in real time; Google Gemini Live (`gemini-2.0-flash-live-001`) conducts a natural 5–10 minute Cantonese conversation; the agent calls a structured `logDailyCheckIn` tool exactly once at call end, writing 6 activity statuses + health flags to Supabase. Full μ-law ↔ PCM transcoding written from scratch (no library).

- **Real acoustic signal processing — no ML** — Every call runs a custom DSP pipeline: autocorrelation pitch detection per 30 ms frame, per-cycle jitter and shimmer, harmonic-to-noise ratio, RMS energy, silence ratio. Produces two clinical signals per call: a **Parkinson signal** (0–100, from jitter/shimmer/pitch flatness/hypophonia) and a **neurological decline signal** (0–100, from pitch flatness, hesitancy, low energy, vocal instability). All 7 biomarker values saved to Supabase `daily_calls` after every real call.

- **7-metric neuro dashboard** — Social worker dashboard renders 14-day trend charts, threshold alerts (watch/risk), and per-elder neuro summaries for all 7 acoustic biomarkers including Parkinson signal and neurological decline. Chart and alert logic is fully functional.

- **Social worker dashboard** — Real caseload from Supabase sorted by risk tier; today's 6 activity statuses per elder; week-strip activity calendar; elder detail drawer; tablet visit-logging mode (writes to Supabase).

- **Family app** — Parent's latest call summary, today's activities, and care-worker contact — all served from Supabase via RLS-scoped API.

- **Risk triage engine** — Computed live from open flags: any `risk`-severity flag → elder is `risk`; any `watch` → `watch`; else `stable`. Drives caseload sort order and triage badge.

- **Role-based auth** — Supabase JWT + user metadata; workers and family members see entirely different UIs; session persists across page loads.

- **Missed-call retry + flagging** — Up to 2 retry attempts 30 min apart; after both missed, writes a severity-appropriate flag to Supabase.

- **`/simulate-call` endpoint** — Writes a realistic full check-in to Supabase without a live Twilio call; demonstrates the complete call → structured data → dashboard pipeline in a reproducible way.

---

## 3. What is mocked, stubbed, or hardcoded

| What is faked | Where (file:line or folder) | Why we mocked it | What the real version would do |
|---|---|---|---|
| 14-day biomarker history shown in dashboard charts | `sw/biomarkers.js` — synthetic per-elder profiles | A real 14-day history requires 14 completed calls per elder; not possible to generate during a hackathon. The computation pipeline, chart rendering, threshold evaluation, and Supabase storage are all real — only the seed history is synthetic. | After 14 real calls, replace `BIOMARKERS` static object with a query against `daily_calls` trailing 14 days per elder |
| Seeded elder data (5 elders: wong, chan, lee, cheung, ho) | `backend/supabase/seed.sql` | No real patient data available; seed provides a realistic caseload for demo | Real deployment onboards discharge cases via social worker intake form |
| Care plan display | Schema + API exist; UI display not built | Time constraint | Family app shows a scrollable care plan list with completion checkboxes |
| Visit photo attachments | Visit mode UI has a placeholder | File upload out of scope for POC | Upload to Supabase Storage, store URL in `visits.photo_url` |

---

## 4. External APIs, services & data sources

| Service / API / dataset | Used for | Real call or mocked? | Auth |
|---|---|---|---|
| Google Gemini Live Voice (`gemini-2.0-flash-live-001`) | Real-time Cantonese voice conversation with elder | Real | `GEMINI_API_KEY`; production key |
| Twilio Voice | Outbound call placement, WebSocket media stream (8 kHz μ-law) | Real | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`; live account |
| Supabase (PostgreSQL + Auth) | All persistent data — calls, activities, flags, visits, biomarkers; JWT role auth with RLS | Real | `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (server) / `SUPABASE_ANON_KEY` (frontend); live project |
| Vercel | Static frontend + serverless API | Real | Vercel project; env vars in dashboard |
| Mastra (`@mastra/core`, `@mastra/voice-google-gemini-live`) | Agent framework + Gemini Live voice binding | Real | Wraps Gemini API key above |

---

## 5. Pre-existing code

| Item | Source | Roughly how much | License |
|---|---|---|---|
| React 18.3.1 | CDN via unpkg | Framework | MIT |
| Babel Standalone 7.29.0 | CDN via jsdelivr | JIT JSX compilation in browser | MIT |
| Supabase JS client 2.x | CDN via jsdelivr | Database + auth client | MIT |
| Hono.js 4.7.10 | npm | HTTP router for serverless API | MIT |
| Mastra (`@mastra/core`, `@mastra/voice-google-gemini-live`) | npm | Agent framework + Gemini Live voice binding | MIT |
| Twilio Node SDK 5.0.4 | npm | Phone API client | MIT |
| Zod 3.23.8 | npm | Tool input schema validation | MIT |

*All application code — DSP signal processing, prototypes, voice pipeline, API routes, Supabase schema, design system CSS — was written during the hackathon window.*

---

## 6. Known limitations & next steps

- **Single concurrent call (POC scope)** — Voice server handles one stream at a time; intentional for a POC. A scalable solution handles this with a per-stream session map.
- **Scheduler manually triggered** — Daily call scheduling is intentionally manual for demo control; the scheduler code exists (`startScheduler()`) and would be enabled in production with a cron service.
- **Live biomarker charts** — The 7 acoustic scores are computed and saved to Supabase on every real call; the dashboard charts will show live trends automatically once 14+ real calls have been made per elder.
- **No push/SMS alerts** — Flags surface in the dashboard UI; production would add Slack/SMS to close the safety notification gap.
- **No PDPO audit logging** — Required for Hong Kong data privacy compliance in a real clinical pilot; out of scope for the hackathon.
- **Next step: alert notifications** — Webhook or SMS to social worker on new `risk`-tier flag is the highest-value safety improvement. To make sure we are privacy compliant, we ask the involved patient for consent for their data. Even if we do not have access to their data, our product can still handle the monitoring. If we are allowed access, we can personalize their experience.
- Healthcare metrics don't update yet
