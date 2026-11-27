# Katalog nasional untuk perencana TRIPIN

## Status implementasi

Halaman jelajah sudah menampilkan contoh lokasi dari berbagai wilayah Indonesia, tetapi katalog tervalidasi yang dipakai API planner masih **Yogyakarta** (`backend/app/data/yogyakarta-v0.4.0.json`). Data contoh di `frontend/src/data/mockData.js` tidak boleh dipakai sebagai tarif, jam buka, popularitas, atau hasil rute faktual. `TravelRequest.destinationId`, `Place.destinationId`, parser, dan batas koordinat planner masih dibatasi Yogyakarta. Karena itu rencana otomatis lintas Indonesia belum siap dinyatakan didukung.

## Pekerjaan FE, data, dan BE berikutnya

1. **Tianisa / data:** siapkan katalog per kota atau kawasan, bukan per pulau. Setiap tempat perlu ID stabil, destination ID, nama, jenis, kategori, koordinat dan alamat dengan sumber, jam buka per hari beserta tanggal cek, durasi kunjungan, tarif dengan basis dan tanggal/sumber, serta status usaha lokal. Nilai yang belum terbukti tetap `null`. Untuk mode “hits”, perlu indikator popularitas terukur, sumber, cakupan, dan tanggal pengamatan; jangan memakai angka rating/review dari mock.
2. **Tianisa / hotel:** kumpulkan hotel sebagai titik rute. Nama dan koordinat perlu dapat dipilih terpisah dari destinasi wisata. Tarif kamar tergantung tanggal dan jenis kamar, jadi masukkan hanya tarif yang punya dasar yang jelas; jika tidak, minta estimasi pengguna seperti alur sekarang.
3. **Shakira / FE:** pertahankan langkah selera → prompt → review → hasil. Tampilkan kota yang katalog plannernya siap, dasar anggaran (per orang atau rombongan), prioritas (terdekat/hemat/seimbang), nama hotel untuk perjalanan menginap, dan estimasi pengguna. Daerah nasional yang belum punya data harus terlihat sebagai belum siap tanpa dialihkan ke Yogyakarta secara diam-diam.
4. **Fajri / BE:** setelah dataset tiap daerah lolos QA, perluas kontrak destination ID, parser, repository lokal/Supabase, pembatas koordinat per area, dan validasi request. Kandidat harus disaring menurut daerah terpilih. Hotel tidak boleh masuk daftar aktivitas. `travel_time` memprioritaskan jarak perkiraan; `budget` menaruh harga tidak diketahui setelah harga yang tersedia. Jangan menyebut hasil global optimum atau waktu jalan nyata.
5. **Fajri / QA dan PM:** uji harga katalog dan estimasi pengguna mengalir ke ledger tanpa berubah setelah simpan/muat ulang/replan. Uji konflik budget, lokasi hotel, kategori, mode prioritas, daerah tak didukung, outage katalog, dan mobile. Freeze rilis nasional hanya setelah beberapa kawasan lintas pulau memiliki data dan rencana yang benar-benar dapat dibuat dari API.

## Perbaikan lokal saat ini

Form review sekarang selalu memperlihatkan budget dan basisnya, pilihan prioritas, hotel untuk trip menginap, serta estimasi makan/kamar/kendaraan. Pilihan tersebut dikirim melalui kontrak planner. Harga kunjungan yang masuk ledger tampil pada kartu aktivitas; rincian biaya tetap menyimpan sumber dan status data. Ini belum memperluas katalog di luar Yogyakarta.
