import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Compass, Store, Sparkles, MapPin, Star, Plus, Bookmark,
  BookmarkCheck, Filter, ArrowRight, Heart, Clock, Globe,
  Search, X, ExternalLink, ChevronRight, Award, Info
} from 'lucide-react';
import {
  mockLocalBusinesses, mockDestinations, formatCurrency, getCategoryColor
} from '../data/mockData';
import { INDONESIA_REGIONS } from '../services/regionService';

// 6 Wilayah Budaya Utama Indonesia dengan Visual Ikonik & Ilustrasi Elemen Adat
const CULTURAL_REGIONS = [
  {
    id: 'all',
    name: 'Seluruh Nusantara',
    subtitle: '38 Provinsi dari Sabang sampai Merauke',
    emblem: '🇮🇩',
    accentColor: '#176B67',
    coverImage: '/images/hero/hero-bromo.jpg',
    cultureSnippet: 'Jelajahi keanekaragaman suku bangsa, warisan kain tradisional, ratusan kuliner rempah, dan arsitektur adat kepulauan Indonesia.',
    culturalIcons: ['🏛️ Rumah Adat', '🧵 Kain Tenun & Batik', '🍲 Kuliner Rempah', '🎭 Seni Tari'],
  },
  {
    id: 'sumatra',
    name: 'Sumatra',
    subtitle: '10 Provinsi · Adat Minang, Batak, Melayu & Aceh',
    emblem: '🏔️',
    accentColor: '#059669',
    coverImage: '/images/hero/hero-malioboro.jpg',
    cultureSnippet: 'Pusat tenun ulos Danau Toba, rumah adat gadang bergonjong megah di Bukittinggi, rendang pusaka UNESCO, kopi Gayo & rempah andaliman.',
    culturalIcons: ['Rumah Gadang', 'Tari Saman', 'Tenun Ulos', 'Rendang Minang'],
  },
  {
    id: 'jawa',
    name: 'Jawa',
    subtitle: '6 Provinsi · Keraton, Candi & Sentra Kriya',
    emblem: '🏛️',
    accentColor: '#D97706',
    coverImage: '/images/hero/hero-bromo.jpg',
    cultureSnippet: 'Kemegahan Borobudur & Prambanan, sanggar batik tulis keraton, alunan gamelan & Saung Angklung Udjo, serta kuliner legendaris turun-temurun.',
    culturalIcons: ['Candi Borobudur', 'Batik Tulis', 'Angklung Sunda', 'Wayang Kulit'],
  },
  {
    id: 'bali-nusra',
    name: 'Bali & Nusa Tenggara',
    subtitle: '3 Provinsi · Pura Luhur, Komodo & Tenun Ikat',
    emblem: '🌺',
    accentColor: '#FF6B5E',
    coverImage: '/images/hero/hero-bali.jpg',
    cultureSnippet: 'Harmoni sakral pura di tebing laut, tari kecak senja, tenun ikat Sumba yang mendunia, kopi Bajawa Flores, dan keajaiban pulau Komodo.',
    culturalIcons: ['Pura Uluwatu', 'Tari Kecak', 'Tenun Ikat Sumba', 'Taman Komodo'],
  },
  {
    id: 'kalimantan',
    name: 'Kalimantan',
    subtitle: '5 Provinsi · Paru-paru Dunia & Budaya Dayak',
    emblem: '🌿',
    accentColor: '#10B981',
    coverImage: '/images/hero/hero-rajaampat.jpg',
    cultureSnippet: 'Pasar terapung sungai Barito, hutan hujan konservasi orangutan Tanjung Puting, rumah panjang Betang suku Dayak, dan karang Derawan.',
    culturalIcons: ['Pasar Terapung', 'Rumah Betang Dayak', 'Orangutan Sanctuary', 'Pulau Derawan'],
  },
  {
    id: 'sulawesi',
    name: 'Sulawesi',
    subtitle: '6 Provinsi · Arsitektur Tongkonan & Pelaut Pinisi',
    emblem: '⛵',
    accentColor: '#7C3AED',
    coverImage: '/images/hero/hero-bandaneira.jpg',
    cultureSnippet: 'Kemegahan rumah adat beratap melengkung Tongkonan Toraja, mahakarya galangan kapal Pinisi Bulukumba, terumbu karang Bunaken & Wakatobi.',
    culturalIcons: ['Tongkonan Toraja', 'Kapal Pinisi', 'Taman Laut Bunaken', 'Kopi Toraja'],
  },
  {
    id: 'maluku-papua',
    name: 'Maluku & Papua',
    subtitle: '8 Provinsi · Kepulauan Rempah & Surga Karst Bahari',
    emblem: '🦜',
    accentColor: '#2563EB',
    coverImage: '/images/hero/hero-rajaampat.jpg',
    cultureSnippet: 'Pusat rempah dunia Banda Neira dengan Benteng Belgica, keajaiban pulau karst Raja Ampat, anyaman tas Noken warisan UNESCO, dan Lembah Baliem.',
    culturalIcons: ['Benteng Belgica', 'Raja Ampat', 'Kerajinan Noken', 'Lembah Baliem'],
  },
];

const FILTER_CATEGORIES = [
  { id: 'all', label: 'Semua Kategori', icon: '✨' },
  { id: 'umkm', label: '🌿 UMKM Mitra Lokal', isHighlight: true, icon: '🏪' },
  { id: 'hidden', label: '💎 Hidden Gems', icon: '💎' },
  { id: 'heritage', label: '🏛️ Adat & Budaya', icon: '🏛️' },
  { id: 'culinary', label: '🍜 Kuliner Autentik', icon: '🍜' },
  { id: 'craft', label: '🎨 Kerajinan & Workshop', icon: '🧵' },
  { id: 'nature', label: '🏖️ Wisata Alam & Bahari', icon: '🌿' },
];

function LocalDiscoveryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';

  const [search, setSearch] = useState(queryParam);
  const [activeRegion, setActiveRegion] = useState('all');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showCulturalGuide, setShowCulturalGuide] = useState(false);

  // Saved bookmark IDs
  const [savedIds, setSavedIds] = useState([
    ...mockDestinations.filter((d) => d.saved).map((d) => `dest-${d.id}`),
    'lb-sum-1',
    'lb-sul-1',
    'lb-mal-1',
    'lb-1',
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

  const selectedRegionData = useMemo(() => {
    return CULTURAL_REGIONS.find((r) => r.id === activeRegion) || CULTURAL_REGIONS[0];
  }, [activeRegion]);

  // Combine real local businesses and validated destinations across Indonesia
  const allPlaces = useMemo(() => {
    return [
      ...mockLocalBusinesses.map((b) => ({
        id: b.id,
        name: b.name,
        city: `${b.area ? b.area + ', ' : ''}${b.city}`,
        province: b.province || '',
        region: b.region || 'jawa',
        category: b.category,
        typeLabel: b.type,
        image: b.image,
        rating: b.rating,
        reviews: b.reviews,
        priceLabel: b.priceRange,
        description: b.description,
        tags: b.tags,
        isUMKM: true,
        isHiddenGem: b.isHiddenGem,
        openHour: `${b.openHour} - ${b.closeHour}`,
      })),
      ...mockDestinations.map((d) => ({
        id: `dest-${d.id}`,
        name: d.name,
        city: d.city,
        province: d.province || '',
        region: d.region || 'jawa',
        category: d.category,
        typeLabel: d.category,
        image: d.image,
        rating: d.rating,
        reviews: d.reviews,
        priceLabel: d.ticketPrice > 0 ? formatCurrency(d.ticketPrice) : 'Gratis Tiket',
        description: d.description,
        tags: d.tags,
        isUMKM: false,
        isHiddenGem: d.isHiddenGem,
        openHour: `${d.openHour} - ${d.closeHour}`,
      })),
    ];
  }, []);

  const filteredPlaces = useMemo(() => {
    return allPlaces.filter((item) => {
      // 1. Search Query filter
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        item.name.toLowerCase().includes(q) ||
        item.city.toLowerCase().includes(q) ||
        item.province.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q));

      if (!matchSearch) return false;

      // 2. Region filter
      if (activeRegion !== 'all' && item.region !== activeRegion) {
        return false;
      }

      // 3. Category filter
      if (activeCategory === 'all') return true;
      if (activeCategory === 'umkm') return item.isUMKM;
      if (activeCategory === 'hidden') return item.isHiddenGem;
      if (activeCategory === 'culinary') return item.category === 'Culinary';
      if (activeCategory === 'craft') return item.category === 'Craft';
      if (activeCategory === 'heritage') return item.category === 'Heritage';
      if (activeCategory === 'nature') return item.category === 'Nature' || item.tags.some(t => t.includes('Alam') || t.includes('Bahari'));

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
    <div className="space-y-8 animate-fadeInUp pb-16">

      {/* ── 1. Top Immersive Cultural Hero ── */}
      <section
        className="relative rounded-3xl overflow-hidden shadow-card text-white transition-all duration-500"
        style={{
          background: 'linear-gradient(135deg, #0e2726 0%, #173b39 50%, #1e4a47 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Subtle Map / Heritage Pattern */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(255,200,87,0.3) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(255,107,94,0.3) 0%, transparent 40%)',
          }}
        />

        <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-yellow-trip bg-white/10 backdrop-blur-md border border-white/15">
              <Compass size={14} className="text-yellow-trip animate-spin-slow" />
              <span>Eksplorasi Budaya & Wisata Komunitas Nusantara (SDG 8)</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
              Local Discovery Nusantara
            </h1>

            <p className="text-white/80 text-xs sm:text-sm md:text-base leading-relaxed">
              Jelajahi keagungan budaya dan UMKM autentik di 38 provinsi Indonesia. Dari rumah adat Minang, sentra batik Jawa, tenun ikat Sumba, pelaut Pinisi Bulukumba, hingga rajutan noken Papua.
            </p>

            <div className="flex flex-wrap gap-2 pt-1 text-xs">
              <span className="bg-white/15 px-3 py-1 rounded-xl backdrop-blur-sm text-white font-medium">
                🏛️ Rumah Adat & Candi
              </span>
              <span className="bg-white/15 px-3 py-1 rounded-xl backdrop-blur-sm text-white font-medium">
                🧵 Tenun & Kriya Lokal
              </span>
              <span className="bg-white/15 px-3 py-1 rounded-xl backdrop-blur-sm text-white font-medium">
                🍲 Kuliner Pusaka Nusantara
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto">
            <button
              onClick={() => navigate('/create')}
              className="flex items-center justify-center gap-2 font-extrabold text-xs sm:text-sm px-6 py-3.5 rounded-2xl text-white transition-all hover:scale-105 active:scale-95 shadow-lg btn-press"
              style={{
                background: 'linear-gradient(135deg, #FF6B5E 0%, #E55A4E 100%)',
                boxShadow: '0 6px 20px rgba(255, 107, 94, 0.4)',
              }}
            >
              <Sparkles size={16} />
              <span>Susun Trip Berbasis Budaya</span>
            </button>
            <button
              onClick={() => setShowCulturalGuide(!showCulturalGuide)}
              className="flex items-center justify-center gap-1.5 font-bold text-xs px-5 py-3 rounded-2xl text-white transition-all hover:bg-white/20 backdrop-blur-md border border-white/20"
              style={{ background: 'rgba(255, 255, 255, 0.1)' }}
            >
              <Info size={14} />
              <span>{showCulturalGuide ? 'Tutup Sorotan Budaya' : 'Sorotan Khazanah Daerah'}</span>
            </button>
          </div>
        </div>

        {/* Expandable Cultural Highlights Guide */}
        {showCulturalGuide && (
          <div className="px-6 pb-6 pt-2 border-t border-white/15 bg-black/20 animate-fadeInUp">
            <h4 className="text-xs font-black uppercase tracking-widest text-yellow-trip mb-3">
              Khazanah Budaya & Karakteristik Wilayah Terpilih: {selectedRegionData.name}
            </h4>
            <p className="text-xs text-white/85 leading-relaxed mb-3">
              {selectedRegionData.cultureSnippet}
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              {selectedRegionData.culturalIcons.map((iconText, idx) => (
                <span
                  key={idx}
                  className="bg-white/15 text-white font-bold px-3 py-1 rounded-xl text-xs backdrop-blur-md border border-white/20"
                >
                  ✓ {iconText}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── 2. Interactive Island / Region Navigator ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-teal" />
            <h2 className="font-extrabold text-charcoal text-base sm:text-lg tracking-tight">
              Pilih Wilayah Kepulauan Indonesia
            </h2>
          </div>
          <span className="text-xs text-charcoal-lighter font-medium">
            Klik pulau untuk filter budaya & destinasi
          </span>
        </div>

        {/* Visual Island Cards Navigator */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
          {CULTURAL_REGIONS.map((region) => {
            const isSelected = activeRegion === region.id;
            return (
              <button
                key={region.id}
                onClick={() => setActiveRegion(region.id)}
                className="p-3 rounded-2xl text-left transition-all duration-300 relative group flex flex-col justify-between btn-press"
                style={{
                  background: isSelected ? '#176B67' : 'white',
                  color: isSelected ? 'white' : '#253238',
                  boxShadow: isSelected
                    ? '0 8px 24px rgba(23, 107, 103, 0.35)'
                    : '0 2px 10px rgba(37, 50, 56, 0.05)',
                  border: isSelected
                    ? '2px solid #1E8A85'
                    : '1.5px solid rgba(37, 50, 56, 0.08)',
                  transform: isSelected ? 'translateY(-2px)' : 'none',
                }}
              >
                <div>
                  <div className="text-2xl mb-1.5 group-hover:scale-110 transition-transform">
                    {region.emblem}
                  </div>
                  <h4 className="font-extrabold text-xs sm:text-sm leading-tight">
                    {region.name}
                  </h4>
                </div>
                <div className="mt-2 pt-2 border-t border-current/15 text-[10px] opacity-75 font-medium truncate">
                  {region.id === 'all' ? 'Nusantara' : region.culturalIcons[0]}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 3. Search & Category Filters Bar ── */}
      <section className="space-y-4">
        {/* Search Input */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div
            className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl bg-white shadow-soft transition-all"
            style={{ border: '2px solid rgba(23, 107, 103, 0.2)' }}
          >
            <Search size={18} className="text-teal flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Cari budaya, UMKM, atau daerah: 'Ulos Samosir', 'Gudeg', 'Batik', 'Toraja', 'Pinisi'..."
              className="w-full text-xs sm:text-sm text-charcoal placeholder:text-gray-400 outline-none bg-transparent font-medium"
            />
            {search && (
              <button
                onClick={() => handleSearchChange('')}
                className="text-gray-400 hover:text-charcoal transition-colors p-1"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTER_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap btn-press"
                style={
                  isActive
                    ? {
                        background: '#253238',
                        color: 'white',
                        boxShadow: '0 4px 14px rgba(37, 50, 56, 0.25)',
                      }
                    : {
                        background: 'white',
                        color: cat.isHighlight ? '#059669' : '#6B7E85',
                        border: cat.isHighlight
                          ? '1.5px solid rgba(5, 150, 105, 0.3)'
                          : '1.5px solid rgba(37, 50, 56, 0.08)',
                      }
                }
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 4. Results Header & Stats ── */}
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <p className="text-charcoal-lighter">
          Menampilkan <strong className="text-charcoal font-black">{filteredPlaces.length}</strong> titik budaya & destinasi di{' '}
          <span className="font-extrabold text-teal">{selectedRegionData.name}</span>
          {search && (
            <span> untuk kata kunci <strong className="text-coral">"{search}"</strong></span>
          )}
        </p>

        {(search || activeRegion !== 'all' || activeCategory !== 'all') && (
          <button
            onClick={() => {
              setSearch('');
              handleSearchChange('');
              setActiveRegion('all');
              setActiveCategory('all');
            }}
            className="text-xs font-bold text-coral hover:text-coral-dark transition-colors"
          >
            Reset Semua Filter ↺
          </button>
        )}
      </div>

      {/* ── 5. Visual Cultural Cards Grid ── */}
      {filteredPlaces.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-soft p-6">
          <p className="text-4xl mb-3">🔍</p>
          <h3 className="font-extrabold text-charcoal text-base">Tidak ada destinasi atau UMKM yang cocok</h3>
          <p className="text-charcoal-lighter text-xs mt-1 max-w-sm mx-auto">
            Coba kata kunci lain atau klik tab wilayah kepulauan lain di atas.
          </p>
          <button
            onClick={() => {
              setSearch('');
              handleSearchChange('');
              setActiveRegion('all');
              setActiveCategory('all');
            }}
            className="mt-4 px-5 py-2.5 bg-teal text-white font-bold text-xs rounded-xl hover:bg-teal-dark transition-all"
          >
            Tampilkan Seluruh Nusantara
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlaces.map((place) => {
            const isSaved = savedIds.includes(place.id);

            return (
              <div
                key={place.id}
                className="bg-white rounded-3xl overflow-hidden shadow-soft hover:shadow-card card-hover flex flex-col justify-between group border border-gray-100 transition-all duration-300"
              >
                <div>
                  {/* Photo & Badge Overlays */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={place.image}
                      alt={place.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div
                      className="absolute inset-0"
                      style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)' }}
                    />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      {place.isUMKM && (
                        <span className="text-[10px] font-extrabold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full shadow flex items-center gap-1 backdrop-blur-sm">
                          <Store size={10} /> UMKM Mitra
                        </span>
                      )}
                      {place.isHiddenGem && (
                        <span className="text-[10px] font-extrabold bg-purple-600 text-white px-2.5 py-0.5 rounded-full shadow backdrop-blur-sm">
                          💎 Hidden Gem
                        </span>
                      )}
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow backdrop-blur-sm ${getCategoryColor(place.category)}`}>
                        {place.category}
                      </span>
                    </div>

                    {/* Bookmark Toggle */}
                    <button
                      onClick={() => toggleSave(place.id)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-sm"
                      style={{
                        background: 'rgba(255, 255, 255, 0.92)',
                        backdropFilter: 'blur(8px)',
                      }}
                      title={isSaved ? 'Hapus dari Wishlist' : 'Simpan ke Wishlist'}
                    >
                      {isSaved ? (
                        <BookmarkCheck size={16} className="text-coral fill-coral" />
                      ) : (
                        <Bookmark size={16} className="text-charcoal hover:text-coral transition-colors" />
                      )}
                    </button>

                    {/* Rating & Price Badge on Bottom of Photo */}
                    <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-md rounded-full px-2.5 py-0.5 text-xs font-bold text-charcoal">
                      <Star size={11} className="text-yellow-trip fill-yellow-trip" />
                      <span>{place.rating}</span>
                      <span className="text-[10px] text-charcoal-lighter font-normal">
                        ({place.reviews})
                      </span>
                    </div>

                    <div className="absolute bottom-2.5 right-3 text-white text-xs font-extrabold drop-shadow">
                      {place.priceLabel}
                    </div>
                  </div>

                  {/* Card Content Details */}
                  <div className="p-5">
                    <h3 className="font-extrabold text-charcoal text-base group-hover:text-teal transition-colors tracking-tight leading-snug">
                      {place.name}
                    </h3>

                    <div className="flex items-center gap-1 text-xs text-charcoal-lighter mt-1.5">
                      <MapPin size={11} className="text-coral flex-shrink-0" />
                      <span className="truncate">{place.city}</span>
                      {place.province && (
                        <span className="text-[11px] text-gray-400">· {place.province}</span>
                      )}
                    </div>

                    <p className="text-xs text-charcoal-lighter mt-2.5 line-clamp-2 leading-relaxed">
                      {place.description}
                    </p>

                    {/* Cultural Tags */}
                    <div className="flex flex-wrap gap-1.5 mt-3.5">
                      {place.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-lg text-teal"
                          style={{ background: 'rgba(23, 107, 103, 0.08)' }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 pt-2 border-t border-gray-50 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-charcoal-lighter flex items-center gap-1 font-medium">
                    <Clock size={11} className="text-teal" />
                    {place.openHour}
                  </span>

                  <button
                    onClick={() => handlePlanWithPlace(place.name)}
                    className="flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-2 rounded-xl text-white transition-all hover:scale-105 active:scale-95 btn-press"
                    style={{
                      background: 'linear-gradient(135deg, #176B67 0%, #1E8A85 100%)',
                      boxShadow: '0 4px 12px rgba(23, 107, 103, 0.25)',
                    }}
                  >
                    <Plus size={13} />
                    <span>Pilih ke Trip</span>
                  </button>
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
