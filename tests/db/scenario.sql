-- End-to-end check of the database rules, run by tests/db.test.mjs on a local Postgres after mock-supabase.sql and
-- supabase/schema.sql, progress.sql and content.sql. Made-up accounts only. Any failed check stops the script.
\set ON_ERROR_STOP 1
\set QUIET 1

create schema if not exists t;
grant usage on schema t to anon, authenticated;
-- Fails the run when got <> want.
create or replace function t.eq(label text, got anyelement, want anyelement) returns void language plpgsql as $$
begin
  if got is distinct from want then raise exception 'FAILED %: got %, want %', label, got, want; end if;
  raise notice 'ok  %', label;
end $$;
-- Runs a statement as the current role and fails the run unless it raises an error matching pattern.
create or replace function t.denied(label text, stmt text, pattern text default '') returns void language plpgsql as $$
begin
  execute stmt;
  raise exception 'FAILED %: it was allowed', label;
exception when others then
  if sqlerrm like 'FAILED %' then raise; end if;
  if sqlerrm !~* pattern then raise exception 'FAILED %: wrong error: %', label, sqlerrm; end if;
  raise notice 'ok  % (refused: %)', label, sqlerrm;
end $$;
-- Rows a statement returns, as the current role (0 when row level security hides them all).
create or replace function t.n(stmt text) returns int language plpgsql as $$
declare c int; begin execute 'select count(*) from (' || stmt || ') q' into c; return c; end $$;
grant execute on all functions in schema t to anon, authenticated;

-- Made-up accounts: two teachers, three school students, one outsider.
insert into auth.users values
  ('11111111-1111-1111-1111-111111111111', 'teacher.one@vinschool.edu.vn'),
  ('55555555-5555-5555-5555-555555555555', 'teacher.two@vinschool.edu.vn'),
  ('22222222-2222-2222-2222-222222222222', 'student.a@st.vinschool.edu.vn'),
  ('33333333-3333-3333-3333-333333333333', 'student.b@vinschool.edu.vn'),
  ('66666666-6666-6666-6666-666666666666', 'student.c@vinschool.edu.vn'),
  ('44444444-4444-4444-4444-444444444444', 'someone@gmail.com');
-- Step 6 of the setup guide: the teacher row is added by hand in the SQL editor.
insert into public.teachers values ('11111111-1111-1111-1111-111111111111'), ('55555555-5555-5555-5555-555555555555');

-- The right option (position in the public list) for two questions, read with full rights before playing as students.
select (x.ord - 1) as r1 from items, jsonb_array_elements(options) with ordinality x(o, ord) where id = 'e1-zap-01' and (o->>'right')::boolean \gset
select (x.ord - 1) as r2 from items, jsonb_array_elements(options) with ordinality x(o, ord) where id = 'e1-report-01' and (o->>'right')::boolean \gset
select case when :r2 = 0 then 1 else 0 end as w2 \gset

/* ---------- anonymous visitor ---------- */
set role anon;
select set_config('request.jwt.claims', '', false);
select t.denied('anon cannot join a class', $$select public.join_class('ABCDEF', 'Nope', 'x')$$, 'permission denied');
select t.denied('anon cannot read the answer key', $$select * from public.items$$, 'permission denied');
select t.denied('anon cannot see the leaderboard', $$select * from public.class_board()$$, 'permission denied');
select t.denied('anon cannot list students', $$select * from public.students$$, 'permission denied');
reset role;

/* ---------- teacher one makes a class ---------- */
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","email":"teacher.one@vinschool.edu.vn"}', false);
select t.eq('teacher is a teacher', public.am_i_teacher(), true);
insert into public.classes (name, code, teacher_id) values ('7A', 'HK7A24', '11111111-1111-1111-1111-111111111111');
select t.denied('teacher cannot make a class for someone else',
  $$insert into public.classes (name, code, teacher_id) values ('7Z', 'ZZZZZZ', '55555555-5555-5555-5555-555555555555')$$, 'row-level security');
reset role;

set role authenticated;
select set_config('request.jwt.claims', '{"sub":"55555555-5555-5555-5555-555555555555","email":"teacher.two@vinschool.edu.vn"}', false);
insert into public.classes (name, code, teacher_id) values ('7B', 'QW7B99', '55555555-5555-5555-5555-555555555555');
select t.eq('teacher two cannot see class 7A', t.n('select * from public.classes where code = ''HK7A24'''), 0);
reset role;

/* ---------- students join ---------- */
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","email":"student.a@st.vinschool.edu.vn"}', false);
select t.eq('student is not a teacher', public.am_i_teacher(), false);
select t.denied('wrong class code is refused', $$select public.join_class('NOPE00', 'MangoComet', 'x')$$, 'unknown class code');
select public.join_class('hk7a24', 'MangoComet', '🦊');
select t.eq('student sees own class name', (select name from public.classes), '7A');
select t.eq('student sees only themself', t.n('select * from public.students'), 1);
select t.denied('student cannot make themself a teacher',
  $$insert into public.teachers values ('22222222-2222-2222-2222-222222222222')$$, 'row-level security');
select t.denied('student cannot make a class', $$insert into public.classes (name, code, teacher_id) values ('X', 'XXXXXX', '22222222-2222-2222-2222-222222222222')$$, 'row-level security|foreign key');
-- Updates and deletes that row level security doesn't allow change 0 rows rather than raising an error.
update public.classes set settings = '{"open": ["harvest","signal","ember"], "boards": {}}';
update public.students set nick = 'Renamed';
reset role;
select t.eq('student could not change class settings', (select settings->'open' from classes where code = 'HK7A24'), '["harvest"]'::jsonb);
select t.eq('student could not rename themself directly', (select nick from students where user_id = '22222222-2222-2222-2222-222222222222'), 'MangoComet');

set role authenticated;
select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333","email":"student.b@vinschool.edu.vn"}', false);
select t.denied('nickname already taken (any case)', $$select public.join_class('HK7A24', 'mangocomet', 'x')$$, 'nickname taken');
select public.join_class('HK7A24', 'TealOtter', '🐬');
reset role;

set role authenticated;
select set_config('request.jwt.claims', '{"sub":"66666666-6666-6666-6666-666666666666","email":"student.c@vinschool.edu.vn"}', false);
select public.join_class('QW7B99', 'RedKite', '🦉');
reset role;

set role authenticated;
select set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-4444-444444444444","email":"someone@gmail.com"}', false);
select t.denied('outside account cannot join', $$select public.join_class('HK7A24', 'Intruder', 'x')$$, 'school account');
select t.denied('outside account cannot check answers', $$select public.check_answer('e1-zap-01', 0)$$, 'not in a class');
select t.denied('outside account cannot save work', $$select public.save_attempt('c1', 'fizz-briefing', '[{"item":"e1-zap-01"}]')$$, 'not in a class');
reset role;

/* ---------- student A plays ---------- */
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","email":"student.a@st.vinschool.edu.vn"}', false);
select t.denied('student cannot read the answer key', $$select * from public.items$$, 'permission denied|row-level');
select t.eq('deal_options gives every option once', (select array_length(public.deal_options('e1-zap-01'), 1)), 4);
select t.eq('right first tap', (public.check_answer('e1-zap-01', :r1, 9000)) ->> 'right', 'true');
select t.eq('wrong tap says why but not the answer', (public.check_answer('e1-report-01', :w2, 9000)) ? 'why', true);
select t.eq('wrong tap gives no explanation', (public.check_answer('e1-report-01', :w2, 9000)) ? 'explain', false);
select t.denied('student cannot write XP directly',
  $$insert into public.attempts (user_id, class_id, client_id, text_id, mode, answers, xp) select user_id, class_id, 'hack', 'fizz-briefing', 'mission', '[]', 9999 from public.students$$, 'row-level security');
-- e1-zap-01 right first time (demand 0: 10 XP) + e1-report-01 one wrong then right (hint: 5 XP) + 20 for finishing = 35.
select public.check_answer('e1-report-01', :r2, 9000);
select t.eq('server works out the XP', public.save_attempt('c1', 'fizz-briefing', '[{"item":"e1-zap-01"},{"item":"e1-report-01"}]'), 35);
select t.eq('a retried upload is not counted twice', public.save_attempt('c1', 'fizz-briefing', '[{"item":"e1-zap-01"},{"item":"e1-report-01"}]'), 35);
-- Replaying the same questions on the same day: no XP for questions met before, half for finishing (20 / 2).
select public.check_answer('e1-zap-01', :r1, 9000);
select t.eq('questions met before earn nothing again', public.save_attempt('c2', 'fizz-briefing', '[{"item":"e1-zap-01"}]'), 10);
-- Claiming an answer that was never tapped earns only the finishing XP.
select t.eq('untapped answers earn no question XP', public.save_attempt('c3', 'fizz-dossier', '[{"item":"e1-zap-02"}]'), 20);
select t.denied('made-up activity is refused', $$select public.save_attempt('c4', 'free-xp', '[{"item":"e1-zap-01"}]')$$, 'unknown activity');
select t.eq('student sees own saved work', t.n('select * from public.attempts'), 3);
reset role;

/* ---------- leaderboards and privacy ---------- */
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333","email":"student.b@vinschool.edu.vn"}', false);
select t.eq('student B cannot read A''s work', t.n('select * from public.attempts'), 0);
select t.eq('board lists the class', t.n('select * from public.class_board()'), 2);
select t.eq('board shows A''s weekly XP', (select week_xp from public.class_board() where nick = 'MangoComet'), 65);
select t.eq('board marks me', (select nick from public.class_board() where me), 'TealOtter');
reset role;
-- The board's columns: nicknames, avatars and numbers only.
select t.eq('board columns', (select string_agg(a, ',' order by o) from unnest(
  (select proargnames from pg_proc where proname = 'class_board')) with ordinality u(a, o)), 'nick,avatar,me,week_xp,climbed,mastered');

set role authenticated;
select set_config('request.jwt.claims', '{"sub":"66666666-6666-6666-6666-666666666666","email":"student.c@vinschool.edu.vn"}', false);
select t.eq('other class board does not show 7A', t.n('select * from public.class_board() where nick in (''MangoComet'', ''TealOtter'')'), 0);
reset role;

/* ---------- teacher view ---------- */
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","email":"teacher.one@vinschool.edu.vn"}', false);
select t.eq('teacher sees both students', t.n('select * from public.students'), 2);
select t.eq('teacher sees the class work', t.n('select * from public.attempts'), 3);
update public.classes set settings = '{"open": ["harvest","signal"], "boards": {"week": true, "climbers": true, "island": true}}' where code = 'HK7A24';
reset role;
select t.eq('teacher changed island settings', (select settings->'open' from classes where code = 'HK7A24'), '["harvest","signal"]'::jsonb);

set role authenticated;
select set_config('request.jwt.claims', '{"sub":"55555555-5555-5555-5555-555555555555","email":"teacher.two@vinschool.edu.vn"}', false);
select t.eq('teacher two sees only their own student', t.n('select * from public.students'), 1);
select t.eq('teacher two sees none of 7A''s work', t.n('select * from public.attempts'), 0);
reset role;

\echo ALL DATABASE CHECKS PASSED
