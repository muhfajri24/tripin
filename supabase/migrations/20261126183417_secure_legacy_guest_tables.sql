-- Legacy prototype tables have no owner identity and are unused by the active
-- guest workflow. Prevent public Data API access until a separate owner-scoped
-- storage design is reviewed. This preserves every existing row and column.
begin;

drop policy if exists "public all" on public.itineraries;
drop policy if exists "public all" on public.itinerary_items;
drop policy if exists "public all" on public.saved_places;
drop policy if exists "public all" on public.app_settings;

revoke all privileges on table public.itineraries from anon, authenticated;
revoke all privileges on table public.itinerary_items from anon, authenticated;
revoke all privileges on table public.saved_places from anon, authenticated;
revoke all privileges on table public.app_settings from anon, authenticated;

commit;
