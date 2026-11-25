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


Latest source/data inventory: `backend/.venv/Scripts/python qa/audit_sources.py` from root. Current build demo origin can be selected with `TRIPIN_QA_BASE_URL=http://127.0.0.1:8015` for all three release scripts. Default 3002 remains a historical dev-server choice. Same-origin demo startup is in backend README. The latest master report supersedes old checkpoint counts in the release report.

25 November integration evidence: set `TRIPIN_QA_OUTPUT=qa/release/integration-local` (or `integration-live`) before running desktop/mobile scripts, then `node qa/integration-recovery.cjs`. Output directories are created automatically. Mobile failures/page errors/document overflow return a failing exit code. Recovery injects 503/network/quota/corrupt-storage failures only in isolated browser contexts. See `docs/INTEGRATION_RECHECK.md` for results and the unresolved live/local data parity gate.
