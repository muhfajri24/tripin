import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Calendar, MapPin, ArrowRight, Store, Map,
  Star, ChevronRight, Search
} from 'lucide-react';
import {
  mockItineraries, mockRecommendations, formatCurrency,
  getStoredItineraries, mockDestinations
} from '../data/mockData';

const REGION_TABS = [
  { id: 'all', label: 'Semua' },
  { id: 'sumatra', label: 'Sumatra' },
  { id: 'jawa', label: 'Jawa' },
  { id: 'bali-nusra', label: 'Bali & Nusra' },
  { id: 'sulawesi', label: 'Sulawesi' },
  { id: 'maluku-papua', label: 'Maluku & Papua' },
];

function DashboardPage() {
  const navigate = useNavigate();
  const allItineraries = getStoredItineraries();
  const upcomingTrip = allItineraries[0] || mockItineraries[0];

  const [activeRegion, setActiveRegion] = useState('all');
  const [query, setQuery] = useState('');

  const filteredRecommendations = useMemo(() => {
    if (activeRegion === 'all') return mockRecommendations;
    return mockRecommendations.filter((rec) => {
      const dest = mockDestinations.find((d) =>
        d.name.toLowerCase().includes(rec.destination.toLowerCase())
      );
      return dest ? dest.region === activeRegion : true;
    });
  }, [activeRegion]);

  const handlePlan = (dest) => {
    navigate('/create', { state: { destination: dest } });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      handlePlan(query.trim());
    } else {
      navigate('/create');
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-fadeIn max-w-6xl mx-auto">

      {/* ── 1. Hero Search & Inspiration ── */}
      <section
        className="rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0d2221 0%, #173b39 60%, #1e4a47 100%)',
        }}
      >
        <div className="max-w-xl space-y-3 relative z-10">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/10 text-yellow-trip border border-white/15">
            Jelajah Nusantara
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
            Mau liburan ke mana hari ini?
          </h2>
          <p className="text-white/75 text-xs sm:text-sm leading-relaxed">
            Rencanakan perjalanan otomatis berbasis AI, hemat waktu & anggaran, serta berdayakan pelaku UMKM lokal di seluruh Indonesia.
          </p>

          {/* Unified Destination Search */}
          <form onSubmit={handleSearchSubmit} className="pt-2">
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white shadow-lg max-w-md">
              <div className="flex-1 flex items-center gap-2 px-3">
                <MapPin size={16} className="text-coral flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Ketik tujuan: Danau Toba, Bromo, Bali..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full text-xs sm:text-sm text-charcoal placeholder:text-gray-400 outline-none bg-transparent"
                />
              </div>
              <button
                type="submit"
                className="font-bold text-xs px-4 py-2.5 rounded-xl text-white transition-opacity hover:opacity-95 flex items-center gap-1.5"
                style={{ background: '#FF6B5E' }}
              >
                <span>Rencanakan</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </form>

          {/* Quick Destination Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-white/70">
            <span>Populer:</span>
            {['Bali', 'Danau Toba', 'Banda Neira', 'Yogyakarta', 'Labuan Bajo', 'Bromo'].map((d) => (
              <button
                key={d}
                onClick={() => handlePlan(d)}
                className="px-2.5 py-0.5 rounded-full font-medium transition-colors hover:bg-white/20 hover:text-white"
                style={{ background: 'rgba(255, 255, 255, 0.1)' }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. Compact Upcoming Trip Banner (If Available) ── */}
      {upcomingTrip && (
        <section className="bg-white rounded-3xl p-5 shadow-soft border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0">
              <img
                src={upcomingTrip.coverImage || '/images/hero/hero-bromo.jpg'}
                alt={upcomingTrip.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-teal bg-teal/10 px-2 py-0.5 rounded-full">
                  Itinerary Aktif
                </span>
                <span className="text-charcoal-lighter">
                  {upcomingTrip.duration} · {upcomingTrip.destination}
                </span>
              </div>
              <h3 className="font-bold text-charcoal text-sm sm:text-base mt-0.5">
                {upcomingTrip.title}
              </h3>
            </div>
          </div>

          <button
            onClick={() => navigate(`/itinerary/${upcomingTrip.id}`)}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl text-teal bg-teal/10 hover:bg-teal hover:text-white transition-colors self-end sm:self-auto"
          >
            <span>Buka Jadwal</span>
            <ChevronRight size={14} />
          </button>
        </section>
      )}

      {/* ── 3. Destinasi Rekomendasi (Clean Cards Grid) ── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-charcoal text-lg tracking-tight">
              Destinasi Rekomendasi
            </h3>
            <p className="text-xs text-charcoal-lighter mt-0.5">
              Rekomendasi perjalanan nusantara berbasis kearifan lokal & UMKM
            </p>
          </div>

          {/* Region Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
            {REGION_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveRegion(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeRegion === tab.id
                    ? 'bg-teal text-white shadow-sm'
                    : 'bg-white text-charcoal-lighter hover:text-charcoal border border-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredRecommendations.map((rec) => (
            <div
              key={rec.id}
              onClick={() => handlePlan(rec.destination)}
              className="bg-white rounded-3xl overflow-hidden shadow-soft border border-gray-100 group cursor-pointer hover:shadow-card hover:-translate-y-1 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={rec.image}
                    alt={rec.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2.5 left-3 text-white text-xs font-bold flex items-center gap-1">
                    <MapPin size={12} className="text-coral" />
                    <span>{rec.destination}</span>
                  </div>
                </div>

                <div className="p-4">
                  <h4 className="font-bold text-charcoal text-sm group-hover:text-teal transition-colors line-clamp-1">
                    {rec.title}
                  </h4>
                  <p className="text-xs text-charcoal-lighter mt-1 line-clamp-2 leading-relaxed">
                    {rec.description}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0">
                <div className="pt-2 border-t border-gray-50 flex items-center justify-between text-xs font-bold text-teal">
                  <span className="flex items-center gap-1 text-[11px] text-charcoal-lighter">
                    <Store size={12} className="text-emerald-600" /> UMKM Mitra
                  </span>
                  <span className="flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                    Susun Rute <ChevronRight size={12} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. Minimalist Impact & Coverage Strip ── */}
      <section className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
        <div className="pt-2 sm:pt-0">
          <p className="text-2xl font-black text-teal">38 Provinsi</p>
          <p className="text-xs text-charcoal-lighter mt-0.5 font-medium">Jangkauan Destinasi Seluruh Indonesia</p>
        </div>
        <div className="pt-4 sm:pt-0 sm:px-4">
          <p className="text-2xl font-black text-emerald-700">1.200+ Titik</p>
          <p className="text-xs text-charcoal-lighter mt-0.5 font-medium">UMKM & Sentra Kerajinan Terverifikasi</p>
        </div>
        <div className="pt-4 sm:pt-0 sm:px-4">
          <p className="text-2xl font-black text-charcoal">SDG 8</p>
          <p className="text-xs text-charcoal-lighter mt-0.5 font-medium">Pariwisata Berkelanjutan Berdayakan Warga</p>
        </div>
      </section>

    </div>
  );
}

export default DashboardPage;
