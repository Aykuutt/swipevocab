-- SwipeVocab: arkadaşlar ve köy ziyareti.
-- Supabase SQL Editor'da bir kez çalıştır. Tekrar çalıştırmak güvenlidir.
--
-- Güvenlik modeli:
--  * Herkesin köyünün bir "vitrin" kopyası (village_public) tutulur: ad, köy haritası, seviye, seri, dil.
--    E-posta ve kelimeler burada YOKTUR. Bu satırı yalnızca sahibi ve arkadaşları okuyabilir.
--  * Arkadaş kodu ile istek gönderilir; kodu bilmeyen kimseyi bulamaz. Arkadaşlık iki taraflıdır (kabul gerekir).
--  * Tablolara doğrudan yazılamaz; yazma işleri aşağıdaki fonksiyonlarla, yalnızca çağıranın kendi adına yapılır.
--  * Beğeni yalnızca arkadaşa, günde bir kez bırakılır ve puan vermez.
--  * Hesap silinince hepsi auth.users üzerinden "on delete cascade" ile silinir.

-- ---------- Köy vitrini ----------
create table if not exists public.village_public (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  code         text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  display_name text not null default 'Oyuncu' check (char_length(display_name) between 1 and 40),
  snapshot     jsonb not null default '{}'::jsonb check (pg_column_size(snapshot) < 65536),
  level        int not null default 1 check (level between 0 and 1000),
  streak       int not null default 0 check (streak between 0 and 100000),
  language     text not null default 'en' check (char_length(language) <= 5),
  updated_at   timestamptz not null default now()
);
alter table public.village_public enable row level security;
revoke all on public.village_public from anon, authenticated;
grant select on public.village_public to authenticated;

-- ---------- Arkadaşlıklar (a < b) ve istekler ----------
create table if not exists public.friendships (
  a          uuid not null references auth.users (id) on delete cascade,
  b          uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (a, b),
  check (a < b)
);
alter table public.friendships enable row level security;
revoke all on public.friendships from anon, authenticated;
grant select on public.friendships to authenticated;

create table if not exists public.friend_requests (
  from_id    uuid not null references auth.users (id) on delete cascade,
  to_id      uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (from_id, to_id),
  check (from_id <> to_id)
);
alter table public.friend_requests enable row level security;
revoke all on public.friend_requests from anon, authenticated;
grant select on public.friend_requests to authenticated;

-- ---------- Beğeniler (günde bir) ----------
create table if not exists public.village_likes (
  from_id    uuid not null references auth.users (id) on delete cascade,
  to_id      uuid not null references auth.users (id) on delete cascade,
  day        date not null default current_date,
  created_at timestamptz not null default now(),
  primary key (from_id, to_id, day),
  check (from_id <> to_id)
);
alter table public.village_likes enable row level security;
revoke all on public.village_likes from anon, authenticated;
grant select, insert on public.village_likes to authenticated;

-- ---------- Yardımcı: iki kişi arkadaş mı? ----------
create or replace function public.is_friend(p_other uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.friendships f
    where (f.a = (select auth.uid()) and f.b = p_other) or (f.b = (select auth.uid()) and f.a = p_other)
  );
$$;
revoke all on function public.is_friend(uuid) from public, anon;
grant execute on function public.is_friend(uuid) to authenticated;

-- ---------- Okuma kuralları ----------
drop policy if exists village_public_read on public.village_public;
create policy village_public_read on public.village_public for select to authenticated
  using (user_id = (select auth.uid()) or public.is_friend(user_id));

drop policy if exists friendships_read on public.friendships;
create policy friendships_read on public.friendships for select to authenticated
  using ((select auth.uid()) in (a, b));

drop policy if exists friend_requests_read on public.friend_requests;
create policy friend_requests_read on public.friend_requests for select to authenticated
  using ((select auth.uid()) in (from_id, to_id));

drop policy if exists village_likes_read on public.village_likes;
create policy village_likes_read on public.village_likes for select to authenticated
  using ((select auth.uid()) in (from_id, to_id));

drop policy if exists village_likes_insert on public.village_likes;
create policy village_likes_insert on public.village_likes for insert to authenticated
  with check (from_id = (select auth.uid()) and public.is_friend(to_id));

-- ---------- Köy vitrinini güncelle (kod yoksa üretir) ----------
create or replace function public.village_publish(
  p_name text, p_snapshot jsonb, p_level int, p_streak int, p_language text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  my_code text;
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- karışan harfler (I, O, 0, 1) yok
  attempt int := 0;
begin
  if uid is null then raise exception 'not signed in' using errcode = '28000'; end if;
  select code into my_code from public.village_public where user_id = uid;
  if my_code is null then
    loop
      attempt := attempt + 1;
      my_code := '';
      for i in 1..6 loop
        my_code := my_code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
      end loop;
      exit when not exists (select 1 from public.village_public where code = my_code);
      if attempt > 20 then raise exception 'could not generate code'; end if;
    end loop;
  end if;
  insert into public.village_public as v (user_id, code, display_name, snapshot, level, streak, language, updated_at)
  values (
    uid, my_code,
    coalesce(nullif(left(btrim(p_name), 40), ''), 'Oyuncu'),
    coalesce(p_snapshot, '{}'::jsonb),
    greatest(0, least(coalesce(p_level, 1), 1000)),
    greatest(0, least(coalesce(p_streak, 0), 100000)),
    left(coalesce(p_language, 'en'), 5),
    now()
  )
  on conflict (user_id) do update set
    display_name = excluded.display_name,
    snapshot = excluded.snapshot,
    level = excluded.level,
    streak = excluded.streak,
    language = excluded.language,
    updated_at = now();
  return my_code;
end;
$$;
revoke all on function public.village_publish(text, jsonb, int, int, text) from public, anon;
grant execute on function public.village_publish(text, jsonb, int, int, text) to authenticated;

-- ---------- Arkadaş isteği gönder (kodla) ----------
-- Dönüş: sent | accepted | already | self | not_found | limit
create or replace function public.friend_request(p_code text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  other uuid;
begin
  if uid is null then raise exception 'not signed in' using errcode = '28000'; end if;
  select user_id into other from public.village_public where code = upper(btrim(p_code));
  if other is null then return 'not_found'; end if;
  if other = uid then return 'self'; end if;
  if exists (select 1 from public.friendships where a = least(uid, other) and b = greatest(uid, other)) then
    return 'already';
  end if;
  -- Karşı taraf zaten istek gönderdiyse: arkadaş olun.
  if exists (select 1 from public.friend_requests where from_id = other and to_id = uid) then
    delete from public.friend_requests where from_id = other and to_id = uid;
    insert into public.friendships (a, b) values (least(uid, other), greatest(uid, other)) on conflict do nothing;
    return 'accepted';
  end if;
  if (select count(*) from public.friend_requests where from_id = uid) >= 20 then return 'limit'; end if;
  insert into public.friend_requests (from_id, to_id) values (uid, other) on conflict do nothing;
  return 'sent';
end;
$$;
revoke all on function public.friend_request(text) from public, anon;
grant execute on function public.friend_request(text) to authenticated;

-- ---------- Gelen isteğe cevap ----------
create or replace function public.friend_respond(p_from uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in' using errcode = '28000'; end if;
  delete from public.friend_requests where from_id = p_from and to_id = uid;
  if found and p_accept then
    insert into public.friendships (a, b) values (least(uid, p_from), greatest(uid, p_from)) on conflict do nothing;
  end if;
end;
$$;
revoke all on function public.friend_respond(uuid, boolean) from public, anon;
grant execute on function public.friend_respond(uuid, boolean) to authenticated;

-- ---------- Arkadaşlıktan çıkar (ya da gönderilen isteği geri çek) ----------
create or replace function public.friend_remove(p_other uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in' using errcode = '28000'; end if;
  delete from public.friendships where a = least(uid, p_other) and b = greatest(uid, p_other);
  delete from public.friend_requests where from_id = uid and to_id = p_other;
end;
$$;
revoke all on function public.friend_remove(uuid) from public, anon;
grant execute on function public.friend_remove(uuid) to authenticated;

-- ---------- Gelen istekler (gönderenin adıyla; henüz arkadaş olmadığı için ayrı fonksiyon) ----------
create or replace function public.friend_incoming()
returns table (from_id uuid, display_name text, level int, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select r.from_id, coalesce(v.display_name, 'Oyuncu'), coalesce(v.level, 1), r.created_at
  from public.friend_requests r
  left join public.village_public v on v.user_id = r.from_id
  where r.to_id = (select auth.uid())
  order by r.created_at desc;
$$;
revoke all on function public.friend_incoming() from public, anon;
grant execute on function public.friend_incoming() to authenticated;
