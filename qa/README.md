# Browser QA lokal

Laporan: [Release validation](../docs/RELEASE_VALIDATION.md). Browser dijalankan atas izin eksplisit pengguna, memakai profil/context terisolasi; tidak menggunakan data browser pribadi.

Prasyarat: backend aktif port 8011 (`frontend/package.json` proxy), frontend aktif; katalog lokal. Install dependency QA terpisah dengan `npm install --prefix qa/browser`. Ini tidak menambah dependency runtime frontend/backend. Chrome sistem diperlukan; default Windows `C:/Program Files/Google/Chrome/Application/chrome.exe`.

Dari root PowerShell:

```powershell
$env:TRIPIN_QA_BASE_URL='http://localhost:3002'
node qa/release-browser.cjs
node qa/release-mobile.cjs
node qa/release-maps.cjs
```

Periksa URL/path di awal script sebelum memakai port atau OS berbeda. `TRIPIN_QA_CHROME_PATH` tersedia pada script yang mendukungnya. Maps harness juga memakai backend lokal untuk setup trip. Screenshot dan JSON ada di `release/`; file terbaru ditimpa saat rerun. JSON merupakan hasil run yang direkam, bukan otomatis jaminan kondisi saat ini. `baseline.cjs` adalah probe awal. `failure-*` menyimpan diagnosis harness, termasuk assertion yang terlalu dini; gunakan daftar screenshot terkurasi dalam laporan untuk evidence produk.

Chrome mobile adalah emulasi, bukan perangkat fisik. Pop-up Maps/URL diverifikasi; konten layanan eksternal belum terjamin selesai render. Screenshot peta OSM yang sudah termuat tersedia terpisah. Tidak ada scraping Google Maps.
