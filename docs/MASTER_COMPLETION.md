# Master completion — 24 November 2026

## Repository dan baseline

Pekerjaan sprint QA sebelumnya di-commit sebagai `40592c4` dan dipush normal ke `dev` serta `main` atas instruksi eksplisit pengguna. Pull dev setelah fetch: sudah mutakhir. Pekerjaan master completion berikutnya dikerjakan pada `dev`; tidak dipromosikan otomatis ke main. `master-prompt.md` dan file untracked pengguna tidak ditimpa.

PR #3 (`integrate/supabase-readonly-adapter`, head `df0f0d4`) masih OPEN saat diperiksa dan commit-nya belum menjadi ancestor dev. Diff 7 file ditinjau lalu diintegrasikan secara selektif, tanpa merge PR atau menghapus branch teammate. Draft semula belum pernah diuji runtime; sprint ini menjalankan tes adapter mock dan memperkuatnya. Tidak ada akses DB produksi atau migrasi.

Baseline: 88 tes BE, 12 tes FE, build berhasil dari sprint sebelumnya. Setelah perubahan: lihat gate final di bawah. README, master prompt, PRODUCT/ARCHITECTURE/AUDIT historis, MVP_IMPLEMENTATION, release validation, contracts dan kode aktif diperiksa. Dokumen historis bukan representasi backend terkini.

## Audit frontend dan endpoint

[Inventory setiap modul JS](../qa/release/source-inventory.json) dihasilkan oleh `qa/audit_sources.py` dari import graph entry `index.js`. Ini pemeriksaan static import relatif, bukan bukti semua kondisi runtime. Tidak ada hooks mandiri di src saat audit.

| Modul aktif | Klasifikasi / tindakan yang diuji |
|---|---|
| LandingPage | Functional: CTA dan navigasi guest; tanpa angka dampak/AI palsu |
| CreateItineraryPage / PreferenceForm | Functional: parse deterministik, review/correction, lodging, selection, plan API; unsupported destination dan budget conflict eksplisit |
| ItineraryResultPage / TripView | Functional bersyarat metadata: ledger, timeline, day selection, marker, save dan edit; bukan traffic/booking live |
| ItineraryEditorPage | Functional: delay, closure, ordered edit/remove/replace UI, locks, before/after; completed/protected behavior diuji BE; counts dari changes backend |
| MyItinerariesPage / itineraryStorage | Functional lokal: save/reload/delete, missing ID, quota/corrupt-storage indicators; guard nested shape diperketat |
| LocalDiscoveryPage | Functional: Places API, search/kind filters, source details, empty/network state; tidak membuktikan UMKM |
| AppLayout / Sidebar / Navbar | Functional: empat navigasi guest, drawer, search; scroll container direset pada perubahan route |
| MapView / googleMapsService | Functional marker/order/URL; tile dan Google Maps memerlukan internet. Animasi zoom dimatikan setelah page error Leaflet berhasil direproduksi |
| plannerApi / GuestUI | Functional: timeout 20 detik, abort/error, unknown badges; tanpa fallback mock |
| App / index | Router aktif; dashboard/settings/saved legacy redirect; URL tak dikenal ke Home |

Unused/dead pada entry aktif: DashboardPage, SettingsPage, SavedPlacesPage; BudgetCard, DestinationCard, EmptyState, ImpactCard, ItineraryTimeline, LoadingSkeleton, OptimizationSelector, RecommendationCard, SearchInput; mockData, placesService, regionService, routingService. Dibiarkan sebagai arsip prototype karena tidak diimpor alur demo; tidak dijadikan fallback. Tidak ada login/profile baru atau migrasi framework.

API aktif: GET health; GET places (destination/q/kind/routable), GET places/{id}; POST requests/parse; POST itineraries/plan; POST itineraries/replan. Semua memanfaatkan kontrak Pydantic; planner/replanner membaca repository konfigurasi. Schema JSON tetap diekspor dari backend. Health adalah liveness, bukan probe koneksi database.

## Perubahan correctness dan safety

1. Regresi terkonfirmasi: edit jumlah peserta mengubah alokasi biaya aktivitas completed. Ledger kunjungan frozen kini mempertahankan entry sebelumnya; sisa aktivitas dihitung dengan request baru. Ini alokasi rencana, bukan bukti pembayaran atau actual spending.
2. Regresi terkonfirmasi: validator independen mempercayai travel leg nol dari snapshot. Kini menghitung ulang leg dan final leg dari koordinat, mode heuristic, progress/current location; mengecek closure, excluded place, duration dan fixed time lock di samping overlap/opening/day-end/mandatory/budget.
3. Snapshot katalog berubah ditolak dengan penjelasan untuk membuat plan baru, menghindari silent mixing versi. Trip tersimpan v0.2 tetap dapat ditampilkan; edit terhadap katalog v0.3 perlu rencana baru. Riwayat yang sudah hilang sebelum patch tidak direkonstruksi.
4. Storage valid JSON dengan days kosong/nested shape rusak ditolak sebelum render dan tidak ditimpa; bukan klaim frontend menggantikan validasi canonical BE.
5. Scroll result yang mewarisi posisi review diperbaiki dan diuji mounted component. Separator/label rusak diperbaiki pada alur aktif; tombol Naik/Turun kini terbaca.
6. Browser build mendeteksi error `_leaflet_pos` saat map berganti. Animasi map/recenter dimatikan; hasil akhir harus tidak memiliki page error. Bukti awal: browser-before-map-fix.json.
7. POST dibatasi 256 KiB dan 30 request/menit/IP dalam satu proses dengan respons canonical 413/429, Retry-After dan CORS. Bounded memory 1024 IP. Bukan proteksi terdistribusi/DDoS; restart mereset window, proxy/NAT bisa berbagi bucket. Jalankan demo dengan no-proxy-headers.

Tidak ada klaim global optimum atau superiority optimizer. Search failure tetap no_plan_found, bukan bukti matematis infeasible. Unknown tidak dihitung sebagai gratis atau dianggap selalu buka.

## Supabase: MOCKED; live BLOCKED

Pengguna menyebut **public.saved_places**. Nama sumber diketahui, tetapi definisi kolom, mapping Place, URL project, konfigurasi read key dan izin least-privilege/RLS belum tersedia di repository. Tidak ada backend/.env; tidak ditemukan connector Supabase. Tidak ada request live yang berhasil, sehingga status bukan CONNECTED/VERIFIED, dan belum CONFIGURED sebagai sumber aktif.

Adapter menerima `saved_places` atau `public.saved_places` di schema public, tetapi hanya membaca JSON `place` canonical. Ini kontrak draft, **bukan bukti tabel saved_places mempunyai kolom place atau berisi katalog wisata**. Jika schema berbeda, mapper eksplisit masih BLOCKED sampai definisi disepakati. Tidak membuat view/mengubah tabel/RLS.

Perbaikan adapter: GET saja; HTTPS origin; validasi semua Place dan duplikasi; batas 2 MB/kurang dari 200 rows (mencapai batas gagal agar tidak silently truncate); timeout 6 detik; tidak mengikuti redirect yang dapat meneruskan key; menolak secret key dan JWT role selain anon; tidak memasukkan key ke React. Cache 60 detik dengan lock dan deep copy; snapshot canonical per plan/replan. Cache expired yang gagal refresh menghasilkan 503, tidak kembali ke local/stale. Version katalog harus dinaikkan owner jika isi berubah. Read grants tidak dapat dibuktikan dari format key.

[Checklist mapping dan acceptance](SUPABASE_INTEGRATION.md), [konfigurasi](SUPABASE_CONNECTION.md). `scripts.check_place_source` menyediakan preflight GET-only tanpa mencetak key. Success local hanya menyatakan schema local valid. Tidak menulis itinerary guest ke database.

## Data quality dan provenance

Katalog aktif menjadi v0.3.0; versi sebelumnya diarsipkan. Jumlah tetap 9, identitas/category 9/9, alamat 5/9, koordinat 7/9, jam 3/9, harga 1/9; local-business classification 0/9. Seluruh durasi editorial estimated. Lodging rate, kapasitas dan availability belum diverifikasi. [Matrix setiap record beserta evidence/tanggal](../qa/release/data-readiness-v0.3.json).

Enrichment jam Kedhaton dan Wahanarata bersumber dari operator Keraton; jam Sonobudoyo serta alamat dari operator provinsi. [Catatan alias, konflik alamat dan sumber](../backend/app/data/README.md). Tidak menambah harga/koordinat/rating/UMKM rekaan atau scraping Google Maps. Jam operator adalah publikasi yang diperiksa, bukan verifikasi lapangan atau holiday exception. Food dan hotel tetap memakai unknown/asumsi pengguna eksplisit.

Sumber utama: [Kedhaton](https://tourism.kratonjogja.id/id-ID/destination/3-kagungan-dalem-kedhaton/), [Wahanarata](https://tourism.kratonjogja.id/id-ID/destination/4-kagungan-dalem-wahanarata/), [Sonobudoyo](https://sonobudoyo.jogjaprov.go.id/id/hubungi). Publikasi jam kantor Sonobudoyo tidak dipakai sebagai jam pameran. Tidak ada klaim actual economic impact; SDG 8 menampilkan alokasi rencana dan status evidence. Dengan klasifikasi unknown, jumlah bisnis lokal teridentifikasi tetap nol.

## Task tracking

| ID | Owner / prioritas | File ownership | Dependency | Acceptance / evidence | Status |
|---|---|---|---|---|---|
| M01 | QA P0 | qa/source-inventory, docs | baseline | inventory active/unused dan browser action | DONE |
| M02 | BE P0 | repositories, config, errors | draft PR3 | canonical GET, fail closed, bounded/cache, mock tests | DONE |
| M03 | Database P0 | schema milik teammate | approved schema/key | read-only live request dan mapping public.saved_places | BLOCKED |
| M04 | BE P0 | domain/planner, regression tests | canonical models | frozen ledger dan independent legs; failing tests sebelum patch | DONE |
| M05 | FE P0 | itineraryStorage, storage tests | canonical fixtures | corrupt nested JSON tidak render/overwrite | DONE |
| M06 | BE/QA P0 | limits, static, tests | build | 413/429; API404; deep link200 | DONE |
| M07 | QA P0 | browser scripts/screenshots | M04–06 | desktop/mobile dan no page errors | Gate final di bawah |
| M08 | BE P1 | data/v0.3, data README | official sources | field evidence, unknown tetap unknown, schema tests | DONE |
| M09 | FE P1 | layout, MapView, active text | browser defects | scroll reset, no Leaflet error, readable controls | DONE |
| M10 | QA P1 | demo snapshots, docs | real HTTP | original/revised/conflict/metrics dari response | DONE |
| M11 | QA P0 | deployment target | akses host/domain | HTTPS, actual provider quota/free plan, proxy behavior | BLOCKED untuk publik; lokal DONE |
| M12 | Database P1 | data curasi | owner/operator | food/hotel current hours/price/capacity; eligibility UMKM | TODO |
| M13 | FE/BE P2 | tidak dialokasikan | P0 gates | booking/login/multimode/nationwide | TODO / di luar scope |

## Bukti demo dan verifikasi

HTTP smoke: [metrics](../qa/release/http-smoke.json), [request + original + full ReplanResult](../qa/release/demo-snapshots.json). Dua orang, dua hari, group budget Rp1 juta, food Rp25 ribu/orang/food stop, room Rp200 ribu/malam, kendaraan Rp100 ribu/hari adalah asumsi pengguna. Before/after known allocation Rp470 ribu dengan 3 unknown; perjalanan 27 menit sebelum/sesudah, jarak garis lurus 6.909 → 6.916 m. Satu konflik closure, empat moved dan satu retained pada smoke ini; bukan savings. Closure date-specific dapat memindahkan kunjungan ke hari berikutnya. Demo desktop terpisah memakai request/anchor berbeda, sehingga metriknya boleh berbeda dan tidak disalin ke angka smoke.

Urutan demo: input brief → review tanggal/lodging/estimasi → generate dan tunjukkan unknown → lock aktivitas dan delay 120 menit untuk konflik → unlock dan replan → tunjukkan before/after serta alasan/counts → save/reload → Maps segmen. Alternatif closure sesuai snapshot. Jangan memakai skor optimasi atau persentase penghematan fiktif.

Gate final yang benar-benar dijalankan:

| Perintah / pemeriksaan | Hasil aktual |
|---|---|
| `cd backend; .venv/Scripts/python -m pytest -q` | 109 passed; 1 warning deprecation Starlette/httpx |
| `ruff check backend/app backend/tests backend/scripts` | All checks passed (Ruff 0.15.22) |
| `ruff format --check backend/app backend/tests backend/scripts` | 31 files already formatted |
| `.venv/Scripts/python -m pip check` | No broken requirements found |
| `npm test --prefix frontend -- --runInBand` | 14 passed, 4 suites |
| `npm run build --prefix frontend` | Compiled successfully; warning Node fs.F_OK deprecation |
| `python -m scripts.export_schemas` | Berhasil; exported schemas tidak drift |
| `python -m scripts.check_place_source` | local v0.3, 9 rows canonical; liveRead=false |
| HTTP smoke pada 8015 | Health/parse/plan/closure/replan lulus; full snapshots disimpan |
| `node qa/release-browser.cjs` pada 8015 | 12/12, consoleErrors=[], httpErrors=[] |
| `node qa/release-mobile.cjs` pada 8015 | 10/10, pageErrors=[], document width 390 pada viewport 390 |
| `node qa/release-maps.cjs` | Popup/URL driving lulus, rendered=false; full external route belum terverifikasi |
| Build SPA deep links / missing API/assets | Reload di browser lulus; HTTP/API/static tests lulus |

`qa/release/browser-before-map-fix.json` merekam error sebelum patch; bukan hasil final. Sebagian separator text sempat menyebabkan build gagal selama editing; telah dikoreksi dan build final berhasil. Tidak ada klaim semua run awal lulus.
 [Desktop](../qa/release/browser-desktop.json), [mobile](../qa/release/browser-mobile.json), [Maps](../qa/release/maps-handoff.json), screenshot di [laporan QA](RELEASE_VALIDATION.md). Mobile adalah emulasi Chrome, bukan perangkat fisik/Safari. Maps URL/popup terbukti, render penuh eksternal masih tidak terverifikasi.

## Operasional dan keputusan tersisa

Mode lokal satu origin telah diuji: build React dilayani FastAPI di 127.0.0.1:8015, API relative, deep link reload berhasil, asset/API salah tetap 404. Lihat [startup](../backend/README.md). Tidak mengaktifkan layanan billable; local execution tidak membutuhkan paid API. HTTP localhost bukan deployment HTTPS publik. Paket/OS dan internet untuk tiles/fonts/Maps tetap diperlukan. Tidak ada klaim quota hosting tak terbatas atau paket provider gratis sebelum plan spesifik diperiksa.

Environment: TRPIN_PLACE_SOURCE=local, TRPIN_SERVE_FRONTEND=true untuk build demo, TRPIN_CORS_ORIGINS untuk dev origin tepat; REACT_APP_API_URL hanya bila API beda origin saat build. Supabase opsional: TRPIN_SUPABASE_URL, TRPIN_SUPABASE_ANON_KEY, TRPIN_SUPABASE_PLACES_VIEW, TRPIN_SUPABASE_DATASET_VERSION. Jangan commit backend/.env atau key pada frontend. Health tidak menyatakan DB sehat.

Keputusan Database: public.saved_places katalog publik atau simpanan pengguna? Apa columns/types, mapping basis harga/null/evidence, key stabil, versioning dan approved read grants/RLS? Apakah canonical JSON view sudah tersedia atau perlu mapper? Belum ada bukti untuk memilih jawaban. Keputusan release: host/domain/plan yang disetujui untuk Rp0 dan proxy terpercaya; uji perangkat serta jaringan venue.

**Readiness:** alur guest lokal siap demo bersyarat estimasi/unknown. P0 yang independen telah dikerjakan dan diuji; koneksi Supabase live serta publikasi HTTPS tetap BLOCKED oleh informasi/akses eksternal. Data operasional lengkap dan render Maps fisik masih gate sebelum klaim production/field-ready. Pekerjaan baru tidak otomatis dipromosikan ke main.

## Database ownership follow-up

Pengguna kemudian mengizinkan kami menyiapkan database karena teammate belum mengerjakannya. Migration additive, seed canonical dan permission checks tersedia di [supabase/README.md](../supabase/README.md). Tidak menimpa `public.saved_places`; katalog baru bernama `public.tripin_place_catalog` dan view `public.tripin_places_api`. PostgreSQL 16 lokal benar-benar mengeksekusi migration/seed dan menguji read-only roles/RLS/view/idempotensi dengan sukses; hasil `qa/release/postgres-catalog.json`. Belum ada project URL/akses aman, sehingga tidak ada perubahan Supabase live. Status tetap MOCKED untuk HTTP adapter / schema verified lokal; bukan CONNECTED/VERIFIED hosted Supabase.

M03 diperinci: schema/seed/tests lokal **DONE**; penerapan project, konfigurasi read key dan HTTP/browser live **BLOCKED** pada akses project. Informasi yang kini diperlukan dari tim adalah project URL/akses SQL Editor atau koneksi deployment yang aman, bukan meminta teammate mendesain ulang schema dari nol. Nama view canonical usulan baru sudah konkret, dan tabel lama dipertahankan.


Pemeriksaan paket Free Supabase pada 24 November 2026: halaman resmi memuat $0/bulan, maksimal 2 project aktif, database 500 MB, egress 5 GB, serta pause setelah satu minggu tidak aktif. Ini batas plan yang dipublikasikan, bukan verifikasi plan akun tim. Lihat [pricing resmi](https://supabase.com/pricing). Jangan upgrade/add-on/custom domain berbayar untuk demo. Katalog kecil dan cache membatasi beban, tetapi tidak memberi jaminan uptime.
