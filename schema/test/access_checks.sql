-- Access checks for schema/baseline.sql, run by schema/check.sh in CI.
-- Seeds two users (Alice owns a link, Bob doesn't; Carol is on Alice's team),
-- then calls the API-exposed functions, tables and views as anon, as Alice,
-- as Bob and as the service role, printing OK or DENIED for each. Output is
-- compared with access_checks.expected. Runs in a transaction that is
-- rolled back.
\set ON_ERROR_STOP 1
\set QUIET 1
\pset tuples_only on
\pset format unaligned
BEGIN;
INSERT INTO auth.users (id, email) VALUES
 ('00000000-0000-0000-0000-00000000000a','a@example.com'),
 ('00000000-0000-0000-0000-00000000000b','b@example.com'),
 ('00000000-0000-0000-0000-00000000000c','c@example.com');
INSERT INTO public.profiles (id, full_name) VALUES ('00000000-0000-0000-0000-00000000000a','Alice'),('00000000-0000-0000-0000-00000000000b','Bob'),('00000000-0000-0000-0000-00000000000c','Carol') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.teams (id, name, slug, owner_id) VALUES ('11111111-1111-1111-1111-111111111111','Team','team','00000000-0000-0000-0000-00000000000a');
INSERT INTO public.team_members (team_id, user_id, role) VALUES ('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-00000000000a','owner'),('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-00000000000c','editor');
INSERT INTO public.links (id, original_url, short_code, title, user_id) VALUES ('22222222-2222-2222-2222-22222222222a','https://a.example','aaa','A','00000000-0000-0000-0000-00000000000a');
INSERT INTO public.links (id, original_url, short_code, title, user_id, team_id) VALUES ('22222222-2222-2222-2222-22222222222e','https://t.example','ttt','T','00000000-0000-0000-0000-00000000000a','11111111-1111-1111-1111-111111111111');
INSERT INTO public.links (id, original_url, short_code, title, is_guest, claim_token) VALUES ('22222222-2222-2222-2222-22222222222f','https://g.example','ggg','G', true, '33333333-3333-3333-3333-333333333333');
INSERT INTO public.click_events (link_id, country, city, device, browser, os, referrer) SELECT '22222222-2222-2222-2222-22222222222a','India','Pune','Mobile','Chrome','Android','direct' FROM generate_series(1,5);
INSERT INTO public.analytics_share_tokens (user_id, token) VALUES ('00000000-0000-0000-0000-00000000000a','alicetoken');
-- helper: run one probe as a role/user and print OK/DENIED
CREATE OR REPLACE FUNCTION pg_temp.probe(label text, sql text, as_role text, as_uid text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE r text;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', coalesce(as_uid, ''), true);
  PERFORM set_config('request.jwt.claim.role', as_role, true);
  EXECUTE format('SET LOCAL ROLE %I', as_role);
  BEGIN
    EXECUTE sql INTO r;
    RESET ROLE;
    RETURN rpad(label, 62) || 'OK ' || coalesce(left(r, 20), '<null>');
  EXCEPTION WHEN OTHERS THEN
    RESET ROLE;
    RETURN rpad(label, 62) || 'DENIED';
  END;
END $$;
SELECT pg_temp.probe('anon: Alice stats via get_user_click_stats', $q$SELECT total_clicks::text FROM public.get_user_click_stats('00000000-0000-0000-0000-00000000000a')$q$, 'anon', null);
SELECT pg_temp.probe('Bob: Alice stats via get_user_click_stats', $q$SELECT total_clicks::text FROM public.get_user_click_stats('00000000-0000-0000-0000-00000000000a')$q$, 'authenticated', '00000000-0000-0000-0000-00000000000b');
SELECT pg_temp.probe('Alice: own stats', $q$SELECT total_clicks::text FROM public.get_user_click_stats('00000000-0000-0000-0000-00000000000a')$q$, 'authenticated', '00000000-0000-0000-0000-00000000000a');
SELECT pg_temp.probe('Alice: own country breakdown', $q$SELECT count(*)::text FROM public.get_user_country_breakdown('00000000-0000-0000-0000-00000000000a')$q$, 'authenticated', '00000000-0000-0000-0000-00000000000a');
SELECT pg_temp.probe('Alice: own clicks over time', $q$SELECT count(*)::text FROM public.get_user_clicks_over_time('00000000-0000-0000-0000-00000000000a', 30)$q$, 'authenticated', '00000000-0000-0000-0000-00000000000a');
SELECT pg_temp.probe('service_role: Alice stats', $q$SELECT total_clicks::text FROM public.get_user_click_stats('00000000-0000-0000-0000-00000000000a')$q$, 'service_role', null);
SELECT pg_temp.probe('anon: link stats of Alice link', $q$SELECT total_clicks::text FROM public.get_link_stats('22222222-2222-2222-2222-22222222222a')$q$, 'anon', null);
SELECT pg_temp.probe('Bob: link stats of Alice link', $q$SELECT total_clicks::text FROM public.get_link_stats('22222222-2222-2222-2222-22222222222a')$q$, 'authenticated', '00000000-0000-0000-0000-00000000000b');
SELECT pg_temp.probe('Alice: own link stats', $q$SELECT total_clicks::text FROM public.get_link_stats('22222222-2222-2222-2222-22222222222a')$q$, 'authenticated', '00000000-0000-0000-0000-00000000000a');
SELECT pg_temp.probe('Carol (team member): team link stats', $q$SELECT total_clicks::text FROM public.get_link_stats('22222222-2222-2222-2222-22222222222e')$q$, 'authenticated', '00000000-0000-0000-0000-00000000000c');
SELECT pg_temp.probe('anon: read share tokens', $q$SELECT string_agg(token, ',') FROM public.analytics_share_tokens$q$, 'anon', null);
SELECT pg_temp.probe('anon: forge share token for Bob', $q$INSERT INTO public.analytics_share_tokens (user_id, token) VALUES ('00000000-0000-0000-0000-00000000000b','forged') RETURNING token$q$, 'anon', null);
SELECT pg_temp.probe('Bob: read share tokens (sees only own)', $q$SELECT coalesce(string_agg(token, ','), '<none>') FROM public.analytics_share_tokens$q$, 'authenticated', '00000000-0000-0000-0000-00000000000b');
SELECT pg_temp.probe('Alice: read share tokens (sees only own)', $q$SELECT string_agg(token, ',') FROM public.analytics_share_tokens$q$, 'authenticated', '00000000-0000-0000-0000-00000000000a');
SELECT pg_temp.probe('anon: create share token', $q$SELECT public.create_analytics_share_token(7)$q$, 'anon', null);
SELECT pg_temp.probe('Alice: create share token', $q$SELECT length(public.create_analytics_share_token(7))::text$q$, 'authenticated', '00000000-0000-0000-0000-00000000000a');
SELECT pg_temp.probe('anon: shared analytics with valid token', $q$SELECT (public.get_shared_analytics('alicetoken'))->>'displayName'$q$, 'anon', null);
SELECT pg_temp.probe('anon: shared analytics with bad token', $q$SELECT coalesce((public.get_shared_analytics('nope'))::text, '<null>')$q$, 'anon', null);
SELECT pg_temp.probe('anon: click_stats_by_country view', $q$SELECT count(*)::text FROM public.click_stats_by_country$q$, 'anon', null);
SELECT pg_temp.probe('Bob: click_stats_by_country (0 rows expected)', $q$SELECT count(*)::text FROM public.click_stats_by_country$q$, 'authenticated', '00000000-0000-0000-0000-00000000000b');
SELECT pg_temp.probe('Alice: click_stats_by_country (own rows)', $q$SELECT count(*)::text FROM public.click_stats_by_country$q$, 'authenticated', '00000000-0000-0000-0000-00000000000a');
SELECT pg_temp.probe('Bob: create team owned by Alice', $q$SELECT (public.create_team_with_owner('Spoof', 'spoof', '00000000-0000-0000-0000-00000000000a'))::text$q$, 'authenticated', '00000000-0000-0000-0000-00000000000b');
SELECT pg_temp.probe('Bob: create own team', $q$SELECT (public.create_team_with_owner('Bobs', 'bobs', '00000000-0000-0000-0000-00000000000b'))->>'name'$q$, 'authenticated', '00000000-0000-0000-0000-00000000000b');
SELECT pg_temp.probe('Bob: claim guest link for Alice', $q$SELECT (public.claim_guest_link('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-00000000000a'))::text$q$, 'authenticated', '00000000-0000-0000-0000-00000000000b');
SELECT pg_temp.probe('anon: record_click on Alice link', $q$SELECT public.record_click('22222222-2222-2222-2222-22222222222a', '{}')::text$q$, 'anon', null);
SELECT pg_temp.probe('anon: legacy get_top_cities(Alice)', $q$SELECT count(*)::text FROM public.get_top_cities('00000000-0000-0000-0000-00000000000a', 10)$q$, 'anon', null);
ROLLBACK;
