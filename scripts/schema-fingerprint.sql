-- Fingerprint of the public schema, one hash per kind of object.
--
-- Run it on production and on a database built from schema/baseline.sql:
-- matching rows mean the baseline is current. A row that differs points at
-- what changed (rerun scripts/dump-schema.sql to refresh the baseline).
-- Lists are sorted byte-wise (COLLATE "C") so the hashes don't depend on
-- the server's collation; MAINTAIN (Postgres 17 only) is ignored.

SET search_path = '';
with
cols as (select string_agg(format('%s.%s %s %s %s', c.relname, a.attname, format_type(a.atttypid,a.atttypmod), a.attnotnull, coalesce(pg_get_expr(d.adbin,d.adrelid),'')), '|' order by c.relname collate "C", a.attname collate "C") s, count(*) n
  from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace ns on ns.oid=c.relnamespace left join pg_attrdef d on d.adrelid=c.oid and d.adnum=a.attnum
  where ns.nspname='public' and c.relkind in ('r','v','m') and a.attnum>0 and not a.attisdropped),
cons as (select string_agg(format('%s.%s %s', c.relname, k.conname, pg_get_constraintdef(k.oid)), '|' order by c.relname collate "C", k.conname collate "C") s, count(*) n
  from pg_constraint k join pg_class c on c.oid=k.conrelid join pg_namespace ns on ns.oid=c.relnamespace where ns.nspname='public' and k.contype in ('p','u','c','f','x')),
idx as (select string_agg(pg_get_indexdef(i.indexrelid), '|' order by pg_get_indexdef(i.indexrelid) collate "C") s, count(*) n
  from pg_index i join pg_class c on c.oid=i.indrelid join pg_namespace ns on ns.oid=c.relnamespace where ns.nspname='public'),
fns as (select string_agg(md5(pg_get_functiondef(p.oid)), '|' order by p.proname collate "C", pg_get_function_identity_arguments(p.oid) collate "C") s, count(*) n
  from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace where ns.nspname='public' and p.prokind in ('f','p')
  and not exists (select 1 from pg_depend d where d.objid=p.oid and d.deptype='e')),
vws as (select string_agg(c.relname||':'||coalesce(array_to_string(c.reloptions, ','), '')||':'||md5(pg_get_viewdef(c.oid)), '|' order by c.relname collate "C") s, count(*) n
  from pg_class c join pg_namespace ns on ns.oid=c.relnamespace where ns.nspname='public' and c.relkind in ('v','m')),
trg as (select string_agg(pg_get_triggerdef(t.oid), '|' order by pg_get_triggerdef(t.oid) collate "C") s, count(*) n
  from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace ns on ns.oid=c.relnamespace where not t.tgisinternal and (ns.nspname='public' or (ns.nspname='auth' and c.relname='users'))),
pols as (select string_agg(format('%s.%s.%s %s %s %s %s %s', schemaname, tablename, policyname, permissive, roles::text, cmd, coalesce(qual,''), coalesce(with_check,'')), '|' order by schemaname collate "C", tablename collate "C", policyname collate "C") s, count(*) n
  from pg_policies where schemaname in ('public','storage')),
rls as (select string_agg(relname||relrowsecurity::text||relforcerowsecurity::text, '|' order by relname collate "C") s, count(*) n
  from pg_class c join pg_namespace ns on ns.oid=c.relnamespace where ns.nspname='public' and c.relkind='r'),
tgr as (select string_agg(format('%s %s %s', c.relname, r.rolname, x.privilege_type), '|' order by c.relname collate "C", r.rolname collate "C", x.privilege_type collate "C") s, count(*) n
  from pg_class c join pg_namespace ns on ns.oid=c.relnamespace cross join lateral aclexplode(c.relacl) x join pg_roles r on r.oid=x.grantee
  where ns.nspname='public' and r.rolname in ('anon','authenticated','service_role') and x.privilege_type <> 'MAINTAIN'),
fgr as (select string_agg(format('%s(%s) %s', p.proname, pg_get_function_identity_arguments(p.oid), case when x.grantee=0 then 'PUBLIC' else r.rolname end), '|' order by format('%s(%s) %s', p.proname, pg_get_function_identity_arguments(p.oid), case when x.grantee=0 then 'PUBLIC' else r.rolname end) collate "C") s, count(*) n
  from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace cross join lateral aclexplode(coalesce(p.proacl, acldefault('f',p.proowner))) x left join pg_roles r on r.oid=x.grantee
  where ns.nspname='public' and p.prokind in ('f','p') and x.privilege_type='EXECUTE' and (x.grantee=0 or r.rolname in ('anon','authenticated','service_role'))
  and not exists (select 1 from pg_depend d where d.objid=p.oid and d.deptype='e')),
pub as (select string_agg(tablename, '|' order by tablename collate "C") s, count(*) n from pg_publication_tables where pubname='supabase_realtime' and schemaname='public'),
bkt as (select string_agg(id||public::text, '|' order by id collate "C") s, count(*) n from storage.buckets)
select 'columns' k, n, md5(s) from cols union all select 'constraints', n, md5(s) from cons union all select 'indexes', n, md5(s) from idx
union all select 'functions', n, md5(s) from fns union all select 'views', n, md5(s) from vws union all select 'triggers', n, md5(s) from trg
union all select 'policies', n, md5(s) from pols union all select 'rls', n, md5(s) from rls union all select 'table_grants', n, md5(s) from tgr
union all select 'function_grants', n, md5(s) from fgr union all select 'realtime', n, md5(coalesce(s,'')) from pub union all select 'buckets', n, md5(s) from bkt;
