import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  MapPin, Calendar, Clock, Share2, Edit3, ExternalLink,
  ChevronDown, ChevronUp, Store, Award, PieChart,
  DollarSign, Sparkles, Navigation
} from 'lucide-react';
import {
  mockItineraries, mockBudget, formatCurrency,
  optimizeActivities, getTripImpactStats, getItineraryById, saveItinerary
} from '../data/mockData';
import ItineraryTimeline from '../components/ItineraryTimeline';
import MapView from '../components/MapView';
import OptimizationSelector from '../components/OptimizationSelector';
import BudgetCard from '../components/BudgetCard';

function ItineraryResultPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const baseItinerary = getItineraryById(id);

  const [itinerary, setItinerary] = useState(baseItinerary);
  const [selectedDay, setSelectedDay] = useState(0);
  const [optimization, setOptimization] = useState(baseItinerary.optimization || 'explore');
  const [mapExpanded, setMapExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'budget'

  // Dynamic impact calculation based on current itinerary state
  const tripImpact = getTripImpactStats(itinerary);

  // Handle switching optimization mode (Budget Friendly / Time Efficient / Explore More)
  const handleOptimizationChange = (newMode) => {
    setOptimization(newMode);
    // Recalculate route sequence, distances, and travel times for all days
    const updatedDays = itinerary.days.map((day) => ({
      ...day,
      activities: optimizeActivities(day.activities, newMode),
    }));
    const updated = {
      ...itinerary,
      optimization: newMode,
      days: updatedDays,
    };
    setItinerary(updated);
    saveItinerary(updated);
  };

  const currentDay = itinerary.days[selectedDay] || itinerary.days[0];
  const allActivities = itinerary.days.flatMap((d) => d.activities || []);

  const openGoogleMaps = () => {
    if (!currentDay || !currentDay.activities || currentDay.activities.length === 0) return;
    const valid = currentDay.activities.filter((a) => a.name);
    if (valid.length === 0) return;

    if (valid.length === 1) {
      const q = encodeURIComponent(`${valid[0].name}, ${valid[0].city || itinerary.destination}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
      return;
    }

    // Google Maps official Multi-stop Directions URL format
    const origin = encodeURIComponent(`${valid[0].name}, ${valid[0].city || itinerary.destination}`);
    const dest = encodeURIComponent(
      `${valid[valid.length - 1].name}, ${valid[valid.length - 1].city || itinerary.destination}`
    );
    const waypoints = valid
      .slice(1, -1)
      .map((a) => encodeURIComponent(`${a.name}, ${a.city || itinerary.destination}`))
      .join('|');

    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}`;
    if (waypoints) {
      url += `&waypoints=${waypoints}`;
    }
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 animate-fadeInUp pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs bg-teal/10 text-teal font-bold px-2.5 py-0.5 rounded-full">
              🗓 Rencana Perjalanan Siap
            </span>
            <span className="text-xs text-charcoal-lighter font-medium">
              {itinerary.duration}
            </span>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Store size={11} />
              {tripImpact.umkmCount} UMKM Mitra Terpilih
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal tracking-tight">
            {itinerary.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs sm:text-sm text-charcoal-lighter">
            <span className="flex items-center gap-1">
              <MapPin size={14} className="text-teal" /> {itinerary.destination}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={14} className="text-coral" />
              {new Date(itinerary.dates.start).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
              })}{' '}
              –{' '}
              {new Date(itinerary.dates.end).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Single Primary Action: Kelola & Reschedule Itinerary */}
        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          <button
            onClick={() => navigate(`/itinerary/${itinerary.id}/edit`)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-coral to-coral-dark text-white font-extrabold text-xs sm:text-sm hover:shadow-coral transition-all"
          >
            <Edit3 size={15} />
            Kelola & Reschedule
          </button>
        </div>
      </div>

      {/* Per-Trip Local Economic Impact (SDG 8) Banner */}
      <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-sky/50 border border-teal/20 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-teal rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-teal">
            <Award size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-charcoal text-sm sm:text-base">
                Dampak Ekonomi Lokal Perjalanan Ini
              </h3>
              <span className="text-[10px] bg-teal text-white font-extrabold px-2 py-0.5 rounded-full">
                SDG 8
              </span>
            </div>
            <p className="text-xs text-charcoal-lighter mt-0.5">
              Dari total {tripImpact.totalStops} destinasi, sebanyak{' '}
              <span className="font-bold text-teal">
                {tripImpact.umkmCount} titik ({tripImpact.umkmPercentage}%)
              </span>{' '}
              merupakan UMKM lokal otentik.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 bg-white/90 rounded-2xl px-5 py-2.5 border border-teal/15 self-stretch md:self-auto justify-around shadow-sm">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-charcoal-lighter font-bold">
              Est. Belanja ke UMKM
            </p>
            <p className="text-sm sm:text-base font-extrabold text-teal">
              {formatCurrency(tripImpact.estimatedLocalSpending)}
            </p>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-charcoal-lighter font-bold">
              Kontribusi Lokal
            </p>
            <p className="text-sm sm:text-base font-extrabold text-emerald-700">
              {tripImpact.localContributionRatio}% pengeluaran
            </p>
          </div>
        </div>
      </div>

      {/* Smart Itinerary Optimizer Selector (Real Recalculation) */}
      <OptimizationSelector
        selected={optimization}
        onChange={handleOptimizationChange}
      />

      {/* View Tabs: Jadwal & Peta vs Rincian Anggaran */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'timeline'
                ? 'bg-teal text-white shadow-teal/30 shadow'
                : 'text-charcoal-lighter hover:text-charcoal hover:bg-gray-100'
            }`}
          >
            🗓 Jadwal Harian & Peta Rute
          </button>
          <button
            onClick={() => setActiveTab('budget')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'budget'
                ? 'bg-teal text-white shadow-teal/30 shadow'
                : 'text-charcoal-lighter hover:text-charcoal hover:bg-gray-100'
            }`}
          >
            <PieChart size={14} />
            Rincian Anggaran
          </button>
        </div>

        {activeTab === 'timeline' && (
          <div className="flex gap-1.5 overflow-x-auto">
            {itinerary.days.map((day, i) => (
              <button
                key={i}
                onClick={() => setSelectedDay(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedDay === i
                    ? 'bg-charcoal text-white shadow-sm'
                    : 'bg-white text-charcoal-lighter hover:bg-sky border border-gray-200'
                }`}
              >
                Hari {day.day}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tab 1: Timeline & Interactive Map */}
      {activeTab === 'timeline' && currentDay && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline column */}
          <div className="lg:col-span-2">
            <ItineraryTimeline
              day={currentDay}
              activities={currentDay.activities}
              onActivityClick={(act) => console.log('Activity clicked:', act)}
            />
          </div>

          {/* Map & Day Stats column */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl shadow-soft overflow-hidden border border-gray-100">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-1.5">
                  <Navigation size={14} className="text-teal" />
                  <h3 className="font-bold text-charcoal text-xs sm:text-sm">
                    Peta Rute Hari {currentDay.day}
                  </h3>
                </div>
                <button
                  onClick={() => setMapExpanded(!mapExpanded)}
                  className="text-xs text-teal font-semibold flex items-center gap-1"
                >
                  {mapExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {mapExpanded ? 'Kecilkan' : 'Perbesar'}
                </button>
              </div>

              <div className="p-3">
                <MapView
                  activities={currentDay.activities}
                  height={mapExpanded ? '380px' : '220px'}
                  zoom={12}
                />

                <button
                  onClick={openGoogleMaps}
                  className="w-full mt-3 flex items-center justify-center gap-2 bg-gradient-to-r from-teal to-teal-light text-white font-bold text-xs py-2.5 rounded-xl hover:shadow-teal transition-all"
                >
                  <ExternalLink size={14} />
                  Buka Rute Navigasi di Google Maps
                </button>
              </div>
            </div>

            {/* Quick Day Summary */}
            <div className="bg-white rounded-3xl shadow-soft p-4 border border-gray-100 space-y-2.5">
              <h4 className="font-bold text-charcoal text-xs uppercase tracking-wider text-charcoal-lighter">
                Ringkasan Rute Hari {currentDay.day}
              </h4>

              <div className="flex justify-between text-xs py-1 border-b border-gray-50">
                <span className="text-charcoal-lighter">Titik Singgah:</span>
                <span className="font-bold text-charcoal">
                  {currentDay.activities.length} Destinasi & UMKM
                </span>
              </div>

              <div className="flex justify-between text-xs py-1 border-b border-gray-50">
                <span className="text-charcoal-lighter">Dukungan UMKM:</span>
                <span className="font-bold text-emerald-700">
                  {currentDay.activities.filter((a) => a.isUMKM).length} UMKM Lokal
                </span>
              </div>

              <div className="flex justify-between text-xs py-1">
                <span className="text-charcoal-lighter">Total Biaya Hari Ini:</span>
                <span className="font-extrabold text-teal">
                  {formatCurrency(
                    currentDay.activities.reduce(
                      (s, a) => s + (a.cost || 0) + (a.transportCost || 0),
                      0
                    )
                  )}
                </span>
              </div>

              <button
                onClick={() => navigate(`/itinerary/${itinerary.id}/edit`)}
                className="w-full mt-2 py-2.5 rounded-xl border-2 border-dashed border-teal/40 text-teal font-extrabold text-xs hover:bg-teal/5 transition-colors flex items-center justify-center gap-1.5"
              >
                <Edit3 size={13} />
                Edit / Ganti Destinasi Hari Ini
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Integrated Budget Overview */}
      {activeTab === 'budget' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-teal text-white rounded-3xl p-5 shadow-teal">
              <p className="text-white/70 text-xs font-semibold">Total Anggaran Rencana</p>
              <p className="text-2xl font-extrabold mt-1">
                {formatCurrency(itinerary.totalBudget)}
              </p>
              <p className="text-white/70 text-xs mt-1">
                2 Wisatawan · {itinerary.duration}
              </p>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-soft border-l-4 border-emerald-500">
              <p className="text-charcoal-lighter text-xs font-semibold">
                Alokasi ke UMKM Lokal
              </p>
              <p className="text-2xl font-extrabold text-emerald-700 mt-1">
                {formatCurrency(tripImpact.estimatedLocalSpending)}
              </p>
              <p className="text-emerald-600 text-xs mt-1 font-medium">
                {tripImpact.localContributionRatio}% berputar di ekonomi warga
              </p>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-soft border-l-4 border-coral">
              <p className="text-charcoal-lighter text-xs font-semibold">
                Cadangan Tak Terduga
              </p>
              <p className="text-2xl font-extrabold text-charcoal mt-1">
                {formatCurrency(
                  Math.max(
                    0,
                    itinerary.totalBudget - tripImpact.totalActivityCost
                  )
                )}
              </p>
              <p className="text-xs text-charcoal-lighter mt-1 font-medium">
                Sisa buffer untuk keperluan darurat
              </p>
            </div>
          </div>

          <BudgetCard budget={mockBudget} />
        </div>
      )}
    </div>
  );
}

export default ItineraryResultPage;
