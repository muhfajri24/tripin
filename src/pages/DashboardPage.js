import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Calendar, MapPin, ArrowRight, Store, Award, Compass,
  TrendingUp, Star, Heart, Clock, ChevronRight, Map, Sun, Moon,
  Coffee, Sunset, ExternalLink, BookmarkCheck, Check
} from 'lucide-react';
import {
  mockItineraries, mockRecommendations, formatCurrency,
  getOverallImpactStats, getTripImpactStats, getStoredItineraries,
  mockDestinations, mockLocalBusinesses
} from '../data/mockData';

// Inspirasi Harian Berganti
const DAILY_INSPIRATIONS = [
  {
    destination: 'Banda Neira',
    province: 'Maluku',
    quote: '“Jangan mati sebelum ke Banda Neira.” — Sutan Sjahrir',
    tagline: 'Gugusan Benteng Bersejarah & Megahnya Lautan Pala',
    image: '/images/hero/hero-bandaneira.jpg',
    bestSeason: 'Okt – Des (Laut Tenang)',
    estBudget: 'Rp2.800.000 / orang',
    umkmHighlights: 'Pala Banda, Minyak Kayu Putih, Ikan Cakalang Asap',
  },
  {
    destination: 'Raja Ampat',
    province: 'Papua Barat Daya',
    quote: '“Surga karang dunia dengan lebih dari 75% spesies karang planet bumi.”',
    tagline: 'Gugusan Pulau Karst Zamrud & Lautan Sebening Kristal',
    image: '/images/hero/hero-rajaampat.jpg',
    bestSeason: 'Nov – Apr (Paling Jernih)',
    estBudget: 'Rp4.500.000 / orang',
    umkmHighlights: 'Kerajinan Noken, Pemandu Selam Warga Lokal',
  },
  {
    destination: 'Gunung Bromo',
    province: 'Jawa Timur',
    quote: '“Matahari terbit keemasan menembus kabut magis kaldera Tengger.”',
    tagline: 'Laut Pasir Berbisik & Budaya Suku Tengger',
    image: '/images/hero/hero-bromo.jpg',
    bestSeason: 'Mei – Sep (Musim Kemarau)',
    estBudget: 'Rp1.200.000 / orang',
    umkmHighlights: 'Jeep Lokal 4WD, Petani Sayur Tengger, Ponco Wol',
  },
  {
    destination: 'Danau Toba & Samosir',
    province: 'Sumatera Utara',
    quote: '“Geopark Kaldera Raksasa Berpadu Hangatnya Budaya Batak.”',
    tagline: 'Perbukitan Hijau, Tenun Ulos, & Kuliner Rempah Andaliman',
    image: '/images/hero/hero-malioboro.jpg',
    bestSeason: 'Sep – Des (Festival Danau)',
    estBudget: 'Rp1.500.000 / orang',
    umkmHighlights: 'Tenun Ulos Lumban Suhi-suhi, Kopi Arabika Lintong',
  },
];

// Wisata Pengalaman Populer
const POPULAR_EXPERIENCES = [
  {
    id: 'exp-1',
    title: 'Sunrise Laut Pasir & Kawah Bromo',
    location: 'Tengger, Jawa Timur',
    category: 'Petualangan Alam',
    duration: '1 Hari',
    image: '/images/hero/hero-bromo.jpg',
    badge: 'Paling Ikonik',
    rating: 4.9,
    price: 'Rp450.000',
    destinationKey: 'Bromo',
  },
  {
    id: 'exp-2',
    title: 'Menyelam & Jelajah Pulau Misool',
    location: 'Raja Ampat, Papua',
    category: 'Bahari & Konservasi',
    duration: '3 Hari',
    image: '/images/hero/hero-rajaampat.jpg',
    badge: 'Surga Bahari',
    rating: 5.0,
    price: 'Rp1.850.000',
    destinationKey: 'Raja Ampat',
  },
  {
    id: 'exp-3',
    title: 'Napak Tilas Rempah di Benteng Belgica',
    location: 'Banda Neira, Maluku',
    category: 'Sejarah & Budaya',
    duration: '2 Hari',
    image: '/images/hero/hero-bandaneira.jpg',
    badge: 'Heritage UNESCO',
    rating: 4.9,
    price: 'Rp650.000',
    destinationKey: 'Banda Neira',
  },
  {
    id: 'exp-4',
    title: 'Melihat Senja Spektakuler di Pura Uluwatu',
    location: 'Badung, Bali',
    category: 'Seni & Pesisir',
    duration: 'Setengah Hari',
    image: '/images/hero/hero-bali.jpg',
    badge: 'Tari Kecak',
    rating: 4.8,
    price: 'Rp150.000',
    destinationKey: 'Bali',
  },
];

const REGION_TABS = [
  { id: 'all', label: 'Semua Nusantara' },
  { id: 'sumatra', label: 'Sumatra' },
  { id: 'jawa', label: 'Jawa' },
  { id: 'bali-nusra', label: 'Bali & Nusra' },
  { id: 'sulawesi', label: 'Sulawesi' },
  { id: 'maluku-papua', label: 'Maluku & Papua' },
];

function DashboardPage() {
  const navigate = useNavigate();
  const allItineraries = getStoredItineraries();
  const nextTrip = allItineraries[0] || mockItineraries[0];
  const overallImpact = getOverallImpactStats(allItineraries);
  const tripImpact = getTripImpactStats(nextTrip);

  const [activeRegion, setActiveRegion] = useState('all');
  const [inspirationIdx, setInspirationIdx] = useState(0);
  const [quickSearch, setQuickSearch] = useState('');

  // Sapaan personal berdasarkan jam lokal
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return { text: 'Selamat Pagi, Sahabat Petualang!', icon: Sun, color: '#FFC857' };
    if (hour >= 11 && hour < 15) return { text: 'Selamat Siang, Penjelajah Nusantara!', icon: Sun, color: '#FF6B5E' };
    if (hour >= 15 && hour < 18) return { text: 'Selamat Sore, Penikmat Senja!', icon: Sunset, color: '#FF8A80' };
    return { text: 'Selamat Malam, Perancang Liburan!', icon: Moon, color: '#1E8A85' };
  }, []);

  const curInspiration = DAILY_INSPIRATIONS[inspirationIdx];

  // Filter destinasi trending
  const filteredRecommendations = useMemo(() => {
    if (activeRegion === 'all') return mockRecommendations;
    return mockRecommendations.filter((rec) => {
      const dest = mockDestinations.find((d) => d.name.toLowerCase().includes(rec.destination.toLowerCase()));
      return dest ? dest.region === activeRegion : true;
    });
  }, [activeRegion]);

  const handleQuickPlan = (dest) => {
    navigate('/create', { state: { destination: dest } });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      handleQuickPlan(quickSearch.trim());
    } else {
      navigate('/create');
    }
  };

  return (
    <div className="space-y-10 animate-fadeInUp pb-16">

      {/* ── 1. Greeting & Hero Inspiration of the Day ── */}
      <section className="space-y-4">
        {/* Personalized Top Greeting Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-charcoal">
              <greeting.icon size={22} style={{ color: greeting.color }} />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
                {greeting.text}
              </h1>
            </div>
            <p className="text-charcoal-lighter text-xs sm:text-sm mt-1">
              Jelajahi keajaiban budaya 38 provinsi & dorong perputaran ekonomi UMKM lokal di setiap perjalananmu.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => navigate('/create')}
              className="flex items-center gap-2 font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-2xl text-white transition-all hover:scale-105 active:scale-95 shadow-md btn-press"
              style={{
                background: 'linear-gradient(135deg, #FF6B5E 0%, #E55A4E 100%)',
                boxShadow: '0 6px 20px rgba(255, 107, 94, 0.35)',
              }}
            >
              <Sparkles size={16} />
              <span>Rencanakan Liburan</span>
            </button>
          </div>
        </div>

        {/* Cinematic Inspiration Card of the Day */}
        <div
          className="relative rounded-3xl overflow-hidden group shadow-card border border-teal/15 transition-all duration-500"
          style={{ minHeight: '340px' }}
        >
          <img
            src={curInspiration.image}
            alt={curInspiration.destination}
            className="w-full h-full object-cover absolute inset-0 transition-transform duration-1000 group-hover:scale-105"
            style={{ minHeight: '340px' }}
          />

          {/* Deep Gradient Scrim */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(180deg, rgba(14,39,38,0.3) 0%, rgba(14,39,38,0.7) 45%, rgba(10,24,23,0.95) 100%)',
            }}
          />

          <div className="relative z-10 p-6 sm:p-8 flex flex-col justify-between h-full" style={{ minHeight: '340px' }}>
            {/* Top row */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full text-white backdrop-blur-md"
                  style={{ background: 'rgba(23, 107, 103, 0.75)', border: '1px solid rgba(255, 255, 255, 0.25)' }}
                >
                  ✨ Inspirasi Nusantara Hari Ini
                </span>
                <span
                  className="text-xs font-bold px-3 py-1 rounded-full text-yellow-trip backdrop-blur-md"
                  style={{ background: 'rgba(0, 0, 0, 0.45)', border: '1px solid rgba(255, 200, 87, 0.3)' }}
                >
                  📍 {curInspiration.destination}, {curInspiration.province}
                </span>
              </div>

              {/* Dots / switch inspiration */}
              <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md p-1 rounded-full">
                {DAILY_INSPIRATIONS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setInspirationIdx(i)}
                    className="transition-all duration-300 rounded-full"
                    style={{
                      width: i === inspirationIdx ? 22 : 8,
                      height: 8,
                      background: i === inspirationIdx ? '#FFC857' : 'rgba(255, 255, 255, 0.4)',
                    }}
                    title={`Lihat ${DAILY_INSPIRATIONS[i].destination}`}
                  />
                ))}
              </div>
            </div>

            {/* Bottom Content */}
            <div className="mt-8 sm:mt-12">
              <p className="text-yellow-trip/90 text-xs sm:text-sm font-semibold italic max-w-xl mb-1.5">
                {curInspiration.quote}
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight mb-2">
                {curInspiration.destination} — {curInspiration.tagline}
              </h2>

              {/* Info pills */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-white/80 mt-3 mb-6">
                <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-xl backdrop-blur-sm">
                  <Clock size={12} className="text-teal-light" />
                  Waktu Terbaik: <strong className="text-white">{curInspiration.bestSeason}</strong>
                </span>
                <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-xl backdrop-blur-sm">
                  <Store size={12} className="text-emerald-300" />
                  UMKM Khas: <strong className="text-white">{curInspiration.umkmHighlights}</strong>
                </span>
                <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-xl backdrop-blur-sm">
                  Est. Budget: <strong className="text-yellow-trip">{curInspiration.estBudget}</strong>
                </span>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handleQuickPlan(curInspiration.destination)}
                  className="font-extrabold text-xs sm:text-sm px-6 py-3 rounded-2xl text-white transition-all hover:scale-105 active:scale-95 flex items-center gap-2 btn-press"
                  style={{
                    background: 'linear-gradient(135deg, #FF6B5E 0%, #E55A4E 100%)',
                    boxShadow: '0 8px 24px rgba(255, 107, 94, 0.4)',
                  }}
                >
                  <Sparkles size={16} />
                  <span>Rencanakan Trip ke {curInspiration.destination}</span>
                  <ArrowRight size={15} />
                </button>

                <button
                  onClick={() => navigate('/discovery', { state: { search: curInspiration.destination } })}
                  className="font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl text-white transition-all hover:bg-white/25 active:scale-95 backdrop-blur-md"
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  }}
                >
                  Eksplorasi Budaya & UMKM
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Interactive Travel Search & Quick Inspiration ── */}
      <section
        className="rounded-3xl p-5 sm:p-6 shadow-soft border border-gray-100"
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f9fcfa 100%)',
        }}
      >
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <span className="text-[11px] font-extrabold text-teal uppercase tracking-widest bg-teal/10 px-3 py-1 rounded-full">
            🗺️ Rencana Cepat Nusantara
          </span>
          <h3 className="text-lg sm:text-xl font-extrabold text-charcoal">
            Mau Liburan ke Mana di Indonesia?
          </h3>
          <p className="text-xs text-charcoal-lighter">
            Ketik nama kota, pulau, atau destinasi impianmu. AI TRIPIN akan menyusun rute terbaik dengan waktu & budget terpadu.
          </p>

          <form onSubmit={handleSearchSubmit} className="pt-2">
            <div
              className="flex items-center gap-2 p-1.5 rounded-2xl transition-all shadow-sm max-w-xl mx-auto"
              style={{
                background: 'white',
                border: '2px solid rgba(23, 107, 103, 0.25)',
              }}
            >
              <div className="flex-1 flex items-center gap-2.5 px-3">
                <MapPin size={18} className="text-coral flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Contoh: Danau Toba, Toraja, Bandung, Labuan Bajo..."
                  value={quickSearch}
                  onChange={(e) => setQuickSearch(e.target.value)}
                  className="w-full text-xs sm:text-sm text-charcoal placeholder:text-gray-400 outline-none bg-transparent font-medium"
                />
              </div>
              <button
                type="submit"
                className="font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl text-white transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 flex-shrink-0 btn-press"
                style={{
                  background: 'linear-gradient(135deg, #176B67 0%, #1E8A85 100%)',
                  boxShadow: '0 4px 14px rgba(23, 107, 103, 0.3)',
                }}
              >
                <span>Mulai</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </form>

          {/* Quick Clickable Suggestions */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
            <span className="text-charcoal-lighter text-[11px] font-semibold">Destinasi Favorit:</span>
            {['Labuan Bajo', 'Danau Toba', 'Banda Neira', 'Yogyakarta', 'Tana Toraja', 'Raja Ampat', 'Bromo'].map((d) => (
              <button
                key={d}
                onClick={() => handleQuickPlan(d)}
                className="px-3 py-1 rounded-full font-semibold transition-all hover:scale-105 hover:bg-teal hover:text-white btn-press"
                style={{
                  background: 'rgba(23, 107, 103, 0.08)',
                  color: '#176B67',
                  border: '1px solid rgba(23, 107, 103, 0.15)',
                }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Modern Travel Statistics & Economic Impact (SDG 8) ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-charcoal text-lg sm:text-xl tracking-tight">
              Dampak Nyata Perjalananmu (SDG 8)
            </h2>
            <p className="text-xs text-charcoal-lighter mt-0.5">
              Setiap rute TRIPIN dirancang untuk memberdayakan pengrajin, kuliner otentik, & komunitas lokal.
            </p>
          </div>
          <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full flex items-center gap-1">
            <Award size={12} /> Pariwisata Berkelanjutan
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Wilayah Terkover',
              val: '38 Provinsi',
              sub: 'Seluruh penjuru kepulauan Indonesia',
              icon: Map,
              color: '#176B67',
              bg: 'rgba(23, 107, 103, 0.08)',
            },
            {
              label: 'Jaringan UMKM Terkurasi',
              val: '1.200+ Mitra',
              sub: 'Sentra tenun, kuliner, seni & kriya',
              icon: Store,
              color: '#059669',
              bg: 'rgba(5, 150, 105, 0.08)',
            },
            {
              label: 'Kontribusi Ekonomi Lokal',
              val: '68% Rata-rata',
              sub: 'Alokasi budget berputar di warga lokal',
              icon: TrendingUp,
              color: '#D97706',
              bg: 'rgba(217, 119, 6, 0.08)',
            },
            {
              label: 'Rencana Perjalananmu',
              val: `${allItineraries.length} Itinerary`,
              sub: 'Tersimpan aman di perambanmu',
              icon: Calendar,
              color: '#FF6B5E',
              bg: 'rgba(255, 107, 94, 0.08)',
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl p-5 shadow-soft border border-gray-100 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-card group"
            >
              <div>
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                  style={{ background: stat.bg, color: stat.color }}
                >
                  <stat.icon size={22} />
                </div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-charcoal-lighter">
                  {stat.label}
                </p>
                <h4 className="text-xl sm:text-2xl font-extrabold text-charcoal mt-1 tracking-tight">
                  {stat.val}
                </h4>
              </div>
              <p className="text-xs text-charcoal-lighter mt-3 pt-2 border-t border-gray-50 leading-relaxed">
                {stat.sub}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. Popular Experiences (Wisata Pengalaman Autentik) ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-charcoal text-lg sm:text-xl tracking-tight">
              Pengalaman Autentik Nusantara
            </h2>
            <p className="text-xs text-charcoal-lighter mt-0.5">
              Kegiatan berkesan yang wajib dirasakan setidaknya sekali seumur hidup
            </p>
          </div>
          <button
            onClick={() => navigate('/discovery')}
            className="text-xs font-bold text-teal flex items-center gap-1 hover:gap-2 transition-all"
          >
            Lihat Semua <ArrowRight size={13} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {POPULAR_EXPERIENCES.map((exp) => (
            <div
              key={exp.id}
              onClick={() => handleQuickPlan(exp.destinationKey)}
              className="bg-white rounded-3xl overflow-hidden shadow-soft border border-gray-100 group cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-card flex flex-col justify-between"
            >
              <div>
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={exp.image}
                    alt={exp.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }}
                  />

                  {/* Badge */}
                  <span
                    className="absolute top-3 left-3 text-[10px] font-extrabold px-2.5 py-1 rounded-full text-white backdrop-blur-md shadow"
                    style={{ background: 'rgba(23, 107, 103, 0.85)' }}
                  >
                    {exp.badge}
                  </span>

                  <div className="absolute bottom-2.5 left-3 flex items-center gap-1 text-white text-xs font-bold drop-shadow">
                    <Star size={12} className="text-yellow-trip fill-yellow-trip" />
                    <span>{exp.rating}</span>
                    <span className="text-white/70 font-normal">· {exp.duration}</span>
                  </div>
                </div>

                <div className="p-4">
                  <span className="text-[10px] font-bold text-teal uppercase tracking-wider block mb-1">
                    {exp.category}
                  </span>
                  <h3 className="font-extrabold text-charcoal text-sm leading-snug group-hover:text-teal transition-colors line-clamp-2">
                    {exp.title}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-charcoal-lighter mt-1.5">
                    <MapPin size={11} className="text-coral flex-shrink-0" />
                    <span className="truncate">{exp.location}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0">
                <div className="flex items-center justify-between pt-2.5 border-t border-gray-50 text-xs">
                  <div>
                    <span className="text-[10px] text-charcoal-lighter block">Mulai dari</span>
                    <span className="font-extrabold text-charcoal">{exp.price}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickPlan(exp.destinationKey);
                    }}
                    className="px-3 py-1.5 rounded-xl font-bold text-xs text-white transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: 'linear-gradient(135deg, #FF6B5E 0%, #E55A4E 100%)',
                    }}
                  >
                    Susun Rute
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. Trending Destinations by Region ── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-extrabold text-charcoal text-lg sm:text-xl tracking-tight">
              Destinasi Paling Diminati
            </h2>
            <p className="text-xs text-charcoal-lighter mt-0.5">
              Jelajahi pilihan populer berbasis keindahan alam & kekayaan tradisi warga
            </p>
          </div>

          {/* Region Filter Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {REGION_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveRegion(tab.id)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap btn-press"
                style={
                  activeRegion === tab.id
                    ? {
                        background: '#176B67',
                        color: 'white',
                        boxShadow: '0 4px 14px rgba(23, 107, 103, 0.35)',
                      }
                    : {
                        background: 'white',
                        color: '#6B7E85',
                        border: '1px solid rgba(37, 50, 56, 0.1)',
                      }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredRecommendations.map((rec) => (
            <div
              key={rec.id}
              onClick={() => handleQuickPlan(rec.destination)}
              className="bg-white rounded-3xl overflow-hidden shadow-soft border border-gray-100 group cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-card flex flex-col justify-between"
            >
              <div>
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={rec.image}
                    alt={rec.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }}
                  />

                  {/* Highlights tag */}
                  <span
                    className="absolute top-3 left-3 text-[10px] font-extrabold px-2.5 py-1 rounded-full text-white backdrop-blur-md"
                    style={{ background: 'rgba(23, 107, 103, 0.85)' }}
                  >
                    ⭐ Rekomendasi AI
                  </span>

                  <div className="absolute bottom-2.5 left-3 flex items-center gap-1 text-white text-xs font-bold drop-shadow">
                    <MapPin size={12} className="text-coral" />
                    <span>{rec.destination}</span>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-extrabold text-charcoal text-base leading-snug group-hover:text-teal transition-colors">
                    {rec.title}
                  </h3>
                  <p className="text-xs text-charcoal-lighter mt-1.5 line-clamp-2 leading-relaxed">
                    {rec.description}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0">
                <div className="flex items-center justify-between pt-2.5 border-t border-gray-50 text-xs">
                  <span className="font-bold text-teal flex items-center gap-1">
                    <Store size={12} /> Destinasi Terverifikasi
                  </span>
                  <span className="font-extrabold text-coral flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Susun Rute <ChevronRight size={13} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. Upcoming Itinerary Card (If Available) ── */}
      {nextTrip && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-charcoal text-lg sm:text-xl tracking-tight">
              Rencana Perjalanan Aktifmu
            </h2>
            <button
              onClick={() => navigate('/my-itineraries')}
              className="text-xs font-bold text-teal flex items-center gap-1 hover:gap-2 transition-all"
            >
              Semua Trip ({allItineraries.length}) <ArrowRight size={13} />
            </button>
          </div>

          <div
            className="rounded-3xl overflow-hidden shadow-card border border-teal/20 p-6 sm:p-7 relative transition-all"
            style={{
              background: 'linear-gradient(135deg, #0e2726 0%, #173b39 60%, #1e4a47 100%)',
              color: 'white',
            }}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-yellow-trip/20 text-yellow-trip px-3 py-0.5 rounded-full border border-yellow-trip/30">
                    🗓 Terjadwal
                  </span>
                  <span className="text-xs text-white/70">
                    {nextTrip.duration} · {nextTrip.travelers || 2} Wisatawan
                  </span>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Store size={11} /> {tripImpact.umkmCount} UMKM di Rute Ini
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
                  {nextTrip.title}
                </h3>

                <p className="text-white/70 text-xs sm:text-sm leading-relaxed">
                  Perjalanan menuju <strong className="text-white">{nextTrip.destination}</strong> sudah dioptimasi rute dan waktu tempuhnya dengan estimasi total anggaran {formatCurrency(nextTrip.totalBudget)}.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                <button
                  onClick={() => navigate(`/itinerary/${nextTrip.id}`)}
                  className="font-extrabold text-xs sm:text-sm px-6 py-3 rounded-2xl text-white transition-all hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center gap-2 btn-press"
                  style={{
                    background: 'linear-gradient(135deg, #FF6B5E 0%, #E55A4E 100%)',
                    boxShadow: '0 6px 20px rgba(255, 107, 94, 0.4)',
                  }}
                >
                  <Map size={16} />
                  <span>Buka Timeline & Peta</span>
                </button>

                <button
                  onClick={() => navigate(`/itinerary/${nextTrip.id}/edit`)}
                  className="font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl text-white transition-all hover:bg-white/20 active:scale-95 border border-white/25 flex items-center justify-center gap-1.5"
                  style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                >
                  <span>Kelola / Reschedule</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}

export default DashboardPage;
