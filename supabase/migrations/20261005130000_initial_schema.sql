create extension if not exists postgis;

create table if not exists public.operators (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid references public.operators(id) on delete set null,
  name text not null,
  address text,
  area text,
  county text default 'Greater London',
  postcode text,
  latitude double precision,
  longitude double precision,
  booking_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  skill_level text not null default 'All levels',
  session_type text not null default 'Social',
  price_pence integer,
  availability_text text,
  status text not null default 'published' check (status in ('published', 'cancelled', 'sold_out')),
  source_name text not null default 'Manual',
  source_url text,
  last_verified_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists sessions_starts_at_idx on public.sessions(starts_at);
create index if not exists sessions_skill_level_idx on public.sessions(skill_level);
create index if not exists venues_area_idx on public.venues(area);

alter table public.operators enable row level security;
alter table public.venues enable row level security;
alter table public.sessions enable row level security;

drop policy if exists "Public can read operators" on public.operators;
create policy "Public can read operators" on public.operators for select using (true);
drop policy if exists "Public can read venues" on public.venues;
create policy "Public can read venues" on public.venues for select using (true);
drop policy if exists "Public can read published sessions" on public.sessions;
create policy "Public can read published sessions" on public.sessions for select using (status = 'published');

insert into public.operators (id, name, website_url) values
  ('10000000-0000-0000-0000-000000000001', 'Park Sports', 'https://www.parksports.co.uk'),
  ('10000000-0000-0000-0000-000000000002', 'Pickleball Social', 'https://www.pickleballsocial.com'),
  ('10000000-0000-0000-0000-000000000003', 'Lemon Pickleball', 'https://www.lemonpickleball.com')
on conflict (id) do nothing;

insert into public.venues (id, operator_id, name, area, county, booking_url) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Park Sports Chiswick', 'West London', 'Greater London', 'https://www.parksports.co.uk'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Pickleball Social', 'Bermondsey', 'Greater London', 'https://bookwhen.com'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'Lemon Pickleball', 'South London', 'Greater London', 'https://www.lemonpickleball.com'),
  ('20000000-0000-0000-0000-000000000004', null, 'Somers Town Sports Centre', 'Central London', 'Greater London', 'https://www.better.org.uk')
on conflict (id) do nothing;

insert into public.sessions (venue_id, title, starts_at, skill_level, session_type, price_pence, availability_text, source_name, source_url)
select * from (values
  ('20000000-0000-0000-0000-000000000001'::uuid, 'Improver open play', now() + interval '1 day' + interval '6 hours 30 minutes', 'Improver', 'Open play', 1500, 'Spaces available', 'ClubSpark', 'https://www.parksports.co.uk'),
  ('20000000-0000-0000-0000-000000000002'::uuid, 'Intermediate social', now() + interval '1 day' + interval '7 hours', 'Intermediate', 'Social', 1600, 'Booking open', 'Bookwhen', 'https://bookwhen.com'),
  ('20000000-0000-0000-0000-000000000004'::uuid, 'Beginner friendly session', now() + interval '2 days' + interval '10 hours', 'Beginner', 'Social', 800, '8 spaces left', 'ClubSpark', 'https://www.better.org.uk'),
  ('20000000-0000-0000-0000-000000000003'::uuid, 'Advanced matchplay', now() + interval '3 days' + interval '8 hours', 'Advanced', 'Matchplay', 1400, 'Booking open', 'Direct', 'https://www.lemonpickleball.com')
) as seed(venue_id, title, starts_at, skill_level, session_type, price_pence, availability_text, source_name, source_url)
where not exists (select 1 from public.sessions existing where existing.title = seed.title and existing.venue_id = seed.venue_id);
