-- Fix auth.users: set required app_meta_data and confirm all demo accounts

update auth.users
set
  raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  confirmation_sent_at = coalesce(confirmation_sent_at, now()),
  is_sso_user = false,
  updated_at = now()
where email in (
  'karen@carebridge.hk',
  'family-wong@carebridge.hk',
  'family-chan@carebridge.hk',
  'family-lee@carebridge.hk',
  'family-cheung@carebridge.hk',
  'family-ho@carebridge.hk'
);

select email, email_confirmed_at is not null as confirmed,
       raw_app_meta_data->>'provider' as provider
from auth.users
where email like '%carebridge%'
order by email;
