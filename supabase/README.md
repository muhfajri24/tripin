# Setup katalog Supabase TRIPIN

## Sampel Jabodetabek untuk demo — 27 November 2026

`tripin_demo_places` adalah tabel discovery terpisah, versi
`jabodetabek-demo-v1`. Isinya 15 contoh: masing-masing satu attraction, food,
dan lodging di Jakarta, Bogor, Depok, Tangerang, dan Bekasi, dengan sumber
pemerintah/operator di setiap baris. Area ini masih label metro, belum
memisahkan Kota/Kabupaten Bogor, Tangerang, Bekasi, dan Tangerang Selatan.
Ini bukan cakupan lengkap Jabodetabek dan belum menjadi input planner.
Koordinat, jam buka, dan harga tetap null sampai ada bukti yang cocok untuk
tanggal kunjungan. Migration `20261126184727_jabodetabek_demo_catalog.sql`
sudah diterapkan di project TRIPPIN; `tests/jabodetabek_demo_checks.sql`
memeriksa jumlah, null dan hak akses. RLS mengizinkan SELECT publik saja.
Migration `20261126185951_jabodetabek_demo_kind.sql` menambahkan kategori
`attraction`, `food`, `lodging`; migration
`20261126190339_jabodetabek_demo_category_samples.sql` menambah 10 contoh
food/lodging. Kehadiran baris bukan bukti usaha buka pada tanggal perjalanan.
Backend mengekspos sampel ini lewat `GET /api/v1/demo/places` dengan filter
`area`, `kind`, dan `q`, memakai URL dan publishable/anon key Supabase yang
diatur pada environment backend. Respons selalu `complete:false`.

FE/BE itinerary masih dibatasi Yogyakarta. Untuk menjadikan Jabodetabek
tujuan planner, perlu perluasan kontrak destination, cakupan geografis,
anchor, kandidat routable, lodging, parser, FE, dan tes. Deploy ke Vercel
tidak mengaktifkan Google Places secara otomatis; integrasi itu memerlukan
project Google Cloud dengan billing, API key, field mask, dan penanganan
atribusi/retensi konten sesuai ketentuan Google.

## Keamanan tabel prototipe — 27 November 2026

Audit project TRIPPIN menemukan `public.itineraries`, `public.itinerary_items`,
`public.saved_places`, dan `public.app_settings` memiliki policy `anon ALL`
dengan grant luas. Keempat tabel ini tidak dipakai oleh alur guest aktif. Migration
`20261126183417_secure_legacy_guest_tables.sql` sudah diterapkan untuk mencabut
akses `anon` dan `authenticated` serta menghapus policy tersebut, tanpa menghapus
baris. Verifikasi SQL menunjukkan hak SELECT/INSERT `anon` dan SELECT
`authenticated` bernilai false untuk semuanya. RLS tetap aktif. Advisor INFO
`rls_enabled_no_policy` berarti deny-all yang disengaja pada tabel lama ini.

Penyimpanan itinerary pengunjung masih di browser. Penyimpanan cloud memerlukan
identitas sesi dan policy kepemilikan pada tabel terpisah; API key publik saja
tidak membedakan pengunjung. Lacak pekerjaan lanjut di issue #44. Jangan
mengembalikan policy public-all untuk memperbaiki error tulis aplikasi lama.

Status 24 November 2026: migration + seed sudah diterapkan pada project tim `TRIPPIN` (`dhumijynoiiysyeppaqj`). Hosted read preflight, parity local/live 9 record, RLS/grants/view inspection dan HTTP parse/plan/replan berhasil. Organisasi terverifikasi Free. `saved_places` existing tetap 1 record dan tidak diubah. Ini bukan acceptance frontend atau jaminan kondisi operasional tempat. Bukti tersanitasi: `qa/release/owner-live-source.json`, `owner-live-http-smoke.json`, dan `owner-data-review.json`.

## Objek yang dibuat

- `public.tripin_place_catalog`: metadata wisata publik, bukan itinerary/saved places pengguna.
- `public.tripin_places_api`: view read-only dengan satu kolom JSONB `place` sesuai adapter backend.
- `dataset_version` + generated `place_id` menjadi primary key. `destination_id` dan `kind` diturunkan dari JSON, tidak diduplikasi secara manual.
- Data evidence, nullable coordinates/prices/hours dan klasifikasi bisnis tetap persis canonical Place. Generated seed memvalidasi Pydantic sebelum ekspor. Database memeriksa identitas/grain/basic fields; validasi penuh tetap preflight backend, bukan klaim SQL memvalidasi seluruh JSON Schema.

Nama baru dipilih karena schema/isi `public.saved_places` belum tersedia; tabel itu tidak dibaca, diubah atau dihapus. Tidak menganggap tabel saved_places milik pengguna sebagai katalog publik.

## Penerapan pada project yang disetujui

1. Pastikan project adalah milik tim dan plan Free; jangan mengaktifkan paid compute/add-on. Catat project URL serta publishable/anon read key dalam `backend/.env` lokal, jangan commit atau tempel secret di chat.
2. Di SQL Editor project, jalankan `migrations/202611240001_catalog.sql`, kemudian `seed.sql`. Keduanya transaction-based. Migration sengaja gagal jika nama objek sudah ada: jangan drop/overwrite objek yang belum ditinjau. Seed identik boleh diulang; perubahan existing record pada versi sama ditolak.
3. Jalankan `tests/read_only_checks.sql`. Expected count 9, RLS=true, security_invoker=true; SELECT=true, INSERT/UPDATE/DELETE=false untuk anon dan authenticated, termasuk view insert=false. Script inspeksi ini read-only, tidak menguji write pada produksi.
4. Konfigurasi backend:

```dotenv
TRPIN_PLACE_SOURCE=supabase
TRPIN_SUPABASE_URL=https://PROJECT.supabase.co
TRPIN_SUPABASE_ANON_KEY=PUBLIC_READ_KEY
TRPIN_SUPABASE_PLACES_VIEW=tripin_places_api
TRPIN_SUPABASE_DATASET_VERSION=yogyakarta-v0_3_0
```

5. Restart backend, lalu dari backend jalankan `.venv/Scripts/python -m scripts.check_place_source`. Harus melaporkan `source=supabase`, `rows=9`, `liveRead=true`. Key tidak dicetak. Setelah itu ulangi HTTP smoke dan browser QA. Jangan menganggap migration sukses sebagai bukti PostgREST/RLS/HTTP sudah berfungsi.
6. Jika gagal/kuota pause: pilih eksplisit `TRPIN_PLACE_SOURCE=local` dan restart untuk demo. Tidak ada silent fallback atau mixing. `TRPIN_SERVE_FRONTEND=true` tetap dapat melayani build pada satu origin.

Untuk membandingkan isi live/local, jalankan `.venv/Scripts/python -m scripts.check_place_source --compare-local`. Pemeriksaan membandingkan versi dan SHA-256 canonical JSON yang diurutkan berdasarkan ID; berbeda isi pada versi sama dianggap gagal. Quality gate lokal: `.venv/Scripts/python -m scripts.check_catalog_quality`.

Kandidat bantuan data ada di `backend/app/data/proposals/yogyakarta-v0.4.0.json`. Kandidat belum aktif, belum di-seed dan belum mengubah view/RLS/env live. Tinjau catatan `qa/release/owner-data-review.json` sebelum mengaktifkannya lewat versi/seed/migration yang konsisten. Tidak menimpa arsip v0.3.

View hanya mengekspos versi v0.3 saat ini dan urutan place_id deterministik. Untuk revisi data berikutnya buat migration/version/view-policy update yang ditinjau, regenerate seed dan ubah env version secara serentak; jangan mengganti isi di bawah versi sama. Tidak ada booking, rating rekaan, atau tabel guest public-write.

## Pengujian tanpa project live

Prasyarat: Docker lokal aktif dan image `postgres:16-alpine` tersedia. Dari backend:

```powershell
.venv/Scripts/python -m scripts.export_catalog_seed
.venv/Scripts/python -m scripts.test_catalog_postgres
```

Script membuat container bernama unik dengan network none, tanpa published ports, data tmpfs; membersihkannya dalam finally. Role bootstrap dan record test hanya dibuat di container tersebut. Tidak menerima URL database remote. Ia menguji migration/seed, idempotensi, conflicting seed, read/write permissions, RLS/view dan preservasi saved_places sentinel. [Hasil aktual](../qa/release/postgres-catalog.json). Uji ini bukan Supabase hosted/PostgREST test.

Dasar keamanan mengikuti [Supabase RLS/view security_invoker](https://supabase.com/docs/guides/database/postgres/row-level-security) dan [grants + RLS](https://supabase.com/docs/guides/api/securing-your-api). View security_invoker memerlukan PostgreSQL 15+. Tidak mengubah default privileges global, role production, atau tabel existing.


Pada 24 November 2026, [pricing resmi Supabase](https://supabase.com/pricing) menyatakan plan Free $0/bulan, maksimal 2 project aktif, database 500 MB dan egress 5 GB; project dapat pause setelah satu minggu tidak aktif. Verifikasi plan akun/project target sebelum membuat atau menerapkan apa pun; tidak ada paid compute/add-on yang diaktifkan dalam pekerjaan ini.
