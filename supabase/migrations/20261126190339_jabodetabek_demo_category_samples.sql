-- One sourced food and lodging example per demo metro area. This is a
-- category coverage sample, not an exhaustive business directory.
begin;
insert into public.tripin_demo_places
  (id, demo_version, metro_area, kind, name, address, source_url, checked_on)
values
  ('jbd-jakarta-soto-maruf','jabodetabek-demo-v1','Jakarta','food',
   'Soto Betawi H. Ma’ruf','Menteng, Jakarta Pusat',
   'https://enjoy.jakarta.go.id/article/soto-betawi','2026-11-27'),
  ('jbd-jakarta-pullman','jabodetabek-demo-v1','Jakarta','lodging',
   'Pullman Jakarta Indonesia Thamrin CBD','Thamrin, Jakarta Pusat',
   'https://all.accor.com/hotel/8491/index.id.shtml','2026-11-27'),
  ('jbd-bogor-raasaa','jabodetabek-demo-v1','Bogor','food',
   'Raasaa Kebun Raya','Taman Astrid, Kebun Raya Bogor',
   'https://kebunraya.id/r/bogor/programs/senja-di-raasaa','2026-11-27'),
  ('jbd-bogor-hotel-salak','jabodetabek-demo-v1','Bogor','lodging',
   'Hotel Salak The Heritage','Jl. Ir. H. Juanda No. 8, Kota Bogor',
   'https://www.hotelsalak.co.id/?page=booking','2026-11-27'),
  ('jbd-depok-betawi-ngoempoel','jabodetabek-demo-v1','Depok','food',
   'Betawi Ngoempoel','Jl. Tanah Baru No.74, Beji, Kota Depok',
   'https://porprov.depok.go.id/city-guide?category=wisata-kuliner','2026-11-27'),
  ('jbd-depok-margo-hotel','jabodetabek-demo-v1','Depok','lodging',
   'The Margo Hotel','Jl. Margonda No.358, Beji, Kota Depok',
   'https://porprov.depok.go.id/city-guide?page=25','2026-11-27'),
  ('jbd-tangerang-pondok-laksa','jabodetabek-demo-v1','Tangerang','food',
   'Pondok Kuliner Laksa Kota Tangerang','Kota Tangerang',
   'https://disbudpar.tangerangkota.go.id/berita/laksa-kota-tangerang-kuliner-legendaris-yang-wajib-dicicipi-wisatawan','2026-11-27'),
  ('jbd-tangerang-novotel','jabodetabek-demo-v1','Tangerang','lodging',
   'Novotel Tangerang','Tangcity Superblock, Jl. Jend. Sudirman No.1, Kota Tangerang',
   'https://all.accor.com/hotel/7234/index.en.shtml','2026-11-27'),
  ('jbd-bekasi-omah-anglo','jabodetabek-demo-v1','Bekasi','food',
   'Omah Anglo','Jl. Jatiluhur Raya No.DB9, Jakasampurna, Bekasi Barat',
   'https://abangpakem.bekasikota.go.id/public/files/uploads/Buku-Pariwisata.pdf','2026-11-27'),
  ('jbd-bekasi-ibis-jatibening','jabodetabek-demo-v1','Bekasi','lodging',
   'ibis Styles Bekasi Jatibening','Jl. Caman Raya 21, Jatibening, Pondokgede, Kota Bekasi',
   'https://all.accor.com/hotel/A3N3/index.en.shtml','2026-11-27');
commit;
