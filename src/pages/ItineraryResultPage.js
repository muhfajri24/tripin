import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  MapPin, Calendar, Clock, Share2, Edit3, ExternalLink,
  ChevronDown, ChevronUp, Store, Award, PieChart,
  DollarSign, Sparkles, Navigation, Download, Bookmark,
  RefreshCw, Map, ArrowUp, ArrowDown, Trash2, Plus, Check,
  Printer, X
} from 'lucide-react';
import {
  mockItineraries, formatCurrency, optimizeActivities,
  getTripImpactStats, getItineraryById, saveItinerary,
  mockLocalBusinesses
} from '../data/mockData';
import MapView from '../components/MapView';

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
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'budget'
  const [selectedActivityId, setSelectedActivityId] = useState(null);

  // Notifications
  const [saved, setSaved] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAddSpotModal, setShowAddSpotModal] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const tripImpact = useMemo(() => getTripImpactStats(itinerary), [itinerary]);
  const currentDay = itinerary.days[selectedDay] || itinerary.days[0];

  // Optimization Switcher
  const handleOptimizationChange = (newMode) => {
    setOptimization(newMode);
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
    showToast(`Rute dioptimalkan ke ${newMode === 'budget' ? 'Budget Friendly' : newMode === 'time' ? 'Time Efficient' : 'Explore More'}`);
  };

  // Re-order spot: Move Up / Down
  const handleMoveActivity = (index, direction) => {
    const activities = [...currentDay.activities];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= activities.length) return;

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
    showToast('Urutan destinasi diperbarui');
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
    showToast(`"${actName}" dihapus dari jadwal`);
  };

  // Add spot to current day
  const handleAddSpot = (spot) => {
    const newActivity = {
      id: `custom-${Date.now()}`,
      name: spot.name,
      category: spot.category || 'Wisata',
      time: '15:30',
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
    showToast(`"${spot.name}" ditambahkan ke Hari ${currentDay.day}`);
  };

  const handleSaveTrip = () => {
    saveItinerary(itinerary);
    setSaved(true);
    showToast('Itinerary disimpan ke My Itineraries');
    setTimeout(() => setSaved(false), 2000);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: itinerary.title, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        showToast('Link itinerary disalin ke clipboard');
      }
    } catch (e) {}
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
    if (waypoints) url += `&waypoints=${waypoints}`;
    window.open(url, '_blank');
  };

  const heroImage = itinerary.coverImage || getHeroImage(itinerary.destination);

  const budgetBreakdown = [
    { label: 'Transportasi', amount: Math.round(itinerary.totalBudget * 0.28), color: '#176B67' },
    { label: 'Kuliner & UMKM', amount: Math.round(itinerary.totalBudget * 0.32), color: '#059669' },
    { label: 'Tiket & Atraksi', amount: Math.round(itinerary.totalBudget * 0.22), color: '#FF6B5E' },
    { label: 'Cadangan Darurat', amount: Math.round(itinerary.totalBudget * 0.18), color: '#FFC857' },
  ];

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-6xl mx-auto">

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-charcoal text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg border border-white/10 animate-fadeIn">
          <Check size={14} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── 1. Compact Hero Header ── */}
      <section className="relative rounded-3xl overflow-hidden shadow-soft">
        <div className="relative h-56 sm:h-64 w-full overflow-hidden">
          <img
            src={heroImage}
            alt={itinerary.destination}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

          <div className="absolute inset-0 p-5 sm:p-8 flex flex-col justify-between text-white z-10">
            {/* Top Bar Actions */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/20 backdrop-blur-md">
                {itinerary.duration} · {itinerary.destination}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveTrip}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md transition-all"
                >
                  <Bookmark size={13} className={saved ? 'fill-white' : ''} />
                  <span>{saved ? 'Tersimpan' : 'Simpan'}</span>
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md transition-all"
                >
                  <Share2 size={13} />
                  <span>Bagikan</span>
                </button>
                <button
                  onClick={() => setShowExportModal(true)}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md transition-all"
                >
                  <Download size={13} />
                  <span>PDF</span>
                </button>
              </div>
            </div>

            {/* Bottom Title & Stats */}
            <div>
              <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                {itinerary.title}
              </h2>

              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-white/80">
                <span className="flex items-center gap-1">
                  <Calendar size={13} className="text-coral" />
                  {new Date(itinerary.dates.start).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  {' – '}
                  {new Date(itinerary.dates.end).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <span>·</span>
                <span>Total: <strong>{formatCurrency(itinerary.totalBudget)}</strong></span>
                <span>·</span>
                <span className="text-emerald-300 font-semibold flex items-center gap-1">
                  <Store size={12} /> {tripImpact.umkmCount} UMKM Mitra
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Streamlined Optimization Segmented Bar ── */}
      <div className="bg-white rounded-2xl p-2 shadow-soft border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span className="text-xs font-bold text-charcoal-lighter px-2">
          Mode Optimasi AI:
        </span>
        <div className="grid grid-cols-3 gap-1.5 w-full sm:w-auto">
          {[
            { id: 'budget', label: 'Budget Friendly', icon: '💰' },
            { id: 'time', label: 'Time Efficient', icon: '⚡' },
            { id: 'explore', label: 'Explore More', icon: '🌟' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => handleOptimizationChange(mode.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                optimization === mode.id
                  ? 'bg-teal text-white shadow-sm'
                  : 'bg-gray-50 text-charcoal-lighter hover:text-charcoal'
              }`}
            >
              <span>{mode.icon}</span>
              <span>{mode.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 3. Tabs: Jadwal vs Budget ── */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
        <div className="flex gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'timeline'
                ? 'bg-charcoal text-white'
                : 'text-charcoal-lighter hover:text-charcoal'
            }`}
          >
            Jadwal Harian & Peta
          </button>
          <button
            onClick={() => setActiveTab('budget')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'budget'
                ? 'bg-charcoal text-white'
                : 'text-charcoal-lighter hover:text-charcoal'
            }`}
          >
            Rincian Budget
          </button>
        </div>

        {activeTab === 'timeline' && (
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide text-xs">
            {itinerary.days.map((day, i) => (
              <button
                key={i}
                onClick={() => setSelectedDay(i)}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  selectedDay === i
                    ? 'bg-teal text-white'
                    : 'bg-gray-100 text-charcoal-lighter hover:text-charcoal'
                }`}
              >
                Hari {day.day}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Tab 1: Timeline + Map ── */}
      {activeTab === 'timeline' && currentDay && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Timeline List */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between text-xs pb-1">
              <span className="font-bold text-charcoal">
                {currentDay.label} ({currentDay.activities.length} titik singgah)
              </span>
              <button
                onClick={() => setShowAddSpotModal(true)}
                className="text-teal font-bold hover:underline flex items-center gap-1"
              >
                <Plus size={13} /> Tambah Tempat
              </button>
            </div>

            <div className="space-y-3">
              {currentDay.activities.map((act, idx) => (
                <div
                  key={act.id}
                  onClick={() => setSelectedActivityId(act.id)}
                  className={`bg-white rounded-2xl p-4 border transition-all ${
                    selectedActivityId === act.id
                      ? 'border-teal shadow-md'
                      : 'border-gray-100 shadow-soft hover:shadow-card'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs text-white flex-shrink-0"
                        style={{
                          background: act.isUMKM ? '#059669' : '#176B67',
                        }}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-charcoal text-sm">{act.name}</h4>
                          {act.isUMKM && (
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full">
                              UMKM
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-charcoal-lighter mt-0.5">
                          {act.time} · {act.duration} · {act.cost > 0 ? formatCurrency(act.cost) : 'Gratis'}
                        </p>
                      </div>
                    </div>

                    {/* Reorder & Delete Actions */}
                    <div className="flex items-center gap-1 text-charcoal-lighter">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMoveActivity(idx, 'up'); }}
                        disabled={idx === 0}
                        className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center disabled:opacity-20"
                        title="Geser Naik"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMoveActivity(idx, 'down'); }}
                        disabled={idx === currentDay.activities.length - 1}
                        className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center disabled:opacity-20"
                        title="Geser Turun"
                      >
                        <ArrowDown size={13} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteActivity(act.id, act.name); }}
                        className="w-7 h-7 rounded-lg hover:bg-red-50 hover:text-red-600 flex items-center justify-center"
                        title="Hapus"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {act.notes && (
                    <p className="text-xs text-charcoal-lighter mt-2.5 pt-2 border-t border-gray-50 leading-relaxed">
                      {act.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Map View & Actions */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl shadow-soft overflow-hidden border border-gray-100 p-3">
              <MapView
                activities={currentDay.activities}
                height="240px"
                zoom={12}
                selectedActivityId={selectedActivityId}
              />

              <button
                onClick={openGoogleMaps}
                className="w-full mt-3 flex items-center justify-center gap-1.5 bg-teal text-white font-bold text-xs py-2.5 rounded-xl hover:bg-teal-dark transition-colors"
              >
                <ExternalLink size={13} />
                <span>Buka Rute di Google Maps</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-gray-100 text-xs space-y-2">
              <span className="font-bold text-charcoal block">Ringkasan Biaya Hari {currentDay.day}:</span>
              <div className="flex justify-between text-charcoal-lighter">
                <span>Total Biaya Hari Ini:</span>
                <strong className="text-teal font-extrabold text-sm">
                  {formatCurrency(currentDay.activities.reduce((s, a) => s + (a.cost || 0) + (a.transportCost || 0), 0))}
                </strong>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ── Tab 2: Budget Breakdown ── */}
      {activeTab === 'budget' && (
        <div className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-charcoal text-base">Alokasi Anggaran ({formatCurrency(itinerary.totalBudget)})</h3>
            <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full">
              {tripImpact.localContributionRatio}% Belanja ke UMKM
            </span>
          </div>

          <div className="space-y-3">
            {budgetBreakdown.map((item, i) => {
              const pct = Math.round((item.amount / itinerary.totalBudget) * 100);
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-charcoal">{item.label}</span>
                    <span className="font-bold text-charcoal">{formatCurrency(item.amount)} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: item.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Add Spot Modal ── */}
      {showAddSpotModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h4 className="font-bold text-charcoal text-sm">Tambah ke Hari {currentDay.day}</h4>
              <button onClick={() => setShowAddSpotModal(false)} className="text-gray-400 hover:text-charcoal">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {mockLocalBusinesses.slice(0, 4).map((b) => (
                <div
                  key={b.id}
                  onClick={() => handleAddSpot(b)}
                  className="p-3 rounded-xl border border-gray-100 hover:border-teal hover:bg-teal/5 transition-all cursor-pointer flex items-center justify-between text-xs"
                >
                  <div>
                    <strong className="text-charcoal block">{b.name}</strong>
                    <span className="text-charcoal-lighter">{b.city}</span>
                  </div>
                  <span className="font-bold text-teal">+ Tambah</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Export Modal ── */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h4 className="font-bold text-charcoal text-sm">Cetak Itinerary</h4>
              <button onClick={() => setShowExportModal(false)} className="text-gray-400 hover:text-charcoal">
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-charcoal-lighter leading-relaxed">
              Cetak rencana perjalanan <strong>{itinerary.title}</strong> ke format kertas atau simpan sebagai dokumen PDF untuk dibaca saat offline di perjalanan.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => { window.print(); setShowExportModal(false); }}
                className="flex-1 py-2.5 bg-teal text-white font-bold text-xs rounded-xl hover:bg-teal-dark"
              >
                Cetak / Simpan PDF
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2.5 border border-gray-200 text-charcoal font-bold text-xs rounded-xl"
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
