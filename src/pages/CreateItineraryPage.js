import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles, MapPin, Calendar, Users, DollarSign,
  Car, ArrowRight, Store, Check, RefreshCw
} from 'lucide-react';
import { PageLoader } from '../components/LoadingSkeleton';
import {
  searchIndonesianHubs,
} from '../services/regionService';
import { generateDynamicItinerary, saveItinerary } from '../data/mockData';

const POPULAR_DESTINATIONS = [
  'Bali',
  'Yogyakarta',
  'Danau Toba',
  'Labuan Bajo',
  'Bromo',
  'Bandung',
  'Tana Toraja',
  'Raja Ampat',
];

const INTEREST_OPTIONS = [
  { id: 'heritage', label: 'Candi & Adat', emoji: '🏛️' },
  { id: 'culinary', label: 'Kuliner Tradisional', emoji: '🍜' },
  { id: 'nature', label: 'Wisata Alam', emoji: '🌿' },
  { id: 'umkm', label: 'Sentra UMKM & Kriya', emoji: '🎨' },
  { id: 'beach', label: 'Bahari & Pesisir', emoji: '🏖️' },
];

function CreateItineraryPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [destination, setDestination] = useState(location.state?.destination || 'Bali');
  const [durationDays, setDurationDays] = useState(3);
  const [travelers, setTravelers] = useState(2);
  const [budgetPerPerson, setBudgetPerPerson] = useState('1500000');
  const [transportMode, setTransportMode] = useState('mobil');
  const [selectedInterests, setSelectedInterests] = useState(['heritage', 'culinary', 'umkm']);
  const [customNote, setCustomNote] = useState('');

  const [loading, setLoading] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const toggleInterest = (id) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleGenerate = (e) => {
    if (e) e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const generatedTrip = generateDynamicItinerary({
        destination,
        durationDays,
        budget: Number(budgetPerPerson) * travelers,
        travelers,
        priorityActivities: selectedInterests,
      });

      saveItinerary(generatedTrip);
      setLoading(false);
      navigate(`/itinerary/${generatedTrip.id}`);
    }, 2000);
  };

  if (loading) {
    return (
      <PageLoader
        message={`AI sedang menyusun rute terbaik di ${destination} dengan optimasi UMKM & waktu tempuh...`}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 animate-fadeIn">

      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-charcoal tracking-tight">
          AI Trip Planner
        </h2>
        <p className="text-xs sm:text-sm text-charcoal-lighter mt-0.5">
          Tentukan tujuan dan preferensimu. AI akan menyusun jadwal terpadat dan terefisien untuk seluruh Indonesia.
        </p>
      </div>

      {/* Unified Planner Form */}
      <form onSubmit={handleGenerate} className="bg-white rounded-3xl p-6 sm:p-8 shadow-soft border border-gray-100 space-y-6">

        {/* 1. Destinasi */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-charcoal block">
            Kota atau Pulau Tujuan di Indonesia:
          </label>
          <div className="relative">
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 focus-within:border-teal focus-within:bg-white transition-all">
              <MapPin size={17} className="text-coral flex-shrink-0" />
              <input
                type="text"
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value);
                  setSuggestionsOpen(true);
                }}
                onFocus={() => setSuggestionsOpen(true)}
                placeholder="Contoh: Danau Toba, Bali, Yogyakarta, Labuan Bajo..."
                className="w-full text-xs sm:text-sm font-semibold text-charcoal outline-none bg-transparent"
                required
              />
            </div>

            {suggestionsOpen && destination.length > 1 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg z-30 max-h-44 overflow-y-auto divide-y divide-gray-50">
                {searchIndonesianHubs(destination).slice(0, 6).map((h) => (
                  <div
                    key={h.name}
                    onClick={() => {
                      setDestination(h.name.split(' (')[0].split(' &')[0]);
                      setSuggestionsOpen(false);
                    }}
                    className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-xs flex justify-between items-center"
                  >
                    <span className="font-bold text-charcoal">{h.name}</span>
                    <span className="text-[10px] text-charcoal-lighter">{h.province}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Destination Pills */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {POPULAR_DESTINATIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  setDestination(d);
                  setSuggestionsOpen(false);
                }}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                  destination.toLowerCase() === d.toLowerCase()
                    ? 'bg-teal text-white font-bold'
                    : 'bg-gray-100 text-charcoal-lighter hover:text-charcoal'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Durasi & Jumlah Wisatawan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-charcoal block mb-1.5">
              Durasi Liburan:
            </label>
            <div className="flex gap-1.5">
              {[2, 3, 4, 5].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDurationDays(d)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    durationDays === d
                      ? 'bg-teal text-white shadow-sm'
                      : 'bg-gray-50 text-charcoal-lighter border border-gray-200 hover:text-charcoal'
                  }`}
                >
                  {d} Hari
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-charcoal block mb-1.5">
              Jumlah Wisatawan:
            </label>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
              <button
                type="button"
                onClick={() => setTravelers(Math.max(1, travelers - 1))}
                className="w-6 h-6 rounded-lg bg-white border border-gray-200 text-charcoal font-bold flex items-center justify-center text-xs"
              >
                –
              </button>
              <span className="flex-1 text-center font-bold text-xs sm:text-sm text-charcoal">
                {travelers} Orang
              </span>
              <button
                type="button"
                onClick={() => setTravelers(Math.min(10, travelers + 1))}
                className="w-6 h-6 rounded-lg bg-white border border-gray-200 text-charcoal font-bold flex items-center justify-center text-xs"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* 3. Minat Wisata */}
        <div>
          <label className="text-xs font-bold text-charcoal block mb-2">
            Fokus Kegiatan Favorit:
          </label>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((opt) => {
              const isSelected = selectedInterests.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleInterest(opt.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-charcoal text-white shadow-sm'
                      : 'bg-gray-50 text-charcoal-lighter border border-gray-200 hover:text-charcoal'
                  }`}
                >
                  <span>{opt.emoji}</span>
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Transportasi & Budget per Orang */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-charcoal block mb-1.5">
              Transportasi Utama:
            </label>
            <div className="flex gap-2">
              {[
                { id: 'mobil', label: 'Mobil', icon: '🚗' },
                { id: 'motor', label: 'Motor', icon: '🛵' },
                { id: 'campuran', label: 'Campuran', icon: '🚶' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTransportMode(t.id)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    transportMode === t.id
                      ? 'bg-teal text-white shadow-sm'
                      : 'bg-gray-50 text-charcoal-lighter border border-gray-200 hover:text-charcoal'
                  }`}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-charcoal block mb-1.5">
              Target Budget / Orang (IDR):
            </label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 focus-within:bg-white focus-within:border-teal">
              <span className="text-xs font-bold text-charcoal-lighter">Rp</span>
              <input
                type="number"
                value={budgetPerPerson}
                onChange={(e) => setBudgetPerPerson(e.target.value)}
                className="w-full text-xs font-bold text-charcoal outline-none bg-transparent"
              />
            </div>
          </div>
        </div>

        {/* 5. Catatan Tambahan (Opsional) */}
        <div>
          <label className="text-xs font-bold text-charcoal block mb-1.5">
            Catatan Tambahan (Opsional):
          </label>
          <input
            type="text"
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder="Contoh: utamakan kuliner pedas, ada anak kecil, penginapan dekat pantai..."
            className="w-full bg-gray-50 border border-gray-200 focus:border-teal rounded-xl px-3.5 py-2 text-xs text-charcoal outline-none"
          />
        </div>

        {/* Submit CTA */}
        <button
          type="submit"
          className="w-full py-3.5 rounded-2xl text-white font-extrabold text-sm transition-all hover:opacity-95 shadow-md flex items-center justify-center gap-2"
          style={{ background: '#FF6B5E' }}
        >
          <Sparkles size={16} />
          <span>Susun Itinerary dengan AI</span>
          <ArrowRight size={15} />
        </button>

      </form>

    </div>
  );
}

export default CreateItineraryPage;
