# TRIPIN — Panduan kerja tim

Sumber backlog aktif: **[GitHub Project](https://github.com/users/muhfajri24/projects/1)** dan [Issues](https://github.com/muhfajri24/tripin/issues). Detail implementasi/acceptance/tes ada di issue, tidak diduplikasi ke banyak MD. Sprint **usulan 24–30 November 2026**; target dapat diubah PM setelah baseline dan kapasitas disepakati.

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
- **Blocked** harus menyebut kebutuhan spesifik. Supabase schema/seed sudah diuji PostgreSQL lokal; hosted apply/read-key/HTTP masih perlu akses. Local source tersedia eksplisit, tidak boleh silent fallback/mixing atau mock-as-live.
- Jika live Supabase/hosting belum tersedia, PM boleh menyetujui demo **local-mode** dengan keterbatasan jelas. Issue live tetap Blocked; jangan ditutup sebagai connected. QA lokal/fallback tidak menunggu host publik.
- P0: functional data-backed guest flow, constraints/ledger/replan, storage, browser QA dan reproducible demo. P1: enrichment/UX/SDG evidence. P2: routing/area/interaksi lanjutan hanya setelah scope baru disetujui. Booking/login/collaboration bukan tambahan otomatis.
- Unknown tetap null/unverified; no fabricated price/hours/rating/UMKM, paid service, realtime/booking/global-optimal atau economic-impact claim. Tidak menaruh key/PII pada issue/commit.
- CI/tes/build harus dijalankan pada SHA release terbaru. Screenshot atau 109 BE/14 FE tests pada versi lama bukan bukti redesign terbaru lulus. Full Maps external rendering perlu uji perangkat/jaringan nyata.

Panduan aktif ini satu MD. Detail backlog dan status dipelihara di Project/issue; laporan lama tetap jejak historis, tidak perlu MD baru untuk setiap task. Audit sebelum redesign tersimpan pada [commit c98d3e1](https://github.com/muhfajri24/tripin/blob/c98d3e1/docs/MASTER_COMPLETION.md).
