import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Heart,
  MapPin,
  Trash2,
  Plus,
  Compass,
  Sparkles,
  ExternalLink,
  Clock,
  X,
  Search,
} from "lucide-react";
import { searchPlacesAcrossIndonesia } from "../services/placesService";
import { listPlaces } from "../services/plannerApi";
import PlaceImage from "../components/PlaceImage";
import { toast } from "../motion/Toast";

const EASE = [0.22, 1, 0.36, 1];
const SAVED_STORAGE_KEY = "tripin_saved_place_ids";

const CATEGORY_COLORS = {
  Culinary: { bg: "#F4A261", text: "#FFFFFF", label: "Kuliner" },
  Craft: { bg: "#C8553D", text: "#FFFFFF", label: "Kerajinan" },
  Nature: { bg: "#5E8C61", text: "#FFFFFF", label: "Alam" },
  Heritage: { bg: "#C9A227", text: "#FFFFFF", label: "Sejarah & Budaya" },
  Lodging: { bg: "#2EC4B6", text: "#FFFFFF", label: "Penginapan" },
};

function getCategoryBadge(cat) {
  if (!cat) return { bg: "#0B4F5C", text: "#FFFFFF", label: "Pariwisata" };
  const key = Object.keys(CATEGORY_COLORS).find(
    (k) => k.toLowerCase() === cat.toLowerCase(),
  );
  return CATEGORY_COLORS[key] || { bg: "#0B4F5C", text: "#FFFFFF", label: cat };
}

export default function SavedPlacesPage() {
  const navigate = useNavigate();
  const reduced = useReducedMotion();

  const [savedIds, setSavedIds] = useState(() => {
    try {
      const raw = localStorage.getItem(SAVED_STORAGE_KEY);
      if (raw !== null) {
        return new Set(JSON.parse(raw));
      }
      // Seed curated defaults on first visit if storage hasn't been initialized
      const defaults = ["lb-sum-1", "dest-jaw-1", "lb-jaw-2", "dest-bali-1"];
      localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(defaults));
      return new Set(defaults);
    } catch {
      return new Set();
    }
  });

  const [allPlaces, setAllPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [filterQuery, setFilterQuery] = useState("");

  // Sync listener
  useEffect(() => {
    const handleSync = () => {
      try {
        const raw = localStorage.getItem(SAVED_STORAGE_KEY);
        setSavedIds(raw ? new Set(JSON.parse(raw)) : new Set());
      } catch {
        setSavedIds(new Set());
      }
    };
    window.addEventListener("tripin:saved-places-changed", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("tripin:saved-places-changed", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  // Fetch places catalog
  useEffect(() => {
    setLoading(true);
    const catalogPromise = searchPlacesAcrossIndonesia({
      query: "",
      category: "all",
      region: "all",
    });
    const serverPromise = listPlaces().catch(() => ({ places: [] }));

    Promise.all([catalogPromise, serverPromise])
      .then(([curated, serverData]) => {
        const verifiedIds = new Set(
          (serverData?.places || []).map((p) => p.id),
        );
        const mapped = (curated || []).map((item) => ({
          ...item,
          isVerified:
            verifiedIds.has(item.id) ||
            Boolean(item.coordinates || (item.lat && item.lng)),
        }));
        setAllPlaces(mapped);
      })
      .finally(() => setLoading(false));
  }, []);

  // Remove place from saved
  const handleRemoveSaved = (id, e) => {
    if (e) e.stopPropagation();
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      try {
        localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify([...next]));
        window.dispatchEvent(new Event("tripin:saved-places-changed"));
        toast.info("Dihapus dari tempat tersimpan");
      } catch {}
      return next;
    });
  };

  // Filter saved places matching savedIds and query
  const savedPlacesList = useMemo(() => {
    return allPlaces.filter((p) => {
      if (!savedIds.has(p.id)) return false;
      if (!filterQuery.trim()) return true;
      const q = filterQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.city && p.city.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    });
  }, [allPlaces, savedIds, filterQuery]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 text-[#0B3B45]">
      {/* ── HEADER HALAMAN ── */}
      <header className="flex flex-wrap items-center justify-between gap-4 pt-2 border-b border-gray-100/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0A1A1C]">
              Tempat Tersimpan
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#D5F5F1] text-[#0B4F5C]">
              {savedIds.size} favorit
            </span>
          </div>
          <p className="text-sm text-[#0B3B45]/70 mt-1">
            Koleksi destinasi dan usaha lokal Nusantara yang kamu simpan.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/discovery")}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm bg-[#0B4F5C] text-[#FBF5E9] hover:bg-[#083b45] shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#2EC4B6]"
        >
          <Compass size={16} />
          <span>Jelajahi Tempat Lain</span>
        </button>
      </header>

      {/* ── SEARCH BAR SUBTIL (JIKA ADA LEBIH DARI 3 TEMPAT) ── */}
      {savedIds.size > 3 && (
        <div className="relative max-w-sm">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Cari tempat tersimpan..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:border-[#0B4F5C]"
          />
        </div>
      )}

      {/* ── KONDISI KOSONG (EMPTY STATE) ── */}
      {!loading && savedIds.size === 0 && (
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="bg-white rounded-3xl p-8 sm:p-12 text-center shadow-soft border border-gray-100 max-w-xl mx-auto space-y-4 my-8"
        >
          <div className="w-16 h-16 rounded-full bg-[#D5F5F1] text-[#0B4F5C] flex items-center justify-center mx-auto shadow-inner">
            <Heart size={30} />
          </div>

          <div className="space-y-1.5">
            <h2 className="font-extrabold text-xl text-[#0A1A1C]">
              Daftar Simpan Masih Kosong
            </h2>
            <p className="text-sm text-[#0B3B45]/70 leading-relaxed max-w-md mx-auto">
              Simpan tempat dan UMKM menarik saat menjelajah katalog untuk
              menyusun perjalanan lebih mudah.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate("/discovery")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-[#F4A261] text-[#0B3B45] hover:brightness-95 shadow-md transition-all"
            >
              <Compass size={16} />
              <span>Mulai Jelajahi Nusantara</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* ── GRID TEMPAT TERSIMPAN (KARTU BERSIH TANPA TOMBOL BERULANG) ── */}
      {!loading && savedPlacesList.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {savedPlacesList.map((item, idx) => {
            const badge = getCategoryBadge(item.category);

            return (
              <motion.article
                key={item.id}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: reduced ? 0 : 0.4,
                  delay: reduced ? 0 : idx * 0.05,
                  ease: EASE,
                }}
                onClick={() => setSelectedPlace(item)}
                className="bg-white rounded-3xl overflow-hidden shadow-soft border border-gray-100 flex flex-col justify-between group hover:shadow-card hover:border-gray-200 transition-all cursor-pointer select-none"
              >
                <div>
                  {/* Foto Tempat dengan Overlay Halus */}
                  <div className="relative h-44 overflow-hidden bg-gray-100">
                    <PlaceImage
                      src={item.image}
                      alt={`${item.name} di ${item.city}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

                    {/* Badge Kategori Unik */}
                    <div className="absolute top-3 left-3">
                      <span
                        className="text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-sm text-white"
                        style={{ backgroundColor: badge.bg }}
                      >
                        {badge.label}
                      </span>
                    </div>

                    {/* Tombol Hapus Tersimpan (Heart Aktif) */}
                    <button
                      type="button"
                      onClick={(e) => handleRemoveSaved(item.id, e)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 text-red-500 flex items-center justify-center hover:bg-white shadow transition-all active:scale-90"
                      title="Hapus dari tersimpan"
                      aria-label="Hapus dari tersimpan"
                    >
                      <Heart size={16} className="fill-red-500" />
                    </button>
                  </div>

                  {/* Info Konten */}
                  <div className="p-4 sm:p-5 space-y-1.5">
                    <h3 className="font-extrabold text-[#0A1A1C] text-base leading-snug group-hover:text-[#0B4F5C] transition-colors line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="text-xs text-[#0B3B45]/70 flex items-center gap-1.5">
                      <MapPin size={13} className="text-[#F4A261] flex-shrink-0" />
                      <span className="truncate">{item.city}</span>
                    </p>
                  </div>
                </div>

                {/* Footer Kartu: Tarif & Aksi Subtil */}
                <div className="px-4 sm:px-5 pb-4 pt-1 flex items-center justify-between text-xs border-t border-gray-50 text-[#0B3B45]/80">
                  <span className="font-bold text-[#0A1A1C]">
                    {item.priceLabel || "Tarif bervariasi"}
                  </span>
                  <span className="font-semibold text-[#0B4F5C] group-hover:underline inline-flex items-center gap-1">
                    <span>Lihat detail</span>
                    <ExternalLink size={12} />
                  </span>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      {/* ── MODAL DETAIL TEMPAT (KETIKA KARTU DIKLIK) ── */}
      <AnimatePresence>
        {selectedPlace && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={reduced ? { opacity: 0 } : { scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={reduced ? { opacity: 0 } : { scale: 0.94, opacity: 0 }}
              transition={{ duration: 0.22, ease: EASE }}
              className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100"
            >
              <div className="relative h-48 bg-gray-100">
                <PlaceImage
                  src={selectedPlace.image}
                  alt={selectedPlace.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <button
                  type="button"
                  onClick={() => setSelectedPlace(null)}
                  className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/90 text-[#0B3B45] flex items-center justify-center hover:bg-white shadow transition-all"
                  aria-label="Tutup"
                >
                  <X size={16} />
                </button>
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <h3 className="font-extrabold text-lg leading-tight">
                    {selectedPlace.name}
                  </h3>
                  <p className="text-xs text-white/80 mt-0.5 flex items-center gap-1">
                    <MapPin size={12} /> {selectedPlace.city}
                  </p>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm text-[#0B3B45]">
                {selectedPlace.description && (
                  <p className="leading-relaxed text-[#0B3B45]/80">
                    {selectedPlace.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-[#FBF5E9]/80 border border-gray-100 text-xs">
                  <div>
                    <span className="text-[#0B3B45]/60 font-semibold block">
                      Jam operasional
                    </span>
                    <span className="font-bold text-[#0A1A1C]">
                      {selectedPlace.openHour || "08.00 - 17.00"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#0B3B45]/60 font-semibold block">
                      Estimasi tarif
                    </span>
                    <span className="font-bold text-[#0A1A1C]">
                      {selectedPlace.priceLabel || "Variatif"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const destName = selectedPlace.name;
                      setSelectedPlace(null);
                      navigate("/create", { state: { destination: destName } });
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-[#F4A261] text-[#0B3B45] font-extrabold text-xs sm:text-sm hover:brightness-95 shadow-sm transition-all text-center"
                  >
                    Rencanakan Perjalanan ke Sini
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      handleRemoveSaved(selectedPlace.id, e);
                      setSelectedPlace(null);
                    }}
                    className="px-3.5 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs transition-colors"
                  >
                    Hapus Simpan
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
