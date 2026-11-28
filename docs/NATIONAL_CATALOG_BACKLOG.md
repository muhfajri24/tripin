# Katalog nasional untuk perencana TRIPIN

## Status implementasi

Planner kini menerima daerah Indonesia yang dicari pengguna. Snapshot OpenStreetMap untuk Medan, Bandung, Denpasar, Banjarmasin, Makassar, Jayapura, Jakarta, Padang, Labuan Bajo, Bali, Surabaya, dan area terbatas Raja Ampat tersedia lokal. Sebelas area lintas pulau lulus smoke test perjalanan satu serta dua hari. Daerah lain dicari melalui Nominatim dan Overpass saat diminta; kegagalan sumber dinyatakan secara eksplisit. Katalog Yogyakarta tetap terpisah dan dikurasi. Data contoh di `frontend/src/data/mockData.js` tidak dipakai sebagai tarif, jam buka, popularitas, atau hasil rute faktual. Harga dan jam buka dari snapshot nasional tetap `null` kecuali pengguna mengisi estimasinya.

## Pekerjaan FE, data, dan BE berikutnya

1. **Tianisa / data:** siapkan katalog per kota atau kawasan, bukan per pulau. Setiap tempat perlu ID stabil, destination ID, nama, jenis, kategori, koordinat dan alamat dengan sumber, jam buka per hari beserta tanggal cek, durasi kunjungan, tarif dengan basis dan tanggal/sumber, serta status usaha lokal. Nilai yang belum terbukti tetap `null`. Untuk mode “hits”, perlu indikator popularitas terukur, sumber, cakupan, dan tanggal pengamatan; jangan memakai angka rating/review dari mock.
2. **Tianisa / hotel:** kumpulkan hotel sebagai titik rute. Nama dan koordinat perlu dapat dipilih terpisah dari destinasi wisata. Tarif kamar tergantung tanggal dan jenis kamar, jadi masukkan hanya tarif yang punya dasar yang jelas; jika tidak, minta estimasi pengguna seperti alur sekarang.
3. **Shakira / FE:** pertahankan langkah selera → prompt → review → hasil. Tampilkan kota yang katalog plannernya siap, dasar anggaran (per orang atau rombongan), prioritas (terdekat/hemat/seimbang), nama hotel untuk perjalanan menginap, dan estimasi pengguna. Daerah nasional yang belum punya data harus terlihat sebagai belum siap tanpa dialihkan ke Yogyakarta secara diam-diam.
4. **Fajri / BE:** kontrak destination ID, repository nasional, pembatas koordinat per area, dan pemisahan hotel dari aktivitas sudah diimplementasikan. Lanjutkan kurasi kota tambahan dan rencana kapasitas sumber sebelum trafik publik. `travel_time` memakai jarak perkiraan; `budget` menaruh harga tidak diketahui setelah harga yang tersedia. Jangan menyebut hasil global optimum atau waktu jalan nyata.
5. **Fajri / QA dan PM:** smoke API enam kota dan tes kontrak otomatis sudah lulus. Lanjutkan browser E2E pada perangkat fisik, khususnya simpan/muat ulang/replan, outage live, dan Maps handoff. Tinjau mutu POI dan lisensi sebelum rilis publik.

## Perbaikan lokal saat ini

Form review memperlihatkan daerah, budget dan basisnya, pilihan prioritas, hotel untuk trip menginap, serta estimasi makan/kamar/kendaraan. Daerah yang dipilih dikirim melalui kontrak planner dan nama kota bertahan setelah trip disimpan. Harga kunjungan yang masuk ledger tampil pada kartu aktivitas; rincian biaya menyimpan sumber dan status data. Semua biaya yang tidak diketahui tetap terbuka sebagai ketidakpastian.

Pencarian hotel tambahan memakai nama yang diketik pengguna dalam radius 30 km dari pusat daerah, lalu menambahkan hotel yang dipilih ke katalog proses planner. Daerah tanpa snapshot mengambil wisata, pantai/alam, sejarah, taman, dan kuliner dari radius 20 km; hasil mengikuti kelengkapan OpenStreetMap dan ketersediaan layanan. Input teks hotel harus dipilih dari hasil agar koordinatnya pasti, dan UI menampilkan status hotel terpilih. Saat perencanaan pindah worker atau backend baru dimulai, planner memuat ulang ID hotel terpilih dari OpenStreetMap dan memvalidasi jenis serta koordinatnya.
