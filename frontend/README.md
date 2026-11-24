# TRPIN frontend

React frontend yang sudah ada, dipisahkan dari backend tanpa perubahan source aplikasi.

## Run (dari root repository)

```powershell
cd frontend
npm ci
npm start
```

Buka http://localhost:3000. Production build: `npm run build` dari folder ini.

## Struktur

- `src/pages/`: halaman berdasarkan route.
- `src/components/`: komponen UI bersama.
- `src/layouts/`: shell aplikasi.
- `src/services/`: adapter tempat, wilayah, dan routing.
- `src/data/`: mock data dan logic prototype lama.
- `src/assets/`: aset import aplikasi.
- `public/`: HTML shell dan aset publik.
- `tailwind.config.js`: konfigurasi tema dan source scanning.

Semua relative imports dan public asset URLs tetap sama. Data UI masih berasal dari
prototype lama; pemindahan folder ini tidak menghubungkan frontend ke FastAPI.
File environment frontend, bila diperlukan, ditempatkan di `frontend/.env.local`.
