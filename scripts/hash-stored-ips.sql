-- Re-hash stored visitor IPs inside the database (SQL counterpart of
-- scripts/hash-stored-ips.js, and much faster on large tables).
--
-- Rewrites click_events.ip_hash values that aren't already an HMAC (raw
-- IPs, raw forwarded lists, old 32-bit hashes) to
--   hex(HMAC-SHA256(first address, IP_HASH_SALT))
-- exactly like utils/ipHash.ts; empty / "unknown" become NULL. Equal old
-- values give equal new hashes, so unique-visitor groupings are preserved.
--
-- The salt is read from Supabase Vault (secret name: ip_hash_salt), so it
-- never appears in this file or in query history. It must be the same value
-- as IP_HASH_SALT in Vercel and in the track-click edge function's secrets.
--
-- Run repeatedly until it reports 0 updated (each run handles one batch, to
-- stay under statement timeouts). Safe to re-run at any time.

with salt as (
  select decrypted_secret as s from vault.decrypted_secrets where name = 'ip_hash_salt'
),
batch as (
  select id from public.click_events
  where ip_hash is not null and ip_hash !~ '^[0-9a-f]{64}$'
  limit 100000
),
upd as (
  update public.click_events c
  set ip_hash = case
      when nullif(nullif(lower(btrim(split_part(c.ip_hash, ',', 1), E' \t\n\r')), 'unknown'), '') is null then null
      else encode(extensions.hmac(btrim(split_part(c.ip_hash, ',', 1), E' \t\n\r'), (select s from salt), 'sha256'), 'hex')
    end
  from batch
  where c.id = batch.id
    and (select s from salt) is not null  -- no salt in Vault: change nothing
  returning 1
)
select count(*) as updated from upd;
