# TRIPIN — Panduan kerja tim

Sumber backlog aktif: **[GitHub Project](https://github.com/users/muhfajri24/projects/1)** dan [Issues](https://github.com/muhfajri24/tripin/issues). Detail implementasi/acceptance/tes ada di issue, tidak diduplikasi ke banyak MD. Sprint **usulan 24–30 November 2026**; target dapat diubah PM setelah baseline dan kapasitas disepakati.

Update 27 November: katalog Yogyakarta v0.4 kini aktif secara lokal dan di Supabase
sebagai versi baru yang immutable. Sembilan baris live dan lokal memiliki checksum
canonical sama (`e025f8cd2217feed2b04f26e6ff738297411c3a7908221ebff1170714c378eb1`).
Uji HTTP live pada v0.4 lulus untuk list/filter/detail, plan 1/2/3 hari, dan
replan. Arsip v0.3 tidak diubah. Gate operasional tanggal perjalanan, FE
Discovery terbaru, HTTPS, perangkat fisik, rehearsal manusia, dan review release
tetap terpisah. Paragraf status v0.3 di bawah adalah riwayat audit sebelumnya.

Update 25 November: [integration recheck](INTEGRATION_RECHECK.md) mencatat pemulihan canonical guest flow, browser desktop/mobile/recovery local dan live yang lulus, serta blocker baru parity katalog live/local di bawah versi v0.3 yang sama. Temuan FE-00 di bawah adalah baseline historis; acceptance/release tidak otomatis Done. Final SHA dan CI dicatat pada issue.

## Tim dan akses

| Orang | Akun | Tanggung jawab / akses |
|---|---|---|
| Shakira | [@shakiraBilqis / backlog](https://github.com/users/muhfajri24/projects/1/views/4) | Primary frontend; repo Write, Project Writer |
| Tianisa | [@tianisasianipar / backlog](https://github.com/users/muhfajri24/projects/1/views/5) | Primary data engineering/Supabase; repo Write, Project Writer |
| Fajri | [@muhfajri24 / backlog](https://github.com/users/muhfajri24/projects/1/views/6) | Fullstack + PM + QA, membantu dua role; repo/Project Admin |

Tiga akun diverifikasi sebagai collaborator. Contributor adalah riwayat commit, bukan bukti hak akses; Tianisa belum harus punya commit agar dapat bekerja. Hak GitHub tidak bisa membatasi issue/folder per orang. Assignee tunggal, reservation file dan handoff mengatur ownership. `.github/CODEOWNERS` mengarahkan review, bukan ACL direct push.

## Mulai dari sini

| Owner | Urutan awal | Batas utama |
|---|---|---|
| Fajri | [QA-01 #5](https://github.com/muhfajri24/tripin/issues/5) → [FS-01 #6](https://github.com/muhfajri24/tripin/issues/6) → backend/CI/QA | Kontrak canonical, runtime BE, shared config, CI, QA dan release |
| Shakira | [FE-01 #8](https://github.com/muhfajri24/tripin/issues/8) → **[FE-00 #42](https://github.com/muhfajri24/tripin/issues/42)** → [FE-02 #17](https://github.com/muhfajri24/tripin/issues/17) | `frontend/`; integrasi desain baru dengan API dulu sebelum polish |
| Tianisa | [DE-01 #7](https://github.com/muhfajri24/tripin/issues/7) → [DE-02 #9](https://github.com/muhfajri24/tripin/issues/9); setelah kontrak lanjut kurasi | `backend/app/data/`, `supabase/`, seed/quality data; tanpa edit FE |

**Temuan baru:** pull `04c2c8f` mengintegrasikan redesign FE, tetapi active Create/Result/Explore/Navbar kembali mengimpor mockData dan App mengaktifkan dashboard/settings/saved. FE-00 adalah blocker P0: pertahankan desain Shakira sambil memulihkan canonical guest API/storage. Jangan restore massal hingga membuang visual teammate. QA lulus pada `c98d3e1` adalah bukti historis, bukan hasil runtime commit baru. Baseline harus dijalankan ulang melalui QA-01.

## Milestone dan roadmap

| Milestone | Target WIB | Gate |
| [M1 — Ownership, baseline & contracts](https://github.com/muhfajri24/tripin/milestone/1) | 2026-11-24 | Ownership, baseline aktual, API/fixtures disepakati |
| [M2 — Data readiness & source integration](https://github.com/muhfajri24/tripin/milestone/2) | 2026-11-26 | Katalog kecil kredibel, source integration, integrasi FE P0 |
| [M3 — Guest workflow & adaptive UX](https://github.com/muhfajri24/tripin/milestone/3) | 2026-11-27 | Review/selection/budget/editor dan constraints terhubung |
| [M4 — Integration, security & deployment checks](https://github.com/muhfajri24/tripin/milestone/4) | 2026-11-29 | CI, desktop/mobile, outage, limits/CORS dan deployment/fallback |
| [M5 — Competition acceptance & main release](https://github.com/muhfajri24/tripin/milestone/5) | 2026-11-30 | Frozen SHA/data, no unresolved in-scope P0, rehearsal dan human-reviewed release |

[After MVP](https://github.com/muhfajri24/tripin/milestone/6) adalah parking lot P2, bukan komitmen tujuh hari.

| Hari | Fokus tim / checkpoint |
|---|---|
| D1 / 24 Nov | PM board/ownership; QA baseline; kontrak Fajri; FE audit; Tianisa memperoleh akses project |
| D2 / 25 Nov | Shakira FE-00; Tianisa SQL/seed + attraction/food; Fajri mendampingi kontrak/integrasi |
| D3 / 26 Nov | Read-only live smoke bila akses ada; data quality; review/selection/ledger checkpoint |
| D4 / 27 Nov | Replan + protected stops; CI; freeze versi data; serah-terima error contracts |
| D5 / 28 Nov | Storage/error/maps/Explore; API safety; target hosting atau local build |
| D6 / 29 Nov | E2E desktop/mobile/outage; triage; fix defect assigned; freeze scope dan SHA |
| D7 / 30 Nov | Source recheck, regression final, rehearsal; dev→main hanya setelah review |

Estimasi fokus (belum termasuk perubahan scope): Shakira **29 jam / 11 issue**, Tianisa **19 jam / 10 issue**, Fajri **36 jam / 18 issue**. Masing-masing hitungan issue termasuk satu P2 berestimasi 0 (belum dijadwalkan), bukan tugas gratis. Bantuan Fajri dilakukan lewat pairing/review dan tidak menambah assignee kedua. Sediakan buffer pairing Fajri 6 jam (maksimal sekitar 1 jam/hari D2-D7), sehingga alokasi Fajri menjadi 36 jam task + 6 jam bantuan/review. Jika buffer habis, potong P1, jangan mengambil file owner lain.

## Aturan dua branch dan anti-bentrok

1. **Hanya `dev` untuk kerja/pengujian bersama; `main` untuk release utama dan default branch.** Tidak membuat feature branch. Branch draft PR #3 sudah diarsipkan sebagai tag `archive/supabase-pr-3-20261124`, PR ditutup sebagai superseded; commit tetap tersimpan.
2. Buka view owner pada Project atau filter `assignee:@me`. Ambil **Todo tanpa dependency terbuka**, tetap primary assignee. Jangan mengerjakan backlog orang lain tanpa PM reassign/handoff.
3. Sebelum edit, ubah **In Progress** dan catat pada issue: `files: path... | slot: jam WIB | dependency: ...`. Maksimal satu task coding aktif per orang. PM menjaga hanya satu owner per file dan satu pusher per slot.
4. `git pull --ff-only origin dev` sebelum mulai. Commit kecil `Refs #nomor`; fetch/pull lagi sebelum push. Bila divergen, koordinasikan dan rebase hanya commit lokal yang belum dipublish. Jangan rewrite shared history, force-push, atau menimpa uncommitted changes.
5. Shakira mengedit FE; Tianisa data/SQL; Fajri backend/contracts/CI. File shared seperti TripView/PreferenceForm tetap berurutan sesuai dependencies FE. Fajri yang membantu file mereka wajib minta slot dan handoff; tidak parallel-edit file yang sama.
6. Pindah **Review** dengan SHA, checklist AC, command/hasil tes dan screenshot/log tersanitasi. PM/QA menutup setelah acceptance. Jika Fajri author, minta review Shakira/Tianisa; jangan self-approve.
7. `main` memerlukan satu approval PR dan conversation resolution untuk alur normal; PR release hanya `dev`→`main`, tanpa auto-merge. Admin dapat bypass secara teknis; kebijakan tim tetap wajib gate/review. `dev` menerima direct push untuk tiga writer. Keduanya melarang force-push/delete.

## Definition of Done dan scope cuts

- Setiap issue mempunyai primary owner, file scope, dependencies native GitHub, priority, effort, target, AC dan tes. **Done** memerlukan bukti; coding selesai bukan otomatis acceptance selesai.
- **Blocked** harus menyebut kebutuhan spesifik. Supabase schema/seed sudah diuji PostgreSQL lokal; hosted apply/read-key/parity/HTTP kini terverifikasi pada audit lokal 24 November 2026 (lihat catatan tinjauan di bawah). Acceptance frontend masih terpisah. Local source tersedia eksplisit, tidak boleh silent fallback/mixing atau mock-as-live.
- Jika live Supabase/hosting belum tersedia, PM boleh menyetujui demo **local-mode** dengan keterbatasan jelas. Issue live tetap Blocked; jangan ditutup sebagai connected. QA lokal/fallback tidak menunggu host publik.
- P0: functional data-backed guest flow, constraints/ledger/replan, storage, browser QA dan reproducible demo. P1: enrichment/UX/SDG evidence. P2: routing/area/interaksi lanjutan hanya setelah scope baru disetujui. Booking/login/collaboration bukan tambahan otomatis.
- Unknown tetap null/unverified; no fabricated price/hours/rating/UMKM, paid service, realtime/booking/global-optimal atau economic-impact claim. Tidak menaruh key/PII pada issue/commit.
- CI/tes/build harus dijalankan pada SHA release terbaru. Screenshot atau 109 BE/14 FE tests pada versi lama bukan bukti redesign terbaru lulus. Full Maps external rendering perlu uji perangkat/jaringan nyata.

Panduan aktif ini satu MD. Detail backlog dan status dipelihara di Project/issue; laporan lama tetap jejak historis, tidak perlu MD baru untuk setiap task. Audit sebelum redesign tersimpan pada [commit c98d3e1](https://github.com/muhfajri24/tripin/blob/c98d3e1/docs/MASTER_COMPLETION.md).

## Paket tinjauan lokal Fajri — 24 November 2026

Atas permintaan pengguna, seluruh 18 issue yang assigned ke `muhfajri24` diaudit; dua sudah closed (#4/#5), 15 issue sprint masih open, dan #39 tetap P2/parked. Matriks per issue, hasil pekerjaan, bukti, serta langkah membuka blocker ada di [owner-backlog-review.json](../qa/release/owner-backlog-review.json). **Rekomendasi lokal ini tidak mengubah status GitHub/Project dan bukan acceptance manusia. Belum ada commit/push/deploy/merge.** Basis `ee3c90e` dengan working tree kotor; perubahan planner/limits/launcher/CI yang sudah ada saat mulai tetap dipertahankan dan diverifikasi. Ini belum frozen release SHA.

### Hasil yang dapat ditinjau

- #6: kontrak/fixture 1–3 hari dan export tidak drift; payload nyata ada di [snapshot API Supabase](../qa/release/owner-live-demo-snapshots.json). Approval FE/DE belum diberikan.
- #14: read live Supabase, list/filter/detail, plan 1/2/3 hari dan replan closure berhasil; parity isi + versi local/live cocok. Respons katalog kosong yang sebelumnya 200 kini ditolak sebagai 503 tanpa fallback (regresi direproduksi sebelum fix). Bagian integrasi frontend tetap blocked #42.
- #15/#16/#25: perubahan ledger/anchor/invalid-price candidate yang sudah ada, adaptive replan, body/rate/CORS/error dan outage diverifikasi. Tinjau diff backend; jangan menyebut frozen cost sebagai actual spending.
- #26: draft CI dengan action SHA terverifikasi dan quality gate data; belum ada actual remote run. FE tests akan merah sampai #42 selesai; jangan mengaktifkan required checks sebagai sudah green.
- #28: launcher demo satu origin dan explicit source tersedia, startup proses baru serta HTTP local/live lulus. Clean checkout setelah commit/push dan penerimaan UI masih harus diuji.
- Bantuan #7/#9/#13/#24: project Supabase TRIPPIN terverifikasi Free, 9 canonical rows, RLS/select-only/security_invoker benar, saved_places lama tetap 1 record. Pemeriksaan parity dengan checksum dan quality gate otomatis ditambahkan. Tidak melakukan write test pada produksi.

[Hasil validasi](../qa/release/owner-validation.json): **127 BE tests passed**, Ruff check/format passed, pip check passed, schema/seed tanpa drift, production build passed. **FE 12 passed / 2 failed** pada GuestFlow. Browser build terbaru desktop 1440×960 dan mobile emulation 390×844 mengonfirmasi storage kosong tetapi riwayat Labuan Bajo/Toba/Bandung muncul, input brief/parse hilang, dan tidak ada panggilan API. Bukti: [baseline browser](../qa/release/owner-browser-baseline.json), [desktop](../qa/release/owner-desktop-fictional-history.png), [mobile](../qa/release/owner-mobile-create-boundary.png). Tidak ada klaim semua halaman bebas error atau full E2E lulus.

### Blocker dan keputusan yang diperlukan

| Issue | Alasan aktual | Yang membuka blocker |
|---|---|---|
| #14, #29, bagian browser #31 | FE #42 masih memakai mocked guest flow | Handoff Shakira untuk canonical API/storage; ulang desktop dan outage E2E |
| #30 | FE belum lolos; belum ada perangkat fisik yang diuji | Selesaikan #29, lalu catat device/browser/network dan buktikan full Maps render |
| #26 | Workflow masih lokal, tidak ada remote CI run; dua tes FE gagal | Review/push ke dev setelah fix, jalankan CI pada SHA itu |
| #27 | Inventaris Vercel terhubung hanya ai-office/citezy, belum ada target Tripin | Pilih/buat target, cek exact free-plan quota, konfigurasi env/origin dan validasi HTTPS; deploy belum dilakukan |
| #34/#36 | Belum ada frozen SHA, FE P0/physical QA/data final/CI belum diterima | Tutup gate tersebut melalui review; jangan release build ini |
| #37/#38 | Acceptance belum lolos, tanggal demo/pembicara belum ditetapkan, dua rehearsal manusia belum dilakukan | Konfirmasi demo dan review, lakukan rehearsal lalu PR dev→main sesuai gate |
| #39 | Road routing adalah P2 setelah MVP | Tinjau proposal benchmark di bawah; tidak ada implementasi atau layanan baru |
| Uji PostgreSQL disposable ulang | Docker Desktop Linux engine tidak aktif/pipe tidak tersedia | Aktifkan Docker, jalankan ulang script; hasil PostgreSQL lama bukan hasil baru |

### Catatan bantuan data Tianisa

Tidak ditemukan commit Tianisa pada riwayat yang diperiksa atau komentarnya pada issue yang diambil. **Ini tidak membuktikan ia belum bekerja di lokal/branch lain/Dashboard.** Isi aktual tersedia, tetapi belum lengkap: aktif v0.3 memiliki 9 identitas/kategori, 7 koordinat, 5 alamat, 3 jadwal, 1 harga; status local business seluruhnya unknown.

Saya membantu menyiapkan [kandidat v0.4](../backend/app/data/proposals/yogyakarta-v0.4.0.json): alamat Vredeburg, ibis Styles dan Bebek Cak Koting, serta jadwal Vredeburg. Kandidat lolos quality gate, **belum aktif dan belum di-seed ke live**; arsip/seed/env v0.3 tidak diubah. Kelengkapan kandidat menjadi 8 alamat dan 4 jadwal; harga/koordinat/status bisnis tidak ditebak. [Catatan data dan sumber](../qa/release/owner-data-review.json) memuat kebijakan check-in/out dua hotel, keterbatasan model, provenance dan daftar sumber yang perlu dikonfirmasi.

Tianisa/Fajri perlu meninjau: harga Vredeburg bergantung hari/jam sehingga tidak aman diwakili satu tarif; tarif/operasional Wahanarata belum dikonfirmasi untuk tanggal demo (ticket endpoint 403 dan ada lead penutupan yang belum terkonfirmasi sumber primer); koordinat/jam/menu food masih sebagian unknown; hotel belum mempunyai rate/availability aktual; holiday exceptions dan tanggal demo belum final. Alamat Cak Koting bersumber artikel pemerintah tahun 2017, bukan konfirmasi operasional 2026. `checkInAt` pada request tetap deadline kedatangan pengguna; jangan menggantinya dengan waktu mulai check-in hotel.

Aktivasi kandidat perlu review lalu pembaruan versi/view-policy/seed/env secara konsisten dan parity + QA ulang. Tidak melakukan perubahan diam-diam di bawah versi v0.3 yang sama.

### Perintah tinjauan

Dari `backend`, dengan dependency dev terpasang:

```powershell
.venv/Scripts/python -m pytest -q
.venv/Scripts/python -m ruff check app tests scripts
.venv/Scripts/python -m ruff format --check app tests scripts
.venv/Scripts/python -m scripts.check_catalog_quality
.venv/Scripts/python -m scripts.check_place_source --compare-local
.venv/Scripts/python -m scripts.check_catalog_quality --dataset app/data/proposals/yogyakarta-v0.4.0.json
.venv/Scripts/python -m scripts.serve_demo --source local --port 8015
```

Dengan server itu aktif, terminal kedua dari `backend`: `.venv/Scripts/python -m scripts.smoke_http --base http://127.0.0.1:8015/api/v1`. Untuk live, jalankan launcher dengan `--source supabase` dan `.env` lokal; jangan commit key. Dari `frontend`: `npm test -- --runInBand` (saat audit masih dua kegagalan #42) dan `npm run build`.

### Draft rehearsal dan proposal P2

Draft rehearsal 3–5 menit, setelah FE #42/gate selesai: 0:00–0:45 parse brief Yogyakarta dua hari/dua orang/Rp500.000 per orang; 0:45–1:30 review budget group Rp1.000.000, hotel/anchor, user estimates dan unknown; 1:30–2:15 plan/save/reload dan ledger; 2:15–3:15 laporkan closure dan tampilkan response asli/revised/reasons; 3:15–4:00 jelaskan unknown, travel heuristic, source dan Maps; sisa waktu untuk explicit local fallback. Snapshot uji memakai 1–2 Desember 2026, **bukan tanggal demo yang sudah disetujui**. Actual v0.3 API snapshot menghasilkan known cost Rp470.000 dengan tiga unknown cost items; costDelta null sehingga tidak boleh mengklaim nominal penghematan. Belum ada dua rehearsal manusia atau penetapan pembicara.

Proposal #39 tetap parked: setelah MVP, bandingkan routing dengan input/stop order/mode identik, ukur selisih waktu/jarak dan error/latency pada rute uji yang sama, cek lisensi/atribusi/quota/biaya serta failure policy, dan pastikan respons menandai asal estimasi. Jangan menambahkan provider atau mengklaim optimalitas sebelum hasil benchmark dan scope baru disetujui.


## Crosscheck dan sinkronisasi board setelah izin push bersyarat

Pengguna mengizinkan push ke dev **hanya jika semua benar-benar aman**. Crosscheck ulang masih menemukan dua kegagalan GuestFlow (riwayat fiktif dan input brief hilang); tidak ada perubahan frontend pada paket ini. Karena syarat belum terpenuhi, push/commit/release tetap ditahan. Backend 127 passed, Ruff/format/pip dan build passed, canonical seed/schema tanpa drift, live source parity 9 record passed; HEAD dan remote dev masih `ee3c90e`.

Board kini disinkronkan berdasarkan bukti itu; catatan tinjauan lokal di atas menjadi riwayat, bukan lagi status board terkini. #6/#15/#16/#25/#28 masuk Review **lokal, belum dipublish/disetujui**. #14/#26/#27/#29/#30/#31/#34/#36/#37/#38 Blocked dengan nama yang ditunggu dan kendala di komentar issue. #4/#5 tetap Done, #39 tetap Parked. Tidak ada issue baru ditutup atau assignee diubah. Bukti URL komentar dan hasil edit tersimpan di `qa/release/owner-backlog-sync.json`.

Menunggu Shakira: pemulihan canonical API/storage #42 serta handoff untuk E2E. Menunggu Tianisa: review kandidat/sumber/data final dan konfirmasi operasional sesuai tanggal demo. Menunggu Fajri/PM: tanggal/pembicara demo, perangkat fisik/Maps, target hosting, actual CI pada SHA yang dipush, serta release gate. Draft CI belum dianggap green karena belum dipublish dan FE masih gagal. Approval untuk push tidak perlu diminta ulang setelah kondisi semua gate aman terpenuhi; crosscheck dan fetch ulang tetap diperlukan.
