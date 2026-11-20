-- SwipeVocab: Supabase veritabanı şeması.
-- Supabase panelinde SQL Editor'a yapıştırıp bir kez çalıştır. Tekrar çalıştırmak güvenlidir.
--
-- Hesaplar ve şifreler Supabase Auth'ta (auth.users) tutulur; bu tabloda yalnızca
-- her kullanıcının uygulama ilerlemesi (JSON) durur. Satır düzeyi güvenlik (RLS) sayesinde
-- herkes yalnızca kendi satırını okuyup yazabilir.

create table if not exists public.progress (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  state      jsonb not null,
  updated_at timestamptz not null default now(),
  -- ilerleme kaydı 256 KB'ı geçmesin
  constraint progress_state_size check (pg_column_size(state) < 262144)
);

alter table public.progress enable row level security;

-- Yalnızca giriş yapmış kullanıcılar tabloya API üzerinden erişebilir (satırları RLS süzer).
-- Projede "Grant API access to new tables automatically" kapalı olsa da çalışsın diye açıkça veriliyor.
revoke all on public.progress from anon;
grant select, insert, update, delete on public.progress to authenticated;

drop policy if exists progress_select_own on public.progress;
create policy progress_select_own
  on public.progress for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists progress_insert_own on public.progress;
create policy progress_insert_own
  on public.progress for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists progress_update_own on public.progress;
create policy progress_update_own
  on public.progress for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists progress_delete_own on public.progress;
create policy progress_delete_own
  on public.progress for delete to authenticated
  using ((select auth.uid()) = user_id);
