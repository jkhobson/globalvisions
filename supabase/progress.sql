-- Global Visions: saving students' work, XP worked out on the server, class leaderboards.
-- Run after schema.sql, then run content.sql. Safe to run again.
-- The rules here mirror js/engine.js and js/kit/rewards.js. If you change one, change the other (tests compare them).

/* ---------------- content the server needs ---------------- */
create table if not exists public.blocks (id text primary key, needs text[] not null default '{}');
create table if not exists public.items (
  id text primary key, block text not null references public.blocks(id), demand int not null check (demand between 0 and 3),
  options jsonb not null                      -- one entry per option, in data order (first = right): { trap, b }
);
create table if not exists public.trust_cards (idx int primary key, ok boolean not null, trap text);
-- The answer key lives only here: options are stored in the same alphabetical order as js/content/fizz-public.js,
-- each as { right, trap, b, why }. The school website never gets it.
alter table public.items add column if not exists explain text not null default '';
alter table public.trust_cards add column if not exists why text not null default '';
-- Sentence jumbles: seq is the right order (positions in the public list); steps[n] is the reason shown when place n is wrong.
alter table public.items add column if not exists seq int[];
alter table public.items add column if not exists steps jsonb;
alter table public.blocks enable row level security;
alter table public.items enable row level security;
alter table public.trust_cards enable row level security;
-- No policies: only the functions below (which run as the owner) read these tables.

/* ---------------- class settings (islands open, leaderboards on) ---------------- */
alter table public.classes add column if not exists settings jsonb not null
  default '{"open": ["harvest"], "boards": {"week": true, "climbers": true, "island": true}}';

/* ---------------- saved work ---------------- */
create table if not exists public.attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  client_id text not null,                    -- made by the app, so a retried upload isn't saved twice
  text_id text not null, mode text not null,
  answers jsonb not null, xp int not null,
  created_at timestamptz not null default now(),
  unique (user_id, client_id)
);
create index if not exists attempts_class on public.attempts (class_id, created_at);
alter table public.attempts enable row level security;
drop policy if exists "student reads own attempts" on public.attempts;
create policy "student reads own attempts" on public.attempts for select using (user_id = auth.uid());
drop policy if exists "teacher reads class attempts" on public.attempts;
create policy "teacher reads class attempts" on public.attempts for select
  using (class_id in (select public.my_teaching_class_ids()));
-- No insert/update/delete policies: work is saved only through save_attempt, which works out the XP.

/* ---------------- school day (UTC+7, same as js/kit/rewards.js) ---------------- */
create or replace function public.school_day(t timestamptz) returns date language sql immutable as $$
  select ((t at time zone 'UTC') + interval '7 hours')::date
$$;
create or replace function public.school_week_start(t timestamptz) returns timestamptz language sql immutable as $$
  select (date_trunc('week', (t at time zone 'UTC') + interval '7 hours') - interval '7 hours') at time zone 'UTC'
$$;

/* ---------------- checking one tap (school mode) ---------------- */
-- The app doesn't know the right answers. Each tap is sent here: the server says right or wrong, gives the reason
-- for a wrong choice, and records the tap. save_attempt then marks the activity from these records, not from the app.
create table if not exists public.checks (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  item_id text not null,                      -- a question id, or 'trust-N' for a game card
  pick int, is_right boolean not null, ms int not null default 0, simplified boolean not null default false,
  attempt_id bigint references public.attempts(id) on delete set null,   -- set when save_attempt uses it
  created_at timestamptz not null default now()
);
alter table public.checks add column if not exists seq int[];   -- the order a student checked, for sentence jumbles
create index if not exists checks_open on public.checks (user_id, item_id) where attempt_id is null;
alter table public.checks enable row level security;   -- no policies: only these functions use it
create table if not exists public.deals (user_id uuid primary key references auth.users on delete cascade, slots int[] not null default '{}');
alter table public.deals enable row level security;

-- Where the right answer goes for this student's next question: spread evenly, never 3 in a row (like dealSlots).
-- Returns the option positions (in the public list) in the order to show them.
create or replace function public.deal_options(p_item text) returns int[]
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); it record; hist int[]; n int; slot int; r int; order_ int[] := '{}'; k int;
begin
  if public.my_class_id() is null then raise exception 'not in a class'; end if;
  select * into it from items where id = p_item; if it is null then raise exception 'unknown question'; end if;
  n := jsonb_array_length(it.options);
  select slots into hist from deals where user_id = me; hist := coalesce(hist, '{}');
  -- the least-used slots in the last 8 questions, leaving out one that would make 3 in a row
  select s into slot from generate_series(0, n - 1) s
    where not (cardinality(hist) >= 2 and hist[cardinality(hist)] = s and hist[cardinality(hist) - 1] = s)
    order by (select count(*) from unnest(hist[greatest(1, cardinality(hist) - 7):]) h where h = s), random() limit 1;
  insert into deals (user_id, slots) values (me, array[slot]) on conflict (user_id) do update set slots = (deals.slots || slot)[greatest(1, cardinality(deals.slots) - 6):];
  select x.ord - 1 into r from jsonb_array_elements(it.options) with ordinality x(o, ord) where (x.o->>'right')::boolean;
  for k in select (x.ord - 1)::int from jsonb_array_elements(it.options) with ordinality x(o, ord) where not (x.o->>'right')::boolean order by random() loop
    order_ := order_ || k;
  end loop;
  return order_[1:slot] || r || order_[slot + 1:];
end $$;

-- One tap on an option. Two wrong taps on a question, then it's locked until the activity is saved.
create or replace function public.check_answer(p_item text, p_pick int, p_ms int default 0, p_simplified boolean default false) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); it record; o jsonb; prev record; wrongs int;
begin
  if public.my_class_id() is null or not public.school_ok() then raise exception 'not in a class'; end if;
  select * into it from items where id = p_item; if it is null then raise exception 'unknown question'; end if;
  if p_pick is null or p_pick < 0 or p_pick >= jsonb_array_length(it.options) then raise exception 'bad pick'; end if;
  if (select count(*) from checks where user_id = me and created_at > now() - interval '1 day') >= 600 then raise exception 'daily limit'; end if;
  o := it.options -> p_pick;
  select * into prev from checks where user_id = me and item_id = p_item and attempt_id is null and pick = p_pick and created_at > now() - interval '3 hours' limit 1;
  if not found then
    if exists (select 1 from checks where user_id = me and item_id = p_item and attempt_id is null and is_right and created_at > now() - interval '3 hours') then
      return jsonb_build_object('locked', true);
    end if;
    select count(*) into wrongs from checks where user_id = me and item_id = p_item and attempt_id is null and not is_right and created_at > now() - interval '3 hours';
    if wrongs >= 2 then return jsonb_build_object('locked', true); end if;
    insert into checks (user_id, item_id, pick, is_right, ms, simplified)
      values (me, p_item, p_pick, (o->>'right')::boolean, least(greatest(coalesce(p_ms, 0), 0), 3600000), coalesce(p_simplified, false));
  end if;
  if (o->>'right')::boolean then return jsonb_build_object('right', true, 'explain', it.explain); end if;
  return jsonb_build_object('right', false, 'why', o->>'why', 'trap', o->>'trap', 'b', o->>'b');
end $$;

-- One sentence-jumble check. Says right or wrong and, if wrong, the first place that is wrong and that place's job.
-- It never says which sentence belongs there. Two wrong checks, then it's locked until the activity is saved.
-- Checking the same order again doesn't count twice. Recorded as pick 0 (right) or 1 (wrong), like a tap.
create or replace function public.check_order(p_item text, p_seq int[], p_ms int default 0) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); it record; n int; pos int; wrongs int;
begin
  if public.my_class_id() is null or not public.school_ok() then raise exception 'not in a class'; end if;
  select * into it from items where id = p_item; if it is null or it.seq is null then raise exception 'unknown jumble'; end if;
  n := cardinality(it.seq);
  if p_seq is null or cardinality(p_seq) <> n or (select count(distinct x) from unnest(p_seq) x where x between 0 and n - 1) <> n then raise exception 'bad order'; end if;
  if (select count(*) from checks where user_id = me and created_at > now() - interval '1 day') >= 600 then raise exception 'daily limit'; end if;
  select min(i) into pos from generate_subscripts(it.seq, 1) i where p_seq[i] <> it.seq[i];
  if not exists (select 1 from checks where user_id = me and item_id = p_item and attempt_id is null and seq = p_seq and created_at > now() - interval '3 hours') then
    if exists (select 1 from checks where user_id = me and item_id = p_item and attempt_id is null and is_right and created_at > now() - interval '3 hours') then
      return jsonb_build_object('locked', true);
    end if;
    select count(*) into wrongs from checks where user_id = me and item_id = p_item and attempt_id is null and not is_right and created_at > now() - interval '3 hours';
    if wrongs >= 2 then return jsonb_build_object('locked', true); end if;
    insert into checks (user_id, item_id, pick, seq, is_right, ms)
      values (me, p_item, case when pos is null then 0 else 1 end, p_seq, pos is null, least(greatest(coalesce(p_ms, 0), 0), 3600000));
  end if;
  if pos is null then return jsonb_build_object('right', true, 'explain', it.explain); end if;
  return jsonb_build_object('right', false, 'pos', pos - 1, 'why', it.steps ->> (pos - 1));
end $$;

-- Trust or Bust: 8 cards (4 to trust, 4 to bust), the ones this student has seen least.
create or replace function public.deal_cards() returns int[]
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); res int[];
begin
  if public.my_class_id() is null then raise exception 'not in a class'; end if;
  with seen as (select substring(x->>'item' from '^trust-([0-9]+)$')::int idx, count(*) n
                from attempts t, jsonb_array_elements(t.answers) x where t.user_id = me and t.text_id = 'game-trust' group by 1),
       ranked as (select c.idx, c.ok, row_number() over (partition by c.ok order by coalesce(s.n, 0), random()) rn
                  from trust_cards c left join seen s on s.idx = c.idx)
  select array_agg(idx order by random()) into res from ranked where rn <= 4;
  return res;
end $$;
-- One game card. v is null when the timer ran out. Only the first answer to a card counts.
create or replace function public.check_card(p_idx int, p_v boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); c record; ok boolean;
begin
  if public.my_class_id() is null or not public.school_ok() then raise exception 'not in a class'; end if;
  select * into c from trust_cards where idx = p_idx; if c is null then raise exception 'unknown card'; end if;
  ok := coalesce(p_v = c.ok, false);
  if not exists (select 1 from checks where user_id = me and item_id = 'trust-' || p_idx and attempt_id is null and created_at > now() - interval '3 hours') then
    insert into checks (user_id, item_id, pick, is_right) values (me, 'trust-' || p_idx, case when p_v is null then null when p_v then 1 else 0 end, ok);
  end if;
  return jsonb_build_object('right', ok, 'why', c.why, 'trap', case when ok then null else c.trap end);
end $$;

/* ---------------- save one finished activity ---------------- */
-- The app sends what the student tapped. The server decides what was right, and how much XP it earns.
--   question answers: { item, help }   (what was tapped comes from check_answer's records, not from the app)
--   reflections:      { item: '<mission>-refl-N', reflection: true, text }   (only in a mission's debrief)
--   game cards:       { item: 'trust-N' }  (the first check_card answer counts)
create or replace function public.save_attempt(p_client_id text, p_text_id text, p_answers jsonb)
returns int language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid(); cls uuid; a jsonb; it record; card record;
  pos int; simp boolean; sup text; barrier text; traps jsonb; gap text; o jsonb;
  clean jsonb := '[]'::jsonb; raw int := 0; xp int; n int; is_game boolean; is_gym boolean;
  combo int := 0; pts int := 0; used int; today date := public.school_day(now());
  ids bigint[]; used_checks bigint[] := '{}'; picks jsonb; rights boolean[]; first_ms int; new_id bigint;
  refl_block text := case p_text_id when 'fizz-debrief' then 'F2' when 'signal-debrief' then 'F3' end;
  first_xp int[] := array[10, 15, 20, 25];
begin
  select class_id into cls from students where user_id = me;
  if cls is null or not public.school_ok() then raise exception 'not in a class'; end if;
  if exists (select 1 from attempts where user_id = me and client_id = p_client_id) then
    return (select attempts.xp from attempts where user_id = me and client_id = p_client_id);
  end if;
  if jsonb_typeof(p_answers) <> 'array' or jsonb_array_length(p_answers) not between 1 and 12 then raise exception 'bad answers'; end if;
  if p_text_id !~ '^((fizz|signal)-(briefing|dossier|board|debrief|replay)|(gym|dojo)-[0-9T:-]{1,20}|game-trust)$' then raise exception 'unknown activity'; end if;
  if (select count(*) from attempts where user_id = me and public.school_day(created_at) = today) >= 80 then
    raise exception 'daily limit';
  end if;
  is_game := p_text_id = 'game-trust'; is_gym := p_text_id ~ '^(gym|dojo)-';   -- Think Gym and Debate Dojo share the practice limits

  for a in select * from jsonb_array_elements(p_answers) loop
    if is_game then
      select * into card from trust_cards where idx = nullif(substring(a->>'item' from '^trust-([0-9]+)$'), '')::int;
      if card is null then raise exception 'unknown card'; end if;
      select array_agg(id order by id) into ids from checks where user_id = me and item_id = 'trust-' || card.idx and attempt_id is null and created_at > now() - interval '3 hours';
      used_checks := used_checks || coalesce(ids, '{}');
      if (select is_right from checks where id = ids[1]) then
        combo := combo + 1; pts := pts + 100 + 20 * (combo - 1); sup := 'none';
      else combo := 0; sup := 'explained'; end if;
      clean := clean || jsonb_build_object('item', a->>'item', 'game', true, 'support', sup,
        'traps', case when sup = 'explained' and card.trap is not null then jsonb_build_array(card.trap) else '[]'::jsonb end);
    elsif coalesce((a->>'reflection')::boolean, false) then
      if refl_block is null then raise exception 'reflection outside debrief'; end if;
      clean := clean || jsonb_build_object('item', left(a->>'item', 40), 'block', refl_block, 'reflection', true,
        'text', left(coalesce(a->>'text', ''), 1000), 'support', 'none', 'help', 0);
      if char_length(trim(coalesce(a->>'text', ''))) >= 10 then raw := raw + 5; end if;
    else
      select * into it from items where id = a->>'item';
      if it is null then raise exception 'unknown question'; end if;
      -- the taps the server recorded for this question since it was last saved
      select array_agg(id order by id), coalesce(jsonb_agg(pick order by id), '[]'::jsonb), array_agg(is_right order by id), bool_or(simplified), (array_agg(ms order by id))[1]
        into ids, picks, rights, simp, first_ms
        from checks where user_id = me and item_id = it.id and attempt_id is null and created_at > now() - interval '3 hours';
      used_checks := used_checks || coalesce(ids, '{}'); simp := coalesce(simp, false);
      -- position (1-based) of the first tap on the right option; null if never tapped
      -- (each check was marked right or wrong when it was made, for taps and jumble orders alike)
      select min(ord) into pos from unnest(rights) with ordinality as x(r, ord) where x.r;
      barrier := null;
      if pos = 1 then sup := 'none';
      elsif simp and pos = 2 then sup := 'none'; barrier := 'language';
      elsif not simp and pos = 2 then sup := 'hint';     -- the app allows two wrong taps, then moves on without showing the answer
      else sup := 'explained'; end if;
      traps := '[]'::jsonb; gap := null;
      for o in select it.options -> (x.k::int) from jsonb_array_elements_text(picks) as x(k)
               where it.seq is null and not (it.options -> (x.k::int) ->> 'right')::boolean loop
        if barrier is null and o->>'trap' is not null then traps := traps || jsonb_build_array(o->>'trap'); end if;
        if o->>'b' is not null then gap := o->>'b'; end if;
      end loop;
      clean := clean || jsonb_build_object('item', it.id, 'block', it.block, 'demand', it.demand, 'support', sup, 'barrier', barrier,
        'first_try', sup = 'none' and barrier is null, 'traps', traps, 'gap', case when sup = 'explained' then gap end,
        'help', least(greatest(coalesce((a->>'help')::int, 0), 0), 50),
        'picks', picks, 'ms', coalesce(first_ms, 0));
      -- A question met before earns no XP again, so a student can't farm XP by repeating questions they've seen.
      if exists (select 1 from attempts t, jsonb_array_elements(t.answers) x where t.user_id = me and x->>'item' = it.id) then continue; end if;
      raw := raw + case when sup = 'none' and barrier = 'language' then round(first_xp[it.demand + 1] / 2.0)::int
                        when sup = 'none' then first_xp[it.demand + 1] when sup = 'hint' then 5 else 0 end;
    end if;
  end loop;

  if is_game then
    select coalesce(sum(attempts.xp), 0) into used from attempts where user_id = me and text_id = 'game-trust' and public.school_day(created_at) = today;
    xp := greatest(0, least(round(pts / 10.0)::int, 30 - used));
  else
    raw := raw + 20 + case when refl_block is not null then 50 else 0 end;
    -- replays: same activity on the same day pays half the second time, then nothing. Think Gym: 3 full sets a day, then 2 at half.
    select count(*) into n from attempts where user_id = me and public.school_day(created_at) = today
      and (text_id = p_text_id or (is_gym and text_id ~ '^(gym|dojo)-'));
    xp := case when is_gym then case when n < 3 then raw when n < 5 then round(raw / 2.0)::int else 0 end
               else case when n = 0 then raw when n = 1 then round(raw / 2.0)::int else 0 end end;
  end if;

  insert into attempts (user_id, class_id, client_id, text_id, mode, answers, xp)
  values (me, cls, left(p_client_id, 64), p_text_id, case when is_game then 'game' when is_gym then 'practice' else 'mission' end, clean, xp)
  returning id into new_id;
  update checks set attempt_id = new_id where id = any(used_checks);
  return xp;
end $$;

/* ---------------- mastery (same rules as js/engine.js) ---------------- */
create or replace function public.mastery_of(p_user uuid, p_before timestamptz default 'infinity')
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare p jsonb := '{}'; b record; a jsonb; sup text; seen_before text[] := '{}'; v float8; n text;
begin
  for b in select id from blocks loop p := p || jsonb_build_object(b.id, 0.3); end loop;
  for a in select x.v from attempts t, jsonb_array_elements(t.answers) with ordinality as x(v, ord)
           where t.user_id = p_user and t.created_at < p_before order by t.created_at, t.id, x.ord loop
    -- game cards have no block; a language miss and a reflection don't move the GP skill
    if a->>'block' is null or not p ? (a->>'block') or coalesce(a->>'barrier' = 'language', false) or coalesce((a->>'reflection')::boolean, false) then
      seen_before := seen_before || (a->>'item'); continue;
    end if;
    sup := a->>'support';
    if sup = 'none' and (a->>'item') = any(seen_before) then sup := 'hint'; end if;
    v := (p->>(a->>'block'))::float8;
    if sup = 'none' then
      p := jsonb_set(p, array[a->>'block'], to_jsonb(v + (1 - v) * 0.35));
      for n in select unnest(needs) from blocks where id = a->>'block' loop
        if p ? n then p := jsonb_set(p, array[n], to_jsonb((p->>n)::float8 + (1 - (p->>n)::float8) * 0.15)); end if;
      end loop;
    elsif sup = 'hint' then p := jsonb_set(p, array[a->>'block'], to_jsonb(v + (1 - v) * 0.10));
    else
      p := jsonb_set(p, array[a->>'block'], to_jsonb(v * 0.55));
      if a->>'gap' is not null and p ? (a->>'gap') then p := jsonb_set(p, array[a->>'gap'], to_jsonb((p->>(a->>'gap'))::float8 * 0.70)); end if;
    end if;
    seen_before := seen_before || (a->>'item');
  end loop;
  return p;
end $$;
create or replace function public.mastered_count(p jsonb) returns int language sql immutable as $$
  select count(*)::int from jsonb_each_text(p) where value::float8 >= 0.85
$$;

/* ---------------- leaderboards for a student's own class: nicknames only ---------------- */
create or replace function public.class_board()
returns table (nick text, avatar text, me boolean, week_xp int, climbed int, mastered int)
language plpgsql stable security definer set search_path = public as $$
declare cls uuid := public.my_class_id(); wk timestamptz := public.school_week_start(now());
begin
  if cls is null then raise exception 'not in a class'; end if;
  return query
    select s.nick, s.avatar, s.user_id = auth.uid(),
      coalesce((select sum(t.xp) from attempts t where t.user_id = s.user_id and t.created_at >= wk), 0)::int,
      greatest(0, public.mastered_count(public.mastery_of(s.user_id)) - public.mastered_count(public.mastery_of(s.user_id, wk))),
      public.mastered_count(public.mastery_of(s.user_id))
    from students s where s.class_id = cls;
end $$;

revoke all on function public.deal_options(text) from public, anon;
grant execute on function public.deal_options(text) to authenticated;
revoke all on function public.check_answer(text, int, int, boolean) from public, anon;
grant execute on function public.check_answer(text, int, int, boolean) to authenticated;
revoke all on function public.check_order(text, int[], int) from public, anon;
grant execute on function public.check_order(text, int[], int) to authenticated;
revoke all on function public.deal_cards() from public, anon;
grant execute on function public.deal_cards() to authenticated;
revoke all on function public.check_card(int, boolean) from public, anon;
grant execute on function public.check_card(int, boolean) to authenticated;
revoke all on function public.save_attempt(text, text, jsonb) from public, anon;
grant execute on function public.save_attempt(text, text, jsonb) to authenticated;
revoke all on function public.class_board() from public, anon;
grant execute on function public.class_board() to authenticated;
revoke all on function public.mastery_of(uuid, timestamptz) from public, anon, authenticated;

/* ---------------- English support level, so the teacher sees both dials ---------------- */
alter table public.students add column if not exists support int not null default 1 check (support between 0 and 3);
create or replace function public.set_support(p_level int) returns void language sql security definer set search_path = public as $$
  update students set support = least(greatest(p_level, 0), 3) where user_id = auth.uid()
$$;
revoke all on function public.set_support(int) from public, anon;
grant execute on function public.set_support(int) to authenticated;
