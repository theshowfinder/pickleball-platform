insert into public.source_connectors (provider, name, source_url, connector_type)
values ('OpenActive', 'London Sport OpenActive events', 'https://opensessions.io/api/rpde/events', 'open_data')
on conflict (provider, source_url) do nothing;
