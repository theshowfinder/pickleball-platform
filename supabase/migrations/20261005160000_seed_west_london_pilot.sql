insert into public.operators (id, name, website_url)
values (
  '10000000-0000-0000-0000-000000000004',
  'West London Pickleball Club',
  'https://www.westlondonpickleball.com/'
)
on conflict (id) do nothing;

insert into public.venues (id, operator_id, name, address, area, county, postcode, booking_url)
values (
  '20000000-0000-0000-0000-000000000005',
  '10000000-0000-0000-0000-000000000004',
  'West London Pickleball Club',
  'East Acton Lane',
  'West London',
  'Greater London',
  'W3 7EN',
  'https://www.westlondonpickleball.com/book-a-court'
)
on conflict (id) do nothing;

insert into public.sessions (
  venue_id, title, starts_at, skill_level, session_type, price_pence,
  availability_text, source_name, source_url
)
values
  (
    '20000000-0000-0000-0000-000000000005',
    'Thursday open play social doubles',
    '2026-10-08 19:00 Europe/London',
    'Intermediate',
    'Open play',
    1500,
    'Book via WhatsApp group',
    'West London Pickleball Club',
    'https://www.westlondonpickleball.com/leagues-competitions'
  ),
  (
    '20000000-0000-0000-0000-000000000005',
    'Saturday open play social doubles',
    '2026-10-10 14:30 Europe/London',
    'Intermediate',
    'Open play',
    1500,
    'Book via WhatsApp group',
    'West London Pickleball Club',
    'https://www.westlondonpickleball.com/leagues-competitions'
  ),
  (
    '20000000-0000-0000-0000-000000000005',
    'Sunday beginner to intermediate social',
    '2026-10-11 10:30 Europe/London',
    'Beginner / Improver / Intermediate',
    'Social',
    1500,
    'Book via WhatsApp group',
    'West London Pickleball Club',
    'https://www.westlondonpickleball.com/leagues-competitions'
  ),
  (
    '20000000-0000-0000-0000-000000000005',
    'Sunday afternoon social doubles',
    '2026-10-11 13:00 Europe/London',
    'Beginner / Improver / Intermediate',
    'Social',
    1500,
    'Book via WhatsApp group',
    'West London Pickleball Club',
    'https://www.westlondonpickleball.com/leagues-competitions'
  )
on conflict do nothing;
