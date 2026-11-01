# Database schema baseline

`baseline.sql` is the complete schema of the production Supabase database, as
of the date of its last regeneration. It covers the `public` schema (types,
tables, constraints, functions, views, indexes, triggers, row level security
policies, grants), the signup trigger on `auth.users`, Realtime publication
membership, and storage buckets and their policies. It contains no row data
and no secrets.

The `migrations/` folder can't rebuild the database: its files were applied by
hand, in an order that was never recorded, and some were one-off fixes. Use
this file instead.

## Rebuilding a database

1. Create a new Supabase project (Postgres 17).
2. Run `baseline.sql` in its SQL editor.
3. Create the Vault secret `ip_hash_salt` (Project Settings → Vault), with the
   same value as `IP_HASH_SALT` in Vercel and in the edge function's secrets.
4. Deploy the edge functions in `supabase/functions/`.

Don't run `baseline.sql` against production. It recreates the schema; it isn't
a migration.

## Keeping it current

After applying a migration to production:

1. Run `scripts/dump-schema.sql` in the SQL editor and save the `ddl` value
   it returns as `schema/baseline.sql`.
2. Run `scripts/schema-fingerprint.sql` in the SQL editor and copy its rows
   into `schema/fingerprint.txt`, one `kind count hash` row per line.
3. Commit both with the migration.

CI (the "Schema baseline loads" job) loads `baseline.sql` into an empty
Postgres 17 and checks that it reproduces `fingerprint.txt`. Running
`schema-fingerprint.sql` against production at any time shows whether the
baseline has fallen behind: every row should match `fingerprint.txt`.

The same job then runs `test/access_checks.sql`: it seeds a few users and
calls the API-exposed functions, tables and views as anon, as the owner, as
another user and as the service role, and compares who gets in with
`test/access_checks.expected`. A change that opens analytics to the wrong
people fails CI. If a change is meant to alter access, update the expected
file in the same PR.

`test/supabase_stubs.sql` gives plain Postgres the pieces that every Supabase
project already has (roles, `auth`, `storage`, `vault`), so CI can load the
baseline. It is not for use on Supabase.
