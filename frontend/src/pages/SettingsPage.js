import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  User,
  Compass,
  Banknote,
  Sparkles,
  Trash2,
  Landmark,
  Trees,
  Utensils,
  Sun,
  Car,
  Bike,
  Footprints,
  Check,
  AlertTriangle,
} from "lucide-react";
import { loadTrips } from "../services/itineraryStorage";
import { toast } from "../motion/Toast";

const EASE = [0.22, 1, 0.36, 1];
const STORAGE_KEY = "tripin_user_settings";
const SAVED_PLACES_KEY = "tripin_saved_place_ids";
const ITINERARIES_KEY = "tripin_guest_itineraries_v1";

const NAV_SECTIONS = [
  { id: "profil", label: "Profil", icon: User },
  { id: "preferensi", label: "Preferensi", icon: Compass },
  { id: "anggaran", label: "Anggaran", icon: Banknote },
  { id: "tampilan", label: "Tampilan", icon: Sparkles },
  { id: "data", label: "Data tersimpan", icon: Trash2 },
];

const TRAVEL_STYLES = [
  { id: "budaya", label: "Budaya & Adat", icon: Landmark },
  { id: "alam", label: "Alam & Bahari", icon: Trees },
  { id: "kuliner", label: "Kuliner Autentik", icon: Utensils },
  { id: "santai", label: "Liburan Santai", icon: Sun },
];

const TRAVEL_PACES = [
  {
    id: "relaxed",
    label: "Santai",
    desc: "Santai: sekitar 2 sampai 3 tempat per hari",
  },
  {
    id: "balanced",
    label: "Seimbang",
    desc: "Seimbang: sekitar 4 sampai 5 tempat per hari",
  },
  {
    id: "fast",
    label: "Padat",
    desc: "Padat: sekitar 6 atau lebih tempat per hari",
  },
];

const TRANSPORT_OPTIONS = [
  { id: "mobil", label: "Mobil Pribadi / Sewa", icon: Car },
  { id: "motor", label: "Motor / Skuter", icon: Bike },
  { id: "campuran", label: "Campuran & Jalan Kaki", icon: Footprints },
];

const POPULAR_CITIES = [
  "Jakarta",
  "Yogyakarta",
  "Bandung",
  "Surabaya",
  "Denpasar",
  "Makassar",
  "Padang",
  "Medan",
  "Semarang",
  "Malang",
  "Solo (Surakarta)",
  "Balikpapan",
  "Banjarmasin",
  "Mataram",
  "Manado",
];

function formatThousand(val) {
  if (!val && val !== 0) return "";
  const num = String(val).replace(/\D/g, "");
  return num ? Number(num).toLocaleString("id-ID") : "";
}

function parseThousand(formatted) {
  return String(formatted).replace(/\D/g, "");
}

export default function SettingsPage() {
  const reduced = useReducedMotion();
  const cityRef = useRef(null);

  // Load initial settings
  const [initialSettings, setInitialSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      displayName: "Penjelajah Nusantara",
      travelerStyle: "budaya",
      homeCity: "Jakarta",
      travelPace: "balanced",
      transportPref: "mobil",
      currency: "IDR (Rp)",
      dailyTargetBudget: "750000",
      budgetAlerts: true,
      tripReminders: true,
      weatherAlerts: true,
      language: "Bahasa Indonesia",
    };
  });

  const [settings, setSettings] = useState(initialSettings);
  const [activeSection, setActiveSection] = useState("profil");
  const [saveSuccessAnim, setSaveSuccessAnim] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [deleteCountdown, setDeleteCountdown] = useState(3);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  // Data counters
  const [tripCount, setTripCount] = useState(0);
  const [savedPlaceCount, setSavedPlaceCount] = useState(0);

  const refreshCounters = () => {
    try {
      setTripCount(loadTrips().length);
    } catch {
      setTripCount(0);
    }
    try {
      const raw = localStorage.getItem(SAVED_PLACES_KEY);
      setSavedPlaceCount(raw ? JSON.parse(raw).length : 0);
    } catch {
      setSavedPlaceCount(0);
    }
  };

  useEffect(() => {
    refreshCounters();
    window.addEventListener("tripin:trips-changed", refreshCounters);
    return () =>
      window.removeEventListener("tripin:trips-changed", refreshCounters);
  }, []);

  // Countdown timer for safe delete
  useEffect(() => {
    let timer;
    if (showClearModal && deleteCountdown > 0) {
      timer = setInterval(() => {
        setDeleteCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showClearModal, deleteCountdown]);

  // Click outside listener for city autocomplete
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (cityRef.current && !cityRef.current.contains(e.target)) {
        setShowCityDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Check if form has unsaved changes
  const isDirty = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(initialSettings);
  }, [settings, initialSettings]);

  const isFieldChanged = (key) => settings[key] !== initialSettings[key];

  const update = (key, val) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  // Save handler
  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setInitialSettings(settings);
      setSaveSuccessAnim(true);
      toast.success("Pengaturan tersimpan");
      setTimeout(() => {
        setSaveSuccessAnim(false);
      }, 1500);
    } catch {
      toast.warning("Gagal menyimpan ke peramban");
    }
  };

  // Revert changes
  const handleRevert = () => {
    setSettings(initialSettings);
  };

  // Clear data handler
  const handleClearData = () => {
    try {
      localStorage.removeItem(ITINERARIES_KEY);
      localStorage.removeItem("tripin_user_itineraries");
      localStorage.removeItem(SAVED_PLACES_KEY);
      localStorage.removeItem("tripin_saved_places");
      window.dispatchEvent(new Event("tripin:trips-changed"));
      refreshCounters();
      setShowClearModal(false);
      toast.info("Seluruh itinerary dan tempat tersimpan telah dihapus");
    } catch {
      toast.warning("Gagal membersihkan data");
    }
  };

  // Prevent leaving window with unsaved changes
  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Smooth scroll to section
  const scrollTo = (id) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({
        behavior: reduced ? "auto" : "smooth",
        block: "start",
      });
    }
  };

  // Scroll-spy observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) {
          setActiveSection(visible.target.id);
        }
      },
      { threshold: 0.35, rootMargin: "-10% 0px -50% 0px" },
    );

    NAV_SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Filter city suggestions
  const handleCityInput = (val) => {
    update("homeCity", val);
    if (!val.trim()) {
      setCitySuggestions([]);
      setShowCityDropdown(false);
      return;
    }
    const matches = POPULAR_CITIES.filter((c) =>
      c.toLowerCase().includes(val.toLowerCase()),
    );
    setCitySuggestions(matches);
    setShowCityDropdown(matches.length > 0);
  };

  const currentPaceDef =
    TRAVEL_PACES.find((p) => p.id === settings.travelPace) || TRAVEL_PACES[1];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32 text-[#0B3B45]">
      {/* ── 1. JUDUL HALAMAN TUNGGAL & KALIMAT PENDUKUNG (MAKS 10 KATA) ── */}
      <header className="space-y-1.5 pt-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0A1A1C]">
          Pengaturan
        </h1>
        <p className="text-sm sm:text-base text-[#0B3B45]/75 leading-relaxed">
          Sesuaikan profil penjelajah dan preferensi perjalanan pribadimu.
        </p>
      </header>

      {/* ── 2. LAYOUT DUA KOLOM: NAVIGASI KIRI & KONTEN KANAN ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Kolom Kiri: Navigasi Sticky Desktop / Horizontal Chip di Mobile */}
        <nav
          aria-label="Daftar bagian pengaturan"
          className="lg:col-span-3 sticky top-4 z-20"
        >
          {/* Versi Mobile: Deretan Chip Horizontal */}
          <div className="flex lg:hidden overflow-x-auto gap-2 pb-2 no-scrollbar">
            {NAV_SECTIONS.map((sec) => {
              const active = activeSection === sec.id;
              const Icon = sec.icon;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => scrollTo(sec.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    active
                      ? "bg-[#0B4F5C] text-[#FBF5E9] shadow-sm"
                      : "bg-white text-[#0B3B45] border border-gray-200"
                  }`}
                >
                  <Icon size={14} />
                  <span>{sec.label}</span>
                </button>
              );
            })}
          </div>

          {/* Versi Desktop: Menu Sticky dengan Sliding Active Pill */}
          <div className="hidden lg:flex flex-col space-y-1 bg-white p-2 rounded-2xl border border-gray-100 shadow-soft">
            {NAV_SECTIONS.map((sec) => {
              const active = activeSection === sec.id;
              const Icon = sec.icon;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => scrollTo(sec.id)}
                  className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-left transition-colors ${
                    active
                      ? "text-[#FBF5E9]"
                      : "text-[#0B3B45]/70 hover:text-[#0A1A1C] hover:bg-gray-50"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="settingsNavPill"
                      transition={
                        reduced
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 380, damping: 30 }
                      }
                      className="absolute inset-0 rounded-xl bg-[#0B4F5C] shadow-sm"
                      style={{ zIndex: 0 }}
                    />
                  )}
                  <Icon
                    size={17}
                    className={`relative z-10 ${
                      active ? "text-[#2EC4B6]" : "text-[#0B4F5C]"
                    }`}
                  />
                  <span className="relative z-10">{sec.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Kolom Kanan: Konten Kartu Pengaturan (Maksimal ~720px) */}
        <main className="lg:col-span-9 max-w-[720px] w-full space-y-8">
          {/* ── BAGIAN 1: PROFIL PENJELAJAH ── */}
          <motion.section
            id="profil"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0 : 0.5, ease: EASE }}
            className="rounded-3xl bg-white p-6 sm:p-8 border border-gray-100 shadow-soft space-y-6"
          >
            {/* Header Bagian: Judul & Ikon dalam Lingkaran Tint Turquoise */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#D5F5F1] text-[#0B4F5C] flex items-center justify-center flex-shrink-0">
                <User size={20} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-[#0A1A1C] tracking-tight">
                  Profil Penjelajah
                </h2>
                <p className="text-xs text-[#0B3B45]/70">
                  Identitas yang ditampilkan pada sapaan Dashboard pribadimu.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              {/* Nama Panggilan */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#0A1A1C] flex items-center">
                  <span>Nama Panggilan</span>
                  {isFieldChanged("displayName") && (
                    <span
                      className="w-2 h-2 rounded-full bg-[#F4A261] inline-block ml-1.5"
                      title="Perubahan belum disimpan"
                    />
                  )}
                </label>
                <input
                  type="text"
                  data-hide-cursor="true"
                  value={settings.displayName}
                  onChange={(e) => update("displayName", e.target.value)}
                  placeholder="Contoh: Budi, Sari..."
                  className="w-full bg-[#FBF5E9]/60 border border-gray-200 focus:border-[#0B4F5C] focus:bg-white rounded-xl px-4 py-2.5 text-base text-[#0A1A1C] font-semibold outline-none transition-all"
                />
                <p className="text-xs text-[#0B3B45]/60">
                  Nama ini langsung menghiasi sapaan di Dashboard.
                </p>
              </div>

              {/* Kota Asal dengan Autocomplete */}
              <div className="space-y-1.5 relative" ref={cityRef}>
                <label className="text-sm font-bold text-[#0A1A1C] flex items-center">
                  <span>Kota Asal</span>
                  {isFieldChanged("homeCity") && (
                    <span
                      className="w-2 h-2 rounded-full bg-[#F4A261] inline-block ml-1.5"
                      title="Perubahan belum disimpan"
                    />
                  )}
                </label>
                <input
                  type="text"
                  data-hide-cursor="true"
                  value={settings.homeCity}
                  onChange={(e) => handleCityInput(e.target.value)}
                  onFocus={() => {
                    if (settings.homeCity) {
                      const matches = POPULAR_CITIES.filter((c) =>
                        c.toLowerCase().includes(settings.homeCity.toLowerCase()),
                      );
                      setCitySuggestions(matches);
                      setShowCityDropdown(matches.length > 0);
                    }
                  }}
                  placeholder="Ketik nama kotamu..."
                  className="w-full bg-[#FBF5E9]/60 border border-gray-200 focus:border-[#0B4F5C] focus:bg-white rounded-xl px-4 py-2.5 text-base text-[#0A1A1C] font-semibold outline-none transition-all"
                />

                {/* Dropdown Saran Kota */}
                {showCityDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto p-1">
                    {citySuggestions.map((cityName) => (
                      <button
                        key={cityName}
                        type="button"
                        onClick={() => {
                          update("homeCity", cityName);
                          setShowCityDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm font-semibold rounded-lg hover:bg-[#D5F5F1] text-[#0A1A1C] transition-colors"
                      >
                        {cityName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.section>

          {/* ── BAGIAN 2: PREFERENSI BAWAAN ── */}
          <motion.section
            id="preferensi"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reduced ? 0 : 0.5,
              delay: reduced ? 0 : 0.08,
              ease: EASE,
            }}
            className="rounded-3xl bg-white p-6 sm:p-8 border border-gray-100 shadow-soft space-y-6"
          >
            {/* Header Bagian */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#D5F5F1] text-[#0B4F5C] flex items-center justify-center flex-shrink-0">
                <Compass size={20} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-[#0A1A1C] tracking-tight">
                  Preferensi bawaan
                </h2>
                <p className="text-xs text-[#0B3B45]/70">
                  Dipakai sebagai isian awal saat menyusun perjalanan. Selalu
                  bisa diubah di planner.
                </p>
              </div>
            </div>

            {/* Gaya Wisata Utama (Chip Pilihan dengan Ikon Lucide - Tanpa Emoji) */}
            <div className="space-y-2.5 pt-2">
              <label className="text-sm font-bold text-[#0A1A1C] flex items-center">
                <span>Gaya Wisata Utama</span>
                {isFieldChanged("travelerStyle") && (
                  <span
                    className="w-2 h-2 rounded-full bg-[#F4A261] inline-block ml-1.5"
                    title="Perubahan belum disimpan"
                  />
                )}
              </label>

              <div className="flex flex-wrap gap-2.5">
                {TRAVEL_STYLES.map((style) => {
                  const isSelected = settings.travelerStyle === style.id;
                  const Icon = style.icon;
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => update("travelerStyle", style.id)}
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all min-h-[44px] ${
                        isSelected
                          ? "bg-[#0B4F5C] text-[#FBF5E9] shadow-md border border-[#0B4F5C]"
                          : "bg-[#FBF5E9]/60 text-[#0B3B45] border border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Icon
                        size={16}
                        className={
                          isSelected ? "text-[#2EC4B6]" : "text-[#0B4F5C]"
                        }
                      />
                      <span>{style.label}</span>
                      {isSelected && (
                        <Check size={14} className="text-[#2EC4B6]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-5 space-y-3">
              {/* Ritme Jadwal Harian (Segmented Control Tiga Pilihan) */}
              <label className="text-sm font-bold text-[#0A1A1C] flex items-center">
                <span>Ritme Jadwal Harian</span>
                {isFieldChanged("travelPace") && (
                  <span
                    className="w-2 h-2 rounded-full bg-[#F4A261] inline-block ml-1.5"
                    title="Perubahan belum disimpan"
                  />
                )}
              </label>

              <div className="bg-[#FBF5E9]/80 p-1.5 rounded-2xl grid grid-cols-3 gap-1">
                {TRAVEL_PACES.map((pace) => {
                  const isSelected = settings.travelPace === pace.id;
                  return (
                    <button
                      key={pace.id}
                      type="button"
                      onClick={() => update("travelPace", pace.id)}
                      className={`relative py-2.5 px-3 rounded-xl text-sm font-bold transition-colors text-center ${
                        isSelected
                          ? "text-[#FBF5E9]"
                          : "text-[#0B3B45]/70 hover:text-[#0A1A1C]"
                      }`}
                    >
                      {isSelected && (
                        <motion.span
                          layoutId="paceSegmentIndicator"
                          transition={
                            reduced
                              ? { duration: 0 }
                              : { type: "spring", stiffness: 380, damping: 30 }
                          }
                          className="absolute inset-0 rounded-xl bg-[#0B4F5C] shadow-sm"
                          style={{ zIndex: 0 }}
                        />
                      )}
                      <span className="relative z-10">{pace.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Satu Baris Keterangan di Bawah Segmented Control (dengan kata 'tempat') */}
              <p className="text-xs text-[#0B3B45]/75 font-semibold pt-1">
                {currentPaceDef.desc}
              </p>
            </div>

            <div className="border-t border-gray-100 pt-5 space-y-3">
              {/* Transportasi Pilihan (Kartu Pilihan Kecil dengan Ikon) */}
              <label className="text-sm font-bold text-[#0A1A1C] flex items-center">
                <span>Transportasi Pilihan</span>
                {isFieldChanged("transportPref") && (
                  <span
                    className="w-2 h-2 rounded-full bg-[#F4A261] inline-block ml-1.5"
                    title="Perubahan belum disimpan"
                  />
                )}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {TRANSPORT_OPTIONS.map((trans) => {
                  const isSelected = settings.transportPref === trans.id;
                  const Icon = trans.icon;
                  return (
                    <button
                      key={trans.id}
                      type="button"
                      onClick={() => update("transportPref", trans.id)}
                      className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border text-center transition-all min-h-[88px] gap-2 ${
                        isSelected
                          ? "bg-[#D5F5F1]/50 border-[#0B4F5C] text-[#0A1A1C] shadow-sm"
                          : "bg-[#FBF5E9]/50 border-gray-200 text-[#0B3B45]/70 hover:border-gray-300"
                      }`}
                    >
                      <Icon
                        size={22}
                        className={
                          isSelected ? "text-[#0B4F5C]" : "text-[#0B4F5C]/60"
                        }
                      />
                      <span className="text-xs font-bold leading-tight">
                        {trans.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.section>

          {/* ── BAGIAN 3: ANGGARAN ── */}
          <motion.section
            id="anggaran"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reduced ? 0 : 0.5,
              delay: reduced ? 0 : 0.16,
              ease: EASE,
            }}
            className="rounded-3xl bg-white p-6 sm:p-8 border border-gray-100 shadow-soft space-y-6"
          >
            {/* Header Bagian */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#D5F5F1] text-[#0B4F5C] flex items-center justify-center flex-shrink-0">
                <Banknote size={20} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-[#0A1A1C] tracking-tight">
                  Anggaran
                </h2>
                <p className="text-xs text-[#0B3B45]/70">
                  Perkiraan biaya harian sebagai panduan penyusunan rute.
                </p>
              </div>
            </div>

            {/* Budget Harian */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-[#0A1A1C] flex items-center">
                  <span>Budget harian</span>
                  {isFieldChanged("dailyTargetBudget") && (
                    <span
                      className="w-2 h-2 rounded-full bg-[#F4A261] inline-block ml-1.5"
                      title="Perubahan belum disimpan"
                    />
                  )}
                </label>
                {/* Teks statis kecil Rupiah (Rp) */}
                <span className="text-xs font-bold text-[#0B4F5C] bg-[#D5F5F1] px-2.5 py-0.5 rounded-full">
                  Rupiah (Rp)
                </span>
              </div>

              {/* Kolom Angka dengan Awalan Rp dan Format Titik Ribuan Otomatis */}
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-extrabold text-base text-[#0B4F5C]">
                  Rp
                </span>
                <input
                  type="text"
                  data-hide-cursor="true"
                  value={formatThousand(settings.dailyTargetBudget)}
                  onChange={(e) =>
                    update("dailyTargetBudget", parseThousand(e.target.value))
                  }
                  placeholder="0"
                  className="w-full bg-[#FBF5E9]/60 border border-gray-200 focus:border-[#0B4F5C] focus:bg-white rounded-xl pl-12 pr-4 py-3 text-base sm:text-lg text-[#0A1A1C] font-extrabold outline-none transition-all"
                />
              </div>

              <p className="text-xs text-[#0B3B45]/60 font-semibold">
                Estimasi per orang per hari untuk wisata dan kuliner.
              </p>

              {/* Tombol Cepat Budget: +100rb, +250rb, +500rb dan Patokan */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-semibold text-[#0B3B45]/70 mr-1">
                  Tambah cepat:
                </span>
                {[
                  { label: "+100rb", val: 100000 },
                  { label: "+250rb", val: 250000 },
                  { label: "+500rb", val: 500000 },
                ].map((btn) => (
                  <button
                    key={btn.label}
                    type="button"
                    onClick={() => {
                      const cur = Number(settings.dailyTargetBudget) || 0;
                      update("dailyTargetBudget", String(cur + btn.val));
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FBF5E9]/80 text-[#0B3B45] hover:bg-[#D5F5F1] hover:text-[#0B4F5C] border border-gray-200/60 transition-all"
                  >
                    {btn.label}
                  </button>
                ))}

                <span className="text-xs font-semibold text-[#0B3B45]/70 ml-2 mr-1">
                  Patokan:
                </span>
                {[500000, 750000, 1000000].map((amt) => {
                  const isCurrent = Number(settings.dailyTargetBudget) === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => update("dailyTargetBudget", String(amt))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isCurrent
                          ? "bg-[#0B4F5C] text-[#FBF5E9] shadow-sm"
                          : "bg-[#FBF5E9]/60 text-[#0B3B45]/80 hover:bg-gray-100"
                      }`}
                    >
                      Rp{amt.toLocaleString("id-ID")}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.section>

          {/* ── BAGIAN 4: TAMPILAN & GERAK ── */}
          <motion.section
            id="tampilan"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reduced ? 0 : 0.5,
              delay: reduced ? 0 : 0.24,
              ease: EASE,
            }}
            className="rounded-3xl bg-white p-6 sm:p-8 border border-gray-100 shadow-soft space-y-6"
          >
            {/* Header Bagian */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#D5F5F1] text-[#0B4F5C] flex items-center justify-center flex-shrink-0">
                <Sparkles size={20} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-[#0A1A1C] tracking-tight">
                  Tampilan & Aksesibilitas
                </h2>
                <p className="text-xs text-[#0B3B45]/70">
                  Pengaturan kenyamanan visual antarmuka TRIPIN.
                </p>
              </div>
            </div>

            {/* Kurangi Animasi (Mengikuti Pengaturan Perangkat) */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FBF5E9]/70 border border-gray-100 gap-4">
              <div>
                <span className="text-sm font-bold text-[#0A1A1C] block">
                  Kurangi Efek Animasi
                </span>
                <span className="text-xs text-[#0B3B45]/70 block pt-0.5">
                  Mengikuti preferensi gerakan pada pengaturan perangkatmu
                  (prefers-reduced-motion).
                </span>
              </div>
              <span
                className={`text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0 ${
                  reduced
                    ? "bg-[#F4A261] text-[#0A1A1C]"
                    : "bg-[#D5F5F1] text-[#0B4F5C]"
                }`}
              >
                {reduced ? "Aktif di perangkat" : "Standar sistem"}
              </span>
            </div>
          </motion.section>

          {/* ── BAGIAN 5: DATA TERSIMPAN ── */}
          <motion.section
            id="data"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reduced ? 0 : 0.5,
              delay: reduced ? 0 : 0.32,
              ease: EASE,
            }}
            className="rounded-3xl bg-white p-6 sm:p-8 border border-gray-100 shadow-soft space-y-5"
          >
            {/* Header Bagian */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-[#0A1A1C] tracking-tight">
                  Data tersimpan
                </h2>
                <p className="text-xs text-[#0B3B45]/70">
                  Kelola data itinerary dan tempat favorit yang tersimpan pada
                  peramban ini.
                </p>
              </div>
            </div>

            {/* Ringkasan Data & Tombol Hapus Peringatan Lembut */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-0.5 text-xs text-[#0B3B45]/80">
                <p className="font-bold text-[#0A1A1C] text-sm">
                  {tripCount} itinerary · {savedPlaceCount} tempat tersimpan
                </p>
                <p>Seluruh data tersimpan secara lokal tanpa akun.</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowClearModal(true);
                  setDeleteCountdown(3);
                }}
                className="px-4 py-2.5 rounded-xl border border-red-200 bg-red-50/70 text-[#B91C1C] font-bold text-xs hover:bg-red-100/80 transition-colors min-h-[40px] focus:outline-none focus:ring-2 focus:ring-red-300"
              >
                Hapus semua data perjalanan
              </button>
            </div>
          </motion.section>
        </main>
      </div>

      {/* ── 4. BILAH SIMPAN MELAYANG (Hanya Muncul Saat Ada Perubahan & Memudar Halus) ── */}
      <AnimatePresence>
        {(isDirty || saveSuccessAnim) && (
          <motion.div
            initial={reduced ? { opacity: 0 } : { y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { y: 60, opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.35, ease: EASE }}
            className={`fixed bottom-6 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[500px] z-40 p-3.5 sm:p-4 rounded-2xl shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 transition-colors duration-300 ${
              saveSuccessAnim
                ? "bg-emerald-900/95 text-emerald-100 border border-emerald-400/30"
                : "bg-[#0A1A1C]/95 text-[#FBF5E9] border border-white/15"
            }`}
          >
            {saveSuccessAnim ? (
              <div className="flex items-center gap-2.5 mx-auto py-0.5">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                  <Check size={16} strokeWidth={3} />
                </div>
                <span className="text-sm font-bold text-white">
                  Perubahan tersimpan
                </span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F4A261] animate-pulse" />
                  <span className="text-xs sm:text-sm font-bold text-[#FBF5E9]">
                    Ada perubahan yang belum disimpan
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRevert}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#FBF5E9]/75 hover:text-[#FBF5E9] hover:bg-white/10 transition-colors"
                  >
                    Batalkan
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold bg-[#F4A261] text-[#0B3B45] hover:brightness-95 shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-[#2EC4B6]"
                  >
                    <span>Simpan</span>
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 5. DIALOG KONFIRMASI DUA LANGKAH HAPUS DATA TERSIMPAN (Hitung Mundur 3s) ── */}
      <AnimatePresence>
        {showClearModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={reduced ? { opacity: 0 } : { scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={reduced ? { opacity: 0 } : { scale: 0.94, opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-gray-100"
            >
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                <AlertTriangle size={24} />
              </div>

              <div className="text-center space-y-1.5">
                <h3 className="font-extrabold text-[#0A1A1C] text-base">
                  Hapus Data Tersimpan?
                </h3>
                <p className="text-xs text-[#0B3B45]/75 leading-relaxed">
                  Tindakan ini akan menghapus permanen{" "}
                  <strong>{tripCount} itinerary</strong> dan{" "}
                  <strong>{savedPlaceCount} tempat tersimpan</strong> pada
                  peramban ini.
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClearModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 bg-gray-100 text-xs font-extrabold text-[#0B3B45] hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={deleteCountdown > 0}
                  onClick={handleClearData}
                  className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-sm ${
                    deleteCountdown > 0
                      ? "bg-red-400 cursor-not-allowed opacity-60"
                      : "bg-red-600 hover:bg-red-700 active:scale-95"
                  }`}
                >
                  {deleteCountdown > 0
                    ? `Hapus (${deleteCountdown}s)`
                    : "Ya, hapus"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── 6. DIALOG MENINGGALKAN HALAMAN DENGAN PERUBAHAN BELUM DISIMPAN ── */}
      <AnimatePresence>
        {showLeaveModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={reduced ? { opacity: 0 } : { scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={reduced ? { opacity: 0 } : { scale: 0.94, opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-gray-100 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-[#D5F5F1] text-[#0B4F5C] flex items-center justify-center mx-auto">
                <Sparkles size={24} />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-extrabold text-[#0A1A1C] text-base">
                  Simpan perubahan dulu?
                </h3>
                <p className="text-xs text-[#0B3B45]/75 leading-relaxed">
                  Kamu memiliki pengaturan yang belum disimpan. Mau disimpan
                  sebelum melanjutkan?
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    handleSave();
                    setShowLeaveModal(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#F4A261] text-[#0B3B45] text-xs font-bold shadow-md"
                >
                  Simpan
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleRevert();
                      setShowLeaveModal(false);
                    }}
                    className="py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-[#0B3B45] hover:bg-gray-50"
                  >
                    Buang
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLeaveModal(false)}
                    className="py-2.5 rounded-xl bg-gray-100 text-xs font-bold text-[#0B3B45] hover:bg-gray-200"
                  >
                    Tetap di sini
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
