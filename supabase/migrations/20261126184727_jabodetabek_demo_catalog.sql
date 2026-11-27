-- Isolated discovery sample for the 30 November demo. Not planner input.
-- Names/areas/addresses have linked operator or municipal sources. Unknown
-- coordinates, hours and ticket prices are intentionally not asserted.
begin;

create table public.tripin_demo_places (
  id text primary key check (id ~ '^jbd-[a-z0-9-]+$'),
  demo_version text not null check (demo_version = 'jabodetabek-demo-v1'),
  metro_area text not null check (metro_area in ('Jakarta', 'Bogor', 'Depok', 'Tangerang', 'Bekasi')),
  name text not null,
  address text not null,
  source_url text not null check (source_url ~ '^https://'),
  checked_on date not null,
  coordinates jsonb,
  opening_hours jsonb,
  ticket_price_idr integer check (ticket_price_idr >= 0),
  check (coordinates is null or (coordinates ?& array['lat','lng']))
);

comment on table public.tripin_demo_places is
  'Separate Jabodetabek discovery sample. No route, live-hours or ticket-price claim.';
alter table public.tripin_demo_places enable row level security;
revoke all on public.tripin_demo_places from public, anon, authenticated;
grant select on public.tripin_demo_places to anon, authenticated;
create policy tripin_demo_public_read on public.tripin_demo_places
  for select to anon, authenticated using (demo_version = 'jabodetabek-demo-v1');

insert into public.tripin_demo_places
  (id, demo_version, metro_area, name, address, source_url, checked_on)
values
  ('jbd-jakarta-tmii', 'jabodetabek-demo-v1', 'Jakarta',
   'Taman Mini Indonesia Indah', 'Jakarta Timur',
   'https://www.jakarta.go.id/index.php/taman-rekreasi-dan-taman-bermain', '2026-11-27'),
  ('jbd-bogor-kebun-raya', 'jabodetabek-demo-v1', 'Bogor',
   'Kebun Raya Bogor', 'Kota Bogor',
   'https://kebunraya.id/r/bogor/about-us', '2026-11-27'),
  ('jbd-depok-situ-pengasinan', 'jabodetabek-demo-v1', 'Depok',
   'Situ Pengasinan', 'Jl. Utomo No.27, Pengasinan, Sawangan, Kota Depok',
   'https://porprov.depok.go.id/city-guide?page=24', '2026-11-27'),
  ('jbd-tangerang-taman-gajah', 'jabodetabek-demo-v1', 'Tangerang',
   'Taman Gajah Tunggal', 'Jl. Perintis Kemerdekaan, Babakan, Kota Tangerang',
   'https://www.tangerangkota.go.id/berita/detail/67743/taman-gajah-kota-tangerang-gratis-asri-dan-ramah-anak', '2026-11-27'),
  ('jbd-bekasi-hutan-kota', 'jabodetabek-demo-v1', 'Bekasi',
   'Hutan Kota Bina Bangsa', 'Jl. A. Yani No.2, Kayuringin Jaya, Bekasi Selatan, Kota Bekasi',
   'https://www.bekasikota.go.id/detail/hutan-kota-patriot-sebagai-paru-paru-kota-bekasi', '2026-11-27');

notify pgrst, 'reload schema';
commit;
