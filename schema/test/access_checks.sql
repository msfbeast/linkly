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
INSERT INTO public.links (id, original_url, short_code, title, is_guest, claim_token, guest_session_id) VALUES ('22222222-2222-2222-2222-22222222222f','https://g.example','ggg','G', true, '33333333-3333-3333-3333-333333333333', 'guest-sess');
INSERT INTO public.click_events (link_id, country, city, device, browser, os, referrer) SELECT '22222222-2222-2222-2222-22222222222a','India','Pune','Mobile','Chrome','Android','direct' FROM generate_series(1,5);
INSERT INTO public.analytics_share_tokens (user_id, token) VALUES ('00000000-0000-0000-0000-00000000000a','alicetoken');
INSERT INTO public.links (id, original_url, short_code, title, user_id, password_hash) VALUES ('22222222-2222-2222-2222-22222222222b','https://secret.example','lck','Locked','00000000-0000-0000-0000-00000000000a','opensesame');
INSERT INTO public.bio_profiles (id, user_id, handle, display_name) VALUES ('44444444-4444-4444-4444-444444444444','00000000-0000-0000-0000-00000000000a','alice','Alice');
INSERT INTO storage.objects (bucket_id, name, owner) VALUES ('avatars','00000000-0000-0000-0000-00000000000a/avatar.jpg','00000000-0000-0000-0000-00000000000a'),('digital-products','00000000-0000-0000-0000-00000000000a/ebook.pdf','00000000-0000-0000-0000-00000000000a');
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
SELECT pg_temp.probe('anon: insert fake click event', $q$INSERT INTO public.click_events (link_id) VALUES ('22222222-2222-2222-2222-22222222222a') RETURNING 'row'$q$, 'anon', null);
SELECT pg_temp.probe('Bob: insert fake click event', $q$INSERT INTO public.click_events (link_id) VALUES ('22222222-2222-2222-2222-22222222222a') RETURNING 'row'$q$, 'authenticated', '00000000-0000-0000-0000-00000000000b');
SELECT pg_temp.probe('anon: insert into legacy clicks', $q$INSERT INTO public.clicks (link_id) VALUES ('22222222-2222-2222-2222-22222222222a') RETURNING 'row'$q$, 'anon', null);
SELECT pg_temp.probe('anon: increment_link_clicks', $q$SELECT public.increment_link_clicks('22222222-2222-2222-2222-22222222222a', now())::text$q$, 'anon', null);
SELECT pg_temp.probe('anon: increment_clicks', $q$SELECT public.increment_clicks('22222222-2222-2222-2222-22222222222a')::text$q$, 'anon', null);
SELECT pg_temp.probe('anon: increment_bio_view', $q$SELECT public.increment_bio_view('44444444-4444-4444-4444-444444444444')::text$q$, 'anon', null);
SELECT pg_temp.probe('service_role: record a click', $q$INSERT INTO public.click_events (link_id) VALUES ('22222222-2222-2222-2222-22222222222a') RETURNING 'row'$q$, 'service_role', null);
SELECT pg_temp.probe('service_role: count a bio view', $q$SELECT public.increment_bio_view('44444444-4444-4444-4444-444444444444')::text$q$, 'service_role', null);
SELECT pg_temp.probe('anon: read the links table (rows)', $q$SELECT count(*)::text FROM public.links$q$, 'anon', null);
SELECT pg_temp.probe('Bob: read Alice''s links (rows)', $q$SELECT count(*)::text FROM public.links WHERE user_id = '00000000-0000-0000-0000-00000000000a'$q$, 'authenticated', '00000000-0000-0000-0000-00000000000b');
SELECT pg_temp.probe('Carol (team): read team link (rows)', $q$SELECT count(*)::text FROM public.links WHERE team_id IS NOT NULL$q$, 'authenticated', '00000000-0000-0000-0000-00000000000c');
SELECT pg_temp.probe('anon: repoint Alice''s link (rows changed)', $q$WITH u AS (UPDATE public.links SET original_url = 'https://evil.example' WHERE id = '22222222-2222-2222-2222-22222222222a' RETURNING 1) SELECT count(*)::text FROM u$q$, 'anon', null);
SELECT pg_temp.probe('Bob: repoint Alice''s link (rows changed)', $q$WITH u AS (UPDATE public.links SET original_url = 'https://evil.example' WHERE id = '22222222-2222-2222-2222-22222222222a' RETURNING 1) SELECT count(*)::text FROM u$q$, 'authenticated', '00000000-0000-0000-0000-00000000000b');
SELECT pg_temp.probe('Alice: save a javascript: link', $q$INSERT INTO public.links (original_url, short_code, title, user_id) VALUES ('javascript:alert(1)', 'xss', 'X', '00000000-0000-0000-0000-00000000000a') RETURNING 'saved'$q$, 'authenticated', '00000000-0000-0000-0000-00000000000a');
SELECT pg_temp.probe('anon: public link has destination', $q$SELECT (length(public.get_public_link('aaa')->>'original_url') > 0)::text$q$, 'anon', null);
SELECT pg_temp.probe('anon: public link hides password field', $q$SELECT (public.get_public_link('lck') ? 'password_hash')::text$q$, 'anon', null);
SELECT pg_temp.probe('anon: locked link destination', $q$SELECT '[' || (public.get_public_link('lck')->>'original_url') || ']'$q$, 'anon', null);
SELECT pg_temp.probe('anon: check a link password directly', $q$SELECT public.unlock_link_checked('lck', 'opensesame', 'v')->>'status'$q$, 'anon', null);
SELECT pg_temp.probe('Bob: check a link password directly', $q$SELECT public.unlock_link_checked('lck', 'opensesame', 'v')->>'status'$q$, 'authenticated', '00000000-0000-0000-0000-00000000000b');
SELECT pg_temp.probe('anon: read unlock failures', $q$SELECT count(*)::text FROM public.link_unlock_failures$q$, 'anon', null);
SELECT pg_temp.probe('server: unlock with wrong password', $q$SELECT public.unlock_link_checked('lck', 'nope', 'v1')->>'status'$q$, 'service_role', null);
SELECT pg_temp.probe('server: unlock with right password', $q$SELECT public.unlock_link_checked('lck', 'opensesame', 'v1')->'link'->>'original_url'$q$, 'service_role', null);
SELECT pg_temp.probe('server: 5 wrong guesses from one visitor', $q$SELECT string_agg(public.unlock_link_checked('lck', 'nope' || g, 'v2')->>'status', ',') FROM generate_series(1, 5) g$q$, 'service_role', null);
SELECT pg_temp.probe('server: that visitor, right password', $q$SELECT public.unlock_link_checked('lck', 'opensesame', 'v2')->>'status'$q$, 'service_role', null);
SELECT pg_temp.probe('server: another visitor, right password', $q$SELECT public.unlock_link_checked('lck', 'opensesame', 'v3')->>'status'$q$, 'service_role', null);
SELECT pg_temp.probe('anon: list avatar files (rows)', $q$SELECT count(*)::text FROM storage.objects WHERE bucket_id = 'avatars'$q$, 'anon', null);
SELECT pg_temp.probe('Bob: list Alice''s avatar files (rows)', $q$SELECT count(*)::text FROM storage.objects WHERE name LIKE '00000000-0000-0000-0000-00000000000a/%'$q$, 'authenticated', '00000000-0000-0000-0000-00000000000b');
SELECT pg_temp.probe('Alice: list own avatar files (rows)', $q$SELECT count(*)::text FROM storage.objects WHERE bucket_id = 'avatars'$q$, 'authenticated', '00000000-0000-0000-0000-00000000000a');
SELECT pg_temp.probe('anon: upload an avatar', $q$INSERT INTO storage.objects (bucket_id, name) VALUES ('avatars', 'x/avatar.jpg') RETURNING 'row'$q$, 'anon', null);
SELECT pg_temp.probe('Bob: upload into Alice''s avatar folder', $q$INSERT INTO storage.objects (bucket_id, name) VALUES ('avatars', '00000000-0000-0000-0000-00000000000a/evil.jpg') RETURNING 'row'$q$, 'authenticated', '00000000-0000-0000-0000-00000000000b');
SELECT pg_temp.probe('Bob: upload into own gallery folder', $q$INSERT INTO storage.objects (bucket_id, name) VALUES ('gallery-images', '00000000-0000-0000-0000-00000000000b/pic.jpg') RETURNING 'row'$q$, 'authenticated', '00000000-0000-0000-0000-00000000000b');
SELECT pg_temp.probe('Bob: overwrite Alice''s avatar (rows changed)', $q$WITH u AS (UPDATE storage.objects SET metadata = '{}' WHERE name = '00000000-0000-0000-0000-00000000000a/avatar.jpg' RETURNING 1) SELECT count(*)::text FROM u$q$, 'authenticated', '00000000-0000-0000-0000-00000000000b');
SELECT pg_temp.probe('Bob: move own file into Alice''s folder', $q$WITH u AS (UPDATE storage.objects SET name = '00000000-0000-0000-0000-00000000000a/pic.jpg' WHERE name = '00000000-0000-0000-0000-00000000000b/pic.jpg' RETURNING 1) SELECT count(*)::text FROM u$q$, 'authenticated', '00000000-0000-0000-0000-00000000000b');
SELECT pg_temp.probe('Bob: delete Alice''s avatar (rows changed)', $q$WITH d AS (DELETE FROM storage.objects WHERE name = '00000000-0000-0000-0000-00000000000a/avatar.jpg' RETURNING 1) SELECT count(*)::text FROM d$q$, 'authenticated', '00000000-0000-0000-0000-00000000000b');
SELECT pg_temp.probe('Bob: read Alice''s digital product (rows)', $q$SELECT count(*)::text FROM storage.objects WHERE bucket_id = 'digital-products'$q$, 'authenticated', '00000000-0000-0000-0000-00000000000b');
SELECT pg_temp.probe('Alice: read own digital product (rows)', $q$SELECT count(*)::text FROM storage.objects WHERE bucket_id = 'digital-products'$q$, 'authenticated', '00000000-0000-0000-0000-00000000000a');
SELECT pg_temp.probe('anon: new guest link returns a claim token', $q$SELECT (public.create_guest_link('https://n.example', 'nnn', 's1')::jsonb ? 'claim_token')::text$q$, 'anon', null);
SELECT pg_temp.probe('anon: public guest link hides claim token', $q$SELECT (public.get_public_link('ggg') ? 'claim_token')::text$q$, 'anon', null);
SELECT pg_temp.probe('anon: old guest email setter', $q$SELECT public.update_guest_link_metadata('22222222-2222-2222-2222-22222222222f', 'evil@x.com')::text$q$, 'anon', null);
SELECT pg_temp.probe('anon: set guest email, wrong session', $q$SELECT 'called' FROM (SELECT public.update_guest_link_metadata('22222222-2222-2222-2222-22222222222f', 'evil@x.com', 'other-sess')) x$q$, 'anon', null);
SELECT pg_temp.probe('server: guest email after stranger', $q$SELECT coalesce(metadata->>'guest_email', '<none>') FROM public.links WHERE id = '22222222-2222-2222-2222-22222222222f'$q$, 'service_role', null);
SELECT pg_temp.probe('anon: set guest email, own session', $q$SELECT 'called' FROM (SELECT public.update_guest_link_metadata('22222222-2222-2222-2222-22222222222f', 'me@x.com', 'guest-sess')) x$q$, 'anon', null);
SELECT pg_temp.probe('server: guest email after owner session', $q$SELECT coalesce(metadata->>'guest_email', '<none>') FROM public.links WHERE id = '22222222-2222-2222-2222-22222222222f'$q$, 'service_role', null);
SELECT pg_temp.probe('anon: claim a guest link', $q$SELECT (public.claim_guest_link('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-00000000000b'))->>'success'$q$, 'anon', null);
SELECT pg_temp.probe('Bob: claim guest link for himself', $q$SELECT (public.claim_guest_link('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-00000000000b'))->>'success'$q$, 'authenticated', '00000000-0000-0000-0000-00000000000b');
SELECT pg_temp.probe('Bob: claim the same link again', $q$SELECT (public.claim_guest_link('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-00000000000b'))->>'success'$q$, 'authenticated', '00000000-0000-0000-0000-00000000000b');
SELECT pg_temp.probe('Bob: claimed link is his, guest data gone', $q$SELECT format('guest=%s token=%s email=%s', is_guest, coalesce(claim_token, '-'), coalesce(metadata->>'guest_email', '-')) FROM public.links WHERE id = '22222222-2222-2222-2222-22222222222f'$q$, 'authenticated', '00000000-0000-0000-0000-00000000000b');
ROLLBACK;
