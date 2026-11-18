-- =====================================================================
-- Days: database setup
-- Paste this whole file into Supabase > SQL Editor > New query > Run.
-- Safe to run again: it only creates things that don't exist yet.
-- =====================================================================

-- ---------- People (the brief's "users" table) ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  name        text not null default '',
  username    text unique not null,
  avatar_url  text,
  theme       text not null default 'playful' check (theme in ('playful', 'chic')),
  daily_min   int  not null default 1  check (daily_min >= 0),
  daily_max   int  not null default 10 check (daily_max between 1 and 50),
  created_at  timestamptz not null default now()
);

-- Create a profile automatically whenever someone signs up
-- (email, Google or Facebook). Username = their name + a short code.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  nm   text := coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'me');
  base text := nullif(lower(regexp_replace(nm, '[^a-zA-Z0-9]', '', 'g')), '');
begin
  insert into public.profiles (id, name, username, avatar_url)
  values (new.id, nm, coalesce(base, 'me') || '_' || substr(replace(new.id::text, '-', ''), 1, 4),
          new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Captures (photos, videos, notes) ----------
create table if not exists public.captures (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles on delete cascade,
  type            text not null check (type in ('photo', 'video', 'audio', 'text')),
  media_url       text,
  thumb_url       text,
  taken_at        timestamptz not null,
  day             date not null,           -- the calendar day on the phone that took it
  latitude        double precision,
  longitude       double precision,
  place_name      text,
  comment         text,
  voice_note_url  text,
  imported        boolean not null default false,
  created_at      timestamptz not null default now()
);
create index if not exists captures_user_day on public.captures (user_id, day, taken_at);

-- Enforce the daily maximum (imported photos don't count).
create or replace function public.enforce_daily_max() returns trigger
language plpgsql security definer set search_path = public as $$
declare maxn int; n int;
begin
  if new.imported then return new; end if;
  select daily_max into maxn from profiles where id = new.user_id;
  select count(*) into n from captures where user_id = new.user_id and day = new.day and not imported;
  if n >= coalesce(maxn, 10) then
    raise exception 'Daily limit reached';
  end if;
  return new;
end $$;

drop trigger if exists captures_daily_max on public.captures;
create trigger captures_daily_max before insert on public.captures
  for each row execute function public.enforce_daily_max();

-- ---------- Tags and follows ----------
create table if not exists public.tags (
  capture_id      uuid references public.captures on delete cascade,
  tagged_user_id  uuid references public.profiles on delete cascade,
  primary key (capture_id, tagged_user_id)
);

create table if not exists public.follows (
  follower_id   uuid references public.profiles on delete cascade,
  following_id  uuid references public.profiles on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

-- ---------- Who can see and change what ----------
alter table public.profiles enable row level security;
alter table public.captures enable row level security;
alter table public.tags     enable row level security;
alter table public.follows  enable row level security;

drop policy if exists "profiles readable" on public.profiles;
create policy "profiles readable" on public.profiles for select to authenticated using (true);
drop policy if exists "edit own profile" on public.profiles;
create policy "edit own profile" on public.profiles for update to authenticated using (id = auth.uid());

drop policy if exists "captures readable" on public.captures;
create policy "captures readable" on public.captures for select to authenticated using (true);
drop policy if exists "add own captures" on public.captures;
create policy "add own captures" on public.captures for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "edit own captures" on public.captures;
create policy "edit own captures" on public.captures for update to authenticated using (user_id = auth.uid());
drop policy if exists "delete own captures" on public.captures;
create policy "delete own captures" on public.captures for delete to authenticated using (user_id = auth.uid());

drop policy if exists "tags readable" on public.tags;
create policy "tags readable" on public.tags for select to authenticated using (true);
drop policy if exists "tag on own captures" on public.tags;
create policy "tag on own captures" on public.tags for all to authenticated
  using (exists (select 1 from public.captures c where c.id = capture_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.captures c where c.id = capture_id and c.user_id = auth.uid()));

drop policy if exists "follows readable" on public.follows;
create policy "follows readable" on public.follows for select to authenticated using (true);
drop policy if exists "follow as yourself" on public.follows;
create policy "follow as yourself" on public.follows for insert to authenticated with check (follower_id = auth.uid());
drop policy if exists "unfollow as yourself" on public.follows;
create policy "unfollow as yourself" on public.follows for delete to authenticated using (follower_id = auth.uid());

-- ---------- Photo / video / voice storage ----------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "upload own media" on storage.objects;
create policy "upload own media" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "delete own media" on storage.objects;
create policy "delete own media" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
