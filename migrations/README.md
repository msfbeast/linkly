# Database migrations

All SQL for the Supabase database lives in this folder.

## Adding a migration

- Name it `YYYYMMDD_short_description.sql` and put it directly in `migrations/`.
- Make it safe to re-run (`IF NOT EXISTS`, `CREATE OR REPLACE`, `DROP ... IF EXISTS`).
- Migrations are applied by hand in the Supabase SQL editor. Merging a PR
  does **not** apply anything, so say in the PR which files need running.
- Don't commit one-off data changes for specific people (granting a plan or a
  role to an email address). Run those in the SQL editor instead; they don't
  belong in the schema history and they put personal data in the repo.

## What's here

- `YYYYMMDD_*.sql`: the current series.
- `legacy/`: older files moved here from `supabase/migrations/` (numbered
  `001`–`018`) and `db_migrations/` (`theme_01`, `theme_02`). They are kept for
  reference. The exact order they were applied in, relative to the dated
  files, was never recorded.

Because files were applied by hand and some are one-off fixes, **the live
database is the source of truth**, not this folder. To rebuild the schema
from scratch, dump it from the live project (for example with
`supabase db dump --schema public`) rather than replaying these files.
