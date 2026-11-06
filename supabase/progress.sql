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

/* ---------------- save one finished activity ---------------- */
-- The app sends what the student tapped. The server decides what was right, and how much XP it earns.
--   question answers: { item, picks: [option positions in data order, 0 = right], simplified, help }
--   reflections:      { item: 'fizz-refl-N', reflection: true, text }
--   game cards:       { item: 'trust-N', v: true | false | null }
create or replace function public.save_attempt(p_client_id text, p_text_id text, p_answers jsonb)
returns int language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid(); cls uuid; a jsonb; it record; card record;
  pos int; simp boolean; sup text; barrier text; traps jsonb; gap text; o jsonb;
  clean jsonb := '[]'::jsonb; raw int := 0; xp int; n int; is_game boolean; is_gym boolean;
  combo int := 0; pts int := 0; used int; today date := public.school_day(now());
  first_xp int[] := array[10, 15, 20, 25];
begin
  select class_id into cls from students where user_id = me;
  if cls is null or not public.school_ok() then raise exception 'not in a class'; end if;
  if exists (select 1 from attempts where user_id = me and client_id = p_client_id) then
    return (select attempts.xp from attempts where user_id = me and client_id = p_client_id);
  end if;
  if jsonb_typeof(p_answers) <> 'array' or jsonb_array_length(p_answers) not between 1 and 12 then raise exception 'bad answers'; end if;
  if p_text_id !~ '^(fizz-(briefing|dossier|board|debrief|replay)|gym-[0-9T:-]{1,20}|game-trust)$' then raise exception 'unknown activity'; end if;
  if (select count(*) from attempts where user_id = me and public.school_day(created_at) = today) >= 80 then
    raise exception 'daily limit';
  end if;
  is_game := p_text_id = 'game-trust'; is_gym := p_text_id like 'gym-%';

  for a in select * from jsonb_array_elements(p_answers) loop
    if is_game then
      select * into card from trust_cards where idx = nullif(substring(a->>'item' from '^trust-([0-9]+)$'), '')::int;
      if card is null then raise exception 'unknown card'; end if;
      if (a->'v') is not null and jsonb_typeof(a->'v') = 'boolean' and (a->>'v')::boolean = card.ok then
        combo := combo + 1; pts := pts + 100 + 20 * (combo - 1); sup := 'none';
      else combo := 0; sup := 'explained'; end if;
      clean := clean || jsonb_build_object('item', a->>'item', 'game', true, 'support', sup,
        'traps', case when sup = 'explained' and card.trap is not null then jsonb_build_array(card.trap) else '[]'::jsonb end);
    elsif coalesce((a->>'reflection')::boolean, false) then
      if p_text_id <> 'fizz-debrief' then raise exception 'reflection outside debrief'; end if;
      clean := clean || jsonb_build_object('item', left(a->>'item', 40), 'block', 'F2', 'reflection', true,
        'text', left(coalesce(a->>'text', ''), 1000), 'support', 'none', 'help', 0);
      if char_length(trim(coalesce(a->>'text', ''))) >= 10 then raw := raw + 5; end if;
    else
      select * into it from items where id = a->>'item';
      if it is null then raise exception 'unknown question'; end if;
      simp := coalesce((a->>'simplified')::boolean, false);
      if jsonb_typeof(coalesce(a->'picks', '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(a->'picks', '[]'::jsonb)) > 4 then raise exception 'bad picks'; end if;
      -- position (1-based) of the first tap on the right option; null if never tapped
      select min(ord) into pos from jsonb_array_elements_text(coalesce(a->'picks', '[]'::jsonb)) with ordinality as x(k, ord) where x.k = '0';
      barrier := null;
      if pos = 1 then sup := 'none';
      elsif simp and pos = 2 then sup := 'none'; barrier := 'language';
      elsif not simp and pos = 2 then sup := 'hint';     -- the app allows two wrong taps, then moves on without showing the answer
      else sup := 'explained'; end if;
      traps := '[]'::jsonb; gap := null;
      for o in select it.options -> (x.k::int) from jsonb_array_elements_text(coalesce(a->'picks', '[]'::jsonb)) as x(k)
               where x.k ~ '^[1-9]$' and x.k::int < jsonb_array_length(it.options) loop
        if barrier is null and o->>'trap' is not null then traps := traps || jsonb_build_array(o->>'trap'); end if;
        if o->>'b' is not null then gap := o->>'b'; end if;
      end loop;
      clean := clean || jsonb_build_object('item', it.id, 'block', it.block, 'demand', it.demand, 'support', sup, 'barrier', barrier,
        'first_try', sup = 'none' and barrier is null, 'traps', traps, 'gap', case when sup = 'explained' then gap end,
        'help', least(greatest(coalesce((a->>'help')::int, 0), 0), 50),
        'picks', coalesce(a->'picks', '[]'::jsonb), 'ms', least(greatest(coalesce((a->>'ms')::int, 0), 0), 3600000));
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
    raw := raw + 20 + case when p_text_id = 'fizz-debrief' then 50 else 0 end;
    -- replays: same activity on the same day pays half the second time, then nothing. Think Gym: 3 full sets a day, then 2 at half.
    select count(*) into n from attempts where user_id = me and public.school_day(created_at) = today
      and (text_id = p_text_id or (is_gym and text_id like 'gym-%'));
    xp := case when is_gym then case when n < 3 then raw when n < 5 then round(raw / 2.0)::int else 0 end
               else case when n = 0 then raw when n = 1 then round(raw / 2.0)::int else 0 end end;
  end if;

  insert into attempts (user_id, class_id, client_id, text_id, mode, answers, xp)
  values (me, cls, left(p_client_id, 64), p_text_id, case when is_game then 'game' when is_gym then 'practice' else 'mission' end, clean, xp);
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
