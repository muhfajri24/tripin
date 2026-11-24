import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Compass, Store, Sparkles, MapPin, Star, Plus, Bookmark,
  BookmarkCheck, Search, X, Clock, Globe
} from 'lucide-react';
import {
  mockLocalBusinesses, mockDestinations, formatCurrency, getCategoryColor
} from '../data/mockData';

const REGION_OPTIONS = [
  { id: 'all', label: 'Semua Wilayah' },
  { id: 'sumatra', label: 'Sumatra' },
  { id: 'jawa', label: 'Jawa' },
  { id: 'bali-nusra', label: 'Bali & Nusra' },
  { id: 'kalimantan', label: 'Kalimantan' },
  { id: 'sulawesi', label: 'Sulawesi' },
  { id: 'maluku-papua', label: 'Maluku & Papua' },
];

const CATEGORY_OPTIONS = [
  { id: 'all', label: 'Semua' },
  { id: 'umkm', label: '🌿 UMKM Mitra' },
  { id: 'heritage', label: '🏛️ Budaya & Adat' },
  { id: 'culinary', label: '🍜 Kuliner' },
  { id: 'craft', label: '🎨 Kerajinan' },
  { id: 'nature', label: '🏖️ Alam' },
];

function LocalDiscoveryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';

  const [search, setSearch] = useState(queryParam);
  const [activeRegion, setActiveRegion] = useState('all');
  const [activeCategory, setActiveCategory] = useState('all');

  // Bookmark IDs
  const [savedIds, setSavedIds] = useState([
    ...mockDestinations.filter((d) => d.saved).map((d) => `dest-${d.id}`),
    'lb-sum-1',
    'lb-sul-1',
    'lb-mal-1',
  ]);

  useEffect(() => {
    setSearch(queryParam);
  }, [queryParam]);

  const handleSearchChange = (val) => {
    setSearch(val);
    if (val.trim()) {
      setSearchParams({ q: val.trim() });
    } else {
      setSearchParams({});
    }
  };

  // Combine real local businesses and validated destinations across Indonesia
  const allPlaces = useMemo(() => {
    return [
      ...mockLocalBusinesses.map((b) => ({
        id: b.id,
        name: b.name,
        city: b.city,
        province: b.province || '',
        region: b.region || 'jawa',
        category: b.category,
        image: b.image,
        rating: b.rating,
        reviews: b.reviews,
        priceLabel: b.priceRange,
        description: b.description,
        tags: b.tags,
        isUMKM: true,
        openHour: `${b.openHour} - ${b.closeHour}`,
      })),
      ...mockDestinations.map((d) => ({
        id: `dest-${d.id}`,
        name: d.name,
        city: d.city,
        province: d.province || '',
        region: d.region || 'jawa',
        category: d.category,
        image: d.image,
        rating: d.rating,
        reviews: d.reviews,
        priceLabel: d.ticketPrice > 0 ? formatCurrency(d.ticketPrice) : 'Gratis',
        description: d.description,
        tags: d.tags,
        isUMKM: false,
        openHour: `${d.openHour} - ${d.closeHour}`,
      })),
    ];
  }, []);

  const filteredPlaces = useMemo(() => {
    return allPlaces.filter((item) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        item.name.toLowerCase().includes(q) ||
        item.city.toLowerCase().includes(q) ||
        item.province.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q));

      if (!matchSearch) return false;
      if (activeRegion !== 'all' && item.region !== activeRegion) return false;

      if (activeCategory === 'all') return true;
      if (activeCategory === 'umkm') return item.isUMKM;
      if (activeCategory === 'heritage') return item.category === 'Heritage';
      if (activeCategory === 'culinary') return item.category === 'Culinary';
      if (activeCategory === 'craft') return item.category === 'Craft';
      if (activeCategory === 'nature') return item.category === 'Nature' || item.tags.some(t => t.includes('Alam'));

      return true;
    });
  }, [allPlaces, search, activeRegion, activeCategory]);

  const toggleSave = (id) => {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handlePlanWithPlace = (placeName) => {
    navigate('/create', { state: { destination: placeName } });
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-6xl mx-auto">

      {/* ── 1. Header & Search Control ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-charcoal tracking-tight">
            Local Discovery
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-lighter mt-0.5">
            Eksplorasi destinasi otentik, adat budaya, dan UMKM lokal di 38 provinsi Indonesia.
          </p>
        </div>

        {/* Global Search Input */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-gray-200 focus-within:border-teal shadow-sm w-full sm:w-72">
          <Search size={16} className="text-charcoal-lighter flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Cari destinasi atau UMKM..."
            className="w-full text-xs text-charcoal placeholder:text-gray-400 outline-none bg-transparent"
          />
          {search && (
            <button onClick={() => handleSearchChange('')} className="text-gray-400 hover:text-charcoal">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── 2. Filters Bar (Region & Category in One Clean Area) ── */}
      <div className="space-y-2.5">
        {/* Region Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide text-xs">
          <span className="text-charcoal-lighter font-bold flex-shrink-0 mr-1 flex items-center gap-1">
            <Globe size={13} className="text-teal" /> Wilayah:
          </span>
          {REGION_OPTIONS.map((r) => (
            <button
              key={r.id}
              onClick={() => setActiveRegion(r.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                activeRegion === r.id
                  ? 'bg-teal text-white shadow-sm'
                  : 'bg-white text-charcoal-lighter border border-gray-200 hover:text-charcoal'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide text-xs">
          <span className="text-charcoal-lighter font-bold flex-shrink-0 mr-1">
            Kategori:
          </span>
          {CATEGORY_OPTIONS.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-charcoal text-white shadow-sm'
                  : 'bg-white text-charcoal-lighter border border-gray-200 hover:text-charcoal'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 3. Results Count & Clear Filter ── */}
      <div className="flex items-center justify-between text-xs text-charcoal-lighter">
        <span>
          Menampilkan <strong className="text-charcoal font-bold">{filteredPlaces.length}</strong> tempat
          {search && <span> untuk <strong className="text-teal">"{search}"</strong></span>}
        </span>

        {(search || activeRegion !== 'all' || activeCategory !== 'all') && (
          <button
            onClick={() => {
              setSearch('');
              handleSearchChange('');
              setActiveRegion('all');
              setActiveCategory('all');
            }}
            className="text-coral font-bold hover:underline"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* ── 4. Clean Cards Grid ── */}
      {filteredPlaces.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-6">
          <p className="text-3xl mb-2">🔍</p>
          <h4 className="font-bold text-charcoal text-sm">Tidak ada tempat yang cocok</h4>
          <p className="text-xs text-charcoal-lighter mt-1">Coba kata kunci lain atau reset filter wilayah.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlaces.map((place) => {
            const isSaved = savedIds.includes(place.id);

            return (
              <div
                key={place.id}
                className="bg-white rounded-3xl overflow-hidden shadow-soft border border-gray-100 flex flex-col justify-between group hover:shadow-card hover:-translate-y-1 transition-all"
              >
                <div>
                  {/* Photo & Simple Badges */}
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={place.image}
                      alt={place.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                    {/* Top Status */}
                    <div className="absolute top-3 left-3 flex gap-1">
                      {place.isUMKM && (
                        <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow">
                          UMKM Mitra
                        </span>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${getCategoryColor(place.category)}`}>
                        {place.category}
                      </span>
                    </div>

                    {/* Bookmark Toggle */}
                    <button
                      onClick={() => toggleSave(place.id)}
                      className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                      title={isSaved ? 'Hapus dari Wishlist' : 'Simpan'}
                    >
                      {isSaved ? (
                        <BookmarkCheck size={14} className="text-coral fill-coral" />
                      ) : (
                        <Bookmark size={14} className="text-charcoal" />
                      )}
                    </button>

                    {/* Rating & Price */}
                    <div className="absolute bottom-2.5 left-3 flex items-center gap-1 text-white text-xs font-bold">
                      <Star size={11} className="text-yellow-trip fill-yellow-trip" />
                      <span>{place.rating}</span>
                      <span className="text-white/60 font-normal">({place.reviews})</span>
                    </div>

                    <div className="absolute bottom-2.5 right-3 text-white text-xs font-bold">
                      {place.priceLabel}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4">
                    <h4 className="font-bold text-charcoal text-sm leading-snug group-hover:text-teal transition-colors">
                      {place.name}
                    </h4>

                    <div className="flex items-center gap-1 text-xs text-charcoal-lighter mt-1">
                      <MapPin size={11} className="text-coral flex-shrink-0" />
                      <span className="truncate">{place.city}</span>
                    </div>

                    <p className="text-xs text-charcoal-lighter mt-2 line-clamp-2 leading-relaxed">
                      {place.description}
                    </p>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 pt-0">
                  <div className="pt-2.5 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-[11px] text-charcoal-lighter flex items-center gap-1">
                      <Clock size={11} className="text-teal" /> {place.openHour}
                    </span>

                    <button
                      onClick={() => handlePlanWithPlace(place.name)}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl bg-teal/10 hover:bg-teal hover:text-white text-teal transition-colors flex items-center gap-1"
                    >
                      <Plus size={12} />
                      <span>Pilih ke Trip</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

export default LocalDiscoveryPage;
