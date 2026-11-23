-- Kelimanya: herkesin göründüğü haftalık genel sıralama (friends.sql ve league-invite.sql'den SONRA çalıştır).
-- Supabase SQL Editor'da bir kez çalıştır. Tekrar çalıştırmak güvenlidir. Mevcut verilere dokunmaz.
--
-- Güvenlik:
--  * village_public tablosunun okuma kuralı DEĞİŞMEZ: yabancılar birbirinin köyünü, serisini, dilini, kodunu göremez.
--  * Bu fonksiyon yalnızca sıra, uygulamadaki ad, haftalık puan ve köy seviyesini döner; kimlik (user_id) dönmez.
--  * Yalnızca bu hafta puanı olan (0'dan büyük) hesaplar listelenir. Misafirler (hesapsız) çağıramaz.

create or replace function public.leaderboard(p_week text, p_limit int default 50)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with ranked as (
    select v.user_id, v.display_name, v.weekly_points, v.level,
           rank() over (order by v.weekly_points desc) as pos
    from public.village_public v
    where v.week_key = left(coalesce(p_week, ''), 10) and v.weekly_points > 0
  ),
  leaders as (
    select * from ranked order by pos, display_name limit least(greatest(coalesce(p_limit, 50), 1), 100)
  )
  select jsonb_build_object(
    'total', (select count(*) from ranked),
    'top', coalesce((
      select jsonb_agg(jsonb_build_object(
        'rank', t.pos,
        'name', t.display_name,
        'points', t.weekly_points,
        'level', t.level,
        'me', t.user_id = (select auth.uid()),
        'friend', public.is_friend(t.user_id)
      ) order by t.pos, t.display_name)
      from leaders t
    ), '[]'::jsonb),
    'me', (
      select jsonb_build_object('rank', r.pos, 'points', r.weekly_points)
      from ranked r where r.user_id = (select auth.uid())
    )
  );
$$;
revoke all on function public.leaderboard(text, int) from public, anon;
grant execute on function public.leaderboard(text, int) to authenticated;

create index if not exists village_public_week_points on public.village_public (week_key, weekly_points desc);
