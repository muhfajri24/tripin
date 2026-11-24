import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Store,
  Map,
  Award,
  ArrowRight,
  ChevronDown,
  Search,
  Compass,
  MapPin,
  TrendingUp,
  Volume2,
  VolumeX,
  CheckCircle2,
  Wallet
} from 'lucide-react';
import logoFull from '../assets/logo-full.png';
import {
  TiltCard,
  MagneticButton,
  RevealOnScroll,
  StaggerContainer,
  AnimatedIcon,
  useReducedMotion
} from '../motion';

const heroDestinations = [
  { name: 'Banda Neira',    image: '/images/hero/hero-bandaneira.jpg', tagline: 'Benteng Belgica & Surga Rempah Banda Neira', region: 'Maluku', island: 'Maluku & Papua' },
  { name: 'Yogyakarta',     image: '/images/hero/hero-malioboro.jpg',  tagline: 'Suasana Syahdu Malioboro & Budaya Keraton',  region: 'D.I. Yogyakarta', island: 'Jawa' },
  { name: 'Gunung Bromo',   image: '/images/hero/hero-bromo.jpg',      tagline: 'Lautan Pasir & Keajaiban Matahari Terbit',   region: 'Jawa Timur', island: 'Jawa' },
  { name: 'Bali',           image: '/images/hero/hero-bali.jpg',       tagline: 'Pesona Tebing & Birunya Pantai Dewata',      region: 'Bali', island: 'Bali & Nusa Tenggara' },
  { name: 'Raja Ampat',     image: '/images/hero/hero-rajaampat.jpg',  tagline: 'Surga Karang Dunia & Gugusan Karst',        region: 'Papua Barat', island: 'Maluku & Papua' },
  { name: 'Palembang',      image: '/images/hero/hero-ampera.jpg',     tagline: 'Ikon Megah Jembatan Ampera & Sungai Musi',   region: 'Sumatra Selatan', island: 'Sumatra' },
];

const impactStats = [
  { value: '38', suffix: '', label: 'Provinsi Nusantara', sub: 'Dari Sabang sampai Merauke', icon: MapPin },
  { value: '500', suffix: '+', label: 'UMKM Lokal Terkurasi', sub: 'Kuliner, kriya & pemandu lokal', icon: Store },
  { value: '3', suffix: ' Mode', label: 'Optimasi AI Cerdas', sub: 'Hemat Biaya, Waktu & Eksplorasi', icon: Compass },
  { value: '0', suffix: ' Rp', label: 'Bebas Biaya Akses', sub: '100% platform terbuka', icon: Wallet },
];

const features = [
  {
    icon: Sparkles,
    variant: 'bounce',
    title: 'AI Trip Planner',
    description: 'Satu instruksi bahasa sehari-hari menghasilkan jadwal teroptimasi otomatis sesuai budget, durasi, dan minat wisata.',
    badge: 'Cepat & Cerdas',
    color: '#FF6B5E',
    bg: 'rgba(255,107,94,0.12)',
  },
  {
    icon: Store,
    variant: 'pulse',
    title: 'Local Discovery & UMKM',
    description: 'Rekomendasi warung kuliner legendaris, bengkel kerajinan tangan, dan hidden gems yang memberdayakan ekonomi warga (SDG 8).',
    badge: 'Dukung Lokal',
    color: '#2EC4B6',
    bg: 'rgba(46,196,182,0.12)',
  },
  {
    icon: Map,
    variant: 'wiggle',
    title: 'Smart Route Optimizer',
    description: 'Perhitungan rute geografis cerdas yang meminimalkan waktu di jalan dan memaksimalkan momen berkesan di destinasi.',
    badge: 'Efisien',
    color: '#FFC857',
    bg: 'rgba(255,200,87,0.12)',
  },
  {
    icon: Award,
    variant: 'rotate',
    title: 'Impact Dashboard',
    description: 'Pantau kontribusi nyata setiap rupiah perjalanan Anda terhadap keberlanjutan wisata dan pelaku usaha lokal (SDG 12).',
    badge: 'Berdampak',
    color: '#1E8A85',
    bg: 'rgba(30,138,133,0.15)',
  },
];

const islandTabs = [
  { id: 'all', label: 'Semua Pulau' },
  { id: 'Sumatra', label: 'Sumatra' },
  { id: 'Jawa', label: 'Jawa' },
  { id: 'Bali & Nusa Tenggara', label: 'Bali & Nusa Tenggara' },
  { id: 'Kalimantan', label: 'Kalimantan' },
  { id: 'Sulawesi', label: 'Sulawesi' },
  { id: 'Maluku & Papua', label: 'Maluku & Papua' },
];

const showcaseDestinations = [
  {
    name: 'Banda Neira',
    island: 'Maluku & Papua',
    region: 'Maluku Tengah',
    image: '/images/hero/hero-bandaneira.jpg',
    tagline: 'Benteng Belgica & pala bersejarah',
    umkm: '18 UMKM Terdaftar',
    highlight: 'Snorkeling Karang & Rempah',
  },
  {
    name: 'Yogyakarta',
    island: 'Jawa',
    region: 'D.I. Yogyakarta',
    image: '/images/hero/hero-malioboro.jpg',
    tagline: 'Gudeg legendaris & seni batik',
    umkm: '42 UMKM Terdaftar',
    highlight: 'Budaya & Heritage Keraton',
  },
  {
    name: 'Gunung Bromo',
    island: 'Jawa',
    region: 'Jawa Timur',
    image: '/images/hero/hero-bromo.jpg',
    tagline: 'Lautan pasir & sunrise megah',
    umkm: '26 Paguyuban Jeep & Kuda',
    highlight: 'Pesona Alam Vulkanik',
  },
  {
    name: 'Bali (Nusa Dua & Uluwatu)',
    island: 'Bali & Nusa Tenggara',
    region: 'Bali',
    image: '/images/hero/hero-bali.jpg',
    tagline: 'Tari Kecak tebing karang & sunset',
    umkm: '55 Koperasi Seni Lokal',
    highlight: 'Seni Budaya & Pantai',
  },
  {
    name: 'Raja Ampat',
    island: 'Maluku & Papua',
    region: 'Papua Barat',
    image: '/images/hero/hero-rajaampat.jpg',
    tagline: 'Kepulauan karst & 75% spesies karang',
    umkm: '14 Homestay Bahari Adat',
    highlight: 'Surga Selam Dunia',
  },
  {
    name: 'Palembang',
    island: 'Sumatra',
    region: 'Sumatra Selatan',
    image: '/images/hero/hero-ampera.jpg',
    tagline: 'Jembatan Ampera & pempek otentik',
    umkm: '34 Sentra Kuliner Musi',
    highlight: 'Wisata Sungai & Kuliner',
  },
];

const steps = [
  {
    step: '01',
    title: 'Ketik Destinasi Impian',
    desc: 'Ceritakan tujuan, jumlah hari, budget perkiraan, atau cukup ketik destinasi yang ingin Anda kunjungi di Indonesia.',
    emoji: '📍',
  },
  {
    step: '02',
    title: 'AI Optimasi Rute & UMKM',
    desc: 'Dalam hitungan detik, mesin AI merangkai jadwal efisien, rute logis, serta memasukkan warung lokal dan penginapan khas.',
    emoji: '⚡',
  },
  {
    step: '03',
    title: 'Jelajahi & Berdayakan',
    desc: 'Buka itinerary interaktif di peta, navigasi rute fleksibel, dan nikmati petualangan sambil mendukung pelaku wisata lokal.',
    emoji: '🌿',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const prefersReduced = useReducedMotion();

  const [heroIdx, setHeroIdx] = useState(0);
  const [destination, setDestination] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [selectedIsland, setSelectedIsland] = useState('all');
  const [isAmbientActive, setIsAmbientActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-rotate hero slides every 5.5 seconds (paused when user hovers search or controls)
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setHeroIdx((prev) => (prev + 1) % heroDestinations.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isPaused]);

  const handleStart = (dest) => {
    const target = dest || destination;
    if (target && target.trim()) {
      navigate('/create', { state: { destination: target.trim() } });
    } else {
      navigate('/create');
    }
  };

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredShowcase = selectedIsland === 'all'
    ? showcaseDestinations
    : showcaseDestinations.filter((d) => d.island === selectedIsland);

  return (
    <div className="min-h-screen bg-[#0a1615] text-white font-sans selection:bg-coral selection:text-white overflow-x-hidden">
      {/* ─── Modern Glassmorphic Top Nav ─────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
        <div className="absolute inset-0 bg-[#0a1615]/80 backdrop-blur-md border-b border-white/[0.08]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo with warm glow */}
          <button
            onClick={() => navigate('/')}
            className="group flex items-center gap-2 cursor-pointer focus:outline-none"
          >
            <img
              src={logoFull}
              alt="TRIPIN"
              className="h-9 sm:h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              style={{ filter: 'drop-shadow(0 2px 14px rgba(255,200,87,0.35))' }}
            />
          </button>

          {/* Quick Menu Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-white/70">
            <button
              onClick={() => scrollToSection('features')}
              className="hover:text-yellow-trip transition-colors cursor-pointer"
            >
              Fitur Utama
            </button>
            <button
              onClick={() => scrollToSection('destinations')}
              className="hover:text-yellow-trip transition-colors cursor-pointer"
            >
              Destinasi
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-yellow-trip transition-colors cursor-pointer"
            >
              Cara Kerja
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              Dashboard
            </button>
          </nav>

          {/* Nav Actions */}
          <div className="flex items-center gap-3">
            {/* Ambient sound wave visualizer toggle */}
            <button
              onClick={() => setIsAmbientActive(!isAmbientActive)}
              title={isAmbientActive ? 'Matikan Suasana Ombak' : 'Nyalakan Efek Suasana Ombak'}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs text-white/80 transition-all cursor-pointer"
            >
              {isAmbientActive ? (
                <>
                  <Volume2 size={14} className="text-turquoise animate-pulse" />
                  <span className="flex items-center gap-0.5">
                    <span className="w-0.5 h-3 bg-turquoise rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-0.5 h-4 bg-turquoise rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-0.5 h-2 bg-turquoise rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </>
              ) : (
                <>
                  <VolumeX size={14} className="text-white/40" />
                  <span className="text-[11px] text-white/50">Ambience</span>
                </>
              )}
            </button>

            <MagneticButton
              onClick={() => navigate('/create')}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg shadow-coral/30 hover:shadow-coral/50"
            >
              <span className="flex items-center gap-2">
                <Sparkles size={15} />
                Mulai Perjalanan
              </span>
            </MagneticButton>
          </div>
        </div>
      </header>

      {/* ─── Hero Section with Parallax Depth & Interactive Crossfade ───────────────────── */}
      <section
        className="relative min-h-[92vh] lg:min-h-screen flex items-center justify-center pt-24 pb-16 overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Dynamic Background Image Layers with crossfade */}
        <div className="absolute inset-0 pointer-events-none">
          {heroDestinations.map((dest, idx) => (
            <div
              key={dest.name}
              className="absolute inset-0 transition-opacity duration-1000 ease-out"
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
                  transform: idx === heroIdx ? 'scale(1.05)' : 'scale(1)',
                  transition: prefersReduced ? 'none' : 'transform 7s ease-out',
                }}
              />
            </div>
          ))}

          {/* Cinematic Multi-Gradient Overlays */}
          <div
            className="absolute inset-0 z-10"
            style={{
              background:
                'linear-gradient(175deg, rgba(10,22,21,0.88) 0%, rgba(23,107,103,0.45) 45%, rgba(10,22,21,0.92) 100%)',
            }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 z-10 h-48"
            style={{ background: 'linear-gradient(to top, #0a1615 15%, transparent 100%)' }}
          />
        </div>

        {/* Hero Interactive Content */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-6">
          <div className="max-w-3xl">
            {/* Live Destination & Region Pill */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-yellow-trip text-xs font-bold mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-yellow-trip animate-ping" />
              <span>{heroDestinations[heroIdx].region} · {heroDestinations[heroIdx].name}</span>
            </div>

            {/* Kinetic Hero Display Headline */}
            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.08] tracking-tight mb-5 drop-shadow-md">
              Jelajahi Negeri,<br />
              <span className="bg-gradient-to-r from-yellow-trip via-coral-light to-coral bg-clip-text text-transparent">
                Berdayakan Lokal.
              </span>
            </h1>

            <p className="text-white/80 text-base sm:text-lg sm:leading-relaxed mb-8 max-w-xl font-medium">
              {heroDestinations[heroIdx].tagline} — Platform perencana perjalanan cerdas yang
              mengoptimalkan waktu tempuh, ramah anggaran, dan menghubungkan Anda langsung dengan UMKM Nusantara.
            </p>

            {/* Interactive Search & Plan Box */}
            <div className="relative max-w-2xl mb-8">
              <div
                className={`p-2 rounded-2xl sm:rounded-3xl transition-all duration-300 flex flex-col sm:flex-row items-center gap-2 ${
                  inputFocused
                    ? 'bg-white shadow-[0_0_0_4px_rgba(46,196,182,0.4),0_24px_60px_rgba(0,0,0,0.5)]'
                    : 'bg-white/95 backdrop-blur-md shadow-2xl shadow-charcoal/40'
                }`}
              >
                <div className="w-full sm:flex-1 flex items-center gap-3 px-4 py-2 sm:py-0">
                  <Search size={20} className="text-teal flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Mau berlibur ke mana? (misal: Banda Neira, Jogja, Bromo...)"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    className="w-full bg-transparent text-charcoal placeholder:text-gray-400 text-sm sm:text-base font-semibold outline-none"
                  />
                </div>

                <MagneticButton
                  onClick={() => handleStart()}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-coral to-coral-dark text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-xl transition-all"
                >
                  Susun Rute
                  <ArrowRight size={18} />
                </MagneticButton>
              </div>

              {/* Quick Destination Chips */}
              <div className="flex flex-wrap items-center gap-2 mt-4 text-xs text-white/70">
                <span className="font-semibold text-white/50 flex items-center gap-1">
                  <TrendingUp size={13} className="text-yellow-trip" />
                  Populer:
                </span>
                {['Banda Neira', 'Yogyakarta', 'Bromo', 'Raja Ampat', 'Bali', 'Palembang'].map((spot) => (
                  <button
                    key={spot}
                    onClick={() => handleStart(spot)}
                    className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white font-medium transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    {spot}
                  </button>
                ))}
              </div>
            </div>

            {/* Thumbnail destination strip selector */}
            <div className="pt-2 flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
              <span className="text-[11px] font-bold text-white/50 uppercase tracking-widest flex-shrink-0 mr-1">
                Jelajah Titik:
              </span>
              {heroDestinations.map((d, i) => (
                <button
                  key={d.name}
                  onClick={() => setHeroIdx(i)}
                  className={`group relative flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-300 cursor-pointer ${
                    i === heroIdx
                      ? 'bg-yellow-trip/20 border-yellow-trip text-yellow-trip scale-105'
                      : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/30'
                  }`}
                >
                  <img
                    src={d.image}
                    alt={d.name}
                    className="w-5 h-5 rounded-md object-cover"
                  />
                  <span>{d.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Slide Progress Dots Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {heroDestinations.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroIdx(i)}
              className="h-2 rounded-full transition-all duration-300 cursor-pointer"
              style={{
                width: i === heroIdx ? 28 : 8,
                background: i === heroIdx ? '#FFC857' : 'rgba(255,255,255,0.3)',
              }}
              title={`Slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Scroll Hint */}
        <button
          onClick={() => scrollToSection('impact-stats')}
          className="absolute bottom-6 right-6 sm:right-10 z-20 flex flex-col items-center gap-1 text-white/50 hover:text-white transition-colors cursor-pointer"
        >
          <span className="text-[10px] font-bold tracking-widest uppercase">Scroll</span>
          <ChevronDown size={16} className="animate-bounce" />
        </button>
      </section>

      {/* ─── Live Impact Counters Section ─────────────────────────────────────────── */}
      <section id="impact-stats" className="py-14 bg-[#0d1f1d] border-y border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealOnScroll direction="up">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {impactStats.map((item, idx) => {
                const IconComp = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-turquoise/30 transition-all duration-300 hover:-translate-y-1 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-teal/20 text-turquoise flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <IconComp size={20} />
                    </div>
                    <div className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-1 flex items-baseline">
                      <span>{item.value}</span>
                      <span className="text-yellow-trip text-xl font-bold ml-1">{item.suffix}</span>
                    </div>
                    <h3 className="text-white text-sm font-bold">{item.label}</h3>
                    <p className="text-white/50 text-xs mt-0.5">{item.sub}</p>
                  </div>
                );
              })}
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ─── 4 Core Pillars with 3D TiltCards & AnimatedIcons ───────────────────────── */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <RevealOnScroll direction="up">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block text-xs font-bold tracking-widest uppercase text-turquoise mb-3 px-3 py-1 rounded-full bg-teal/20 border border-teal/30">
              Keunggulan Utama
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
              Pengalaman Berwisata yang Cerdas & Penuh Makna
            </h2>
            <p className="text-white/60 text-sm sm:text-base">
              TRIPIN bukan sekadar perencana rute biasa. Kami memadukan kecerdasan buatan dengan misi
              pemberdayaan ekonomi lokal di seluruh kepulauan Nusantara.
            </p>
          </div>
        </RevealOnScroll>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, i) => (
            <TiltCard
              key={feat.title}
              maxTilt={12}
              className="p-6 rounded-3xl bg-white/[0.04] border border-white/[0.08] hover:border-white/20 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white"
                    style={{ background: feat.bg, color: feat.color }}
                  >
                    <AnimatedIcon
                      icon={feat.icon}
                      variant={feat.variant}
                      size={26}
                    />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/10 text-white/80">
                    {feat.badge}
                  </span>
                </div>

                <h3 className="font-display text-xl font-bold text-white mb-2.5">
                  {feat.title}
                </h3>
                <p className="text-white/60 text-xs sm:text-sm leading-relaxed mb-6">
                  {feat.description}
                </p>
              </div>

              <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-semibold text-turquoise">
                <span>Pelajari rute ini</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </TiltCard>
          ))}
        </StaggerContainer>
      </section>

      {/* ─── Interactive Nusantara Island Explorer ─────────────────────────────────── */}
      <section id="destinations" className="py-24 bg-[#0a1b19] border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealOnScroll direction="up">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div>
                <span className="text-xs font-bold tracking-widest uppercase text-yellow-trip mb-2 block">
                  Eksplorasi Wilayah
                </span>
                <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Jelajahi Berdasarkan Pulau
                </h2>
                <p className="text-white/60 text-xs sm:text-sm mt-1 max-w-lg">
                  Pilih kepulauan Nusantara untuk melihat destinasi terkurasi, kearifan lokal, dan potensi UMKM di setiap titik.
                </p>
              </div>

              <MagneticButton
                onClick={() => navigate('/discovery')}
                className="self-start md:self-auto px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white"
              >
                Buka Local Discovery Penuh →
              </MagneticButton>
            </div>

            {/* Island Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
              {islandTabs.map((tab) => {
                const isActive = selectedIsland === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedIsland(tab.id)}
                    className={`relative px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-teal to-turquoise text-white shadow-md'
                        : 'bg-white/[0.05] text-white/60 hover:text-white hover:bg-white/[0.09]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </RevealOnScroll>

          {/* Destination Grid with 3D TiltCards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredShowcase.map((item, idx) => (
              <TiltCard
                key={item.name}
                maxTilt={10}
                className="group relative rounded-3xl overflow-hidden bg-charcoal/40 border border-white/10 cursor-pointer shadow-lg hover:shadow-2xl hover:border-turquoise/40 transition-all duration-300"
                onClick={() => handleStart(item.name)}
              >
                {/* Image & Gradient */}
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a1b19] via-transparent to-black/30" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/10">
                      {item.island}
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-yellow-trip/90 text-charcoal">
                      ★ Rekomendasi
                    </span>
                  </div>

                  {/* Bottom Image Tag */}
                  <div className="absolute bottom-3 left-4 right-4">
                    <span className="text-white/70 text-xs font-semibold">{item.region}</span>
                    <h3 className="font-display text-xl font-extrabold text-white leading-tight">
                      {item.name}
                    </h3>
                  </div>
                </div>

                {/* Card Meta Content */}
                <div className="p-5">
                  <p className="text-white/70 text-xs mb-4 line-clamp-1">
                    {item.tagline}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-white/[0.08] text-xs">
                    <div className="flex items-center gap-1.5 text-turquoise font-semibold">
                      <Store size={14} />
                      <span>{item.umkm}</span>
                    </div>

                    <span className="text-coral-light font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Susun Rute
                      <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it Works (3 Langkah Interaktif) ─────────────────────────────────── */}
      <section id="how-it-works" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <RevealOnScroll direction="up">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold tracking-widest uppercase text-turquoise mb-2 block">
              Alur Pengguna
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-3">
              3 Langkah ke Liburan Impian
            </h2>
            <p className="text-white/60 text-sm">
              Mudah, cepat, dan otomatis disesuaikan dengan preferensi serta durasi perjalanan Anda.
            </p>
          </div>
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {steps.map((st, i) => (
            <RevealOnScroll key={st.step} direction="up" delay={i * 0.15}>
              <div className="p-8 rounded-3xl bg-white/[0.04] border border-white/[0.08] relative group hover:border-turquoise/40 transition-all duration-300 hover:-translate-y-1.5">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-4xl">{st.emoji}</span>
                  <span className="font-display text-2xl font-black text-white/20 group-hover:text-turquoise transition-colors">
                    {st.step}
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold text-white mb-2 leading-snug">
                  {st.title}
                </h3>
                <p className="text-white/60 text-xs sm:text-sm leading-relaxed">
                  {st.desc}
                </p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      {/* ─── Grand Finale CTA Section ────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-br from-[#0F4A47] via-[#176B67] to-[#1E8A85] text-center">
        {/* Ambient background particles */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, rgba(255,200,87,0.5) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255,107,94,0.4) 0%, transparent 50%)',
          }}
        />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 z-10">
          <RevealOnScroll direction="scale">
            <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-md mx-auto mb-6 flex items-center justify-center text-3xl shadow-xl border border-white/20">
              🧭
            </div>

            <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
              Siap Memulai Petualangan<br />Nusantara Anda?
            </h2>

            <p className="text-white/80 text-sm sm:text-base leading-relaxed mb-10 max-w-xl mx-auto">
              Setiap langkah perjalanan yang Anda buat bersama TRIPIN turut menggerakkan roda ekonomi
              ratusan pelaku usaha dan komunitas lokal di seluruh Indonesia.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <MagneticButton
                onClick={() => navigate('/create')}
                className="w-full sm:w-auto px-9 py-4 rounded-2xl bg-gradient-to-r from-coral to-coral-dark text-white font-extrabold text-base shadow-2xl shadow-coral/50 hover:scale-105 transition-all"
              >
                <span className="flex items-center justify-center gap-2.5">
                  Buat Itinerary Pertama
                  <ArrowRight size={18} />
                </span>
              </MagneticButton>

              <MagneticButton
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-base transition-all"
              >
                Lihat Inspirasi Dashboard
              </MagneticButton>
            </div>

            <div className="flex items-center justify-center gap-6 mt-8 text-xs text-white/60 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-yellow-trip" />
                100% Gratis & Terbuka
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-turquoise" />
                Tanpa Perlu Registrasi
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-coral-light" />
                Dukung SDG 8 & 12
              </span>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ─── Modern Footer ───────────────────────────────────────────────────────── */}
      <footer className="py-12 bg-[#06100f] border-t border-white/[0.08] text-xs text-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2 text-center md:text-left">
            <img
              src={logoFull}
              alt="TRIPIN"
              className="h-8 w-auto object-contain brightness-110"
            />
            <p className="max-w-sm text-white/40">
              Platform Cerdas AI Perencana Perjalanan Wisata Indonesia — Mengoptimalkan rute,
              menghemat biaya, dan memberdayakan UMKM lokal Sabang sampai Merauke.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-white/60 font-medium">
            <button onClick={() => navigate('/dashboard')} className="hover:text-yellow-trip transition-colors cursor-pointer">
              Dashboard
            </button>
            <button onClick={() => navigate('/discovery')} className="hover:text-yellow-trip transition-colors cursor-pointer">
              Local Discovery
            </button>
            <button onClick={() => navigate('/create')} className="hover:text-yellow-trip transition-colors cursor-pointer">
              AI Trip Planner
            </button>
            <button onClick={() => navigate('/my-itineraries')} className="hover:text-yellow-trip transition-colors cursor-pointer">
              My Itineraries
            </button>
            <button onClick={() => navigate('/settings')} className="hover:text-yellow-trip transition-colors cursor-pointer">
              Settings
            </button>
          </div>

          <div className="text-white/30 text-center md:text-right">
            © 2026 TRIPIN. Seluruh hak cipta dilindungi undang-undang.
          </div>
        </div>
      </footer>
    </div>
  );
}
