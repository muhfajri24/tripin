// ─── Places & Local Business Search Service ──────────────────────────────────
// Supports:
// 1. Google Places API (New) via process.env.REACT_APP_GOOGLE_PLACES_KEY
// 2. OpenStreetMap / Nominatim (Public Free API)
// 3. Robust Nationwide Curated Indonesia Dataset (offline/fallback)

import { mockLocalBusinesses, mockDestinations } from '../data/mockData';

const GOOGLE_PLACES_KEY = process.env.REACT_APP_GOOGLE_PLACES_KEY || '';

/**
 * Search places across Indonesia using Google Places API (New)
 * Fallback to Nominatim / Internal Nationwide Catalog if API key is not configured.
 */
export async function searchPlacesAcrossIndonesia({
  query = '',
  category = 'all',
  region = 'all',
  location = null,
}) {
  const cleanQuery = query.trim();

  // 1. Try Google Places API if client has provided an API key
  if (GOOGLE_PLACES_KEY && cleanQuery) {
    try {
      const endpoint = 'https://places.googleapis.com/v1/places:searchText';
      const body = {
        textQuery: `${cleanQuery} Indonesia`,
        languageCode: 'id',
        maxResultCount: 15,
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_PLACES_KEY,
          'X-Goog-FieldMask':
            'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.regularOpeningHours',
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.places && data.places.length > 0) {
          return data.places.map((p) => ({
            id: `gplace-${p.id}`,
            name: p.displayName?.text || cleanQuery,
            city: p.formattedAddress || 'Indonesia',
            category: 'Heritage',
            image:
              'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
            rating: p.rating || 4.5,
            reviews: p.userRatingCount || 100,
            priceLabel: p.priceLevel ? `Level ${p.priceLevel}` : 'Variatif',
            description: p.formattedAddress,
            tags: ['Google Places', 'Indonesia'],
            isUMKM: false,
            isHiddenGem: false,
            openHour: p.regularOpeningHours?.weekdayDescriptions?.[0] || '08:00 - 17:00',
            lat: p.location?.latitude || -6.2,
            lng: p.location?.longitude || 106.8,
          }));
        }
      }
    } catch (e) {
      console.warn('Google Places API request failed, switching to curated fallback:', e);
    }
  }

  // 2. OpenStreetMap / Nominatim Search (Alternative free tier)
  if (cleanQuery && cleanQuery.length > 3 && !GOOGLE_PLACES_KEY) {
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        cleanQuery
      )}&countrycodes=id&format=json&addressdetails=1&limit=5`;
      const res = await fetch(nominatimUrl, {
        headers: { 'Accept-Language': 'id,en' },
      });
      if (res.ok) {
        const osmResults = await res.json();
        if (osmResults && osmResults.length > 0) {
          // If we found live OSM results, we can enrich our list
          const mappedOsm = osmResults.map((item) => ({
            id: `osm-${item.place_id}`,
            name: item.display_name.split(',')[0],
            city: item.address?.city || item.address?.county || item.address?.state || 'Indonesia',
            category: 'Heritage',
            image:
              'https://images.unsplash.com/photo-1584810359583-96fc3448beaa?w=600&q=80',
            rating: 4.6,
            reviews: 320,
            priceLabel: 'Tiket Masuk',
            description: item.display_name,
            tags: [item.type || 'Pariwisata', 'OSM'],
            isUMKM: false,
            isHiddenGem: true,
            openHour: '08:00 - 17:00',
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          }));

          // Merge with curated data to ensure rich UMKM cards are always available
          return mergeWithCuratedCatalog(mappedOsm, cleanQuery, category, region);
        }
      }
    } catch (err) {
      // Graceful fallback to nationwide curated catalog
    }
  }

  // 3. High-Quality Curated Nationwide Indonesian Catalog Fallback
  return filterCuratedCatalog(cleanQuery, category, region);
}

function mergeWithCuratedCatalog(liveResults, query, category, region) {
  const curated = filterCuratedCatalog(query, category, region);
  const seenNames = new Set(liveResults.map((r) => r.name.toLowerCase()));
  const filteredCurated = curated.filter(
    (c) => !seenNames.has(c.name.toLowerCase())
  );
  return [...liveResults, ...filteredCurated];
}

function filterCuratedCatalog(query, category, region) {
  const q = (query || '').toLowerCase().trim();

  const allItems = [
    ...mockLocalBusinesses.map((b) => ({
      ...b,
      id: b.id,
      typeLabel: b.type,
      priceLabel: b.priceRange,
      openHour: `${b.openHour} - ${b.closeHour}`,
    })),
    ...mockDestinations.map((d) => ({
      ...d,
      id: `dest-${d.id}`,
      typeLabel: d.category,
      priceLabel: d.ticketPrice > 0 ? `Rp${d.ticketPrice.toLocaleString('id-ID')}` : 'Gratis',
      openHour: `${d.openHour} - ${d.closeHour}`,
    })),
  ];

  return allItems.filter((item) => {
    // Search query matching: name, city, province, region, description, or tags
    const matchQuery =
      !q ||
      item.name.toLowerCase().includes(q) ||
      (item.city && item.city.toLowerCase().includes(q)) ||
      (item.province && item.province.toLowerCase().includes(q)) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      item.tags.some((t) => t.toLowerCase().includes(q));

    if (!matchQuery) return false;

    // Region matching (sumatra, jawa, bali-nusra, kalimantan, sulawesi, maluku-papua)
    if (region && region !== 'all') {
      if (item.region && item.region !== region) return false;
    }

    // Category matching
    if (category && category !== 'all') {
      if (category === 'umkm') return item.isUMKM;
      if (category === 'hidden') return item.isHiddenGem;
      if (category === 'culinary') return item.category === 'Culinary';
      if (category === 'craft') return item.category === 'Craft';
      if (category === 'heritage') return item.category === 'Heritage';
      if (category === 'nature') return item.category === 'Nature';
    }

    return true;
  });
}

