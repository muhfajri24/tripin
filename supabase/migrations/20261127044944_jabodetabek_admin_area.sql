-- Classify the existing, sourced demo samples by administrative area.
-- This is a coverage label, not a claim of exhaustive inventory.
begin;

alter table public.tripin_demo_places add column administrative_area text
  check (administrative_area in (
    'Jakarta Pusat', 'Jakarta Utara', 'Jakarta Barat', 'Jakarta Selatan',
    'Jakarta Timur', 'Kepulauan Seribu', 'Kota Bogor', 'Kabupaten Bogor',
    'Kota Depok', 'Kota Tangerang', 'Kabupaten Tangerang',
    'Tangerang Selatan', 'Kota Bekasi', 'Kabupaten Bekasi'
  ));

update public.tripin_demo_places
set administrative_area = case
  when id = 'jbd-jakarta-tmii' then 'Jakarta Timur'
  when id in ('jbd-jakarta-soto-maruf', 'jbd-jakarta-pullman') then 'Jakarta Pusat'
  when metro_area = 'Bogor' then 'Kota Bogor'
  when metro_area = 'Depok' then 'Kota Depok'
  when metro_area = 'Tangerang' then 'Kota Tangerang'
  when metro_area = 'Bekasi' then 'Kota Bekasi'
end
where demo_version = 'jabodetabek-demo-v1';

create index tripin_demo_places_filters_idx
  on public.tripin_demo_places (demo_version, administrative_area, kind, id);

notify pgrst, 'reload schema';
commit;
