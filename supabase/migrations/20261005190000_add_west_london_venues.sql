insert into public.operators (id, name, website_url)
values
  ('10000000-0000-0000-0000-000000000005', 'Pickleball Ealing', 'https://www.ealing.gov.uk/info/201141/sports_clubs/3401/sports_clubs_in_and_around_the_borough'),
  ('10000000-0000-0000-0000-000000000006', 'Pickleball Acton', 'https://www.ealing.gov.uk/info/201141/sports_clubs/3401/sports_clubs_in_and_around_the_borough')
on conflict (id) do nothing;

insert into public.venues (id, operator_id, name, address, area, county, postcode, booking_url)
values
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000005', 'Pickleball Ealing · Elthorne Sports Centre', 'Westlea Road, off Boston Road, Hanwell', 'West London', 'Greater London', 'W7 2AD', null),
  ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000006', 'Pickleball Acton · Reynolds Sports Centre', 'Gunnersbury Lane, Acton', 'West London', 'Greater London', 'W3 8EY', null)
on conflict (id) do nothing;
