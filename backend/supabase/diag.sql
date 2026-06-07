-- Diagnose karen's auth record
select
  id,
  email,
  substring(encrypted_password, 1, 10) as pw_prefix,
  email_confirmed_at is not null as confirmed,
  banned_until,
  deleted_at,
  raw_app_meta_data,
  (select count(*) from auth.identities i where i.user_id = auth.users.id) as identity_count
from auth.users
where email = 'karen@carebridge.hk';
