import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, ArrowRight, Sparkles, Map, Store, Wallet, Star, ChevronDown, Award } from 'lucide-react';
import { mockRecommendations } from '../data/mockData';

const heroDestinations = [
  {
    name: 'Banda Neira',
    image: '/images/hero/hero-bandaneira.jpg',
    tagline: 'Benteng Belgica & Kemegahan Banda Neira',
  },
  {
    name: 'Yogyakarta',
    image: '/images/hero/hero-malioboro.jpg',
    tagline: 'Suasana Syahdu Malioboro & Budaya Keraton',
  },
  {
    name: 'Gunung Bromo',
    image: '/images/hero/hero-bromo.jpg',
    tagline: 'Lautan Pasir & Keindahan Mentari Bromo',
  },
  {
    name: 'Bali',
    image: '/images/hero/hero-bali.jpg',
    tagline: 'Pesona Tebing & Birunya Pantai Dewata',
  },
  {
    name: 'Raja Ampat',
    image: '/images/hero/hero-rajaampat.jpg',
    tagline: 'Surga Karang Dunia & Gugusan Pulau Karst',
  },
  {
    name: 'Palembang',
    image: '/images/hero/hero-ampera.jpg',
    tagline: 'Ikon Megah Jembatan Ampera & Sungai Musi',
  },
];

const features = [
  {
    icon: Sparkles,
    title: 'AI Trip Planner',
    description: 'Satu fitur cerdas menyusun jadwal otomatis sesuai anggaran, waktu, dan preferensi wisata Anda.',
    color: 'text-coral bg-coral/10',
  },
  {
    icon: Store,
    title: 'Local Discovery & UMKM',
    description: 'Temukan warung kuliner legendaris, workshop seni lokal, dan hidden gems yang menggerakkan ekonomi warga (SDG 8).',
    color: 'text-emerald-700 bg-emerald-100',
  },
  {
    icon: Map,
    title: 'Smart Route Optimizer',
    description: 'Optimasi urutan destinasi secara otomatis untuk meminimalkan waktu tempuh dan memaksimalkan pengalaman.',
    color: 'text-teal bg-teal/10',
  },
  {
    icon: Award,
    title: 'Impact Dashboard',
    description: 'Pantau langsung seberapa besar kontribusi nyata belanja perjalanan Anda bagi pelaku usaha lokal.',
    color: 'text-amber-700 bg-amber-100',
  },
];

function LandingPage() {
  const navigate = useNavigate();
  const [heroIdx, setHeroIdx] = useState(0);
  const [destination, setDestination] = useState('');

  // Background rotasi otomatis setiap 5 detik
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIdx((prev) => (prev + 1) % heroDestinations.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleStart = (dest) => {
    if (dest || destination) {
      navigate('/create', { state: { destination: dest || destination } });
    } else {
      navigate('/create');
    }
  };

  return (
    <div className="min-h-screen bg-cream font-sans">
      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 bg-transparent">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <img
            src="/logo-full.png"
            alt="TRIPIN"
            className="h-10 w-auto object-contain drop-shadow-md"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="hidden sm:block text-white/90 hover:text-white font-medium text-sm transition-colors"
          >
            Masuk Dashboard
          </button>
          <button
            onClick={() => navigate('/create')}
            className="bg-coral hover:bg-coral-dark text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-coral transition-all"
          >
            Mulai Perjalanan
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center overflow-hidden">
        {/* Slideshow background dengan crossfade transisi mulus */}
        <div className="absolute inset-0">
          {heroDestinations.map((dest, idx) => (
            <img
              key={dest.name}
              src={dest.image}
              alt={dest.name}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                idx === heroIdx ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
              }`}
              style={{ transitionProperty: 'opacity, transform', transitionDuration: '1000ms' }}
            />
          ))}
          <div className="hero-overlay absolute inset-0 z-[1]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 w-full">
          <div className="max-w-2xl animate-fadeInUp">
            <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-4 tracking-tight">
              Jelajahi Negeri,<br />
              <span className="text-yellow-trip">Berdayakan UMKM Lokal.</span>
            </h1>

            <p className="text-white/85 text-base md:text-lg leading-relaxed mb-8 max-w-lg">
              Susun itinerary otomatis berbasis AI yang dirancang cerdas untuk menghemat waktu & budget Anda, sembari membuka akses rezeki bagi para pelaku usaha lokal.
            </p>

            {/* Quick Search */}
            <div className="bg-white rounded-2xl p-2 flex gap-2 shadow-2xl max-w-xl">
              <div className="flex-1 flex items-center gap-3 px-3">
                <Map size={18} className="text-teal flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Mau liburan ke mana di Indonesia? (contoh: Danau Toba, Labuan Bajo)"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                  className="w-full text-charcoal placeholder:text-gray-400 text-sm sm:text-base outline-none bg-transparent"
                />
              </div>
              <button
                onClick={() => handleStart()}
                className="bg-gradient-to-r from-coral to-coral-dark text-white font-bold px-6 py-3 rounded-xl hover:shadow-coral transition-all flex items-center gap-2 whitespace-nowrap text-sm sm:text-base"
              >
                Susun Rute
                <ArrowRight size={16} />
              </button>
            </div>

            {/* Quick Suggestions */}
            <div className="flex flex-wrap items-center gap-2 mt-4 text-xs text-white/70">
              <span>Pilihan favorit:</span>
              {['Labuan Bajo', 'Danau Toba', 'Tana Toraja', 'Raja Ampat', 'Bandung', 'Bromo'].map((place) => (
                <button
                  key={place}
                  onClick={() => handleStart(place)}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-3 py-1 rounded-full transition-all font-medium"
                >
                  {place}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 md:px-12 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-charcoal mb-3">
            Pilar Utama <span className="gradient-text">TRIPIN</span>
          </h2>
          <p className="text-charcoal-lighter text-sm sm:text-base max-w-lg mx-auto">
            Satu ekosistem terpadu untuk merencanakan liburan impian sekaligus menggerakkan pariwisata berkelanjutan.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat) => (
            <div key={feat.title} className="bg-white rounded-3xl p-6 shadow-soft card-hover border border-gray-100 flex flex-col justify-between">
              <div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${feat.color}`}>
                  <feat.icon size={22} />
                </div>
                <h3 className="font-bold text-charcoal text-base mb-2">{feat.title}</h3>
                <p className="text-charcoal-lighter text-xs sm:text-sm leading-relaxed">{feat.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-gradient-to-br from-teal to-teal-dark text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Mulai Rencanakan Perjalananmu Sekarang</h2>
          <p className="text-white/80 text-sm sm:text-base mb-8">
            Dukung ratusan pengrajin, pedagang kuliner lokal, dan pemandu wisata di seluruh nusantara.
          </p>
          <button
            onClick={() => navigate('/create')}
            className="bg-coral hover:bg-coral-dark text-white font-bold text-base px-8 py-3.5 rounded-2xl shadow-coral transition-all inline-flex items-center gap-2"
          >
            Buat Itinerary Pertama
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-charcoal text-white py-12 px-6 md:px-12 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <img
              src="/logo-full.png"
              alt="TRIPIN"
              className="h-10 w-auto object-contain drop-shadow"
            />
            <p className="text-white/60 text-xs text-center md:text-left max-w-sm mt-1">
              Platform AI Travel Planner & Eksplorasi UMKM Terpadu untuk Pariwisata Berkelanjutan Seluruh Indonesia (SDG 8).
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-xs text-white/75">
            <button onClick={() => navigate('/dashboard')} className="hover:text-coral transition-colors">Dashboard</button>
            <button onClick={() => navigate('/discovery')} className="hover:text-coral transition-colors">Local Discovery</button>
            <button onClick={() => navigate('/create')} className="hover:text-coral transition-colors">AI Trip Planner</button>
            <button onClick={() => navigate('/my-itineraries')} className="hover:text-coral transition-colors">My Itineraries</button>
          </div>
          <div className="text-xs text-white/40 text-center md:text-right">
            © {new Date().getFullYear()} TRIPIN. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
