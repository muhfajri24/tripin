import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sunrise,
  Sun,
  Sunset,
  Clock,
  Calendar,
} from "lucide-react";

export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

export function initialForm(req) {
  if (req)
    return {
      date: req.startDate,
      days: req.days,
      adults: req.travelers.adults,
      budget: req.budget.totalIdr,
      basis: "group",
      reserve: req.budget.reserveIdr,
      start: req.dayWindows[0].start,
      end: req.dayWindows[0].end,
      lodging: req.lodging?.placeId || "",
      rooms: req.lodging?.rooms || 1,
      checkIn: req.lodging?.checkInAt?.slice(11, 16) || "17:00",
      food: req.costAssumptions?.foodPersonIdr ?? "",
      hotel: req.costAssumptions?.lodgingRoomNightIdr ?? "",
      vehicle: req.costAssumptions?.vehicleDayIdr ?? "",
      allowUnknown: req.allowUnverifiedData,
      interests: req.interests,
      periodPreferences: req.periodPreferences,
      lat: req.arrivalAnchor.lat,
      lng: req.arrivalAnchor.lng,
      endLat: req.departureAnchor.lat,
      endLng: req.departureAnchor.lng,
      mustVisit: req.mustVisitPlaceIds,
    };
  return {
    date: today(),
    days: 1,
    adults: 2,
    budget: "",
    basis: "person",
    reserve: 0,
    start: "08:00",
    end: "20:00",
    lodging: "",
    rooms: 1,
    checkIn: "17:00",
    food: "",
    hotel: "",
    vehicle: "",
    allowUnknown: true,
    interests: ["culture", "food"],
    periodPreferences: [],
    lat: -7.7956,
    lng: 110.3695,
    endLat: -7.7956,
    endLng: 110.3695,
    mustVisit: [],
  };
}

export function toRequest(f) {
  const dates = Array.from({ length: Number(f.days) }, (_, i) => {
    const d = new Date(`${f.date}T12:00:00+07:00`);
    d.setUTCDate(d.getUTCDate() + i);
    return d.toISOString().slice(0, 10);
  });
  const amount = (x) => (x === "" ? null : Number(x));
  return {
    schemaVersion: 1,
    destinationId: "yogyakarta",
    startDate: f.date,
    days: Number(f.days),
    timezone: "Asia/Jakarta",
    travelers: { adults: Number(f.adults) },
    transportMode: "driving",
    budget: {
      totalIdr:
        Number(f.budget) * (f.basis === "person" ? Number(f.adults) : 1),
      originalBasis: f.basis,
      reserveIdr: Number(f.reserve),
    },
    dayWindows: dates.map((date) => ({ date, start: f.start, end: f.end })),
    arrivalAnchor: { lat: Number(f.lat), lng: Number(f.lng) },
    departureAnchor: { lat: Number(f.endLat), lng: Number(f.endLng) },
    lodging:
      Number(f.days) > 1
        ? {
            placeId: f.lodging,
            rooms: Number(f.rooms),
            nights: Number(f.days) - 1,
            checkInAt: `${f.date}T${f.checkIn}:00+07:00`,
          }
        : null,
    interests: f.interests,
    periodPreferences: f.periodPreferences,
    mustVisitPlaceIds: f.mustVisit,
    excludedPlaceIds: [],
    objective: "balanced",
    allowUnverifiedData: f.allowUnknown,
    costAssumptions: {
      foodPersonIdr: amount(f.food),
      lodgingRoomNightIdr: amount(f.hotel),
      vehicleDayIdr: amount(f.vehicle),
    },
  };
}

const EASE = [0.22, 1, 0.36, 1];

const BULAN_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const HARI_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export function formatIndoDate(dateStr) {
  if (!dateStr) return "";
  try {
    return new Date(`${dateStr}T12:00:00+07:00`).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function formatJam24(hhmm) {
  if (!hhmm) return "";
  return hhmm.replace(":", ".");
}

export function IndonesianDatePicker({ value, onChange }) {
  const initial = value ? new Date(`${value}T12:00:00+07:00`) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="w-64 select-none space-y-2">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          aria-label="Bulan sebelumnya"
          className="p-1.5 rounded-lg hover:bg-gray-100 text-charcoal"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-bold text-charcoal flex items-center gap-1.5">
          <Calendar size={14} className="text-teal" />
          {BULAN_ID[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          aria-label="Bulan berikutnya"
          className="p-1.5 rounded-lg hover:bg-gray-100 text-charcoal"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-charcoal-lighter">
        {HARI_ID.map((h) => (
          <span key={h} className="py-1">{h}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {cells.map((dayNum, idx) => {
          if (!dayNum) return <span key={`e-${idx}`} />;
          const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
          const isSelected = iso === value;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onChange(iso)}
              className={`h-8 rounded-lg text-xs font-bold transition-colors ${
                isSelected
                  ? "bg-teal text-white"
                  : "text-charcoal hover:bg-sky"
              }`}
            >
              {dayNum}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TimeSelect24({ label, value, onChange }) {
  const [hh = "08", mm = "00"] = (value || "08:00").split(":");
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const mins = ["00", "15", "30", "45"];

  return (
    <div className="space-y-1">
      <span className="text-sm font-semibold text-charcoal block">{label}</span>
      <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
        <Clock size={14} className="text-teal flex-shrink-0" />
        <select
          aria-label={`${label} jam`}
          value={hh}
          onChange={(e) => onChange(`${e.target.value}:${mm}`)}
          className="bg-transparent text-sm font-bold text-charcoal outline-none cursor-pointer"
        >
          {hours.map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
        <span className="font-bold text-charcoal">.</span>
        <select
          aria-label={`${label} menit`}
          value={mins.includes(mm) ? mm : "00"}
          onChange={(e) => onChange(`${hh}:${e.target.value}`)}
          className="bg-transparent text-sm font-bold text-charcoal outline-none cursor-pointer"
        >
          {mins.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <span className="text-xs text-charcoal-lighter ml-auto">WIB</span>
      </div>
    </div>
  );
}

const PERIOD_DEFS = [
  { id: "morning", label: "Pagi", icon: Sunrise },
  { id: "afternoon", label: "Siang", icon: Sun },
  { id: "evening", label: "Sore", icon: Sunset },
];

const PERIOD_CHOICES = [
  { id: "", label: "Fleksibel" },
  { id: "food", label: "Kuliner" },
  { id: "culture", label: "Budaya" },
  { id: "nature", label: "Alam" },
];

const ADV_TABS = [
  { id: "waktu", label: "Waktu" },
  { id: "biaya", label: "Penginapan & biaya" },
  { id: "wajib", label: "Tempat wajib" },
];

export default function PreferenceForm({ value: f, onChange, places }) {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("waktu");
  const set = (key, value) => onChange({ ...f, [key]: value });

  // Filter tempat berdasarkan daerah aktif di katalog (Yogyakarta)
  const regionPlaces = places.filter(
    (p) => !p.destinationId || p.destinationId === "yogyakarta",
  );

  const toggleMustVisit = (id) => {
    const exists = f.mustVisit.includes(id);
    const next = exists
      ? f.mustVisit.filter((x) => x !== id)
      : [...f.mustVisit, id];
    set("mustVisit", next);
  };

  return (
    <div className="border-t border-gray-100 pt-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 py-2 text-left"
        aria-expanded={open}
      >
        <div>
          <span className="text-base font-bold text-charcoal block">
            Pengaturan lanjutan
          </span>
          <span className="text-sm text-charcoal-lighter block">
            Atur waktu aktivitas, penginapan & perkiraan biaya, atau tempat wajib.
          </span>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: reduced ? 0 : 0.25, ease: EASE }}
          className="text-charcoal-lighter flex-shrink-0"
        >
          <ChevronDown size={20} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: reduced ? 0 : 0.25, ease: EASE }}
            className="pt-4 space-y-5"
          >
            {/* 3 Tab Pengaturan Lanjutan */}
            <div
              role="tablist"
              aria-label="Kategori pengaturan lanjutan"
              className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-xl"
            >
              {ADV_TABS.map((t) => {
                const isSelected = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setActiveTab(t.id)}
                    className={`relative py-2 px-3 rounded-lg text-sm font-bold transition-colors ${
                      isSelected ? "text-white" : "text-charcoal-lighter hover:text-charcoal"
                    }`}
                  >
                    {isSelected && (
                      <motion.span
                        layoutId="advSettingsTab"
                        transition={
                          reduced
                            ? { duration: 0 }
                            : { type: "spring", stiffness: 380, damping: 30 }
                        }
                        className="absolute inset-0 rounded-lg bg-teal"
                        style={{ zIndex: 0 }}
                      />
                    )}
                    <span className="relative z-10">{t.label}</span>
                  </button>
                );
              })}
            </div>

            {activeTab === "waktu" && (
              <div className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <TimeSelect24
                    label="Mulai aktivitas"
                    value={f.start}
                    onChange={(v) => set("start", v)}
                  />
                  <TimeSelect24
                    label="Selesai aktivitas"
                    value={f.end}
                    onChange={(v) => set("end", v)}
                  />
                </div>

                <div className="space-y-2.5">
                  <span className="text-sm font-bold text-charcoal block">
                    Suasana per waktu
                  </span>
                  {PERIOD_DEFS.map(({ id: period, label, icon: PeriodIcon }) => {
                    const selected =
                      f.periodPreferences.find((p) => p.period === period)
                        ?.categories[0] || "";
                    return (
                      <div
                        key={period}
                        className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 py-2 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center gap-2 text-sm font-bold text-charcoal min-w-[90px]">
                          <PeriodIcon size={16} className="text-teal" />
                          <span>{label}</span>
                        </div>

                        <div className="grid grid-cols-4 gap-1 bg-gray-100 p-1 rounded-xl flex-1 max-w-md">
                          {PERIOD_CHOICES.map((ch) => {
                            const isSelected = selected === ch.id;
                            return (
                              <button
                                key={ch.id || "flex"}
                                type="button"
                                onClick={() =>
                                  set("periodPreferences", [
                                    ...f.periodPreferences.filter((p) => p.period !== period),
                                    ...(ch.id ? [{ period, categories: [ch.id] }] : []),
                                  ])
                                }
                                className={`relative py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                                  isSelected ? "text-white" : "text-charcoal-lighter hover:text-charcoal"
                                }`}
                              >
                                {isSelected && (
                                  <motion.span
                                    layoutId={`periodPill-${period}`}
                                    transition={
                                      reduced
                                        ? { duration: 0 }
                                        : { type: "spring", stiffness: 380, damping: 30 }
                                    }
                                    className="absolute inset-0 rounded-lg bg-teal"
                                    style={{ zIndex: 0 }}
                                  />
                                )}
                                <span className="relative z-10">{ch.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === "biaya" && (
              <div className="space-y-5">
                {Number(f.days) > 1 && (
                  <div className="space-y-3">
                    <span className="text-sm font-bold text-charcoal block">
                      Penginapan ({Number(f.days) - 1} malam · pilih sendiri, tanpa pemesanan otomatis)
                    </span>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <label className="space-y-1 block">
                        <span className="text-sm font-semibold text-charcoal block">
                          Penginapan
                        </span>
                        <select
                          value={f.lodging}
                          onChange={(e) => set("lodging", e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-charcoal outline-none focus:border-teal"
                        >
                          <option value="">Pilih penginapan (opsional)</option>
                          {regionPlaces
                            .filter((p) => p.kind === "lodging" && p.coordinates)
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                        </select>
                      </label>
                      <label className="space-y-1 block">
                        <span className="text-sm font-semibold text-charcoal block">
                          Jumlah kamar
                        </span>
                        <input
                          type="number"
                          min={1}
                          required
                          value={f.rooms}
                          onChange={(e) => set("rooms", e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-charcoal outline-none focus:border-teal"
                        />
                      </label>
                      <TimeSelect24
                        label="Batas tiba hotel"
                        value={f.checkIn}
                        onChange={(v) => set("checkIn", v)}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="space-y-1 block max-w-xs">
                    <span className="text-sm font-semibold text-charcoal block">
                      Dana cadangan grup (Rp)
                    </span>
                    <input
                      type="number"
                      min={0}
                      required
                      value={f.reserve}
                      onChange={(e) => set("reserve", e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-charcoal outline-none focus:border-teal"
                    />
                  </label>

                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <span className="text-sm font-bold text-charcoal block">
                      Perkiraan biaya (opsional)
                    </span>
                    <p className="text-sm text-charcoal-lighter">
                      Kosongkan jika belum tahu, kami tidak menganggapnya gratis.
                    </p>
                    <div className="grid sm:grid-cols-3 gap-3 pt-1">
                      <label className="space-y-1 block">
                        <span className="text-sm font-semibold text-charcoal block">
                          Makanan per sekali makan (Rp)
                        </span>
                        <input
                          type="number"
                          min={0}
                          placeholder="Belum diisi"
                          value={f.food}
                          onChange={(e) => set("food", e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-charcoal outline-none focus:border-teal"
                        />
                      </label>
                      <label className="space-y-1 block">
                        <span className="text-sm font-semibold text-charcoal block">
                          Penginapan per malam (Rp)
                        </span>
                        <input
                          type="number"
                          min={0}
                          placeholder="Belum diisi"
                          value={f.hotel}
                          onChange={(e) => set("hotel", e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-charcoal outline-none focus:border-teal"
                        />
                      </label>
                      <label className="space-y-1 block">
                        <span className="text-sm font-semibold text-charcoal block">
                          Transportasi per hari (Rp)
                        </span>
                        <input
                          type="number"
                          min={0}
                          placeholder="Belum diisi"
                          value={f.vehicle}
                          onChange={(e) => set("vehicle", e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-charcoal outline-none focus:border-teal"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 pt-3 border-t border-gray-100">
                  <div className="text-sm">
                    <span className="font-bold text-charcoal block">
                      Sertakan tempat dengan info jam/harga belum pasti
                    </span>
                    <span className="text-charcoal-lighter text-xs block">
                      Membuka lebih banyak pilihan tempat lokal untuk dimasukkan ke rute.
                    </span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={f.allowUnknown}
                    aria-label="Sertakan tempat dengan info jam/harga belum pasti"
                    onClick={() => set("allowUnknown", !f.allowUnknown)}
                    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                      f.allowUnknown ? "bg-teal" : "bg-gray-300"
                    }`}
                  >
                    <motion.span
                      layout
                      transition={
                        reduced
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 500, damping: 30 }
                      }
                      className="block w-5 h-5 rounded-full bg-white shadow-sm"
                      style={{
                        marginLeft: f.allowUnknown ? "22px" : "2px",
                      }}
                    />
                  </button>
                </div>
              </div>
            )}

            {activeTab === "wajib" && (
              <div className="space-y-4">
                <span className="text-sm font-bold text-charcoal block">
                  Tempat yang wajib dikunjungi ({f.mustVisit.length} dipilih)
                </span>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {regionPlaces
                    .filter((p) => p.kind !== "lodging" && p.coordinates)
                    .map((p) => {
                      const picked = f.mustVisit.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => toggleMustVisit(p.id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                            picked
                              ? "bg-teal text-white border-teal"
                              : "bg-gray-50 text-charcoal-lighter border-gray-200 hover:text-charcoal"
                          }`}
                        >
                          {p.name}
                        </button>
                      );
                    })}
                </div>

                <details className="text-sm text-charcoal-lighter pt-2 border-t border-gray-100">
                  <summary className="cursor-pointer font-semibold">
                    Titik koordinat tiba & pulang
                  </summary>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <label className="space-y-1 block">
                      <span className="text-xs font-semibold block">Latitude tiba</span>
                      <input
                        type="number"
                        step="any"
                        min={-90}
                        max={90}
                        required
                        value={f.lat}
                        onChange={(e) => set("lat", e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-sm text-charcoal"
                      />
                    </label>
                    <label className="space-y-1 block">
                      <span className="text-xs font-semibold block">Longitude tiba</span>
                      <input
                        type="number"
                        step="any"
                        min={-180}
                        max={180}
                        required
                        value={f.lng}
                        onChange={(e) => set("lng", e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-sm text-charcoal"
                      />
                    </label>
                    <label className="space-y-1 block">
                      <span className="text-xs font-semibold block">Latitude pulang</span>
                      <input
                        type="number"
                        step="any"
                        min={-90}
                        max={90}
                        required
                        value={f.endLat}
                        onChange={(e) => set("endLat", e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-sm text-charcoal"
                      />
                    </label>
                    <label className="space-y-1 block">
                      <span className="text-xs font-semibold block">Longitude pulang</span>
                      <input
                        type="number"
                        step="any"
                        min={-180}
                        max={180}
                        required
                        value={f.endLng}
                        onChange={(e) => set("endLng", e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-sm text-charcoal"
                      />
                    </label>
                  </div>
                </details>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
