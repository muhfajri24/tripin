import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  MapPin, Calendar, Clock, Share2, Edit3, ExternalLink,
  ChevronDown, ChevronUp, Store, Award, PieChart,
  DollarSign, Sparkles, Navigation, Download, Bookmark,
  RefreshCw, Map, ArrowUp, ArrowDown, Trash2, Plus, Check,
  Printer, X, Eye, Info
} from 'lucide-react';
import {
  mockItineraries, mockBudget, formatCurrency,
  optimizeActivities, getTripImpactStats, getItineraryById, saveItinerary,
  mockLocalBusinesses, mockDestinations
} from '../data/mockData';
import MapView from '../components/MapView';

// Image mapping based on destination
const DEST_HEROES = {
  bali: '/images/hero/hero-bali.jpg',
  yogyakarta: '/images/hero/hero-malioboro.jpg',
  bromo: '/images/hero/hero-bromo.jpg',
  'raja ampat': '/images/hero/hero-rajaampat.jpg',
  'banda neira': '/images/hero/hero-bandaneira.jpg',
  palembang: '/images/hero/hero-ampera.jpg',
};

function getHeroImage(destination) {
  if (!destination) return '/images/hero/hero-bromo.jpg';
  const match = Object.keys(DEST_HEROES).find((k) =>
    destination.toLowerCase().includes(k)
  );
  return match ? DEST_HEROES[match] : '/images/hero/hero-rajaampat.jpg';
}

function ItineraryResultPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const baseItinerary = getItineraryById(id);
  const [itinerary, setItinerary] = useState(baseItinerary);
  const [selectedDay, setSelectedDay] = useState(0);
  const [optimization, setOptimization] = useState(baseItinerary.optimization || 'explore');
  const [mapExpanded, setMapExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'budget'
  const [selectedActivityId, setSelectedActivityId] = useState(null);

  // Notifications / Feedback States
  const [saved, setSaved] = useState(false);
  const [shareMsg, setShareMsg] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAddSpotModal, setShowAddSpotModal] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const tripImpact = useMemo(() => getTripImpactStats(itinerary), [itinerary]);
  const currentDay = itinerary.days[selectedDay] || itinerary.days[0];

  // Handle switching optimization mode (Budget Friendly / Time Efficient / Explore More)
  const handleOptimizationChange = (newMode) => {
    setIsOptimizing(true);
    setOptimization(newMode);

    setTimeout(() => {
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
      setIsOptimizing(false);
      showToast(`Mode optimasi diubah ke "${newMode === 'budget' ? 'Budget Friendly' : newMode === 'time' ? 'Time Efficient' : 'Explore More'}"`);
    }, 450);
  };

  // Re-order spot: Move Up
  const handleMoveActivity = (index, direction) => {
    const activities = [...currentDay.activities];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= activities.length) return;

    // Swap
    const temp = activities[index];
    activities[index] = activities[targetIdx];
    activities[targetIdx] = temp;

    const updatedDays = [...itinerary.days];
    updatedDays[selectedDay] = {
      ...currentDay,
      activities,
    };

    const updated = { ...itinerary, days: updatedDays };
    setItinerary(updated);
    saveItinerary(updated);
    showToast('Urutan destinasi berhasil diperbarui');
  };

  // Delete spot
  const handleDeleteActivity = (actId, actName) => {
    const activities = currentDay.activities.filter((a) => a.id !== actId);
    const updatedDays = [...itinerary.days];
    updatedDays[selectedDay] = {
      ...currentDay,
      activities,
    };

    const updated = { ...itinerary, days: updatedDays };
    setItinerary(updated);
    saveItinerary(updated);
    showToast(`"${actName}" telah dihapus dari jadwal`);
  };

  // Add Spot to current day
  const handleAddSpot = (spot) => {
    const newActivity = {
      id: `custom-${Date.now()}`,
      name: spot.name,
      category: spot.category || 'Wisata',
      time: '16:00',
      period: 'afternoon',
      duration: '1.5 jam',
      cost: spot.avgCost || spot.ticketPrice || 35000,
      transport: 'Mobil / Motor',
      transportCost: 15000,
      city: spot.city,
      isUMKM: !!spot.isUMKM,
      notes: spot.description || 'Destinasi tambahan pilihan wisatawan.',
    };

    const updatedActivities = [...currentDay.activities, newActivity];
    const updatedDays = [...itinerary.days];
    updatedDays[selectedDay] = {
      ...currentDay,
      activities: updatedActivities,
    };

    const updated = { ...itinerary, days: updatedDays };
    setItinerary(updated);
    saveItinerary(updated);
    setShowAddSpotModal(false);
    showToast(`"${spot.name}" berhasil ditambahkan ke Hari ${currentDay.day}`);
  };

  const handleSaveTrip = () => {
    saveItinerary(itinerary);
    setSaved(true);
    showToast('Itinerary berhasil disimpan ke My Itineraries!');
    setTimeout(() => setSaved(false), 2500);
  };

  const handleShare = async () => {
    const text = `Rencana Liburan ke ${itinerary.destination}: ${itinerary.title} (${itinerary.duration}) via TRIPIN!`;
    try {
      if (navigator.share) {
        await navigator.share({ title: itinerary.title, text, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShareMsg('Link berhasil disalin!');
        setTimeout(() => setShareMsg(''), 2500);
        showToast('Link itinerary telah disalin ke clipboard!');
      }
    } catch (e) {
      // ignore
    }
  };

  const openGoogleMaps = () => {
    if (!currentDay || !currentDay.activities || currentDay.activities.length === 0) return;
    const valid = currentDay.activities.filter((a) => a.name);
    if (valid.length === 0) return;

    if (valid.length === 1) {
      const q = encodeURIComponent(`${valid[0].name}, ${valid[0].city || itinerary.destination}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
      return;
    }

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

  const heroImage = itinerary.coverImage || getHeroImage(itinerary.destination);

  // Budget breakdown calculations
  const totalCostDay = currentDay?.activities.reduce(
    (sum, a) => sum + (a.cost || 0) + (a.transportCost || 0),
    0
  ) || 0;

  const budgetBreakdown = [
    { label: 'Transportasi & Bensin', amount: Math.round(itinerary.totalBudget * 0.28), color: '#176B67' },
    { label: 'Kuliner & Makanan UMKM', amount: Math.round(itinerary.totalBudget * 0.32), color: '#059669' },
    { label: 'Tiket & Atraksi Budaya', amount: Math.round(itinerary.totalBudget * 0.22), color: '#FF6B5E' },
    { label: 'Cadangan & Darurat', amount: Math.round(itinerary.totalBudget * 0.18), color: '#FFC857' },
  ];

  return (
    <div className="space-y-8 animate-fadeInUp pb-16">

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-charcoal text-white text-xs sm:text-sm font-bold px-4 py-3 rounded-2xl shadow-card border border-white/20 animate-slideInRight"
        >
          <Check size={16} className="text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── 1. Editorial Magazine Hero Header ── */}
      <section className="relative rounded-3xl overflow-hidden shadow-card border border-teal/15">
        <div className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden">
          <img
            src={heroImage}
            alt={itinerary.destination}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />

          {/* Deep Gradient Scrim */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(180deg, rgba(14,39,38,0.35) 0%, rgba(14,39,38,0.7) 50%, rgba(10,24,23,0.95) 100%)',
            }}
          />

          <div className="absolute inset-0 p-6 sm:p-8 md:p-10 flex flex-col justify-between text-white z-10">
            {/* Top row badges */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full text-white bg-teal/80 backdrop-blur-md border border-white/20">
                  🗓 Itinerary Siap Berangkat
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-700/80 text-white backdrop-blur-md flex items-center gap-1">
                  <Store size={12} /> {tripImpact.umkmCount} Titik UMKM Mitra
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-black/40 text-yellow-trip backdrop-blur-md">
                  {itinerary.duration} · {itinerary.travelers || 2} Wisatawan
                </span>
              </div>

              {/* Action buttons on hero */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveTrip}
                  className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl backdrop-blur-md transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: saved ? 'rgba(5, 150, 105, 0.9)' : 'rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  }}
                  title="Simpan ke My Itineraries"
                >
                  <Bookmark size={14} className={saved ? 'fill-white' : ''} />
                  <span>{saved ? 'Tersimpan ✓' : 'Simpan Trip'}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl backdrop-blur-md transition-all hover:scale-105 active:scale-95 bg-white/20 hover:bg-white/30 border border-white/30"
                  title="Bagikan Itinerary"
                >
                  <Share2 size={14} />
                  <span>{shareMsg || 'Bagikan'}</span>
                </button>

                <button
                  onClick={() => setShowExportModal(true)}
                  className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl backdrop-blur-md transition-all hover:scale-105 active:scale-95 bg-white/20 hover:bg-white/30 border border-white/30"
                  title="Export Ringkasan PDF"
                >
                  <Download size={14} />
                  <span className="hidden sm:inline">Export PDF</span>
                </button>
              </div>
            </div>

            {/* Bottom title & metadata */}
            <div>
              <div className="flex items-center gap-2 text-yellow-trip text-xs sm:text-sm font-bold mb-1">
                <MapPin size={14} />
                <span>{itinerary.destination}, Indonesia</span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                {itinerary.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs sm:text-sm text-white/80">
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-coral" />
                  {new Date(itinerary.dates.start).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  {' – '}
                  {new Date(itinerary.dates.end).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <span className="text-white/40">|</span>
                <span className="flex items-center gap-1.5">
                  <DollarSign size={14} className="text-emerald-400" />
                  Total Anggaran: <strong className="text-white">{formatCurrency(itinerary.totalBudget)}</strong>
                </span>
                <span className="text-white/40">|</span>
                <span className="flex items-center gap-1 text-emerald-300 font-semibold">
                  <Award size={14} /> {formatCurrency(tripImpact.estimatedLocalSpending)} berputar di UMKM
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Interactive Optimization Mode Selector ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-charcoal text-sm sm:text-base tracking-tight flex items-center gap-2">
              <Sparkles size={16} className="text-coral" />
              Pilih Karakteristik Rekomendasi Rute
            </h3>
            <p className="text-xs text-charcoal-lighter">
              Ubah prioritas AI: urutan dan waktu tempuh rute akan otomatis dikalkulasi ulang
            </p>
          </div>
          {isOptimizing && (
            <span className="text-xs text-teal font-bold flex items-center gap-1.5 animate-pulse">
              <RefreshCw size={13} className="animate-spin" /> Mengoptimalkan rute...
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              id: 'budget',
              title: 'Budget Friendly',
              desc: 'Prioritaskan tiket terjangkau, kuliner warga lokal autentik & rute hemat biaya.',
              icon: '💰',
              badge: 'Hemat Biaya',
              color: '#059669',
            },
            {
              id: 'time',
              title: 'Time Efficient',
              desc: 'Urutan rute tercepat dengan waktu tempuh minimal antar destinasi.',
              icon: '⚡',
              badge: 'Bebas Macet',
              color: '#176B67',
            },
            {
              id: 'explore',
              title: 'Explore More',
              desc: 'Pengalaman maksimal mencakup hidden gems, workshop UMKM & spot ikonik.',
              icon: '🌟',
              badge: 'Pengalaman Penuh',
              color: '#FF6B5E',
            },
          ].map((mode) => {
            const isSelected = optimization === mode.id;
            return (
              <div
                key={mode.id}
                onClick={() => handleOptimizationChange(mode.id)}
                className={`p-4 rounded-3xl border-2 transition-all cursor-pointer relative flex flex-col justify-between group ${
                  isSelected
                    ? 'bg-white shadow-card scale-[1.01]'
                    : 'bg-white/70 hover:bg-white hover:shadow-soft border-gray-100'
                }`}
                style={{
                  borderColor: isSelected ? mode.color : 'rgba(37, 50, 56, 0.08)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{mode.icon}</span>
                    <span
                      className="text-[10px] font-extrabold px-2 py-0.5 rounded-full"
                      style={{
                        background: isSelected ? `${mode.color}20` : 'rgba(37, 50, 56, 0.06)',
                        color: isSelected ? mode.color : '#6B7E85',
                      }}
                    >
                      {mode.badge}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-charcoal text-sm mb-1">{mode.title}</h4>
                  <p className="text-xs text-charcoal-lighter leading-relaxed">{mode.desc}</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-gray-50 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-bold" style={{ color: isSelected ? mode.color : '#6B7E85' }}>
                    {isSelected ? '✓ Mode Aktif' : 'Pilih Mode Ini'}
                  </span>
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-current' : 'border-gray-300'
                    }`}
                    style={{ color: mode.color }}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-current" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 3. Tabs: Timeline & Peta vs Rincian Anggaran ── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all ${
                activeTab === 'timeline'
                  ? 'bg-teal text-white shadow-teal shadow'
                  : 'text-charcoal-lighter hover:text-charcoal bg-white border border-gray-200'
              }`}
            >
              🗓 Timeline Harian & Peta Rute
            </button>
            <button
              onClick={() => setActiveTab('budget')}
              className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-1.5 ${
                activeTab === 'budget'
                  ? 'bg-teal text-white shadow-teal shadow'
                  : 'text-charcoal-lighter hover:text-charcoal bg-white border border-gray-200'
              }`}
            >
              <PieChart size={15} />
              <span>Rincian Budget & Dampak UMKM</span>
            </button>
          </div>

          {activeTab === 'timeline' && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              <span className="text-xs font-bold text-charcoal-lighter mr-1">Hari:</span>
              {itinerary.days.map((day, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedDay(i)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap btn-press ${
                    selectedDay === i
                      ? 'bg-charcoal text-white shadow'
                      : 'bg-white text-charcoal-lighter border border-gray-200 hover:border-teal'
                  }`}
                >
                  Hari {day.day}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── TAB 1: Timeline + Interactive Map ── */}
        {activeTab === 'timeline' && currentDay && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left 2 Cols: Timeline with Direct Manipulation (Move / Delete / Add) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-3xl p-5 shadow-soft border border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-charcoal-lighter font-semibold uppercase tracking-wider block">
                    Jadwal & Urutan Kunjungan
                  </span>
                  <h3 className="text-lg font-extrabold text-charcoal">
                    {currentDay.label} · {new Date(currentDay.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </h3>
                </div>

                <button
                  onClick={() => setShowAddSpotModal(true)}
                  className="flex items-center gap-1.5 font-extrabold text-xs px-4 py-2.5 rounded-xl text-white transition-all hover:scale-105 active:scale-95 shadow btn-press"
                  style={{
                    background: 'linear-gradient(135deg, #176B67 0%, #1E8A85 100%)',
                  }}
                >
                  <Plus size={14} />
                  <span>Tambah Titik Singgah</span>
                </button>
              </div>

              {/* Timeline Cards */}
              <div className="space-y-4">
                {currentDay.activities.map((act, idx) => {
                  const isSelected = selectedActivityId === act.id;

                  return (
                    <div
                      key={act.id}
                      onClick={() => setSelectedActivityId(act.id)}
                      className={`rounded-3xl p-5 border transition-all duration-300 relative group cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-teal-50/50 to-white border-teal shadow-md'
                          : 'bg-white hover:shadow-card border-gray-100'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        {/* Time & Sequence Badge */}
                        <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:w-16 flex-shrink-0">
                          <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-sm text-white shadow"
                            style={{
                              background: act.isUMKM
                                ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)'
                                : 'linear-gradient(135deg, #176B67 0%, #1E8A85 100%)',
                            }}
                          >
                            {idx + 1}
                          </div>
                          <span className="text-xs font-bold text-charcoal-lighter">
                            {act.time}
                          </span>
                        </div>

                        {/* Activity Body */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-extrabold text-charcoal text-base tracking-tight">
                              {act.name}
                            </h4>
                            {act.isUMKM && (
                              <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <Store size={10} /> UMKM Mitra
                              </span>
                            )}
                            <span className="text-[10px] font-bold bg-gray-100 text-charcoal-lighter px-2 py-0.5 rounded-full">
                              {act.category}
                            </span>
                          </div>

                          {act.city && (
                            <div className="flex items-center gap-1 text-xs text-charcoal-lighter">
                              <MapPin size={11} className="text-coral flex-shrink-0" />
                              <span>{act.city}</span>
                            </div>
                          )}

                          {act.notes && (
                            <p className="text-xs text-charcoal-lighter leading-relaxed">
                              {act.notes}
                            </p>
                          )}

                          {/* AI Recommendation Reason */}
                          <div
                            className="p-3 rounded-2xl flex items-start gap-2 text-xs"
                            style={{
                              background: 'rgba(23, 107, 103, 0.05)',
                              border: '1px solid rgba(23, 107, 103, 0.1)',
                            }}
                          >
                            <Sparkles size={14} className="text-teal flex-shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-teal font-extrabold block">Alasan Rekomendasi AI:</strong>
                              <span className="text-charcoal-lighter leading-relaxed">
                                {act.isUMKM
                                  ? 'Titik usaha lokal ini memiliki rating kepuasan wisatawan tinggi dan mendukung pemberdayaan pengrajin/kuliner warga setempat (SDG 8).'
                                  : 'Destinasi ikonik dengan urutan rute terpadu untuk meminimalkan waktu perjalanan di hari ini.'}
                              </span>
                            </div>
                          </div>

                          {/* Metadata row */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-50 text-xs text-charcoal-lighter">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="flex items-center gap-1">
                                <Clock size={11} /> Durasi: {act.duration}
                              </span>
                              <span className="flex items-center gap-1 font-bold text-teal">
                                <DollarSign size={11} /> {act.cost > 0 ? formatCurrency(act.cost) : 'Gratis'}
                              </span>
                              {act.transport && (
                                <span className="bg-gray-50 px-2 py-0.5 rounded-lg text-[11px]">
                                  🚗 {act.transport} ({formatCurrency(act.transportCost || 0)})
                                </span>
                              )}
                            </div>

                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${act.name}, ${act.city || itinerary.destination}`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-coral hover:text-coral-dark font-bold text-[11px] flex items-center gap-1"
                            >
                              <ExternalLink size={11} /> Google Maps
                            </a>
                          </div>
                        </div>

                        {/* Controls: Move Up, Move Down, Delete */}
                        <div className="flex sm:flex-col items-center gap-1 self-end sm:self-auto border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveActivity(idx, 'up');
                            }}
                            disabled={idx === 0}
                            className="w-8 h-8 rounded-xl bg-gray-50 hover:bg-teal hover:text-white flex items-center justify-center transition-colors disabled:opacity-30 disabled:pointer-events-none"
                            title="Pindah ke Atas"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveActivity(idx, 'down');
                            }}
                            disabled={idx === currentDay.activities.length - 1}
                            className="w-8 h-8 rounded-xl bg-gray-50 hover:bg-teal hover:text-white flex items-center justify-center transition-colors disabled:opacity-30 disabled:pointer-events-none"
                            title="Pindah ke Bawah"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteActivity(act.id, act.name);
                            }}
                            className="w-8 h-8 rounded-xl bg-gray-50 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-colors text-charcoal-lighter"
                            title="Hapus dari Rute"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 1 Col: Map View & Day Summary */}
            <div className="space-y-4">
              {/* Map Card */}
              <div className="bg-white rounded-3xl shadow-soft overflow-hidden border border-gray-100">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Navigation size={15} className="text-teal" />
                    <h3 className="font-extrabold text-charcoal text-sm">
                      Peta Rute Hari {currentDay.day}
                    </h3>
                  </div>
                  <button
                    onClick={() => setMapExpanded(!mapExpanded)}
                    className="text-xs text-teal font-bold flex items-center gap-1 hover:text-teal-dark"
                  >
                    {mapExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    <span>{mapExpanded ? 'Kecilkan' : 'Perbesar'}</span>
                  </button>
                </div>

                <div className="p-3">
                  <MapView
                    activities={currentDay.activities}
                    height={mapExpanded ? '400px' : '230px'}
                    zoom={12}
                    selectedActivityId={selectedActivityId}
                  />

                  <button
                    onClick={openGoogleMaps}
                    className="w-full mt-3 flex items-center justify-center gap-2 bg-gradient-to-r from-teal to-teal-light text-white font-extrabold text-xs py-3 rounded-2xl hover:shadow-teal transition-all btn-press"
                  >
                    <ExternalLink size={14} />
                    <span>Buka Rute Lengkap di Google Maps</span>
                  </button>
                </div>
              </div>

              {/* Day Quick Summary Card */}
              <div className="bg-white rounded-3xl shadow-soft p-5 border border-gray-100 space-y-3">
                <h4 className="font-black text-xs uppercase tracking-wider text-charcoal-lighter">
                  Ringkasan Rute Hari {currentDay.day}
                </h4>

                <div className="space-y-2 text-xs divide-y divide-gray-50">
                  <div className="flex justify-between py-1.5">
                    <span className="text-charcoal-lighter">Titik Singgah:</span>
                    <strong className="text-charcoal">{currentDay.activities.length} Destinasi</strong>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-charcoal-lighter">Dukungan UMKM:</span>
                    <strong className="text-emerald-700">
                      {currentDay.activities.filter((a) => a.isUMKM).length} Tempat Lokal
                    </strong>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-charcoal-lighter">Est. Biaya Hari Ini:</span>
                    <strong className="text-teal font-extrabold text-sm">{formatCurrency(totalCostDay)}</strong>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/itinerary/${itinerary.id}/edit`)}
                  className="w-full py-2.5 rounded-xl border border-dashed border-teal/40 text-teal font-extrabold text-xs hover:bg-teal/5 transition-colors flex items-center justify-center gap-1.5 mt-2"
                >
                  <Edit3 size={13} />
                  <span>Buka Editor Itinerary Penuh</span>
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ── TAB 2: Budget Breakdown & SDG 8 Local Impact ── */}
        {activeTab === 'budget' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div
                className="rounded-3xl p-6 text-white shadow-teal"
                style={{ background: 'linear-gradient(135deg, #176B67 0%, #1E8A85 100%)' }}
              >
                <p className="text-white/70 text-xs font-semibold">Total Anggaran Rencana</p>
                <p className="text-2xl sm:text-3xl font-black mt-1">
                  {formatCurrency(itinerary.totalBudget)}
                </p>
                <p className="text-white/70 text-xs mt-1">
                  {itinerary.travelers || 2} Wisatawan · {itinerary.duration}
                </p>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-soft border-l-4 border-emerald-500 border border-gray-100">
                <p className="text-charcoal-lighter text-xs font-semibold">Belanja Langsung ke UMKM</p>
                <p className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">
                  {formatCurrency(tripImpact.estimatedLocalSpending)}
                </p>
                <p className="text-emerald-600 text-xs mt-1 font-medium">
                  {tripImpact.localContributionRatio}% berputar di ekonomi warga
                </p>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-soft border-l-4 border-coral border border-gray-100">
                <p className="text-charcoal-lighter text-xs font-semibold">Dana Cadangan & Darurat</p>
                <p className="text-2xl sm:text-3xl font-black text-charcoal mt-1">
                  {formatCurrency(Math.max(0, itinerary.totalBudget - tripImpact.totalActivityCost))}
                </p>
                <p className="text-xs text-charcoal-lighter mt-1 font-medium">
                  Buffer aman untuk kebutuhan tak terduga
                </p>
              </div>
            </div>

            {/* Visual Breakdown Bars */}
            <div className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100 space-y-4">
              <h3 className="font-extrabold text-charcoal text-base">Alokasi Anggaran Berdasarkan Kategori</h3>
              <div className="space-y-3">
                {budgetBreakdown.map((item, i) => {
                  const pct = Math.round((item.amount / itinerary.totalBudget) * 100);
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="font-bold text-charcoal">{item.label}</span>
                        <span className="font-extrabold text-charcoal">
                          {formatCurrency(item.amount)} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: item.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Modal: Tambah Titik Singgah ── */}
      {showAddSpotModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-card space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-extrabold text-charcoal text-base">Tambah Destinasi / UMKM</h3>
                <p className="text-xs text-charcoal-lighter">Tambahkan ke rute Hari {currentDay.day}</p>
              </div>
              <button
                onClick={() => setShowAddSpotModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2.5">
              <p className="text-xs font-bold text-charcoal-lighter">Pilih Rekomendasi Terdekat:</p>
              {mockLocalBusinesses.slice(0, 4).map((b) => (
                <div
                  key={b.id}
                  onClick={() => handleAddSpot(b)}
                  className="p-3.5 rounded-2xl border border-gray-100 hover:border-teal hover:bg-teal/5 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div>
                    <h5 className="font-extrabold text-charcoal text-sm group-hover:text-teal">{b.name}</h5>
                    <p className="text-xs text-charcoal-lighter mt-0.5">{b.city} · {b.type}</p>
                  </div>
                  <button className="text-xs font-extrabold bg-teal text-white px-3 py-1.5 rounded-xl">
                    + Pilih
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Export PDF Preview ── */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-card space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Printer size={18} className="text-teal" />
                <h3 className="font-extrabold text-charcoal text-base">Export / Cetak Itinerary</h3>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2 text-xs">
              <p className="font-extrabold text-sm text-charcoal">{itinerary.title}</p>
              <p className="text-charcoal-lighter">Destinasi: {itinerary.destination} · Durasi: {itinerary.duration}</p>
              <p className="text-charcoal-lighter">
                Total Biaya: {formatCurrency(itinerary.totalBudget)} ({itinerary.travelers || 2} Wisatawan)
              </p>
              <p className="text-emerald-700 font-bold">
                ✓ Melibatkan {tripImpact.umkmCount} UMKM lokal dengan dampak ekonomi {formatCurrency(tripImpact.estimatedLocalSpending)}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  window.print();
                  setShowExportModal(false);
                }}
                className="flex-1 py-3 bg-teal text-white font-extrabold text-xs sm:text-sm rounded-xl hover:bg-teal-dark transition-all flex items-center justify-center gap-2"
              >
                <Printer size={15} /> Cetak / Simpan PDF
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                className="px-5 py-3 border border-gray-200 text-charcoal font-bold text-xs sm:text-sm rounded-xl hover:bg-gray-50"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ItineraryResultPage;
