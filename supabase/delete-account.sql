-- SwipeVocab: kullanıcının kendi hesabını kalıcı olarak silmesi (Google Play'in istediği "hesabımı sil").
-- Supabase panelinde SQL Editor'a yapıştırıp bir kez çalıştır. Tekrar çalıştırmak güvenlidir.
--
-- Uygulama bu fonksiyonu giriş yapmış kullanıcının oturumuyla çağırır (supabase.rpc("delete_my_account")).
-- Fonksiyon yalnızca çağıranın kendi hesabını (auth.uid()) siler; başka birinin hesabına dokunamaz.
-- auth.users satırı silinince ona bağlı her şey (progress, profiles, talk_* tabloları) "on delete cascade"
-- ile birlikte silinir. Uygulamaya hiçbir gizli anahtar gerekmez.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
