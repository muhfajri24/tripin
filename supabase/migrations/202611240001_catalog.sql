-- New public tourism catalog only. Never alters public.saved_places.
-- PostgreSQL >= 15. Apply once; existing object names cause an explicit failure.
begin;
create table public.tripin_place_catalog (
  dataset_version text not null check (dataset_version ~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$'),
  place jsonb not null check (jsonb_typeof(place) = 'object'),
  place_id text generated always as (place->>'id') stored not null,
  destination_id text generated always as (place->>'destinationId') stored not null,
  kind text generated always as (place->>'kind') stored not null,
  primary key (dataset_version, place_id),
  check (place_id ~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$'),
  check (destination_id = 'yogyakarta'),
  check (kind in ('attraction', 'food', 'local_business', 'lodging')),
  check (place ?& array['id','name','coordinates','categories','visitDurationMin','openingWindows','prices','identityEvidence','locationEvidence','openingEvidence','durationEvidence','isLocalBusiness','localBusinessEvidence'])
);
comment on table public.tripin_place_catalog is 'Public curated tourism metadata only. No guest itineraries or user saved places. Full Place validation is enforced by backend preflight.';
alter table public.tripin_place_catalog enable row level security;
revoke all on public.tripin_place_catalog from public, anon, authenticated;
grant select on public.tripin_place_catalog to anon, authenticated;
create policy tripin_catalog_public_read on public.tripin_place_catalog
  for select to anon, authenticated using (dataset_version = 'yogyakarta-v0_3_0');
create view public.tripin_places_api with (security_invoker = true) as
  select place from public.tripin_place_catalog
  where dataset_version = 'yogyakarta-v0_3_0'
  order by place_id;
revoke all on public.tripin_places_api from public, anon, authenticated;
grant select on public.tripin_places_api to anon, authenticated;
notify pgrst, 'reload schema';
commit;
