-- Perspecta: tables and rules for school sign-in and classes.
-- Run this once in the Supabase SQL editor (see docs/setup-school-login.md).
-- No student names, rosters or emails are stored in the repo. Emails live only in Supabase's own auth table.

-- The school email domain. Change it here if students use a different domain (e.g. 'st.vinschool.edu.vn').
create or replace function public.school_ok() returns boolean language sql stable as $$
  select coalesce(lower(auth.jwt() ->> 'email') ~ '@([a-z0-9-]+\.)*vinschool\.edu\.vn$', false)
$$;

create table if not exists public.teachers (
  user_id uuid primary key references auth.users on delete cascade
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,                              -- e.g. '7A'
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  teacher_id uuid not null references public.teachers(user_id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  user_id uuid primary key references auth.users on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  nick text not null check (char_length(nick) between 2 and 16),
  avatar text not null default '🦊',
  joined_at timestamptz not null default now(),
  unique (class_id, nick)
);

alter table public.teachers enable row level security;
alter table public.classes  enable row level security;
alter table public.students enable row level security;

create or replace function public.am_i_teacher() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from teachers where user_id = auth.uid())
$$;

-- Helper lookups run as the table owner, so the policies below don't loop into each other.
create or replace function public.my_class_id() returns uuid language sql stable security definer set search_path = public as $$
  select class_id from students where user_id = auth.uid()
$$;
create or replace function public.my_teaching_class_ids() returns setof uuid language sql stable security definer set search_path = public as $$
  select id from classes where teacher_id = auth.uid()
$$;

-- Students see only their own row; teachers see the students in their own classes.
drop policy if exists "student reads self" on public.students;
create policy "student reads self" on public.students for select
  using (user_id = auth.uid() and public.school_ok());
drop policy if exists "teacher reads class" on public.students;
create policy "teacher reads class" on public.students for select
  using (class_id in (select public.my_teaching_class_ids()));

-- Teachers see and manage their own classes. Students never read the classes table directly (codes stay private).
drop policy if exists "teacher manages classes" on public.classes;
create policy "teacher manages classes" on public.classes for all
  using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
-- A student may read the name of their own class (used to show "Class 7A").
drop policy if exists "student reads own class" on public.classes;
create policy "student reads own class" on public.classes for select
  using (id = public.my_class_id());

drop policy if exists "teacher reads self" on public.teachers;
create policy "teacher reads self" on public.teachers for select using (user_id = auth.uid());

-- Joining a class: the only way a student row is created. Checks the school email and the class code.
create or replace function public.join_class(class_code text, nickname text, agent text)
returns void language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  if auth.uid() is null or not public.school_ok() then raise exception 'school account needed'; end if;
  select id into cid from classes where code = upper(class_code);
  if cid is null then raise exception 'unknown class code'; end if;
  if exists (select 1 from students where class_id = cid and lower(nick) = lower(nickname) and user_id <> auth.uid()) then
    raise exception 'nickname taken';
  end if;
  insert into students (user_id, class_id, nick, avatar) values (auth.uid(), cid, nickname, coalesce(agent, '🦊'))
  on conflict (user_id) do update set class_id = excluded.class_id, nick = excluded.nick, avatar = excluded.avatar;
end $$;

revoke all on function public.join_class(text, text, text) from public, anon;
grant execute on function public.join_class(text, text, text) to authenticated;
revoke all on function public.am_i_teacher() from public, anon;
grant execute on function public.am_i_teacher() to authenticated;
revoke all on function public.my_class_id() from public, anon;
grant execute on function public.my_class_id() to authenticated;
revoke all on function public.my_teaching_class_ids() from public, anon;
grant execute on function public.my_teaching_class_ids() to authenticated;
