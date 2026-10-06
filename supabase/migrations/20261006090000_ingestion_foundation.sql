alter table public.sessions
  add column if not exists capacity_total integer,
  add column if not exists spaces_remaining integer,
  add column if not exists availability_status text not null default 'unknown' check (availability_status in ('live', 'limited', 'waitlist', 'sold_out', 'unknown')),
  add column if not exists booking_mode text not null default 'external' check (booking_mode in ('external', 'contact', 'spond', 'whatsapp', 'email', 'embedded')),
  add column if not exists contact_method text,
  add column if not exists last_synced_at timestamptz;

create table if not exists public.source_connectors (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  name text not null,
  source_url text not null,
  connector_type text not null check (connector_type in ('api', 'feed', 'open_data', 'structured_page', 'organiser_feed', 'manual_review')),
  active boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  last_attempted_at timestamptz,
  last_succeeded_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);

create unique index if not exists source_connectors_provider_url_idx on public.source_connectors(provider, source_url);

create table if not exists public.ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  connector_id uuid not null references public.source_connectors(id) on delete cascade,
  status text not null check (status in ('running', 'succeeded', 'failed')),
  records_seen integer not null default 0,
  records_created integer not null default 0,
  records_updated integer not null default 0,
  records_archived integer not null default 0,
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists ingestion_runs_connector_started_idx on public.ingestion_runs(connector_id, started_at desc);

create table if not exists public.session_sources (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  connector_id uuid not null references public.source_connectors(id) on delete cascade,
  external_id text not null,
  external_url text,
  raw_hash text,
  raw_payload jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_synced_at timestamptz,
  unique(connector_id, external_id)
);

create index if not exists session_sources_session_idx on public.session_sources(session_id);

alter table public.source_connectors enable row level security;
alter table public.ingestion_runs enable row level security;
alter table public.session_sources enable row level security;

drop policy if exists "Admins can manage source connectors" on public.source_connectors;
create policy "Admins can manage source connectors" on public.source_connectors for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins can manage ingestion runs" on public.ingestion_runs;
create policy "Admins can manage ingestion runs" on public.ingestion_runs for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins can manage session sources" on public.session_sources;
create policy "Admins can manage session sources" on public.session_sources for all using (public.is_admin()) with check (public.is_admin());

insert into public.source_connectors (provider, name, source_url, connector_type)
values
  ('Bookwhen', 'Bookwhen OpenActive events', 'https://data.bookwhen.com/', 'open_data'),
  ('West London Pickleball Club', 'West London organiser page', 'https://www.westlondonpickleball.com/', 'structured_page')
on conflict (provider, source_url) do nothing;
