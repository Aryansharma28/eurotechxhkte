-- ============================================================
-- CareBridge 康橋 — FULL SETUP: schema + seed
-- Paste this entire file into Supabase SQL Editor and click Run.
-- ============================================================

-- ── 1. Create all tables first (no cross-table policies yet) ─────────────────

create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text not null check (role in ('worker','family')),
  name_en    text,
  name_zh    text,
  created_at timestamptz default now()
);

create table if not exists workers (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  name_en    text not null,
  name_zh    text,
  role_en    text,
  role_zh    text,
  team       text,
  unique(profile_id)
);

create table if not exists elders (
  id                 text primary key,
  assigned_worker_id uuid references workers(id) on delete set null,
  name_en            text not null,
  name_zh            text,
  age                int,
  sex                char(1),
  dx_en              text,
  dx_zh              text,
  discharge_date     date,
  risk_tier          text not null default 'stable' check (risk_tier in ('stable','watch','risk')),
  risk_note_en       text,
  risk_note_zh       text,
  lives_en           text,
  lives_zh           text,
  phone              text
);

create table if not exists family_members (
  id              uuid primary key default gen_random_uuid(),
  elder_id        text not null references elders(id) on delete cascade,
  profile_id      uuid references profiles(id) on delete set null,
  name_en         text,
  name_zh         text,
  relationship_en text,
  phone           text,
  unique(elder_id, profile_id)
);

create table if not exists daily_calls (
  id           uuid primary key default gen_random_uuid(),
  elder_id     text not null references elders(id) on delete cascade,
  scheduled_at timestamptz not null default now(),
  completed_at timestamptz,
  state        text not null default 'scheduled' check (state in ('scheduled','done','missed')),
  channel      text default 'voice-agent',
  summary_en   text,
  summary_zh   text,
  created_at   timestamptz default now()
);

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

create table if not exists vitals (
  id          uuid primary key default gen_random_uuid(),
  elder_id    text not null references elders(id) on delete cascade,
  vital_key   text not null,
  value       text,
  trend       text,
  status      text check (status in ('ok','watch','risk')),
  measured_at timestamptz default now()
);

create table if not exists visits (
  id           uuid primary key default gen_random_uuid(),
  elder_id     text not null references elders(id) on delete cascade,
  worker_id    uuid references workers(id) on delete set null,
  scheduled_at timestamptz,
  type_en      text,
  type_zh      text,
  location     text,
  state        text not null default 'upcoming' check (state in ('due','upcoming','done')),
  notes        text,
  quick_flags  text[],
  checked_acts text[],
  created_at   timestamptz default now()
);

create table if not exists care_plan_items (
  id       uuid primary key default gen_random_uuid(),
  elder_id text not null references elders(id) on delete cascade,
  text_en  text,
  text_zh  text,
  done     boolean default false,
  due_date date
);

-- ── 2. Enable RLS on all tables ───────────────────────────────────────────────

alter table profiles         enable row level security;
alter table workers          enable row level security;
alter table elders           enable row level security;
alter table family_members   enable row level security;
alter table daily_calls      enable row level security;
alter table activity_records enable row level security;
alter table flags            enable row level security;
alter table vitals           enable row level security;
alter table visits           enable row level security;
alter table care_plan_items  enable row level security;

-- ── 3. RLS policies (all tables exist now) ────────────────────────────────────

-- profiles
drop policy if exists "users read own profile"   on profiles;
drop policy if exists "users update own profile" on profiles;
create policy "users read own profile"   on profiles for select using (auth.uid() = id);
create policy "users update own profile" on profiles for update using (auth.uid() = id);

-- workers
drop policy if exists "worker sees own row" on workers;
create policy "worker sees own row" on workers for select using (profile_id = auth.uid());

-- elders — worker branch
drop policy if exists "worker sees assigned elders" on elders;
drop policy if exists "worker updates elders"       on elders;
drop policy if exists "family sees linked elder"    on elders;
create policy "worker sees assigned elders" on elders for select
  using (assigned_worker_id in (select id from workers where profile_id = auth.uid()));
create policy "worker updates elders" on elders for update
  using (assigned_worker_id in (select id from workers where profile_id = auth.uid()));
-- elders — family branch (family_members exists now)
create policy "family sees linked elder" on elders for select
  using (id in (select elder_id from family_members where profile_id = auth.uid()));

-- family_members
drop policy if exists "family sees own row"                on family_members;
drop policy if exists "worker sees family of their elders" on family_members;
create policy "family sees own row" on family_members for select using (profile_id = auth.uid());
create policy "worker sees family of their elders" on family_members for select
  using (elder_id in (select id from elders where assigned_worker_id in (select id from workers where profile_id = auth.uid())));

-- daily_calls
drop policy if exists "worker reads calls" on daily_calls;
drop policy if exists "family reads calls" on daily_calls;
create policy "worker reads calls" on daily_calls for select
  using (elder_id in (select id from elders where assigned_worker_id in (select id from workers where profile_id = auth.uid())));
create policy "family reads calls" on daily_calls for select
  using (elder_id in (select elder_id from family_members where profile_id = auth.uid()));

-- activity_records
drop policy if exists "worker reads activity"           on activity_records;
drop policy if exists "worker inserts/updates activity" on activity_records;
drop policy if exists "family reads activity"           on activity_records;
create policy "worker reads activity" on activity_records for select
  using (elder_id in (select id from elders where assigned_worker_id in (select id from workers where profile_id = auth.uid())));
create policy "worker inserts/updates activity" on activity_records for all
  using (elder_id in (select id from elders where assigned_worker_id in (select id from workers where profile_id = auth.uid())));
create policy "family reads activity" on activity_records for select
  using (elder_id in (select elder_id from family_members where profile_id = auth.uid()));

-- flags
drop policy if exists "worker reads flags"   on flags;
drop policy if exists "worker updates flags" on flags;
drop policy if exists "family reads flags"   on flags;
create policy "worker reads flags" on flags for select
  using (elder_id in (select id from elders where assigned_worker_id in (select id from workers where profile_id = auth.uid())));
create policy "worker updates flags" on flags for update
  using (elder_id in (select id from elders where assigned_worker_id in (select id from workers where profile_id = auth.uid())));
create policy "family reads flags" on flags for select
  using (elder_id in (select elder_id from family_members where profile_id = auth.uid()));

-- vitals
drop policy if exists "worker reads vitals" on vitals;
drop policy if exists "family reads vitals" on vitals;
create policy "worker reads vitals" on vitals for select
  using (elder_id in (select id from elders where assigned_worker_id in (select id from workers where profile_id = auth.uid())));
create policy "family reads vitals" on vitals for select
  using (elder_id in (select elder_id from family_members where profile_id = auth.uid()));

-- visits
drop policy if exists "worker reads own visits" on visits;
drop policy if exists "worker inserts visits"   on visits;
drop policy if exists "worker updates visits"   on visits;
create policy "worker reads own visits" on visits for select
  using (worker_id in (select id from workers where profile_id = auth.uid()));
create policy "worker inserts visits" on visits for insert
  with check (worker_id in (select id from workers where profile_id = auth.uid()));
create policy "worker updates visits" on visits for update
  using (worker_id in (select id from workers where profile_id = auth.uid()));

-- care_plan_items
drop policy if exists "worker reads plan"   on care_plan_items;
drop policy if exists "worker updates plan" on care_plan_items;
drop policy if exists "family reads plan"   on care_plan_items;
create policy "worker reads plan" on care_plan_items for select
  using (elder_id in (select id from elders where assigned_worker_id in (select id from workers where profile_id = auth.uid())));
create policy "worker updates plan" on care_plan_items for update
  using (elder_id in (select id from elders where assigned_worker_id in (select id from workers where profile_id = auth.uid())));
create policy "family reads plan" on care_plan_items for select
  using (elder_id in (select elder_id from family_members where profile_id = auth.uid()));

-- ── 4. Seed data ──────────────────────────────────────────────────────────────

do $$
declare
  karen_id      uuid;
  wong_fam_id   uuid;
  chan_fam_id   uuid;
  lee_fam_id    uuid;
  cheung_fam_id uuid;
  ho_fam_id     uuid;
  worker_row_id uuid;
begin

  -- Worker: karen@carebridge.hk / hackathon123
  select id into karen_id from auth.users where email = 'karen@carebridge.hk';
  if karen_id is null then
    karen_id := gen_random_uuid();
    insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, aud, role)
    values (karen_id, 'karen@carebridge.hk',
      crypt('hackathon123', gen_salt('bf')), now(),
      '{"role":"worker","name_en":"Karen Tsang","name_zh":"曾家欣"}'::jsonb,
      now(), now(), 'authenticated', 'authenticated');
  end if;
  insert into profiles (id, role, name_en, name_zh)
    values (karen_id, 'worker', 'Karen Tsang', '曾家欣')
    on conflict (id) do nothing;
  insert into workers (profile_id, name_en, name_zh, role_en, role_zh, team)
    values (karen_id, 'Karen Tsang', '曾家欣', 'Community geriatric nurse', '社區老人科護士', 'Kowloon East Transitional Care')
    on conflict (profile_id) do nothing;
  select id into worker_row_id from workers where profile_id = karen_id;

  -- Elders
  insert into elders (id, assigned_worker_id, name_en, name_zh, age, sex, dx_en, dx_zh, discharge_date, risk_tier, risk_note_en, risk_note_zh, lives_en, lives_zh) values
    ('wong',   worker_row_id, 'Wong Mei-ling',   '黃美玲', 78, 'F', 'Pneumonia + COPD',          '肺炎 · 慢阻肺病',    current_date - 8,  'watch',  'Dizziness + lives alone. Falls risk.',             '頭暈加獨居，持續或有跌倒風險。',       'Lives alone · Sham Shui Po',    '獨居 · 深水埗'),
    ('chan',   worker_row_id, 'Chan Kwok-keung', '陳國強', 82, 'M', 'Congestive heart failure',  '充血性心臟衰竭',    current_date - 4,  'risk',   'Day 4 CHF, weight up 1.8 kg, missed call.',        '出院第4天，3日體重升1.8公斤兼未接電話。','Lives with spouse · Kwun Tong', '與配偶同住 · 觀塘'),
    ('lee',    worker_row_id, 'Lee Sau-ying',    '李秀英', 75, 'F', 'Hip fracture — post-op',    '髖部骨折 · 術後',  current_date - 15, 'stable', 'Recovering well.',                                  '復原良好，維持活動進度。',             'Lives with son · Tseung Kwan O','與兒子同住 · 將軍澳'),
    ('cheung', worker_row_id, 'Cheung Chi-ming', '張志明', 80, 'M', 'Stroke recovery + diabetes','中風復康 · 糖尿病',current_date - 11, 'watch',  'Meds slipping (3 misses this week) + diabetic.',   '服藥依從性下降（本週漏3次）兼糖尿。',  'Lives alone · Wong Tai Sin',    '獨居 · 黃大仙'),
    ('ho',     worker_row_id, 'Ho Yuen-wah',     '何婉華', 71, 'F', 'Post-op + recurrent UTI',   '術後 · 反覆尿道炎',current_date - 21, 'stable', 'Stable, near graduation. Reinforce hydration.',    '穩定，接近結案，加強飲水。',           'Lives with spouse · Tai Po',    '與配偶同住 · 大埔')
  on conflict (id) do update set assigned_worker_id = excluded.assigned_worker_id, risk_tier = excluded.risk_tier;

  -- Family users
  select id into wong_fam_id   from auth.users where email = 'family-wong@carebridge.hk';
  select id into chan_fam_id   from auth.users where email = 'family-chan@carebridge.hk';
  select id into lee_fam_id    from auth.users where email = 'family-lee@carebridge.hk';
  select id into cheung_fam_id from auth.users where email = 'family-cheung@carebridge.hk';
  select id into ho_fam_id     from auth.users where email = 'family-ho@carebridge.hk';

  if wong_fam_id is null then
    wong_fam_id := gen_random_uuid();
    insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, aud, role)
    values (wong_fam_id,'family-wong@carebridge.hk',crypt('hackathon123',gen_salt('bf')),now(),'{"role":"family","name_en":"Wong Ka-yan","name_zh":"黃嘉欣"}'::jsonb,now(),now(),'authenticated','authenticated');
  end if;
  if chan_fam_id is null then
    chan_fam_id := gen_random_uuid();
    insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, aud, role)
    values (chan_fam_id,'family-chan@carebridge.hk',crypt('hackathon123',gen_salt('bf')),now(),'{"role":"family","name_en":"Chan Wai-man","name_zh":"陳偉文"}'::jsonb,now(),now(),'authenticated','authenticated');
  end if;
  if lee_fam_id is null then
    lee_fam_id := gen_random_uuid();
    insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, aud, role)
    values (lee_fam_id,'family-lee@carebridge.hk',crypt('hackathon123',gen_salt('bf')),now(),'{"role":"family","name_en":"Lee Chun-hei","name_zh":"李俊熙"}'::jsonb,now(),now(),'authenticated','authenticated');
  end if;
  if cheung_fam_id is null then
    cheung_fam_id := gen_random_uuid();
    insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, aud, role)
    values (cheung_fam_id,'family-cheung@carebridge.hk',crypt('hackathon123',gen_salt('bf')),now(),'{"role":"family","name_en":"Cheung Mei","name_zh":"張薇"}'::jsonb,now(),now(),'authenticated','authenticated');
  end if;
  if ho_fam_id is null then
    ho_fam_id := gen_random_uuid();
    insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, aud, role)
    values (ho_fam_id,'family-ho@carebridge.hk',crypt('hackathon123',gen_salt('bf')),now(),'{"role":"family","name_en":"Ho Lai-fong","name_zh":"何麗芳"}'::jsonb,now(),now(),'authenticated','authenticated');
  end if;

  insert into profiles (id, role, name_en, name_zh) values
    (wong_fam_id,   'family', 'Wong Ka-yan',  '黃嘉欣'),
    (chan_fam_id,   'family', 'Chan Wai-man', '陳偉文'),
    (lee_fam_id,    'family', 'Lee Chun-hei', '李俊熙'),
    (cheung_fam_id, 'family', 'Cheung Mei',   '張薇'),
    (ho_fam_id,     'family', 'Ho Lai-fong',  '何麗芳')
  on conflict (id) do nothing;

  insert into family_members (elder_id, profile_id, name_en, name_zh, relationship_en, phone) values
    ('wong',   wong_fam_id,   'Wong Ka-yan',  '黃嘉欣', 'daughter', '+852 9123 4567'),
    ('chan',   chan_fam_id,   'Chan Wai-man', '陳偉文', 'son',      '+852 9876 5432'),
    ('lee',    lee_fam_id,    'Lee Chun-hei', '李俊熙', 'son',      '+852 9555 1212'),
    ('cheung', cheung_fam_id, 'Cheung Mei',   '張薇',   'daughter', '+852 9333 8080'),
    ('ho',     ho_fam_id,     'Ho Lai-fong',  '何麗芳', 'daughter', '+852 9444 2323')
  on conflict (elder_id, profile_id) do nothing;

  -- Activity records (7 days x 6 activities per elder)
  insert into activity_records (elder_id, record_date, activity_key, status, source) values
    ('wong',current_date-6,'med','done','call'),('wong',current_date-6,'meal','done','call'),('wong',current_date-6,'walk','done','call'),('wong',current_date-6,'water','done','call'),('wong',current_date-6,'sleep','done','call'),('wong',current_date-6,'mood','done','call'),
    ('wong',current_date-5,'med','done','call'),('wong',current_date-5,'meal','done','call'),('wong',current_date-5,'walk','done','call'),('wong',current_date-5,'water','done','call'),('wong',current_date-5,'sleep','missed','call'),('wong',current_date-5,'mood','done','call'),
    ('wong',current_date-4,'med','done','call'),('wong',current_date-4,'meal','done','call'),('wong',current_date-4,'walk','missed','call'),('wong',current_date-4,'water','done','call'),('wong',current_date-4,'sleep','done','call'),('wong',current_date-4,'mood','done','call'),
    ('wong',current_date-3,'med','done','call'),('wong',current_date-3,'meal','done','call'),('wong',current_date-3,'walk','done','call'),('wong',current_date-3,'water','missed','call'),('wong',current_date-3,'sleep','done','call'),('wong',current_date-3,'mood','done','call'),
    ('wong',current_date-2,'med','done','call'),('wong',current_date-2,'meal','done','call'),('wong',current_date-2,'walk','done','call'),('wong',current_date-2,'water','done','call'),('wong',current_date-2,'sleep','missed','call'),('wong',current_date-2,'mood','done','call'),
    ('wong',current_date-1,'med','done','call'),('wong',current_date-1,'meal','done','call'),('wong',current_date-1,'walk','done','call'),('wong',current_date-1,'water','done','call'),('wong',current_date-1,'sleep','done','call'),('wong',current_date-1,'mood','missed','call'),
    ('wong',current_date,  'med','done','call'),('wong',current_date,  'meal','done','call'),('wong',current_date,  'walk','missed','call'),('wong',current_date,  'water','done','call'),('wong',current_date,  'sleep','done','call'),('wong',current_date,  'mood','missed','call'),
    ('chan',current_date-6,'med','done','call'),('chan',current_date-6,'meal','done','call'),('chan',current_date-6,'walk','done','call'),('chan',current_date-6,'water','done','call'),('chan',current_date-6,'sleep','done','call'),('chan',current_date-6,'mood','done','call'),
    ('chan',current_date-5,'med','done','call'),('chan',current_date-5,'meal','done','call'),('chan',current_date-5,'walk','missed','call'),('chan',current_date-5,'water','done','call'),('chan',current_date-5,'sleep','done','call'),('chan',current_date-5,'mood','done','call'),
    ('chan',current_date-4,'med','done','call'),('chan',current_date-4,'meal','done','call'),('chan',current_date-4,'walk','missed','call'),('chan',current_date-4,'water','missed','call'),('chan',current_date-4,'sleep','missed','call'),('chan',current_date-4,'mood','done','call'),
    ('chan',current_date-3,'med','missed','call'),('chan',current_date-3,'meal','done','call'),('chan',current_date-3,'walk','done','call'),('chan',current_date-3,'water','done','call'),('chan',current_date-3,'sleep','missed','call'),('chan',current_date-3,'mood','missed','call'),
    ('chan',current_date-2,'med','done','call'),('chan',current_date-2,'meal','missed','call'),('chan',current_date-2,'walk','missed','call'),('chan',current_date-2,'water','missed','call'),('chan',current_date-2,'sleep','done','call'),('chan',current_date-2,'mood','missed','call'),
    ('chan',current_date-1,'med','missed','call'),('chan',current_date-1,'meal','done','call'),('chan',current_date-1,'walk','missed','call'),('chan',current_date-1,'water','missed','call'),('chan',current_date-1,'sleep','missed','call'),('chan',current_date-1,'mood','missed','call'),
    ('chan',current_date,  'med','missed','call'),('chan',current_date,  'meal','missed','call'),('chan',current_date,  'walk','missed','call'),('chan',current_date,  'water','missed','call'),('chan',current_date,  'sleep','missed','call'),('chan',current_date,  'mood','missed','call'),
    ('lee',current_date-6,'med','done','call'),('lee',current_date-6,'meal','done','call'),('lee',current_date-6,'walk','done','call'),('lee',current_date-6,'water','done','call'),('lee',current_date-6,'sleep','done','call'),('lee',current_date-6,'mood','done','call'),
    ('lee',current_date-5,'med','done','call'),('lee',current_date-5,'meal','done','call'),('lee',current_date-5,'walk','done','call'),('lee',current_date-5,'water','done','call'),('lee',current_date-5,'sleep','done','call'),('lee',current_date-5,'mood','done','call'),
    ('lee',current_date-4,'med','done','call'),('lee',current_date-4,'meal','done','call'),('lee',current_date-4,'walk','done','call'),('lee',current_date-4,'water','done','call'),('lee',current_date-4,'sleep','done','call'),('lee',current_date-4,'mood','done','call'),
    ('lee',current_date-3,'med','done','call'),('lee',current_date-3,'meal','done','call'),('lee',current_date-3,'walk','done','call'),('lee',current_date-3,'water','done','call'),('lee',current_date-3,'sleep','done','call'),('lee',current_date-3,'mood','done','call'),
    ('lee',current_date-2,'med','done','call'),('lee',current_date-2,'meal','done','call'),('lee',current_date-2,'walk','done','call'),('lee',current_date-2,'water','done','call'),('lee',current_date-2,'sleep','missed','call'),('lee',current_date-2,'mood','done','call'),
    ('lee',current_date-1,'med','done','call'),('lee',current_date-1,'meal','done','call'),('lee',current_date-1,'walk','done','call'),('lee',current_date-1,'water','done','call'),('lee',current_date-1,'sleep','done','call'),('lee',current_date-1,'mood','done','call'),
    ('lee',current_date,  'med','done','call'),('lee',current_date,  'meal','done','call'),('lee',current_date,  'walk','done','call'),('lee',current_date,  'water','done','call'),('lee',current_date,  'sleep','done','call'),('lee',current_date,  'mood','done','call'),
    ('cheung',current_date-6,'med','done','call'),('cheung',current_date-6,'meal','done','call'),('cheung',current_date-6,'walk','done','call'),('cheung',current_date-6,'water','done','call'),('cheung',current_date-6,'sleep','done','call'),('cheung',current_date-6,'mood','done','call'),
    ('cheung',current_date-5,'med','missed','call'),('cheung',current_date-5,'meal','done','call'),('cheung',current_date-5,'walk','done','call'),('cheung',current_date-5,'water','done','call'),('cheung',current_date-5,'sleep','done','call'),('cheung',current_date-5,'mood','done','call'),
    ('cheung',current_date-4,'med','done','call'),('cheung',current_date-4,'meal','done','call'),('cheung',current_date-4,'walk','done','call'),('cheung',current_date-4,'water','done','call'),('cheung',current_date-4,'sleep','done','call'),('cheung',current_date-4,'mood','done','call'),
    ('cheung',current_date-3,'med','done','call'),('cheung',current_date-3,'meal','done','call'),('cheung',current_date-3,'walk','missed','call'),('cheung',current_date-3,'water','done','call'),('cheung',current_date-3,'sleep','done','call'),('cheung',current_date-3,'mood','done','call'),
    ('cheung',current_date-2,'med','missed','call'),('cheung',current_date-2,'meal','done','call'),('cheung',current_date-2,'walk','done','call'),('cheung',current_date-2,'water','done','call'),('cheung',current_date-2,'sleep','done','call'),('cheung',current_date-2,'mood','done','call'),
    ('cheung',current_date-1,'med','done','call'),('cheung',current_date-1,'meal','done','call'),('cheung',current_date-1,'walk','done','call'),('cheung',current_date-1,'water','done','call'),('cheung',current_date-1,'sleep','missed','call'),('cheung',current_date-1,'mood','done','call'),
    ('cheung',current_date,  'med','missed','call'),('cheung',current_date,'meal','done','call'),('cheung',current_date,'walk','done','call'),('cheung',current_date,'water','done','call'),('cheung',current_date,'sleep','done','call'),('cheung',current_date,'mood','done','call'),
    ('ho',current_date-6,'med','done','call'),('ho',current_date-6,'meal','done','call'),('ho',current_date-6,'walk','done','call'),('ho',current_date-6,'water','done','call'),('ho',current_date-6,'sleep','done','call'),('ho',current_date-6,'mood','done','call'),
    ('ho',current_date-5,'med','done','call'),('ho',current_date-5,'meal','done','call'),('ho',current_date-5,'walk','done','call'),('ho',current_date-5,'water','done','call'),('ho',current_date-5,'sleep','done','call'),('ho',current_date-5,'mood','done','call'),
    ('ho',current_date-4,'med','done','call'),('ho',current_date-4,'meal','done','call'),('ho',current_date-4,'walk','done','call'),('ho',current_date-4,'water','done','call'),('ho',current_date-4,'sleep','done','call'),('ho',current_date-4,'mood','done','call'),
    ('ho',current_date-3,'med','done','call'),('ho',current_date-3,'meal','done','call'),('ho',current_date-3,'walk','done','call'),('ho',current_date-3,'water','done','call'),('ho',current_date-3,'sleep','done','call'),('ho',current_date-3,'mood','done','call'),
    ('ho',current_date-2,'med','done','call'),('ho',current_date-2,'meal','done','call'),('ho',current_date-2,'walk','done','call'),('ho',current_date-2,'water','done','call'),('ho',current_date-2,'sleep','done','call'),('ho',current_date-2,'mood','done','call'),
    ('ho',current_date-1,'med','done','call'),('ho',current_date-1,'meal','done','call'),('ho',current_date-1,'walk','done','call'),('ho',current_date-1,'water','done','call'),('ho',current_date-1,'sleep','done','call'),('ho',current_date-1,'mood','done','call'),
    ('ho',current_date,  'med','done','call'),('ho',current_date,'meal','done','call'),('ho',current_date,'walk','done','call'),('ho',current_date,'water','done','call'),('ho',current_date,'sleep','done','call'),('ho',current_date,'mood','done','call')
  on conflict (elder_id, record_date, activity_key) do nothing;

  -- Flags
  insert into flags (elder_id, kind, severity, label_en, label_zh, source, resolved) values
    ('chan',  'missed-call', 'risk',  'Missed daily call — 2 attempts, no answer',       '未接每日電話 — 已試兩次無人接聽',  'call', false),
    ('chan',  'weight-gain', 'risk',  'Weight up 1.8 kg in 3 days — possible fluid overload','3日內體重升1.8公斤，疑似積水', 'call', false),
    ('wong', 'dizziness',   'watch', 'Reported mild dizziness when standing',            '起身時感輕微頭暈',               'call', false),
    ('cheung','missed-meds','watch', 'Missed morning medication — 3rd time this week',   '漏服早上藥物 — 本週第3次',        'call', false);

  -- Vitals
  insert into vitals (elder_id, vital_key, value, trend, status) values
    ('wong',  'SpO₂',   '94%',      null, 'watch'),
    ('wong',  'Temp',   '37.1°C',   null, 'ok'),
    ('wong',  'HR',     '82 bpm',   null, 'ok'),
    ('chan',  'Weight', '+1.8 kg',  'up', 'risk'),
    ('chan',  'BP',     '152/94',   null, 'watch'),
    ('chan',  'HR',     '98 bpm',   null, 'watch'),
    ('lee',   'Pain',   '2 / 10',  null, 'ok'),
    ('lee',   'Steps',  '1,240',   null, 'ok'),
    ('lee',   'BP',     '128/80',  null, 'ok'),
    ('cheung','Glucose','9.8 mmol',null, 'watch'),
    ('cheung','BP',     '138/86',  null, 'ok'),
    ('cheung','Adher.', '71%',     null, 'watch'),
    ('ho',   'Temp',   '36.6°C',  null, 'ok'),
    ('ho',   'Fluid',  '1.8 L',   null, 'ok'),
    ('ho',   'BP',     '122/78',  null, 'ok');

  -- Today's visits
  insert into visits (elder_id, worker_id, scheduled_at, type_en, type_zh, location, state) values
    ('chan',   worker_row_id, (current_date + interval '11 hours'),          'Urgent home visit', '緊急家訪', 'Kwun Tong',    'due'),
    ('wong',   worker_row_id, (current_date + interval '14 hours 30 minutes'),'Routine check-in', '例行家訪', 'Sham Shui Po', 'upcoming'),
    ('cheung', worker_row_id, (current_date + interval '16 hours'),           'Pillbox setup',    '藥盒安排', 'Wong Tai Sin', 'upcoming');

  -- Care plan items
  insert into care_plan_items (elder_id, text_en, done) values
    ('wong',  'Daily inhaler — 2 puffs morning & night', true),
    ('wong',  'Pulmonary rehab breathing exercise x3/day', false),
    ('wong',  'Follow-up chest clinic — 18 Jun', false),
    ('chan',  'Daily weight — same time, before breakfast', false),
    ('chan',  'Diuretic (furosemide) — morning', false),
    ('chan',  'Low-salt diet — under 2g/day', true),
    ('chan',  'Cardiology follow-up — 12 Jun', false),
    ('lee',   'Physiotherapy walk x2/day with frame', true),
    ('lee',   'Calcium + vitamin D — daily', true),
    ('lee',   'Ortho follow-up — 25 Jun', false),
    ('cheung','Metformin — twice daily with meals', false),
    ('cheung','Blood glucose check — morning', true),
    ('cheung','Speech therapy x2/week', true),
    ('cheung','Neuro follow-up — 20 Jun', false),
    ('ho',   'Hydration — 1.5L+ per day', true),
    ('ho',   'Complete antibiotic course', true),
    ('ho',   'Discharge from programme — 28 Jun', false);

  -- Daily calls
  insert into daily_calls (elder_id, scheduled_at, completed_at, state, summary_en, summary_zh) values
    ('wong',  current_date + interval '9 hours 32 minutes',   current_date + interval '9 hours 32 minutes',   'done',   'Took inhaler and ate congee. Felt dizzy when standing. Otherwise okay.', '已用吸入器，食咗粥。起身時感頭暈，其他情況正常。'),
    ('chan',  current_date + interval '9 hours 10 minutes',   null,                                            'missed', 'Daily call not answered — 2 attempts made.',                              '每日電話無人接聽 — 已試兩次。'),
    ('lee',   current_date + interval '9 hours 5 minutes',    current_date + interval '9 hours 5 minutes',    'done',   'Walked to lift lobby twice. Sleeping well. Good spirits.',                '行到電梯大堂來回兩次，睡得好，心情不錯。'),
    ('cheung',current_date + interval '9 hours 48 minutes',   current_date + interval '9 hours 48 minutes',   'done',   'Forgot morning pills again. Reminded. Daughter to set pillbox.',          '再次漏食早上藥，已提醒，女兒將安排藥盒。'),
    ('ho',   current_date + interval '10 hours 15 minutes',  current_date + interval '10 hours 15 minutes',  'done',   'Feeling great, no symptoms. On track to graduate next week.',             '狀態極好，無症狀，下週可結案。');

end $$;

-- Done
select 'CareBridge seed complete' as result;

select info from (values
  ('Demo logins — password for all: hackathon123'),
  ('  Worker : karen@carebridge.hk'),
  ('  Family : family-wong@carebridge.hk   -> Wong Mei-ling'),
  ('  Family : family-chan@carebridge.hk    -> Chan Kwok-keung'),
  ('  Family : family-lee@carebridge.hk     -> Lee Sau-ying'),
  ('  Family : family-cheung@carebridge.hk  -> Cheung Chi-ming'),
  ('  Family : family-ho@carebridge.hk      -> Ho Yuen-wah')
) t(info);
