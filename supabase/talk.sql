-- SwipeVocab: canlı sesli konuşma (eşleştirme, görüşmeler, engelleme, şikayet).
-- Supabase SQL Editor'da bir kez çalıştır. Tekrar çalıştırmak güvenlidir.
--
-- Güvenlik modeli:
--  * Eşleşme sırasına doğrudan kimse yazamaz; yalnızca talk_find_partner fonksiyonu yazar.
--  * Bir görüşmeyi yalnızca iki tarafı görebilir.
--  * Son 7 günde 3 farklı kişiden şikayet alan hesap eşleştirmeye giremez.

-- ---------- Profiller (diğer kullanıcılara görünen ad ve seviye) ----------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Kullanıcı' check (char_length(display_name) between 1 and 40),
  level        text not null default 'A2' check (level in ('A1', 'A2', 'B1', 'B2', 'C1')),
  updated_at   timestamptz not null default now()
);
alter table public.profiles enable row level security;
revoke all on public.profiles from anon;
grant select, insert, update on public.profiles to authenticated;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using (true);
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- ---------- Eşleşme sırası (yalnızca fonksiyonlar erişir) ----------
create table if not exists public.talk_queue (
  user_id   uuid primary key references auth.users (id) on delete cascade,
  level     text not null,
  joined_at timestamptz not null default now(),
  last_seen timestamptz not null default now()
);
alter table public.talk_queue enable row level security;
revoke all on public.talk_queue from anon, authenticated;

-- ---------- Görüşmeler ----------
create table if not exists public.talk_calls (
  id         uuid primary key default gen_random_uuid(),
  room       text not null unique,
  user_a     uuid not null references auth.users (id) on delete cascade,
  user_b     uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  ended_at   timestamptz
);
alter table public.talk_calls enable row level security;
revoke all on public.talk_calls from anon;
grant select on public.talk_calls to authenticated;

drop policy if exists talk_calls_select_own on public.talk_calls;
create policy talk_calls_select_own on public.talk_calls for select to authenticated
  using ((select auth.uid()) in (user_a, user_b));

-- ---------- Engelleme ----------
create table if not exists public.talk_blocks (
  blocker    uuid not null references auth.users (id) on delete cascade,
  blocked    uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked)
);
alter table public.talk_blocks enable row level security;
revoke all on public.talk_blocks from anon;
grant select, insert, delete on public.talk_blocks to authenticated;

drop policy if exists talk_blocks_own on public.talk_blocks;
create policy talk_blocks_own on public.talk_blocks for all to authenticated
  using ((select auth.uid()) = blocker) with check ((select auth.uid()) = blocker and blocked <> blocker);

-- ---------- Şikayetler (yalnızca eklenebilir, kullanıcılar okuyamaz) ----------
create table if not exists public.talk_reports (
  id         bigint generated always as identity primary key,
  reporter   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  reported   uuid not null references auth.users (id) on delete cascade,
  call_id    uuid references public.talk_calls (id) on delete set null,
  reason     text not null check (char_length(reason) between 1 and 300),
  created_at timestamptz not null default now()
);
alter table public.talk_reports enable row level security;
revoke all on public.talk_reports from anon;
grant insert on public.talk_reports to authenticated;

drop policy if exists talk_reports_insert_own on public.talk_reports;
create policy talk_reports_insert_own on public.talk_reports for insert to authenticated
  with check ((select auth.uid()) = reporter and reported <> reporter);

-- ---------- Eşleştirme ----------
-- Her 2-3 saniyede bir çağrılır. Sırası:
--   1. Beni eşleştiren yeni bir görüşme varsa onu döndür.
--   2. Seviyesi yakın (en fazla 1 fark), engellenmemiş, sırada bekleyen biri varsa görüşme aç.
--   3. Yoksa sıraya gir / sıradaki yerimi tazele, boş dön.
create or replace function public.talk_find_partner(p_level text)
returns table (call_id uuid, room text, partner_id uuid, partner_name text, partner_level text)
language plpgsql
security definer
set search_path = public
as $$
declare
  me      uuid := auth.uid();
  levels  text[] := array['A1', 'A2', 'B1', 'B2', 'C1'];
  my_lvl  int;
  partner uuid;
  c       public.talk_calls;
begin
  if me is null then
    raise exception 'not_authenticated';
  end if;
  my_lvl := array_position(levels, p_level);
  if my_lvl is null then
    raise exception 'invalid_level';
  end if;

  if (select count(distinct r.reporter) from public.talk_reports r
      where r.reported = me and r.created_at > now() - interval '7 days') >= 3 then
    delete from public.talk_queue where user_id = me;
    raise exception 'suspended';
  end if;

  -- 1. Başkası beni eşleştirdi mi?
  select * into c from public.talk_calls t
  where me in (t.user_a, t.user_b) and t.ended_at is null and t.created_at > now() - interval '45 seconds'
  order by t.created_at desc limit 1;
  if found then
    delete from public.talk_queue where user_id = me;
    partner := case when c.user_a = me then c.user_b else c.user_a end;
    return query select c.id, c.room, partner, p.display_name, p.level
      from (select 1) x left join public.profiles p on p.id = partner;
    return;
  end if;

  -- 2. Sırada uygun biri var mı?
  delete from public.talk_queue where last_seen < now() - interval '15 seconds';
  select q.user_id into partner
  from public.talk_queue q
  where q.user_id <> me
    and abs(array_position(levels, q.level) - my_lvl) <= 1
    and not exists (
      select 1 from public.talk_blocks b
      where (b.blocker = me and b.blocked = q.user_id) or (b.blocker = q.user_id and b.blocked = me)
    )
  order by abs(array_position(levels, q.level) - my_lvl), q.joined_at
  limit 1
  for update skip locked;

  if partner is not null then
    delete from public.talk_queue where user_id in (me, partner);
    insert into public.talk_calls (room, user_a, user_b)
    values ('talk-' || gen_random_uuid(), partner, me)
    returning * into c;
    return query select c.id, c.room, partner, p.display_name, p.level
      from (select 1) x left join public.profiles p on p.id = partner;
    return;
  end if;

  -- 3. Sıraya gir ya da yerini tazele.
  insert into public.talk_queue (user_id, level) values (me, p_level)
  on conflict (user_id) do update set last_seen = now(), level = excluded.level;
  return;
end;
$$;

create or replace function public.talk_leave_queue()
returns void language sql security definer set search_path = public as $$
  delete from public.talk_queue where user_id = auth.uid();
$$;

create or replace function public.talk_end_call(p_call uuid)
returns void language sql security definer set search_path = public as $$
  update public.talk_calls set ended_at = now()
  where id = p_call and auth.uid() in (user_a, user_b) and ended_at is null;
$$;

revoke all on function public.talk_find_partner(text) from public, anon;
revoke all on function public.talk_leave_queue() from public, anon;
revoke all on function public.talk_end_call(uuid) from public, anon;
grant execute on function public.talk_find_partner(text) to authenticated;
grant execute on function public.talk_leave_queue() to authenticated;
grant execute on function public.talk_end_call(uuid) to authenticated;
