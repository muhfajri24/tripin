import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Calendar, MapPin, TrendingUp, Clock, Compass,
  ArrowRight, Store, Award, Leaf
} from 'lucide-react';
import {
  mockItineraries, mockRecommendations, formatCurrency,
  getOverallImpactStats, getTripImpactStats, getStoredItineraries
} from '../data/mockData';
import RecommendationCard from '../components/RecommendationCard';
import ImpactCard from '../components/ImpactCard';

function DashboardPage() {
  const navigate = useNavigate();
  const allItineraries = getStoredItineraries();
  const itinerary = allItineraries[0] || mockItineraries[0];

  // Dynamic consistent calculations
  const overallImpact = getOverallImpactStats(allItineraries);
  const tripImpact = getTripImpactStats(itinerary);

  return (
    <div className="space-y-6 animate-fadeInUp pb-12">
      {/* Platform Title + Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal">
              Jelajahi Nusantara 👋
            </h1>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Leaf size={11} /> Open Travel Platform
            </span>
          </div>
          <p className="text-charcoal-lighter text-xs sm:text-sm mt-1">
            Rencanakan perjalanan cerdas & dukung pelaku UMKM lokal di seluruh Indonesia.
          </p>
        </div>

        <button
          onClick={() => navigate('/create')}
          className="flex items-center gap-2 bg-gradient-to-r from-coral to-coral-dark text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl hover:shadow-coral hover:scale-[1.02] transition-all self-start sm:self-auto shadow-sm"
        >
          <Sparkles size={16} />
          AI Trip Planner
        </button>
      </div>

      {/* Global Impact Dashboard (Cumulative metrics across all user trips) */}
      <ImpactCard impact={overallImpact} />

      {/* Main Grid: Upcoming Trip + Local Discovery Promo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Trip Hero (2 Cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-charcoal text-base">Itinerary Mendatang</h2>
            <button
              onClick={() => navigate('/my-itineraries')}
              className="text-teal text-xs font-semibold flex items-center gap-1 hover:gap-1.5 transition-all"
            >
              Semua Itinerary <ArrowRight size={12} />
            </button>
          </div>

          <div
            className="relative rounded-3xl overflow-hidden h-64 cursor-pointer group card-hover shadow-soft"
            onClick={() => navigate(`/itinerary/${itinerary.id}`)}
          >
            <img
              src={itinerary.coverImage}
              alt={itinerary.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="bg-teal text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                🗓 Terjadwal
              </span>
              <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow flex items-center gap-1">
                <Store size={11} /> {tripImpact.umkmCount} UMKM Mitra di Trip Ini
              </span>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <h3 className="text-white font-extrabold text-lg sm:text-xl leading-tight">
                  {itinerary.title}
                </h3>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap text-white/80 text-xs">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-coral" /> {itinerary.destination}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> {itinerary.duration}
                  </span>
                  <span className="flex items-center gap-1 text-emerald-300 font-semibold">
                    <Award size={12} /> {formatCurrency(tripImpact.estimatedLocalSpending)} belanja ke UMKM
                  </span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/itinerary/${itinerary.id}`);
                }}
                className="bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-white/30 transition-all self-start sm:self-auto"
              >
                Buka Itinerary
              </button>
            </div>
          </div>
        </div>

        {/* Local Discovery Quick Promo Widget */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-charcoal text-base">Eksplorasi Lokal</h2>
            <button
              onClick={() => navigate('/discovery')}
              className="text-teal text-xs font-semibold flex items-center gap-1"
            >
              Katalog Lengkap <ArrowRight size={12} />
            </button>
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-soft border border-gray-100 flex flex-col justify-between h-[256px]">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
                <Store size={20} />
              </div>
              <h3 className="font-bold text-charcoal text-base leading-snug">
                Temukan UMKM & Hidden Gems
              </h3>
              <p className="text-xs text-charcoal-lighter mt-1.5 leading-relaxed">
                Jelajahi sentra tenun Samosir, kopi Toraja & Flores, bengkel kapal Pinisi Bulukumba, pengrajin noken Papua, serta kuliner autentik nusantara.
              </p>
            </div>

            <button
              onClick={() => navigate('/discovery')}
              className="w-full py-2.5 bg-gradient-to-r from-teal to-teal-light text-white text-xs font-bold rounded-xl hover:shadow-teal transition-all flex items-center justify-center gap-1.5"
            >
              <Compass size={14} />
              Cari Destinasi & UMKM
            </button>
          </div>
        </div>
      </div>

      {/* Recommended Community-Based Destinations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-charcoal text-base">
              Destinasi Populer Berbasis Komunitas
            </h2>
            <p className="text-xs text-charcoal-lighter">
              Rekomendasi perjalanan yang memaksimalkan dampak ekonomi lokal
            </p>
          </div>
          <button
            onClick={() => navigate('/discovery')}
            className="text-teal text-xs font-semibold flex items-center gap-1 hover:gap-1.5 transition-all"
          >
            Lihat Semua <ArrowRight size={12} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockRecommendations.map((rec) => (
            <RecommendationCard
              key={rec.id}
              rec={rec}
              onClick={() =>
                navigate('/create', { state: { destination: rec.destination } })
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
