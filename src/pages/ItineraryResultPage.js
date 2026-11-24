import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  MapPin, Calendar, Clock, Share2, Edit3, ExternalLink,
  ChevronDown, ChevronUp, Store, Award, PieChart,
  DollarSign, Sparkles, Navigation, Download, Bookmark, RefreshCw, Map
} from 'lucide-react';
import {
  mockItineraries, mockBudget, formatCurrency,
  optimizeActivities, getTripImpactStats, getItineraryById, saveItinerary
} from '../data/mockData';
import ItineraryTimeline from '../components/ItineraryTimeline';
import MapView from '../components/MapView';
import OptimizationSelector from '../components/OptimizationSelector';
import BudgetCard from '../components/BudgetCard';

// Destination hero images mapped by keyword
const DEST_IMAGES = {
  bali:        '/images/hero/hero-bali.jpg',
  yogyakarta:  '/images/hero/hero-malioboro.jpg',
  bromo:       '/images/hero/hero-bromo.jpg',
  'raja ampat':'/images/hero/hero-rajaampat.jpg',
  'banda neira':'/images/hero/hero-bandaneira.jpg',
  palembang:   '/images/hero/hero-ampera.jpg',
};

function getDestImage(destination) {
  if (!destination) return '/images/hero/hero-bromo.jpg';
  const key = Object.keys(DEST_IMAGES).find(k =>
    destination.toLowerCase().includes(k)
  );
  return key ? DEST_IMAGES[key] : '/images/hero/hero-rajaampat.jpg';
}

// Budget donut — pure CSS conic-gradient
function BudgetDonut({ categories, total }) {
  let cumulative = 0;
  const colors = ['#176B67', '#FF6B5E', '#FFC857', '#94a3b8'];
  const segments = categories.map((cat, i) => {
    const pct = total > 0 ? (cat.amount / total) * 100 : 25;
    const start = cumulative;
    cumulative += pct;
    return { ...cat, pct, start, end: cumulative, color: colors[i] };
  });

  const conicParts = segments.map(s =>
    `${s.color} ${s.start.toFixed(1)}% ${s.end.toFixed(1)}%`
  ).join(', ');

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: 110, height: 110 }}>
        <div
          style={{
            width: '100%', height: '100%', borderRadius: '50%',
            background: `conic-gradient(${conicParts})`,
          }}
        />
        {/* Donut hole */}
        <div
          className="absolute bg-white rounded-full flex items-center justify-center"
          style={{ inset: '22px' }}
        >
          <span className="text-[9px] font-bold text-charcoal-lighter text-center leading-tight">
            Total<br />{formatCurrency(total)}
          </span>
        </div>
      </div>
      {/* Legend */}
      <div className="space-y-1.5 w-full">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: s.color }} />
              <span className="text-charcoal-lighter font-medium">{s.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-charcoal">{formatCurrency(s.amount)}</span>
              <span className="text-charcoal-lighter text-[10px]">{s.pct.toFixed(0)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ItineraryResultPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const baseItinerary = getItineraryById(id);
  const [itinerary, setItinerary] = useState(baseItinerary);
  const [selectedDay, setSelectedDay] = useState(0);
  const [optimization, setOptimization] = useState(baseItinerary.optimization || 'explore');
  const [mapExpanded, setMapExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('timeline');
  const [saved, setSaved] = useState(false);
  const [shareMsg, setShareMsg] = useState('');

  const tripImpact = getTripImpactStats(itinerary);

  const handleOptimizationChange = (newMode) => {
    setOptimization(newMode);
    const updatedDays = itinerary.days.map((day) => ({
      ...day,
      activities: optimizeActivities(day.activities, newMode),
    }));
    const updated = { ...itinerary, optimization: newMode, days: updatedDays };
    setItinerary(updated);
    saveItinerary(updated);
  };

  const handleSave = () => {
    saveItinerary(itinerary);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleShare = async () => {
    const text = `Check out my trip plan: ${itinerary.title} — ${itinerary.duration} at ${itinerary.destination} via TRIPIN!`;
    try {
      if (navigator.share) {
        await navigator.share({ title: itinerary.title, text });
      } else {
        await navigator.clipboard.writeText(text);
        setShareMsg('Link disalin!');
        setTimeout(() => setShareMsg(''), 2000);
      }
    } catch {}
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
    const origin = encodeURIComponent(`${valid[0].name}, ${valid[0].city || itinerary.destination}`);
    const dest = encodeURIComponent(`${valid[valid.length-1].name}, ${valid[valid.length-1].city || itinerary.destination}`);
    const waypoints = valid.slice(1,-1).map(a => encodeURIComponent(`${a.name}, ${a.city||itinerary.destination}`)).join('|');
    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}`;
    if (waypoints) url += `&waypoints=${waypoints}`;
    window.open(url, '_blank');
  };

  const heroImage = itinerary.coverImage || getDestImage(itinerary.destination);

  // Budget breakdown for donut
  const budgetCategories = [
    { label: 'Transport',    amount: Math.round(itinerary.totalBudget * 0.3) },
    { label: 'Kuliner',      amount: Math.round(itinerary.totalBudget * 0.25) },
    { label: 'Tiket Masuk',  amount: Math.round(itinerary.totalBudget * 0.25) },
    { label: 'Akomodasi',    amount: Math.round(itinerary.totalBudget * 0.2) },
  ];

  return (
    <div className="space-y-6 animate-fadeInUp pb-16">

      {/* ── Hero Banner ── */}
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{ minHeight: 280 }}
      >
        <img
          src={heroImage}
          alt={itinerary.destination}
          className="w-full h-full object-cover absolute inset-0"
          style={{ minHeight: 280 }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(160deg, rgba(10,22,21,0.7) 0%, rgba(23,107,103,0.4) 40%, rgba(10,22,21,0.85) 100%)' }}
        />

        <div className="relative z-10 p-6 md:p-8 flex flex-col justify-between" style={{ minHeight: 280 }}>
          {/* Top badges */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: 'rgba(23,107,103,0.7)', color: '#FFF', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
              🗓 Rencana Perjalanan Siap
            </span>
            <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: 'rgba(5,150,105,0.7)', color: '#FFF', backdropFilter: 'blur(8px)' }}>
              <Store className="inline w-3 h-3 mr-1" />
              {tripImpact.umkmCount} UMKM Mitra
            </span>
          </div>

          {/* Title section */}
          <div>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1">
              {itinerary.destination} · {itinerary.duration}
            </p>
            <h1
              className="text-2xl md:text-4xl font-extrabold text-white leading-tight tracking-tight mb-3"
              style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}
            >
              {itinerary.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-white/70 text-xs">
              <span className="flex items-center gap-1">
                <MapPin size={12} className="text-coral" /> {itinerary.destination}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {new Date(itinerary.dates?.start).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                {' – '}
                {new Date(itinerary.dates?.end).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Action buttons row */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => navigate(`/itinerary/${itinerary.id}/edit`)}
              className="flex items-center gap-2 font-bold text-xs px-4 py-2.5 rounded-xl transition-all hover:scale-[1.03] btn-press"
              style={{ background: 'linear-gradient(135deg, #FF6B5E 0%, #E55A4E 100%)', color: 'white', boxShadow: '0 6px 20px rgba(255,107,94,0.4)' }}
            >
              <Edit3 size={13} /> Kelola & Reschedule
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 font-bold text-xs px-4 py-2.5 rounded-xl transition-all hover:scale-[1.03] btn-press"
              style={{ background: saved ? 'rgba(5,150,105,0.8)' : 'rgba(255,255,255,0.18)', color: 'white', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <Bookmark size={13} /> {saved ? 'Tersimpan ✓' : 'Simpan Trip'}
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 font-bold text-xs px-4 py-2.5 rounded-xl transition-all hover:scale-[1.03] btn-press"
              style={{ background: 'rgba(255,255,255,0.18)', color: 'white', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <Share2 size={13} /> {shareMsg || 'Bagikan'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Local Impact Banner ── */}
      <div
        className="rounded-3xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border"
        style={{
          background: 'linear-gradient(135deg, rgba(5,150,105,0.06) 0%, rgba(23,107,103,0.08) 100%)',
          borderColor: 'rgba(23,107,103,0.15)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #176B67, #1E8A85)', boxShadow: '0 6px 20px rgba(23,107,103,0.35)' }}
          >
            <Award size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-charcoal text-sm">Dampak Ekonomi Lokal Perjalanan Ini</h3>
              <span className="text-[10px] bg-teal text-white font-extrabold px-2 py-0.5 rounded-full">SDG 8</span>
            </div>
            <p className="text-xs text-charcoal-lighter mt-0.5">
              Dari {tripImpact.totalStops} destinasi, sebanyak{' '}
              <span className="font-bold text-teal">{tripImpact.umkmCount} titik ({tripImpact.umkmPercentage}%)</span>{' '}
              merupakan UMKM lokal otentik.
            </p>
          </div>
        </div>

        <div
          className="flex items-center gap-6 rounded-2xl px-5 py-3 self-stretch md:self-auto justify-around border"
          style={{ background: 'white', borderColor: 'rgba(23,107,103,0.1)' }}
        >
          <div>
            <p className="text-[10px] uppercase tracking-wider text-charcoal-lighter font-bold">Belanja ke UMKM</p>
            <p className="text-sm font-extrabold text-teal">{formatCurrency(tripImpact.estimatedLocalSpending)}</p>
          </div>
          <div className="w-px h-8 bg-gray-100" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-charcoal-lighter font-bold">Kontribusi Lokal</p>
            <p className="text-sm font-extrabold text-emerald-700">{tripImpact.localContributionRatio}% pengeluaran</p>
          </div>
        </div>
      </div>

      {/* ── Optimization Selector ── */}
      <OptimizationSelector selected={optimization} onChange={handleOptimizationChange} />

      {/* ── Tab Bar ── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3"
        style={{ borderBottom: '1px solid rgba(37,50,56,0.08)' }}
      >
        <div className="flex gap-1.5 p-1 rounded-2xl" style={{ background: 'rgba(37,50,56,0.05)' }}>
          {[
            { id: 'timeline', label: '🗓 Jadwal & Peta' },
            { id: 'budget',   label: '💰 Rincian Anggaran' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
              style={
                activeTab === tab.id
                  ? { background: 'white', color: '#176B67', boxShadow: '0 2px 12px rgba(37,50,56,0.1)' }
                  : { color: '#6B7E85' }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Day selector - only in timeline tab */}
        {activeTab === 'timeline' && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {itinerary.days.map((day, i) => (
              <button
                key={i}
                onClick={() => setSelectedDay(i)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0 transition-all"
                style={
                  selectedDay === i
                    ? { background: '#253238', color: 'white', boxShadow: '0 4px 12px rgba(37,50,56,0.2)' }
                    : { background: 'white', color: '#6B7E85', border: '1px solid rgba(37,50,56,0.1)' }
                }
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
          {/* Timeline */}
          <div className="lg:col-span-2">
            <ItineraryTimeline
              day={currentDay}
              activities={currentDay.activities}
              onActivityClick={(act) => console.log('Activity:', act)}
            />
          </div>

          {/* Map + Day Summary */}
          <div className="space-y-4">
            {/* Map card */}
            <div
              className="rounded-3xl overflow-hidden border"
              style={{ background: 'white', borderColor: 'rgba(37,50,56,0.08)', boxShadow: '0 4px 20px rgba(37,50,56,0.07)' }}
            >
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: '1px solid rgba(37,50,56,0.06)' }}
              >
                <div className="flex items-center gap-1.5">
                  <Navigation size={14} className="text-teal" />
                  <h3 className="font-bold text-charcoal text-sm">Peta Rute Hari {currentDay.day}</h3>
                </div>
                <button
                  onClick={() => setMapExpanded(!mapExpanded)}
                  className="text-xs text-teal font-bold flex items-center gap-1 hover:text-teal-dark transition-colors"
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
                  className="w-full mt-3 flex items-center justify-center gap-2 font-bold text-xs py-2.5 rounded-xl text-white transition-all hover:scale-[1.02] btn-press"
                  style={{ background: 'linear-gradient(135deg, #176B67 0%, #1E8A85 100%)', boxShadow: '0 6px 20px rgba(23,107,103,0.3)' }}
                >
                  <ExternalLink size={13} />
                  Navigasi di Google Maps
                </button>
              </div>
            </div>

            {/* Day Summary */}
            <div
              className="rounded-3xl p-4 border space-y-3"
              style={{ background: 'white', borderColor: 'rgba(37,50,56,0.08)', boxShadow: '0 4px 20px rgba(37,50,56,0.07)' }}
            >
              <h4 className="font-extrabold text-charcoal text-xs uppercase tracking-wider text-charcoal-lighter">
                Ringkasan Hari {currentDay.day}
              </h4>
              {[
                { label: 'Titik Singgah',    val: `${currentDay.activities.length} Destinasi` },
                { label: 'Dukungan UMKM',    val: `${currentDay.activities.filter(a=>a.isUMKM).length} UMKM Lokal`, green: true },
                { label: 'Total Biaya Hari', val: formatCurrency(currentDay.activities.reduce((s,a)=>s+(a.cost||0)+(a.transportCost||0),0)), teal: true },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-xs py-1.5" style={{ borderBottom: '1px solid rgba(37,50,56,0.05)' }}>
                  <span className="text-charcoal-lighter">{row.label}:</span>
                  <span className={`font-extrabold ${row.green ? 'text-emerald-700' : row.teal ? 'text-teal' : 'text-charcoal'}`}>
                    {row.val}
                  </span>
                </div>
              ))}

              <button
                onClick={() => navigate(`/itinerary/${itinerary.id}/edit`)}
                className="w-full mt-1 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all hover:bg-teal/10 btn-press"
                style={{ border: '2px dashed rgba(23,107,103,0.3)', color: '#176B67' }}
              >
                <Edit3 size={12} /> Edit / Ganti Destinasi Hari Ini
              </button>
            </div>

            {/* Regenerate CTA */}
            <button
              onClick={() => navigate('/create')}
              className="w-full flex items-center justify-center gap-2 font-bold text-xs py-3 rounded-2xl transition-all hover:scale-[1.02] btn-press"
              style={{
                background: 'linear-gradient(135deg, rgba(255,107,94,0.1) 0%, rgba(255,200,87,0.1) 100%)',
                border: '1.5px solid rgba(255,107,94,0.25)',
                color: '#FF6B5E',
              }}
            >
              <RefreshCw size={13} /> Regenerate / Buat Trip Baru
            </button>
          </div>
        </div>
      )}

      {/* ── Tab 2: Budget ── */}
      {activeTab === 'budget' && (
        <div className="space-y-6">
          {/* Top 3 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: 'Total Anggaran Rencana',
                val: formatCurrency(itinerary.totalBudget),
                sub: `${itinerary.travelers || 2} Wisatawan · ${itinerary.duration}`,
                bg: 'linear-gradient(135deg, #176B67 0%, #1E8A85 100%)',
                color: 'white',
                shadow: '0 10px 30px rgba(23,107,103,0.35)',
              },
              {
                label: 'Alokasi ke UMKM Lokal',
                val: formatCurrency(tripImpact.estimatedLocalSpending),
                sub: `${tripImpact.localContributionRatio}% berputar di warga`,
                bg: 'white',
                borderLeft: '#059669',
                valColor: '#059669',
              },
              {
                label: 'Cadangan Tak Terduga',
                val: formatCurrency(Math.max(0, itinerary.totalBudget - tripImpact.totalActivityCost)),
                sub: 'Buffer darurat perjalanan',
                bg: 'white',
                borderLeft: '#FF6B5E',
                valColor: '#253238',
              },
            ].map((card, i) => (
              <div
                key={i}
                className="rounded-3xl p-5"
                style={{
                  background: card.bg,
                  color: card.color,
                  boxShadow: card.shadow || '0 4px 20px rgba(37,50,56,0.08)',
                  borderLeft: card.borderLeft ? `4px solid ${card.borderLeft}` : undefined,
                }}
              >
                <p className="text-xs font-semibold opacity-70 mb-1">{card.label}</p>
                <p className="text-2xl font-extrabold mt-1" style={{ color: card.valColor || card.color }}>
                  {card.val}
                </p>
                <p className="text-xs mt-1 opacity-60">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* Donut + Breakdown */}
          <div
            className="rounded-3xl p-6 border"
            style={{ background: 'white', borderColor: 'rgba(37,50,56,0.08)', boxShadow: '0 4px 20px rgba(37,50,56,0.07)' }}
          >
            <h3 className="font-extrabold text-charcoal text-base mb-6">Distribusi Anggaran Perjalanan</h3>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <div className="flex-shrink-0">
                <BudgetDonut categories={budgetCategories} total={itinerary.totalBudget} />
              </div>
              <div className="flex-1 space-y-3">
                {budgetCategories.map((cat, i) => {
                  const colors = ['#176B67', '#FF6B5E', '#FFC857', '#94a3b8'];
                  const pct = itinerary.totalBudget > 0 ? (cat.amount / itinerary.totalBudget * 100) : 25;
                  return (
                    <div key={cat.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-charcoal">{cat.label}</span>
                        <span className="font-bold text-charcoal">{formatCurrency(cat.amount)} · {pct.toFixed(0)}%</span>
                      </div>
                      <div style={{ height: 6, background: 'rgba(37,50,56,0.08)', borderRadius: 100, overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: colors[i],
                            borderRadius: 100,
                            transition: 'width 1s ease-out',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <BudgetCard budget={mockBudget} />
        </div>
      )}
    </div>
  );
}

export default ItineraryResultPage;
