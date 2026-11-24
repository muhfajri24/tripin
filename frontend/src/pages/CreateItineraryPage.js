import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles, Send, MapPin, Calendar, Users, Wallet,
  Car, SlidersHorizontal, Check, RefreshCw, ArrowRight,
  Store, Compass, Clock, ChevronDown, ChevronUp, Globe
} from 'lucide-react';
import { PageLoader } from '../components/LoadingSkeleton';
import {
  POPULAR_DESTINATIONS_ID,
  searchIndonesianHubs,
  extractDestinationFromQuery
} from '../services/regionService';
import { generateDynamicItinerary, saveItinerary } from '../data/mockData';

const quickPrompts = [
  {
    title: 'Bali Heritage, Seni & Kuliner Autentik',
    destination: 'Bali',
    prompt: 'Liburan 3 hari di Bali: menikmati keindahan sawah berundak Tegalalang, santap siang nasi ayam rempah Kedewatan di Ubud, berkunjung ke sanggar perak Celuk, dan menikmati sunset dramatis di tebing Pura Uluwatu dengan budget Rp1.600.000.',
    tags: ['Bali', 'Budaya', 'Kuliner UMKM', '3 Hari'],
  },
  {
    title: 'Danau Toba & Tenun Ulos Samosir',
    destination: 'Danau Toba',
    prompt: 'Trip 3 hari di Danau Toba & Pulau Samosir: belajar menenun kain ulos di Huta Raja, menikmati kuliner arsik ikan mas rempah andaliman, melihat desa adat Batak, dan santai di Pusuk Buhit dengan budget Rp1.450.000.',
    tags: ['Sumatra', 'Budaya', 'Geopark', '3 Hari'],
  },
  {
    title: 'Labuan Bajo & Komodo Heritage',
    destination: 'Labuan Bajo',
    prompt: 'Liburan 3 hari di Labuan Bajo: berlayar ke Pulau Komodo dan Padar, menikmati kuliner ikan kuah asam warga lokal, belanja kain tenun ikat Manggarai di Goa Batu Cermin, dan ngopi sore Bajawa dengan budget Rp1.850.000.',
    tags: ['Nusa Tenggara', 'Bahari', 'UMKM', '3 Hari'],
  },
  {
    title: 'Bandung Heritage & Wisata Kawah',
    destination: 'Bandung',
    prompt: 'Trip 2 hari keliling Bandung: belajar angklung di Saung Angklung Udjo, sarapan kupat tahu Gempol legendaris, berkunjung ke perkebunan teh warga Ciwidey dan Kawah Putih dengan transportasi mobil.',
    tags: ['Jawa', 'Keluarga', 'Kuliner', '2 Hari'],
  },
];

const activityOptions = [
  { id: 'heritage', label: 'Candi & Heritage Adat', emoji: '🏛️' },
  { id: 'umkm', label: 'UMKM & Workshop Kerajinan', emoji: '🎨' },
  { id: 'culinary', label: 'Kuliner Khas Daerah', emoji: '🍜' },
  { id: 'nature', label: 'Alam & Hidden Gem Nusantara', emoji: '🌿' },
  { id: 'beach', label: 'Bahari, Laut & Pesisir', emoji: '🏖️' },
  { id: 'night', label: 'Pasar Tradisional & Malam', emoji: '🌙' },
];

const quickDestinationChips = [
  'Bali',
  'Danau Toba',
  'Bandung',
  'Labuan Bajo',
  'Tana Toraja',
  'Raja Ampat',
  'Bromo',
  'Yogyakarta',
];

function CreateItineraryPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const initialDest = location.state?.destination || 'Bali';

  // Natural language state (PRIMARY)
  const [naturalQuery, setNaturalQuery] = useState(
    location.state?.destination
      ? `Saya ingin membuat rencana liburan yang efisien di ${location.state.destination}, mengunjungi destinasi populer dan mencicipi kuliner UMKM lokal autentik.`
      : ''
  );

  // Stepped Form alternative (Secondary/Accordion)
  const [showGuidedForm, setShowGuidedForm] = useState(false);

  // Unified Plan State
  const [planState, setPlanState] = useState({
    destination: initialDest,
    durationDays: 3,
    travelers: 2,
    budgetPerPerson: '1500000',
    transportMode: 'mobil',
    priorityActivities: ['heritage', 'culinary', 'umkm'],
    pace: 'balanced', // 'balanced' | 'fast' | 'relaxed'
  });

  const [loading, setLoading] = useState(false);
  const [destSuggestionsOpen, setDestSuggestionsOpen] = useState(false);

  const handleApplyPrompt = (item) => {
    setNaturalQuery(item.prompt);
    setPlanState((prev) => ({
      ...prev,
      destination: item.destination || prev.destination,
      durationDays: item.prompt.includes('2 hari')
        ? 2
        : item.prompt.includes('4 hari')
        ? 4
        : 3,
    }));
  };

  const handleSelectDestination = (destName) => {
    setPlanState((prev) => ({ ...prev, destination: destName }));
    setDestSuggestionsOpen(false);
    if (!naturalQuery || naturalQuery.includes('liburan') || naturalQuery.includes('ingin')) {
      setNaturalQuery(
        `Saya ingin liburan ${planState.durationDays} hari di ${destName}, mengeksplor keindahan alam, budaya lokal, dan mencicipi kuliner UMKM autentik dengan estimasi budget hemat.`
      );
    }
  };

  const toggleActivity = (id) => {
    setPlanState((prev) => ({
      ...prev,
      priorityActivities: prev.priorityActivities.includes(id)
        ? prev.priorityActivities.filter((a) => a !== id)
        : [...prev.priorityActivities, id],
    }));
  };

  const handleGenerate = (e) => {
    if (e) e.preventDefault();
    setLoading(true);

    // Dynamic generation for ANY typed Indonesian destination
    setTimeout(() => {
      const generatedTrip = generateDynamicItinerary({
        destination: planState.destination,
        durationDays: planState.durationDays,
        budget: Number(planState.budgetPerPerson) * planState.travelers,
        travelers: planState.travelers,
        priorityActivities: planState.priorityActivities,
      });

      // Save into persistence so detail view & my itineraries immediately show it
      saveItinerary(generatedTrip);

      setLoading(false);
      navigate(`/itinerary/${generatedTrip.id}`);
    }, 2400);
  };

  if (loading) {
    return (
      <PageLoader
        message={`AI sedang menyusun rute terbaik di ${planState.destination} dengan optimasi UMKM & waktu tempuh...`}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeInUp pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 bg-coral/10 text-coral text-xs font-bold px-3 py-1 rounded-full mb-2">
          <Sparkles size={13} />
          AI Trip Planner Seluruh Indonesia (SDG 8)
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal tracking-tight">
          Susun Itinerary Cerdas Nusantara
        </h1>
        <p className="text-charcoal-lighter text-xs sm:text-sm mt-1">
          Ketikkan destinasi mana pun di Indonesia — Bali, Sumatra, Jawa, Nusa Tenggara, Kalimantan, Sulawesi, hingga Papua. TRIPIN akan menyusun rute terpadat, waktu tempuh efisien, dan memprioritaskan rekomendasi usaha lokal.
        </p>
      </div>

      {/* Destination Quick Selector Chips */}
      <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-charcoal flex items-center gap-1.5">
            <Globe size={14} className="text-teal" />
            Destinasi Populer Nusantara:
          </span>
          <span className="text-[11px] text-charcoal-lighter">
            Klik untuk memilih kota / daerah
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {quickDestinationChips.map((dest) => (
            <button
              key={dest}
              type="button"
              onClick={() => handleSelectDestination(dest)}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                planState.destination.toLowerCase() === dest.toLowerCase()
                  ? 'bg-teal text-white shadow-sm font-bold'
                  : 'bg-gray-50 text-charcoal-lighter hover:bg-teal/10 hover:text-teal'
              }`}
            >
              {dest}
            </button>
          ))}
        </div>
      </div>

      {/* PRIMARY INTERFACE: Conversational Natural Language Planner */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-soft border-2 border-teal/20 relative overflow-hidden">
        
        {/* Prominent Destination Input Field */}
        <div className="mb-4">
          <label className="text-xs font-bold text-charcoal mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <MapPin size={14} className="text-coral" />
              Kota / Pulau Tujuan di Indonesia:
            </span>
            <span className="text-[11px] text-teal font-medium">
              Otomatis terdeteksi saat Anda mengetik di bawah
            </span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={planState.destination}
              onChange={(e) => {
                const val = e.target.value;
                setPlanState((prev) => ({ ...prev, destination: val }));
                setDestSuggestionsOpen(true);
              }}
              onFocus={() => setDestSuggestionsOpen(true)}
              placeholder="Contoh: Bali, Danau Toba, Bandung, Labuan Bajo..."
              className="w-full bg-cream/40 border-2 border-gray-200 focus:border-teal rounded-xl py-2.5 px-3.5 text-xs sm:text-sm font-extrabold text-charcoal outline-none transition-colors"
            />
            {destSuggestionsOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto">
                {searchIndonesianHubs(planState.destination).slice(0, 8).map((h) => (
                  <div
                    key={h.name}
                    onClick={() => {
                      handleSelectDestination(h.name.split(' (')[0].split(' &')[0]);
                    }}
                    className="px-3.5 py-2.5 hover:bg-teal/10 cursor-pointer text-xs flex justify-between items-center transition-colors border-b border-gray-50 last:border-0"
                  >
                    <span className="font-bold text-charcoal">{h.name}</span>
                    <span className="text-[10px] bg-gray-100 text-charcoal-lighter px-2 py-0.5 rounded font-medium">
                      {h.province}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-2">
          <label className="text-xs sm:text-sm font-bold text-charcoal flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Ceritakan Rencana Perjalanan Anda:
          </label>
          <span className="text-[11px] text-teal font-semibold">
            Bebas sebut tujuan, durasi, atau budget
          </span>
        </div>

        <form onSubmit={handleGenerate}>
          <div className="relative">
            <textarea
              rows={4}
              value={naturalQuery}
              onChange={(e) => {
                const val = e.target.value;
                setNaturalQuery(val);

                // 1. Auto-extract destination from natural language text
                const extracted = extractDestinationFromQuery(val);
                if (extracted) {
                  setPlanState((prev) => ({
                    ...prev,
                    destination: extracted.name.split(' (')[0],
                  }));
                }

                // 2. Auto-extract duration (e.g. "2 hari", "3 hari", "4 hari")
                const durationMatch = val.match(/(\d+)\s*(hari|day)/i);
                if (durationMatch) {
                  const d = parseInt(durationMatch[1], 10);
                  if (d >= 1 && d <= 10) {
                    setPlanState((prev) => ({ ...prev, durationDays: d }));
                  }
                }
              }}
              placeholder="Contoh: Saya ingin liburan 3 hari di Bali bersama teman. Pagi hari santai di sawah berundak Tegalalang, siang makan nasi ayam autentik Kedewatan di Ubud, sore belanja perhiasan perak Celuk, dan sunset di Uluwatu..."
              className="w-full border-2 border-gray-100 focus:border-teal rounded-2xl p-4 text-xs sm:text-sm text-charcoal placeholder:text-gray-400 outline-none resize-none transition-all focus:bg-teal/[0.02]"
            />
          </div>

          {/* Extracted Parameter Badges Preview */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] font-semibold text-charcoal-lighter">
              Parameter Aktif:
            </span>
            <span className="bg-sky text-teal font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
              <MapPin size={11} className="text-coral" /> Destinasi: {planState.destination}
            </span>
            <span className="bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
              <Calendar size={11} /> {planState.durationDays} Hari Perjalanan
            </span>
            <span className="bg-amber-50 text-amber-700 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
              <Users size={11} /> {planState.travelers} Wisatawan
            </span>
            <span className="bg-purple-50 text-purple-700 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
              <Store size={11} /> Prioritas UMKM Lokal
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full mt-4 py-3.5 bg-gradient-to-r from-coral to-coral-dark text-white font-extrabold text-sm rounded-2xl hover:shadow-coral transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
          >
            <Sparkles size={16} />
            Hasilkan Itinerary Otomatis untuk {planState.destination}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Quick Inspiration Prompts */}
        <div className="mt-6 pt-5 border-t border-gray-100">
          <p className="text-xs font-bold text-charcoal-lighter mb-2.5">
            Atau pilih template inspirasi destinasi nusantara:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {quickPrompts.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleApplyPrompt(item)}
                className="p-3 rounded-2xl border border-gray-100 hover:border-teal hover:bg-teal/5 cursor-pointer transition-all text-left group"
              >
                <div className="flex items-center justify-between">
                  <p className="font-bold text-charcoal text-xs group-hover:text-teal transition-colors">
                    {item.title}
                  </p>
                  <ArrowRight size={12} className="text-gray-300 group-hover:text-teal" />
                </div>
                <div className="flex gap-1 mt-1.5">
                  {item.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] bg-gray-100 text-charcoal-lighter px-2 py-0.5 rounded-md font-medium"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECONDARY / ALTERNATIVE: Unified Stepped Form Accordion */}
      <div className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowGuidedForm(!showGuidedForm)}
          className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal/10 text-teal flex items-center justify-center">
              <SlidersHorizontal size={18} />
            </div>
            <div>
              <p className="font-bold text-charcoal text-sm">
                Form Penyesuaian Detail (Opsional)
              </p>
              <p className="text-xs text-charcoal-lighter">
                Ketik nama kota mana pun di Indonesia, atur durasi, jumlah wisatawan, atau budget secara manual.
              </p>
            </div>
          </div>
          {showGuidedForm ? (
            <ChevronUp size={18} className="text-charcoal-lighter" />
          ) : (
            <ChevronDown size={18} className="text-charcoal-lighter" />
          )}
        </button>

        {showGuidedForm && (
          <div className="p-5 sm:p-6 border-t border-gray-100 space-y-5 animate-fadeInUp bg-gray-50/50">
            {/* Row 1: Destination & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <label className="text-xs font-bold text-charcoal-lighter block mb-1">
                  Kota / Wilayah di Indonesia
                </label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3 top-3 text-teal" />
                  <input
                    type="text"
                    value={planState.destination}
                    onChange={(e) => {
                      setPlanState({ ...planState, destination: e.target.value });
                    }}
                    placeholder="Contoh: Bali, Danau Toba..."
                    className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-9 pr-3 text-xs sm:text-sm font-semibold text-charcoal outline-none focus:border-teal"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-charcoal-lighter block mb-1">
                  Durasi Perjalanan
                </label>
                <div className="flex gap-1.5">
                  {[2, 3, 4, 5].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() =>
                        setPlanState({ ...planState, durationDays: d })
                      }
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                        planState.durationDays === d
                          ? 'bg-teal text-white shadow-teal/30 shadow'
                          : 'bg-white border border-gray-200 text-charcoal-lighter hover:border-teal'
                      }`}
                    >
                      {d} Hari
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-charcoal-lighter block mb-1">
                  Jumlah Wisatawan
                </label>
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-2 py-1">
                  <button
                    type="button"
                    onClick={() =>
                      setPlanState((prev) => ({
                        ...prev,
                        travelers: Math.max(1, prev.travelers - 1),
                      }))
                    }
                    className="w-7 h-7 rounded-lg bg-gray-100 text-charcoal font-bold flex items-center justify-center"
                  >
                    –
                  </button>
                  <span className="flex-1 text-center font-bold text-xs sm:text-sm text-charcoal">
                    {planState.travelers} Orang
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPlanState((prev) => ({
                        ...prev,
                        travelers: Math.min(10, prev.travelers + 1),
                      }))
                    }
                    className="w-7 h-7 rounded-lg bg-gray-100 text-charcoal font-bold flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Row 2: Activities Selection */}
            <div>
              <label className="text-xs font-bold text-charcoal-lighter block mb-2">
                Fokus Kegiatan & Minat Wisata
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {activityOptions.map((opt) => {
                  const active = planState.priorityActivities.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleActivity(opt.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                        active
                          ? 'border-teal bg-teal/10 text-teal font-bold'
                          : 'border-gray-200 bg-white text-charcoal-lighter hover:border-gray-300'
                      }`}
                    >
                      <span>{opt.emoji}</span>
                      <span className="text-xs truncate">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 3: Transport & Budget */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-charcoal-lighter block mb-1">
                  Transportasi Pilihan
                </label>
                <div className="flex gap-2">
                  {[
                    { id: 'mobil', label: 'Sewa Mobil', emoji: '🚗' },
                    { id: 'motor', label: 'Motor / Ojek', emoji: '🛵' },
                    { id: 'campuran', label: 'Campuran', emoji: '🚶' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() =>
                        setPlanState({ ...planState, transportMode: t.id })
                      }
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                        planState.transportMode === t.id
                          ? 'bg-teal text-white'
                          : 'bg-white border border-gray-200 text-charcoal-lighter hover:border-teal'
                      }`}
                    >
                      <span>{t.emoji}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-charcoal-lighter block mb-1">
                  Perkiraan Anggaran / Orang (IDR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-charcoal-lighter font-semibold">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={planState.budgetPerPerson}
                    onChange={(e) =>
                      setPlanState({
                        ...planState,
                        budgetPerPerson: e.target.value,
                      })
                    }
                    className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-9 pr-3 text-xs sm:text-sm font-semibold text-charcoal outline-none focus:border-teal"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              className="w-full py-3 bg-teal text-white font-bold text-xs sm:text-sm rounded-xl hover:bg-teal-dark transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={14} />
              Terapkan Pengaturan & Susun Itinerary
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CreateItineraryPage;
