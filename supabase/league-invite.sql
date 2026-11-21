-- SwipeVocab: arkadaşlarla haftalık lig ve davet bağlantısı (supabase/friends.sql'den SONRA çalıştır).
-- Supabase SQL Editor'da bir kez çalıştır. Tekrar çalıştırmak güvenlidir. Mevcut verilere dokunmaz.
--
--  * Lig: herkesin bu takvim haftasında (Pazartesi başlangıçlı) kazandığı puan vitrinde tutulur; yalnızca
--    arkadaşlar görür (village_public'in mevcut okuma kuralı).
--  * Davet: davet bağlantısıyla gelen YENİ hesap (son 3 günde açılmış) davet edenle doğrudan arkadaş olur.
--    Eski bir hesap bağlantıya tıklarsa normal arkadaşlık isteği gider (karşı tarafın kabulü gerekir).

alter table public.village_public add column if not exists weekly_points int not null default 0;
alter table public.village_public add column if not exists week_key text not null default '';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'village_public_weekly_points_check') then
    alter table public.village_public add constraint village_public_weekly_points_check check (weekly_points between 0 and 1000000);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'village_public_week_key_check') then
    alter table public.village_public add constraint village_public_week_key_check check (char_length(week_key) <= 10);
  end if;
end $$;

-- Lig puanını da gönderen sürüm (eski 5 parametreli sürüm eski uygulamalar için yerinde kalır).
create or replace function public.village_publish(
  p_name text, p_snapshot jsonb, p_level int, p_streak int, p_language text, p_weekly int, p_week text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  my_code text;
begin
  my_code := public.village_publish(p_name, p_snapshot, p_level, p_streak, p_language);
  update public.village_public
    set weekly_points = greatest(0, least(coalesce(p_weekly, 0), 1000000)),
        week_key = left(coalesce(p_week, ''), 10)
    where user_id = (select auth.uid());
  return my_code;
end;
$$;
revoke all on function public.village_publish(text, jsonb, int, int, text, int, text) from public, anon;
grant execute on function public.village_publish(text, jsonb, int, int, text, int, text) to authenticated;

-- Davet bağlantısıyla gelen: yeni hesapsa doğrudan arkadaş, değilse normal istek.
-- Dönüş: accepted | sent | already | self | not_found | limit
create or replace function public.friend_invite(p_code text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  other uuid;
  is_new boolean;
begin
  if uid is null then raise exception 'not signed in' using errcode = '28000'; end if;
  select user_id into other from public.village_public where code = upper(btrim(p_code));
  if other is null then return 'not_found'; end if;
  if other = uid then return 'self'; end if;
  if exists (select 1 from public.friendships where a = least(uid, other) and b = greatest(uid, other)) then
    return 'already';
  end if;
  select created_at > now() - interval '3 days' into is_new from auth.users where id = uid;
  if coalesce(is_new, false) then
    delete from public.friend_requests where (from_id = uid and to_id = other) or (from_id = other and to_id = uid);
    insert into public.friendships (a, b) values (least(uid, other), greatest(uid, other)) on conflict do nothing;
    return 'accepted';
  end if;
  return public.friend_request(p_code);
end;
$$;
revoke all on function public.friend_invite(text) from public, anon;
grant execute on function public.friend_invite(text) to authenticated;
