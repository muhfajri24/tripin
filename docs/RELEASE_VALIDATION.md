> Checkpoint sebelumnya; status master sprint terbaru: [MASTER_COMPLETION.md](MASTER_COMPLETION.md). Artefak browser/HTTP di qa/release diperbarui pada run master sprint.

# Release validation — 24 November 2026

Baseline: `dev` pada `4e29f78`; pengujian berikut mencakup perbaikan lokal sprint ini. Tidak ada perubahan dataset aktif, skema Supabase, atau deployment produksi. Hasil lokal tidak membuktikan seluruh data operasional benar.

## Hasil browser nyata

Google Chrome terpasang dijalankan melalui Playwright lokal, sesuai izin pengguna. Desktop 1440×960: **12 langkah lulus**; mobile emulasi 390×844: **10 langkah lulus**. Ini emulasi browser, belum pengujian perangkat fisik atau Safari. Lihat [hasil desktop](../qa/release/browser-desktop.json) dan [mobile](../qa/release/browser-mobile.json). Tidak ada page error pada alur akhir. Request yang sengaja digagalkan untuk menguji error bukan kegagalan layanan nyata.

Alur teruji: navigasi landing, parsing dan review terstruktur, pilihan destinasi/penginapan, generate, biaya, marker peta, simpan/reload/hapus trip uji, edit, konflik lock, delay dua jam, closure, perbandingan, URL Maps, empty state, ID tidak ditemukan, error jaringan, dan budget tidak memungkinkan. Pada mobile tidak ditemukan overflow dokumen pada viewport uji.

| Bukti | Screenshot |
|---|---|
| Landing desktop | [01](../qa/release/screenshots/01-desktop-landing.png) |
| Review dan lodging | [03](../qa/release/screenshots/03-desktop-lodging-review.png) |
| Biaya | [05](../qa/release/screenshots/05-desktop-budget.png) |
| Locked stop menolak delay | [06](../qa/release/screenshots/06-desktop-lock-conflict.png) |
| Before/after delay | [07](../qa/release/screenshots/07-desktop-delay-comparison.png) |
| Closure | [08](../qa/release/screenshots/08-desktop-closure.png) |
| Peta OSM selesai dimuat | [19](../qa/release/screenshots/19-desktop-map-loaded.png) |
| Mobile result dan budget | [13](../qa/release/screenshots/13-mobile-result.png), [14](../qa/release/screenshots/14-mobile-budget.png) |
| Error jaringan dan budget | [17](../qa/release/screenshots/17-mobile-network-error.png), [18](../qa/release/screenshots/18-mobile-budget-conflict.png) |

Klik Maps membuka popup Google Maps dengan origin, destination, waypoint dan driving; [bukti URL](../qa/release/maps-handoff.json). Render rute penuh pada layanan eksternal belum terverifikasi: screenshot 09 masih putih. Tidak dilakukan scraping Google Maps.

## Defect dan perbaikan

| ID / prioritas | Reproduksi dan dampak | Status / regresi |
|---|---|---|
| QA-01 P0 | Generate → delay 120 menit → edit berikutnya. Sebelumnya jadwal dapat kembali sebelum delay yang sudah diakui. | Diperbaiki: persist `replanState.progress`, tolak effectiveAt mundur. Tes domain dan JSON roundtrip. |
| QA-02 P0 | Laporkan closure tanggal tertentu → edit menambahkan tempat tersebut lagi. Sebelumnya closure terlupakan. | Diperbaiki: persist closure per tempat/tanggal; tes menambah kembali pada waktu efektif valid ditolak dengan alasan closure. |
| QA-03 P0 | Simpan revisi editor terbaru → reload dengan route state revisi lama. Editor memilih revisi lama. | Diperbaiki: pilih revisi tertinggi antara storage dan route state; tes storage serta mounted editor. [Bukti sebelum perbaikan](../qa/release/screenshots/defect-stale-editor-reload.png). |
| QA-04 P1 | Submit review ketika panel utama tergulir ke bawah → result mewarisi posisi scroll; judul/peringatan terlewat. | Terbuka; reset scroll container saat route berubah perlu perbaikan terpisah. |
| QA-05 P1 | Jaringan dingin → tile OSM terlambat/abu-abu sementara. Akhirnya termuat pada screenshot 19. | Dependensi eksternal, bukan kegagalan permanen yang terbukti. Uji jaringan lokasi lomba dan tampilkan state pemuatan. |
| QA-06 P2 | Buka landing/result/Maps: sejumlah separator dan rentang waktu tampil sebagai karakter literal `?`. | Terbuka; koreksi string spesifik dan verifikasi encoding; jangan mengganti semua `?` di kode. |

`replanState` bersifat tambahan dengan default kosong untuk itinerary lama. Skema diekspor ulang. Riwayat delay/closure yang sudah hilang dari simpanan sebelum patch tidak dapat direkonstruksi. Ini perbaikan state, bukan implementasi optimizer baru. File `failure-*` adalah artefak diagnosis harness; tidak semuanya defect produk.

## Backend dan metrik yang dihitung

**88 tes backend lulus**, termasuk validasi kontrak/fixture, uang/waktu/koordinat, unknown, dataset, health, constraints, mandatory activities, locked stops, ID, error, scheduling dan replanning. Ada satu warning deprecation Starlette/httpx. **12 tes frontend lulus** pada tiga suite. Build produksi frontend berhasil. Pemeriksaan `pip check` bersih. Ruff tidak tersedia di virtualenv saat pemeriksaan terakhir, sehingga tidak diklaim lulus lint ulang.

[HTTP smoke nyata](../qa/release/http-smoke.json): request dua hari, dua orang, Rp500.000/orang dinormalisasi menjadi Rp1.000.000/group. Sebelum closure: known cost Rp470.000, 3 item biaya unknown, estimasi perjalanan 27 menit / 6.909 m. Sesudah: Rp470.000, 3 unknown, 27 menit / 6.916 m. Satu konflik closure terdeteksi; aktivitas dipindahkan antarhari. Delta total biaya tetap null karena unknown. Angka ini berasal dari output aplikasi dan asumsi biaya pengguna, bukan kutipan harga hotel. Tidak ada klaim keunggulan optimasi atau rute global optimal.

## Kesiapan data

[Profil per record](../qa/release/data-profile.json): katalog aktif v0.2.0 berisi 9 tempat (5 attraction, 2 food, 2 lodging); duplikasi ID/nama ternormalisasi 0. Koordinat 7/9, harga 1/9, jam buka 1/9, alamat 4/9, klasifikasi usaha lokal 0/9. Semua durasi kunjungan berstatus estimated. Koordinat berada dalam batas pilot kasar; ini bukan verifikasi akurasi lapangan. Identitas, koordinat historis, dan jam operasional harus dinilai per evidence; `checkedAt` bukan jaminan masih beroperasi.

Validasi sumber resmi menemukan kandidat enrichment berikut; **belum ditulis ke dataset aktif**:

- [Wahanarata/Keraton](https://tourism.kratonjogja.id/id-ID/destination/4-kagungan-dalem-wahanarata/): publikasi Selasa–Minggu 09.00–15.00, Senin tutup. Pastikan alias identitas terhadap Museum Kereta sebelum memetakan; harga belum dikonfirmasi.
- [Kedhaton](https://tourism.kratonjogja.id/id-ID/destination/3-kagungan-dalem-kedhaton/): Selasa–Minggu 08.30–14.30, Senin tutup; koordinat tetap memerlukan sumber yang diizinkan.
- [Sonobudoyo operator provinsi](https://sonobudoyo.jogjaprov.go.id/id/hubungi): pameran tetap Selasa–Minggu 08.00–21.00, tiket terakhir 20.00. Jangan memakai jam kantor sebagai jam kunjungan. [Indonesia Travel](https://www.indonesia.travel/id/id/destination/java/yogyakarta/museum-sonobudoyo) memuat tiket domestik dewasa Rp10.000, anak Rp5.000, asing Rp20.000. Sumber operator lama mempunyai informasi berbeda; perlu catat applicability dan freshness, bukan menimpa tanpa review.
- [Vredeburg](https://vredeburg.id/ticket-information/page/waktu-kunjungan): Selasa–Kamis 08.00–20.00, Jumat–Minggu 08.00–21.00, Senin tutup. Timestamp artikel lama membuat freshness belum pasti; harga belum terverifikasi.
- [ibis Styles](https://all.accor.com/hotel/7460/index.en.shtml) dan [Phoenix](https://all.accor.com/hotel/5451/index.en.shtml): identitas dan anchor hotel; check-in mulai 14.00/check-out 12.00. Tarif tanggal perjalanan, ketersediaan dan kapasitas kamar belum dibuktikan. Jangan mengartikan jam reception sebagai jam aktivitas wisata.
- [Gudeg Yu Djum](https://gudegyudjumpusat.com/): identitas/alamat cabang pusat; harga, koordinat dan jam belum terkonfirmasi dari halaman yang diperiksa. Tidak ada dasar menyebut semua restoran UMKM.

Minimum sebelum demo dua hari yang kredibel: kurasi dua attraction dengan koordinat, jam dan applicability tiket; satu food yang dapat dirutekan dengan jam dan biaya atau asumsi pengguna eksplisit; satu lodging anchor dengan kapasitas/room-night dan asumsi biaya; tanggal tidak bertabrakan hari tutup. Lengkapi evidence per field dan pengecualian tanggal. Demo teknis sekarang dapat memakai unknown secara transparan, tetapi belum dapat menjanjikan seluruh jadwal operasional atau total biaya terverifikasi. Tidak mengarang rating atau dampak ekonomi.

## Supabase dan deployment

[Checklist Supabase](SUPABASE_INTEGRATION.md) tetap PENDING: skema teammate belum tersedia/diuji. Local repository tetap aktif. Tidak ada perubahan schema, credential, RLS atau data teammate.

| Pemeriksaan | Hasil |
|---|---|
| Backend startup dan HTTP health | Lulus lokal, port QA 8014 |
| Frontend dev dan proxy API | Lulus browser pada 3002, proxy default ke 8011 |
| CORS local origin / origin asing | Origin yang dikonfigurasi diterima; origin asing ditolak, [bukti](../qa/release/cors.json) |
| Reload deep link React | Lulus dev server; hosting produksi belum diuji |
| Frontend tests | 12 lulus |
| Production build | Lulus: `npm run build` compiled successfully; artefak build tidak di-commit |
| Environment | Local source tanpa secret/paid API; env produksi dan origin HTTPS masih perlu ditetapkan |
| Production API proxy / SPA fallback | Belum diuji; CRA proxy hanya development, host wajib konfigurasi API dan fallback index.html |
| Zero-cost | Tidak mengaktifkan layanan berbayar; kuota host, OSM tiles, font/CDN dan koneksi internet belum merupakan SLA terjamin |
| Perangkat demo / Maps render | Belum diverifikasi pada perangkat fisik dan jaringan venue |

## Penilaian akhir

**AMBER — alur guest lokal dapat didemonstrasikan dengan label estimasi/unknown.** Tiga blocker state P0 yang direproduksi sudah diperbaiki dan diuji. Klaim demo stabil di hosting produksi masih tertahan oleh konfigurasi deployment yang belum diuji, render eksternal Maps, dan kesiapan data operasional dua hari. Integrasi Supabase merupakan blocker untuk mengganti local adapter, bukan syarat menjalankan demo lokal.

Checklist regresi sebelum lomba: jalankan BE/FE tests dan build; ulangi desktop/mobile pada origin target; periksa tanggal/jam/biaya dataset; simpan–reload–edit setelah delay dan closure; pastikan locked stop menolak konflik; cocokkan marker dengan stop; buka Maps pada perangkat target; periksa error jaringan dan unknown; pastikan deep link produksi dan API/CORS benar. Jangan merge main sampai pemeriksaan target selesai.

