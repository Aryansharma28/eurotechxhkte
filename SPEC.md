# CareBridge 康橋 — Build Spec for Claude Code

> **One-line:** A transitional-care system that keeps recently-discharged elderly Hong Kong patients well at home — so they don't get readmitted. Three roles, one shared care picture, fed by a frictionless **daily phone call** to the elder.

This document is the source of truth for building CareBridge. It pairs with the clickable prototypes in this project:

| File | What it shows |
|---|---|
| `index.html` | Scheme overview, role map, design system |
| `Social Worker Dashboard.html` | Primary product — caseload, ADL tracking, risk triage, elder detail, tablet visit mode |
| `Family App.html` | Adult child's phone view |
| `Elder Call.html` | The daily call + what it captures |
| `styles/system.css` | Design tokens (colours, type, components) — **reuse these verbatim** |

---

## 1. Why this exists

Roughly **1 in 5 elderly patients are readmitted within 30 days** of discharge, and most readmissions are preventable — missed medication, poor hydration, an untreated infection, a fall, fluid overload in heart-failure patients. The window that matters is the first ~30 days at home.

CareBridge closes that window by making daily monitoring effortless for everyone:

- The **elder** does nothing but answer a phone — no app, no login, no screen.
- The **family** gets quiet reassurance and only-when-it-matters nudges.
- The **social worker** sees five elders at a glance and acts on flags before they escalate.

**Pilot scope:** Hong Kong, one social worker × five elders, bilingual 繁體中文 (Cantonese) + English.

---

## 2. Roles & access

| Role | 中文 | Device | Auth | Core job |
|---|---|---|---|---|
| **Elder** | 長者 | Phone **call only** | None — phone number is the identity | Answer the daily check-in call |
| **Adult child** | 子女 / 家屬 | Mobile app (iOS/Android) | Phone OTP login | See parent's status; be reassured; respond to nudges |
| **Social worker** | 社工 / 個案經理 | Web dashboard + tablet | Staff SSO | Manage caseload of 5; triage risk; log home visits |

One elder may have **0–N family members** linked; each elder has **exactly one** assigned social worker in the pilot.

---

## 3. Core concepts (glossary)

- **Daily call** — a scheduled voice check-in (AI-voice agent or staff) in Cantonese. Asks ~5 simple questions mapped to activities + symptom probes. Output = structured `ActivityRecord`s + optional `Flag`s. This is the primary data source. See `Elder Call.html`.
- **ADL / daily activity** — the six tracked items: **Medication 服藥, Meals 進食, Mobility 活動, Hydration 飲水, Sleep 睡眠, Mood 情緒**. Each has a daily status: `done` / `missed` / `pending`.
- **Risk tier** — per-elder triage: `stable 穩定` (green) · `watch 留意` (amber) · `risk 高危` (red). Drives sort order and alerting. Computed from missed activities, flags, vitals trends, and days-since-discharge.
- **Flag** — a clinical signal raised by a call answer, family note, or visit (e.g. dizziness, weight gain, missed meds streak). Flags feed the alerts list.
- **Home visit** — an in-person check by the social worker, logged in **tablet visit mode** (checklist + notes + photos).
- **Care plan** — per-elder list of clinician-set tasks (meds, exercises, follow-up appointments).

---

## 4. Data model

```
Elder
  id, nameEn, nameZh, age, sex
  diagnosis (En/Zh), dischargeDate, daySinceDischarge (derived)
  livingSituation (En/Zh)           # "Lives alone · Sham Shui Po"
  phone                             # identity for the call
  assignedWorkerId
  riskTier                          # stable | watch | risk  (derived, but overridable)
  riskNote (En/Zh)                  # human-readable "why"

Worker
  id, nameEn, nameZh, role(En/Zh), team

Family
  id, elderId, nameEn, nameZh, relationship, phone

DailyCall
  id, elderId, scheduledAt, state           # done | missed | scheduled
  completedAt, channel                       # voice-agent | staff
  transcript[]   # {role: ai|elder, textZh, textEn}
  summaryZh, summaryEn                        # plain-language recap shown to family

ActivityRecord
  id, elderId, date, activityKey             # med|meal|walk|water|sleep|mood
  status                                      # done | missed | pending
  source                                      # call | family | visit
  note (optional)

Flag
  id, elderId, kind, severity                 # watch | risk
  labelEn, labelZh, raisedAt, source, resolved

Vital
  id, elderId, key, value, trend, status      # e.g. Weight "+1.8 kg ↑" risk
  measuredAt

Visit
  id, elderId, workerId, scheduledAt, type(En/Zh), location, state  # due|upcoming|done
  checkedActivities[], notes, photos[], quickFlags[]

CarePlanItem
  id, elderId, textEn/textZh, done, dueDate
```

**Derivations**
- `riskTier`: start `stable`; bump to `watch` on any open `watch` flag, ≥2 missed activities in 7d, or an out-of-range vital trend; bump to `risk` on any `risk` flag (e.g. CHF weight gain), a missed daily call when already on `watch`, or worker override.
- Dashboard caseload is **sorted by risk** (risk → watch → stable).
- Family "today" status string is a friendly reduction of today's call + open flags ("She's okay today" vs. honest-but-calm when a flag is open).

---

## 5. Key flows

**A. The daily care loop (the spine of the product)**
```
Scheduled daily call ─▶ Elder answers, speaks ─▶ Answers parsed into ActivityRecords + Flags
        ─▶ DailyCall.summary generated ─▶ Dashboard + Family app update in real time
        ─▶ Risk recomputed ─▶ if flag/risk: Alert surfaces on worker's Today screen
        ─▶ Worker triages: call elder/family, or schedule a home visit
        ─▶ Visit logged ─▶ loop continues until elder "graduates" (~Day 30)
```

**B. Missed call escalation** — 2 retry attempts; if still unanswered, raise a `risk` flag ("Missed daily call"), notify worker + linked family. (See Chan Kwok-keung in the prototype.)

**C. Home visit** — worker taps *Start home visit* → tablet visit mode → checks today's activities, writes notes, adds photo of meds/home, taps quick flags → *Save & sync* writes a `Visit` + `ActivityRecord`s.

**D. Graduation** — around Day 30, stable elders are discharged from the programme (see Ho Yuen-wah, "graduating soon").

---

## 6. Screens to build (per role)

### Social worker — web dashboard (primary)
- **Today** — greeting + date; KPI strip (stable / watch / at-risk / calls-done / visits-today); **"Needs your attention"** alerts feed; **caseload grid** of 5 elder cards (avatar, name, day/dx, risk pill, call status, today's 6 activity glyphs, top flag); **Today's visits** schedule; **Programme pulse** stats.
- **Caseload** — full grid of all elders, sorted by risk.
- **Visits** — day schedule, each row launches visit mode.
- **Elder detail (drawer)** — header (name, age, discharge, living, risk) + actions (start visit / call / add note); **risk banner** ("care signal" + why); **this-week activity calendar** (6 activities × 7 days, done/missed cells, today highlighted); **latest vitals**; **recent check-ins timeline** (call/family/visit events); **care plan checklist**; **family contact**.
- **Tablet visit mode** — full-screen, large touch targets: tap-to-check the 6 activities; notes textarea; photo slot; quick-flag chips; Save & sync.
- Alerts & Messages tabs (lightweight in pilot).

### Adult child — mobile app
Single reassuring **Today** screen: greeting; **status hero** (parent avatar, "She's okay today", call-done time); **one gentle note** if a flag is open (honest, calm, "nurse has been notified"); **plain-language call summary**; **today's 6 activities**; **this week's check-ins**; **"How you can help today"**; sticky **Call parent / Message nurse** actions. Bilingual toggle. Optimised for a busy adult, but still large and warm.

### Elder — no UI
Just receives the call. Build the **voice agent**: scheduling, Cantonese prompts, retry logic, answer→data mapping, transcript + summary generation. `Elder Call.html` demonstrates the script and the capture mapping.

---

## 7. Bilingual / i18n

- Every user-facing string ships in **English + 繁體中文 (HK Cantonese register)**. Data model stores `*En` / `*Zh` pairs (or an i18n key per locale).
- In-app **language toggle** on every surface (EN / 中), persisted per user. Default to 中文 for the call & family app; either for the dashboard.
- The **call is Cantonese-first**; transcripts stored bilingually for the worker.
- Use **Noto Sans HK** for Chinese, **Hanken Grotesk** for Latin (see tokens).

## 8. Accessibility & tone

- **Elder = maximum accessibility by removal** — no screen at all. Voice is slow, warm, one question at a time, repeats on request.
- **Family app** — min 15px body, large hero, 44px+ targets, plain language, never alarmist.
- **Dashboard** — calm density; colour never the only signal (pair with icon + label); **amber/red reserved strictly for triage** so they never lose meaning.
- Honest reassurance: when something's wrong, say so plainly *and* say it's handled.

## 9. Suggested stack

- **Frontend:** React + TypeScript; the prototype's `styles/system.css` tokens → Tailwind config or CSS vars. Web dashboard responsive down to tablet; family app as PWA or React Native.
- **Backend:** Postgres (schema above) + REST/tRPC; real-time updates (websockets) for the dashboard.
- **Voice:** telephony + TTS/STT with Cantonese support (e.g. a voice-agent platform) for the daily call; LLM to parse answers → `ActivityRecord`/`Flag` and to write the bilingual `summary`.
- **i18n:** key-based (e.g. i18next) with en + zh-HK bundles.
- **Compliance:** this is health data — plan for PDPO (HK) consent, access controls per role, audit log on every elder record view.

## 10. Build phases (HK pilot)

1. **M1 — Data + dashboard read path:** schema, seed 5 elders, Today + caseload + elder detail (read-only).
2. **M2 — The call:** voice agent, scheduling, answer→data mapping, summaries → live ActivityRecords/Flags.
3. **M3 — Worker actions:** alerts, visit mode (write), care plan, risk recompute.
4. **M4 — Family app:** status hero, summary, nudges, contact.
5. **M5 — Pilot hardening:** PDPO consent, audit, bilingual QA with real Cantonese speakers, escalation runbook.

## 11. Design tokens

Reuse `styles/system.css` verbatim. Key values:
- **Brand green** `oklch(0.56 0.108 158)` (~`#1F8A5B`); deep `oklch(0.44 0.098 158)`.
- **Triage:** stable = brand green · watch = amber `oklch(0.72 0.135 72)` · risk = red `oklch(0.575 0.165 27)`. Each has a matching tint bg.
- **Neutrals:** warm off-white bg `oklch(0.975 0.007 150)`, warm ink `oklch(0.27 0.013 158)`.
- **Type:** Hanken Grotesk (Latin) + Noto Sans HK (中文) + Spline Sans Mono (data/IDs).
- **Radius:** 8 / 14 / 20 / 28. **Shadows:** soft, low-saturation green-grey.
- Components in the prototype: `.pill` (status), `.btn`, `.avatar`, activity glyphs, week calendar, timeline, KPI cards.
