import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles, Store, Map, Award, ArrowRight, ChevronDown, ChevronRight, Play
} from 'lucide-react';
import logoFull from '../assets/logo-full.png';

const heroDestinations = [
  { name: 'Banda Neira',    image: '/images/hero/hero-bandaneira.jpg', tagline: 'Benteng Belgica & Surga Rempah Banda Neira', region: 'Maluku' },
  { name: 'Yogyakarta',     image: '/images/hero/hero-malioboro.jpg',  tagline: 'Suasana Syahdu Malioboro & Budaya Keraton',  region: 'Jawa' },
  { name: 'Gunung Bromo',   image: '/images/hero/hero-bromo.jpg',      tagline: 'Lautan Pasir & Keajaiban Matahari Terbit',   region: 'Jawa Timur' },
  { name: 'Bali',           image: '/images/hero/hero-bali.jpg',       tagline: 'Pesona Tebing & Birunya Pantai Dewata',      region: 'Bali' },
  { name: 'Raja Ampat',     image: '/images/hero/hero-rajaampat.jpg',  tagline: 'Surga Karang Dunia & Gugusan Pulau Karst',   region: 'Papua Barat' },
  { name: 'Palembang',      image: '/images/hero/hero-ampera.jpg',     tagline: 'Ikon Megah Jembatan Ampera & Sungai Musi',   region: 'Sumatra Selatan' },
];

const features = [
  {
    icon: Sparkles,
    title: 'Guest Trip Planner',
    description: 'Tulis brief, periksa kebutuhan, lalu susun jadwal Yogyakarta 1-3 hari sesuai batas waktu dan budget.',
    color: '#FF6B5E',
    bg: 'rgba(255,107,94,0.1)',
    emoji: '✨',
  },
  {
    icon: Store,
    title: 'Katalog Bersumber',
    description: 'Periksa sumber tempat, koordinat, harga, dan jam. Data yang belum diketahui ditampilkan secara eksplisit.',
    color: '#059669',
    bg: 'rgba(5,150,105,0.1)',
    emoji: '🌿',
  },
  {
    icon: Map,
    title: 'Adaptive Replan',
    description: 'Uji keterlambatan atau penutupan tempat, lalu bandingkan perubahan. Waktu perjalanan masih estimasi heuristik.',
    color: '#176B67',
    bg: 'rgba(23,107,103,0.1)',
    emoji: '🗺️',
  },
  {
    icon: Award,
    title: 'Budget Transparan',
    description: 'Lihat ledger biaya dan asumsi grup. Estimasi alokasi tidak dianggap transaksi atau dampak ekonomi terukur.',
    color: '#D97706',
    bg: 'rgba(217,119,6,0.1)',
    emoji: '🏆',
  },
];

const steps = [
  { step: '01', title: 'Ketik Destinasi', desc: 'Pilot Yogyakarta, 1-3 hari dengan mobil', emoji: '📍' },
  { step: '02', title: 'Periksa & Susun Jadwal', desc: 'Periksa hasil parser dan asumsi sebelum backend menyusun jadwal', emoji: '🤖' },
  { step: '03', title: 'Jelajahi & Nikmati', desc: 'Simpan pada browser, revisi jadwal, dan buka navigasi', emoji: '🌟' },
];

function LandingPage() {
  const navigate = useNavigate();
  const [heroIdx, setHeroIdx] = useState(0);
  const [prevIdx, setPrevIdx] = useState(null);
  const [destination, setDestination] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const heroRef = useRef(null);

  // Auto-rotate hero
  useEffect(() => {
    const timer = setInterval(() => {
      setPrevIdx(heroIdx);
      setHeroIdx((prev) => (prev + 1) % heroDestinations.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroIdx]);

  const handleStart = (dest) => {
    if (dest || destination) {
      navigate('/create', { state: { destination: dest || destination } });
    } else {
      navigate('/create');
    }
  };

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen font-sans" style={{ background: '#0a1615' }}>
      {/* ─── Top Nav ─────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 transition-all">
        <div
          className="absolute inset-0 transition-all duration-500"
          style={{ background: 'linear-gradient(to bottom, rgba(10,22,21,0.95), transparent)' }}
        />
        <button
          onClick={() => navigate('/')}
          className="relative flex items-center gap-2 cursor-pointer focus:outline-none"
        >
          <img
            src={logoFull}
            alt="TRIPIN"
            className="h-9 md:h-10 w-auto object-contain"
            style={{ filter: 'brightness(1.1) drop-shadow(0 2px 12px rgba(255,200,87,0.3))' }}
          />
        </button>
        <div className="relative flex items-center gap-3">
          <Link to="/my-itineraries" className="text-white/75 hover:text-white font-semibold text-sm">My Trips</Link>
          <Link to="/create" className="font-bold text-sm px-5 py-2.5 rounded-xl bg-coral text-white">Mulai rencana</Link>
        </div>
      </nav>

      {/* ─── Hero Section ───────────────────────────────────── */}
      <section ref={heroRef} className="relative h-screen flex items-center overflow-hidden">
        {/* Background images with crossfade */}
        <div className="absolute inset-0">
          {heroDestinations.map((dest, idx) => (
            <div
              key={dest.name}
              className="absolute inset-0 transition-opacity duration-1000"
              style={{
                opacity: idx === heroIdx ? 1 : 0,
                zIndex: idx === heroIdx ? 1 : 0,
              }}
            >
              <img
                src={dest.image}
                alt={dest.name}
                className="w-full h-full object-cover"
                style={{
                  transform: idx === heroIdx ? 'scale(1.04)' : 'scale(1)',
                  transition: 'transform 6s ease-out',
                }}
              />
            </div>
          ))}
          {/* Multi-layer overlay */}
          <div
            className="absolute inset-0 z-10"
            style={{
              background: 'linear-gradient(160deg, rgba(10,22,21,0.8) 0%, rgba(23,107,103,0.5) 40%, rgba(10,22,21,0.75) 100%)',
            }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 z-10"
            style={{ height: '45%', background: 'linear-gradient(to top, rgba(10,22,21,0.95), transparent)' }}
          />
        </div>

        {/* Hero content */}
        <div className="relative z-20 max-w-6xl mx-auto px-6 md:px-12 w-full">
          {/* Region badge */}
          <div className="animate-fadeInUp mb-6">
            <span
              className="inline-flex items-center gap-2 text-xs font-bold px-4 py-1.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.12)', color: '#FFC857', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,200,87,0.25)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-trip animate-pulse-soft" />
              {heroDestinations[heroIdx].region} · {heroDestinations[heroIdx].name}
            </span>
          </div>

          <div className="max-w-2xl">
            <h1
              className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.05] mb-4 tracking-tight animate-fadeInUp"
              style={{ animationDelay: '50ms', textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}
            >
              Jelajahi Negeri,<br />
              <span style={{ background: 'linear-gradient(135deg, #FFC857 0%, #FF6B5E 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Berdayakan Lokal.
              </span>
            </h1>

            <p
              className="text-white/80 text-base md:text-lg leading-relaxed mb-8 max-w-lg animate-fadeInUp"
              style={{ animationDelay: '100ms' }}
            >
              {heroDestinations[heroIdx].tagline} - Inspirasi Nusantara. Planner aktif mendukung Yogyakarta 1-3 hari; tujuan lain belum tersedia.
            </p>

            {/* Search box */}
            <div
              className="animate-fadeInUp"
              style={{ animationDelay: '150ms' }}
            >
              <div
                className="flex gap-2 p-2 rounded-2xl transition-all duration-300 max-w-xl"
                style={{
                  background: 'rgba(255,255,255,0.97)',
                  boxShadow: inputFocused
                    ? '0 0 0 3px rgba(23,107,103,0.3), 0 20px 60px rgba(0,0,0,0.3)'
                    : '0 20px 60px rgba(0,0,0,0.25)',
                }}
              >
                <div className="flex-1 flex items-center gap-3 px-3">
                  <Map size={18} style={{ color: '#176B67', flexShrink: 0 }} />
                  <input
                    type="text"
                    placeholder="Mau ke mana? Bali, Danau Toba, Bromo..."
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    className="w-full text-charcoal placeholder:text-gray-400 text-sm md:text-base outline-none bg-transparent font-medium"
                  />
                </div>
                <button
                  onClick={() => handleStart()}
                  className="font-bold px-6 py-3 rounded-xl flex items-center gap-2 text-sm md:text-base whitespace-nowrap transition-all hover:scale-[1.03] btn-press"
                  style={{
                    background: 'linear-gradient(135deg, #FF6B5E 0%, #E55A4E 100%)',
                    color: 'white',
                    boxShadow: '0 4px 16px rgba(255,107,94,0.4)',
                  }}
                >
                  Susun Rute
                  <ArrowRight size={16} />
                </button>
              </div>

              {/* Quick suggestions */}
              <div className="flex flex-wrap items-center gap-2 mt-4 text-xs text-white/65">
                <span className="font-semibold">Populer:</span>
                {['Labuan Bajo', 'Danau Toba', 'Tana Toraja', 'Raja Ampat', 'Bandung', 'Bromo'].map((place) => (
                  <button
                    key={place}
                    onClick={() => handleStart(place)}
                    className="px-3 py-1 rounded-full font-semibold transition-all hover:scale-105 btn-press"
                    style={{
                      background: 'rgba(255,255,255,0.14)',
                      color: 'rgba(255,255,255,0.9)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    {place}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Hero dots indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {heroDestinations.map((_, idx) => (
            <button
              key={idx}
              onClick={() => { setPrevIdx(heroIdx); setHeroIdx(idx); }}
              className="transition-all duration-300"
              style={{
                width: idx === heroIdx ? 24 : 7,
                height: 7,
                borderRadius: 100,
                background: idx === heroIdx ? '#FFC857' : 'rgba(255,255,255,0.35)',
              }}
            />
          ))}
        </div>

        {/* Scroll hint */}
        <button
          onClick={scrollToFeatures}
          className="absolute bottom-10 right-8 md:right-12 z-20 flex flex-col items-center gap-1 text-white/50 hover:text-white/80 transition-colors"
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider">Scroll</span>
          <ChevronDown size={16} className="animate-bounce-gentle" />
        </button>
      </section>

      {/* ─── How it works ────────────────────────────────────── */}
      <section className="py-20 px-6 md:px-12" style={{ background: 'linear-gradient(to bottom, #0a1615, #0d1f1d)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-bold tracking-widest uppercase text-teal-light mb-3 block" style={{ color: '#1E8A85' }}>
              Cara Kerja
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight">
              3 Langkah ke Liburan Impian
            </h2>
            <p className="text-white/55 text-sm max-w-md mx-auto">
              Dari niat sampai berangkat — semua dipandu TRIPIN
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <div
                key={s.step}
                className="relative p-6 rounded-3xl animate-fadeInUp"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  animationDelay: `${i * 100}ms`,
                }}
              >
                <div className="text-4xl mb-4">{s.emoji}</div>
                <div
                  className="text-xs font-black mb-2"
                  style={{ color: 'rgba(255,200,87,0.6)', letterSpacing: '0.1em' }}
                >
                  LANGKAH {s.step}
                </div>
                <h3 className="text-white font-extrabold text-lg mb-2 leading-tight">{s.title}</h3>
                <p className="text-white/55 text-sm leading-relaxed">{s.desc}</p>
                {i < steps.length - 1 && (
                  <div
                    className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10"
                    style={{ color: 'rgba(255,255,255,0.2)' }}
                  >
                    <ChevronRight size={22} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features Grid ───────────────────────────────────── */}
      <section id="features" className="py-20 px-6 md:px-12" style={{ background: '#0d1f1d' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-bold tracking-widest uppercase mb-3 block" style={{ color: '#1E8A85' }}>
              Fitur Utama
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight">
              Pilar Utama{' '}
              <span style={{ background: 'linear-gradient(135deg, #FF6B5E 0%, #FFC857 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                TRIPIN
              </span>
            </h2>
            <p className="text-white/50 text-sm max-w-lg mx-auto">
              Satu ekosistem terpadu untuk merencanakan liburan impian & menggerakkan pariwisata berkelanjutan
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feat, i) => (
              <div
                key={feat.title}
                className="p-6 rounded-3xl transition-all duration-300 hover:-translate-y-2 group animate-fadeInUp cursor-default"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  animationDelay: `${i * 80}ms`,
                }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-5 group-hover:scale-110 transition-transform"
                  style={{ background: feat.bg }}
                >
                  {feat.emoji}
                </div>
                <h3 className="text-white font-extrabold text-base mb-2">{feat.title}</h3>
                <p className="text-white/50 text-xs leading-relaxed">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Destination Showcase ────────────────────────────── */}
      <section className="py-20 px-6 md:px-12" style={{ background: '#0a1615' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <span className="text-xs font-bold tracking-widest uppercase mb-2 block" style={{ color: '#1E8A85' }}>
                Destinasi
              </span>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">Inspirasi Nusantara</h2><p className="text-white/60 mt-2 text-sm">Galeri inspirasi; hanya Yogyakarta tersedia untuk perencanaan saat ini.</p>
            </div>
            <button
              onClick={() => navigate('/create')}
              className="text-sm font-bold flex items-center gap-1.5 transition-all hover:gap-3"
              style={{ color: '#FFC857' }}
            >
              Buat Itinerary <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {heroDestinations.map((dest, i) => (
              <div
                key={dest.name}
                className={`relative overflow-hidden rounded-3xl cursor-pointer group transition-all duration-300 hover:-translate-y-1 ${
                  i === 0 ? 'md:row-span-2 md:col-span-1' : ''
                }`}
                style={{
                  height: i === 0 ? undefined : '200px',
                  minHeight: i === 0 ? '300px' : undefined,
                }}
                onClick={() => handleStart(dest.name)}
              >
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div
                  className="absolute inset-0 transition-opacity duration-300"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 60%)' }}
                />
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'rgba(23,107,103,0.3)' }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">{dest.region}</span>
                  <h3 className="text-white font-extrabold text-base md:text-lg leading-tight">{dest.name}</h3>
                </div>
                <div
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0"
                >
                  <span
                    className="text-xs font-bold px-3 py-1.5 rounded-full"
                    style={{ background: 'rgba(255,107,94,0.9)', color: 'white' }}
                  >
                    Susun Rute
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─────────────────────────────────────── */}
      <section
        className="py-24 px-6 text-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0F4A47 0%, #176B67 50%, #1E8A85 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,200,87,0.4) 0%, transparent 60%), radial-gradient(circle at 80% 50%, rgba(255,107,94,0.3) 0%, transparent 60%)',
          }}
        />
        <div className="relative max-w-2xl mx-auto">
          <div className="text-5xl mb-6 animate-float">🗺️</div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight leading-tight">
            Mulai Rencanakan<br />Perjalananmu Sekarang
          </h2>
          <p className="text-white/70 text-sm md:text-base mb-10 max-w-lg mx-auto leading-relaxed">
            Dukung ratusan pengrajin, pedagang kuliner lokal, dan pemandu wisata di seluruh nusantara melalui setiap perjalananmu.
          </p>
          <button
            onClick={() => navigate('/create')}
            className="font-extrabold text-base px-10 py-4 rounded-2xl inline-flex items-center gap-3 transition-all hover:scale-[1.04] btn-press"
            style={{
              background: 'linear-gradient(135deg, #FF6B5E 0%, #E55A4E 100%)',
              color: 'white',
              boxShadow: '0 12px 40px rgba(255,107,94,0.5)',
            }}
          >
            Buat Itinerary Pertama
            <ArrowRight size={18} />
          </button>
          <p className="mt-4 text-white/40 text-xs">Gratis · Tanpa Daftar · Open Platform</p>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────── */}
      <footer
        className="py-12 px-6 md:px-12 border-t"
        style={{ background: '#0a1615', borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <img
              src={logoFull}
              alt="TRIPIN"
              className="h-9 w-auto object-contain"
              style={{ filter: 'brightness(1.05) drop-shadow(0 2px 8px rgba(255,200,87,0.2))' }}
            />
            <p className="text-white/40 text-xs text-center md:text-left max-w-xs mt-1">
              Guest travel planner Yogyakarta - katalog bersumber - estimasi dan data unknown terbuka.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-xs text-white/50">
            {[
              { label: 'Home', path: '/' },
              { label: 'Local Discovery', path: '/discovery' },
              { label: 'Plan a Trip', path: '/create' },
              { label: 'My Itineraries', path: '/my-itineraries' },
            ].map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className="hover:text-yellow-trip transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>
          <div className="text-xs text-white/25 text-center md:text-right">
            © {new Date().getFullYear()} TRIPIN. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
