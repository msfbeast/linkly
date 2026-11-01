#!/usr/bin/env bash
# Load schema/baseline.sql into an empty Postgres (with Supabase stubs) and
# check it against schema/fingerprint.txt, the fingerprint of production.
# Usage: PGHOST=... PGUSER=postgres schema/check.sh   (needs an empty database)
set -euo pipefail
cd "$(dirname "$0")/.."

psql -q -v ON_ERROR_STOP=1 -f schema/test/supabase_stubs.sql
# supabase_vault and wrappers exist only on Supabase; the stubs stand in for vault.
grep -vE 'CREATE EXTENSION IF NOT EXISTS (supabase_vault|wrappers) ' schema/baseline.sql \
  | psql -q -v ON_ERROR_STOP=1
psql -qAt -F ' ' -f scripts/schema-fingerprint.sql > /tmp/fingerprint.txt

if diff -u schema/fingerprint.txt /tmp/fingerprint.txt; then
  echo "schema/baseline.sql rebuilds the recorded production schema."
else
  echo "schema/baseline.sql does not match schema/fingerprint.txt (see diff above)." >&2
  exit 1
fi
