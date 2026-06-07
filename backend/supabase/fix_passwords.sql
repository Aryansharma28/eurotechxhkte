-- Force-reset passwords and verify the hash works

update auth.users
set
  encrypted_password = crypt('hackathon123', gen_salt('bf', 10)),
  updated_at = now()
where email in (
  'karen@carebridge.hk',
  'family-wong@carebridge.hk',
  'family-chan@carebridge.hk',
  'family-lee@carebridge.hk',
  'family-cheung@carebridge.hk',
  'family-ho@carebridge.hk'
);

-- Verify: should show true for every row
select
  email,
  (encrypted_password = crypt('hackathon123', encrypted_password)) as password_ok,
  email_confirmed_at is not null as confirmed,
  raw_app_meta_data->>'provider' as provider
from auth.users
where email like '%carebridge%'
order by email;
