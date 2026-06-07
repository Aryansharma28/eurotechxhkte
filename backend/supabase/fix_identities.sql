-- Fix: add missing auth.identities rows so logins work
-- Run in Supabase SQL Editor after seed_all.sql

insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select
  gen_random_uuid(),
  u.email,
  u.id,
  json_build_object('sub', u.id::text, 'email', u.email)::jsonb,
  'email',
  now(), now(), now()
from auth.users u
where u.email in (
  'karen@carebridge.hk',
  'family-wong@carebridge.hk',
  'family-chan@carebridge.hk',
  'family-lee@carebridge.hk',
  'family-cheung@carebridge.hk',
  'family-ho@carebridge.hk'
)
and not exists (
  select 1 from auth.identities i where i.user_id = u.id
);

select 'Identities fixed' as result, count(*) as users_fixed
from auth.identities
where provider_id in (
  'karen@carebridge.hk',
  'family-wong@carebridge.hk',
  'family-chan@carebridge.hk',
  'family-lee@carebridge.hk',
  'family-cheung@carebridge.hk',
  'family-ho@carebridge.hk'
);
