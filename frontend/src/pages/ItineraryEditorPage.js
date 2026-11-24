import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, GripVertical, Check,
  Clock, RotateCcw, Save, ArrowUp, ArrowDown, RefreshCw,
  AlertTriangle, Store, Sparkles, CheckCircle2, ChevronRight, X,
  MapPin, SlidersHorizontal, Info
} from 'lucide-react';
import {
  mockItineraries, mockLocalBusinesses, mockDestinations,
  getPeriodIcon, getCategoryColor, formatCurrency,
  calculateDistanceKm, calculateTravelTimeMin, formatMinutesToDuration,
  optimizeActivities, getItineraryById, saveItinerary
} from '../data/mockData';

const changeReasons = [
  {
    id: 'delayed',
    label: 'Kedatangan / Mulai Tertunda 2 Jam',
    desc: 'Semua jadwal dimundurkan 2 jam secara otomatis agar tidak terburu-buru.',
    badge: '+2 Jam',
  },
  {
    id: 'closed',
    label: 'Destinasi Sedang Tutup / Hari Libur',
    desc: 'Otomatis mencarikan alternatif UMKM atau wisata terdekat yang buka.',
    badge: 'Ganti Titik',
  },
  {
    id: 'rain',
    label: 'Cuaca Buruk / Hujan Deras',
    desc: 'Memprioritaskan workshop batik / museum / kuliner indoor lokal.',
    badge: 'Indoor Prioritas',
  },
  {
    id: 'relaxed',
    label: 'Ingin Rute Santai (Slow Travel)',
    desc: 'Menambah jeda istirahat dan mengurangi titik transit yang terburu-buru.',
    badge: 'Santai',
  },
];

function ItineraryEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const baseItinerary = getItineraryById(id);

  const [itinerary, setItinerary] = useState(baseItinerary);
  const [selectedDay, setSelectedDay] = useState(0);
  const [saved, setSaved] = useState(false);
  const [editingTimeId, setEditingTimeId] = useState(null);
  const [newTimeVal, setNewTimeVal] = useState('');

  // Reschedule modal & notification state
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState(null);
  const [rescheduledNotice, setRescheduledNotice] = useState(false);

  // Replace destination modal state
  const [replacingActivityId, setReplacingActivityId] = useState(null);

  // Add new destination modal state
  const [addModalOpen, setAddModalOpen] = useState(false);

  const currentDay = itinerary.days[selectedDay] || itinerary.days[0];

  // Helper to re-chain sequence: recalculate distances and times between adjacent stops
  const recalculateDaySequence = (activitiesList) => {
    let currentHour = 8;
    let currentMin = 0;

    return activitiesList.map((activity, idx) => {
      let distKm = 0;
      let travelMin = 0;

      if (idx > 0) {
        const prev = activitiesList[idx - 1];
        distKm = calculateDistanceKm(prev.lat, prev.lng, activity.lat, activity.lng);
        travelMin = calculateTravelTimeMin(distKm, activity.transport || 'car');
        currentMin += travelMin;
        while (currentMin >= 60) {
          currentHour += 1;
          currentMin -= 60;
        }
      }

      // If user manually set a time, preserve or adjust
      const timeStr = `${currentHour < 10 ? '0' : ''}${currentHour}:${currentMin < 10 ? '0' : ''}${currentMin}`;
      currentHour += 2;

      let period = 'morning';
      if (currentHour >= 12 && currentHour < 17) period = 'afternoon';
      else if (currentHour >= 17 && currentHour < 20) period = 'evening';
      else if (currentHour >= 20) period = 'night';

      return {
        ...activity,
        time: timeStr,
        period,
        distanceFromPrev: idx === 0 ? null : `${distKm} km`,
        travelTime: idx === 0 ? null : formatMinutesToDuration(travelMin),
      };
    });
  };

  const updateCurrentDayActivities = (newActivities) => {
    const recalculated = recalculateDaySequence(newActivities);
    const updatedDays = itinerary.days.map((d, i) =>
      i === selectedDay ? { ...d, activities: recalculated } : d
    );
    setItinerary({ ...itinerary, days: updatedDays });
    setSaved(false);
  };

  // Move activity up or down
  const moveActivity = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= currentDay.activities.length) return;
    const reordered = [...currentDay.activities];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    updateCurrentDayActivities(reordered);
  };

  // Delete activity
  const removeActivity = (idx) => {
    const filtered = currentDay.activities.filter((_, i) => i !== idx);
    updateCurrentDayActivities(filtered);
  };

  // Replace destination with selected place
  const handleReplaceActivity = (oldActivityId, newPlace) => {
    const updated = currentDay.activities.map((act) => {
      if (act.id === oldActivityId) {
        return {
          ...act,
          name: newPlace.name,
          category: newPlace.category,
          cost: newPlace.avgCost || newPlace.ticketPrice || 35000,
          notes: `Dipilih sebagai pengganti: ${newPlace.description}`,
          isUMKM: newPlace.isUMKM || false,
          image: newPlace.image,
          lat: newPlace.lat,
          lng: newPlace.lng,
        };
      }
      return act;
    });
    updateCurrentDayActivities(updated);
    setReplacingActivityId(null);
  };

  // Add place to current day
  const handleAddPlace = (place) => {
    const newAct = {
      id: `act-add-${Date.now()}`,
      time: '18:00',
      period: 'evening',
      name: place.name,
      duration: '1.5 jam',
      category: place.category,
      image: place.image,
      cost: place.avgCost || place.ticketPrice || 25000,
      notes: place.description,
      transport: 'Mobil',
      transportCost: 20000,
      distanceFromPrev: '3.0 km',
      travelTime: '10 min',
      lat: place.lat,
      lng: place.lng,
      isUMKM: place.isUMKM || false,
    };
    updateCurrentDayActivities([...currentDay.activities, newAct]);
    setAddModalOpen(false);
  };

  // Quick optimization trigger in editor
  const handleQuickOptimize = (mode) => {
    const optimized = optimizeActivities(currentDay.activities, mode);
    const updatedDays = itinerary.days.map((d, i) =>
      i === selectedDay ? { ...d, activities: optimized } : d
    );
    setItinerary({ ...itinerary, optimization: mode, days: updatedDays });
    setRescheduledNotice(true);
    setTimeout(() => setRescheduledNotice(false), 4000);
  };

  // Smart Reschedule Logic
  const handleApplyReschedule = () => {
    if (!selectedReason) return;

    let adjusted = [...currentDay.activities];

    if (selectedReason.id === 'delayed') {
      // Shift start time by 2 hours
      let hour = 10;
      let min = 0;
      adjusted = adjusted.map((act) => {
        const timeStr = `${hour < 10 ? '0' : ''}${hour}:${min < 10 ? '0' : ''}${min}`;
        hour += 2;
        return {
          ...act,
          time: timeStr,
          rescheduled: true,
          notes: `${act.notes || ''} (Mulai dimundurkan karena kendala keterlambatan)`,
        };
      });
    } else if (selectedReason.id === 'rain') {
      // Prioritize indoor craft/workshop and culinary
      adjusted = [
        ...adjusted.filter((a) => a.category === 'Craft' || a.category === 'Culinary'),
        ...adjusted.filter((a) => a.category !== 'Craft' && a.category !== 'Culinary'),
      ];
      adjusted = recalculateDaySequence(adjusted).map((a) => ({
        ...a,
        rescheduled: true,
      }));
    } else {
      // General re-sequence
      adjusted = recalculateDaySequence(adjusted).map((a) => ({
        ...a,
        rescheduled: true,
      }));
    }

    const updatedDays = itinerary.days.map((d, i) =>
      i === selectedDay ? { ...d, activities: adjusted } : d
    );

    setItinerary({ ...itinerary, days: updatedDays });
    setRescheduleModalOpen(false);
    setRescheduledNotice(true);
    setTimeout(() => setRescheduledNotice(false), 5000);
  };

  const handleSave = () => {
    saveItinerary(itinerary);
    setSaved(true);
    setTimeout(() => {
      navigate(`/itinerary/${id}`);
    }, 900);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeInUp pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/itinerary/${id}`)}
            className="w-9 h-9 rounded-xl border-2 border-gray-200 flex items-center justify-center hover:border-teal transition-colors"
          >
            <ArrowLeft size={16} className="text-charcoal" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-charcoal">
              Itinerary Management
            </h1>
            <p className="text-xs text-charcoal-lighter">
              Kelola urutan titik singgah, sunting jam kunjungan, ganti destinasi, atau jalankan Smart Reschedule.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Smart Rescheduler Trigger Button */}
          <button
            onClick={() => setRescheduleModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal/10 hover:bg-teal/20 text-teal text-xs font-extrabold transition-all"
          >
            <RefreshCw size={14} />
            Smart Reschedule
          </button>

          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              saved
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-coral to-coral-dark text-white hover:shadow-coral'
            }`}
          >
            {saved ? <Check size={14} /> : <Save size={14} />}
            {saved ? 'Tersimpan!' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      {rescheduledNotice && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center gap-3 animate-fadeInUp">
          <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
          <div className="text-xs text-emerald-800">
            <p className="font-bold">Rute & Waktu Berhasil Dihitung Ulang!</p>
            <p className="text-emerald-700/80 mt-0.5">
              Jarak, durasi tempuh antar-lokasi, dan perkiraan biaya telah diselaraskan secara otomatis.
            </p>
          </div>
        </div>
      )}

      {/* Optimization Mode Shortcut */}
      <div className="bg-white rounded-2xl p-4 shadow-soft border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-teal" />
          <span className="text-xs font-bold text-charcoal">
            Optimasi Cepat Urutan Hari Ini:
          </span>
        </div>
        <div className="flex gap-2">
          {[
            { id: 'efficient', label: '⚡ Paling Hemat Waktu' },
            { id: 'budget', label: '💰 Prioritas Hemat Biaya' },
            { id: 'explore', label: '🧭 Seimbang & UMKM' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => handleQuickOptimize(mode.id)}
              className="px-3 py-1.5 rounded-xl border border-gray-200 hover:border-teal hover:bg-teal/5 text-[11px] font-bold text-charcoal-lighter hover:text-teal transition-all"
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Day Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {itinerary.days.map((day, i) => (
          <button
            key={i}
            onClick={() => setSelectedDay(i)}
            className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              selectedDay === i
                ? 'bg-teal text-white shadow-teal/30 shadow'
                : 'bg-white text-charcoal-lighter border border-gray-200 hover:border-teal'
            }`}
          >
            Hari {day.day} ({day.activities.length} titik)
          </button>
        ))}
      </div>

      {/* Activities Sequence Management Table */}
      <div className="bg-white rounded-3xl shadow-soft overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-teal to-teal-light px-5 py-4 flex items-center justify-between text-white">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base">{currentDay.label}</h3>
            <p className="text-white/75 text-xs mt-0.5">
              Urutan disusun beruntun. Geser dengan panah untuk menghitung ulang jarak dan waktu tempuh.
            </p>
          </div>
          <span className="text-xs bg-white/20 font-bold px-3 py-1 rounded-full">
            {currentDay.activities.filter((a) => a.isUMKM).length} UMKM Mitra
          </span>
        </div>

        <div className="p-4 sm:p-5 space-y-3">
          {currentDay.activities.map((activity, idx) => (
            <div
              key={activity.id}
              className={`flex items-center gap-3 rounded-2xl p-3 sm:p-3.5 border transition-all ${
                activity.rescheduled
                  ? 'bg-amber-50/70 border-amber-200'
                  : 'bg-gray-50/80 hover:bg-gray-100/70 border-gray-100'
              }`}
            >
              {/* Order Number & Period Icon */}
              <div className="flex flex-col items-center justify-center w-10 flex-shrink-0">
                <span className="text-[10px] font-extrabold text-charcoal-lighter">
                  #{idx + 1}
                </span>
                <span className="text-lg mt-0.5">{getPeriodIcon(activity.period)}</span>
              </div>

              {/* Stop Information */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-charcoal text-xs sm:text-sm truncate">
                    {activity.name}
                  </h4>
                  {activity.isUMKM && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Store size={10} /> UMKM
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getCategoryColor(
                      activity.category
                    )}`}
                  >
                    {activity.category}
                  </span>
                  {activity.rescheduled && (
                    <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                      Disesuaikan
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-charcoal-lighter mt-1">
                  <span className="font-semibold text-charcoal flex items-center gap-1">
                    <Clock size={11} className="text-teal" />
                    {activity.time} · {activity.duration}
                  </span>
                  <span className="text-teal font-semibold">
                    {formatCurrency(activity.cost)}
                  </span>
                  {activity.distanceFromPrev && (
                    <span className="text-charcoal-lighter flex items-center gap-1">
                      🚗 {activity.distanceFromPrev} ({activity.travelTime} dari titik sebelumnya)
                    </span>
                  )}
                </div>
              </div>

              {/* Actions: Reorder, Replace, Delete */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => setReplacingActivityId(activity.id)}
                  className="px-2.5 py-1 bg-white border border-gray-200 hover:border-teal text-teal text-[11px] font-bold rounded-xl transition-colors shadow-2xs"
                  title="Ganti destinasi ini"
                >
                  Ganti
                </button>
                <button
                  onClick={() => moveActivity(idx, idx - 1)}
                  disabled={idx === 0}
                  className="w-7 h-7 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 disabled:opacity-30"
                  title="Pindah urutan ke atas"
                >
                  <ArrowUp size={12} />
                </button>
                <button
                  onClick={() => moveActivity(idx, idx + 1)}
                  disabled={idx === currentDay.activities.length - 1}
                  className="w-7 h-7 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 disabled:opacity-30"
                  title="Pindah urutan ke bawah"
                >
                  <ArrowDown size={12} />
                </button>
                <button
                  onClick={() => removeActivity(idx)}
                  className="w-7 h-7 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
                  title="Hapus titik ini"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}

          {/* Add Stop Button */}
          <button
            onClick={() => setAddModalOpen(true)}
            className="w-full py-3.5 border-2 border-dashed border-teal/30 hover:border-teal rounded-2xl text-teal font-bold text-xs flex items-center justify-center gap-2 hover:bg-teal/5 transition-all mt-2"
          >
            <Plus size={15} />
            Tambah UMKM / Destinasi ke Rute Hari Ini
          </button>
        </div>
      </div>

      {/* Modal: Smart Reschedule */}
      {rescheduleModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-fadeInUp">
            <div className="bg-gradient-to-r from-teal to-teal-light p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <RefreshCw size={20} />
                <div>
                  <h3 className="font-extrabold text-base">Smart Rescheduler</h3>
                  <p className="text-white/75 text-xs">
                    Penyesuaian jadwal pintar tanpa merusak rencana keseluruhan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRescheduleModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-charcoal-lighter">
                Pilih kondisi aktual perjalanan. Sistem akan otomatis memundurkan jam, menyesuaikan rute terdekat, dan memprioritaskan kenyamanan Anda:
              </p>

              <div className="space-y-2.5">
                {changeReasons.map((reason) => (
                  <button
                    key={reason.id}
                    onClick={() => setSelectedReason(reason)}
                    className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all flex items-start justify-between gap-3 ${
                      selectedReason?.id === reason.id
                        ? 'border-teal bg-teal/5'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-charcoal text-xs sm:text-sm">
                        {reason.label}
                      </p>
                      <p className="text-[11px] text-charcoal-lighter mt-0.5">
                        {reason.desc}
                      </p>
                    </div>
                    <span className="text-[10px] bg-teal/10 text-teal font-extrabold px-2 py-0.5 rounded-full flex-shrink-0">
                      {reason.badge}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setRescheduleModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-charcoal-lighter text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  onClick={handleApplyReschedule}
                  disabled={!selectedReason}
                  className="flex-1 py-2.5 rounded-xl bg-teal text-white text-xs font-bold hover:bg-teal-dark transition-all disabled:opacity-40"
                >
                  Terapkan Penyesuaian
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Replace Destination */}
      {replacingActivityId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-fadeInUp">
            <div className="bg-charcoal p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Pilih Destinasi / UMKM Pengganti</h3>
                <p className="text-white/60 text-xs">
                  Pilihan tempat otentik di Yogyakarta dengan koordinat terverifikasi
                </p>
              </div>
              <button
                onClick={() => setReplacingActivityId(null)}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto space-y-2.5">
              {[...mockLocalBusinesses, ...mockDestinations].map((place) => (
                <div
                  key={place.id}
                  onClick={() => handleReplaceActivity(replacingActivityId, place)}
                  className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100 hover:border-teal hover:bg-teal/5 cursor-pointer transition-all"
                >
                  <img
                    src={place.image}
                    alt={place.name}
                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-charcoal text-xs sm:text-sm truncate">
                        {place.name}
                      </p>
                      {place.isUMKM && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                          UMKM
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-charcoal-lighter truncate">
                      {place.city} · {place.priceRange || formatCurrency(place.ticketPrice || 0)}
                    </p>
                    <p className="text-[11px] text-teal font-medium mt-0.5">
                      Buka {place.openHour} - {place.closeHour}
                    </p>
                  </div>
                  <button className="px-3 py-1.5 bg-teal text-white text-xs font-bold rounded-xl flex-shrink-0">
                    Pilih
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add New Destination to Route */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-fadeInUp">
            <div className="bg-teal p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Tambah Destinasi ke Rute</h3>
                <p className="text-white/75 text-xs">
                  Pilih UMKM atau destinasi lokal untuk disisipkan ke Hari {currentDay.day}
                </p>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto space-y-2.5">
              {[...mockLocalBusinesses, ...mockDestinations].map((place) => (
                <div
                  key={place.id}
                  onClick={() => handleAddPlace(place)}
                  className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100 hover:border-teal hover:bg-teal/5 cursor-pointer transition-all"
                >
                  <img
                    src={place.image}
                    alt={place.name}
                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-charcoal text-xs sm:text-sm truncate">
                        {place.name}
                      </p>
                      {place.isUMKM && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                          UMKM
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-charcoal-lighter truncate">
                      {place.city} · {place.priceRange || formatCurrency(place.ticketPrice || 0)}
                    </p>
                  </div>
                  <button className="px-3 py-1.5 bg-teal text-white text-xs font-bold rounded-xl flex-shrink-0">
                    Tambah
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ItineraryEditorPage;
