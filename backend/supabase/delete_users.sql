-- Delete all demo users so we can re-create via GoTrue signup API
delete from auth.identities where provider_id in (
  'karen@carebridge.hk','family-wong@carebridge.hk','family-chan@carebridge.hk',
  'family-lee@carebridge.hk','family-cheung@carebridge.hk','family-ho@carebridge.hk'
);
delete from auth.users where email in (
  'karen@carebridge.hk','family-wong@carebridge.hk','family-chan@carebridge.hk',
  'family-lee@carebridge.hk','family-cheung@carebridge.hk','family-ho@carebridge.hk'
);
select 'deleted' as result, count(*) as remaining from auth.users where email like '%carebridge%';
