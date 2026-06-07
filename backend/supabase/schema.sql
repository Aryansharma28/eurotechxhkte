-- CareBridge 康橋 — Supabase schema + RLS
-- Run this in Supabase SQL editor (Dashboard → SQL Editor → New query)

-- ────────────────────────────────────────────
-- 1. Profiles (one row per auth.users entry)
-- ────────────────────────────────────────────
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null check (role in ('worker','family')),
  name_en     text,
  name_zh     text,
  created_at  timestamptz default now()
);
alter table profiles enable row level security;
create policy "users read own profile"  on profiles for select using (auth.uid() = id);
create policy "users update own profile" on profiles for update using (auth.uid() = id);

-- ────────────────────────────────────────────
-- 2. Workers
-- ────────────────────────────────────────────
create table if not exists workers (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  name_en     text not null,
  name_zh     text,
  role_en     text,
  role_zh     text,
  team        text,
  phone       text
);
alter table workers enable row level security;
create policy "worker sees own row" on workers for select using (profile_id = auth.uid());

-- ────────────────────────────────────────────
-- 3. Elders
-- ────────────────────────────────────────────
create table if not exists elders (
  id                  text primary key,  -- slug: 'wong','chan', etc.
  assigned_worker_id  uuid references workers(id) on delete set null,
  name_en             text not null,
  name_zh             text,
  age                 int,
  sex                 char(1),
  dx_en               text,
  dx_zh               text,
  discharge_date      date,
  day_since_discharge int generated always as (current_date - discharge_date) stored,
  risk_tier           text not null default 'stable' check (risk_tier in ('stable','watch','risk')),
  risk_note_en        text,
  risk_note_zh        text,
  lives_en            text,
  lives_zh            text,
  phone               text
);
alter table elders enable row level security;

-- Workers see their assigned elders
create policy "worker sees assigned elders" on elders for select
  using (assigned_worker_id in (select id from workers where profile_id = auth.uid()));

-- Workers can update risk tier / notes
create policy "worker updates elders" on elders for update
  using (assigned_worker_id in (select id from workers where profile_id = auth.uid()));

-- Family members see their linked elder
create policy "family sees linked elder" on elders for select
  using (id in (select elder_id from family_members where profile_id = auth.uid()));

-- ────────────────────────────────────────────
-- 4. Family members
-- ────────────────────────────────────────────
create table if not exists family_members (
  id              uuid primary key default gen_random_uuid(),
  elder_id        text not null references elders(id) on delete cascade,
  profile_id      uuid references profiles(id) on delete set null,
  name_en         text,
  name_zh         text,
  relationship_en text,
  phone           text
);
alter table family_members enable row level security;
create policy "family sees own row" on family_members for select using (profile_id = auth.uid());
create policy "worker sees family of their elders" on family_members for select
  using (elder_id in (select id from elders where assigned_worker_id in (select id from workers where profile_id = auth.uid())));

-- ────────────────────────────────────────────
-- 5. Daily calls
-- ────────────────────────────────────────────
create table if not exists daily_calls (
  id              uuid primary key default gen_random_uuid(),
  elder_id        text not null references elders(id) on delete cascade,
  scheduled_at    timestamptz not null default now(),
  completed_at    timestamptz,
  state           text not null default 'scheduled' check (state in ('scheduled','done','missed')),
  channel         text default 'voice-agent',
  summary_en      text,
  summary_zh      text,
  created_at      timestamptz default now()
);
alter table daily_calls enable row level security;
create policy "worker reads calls for their elders" on daily_calls for select
  using (elder_id in (select id from elders where assigned_worker_id in (select id from workers where profile_id = auth.uid())));
create policy "family reads calls for their elder" on daily_calls for select
  using (elder_id in (select elder_id from family_members where profile_id = auth.uid()));

-- ────────────────────────────────────────────
-- 6. Activity records
-- ────────────────────────────────────────────
create table if not exists activity_records (
  id            uuid primary key default gen_random_uuid(),
  elder_id      text not null references elders(id) on delete cascade,
  record_date   date not null default current_date,
  activity_key  text not null check (activity_key in ('med','meal','walk','water','sleep','mood')),
  status        text not null default 'pending' check (status in ('done','missed','pending')),
  source        text default 'call' check (source in ('call','family','visit')),
  note          text,
  created_at    timestamptz default now(),
  unique (elder_id, record_date, activity_key)
);
alter table activity_records enable row level security;
create policy "worker reads activity for their elders" on activity_records for select
  using (elder_id in (select id from elders where assigned_worker_id in (select id from workers where profile_id = auth.uid())));
create policy "worker inserts/updates activity" on activity_records for all
  using (elder_id in (select id from elders where assigned_worker_id in (select id from workers where profile_id = auth.uid())));
create policy "family reads activity for their elder" on activity_records for select
  using (elder_id in (select elder_id from family_members where profile_id = auth.uid()));

-- ────────────────────────────────────────────
-- 7. Flags
-- ────────────────────────────────────────────
create table if not exists flags (
  id          uuid primary key default gen_random_uuid(),
  elder_id    text not null references elders(id) on delete cascade,
  kind        text,
  severity    text not null check (severity in ('watch','risk')),
  label_en    text,
  label_zh    text,
  raised_at   timestamptz default now(),
  source      text,
  resolved    boolean default false,
  resolved_at timestamptz
);
alter table flags enable row level security;
create policy "worker reads flags for their elders" on flags for select
  using (elder_id in (select id from elders where assigned_worker_id in (select id from workers where profile_id = auth.uid())));
create policy "worker updates flags" on flags for update
  using (elder_id in (select id from elders where assigned_worker_id in (select id from workers where profile_id = auth.uid())));
create policy "family reads flags for their elder" on flags for select
  using (elder_id in (select elder_id from family_members where profile_id = auth.uid()));

-- ────────────────────────────────────────────
-- 8. Vitals
-- ────────────────────────────────────────────
create table if not exists vitals (
  id            uuid primary key default gen_random_uuid(),
  elder_id      text not null references elders(id) on delete cascade,
  vital_key     text not null,
  value         text,
  trend         text,
  status        text check (status in ('ok','watch','risk')),
  measured_at   timestamptz default now()
);
alter table vitals enable row level security;
create policy "worker reads vitals for their elders" on vitals for select
  using (elder_id in (select id from elders where assigned_worker_id in (select id from workers where profile_id = auth.uid())));
create policy "family reads vitals for their elder" on vitals for select
  using (elder_id in (select elder_id from family_members where profile_id = auth.uid()));

-- ────────────────────────────────────────────
-- 9. Visits
-- ────────────────────────────────────────────
create table if not exists visits (
  id              uuid primary key default gen_random_uuid(),
  elder_id        text not null references elders(id) on delete cascade,
  worker_id       uuid references workers(id) on delete set null,
  scheduled_at    timestamptz,
  type_en         text,
  type_zh         text,
  location        text,
  state           text not null default 'upcoming' check (state in ('due','upcoming','done')),
  notes           text,
  quick_flags     text[],
  checked_acts    text[],
  created_at      timestamptz default now()
);
alter table visits enable row level security;
create policy "worker reads own visits" on visits for select
  using (worker_id in (select id from workers where profile_id = auth.uid()));
create policy "worker inserts visits" on visits for insert
  with check (worker_id in (select id from workers where profile_id = auth.uid()));
create policy "worker updates visits" on visits for update
  using (worker_id in (select id from workers where profile_id = auth.uid()));

-- ────────────────────────────────────────────
-- 10. Care plan items
-- ────────────────────────────────────────────
create table if not exists care_plan_items (
  id          uuid primary key default gen_random_uuid(),
  elder_id    text not null references elders(id) on delete cascade,
  text_en     text,
  text_zh     text,
  done        boolean default false,
  due_date    date
);
alter table care_plan_items enable row level security;
create policy "worker reads plan for their elders" on care_plan_items for select
  using (elder_id in (select id from elders where assigned_worker_id in (select id from workers where profile_id = auth.uid())));
create policy "worker updates plan" on care_plan_items for update
  using (elder_id in (select id from elders where assigned_worker_id in (select id from workers where profile_id = auth.uid())));
create policy "family reads plan for their elder" on care_plan_items for select
  using (elder_id in (select elder_id from family_members where profile_id = auth.uid()));
