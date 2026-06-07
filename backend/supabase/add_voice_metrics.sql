-- CareBridge — optional: persist real per-call voice metrics on daily_calls.
-- Run in Supabase SQL editor. The check-in writer (src/services/checkin.ts) fills these
-- in best-effort; if you skip this migration the core call loop still works, the metrics
-- just aren't stored. These are REAL measured values (acoustic pause ratio), not the
-- illustrative sample charts currently shown in the UI.

alter table daily_calls add column if not exists pause_ratio      numeric;  -- silence / total, 0..1
alter table daily_calls add column if not exists speech_ms        integer;  -- measured speaking time, ms
alter table daily_calls add column if not exists parkinson_signal            integer;  -- 0–100, derived from jitter/shimmer/pitch/rms
alter table daily_calls add column if not exists neurological_decline_signal integer;  -- 0–100, broad cognitive/vocal deterioration signal
alter table daily_calls add column if not exists rate             integer;  -- speech rate proxy (wpm)
alter table daily_calls add column if not exists pitch            numeric;  -- pitch range (semitones)
alter table daily_calls add column if not exists tremor           numeric;  -- tremor index 0–10
alter table daily_calls add column if not exists fluency          integer;  -- fluency score 0–100
