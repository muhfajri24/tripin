// ─── Indonesian Administrative Region Service ────────────────────────────────
// Source: emsifa/api-wilayah-indonesia (Open Data Kemendagri / BPS)
// CDN Endpoint: https://emsifa.github.io/api-wilayah-indonesia/
// Features: Full 38 Provinces + 514 Regencies/Cities across all Indonesia

export const INDONESIA_REGIONS = [
  { id: 'sumatra', name: 'Sumatra', provinces: ['Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Kepulauan Riau', 'Jambi', 'Bengkulu', 'Sumatera Selatan', 'Kepulauan Bangka Belitung', 'Lampung'] },
  { id: 'jawa', name: 'Jawa', provinces: ['DKI Jakarta', 'Jawa Barat', 'Banten', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur'] },
  { id: 'bali-nusra', name: 'Bali & Nusa Tenggara', provinces: ['Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur'] },
  { id: 'kalimantan', name: 'Kalimantan', provinces: ['Kalimantan Barat', 'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara'] },
  { id: 'sulawesi', name: 'Sulawesi', provinces: ['Sulawesi Utara', 'Gorontalo', 'Sulawesi Tengah', 'Sulawesi Barat', 'Sulawesi Selatan', 'Sulawesi Tenggara'] },
  { id: 'maluku-papua', name: 'Maluku & Papua', provinces: ['Maluku', 'Maluku Utara', 'Papua', 'Papua Barat', 'Papua Selatan', 'Papua Tengah', 'Papua Pegunungan', 'Papua Barat Daya'] },
];

// Offline pre-cached 38 Provinces of Indonesia for instant zero-latency loading
export const PROVINCES_DATA = [
  { id: '11', name: 'Aceh', region: 'sumatra' },
  { id: '12', name: 'Sumatera Utara', region: 'sumatra' },
  { id: '13', name: 'Sumatera Barat', region: 'sumatra' },
  { id: '14', name: 'Riau', region: 'sumatra' },
  { id: '15', name: 'Jambi', region: 'sumatra' },
  { id: '16', name: 'Sumatera Selatan', region: 'sumatra' },
  { id: '17', name: 'Bengkulu', region: 'sumatra' },
  { id: '18', name: 'Lampung', region: 'sumatra' },
  { id: '19', name: 'Kepulauan Bangka Belitung', region: 'sumatra' },
  { id: '21', name: 'Kepulauan Riau', region: 'sumatra' },
  { id: '31', name: 'DKI Jakarta', region: 'jawa' },
  { id: '32', name: 'Jawa Barat', region: 'jawa' },
  { id: '33', name: 'Jawa Tengah', region: 'jawa' },
  { id: '34', name: 'DI Yogyakarta', region: 'jawa' },
  { id: '35', name: 'Jawa Timur', region: 'jawa' },
  { id: '36', name: 'Banten', region: 'jawa' },
  { id: '51', name: 'Bali', region: 'bali-nusra' },
  { id: '52', name: 'Nusa Tenggara Barat', region: 'bali-nusra' },
  { id: '53', name: 'Nusa Tenggara Timur', region: 'bali-nusra' },
  { id: '61', name: 'Kalimantan Barat', region: 'kalimantan' },
  { id: '62', name: 'Kalimantan Tengah', region: 'kalimantan' },
  { id: '63', name: 'Kalimantan Selatan', region: 'kalimantan' },
  { id: '64', name: 'Kalimantan Timur', region: 'kalimantan' },
  { id: '65', name: 'Kalimantan Utara', region: 'kalimantan' },
  { id: '71', name: 'Sulawesi Utara', region: 'sulawesi' },
  { id: '72', name: 'Sulawesi Tengah', region: 'sulawesi' },
  { id: '73', name: 'Sulawesi Selatan', region: 'sulawesi' },
  { id: '74', name: 'Sulawesi Tenggara', region: 'sulawesi' },
  { id: '75', name: 'Gorontalo', region: 'sulawesi' },
  { id: '76', name: 'Sulawesi Barat', region: 'sulawesi' },
  { id: '81', name: 'Maluku', region: 'maluku-papua' },
  { id: '82', name: 'Maluku Utara', region: 'maluku-papua' },
  { id: '91', name: 'Papua Barat', region: 'maluku-papua' },
  { id: '92', name: 'Papua', region: 'maluku-papua' },
  { id: '93', name: 'Papua Selatan', region: 'maluku-papua' },
  { id: '94', name: 'Papua Tengah', region: 'maluku-papua' },
  { id: '95', name: 'Papua Pegunungan', region: 'maluku-papua' },
  { id: '96', name: 'Papua Barat Daya', region: 'maluku-papua' },
];

// Major tourism and cultural hubs across all Indonesian archipelago
export const POPULAR_DESTINATIONS_ID = [
  // Sumatra
  { name: 'Danau Toba & Samosir', province: 'Sumatera Utara', region: 'sumatra', lat: 2.6845, lng: 98.7842 },
  { name: 'Bukittinggi & Ngarai Sianok', province: 'Sumatera Barat', region: 'sumatra', lat: -0.3055, lng: 100.3692 },
  { name: 'Banda Aceh & Sabang', province: 'Aceh', region: 'sumatra', lat: 5.5483, lng: 95.3238 },
  { name: 'Belitung & Tanjung Tinggi', province: 'Kepulauan Bangka Belitung', region: 'sumatra', lat: -2.7411, lng: 107.6326 },
  // Jawa
  { name: 'Bandung & Lembang', province: 'Jawa Barat', region: 'jawa', lat: -6.9175, lng: 107.6191 },
  { name: 'Yogyakarta & Borobudur', province: 'DI Yogyakarta', region: 'jawa', lat: -7.7956, lng: 110.3695 },
  { name: 'Bromo, Semeru & Malang', province: 'Jawa Timur', region: 'jawa', lat: -7.9425, lng: 112.9530 },
  { name: 'Banyuwangi & Kawah Ijen', province: 'Jawa Timur', region: 'jawa', lat: -8.2192, lng: 114.3691 },
  { name: 'Kepulauan Seribu', province: 'DKI Jakarta', region: 'jawa', lat: -5.6122, lng: 106.5614 },
  // Bali & Nusa Tenggara
  { name: 'Bali (Ubud, Kuta & Kintamani)', province: 'Bali', region: 'bali-nusra', lat: -8.4095, lng: 115.1889 },
  { name: 'Labuan Bajo & Taman Nasional Komodo', province: 'Nusa Tenggara Timur', region: 'bali-nusra', lat: -8.4964, lng: 119.8877 },
  { name: 'Lombok & Gili Trawangan', province: 'Nusa Tenggara Barat', region: 'bali-nusra', lat: -8.5833, lng: 116.1167 },
  { name: 'Sumba (Kodi & Waikabubak)', province: 'Nusa Tenggara Timur', region: 'bali-nusra', lat: -9.6540, lng: 119.4120 },
  // Kalimantan
  { name: 'Kepulauan Derawan & Maratua', province: 'Kalimantan Timur', region: 'kalimantan', lat: 2.2472, lng: 118.2435 },
  { name: 'Tanjung Puting (Orangutan Sanctuary)', province: 'Kalimantan Tengah', region: 'kalimantan', lat: -2.9902, lng: 111.9566 },
  { name: 'Pasar Terapung Banjarmasin', province: 'Kalimantan Selatan', region: 'kalimantan', lat: -3.3167, lng: 114.5900 },
  // Sulawesi
  { name: 'Tana Toraja (Rantepao & Makale)', province: 'Sulawesi Selatan', region: 'sulawesi', lat: -3.0033, lng: 119.8667 },
  { name: 'Taman Nasional Bunaken & Manado', province: 'Sulawesi Utara', region: 'sulawesi', lat: 1.6214, lng: 124.7608 },
  { name: 'Kepulauan Wakatobi', province: 'Sulawesi Tenggara', region: 'sulawesi', lat: -5.3197, lng: 123.5972 },
  { name: 'Danau Matano & Sorowako', province: 'Sulawesi Selatan', region: 'sulawesi', lat: -2.5458, lng: 121.3708 },
  // Maluku & Papua
  { name: 'Kepulauan Banda Neira', province: 'Maluku', region: 'maluku-papua', lat: -4.5262, lng: 129.9042 },
  { name: 'Raja Ampat (Misool & Waigeo)', province: 'Papua Barat Daya', region: 'maluku-papua', lat: -0.2333, lng: 130.5167 },
  { name: 'Lembah Baliem, Wamena', province: 'Papua Pegunungan', region: 'maluku-papua', lat: -4.0984, lng: 138.9442 },
  { name: 'Taman Nasional Teluk Cenderawasih', province: 'Papua Barat', region: 'maluku-papua', lat: -2.8500, lng: 134.5000 },
];

/**
 * Fetch all Indonesian provinces from public open API with immediate fallback
 */
export async function fetchProvinces() {
  try {
    const res = await fetch('https://emsifa.github.io/api-wilayah-indonesia/api/provinces.json');
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    return data.map((p) => {
      const matched = PROVINCES_DATA.find((cp) => cp.id === p.id);
      return {
        id: p.id,
        name: p.name,
        region: matched ? matched.region : 'indonesia',
      };
    });
  } catch (err) {
    // Graceful offline fallback
    return PROVINCES_DATA;
  }
}

/**
 * Fetch regencies/cities for a province from public open API
 */
export async function fetchRegencies(provinceId) {
  try {
    const res = await fetch(`https://emsifa.github.io/api-wilayah-indonesia/api/regencies/${provinceId}.json`);
    if (!res.ok) throw new Error('Network error');
    return await res.json();
  } catch (err) {
    return [];
  }
}

/**
 * Filter popular Indonesian tourist hubs by region or search term
 */
export function searchIndonesianHubs(query = '', regionFilter = 'all') {
  const q = query.trim().toLowerCase();
  return POPULAR_DESTINATIONS_ID.filter((dest) => {
    const matchQuery =
      !q ||
      dest.name.toLowerCase().includes(q) ||
      dest.province.toLowerCase().includes(q);
    const matchRegion = regionFilter === 'all' || dest.region === regionFilter;
    return matchQuery && matchRegion;
  });
}

// ─── Destination Extractor & Coordinate Resolver ─────────────────────────────

export const INDONESIA_CITY_MAP = [
  { key: 'bali', name: 'Bali', province: 'Bali', region: 'bali-nusra', lat: -8.4095, lng: 115.1889 },
  { key: 'ubud', name: 'Bali (Ubud)', province: 'Bali', region: 'bali-nusra', lat: -8.5069, lng: 115.2625 },
  { key: 'kuta', name: 'Bali (Kuta)', province: 'Bali', region: 'bali-nusra', lat: -8.7233, lng: 115.1723 },
  { key: 'seminyak', name: 'Bali (Seminyak)', province: 'Bali', region: 'bali-nusra', lat: -8.6892, lng: 115.1583 },
  { key: 'denpasar', name: 'Bali (Denpasar)', province: 'Bali', region: 'bali-nusra', lat: -8.6705, lng: 115.2126 },
  { key: 'yogyakarta', name: 'Yogyakarta', province: 'DI Yogyakarta', region: 'jawa', lat: -7.7956, lng: 110.3695 },
  { key: 'jogja', name: 'Yogyakarta', province: 'DI Yogyakarta', region: 'jawa', lat: -7.7956, lng: 110.3695 },
  { key: 'danau toba', name: 'Danau Toba', province: 'Sumatera Utara', region: 'sumatra', lat: 2.6845, lng: 98.7842 },
  { key: 'toba', name: 'Danau Toba', province: 'Sumatera Utara', region: 'sumatra', lat: 2.6845, lng: 98.7842 },
  { key: 'samosir', name: 'Danau Toba (Samosir)', province: 'Sumatera Utara', region: 'sumatra', lat: 2.6285, lng: 98.7124 },
  { key: 'bukittinggi', name: 'Bukittinggi', province: 'Sumatera Barat', region: 'sumatra', lat: -0.3055, lng: 100.3692 },
  { key: 'padang', name: 'Padang', province: 'Sumatera Barat', region: 'sumatra', lat: -0.9471, lng: 100.4172 },
  { key: 'bandung', name: 'Bandung', province: 'Jawa Barat', region: 'jawa', lat: -6.9175, lng: 107.6191 },
  { key: 'lembang', name: 'Bandung (Lembang)', province: 'Jawa Barat', region: 'jawa', lat: -6.8152, lng: 107.6172 },
  { key: 'jakarta', name: 'DKI Jakarta', province: 'DKI Jakarta', region: 'jawa', lat: -6.2088, lng: 106.8456 },
  { key: 'surabaya', name: 'Surabaya', province: 'Jawa Timur', region: 'jawa', lat: -7.2575, lng: 112.7521 },
  { key: 'malang', name: 'Malang & Bromo', province: 'Jawa Timur', region: 'jawa', lat: -7.9666, lng: 112.6326 },
  { key: 'bromo', name: 'Gunung Bromo', province: 'Jawa Timur', region: 'jawa', lat: -7.9425, lng: 112.9530 },
  { key: 'banyuwangi', name: 'Banyuwangi & Ijen', province: 'Jawa Timur', region: 'jawa', lat: -8.2192, lng: 114.3691 },
  { key: 'semarang', name: 'Semarang', province: 'Jawa Tengah', region: 'jawa', lat: -6.9667, lng: 110.4167 },
  { key: 'solo', name: 'Solo (Surakarta)', province: 'Jawa Tengah', region: 'jawa', lat: -7.5755, lng: 110.8243 },
  { key: 'labuan bajo', name: 'Labuan Bajo', province: 'Nusa Tenggara Timur', region: 'bali-nusra', lat: -8.4964, lng: 119.8877 },
  { key: 'komodo', name: 'Labuan Bajo (Komodo)', province: 'Nusa Tenggara Timur', region: 'bali-nusra', lat: -8.4964, lng: 119.8877 },
  { key: 'lombok', name: 'Lombok & Gili', province: 'Nusa Tenggara Barat', region: 'bali-nusra', lat: -8.5833, lng: 116.1167 },
  { key: 'sumba', name: 'Pulau Sumba', province: 'Nusa Tenggara Timur', region: 'bali-nusra', lat: -9.6540, lng: 119.4120 },
  { key: 'derawan', name: 'Kepulauan Derawan', province: 'Kalimantan Timur', region: 'kalimantan', lat: 2.2472, lng: 118.2435 },
  { key: 'tanjung puting', name: 'Tanjung Puting', province: 'Kalimantan Tengah', region: 'kalimantan', lat: -2.9902, lng: 111.9566 },
  { key: 'banjarmasin', name: 'Banjarmasin', province: 'Kalimantan Selatan', region: 'kalimantan', lat: -3.3167, lng: 114.5900 },
  { key: 'tana toraja', name: 'Tana Toraja', province: 'Sulawesi Selatan', region: 'sulawesi', lat: -3.0033, lng: 119.8667 },
  { key: 'toraja', name: 'Tana Toraja', province: 'Sulawesi Selatan', region: 'sulawesi', lat: -3.0033, lng: 119.8667 },
  { key: 'makassar', name: 'Makassar', province: 'Sulawesi Selatan', region: 'sulawesi', lat: -5.1477, lng: 119.4327 },
  { key: 'bulukumba', name: 'Bulukumba (Pinisi)', province: 'Sulawesi Selatan', region: 'sulawesi', lat: -5.5891, lng: 120.4431 },
  { key: 'manado', name: 'Manado & Bunaken', province: 'Sulawesi Utara', region: 'sulawesi', lat: 1.4748, lng: 124.8421 },
  { key: 'bunaken', name: 'Taman Nasional Bunaken', province: 'Sulawesi Utara', region: 'sulawesi', lat: 1.6214, lng: 124.7608 },
  { key: 'wakatobi', name: 'Kepulauan Wakatobi', province: 'Sulawesi Tenggara', region: 'sulawesi', lat: -5.3197, lng: 123.5972 },
  { key: 'banda neira', name: 'Banda Neira', province: 'Maluku', region: 'maluku-papua', lat: -4.5262, lng: 129.9042 },
  { key: 'ambon', name: 'Kota Ambon', province: 'Maluku', region: 'maluku-papua', lat: -3.6554, lng: 128.1908 },
  { key: 'raja ampat', name: 'Raja Ampat', province: 'Papua Barat Daya', region: 'maluku-papua', lat: -0.2333, lng: 130.5167 },
  { key: 'wamena', name: 'Lembah Baliem, Wamena', province: 'Papua Pegunungan', region: 'maluku-papua', lat: -4.0984, lng: 138.9442 },
  { key: 'jayapura', name: 'Kota Jayapura', province: 'Papua', region: 'maluku-papua', lat: -2.5337, lng: 140.7181 },
];

/**
 * Intelligent extractor that parses destination name from natural language query
 */
export function extractDestinationFromQuery(text) {
  if (!text || typeof text !== 'string') return null;
  const q = text.toLowerCase();

  // Match longest known city/destination keys first
  const sorted = [...INDONESIA_CITY_MAP].sort((a, b) => b.key.length - a.key.length);
  for (const item of sorted) {
    if (q.includes(item.key)) {
      return item;
    }
  }

  // Check 38 official provinces
  for (const prov of PROVINCES_DATA) {
    if (q.includes(prov.name.toLowerCase())) {
      return {
        key: prov.name.toLowerCase(),
        name: prov.name,
        province: prov.name,
        region: prov.region,
        lat: -2.5,
        lng: 118.0,
      };
    }
  }

  return null;
}

/**
 * Resolve center coordinates for any Indonesian destination name
 */
export function resolveDestinationCoords(destName) {
  if (!destName) return { lat: -8.4095, lng: 115.1889 };
  const q = destName.toLowerCase();
  const matched = INDONESIA_CITY_MAP.find((c) => q.includes(c.key) || c.name.toLowerCase().includes(q));
  if (matched) return { lat: matched.lat, lng: matched.lng };
  return { lat: -8.4095, lng: 115.1889 }; // Default to Bali / Central Indonesia
}

