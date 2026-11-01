-- Key the stored visitor fingerprints, so they can't be traced back to IPs.
--
-- The old track-click function stored a 32-bit hash of the browser details
-- plus the raw IP. The browser details are in the same row, so trying every
-- IPv4 address recovers the visitor's IP. This rewrites each old value to
--   hex(HMAC-SHA256(old fingerprint, IP_HASH_SALT))
-- which is exactly what api/_lib/clickStore.ts (visitorKeys) now stores for
-- new clicks, so unique-visitor counts stay continuous across the change.
--
-- The salt is read from Supabase Vault (secret name: ip_hash_salt) and must
-- equal IP_HASH_SALT in Vercel. Run repeatedly until it reports 0 updated;
-- safe to re-run (already-keyed 64-hex values are skipped).

with salt as (
  select decrypted_secret as s from vault.decrypted_secrets where name = 'ip_hash_salt'
),
batch as (
  select id from public.click_events
  where fingerprint is not null and fingerprint !~ '^[0-9a-f]{64}$'
  limit 100000
),
upd as (
  update public.click_events c
  set fingerprint = encode(extensions.hmac(c.fingerprint, (select s from salt), 'sha256'), 'hex')
  from batch
  where c.id = batch.id
    and (select s from salt) is not null  -- no salt in Vault: change nothing
  returning 1
)
select count(*) as updated from upd;
