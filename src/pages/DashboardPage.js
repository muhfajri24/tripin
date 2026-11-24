import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Calendar, MapPin, ArrowRight, Store, Award, Compass, Leaf, TrendingUp
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
  const overallImpact = getOverallImpactStats(allItineraries);
  const tripImpact = getTripImpactStats(itinerary);

  return (
    <div className="space-y-8 animate-fadeInUp pb-16">

      {/* ── Welcome Banner ── */}
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0F4A47 0%, #176B67 60%, #1E8A85 100%)',
          boxShadow: '0 20px 60px rgba(23,107,103,0.25)',
        }}
      >
        {/* Decorative blobs */}
        <div
          className="absolute -top-10 -right-10 w-64 h-64 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #FFC857, transparent)' }}
        />
        <div
          className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #FF6B5E, transparent)' }}
        />

        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-xs font-bold px-3 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.15)', color: '#FFC857', backdropFilter: 'blur(8px)' }}
              >
                🌿 Open Travel Platform
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight mb-2 tracking-tight">
              Jelajahi Nusantara 👋
            </h1>
            <p className="text-white/70 text-sm md:text-base max-w-lg leading-relaxed">
              Rencanakan perjalanan cerdas & dukung pelaku UMKM lokal di seluruh Indonesia. AI menyusun rute terbaik untukmu.
            </p>
          </div>
          <button
            onClick={() => navigate('/create')}
            className="flex-shrink-0 flex items-center gap-2 font-extrabold text-sm px-6 py-3 rounded-2xl transition-all hover:scale-[1.03] btn-press"
            style={{
              background: 'linear-gradient(135deg, #FF6B5E 0%, #E55A4E 100%)',
              color: 'white',
              boxShadow: '0 8px 24px rgba(255,107,94,0.4)',
            }}
          >
            <Sparkles size={16} />
            AI Trip Planner
          </button>
        </div>
      </div>

      {/* ── Impact Stats ── */}
      <ImpactCard impact={overallImpact} />

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Upcoming Trip Hero */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-charcoal text-lg">Itinerary Mendatang</h2>
            <button
              onClick={() => navigate('/my-itineraries')}
              className="text-teal text-xs font-bold flex items-center gap-1 hover:gap-2 transition-all"
            >
              Semua Trip <ArrowRight size={12} />
            </button>
          </div>

          <div
            className="relative rounded-3xl overflow-hidden h-72 cursor-pointer group"
            onClick={() => navigate(`/itinerary/${itinerary.id}`)}
            style={{ boxShadow: '0 12px 40px rgba(37,50,56,0.15)' }}
          >
            <img
              src={itinerary.coverImage}
              alt={itinerary.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.3) 40%, rgba(15,74,71,0.95) 100%)' }}
            />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="bg-teal text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                🗓 Terjadwal
              </span>
              <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow flex items-center gap-1">
                <Store size={10} /> {tripImpact.umkmCount} UMKM
              </span>
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <h3 className="text-white font-extrabold text-xl leading-tight">
                  {itinerary.title}
                </h3>
                <div className="flex items-center gap-3 mt-2 flex-wrap text-white/75 text-xs">
                  <span className="flex items-center gap-1">
                    <MapPin size={11} className="text-coral" /> {itinerary.destination}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={11} /> {itinerary.duration}
                  </span>
                  <span className="flex items-center gap-1 text-emerald-300 font-semibold">
                    <Award size={11} /> {formatCurrency(tripImpact.estimatedLocalSpending)} ke UMKM
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/itinerary/${itinerary.id}`); }}
                className="text-white text-xs font-bold px-4 py-2 rounded-xl transition-all hover:bg-white/40 btn-press flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.25)' }}
              >
                Buka Itinerary →
              </button>
            </div>
          </div>
        </div>

        {/* Local Discovery Widget */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-charcoal text-lg">Eksplorasi Lokal</h2>
            <button
              onClick={() => navigate('/discovery')}
              className="text-teal text-xs font-bold flex items-center gap-1"
            >
              Lihat Semua <ArrowRight size={12} />
            </button>
          </div>

          <div
            className="rounded-3xl p-5 flex flex-col justify-between border border-gray-100"
            style={{ height: '288px', background: 'white', boxShadow: '0 4px 20px rgba(37,50,56,0.07)' }}
          >
            {/* Mini stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: 'UMKM Terdaftar', val: '1,240+', icon: '🏪', c: '#059669' },
                { label: 'Hidden Gems',    val: '380+',   icon: '💎', c: '#7C3AED' },
                { label: 'Provinsi',       val: '34',     icon: '🗺️', c: '#176B67' },
                { label: 'Kategori',       val: '8',      icon: '🎭', c: '#D97706' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl p-3"
                  style={{ background: 'rgba(37,50,56,0.03)', border: '1px solid rgba(37,50,56,0.05)' }}
                >
                  <div className="text-lg mb-1">{s.icon}</div>
                  <div className="font-extrabold text-charcoal text-sm">{s.val}</div>
                  <div className="text-charcoal-lighter text-[10px] font-medium">{s.label}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('/discovery')}
              className="w-full py-2.5 font-bold text-xs text-white rounded-xl flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] btn-press"
              style={{ background: 'linear-gradient(135deg, #176B67 0%, #1E8A85 100%)', boxShadow: '0 6px 20px rgba(23,107,103,0.3)' }}
            >
              <Compass size={14} />
              Jelajahi Katalog UMKM
            </button>
          </div>
        </div>
      </div>

      {/* ── Recommended Destinations ── */}
      <div>
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="font-extrabold text-charcoal text-lg">Destinasi Populer Berbasis Komunitas</h2>
            <p className="text-xs text-charcoal-lighter mt-0.5">
              Rekomendasi yang memaksimalkan dampak ekonomi lokal
            </p>
          </div>
          <button
            onClick={() => navigate('/discovery')}
            className="text-teal text-xs font-bold flex items-center gap-1 hover:gap-2 transition-all"
          >
            Lihat Semua <ArrowRight size={12} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockRecommendations.map((rec) => (
            <RecommendationCard
              key={rec.id}
              rec={rec}
              onClick={() => navigate('/create', { state: { destination: rec.destination } })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
