import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Compass, Store, Sparkles, MapPin, Star, Plus, Bookmark,
  BookmarkCheck, Filter, ArrowRight, Heart, Clock, Globe
} from 'lucide-react';
import {
  mockLocalBusinesses, mockDestinations, formatCurrency, getCategoryColor
} from '../data/mockData';
import { INDONESIA_REGIONS } from '../services/regionService';
import SearchInput from '../components/SearchInput';

const filterCategories = [
  { id: 'all', label: 'Semua Kategori' },
  { id: 'umkm', label: '🌿 UMKM Mitra Lokal', isHighlight: true },
  { id: 'hidden', label: '💎 Hidden Gems' },
  { id: 'culinary', label: '🍜 Kuliner Autentik' },
  { id: 'craft', label: '🎨 Kerajinan & Adat' },
  { id: 'heritage', label: '🏛️ Heritage & Budaya' },
];

const regionOptions = [
  { id: 'all', label: '🇮🇩 Seluruh Indonesia' },
  { id: 'sumatra', label: 'Sumatra' },
  { id: 'jawa', label: 'Jawa' },
  { id: 'bali-nusra', label: 'Bali & Nusra' },
  { id: 'kalimantan', label: 'Kalimantan' },
  { id: 'sulawesi', label: 'Sulawesi' },
  { id: 'maluku-papua', label: 'Maluku & Papua' },
];

function LocalDiscoveryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';

  const [search, setSearch] = useState(queryParam);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeRegion, setActiveRegion] = useState('all');
  const [savedIds, setSavedIds] = useState([
    ...mockDestinations.filter((d) => d.saved).map((d) => `dest-${d.id}`),
    'lb-sum-1',
    'lb-sul-1',
    'lb-mal-1',
    'lb-1',
  ]);

  // Sync search input whenever query param changes from Navbar
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
  const allPlaces = [
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
      priceLabel: d.ticketPrice > 0 ? formatCurrency(d.ticketPrice) : 'Gratis',
      description: d.description,
      tags: d.tags,
      isUMKM: false,
      isHiddenGem: d.isHiddenGem,
      openHour: `${d.openHour} - ${d.closeHour}`,
    })),
  ];

  const filteredPlaces = allPlaces.filter((item) => {
    // 1. Search Query filter (matches name, city, province, tags, or description)
    const matchSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.city.toLowerCase().includes(search.toLowerCase()) ||
      item.province.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

    if (!matchSearch) return false;

    // 2. Region filter
    if (activeRegion !== 'all' && item.region !== activeRegion) {
      return false;
    }

    // 3. Category filter
    if (activeFilter === 'all') return true;
    if (activeFilter === 'umkm') return item.isUMKM;
    if (activeFilter === 'hidden') return item.isHiddenGem;
    if (activeFilter === 'culinary') return item.category === 'Culinary';
    if (activeFilter === 'craft') return item.category === 'Craft';
    if (activeFilter === 'heritage') return item.category === 'Heritage';

    return true;
  });

  const toggleSave = (id) => {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6 animate-fadeInUp pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal via-teal-dark to-charcoal text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-soft">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-trip/20 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-yellow-trip text-xs font-bold px-3 py-1 rounded-full mb-3">
            <Sparkles size={13} />
            Katalog UMKM & Destinasi Seluruh Indonesia (SDG 8)
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Local Discovery Nusantara
          </h1>
          <p className="text-white/80 text-xs sm:text-sm mt-2 leading-relaxed">
            Direktori terpadu untuk menemukan kekayaan otentik di seluruh penjuru Indonesia — dari sentra kuliner legendaris Sumatra, batik Jawa, kopi Flores & Toraja, perahu Pinisi, rempah Banda Neira, hingga noken Papua.
          </p>
        </div>
      </div>

      {/* Integrated Search & Filter Controls */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={handleSearchChange}
              placeholder="Cari UMKM atau destinasi: 'Toba', 'Toraja', 'Gudeg', 'Flores', 'Pinisi', 'Raja Ampat'..."
              size="default"
            />
          </div>
        </div>

        {/* Region Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="font-bold text-charcoal-lighter flex items-center gap-1 flex-shrink-0">
            <Globe size={13} className="text-teal" />
            Wilayah:
          </span>
          {regionOptions.map((r) => {
            const isActive = activeRegion === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setActiveRegion(r.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl font-bold transition-all text-xs ${
                  isActive
                    ? 'bg-teal text-white shadow-teal/30 shadow'
                    : 'bg-white text-charcoal-lighter border border-gray-200 hover:border-teal hover:text-teal'
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        {/* Category Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filterCategories.map((cat) => {
            const isActive = activeFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveFilter(cat.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-charcoal text-white shadow'
                    : 'bg-white text-charcoal-lighter border border-gray-200 hover:border-charcoal'
                } ${
                  cat.isHighlight && !isActive
                    ? 'border-emerald-300 text-emerald-700 bg-emerald-50/50'
                    : ''
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Count & Action */}
      <div className="flex items-center justify-between">
        <p className="text-xs sm:text-sm text-charcoal-lighter">
          Menampilkan <span className="font-extrabold text-charcoal">{filteredPlaces.length}</span> tempat lokal terverifikasi
          {search && (
            <span>
              {' '}untuk kata kunci <span className="text-teal font-bold">"{search}"</span>
            </span>
          )}
        </p>
        <button
          onClick={() => navigate('/create')}
          className="text-xs font-bold text-coral hover:text-coral-dark flex items-center gap-1"
        >
          Rencanakan Trip dengan Tempat Ini <ArrowRight size={13} />
        </button>
      </div>

      {/* Unified Cards Grid */}
      {filteredPlaces.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
          <p className="text-4xl mb-3">🔍</p>
          <h3 className="font-bold text-charcoal text-base">Tidak ada tempat yang cocok</h3>
          <p className="text-charcoal-lighter text-xs mt-1">
            Coba kata kunci lain atau pilih opsi wilayah "Seluruh Indonesia".
          </p>
          <button
            onClick={() => {
              setSearch('');
              setSearchParams({});
              setActiveFilter('all');
              setActiveRegion('all');
            }}
            className="mt-4 px-4 py-2 bg-teal text-white font-bold text-xs rounded-xl hover:bg-teal-dark transition-all"
          >
            Reset Semua Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlaces.map((place) => {
            const isSaved = savedIds.includes(place.id);
            return (
              <div
                key={place.id}
                className="bg-white rounded-3xl overflow-hidden shadow-soft hover:shadow-hover card-hover flex flex-col justify-between group border border-gray-100"
              >
                <div>
                  {/* Photo & Badges */}
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={place.image}
                      alt={place.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />

                    {/* Top Status Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      {place.isUMKM && (
                        <span className="text-[11px] font-bold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                          <Store size={11} />
                          UMKM Mitra
                        </span>
                      )}
                      {place.isHiddenGem && (
                        <span className="text-[11px] font-bold bg-purple-600 text-white px-2.5 py-0.5 rounded-full shadow-sm">
                          💎 Hidden Gem
                        </span>
                      )}
                      {!place.isUMKM && !place.isHiddenGem && (
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${getCategoryColor(
                            place.category
                          )}`}
                        >
                          {place.category}
                        </span>
                      )}
                    </div>

                    {/* Bookmark Button */}
                    <button
                      onClick={() => toggleSave(place.id)}
                      className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-sm"
                      title={isSaved ? 'Hapus dari tersimpan' : 'Simpan tempat ini'}
                    >
                      {isSaved ? (
                        <BookmarkCheck size={16} className="text-coral fill-coral" />
                      ) : (
                        <Bookmark size={16} className="text-charcoal" />
                      )}
                    </button>

                    {/* Rating & Review */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm rounded-full px-2.5 py-1">
                      <Star size={12} className="text-yellow-trip fill-yellow-trip" />
                      <span className="text-xs font-bold text-charcoal">
                        {place.rating}
                      </span>
                      <span className="text-[10px] text-charcoal-lighter">
                        ({place.reviews})
                      </span>
                    </div>

                    {/* Price Tag */}
                    <div className="absolute bottom-3 right-3 text-white text-xs font-bold drop-shadow">
                      {place.priceLabel}
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-4 sm:p-5">
                    <h3 className="font-extrabold text-charcoal text-base leading-snug group-hover:text-teal transition-colors">
                      {place.name}
                    </h3>
                    <div className="flex items-center gap-1 mt-1 text-xs text-charcoal-lighter">
                      <MapPin size={12} className="text-teal flex-shrink-0" />
                      <span className="truncate">{place.city}</span>
                      {place.province && (
                        <span className="text-[11px] text-gray-400">({place.province})</span>
                      )}
                    </div>

                    <p className="text-xs text-charcoal-lighter mt-2.5 line-clamp-2 leading-relaxed">
                      {place.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mt-3">
                      {place.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] bg-sky text-teal font-bold px-2 py-0.5 rounded-md"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="px-4 pb-4 pt-2 border-t border-gray-50 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-charcoal-lighter flex items-center gap-1">
                    <Clock size={11} className="text-teal" />
                    {place.openHour}
                  </span>
                  <button
                    onClick={() =>
                      navigate('/create', { state: { destination: place.name } })
                    }
                    className="flex items-center gap-1 bg-teal/10 hover:bg-teal hover:text-white text-teal text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                  >
                    <Plus size={13} />
                    Pilih ke Trip
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
