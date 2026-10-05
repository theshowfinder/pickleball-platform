create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

drop policy if exists "Admins can read admin users" on public.admin_users;
create policy "Admins can read admin users" on public.admin_users for select using (public.is_admin());

drop policy if exists "Admins can manage operators" on public.operators;
create policy "Admins can manage operators" on public.operators for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins can manage venues" on public.venues;
create policy "Admins can manage venues" on public.venues for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins can manage sessions" on public.sessions;
create policy "Admins can manage sessions" on public.sessions for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.booking_clicks (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions(id) on delete set null,
  venue_id uuid references public.venues(id) on delete set null,
  source_name text,
  created_at timestamptz not null default now()
);

alter table public.booking_clicks enable row level security;
drop policy if exists "Anyone can record booking clicks" on public.booking_clicks;
create policy "Anyone can record booking clicks" on public.booking_clicks for insert with check (true);
drop policy if exists "Admins can read booking clicks" on public.booking_clicks;
create policy "Admins can read booking clicks" on public.booking_clicks for select using (public.is_admin());
