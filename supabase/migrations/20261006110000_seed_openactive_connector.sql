insert into public.source_connectors (provider, name, source_url, connector_type)
values ('OpenActive', 'London Sport OpenActive sessions', 'https://opensessions.io/api/Session/GetSessionsForOpenActive', 'open_data')
on conflict (provider, source_url) do nothing;
