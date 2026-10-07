-- RAS Site Safety Forms: demo data
-- Run after schema.sql AND after creating the users in Authentication
-- (names and the admin role are set in the profiles table).

-- Job sites
insert into public.sites (name) values
  ('Maple Grove Townhomes'),
  ('Riverside Commons'),
  ('Cedar Heights Duplex'),
  ('Harbor View Lot 7');

-- Every framer, last 7 days, random site. Today is left empty on purpose,
-- so "Not submitted today" has data.
with site_ids as (select array_agg(id) as ids from public.sites)
insert into public.submissions (
  user_id, site_id, work_date,
  hard_hat, hi_vis_vest, safety_boots, eye_protection,
  fall_protection, ladders_scaffolding_inspected, tools_cords_ok, hazards_identified,
  notes
)
select
  p.id,
  s.ids[1 + floor(random() * array_length(s.ids, 1))::int],
  d::date,
  true, true, true, random() > 0.2,
  random() > 0.1, true, random() > 0.15, true,
  'Seed data'
from public.profiles p
cross join generate_series(current_date - 7, current_date - 1, interval '1 day') d
cross join site_ids s
where p.role = 'framer';
