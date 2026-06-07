-- CareBridge — optional: persist real per-call voice metrics on daily_calls.
-- Run in Supabase SQL editor. The check-in writer (src/services/checkin.ts) fills these
-- in best-effort; if you skip this migration the core call loop still works, the metrics
-- just aren't stored. These are REAL measured values (acoustic pause ratio), not the
-- illustrative sample charts currently shown in the UI.

alter table daily_calls add column if not exists pause_ratio numeric;  -- silence / total, 0..1
alter table daily_calls add column if not exists speech_ms   integer;  -- measured speaking time, ms
