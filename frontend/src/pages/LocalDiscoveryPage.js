import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Search,
  X,
  MapPin,
  Sparkles,
  Clock,
  Heart,
  Share2,
  Compass,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  RotateCcw,
  Utensils,
  Palette,
  Trees,
  Landmark,
  Bed,
  Store,
  ArrowRight,
} from "lucide-react";
import { searchPlacesAcrossIndonesia } from "../services/placesService";
import { listPlaces } from "../services/plannerApi";
import PlaceImage from "../components/PlaceImage";
import { toast } from "../motion/Toast";

const EASE = [0.22, 1, 0.36, 1];

// 6 Wilayah Utama Indonesia (SVG shapes dipetik langsung dari hero landing page)
const ISLAND_REGIONS = [
  {
    id: "sumatra",
    name: "Sumatra",
    centroid: { x: 138, y: 155 },
    beacons: [
      { cx: 98, cy: 124 },
      { cx: 154, cy: 146 },
      { cx: 190, cy: 198 },
    ],
    shapes: (
      <>
        <circle cx="50" cy="45" r="4" />
        <path d="M 57 54 L 82 70 L 116 105 L 154 146 L 190 198 L 207 240 L 198 248 L 176 228 L 146 192 L 122 162 L 98 124 L 72 86 L 54 62 Z" />
        <ellipse cx="218" cy="204" rx="7" ry="10" transform="rotate(-20 218 204)" />
        <circle cx="238" cy="212" r="5" />
        <circle cx="182" cy="128" r="4" />
        <circle cx="192" cy="134" r="3" />
      </>
    ),
  },
  {
    id: "jawa",
    name: "Jawa",
    centroid: { x: 280, y: 274 },
    beacons: [
      { cx: 245, cy: 265 },
      { cx: 282, cy: 275 },
      { cx: 320, cy: 280 },
    ],
    shapes: (
      <>
        <path d="M 213 260 L 245 256 L 285 264 L 320 272 L 341 284 L 336 293 L 302 288 L 274 285 L 240 276 L 214 268 Z" />
        <ellipse cx="322" cy="264" rx="11" ry="3.5" />
      </>
    ),
  },
  {
    id: "bali-nusra",
    name: "Bali & Nusa Tenggara",
    centroid: { x: 432, y: 300 },
    beacons: [
      { cx: 357, cy: 294 },
      { cx: 426, cy: 296 },
      { cx: 480, cy: 315 },
    ],
    shapes: (
      <>
        <ellipse cx="357" cy="294" rx="10" ry="4.5" />
        <ellipse cx="378" cy="294" rx="8" ry="4" />
        <path d="M 392 291 L 417 293 L 415 300 L 390 298 Z" />
        <path d="M 426 292 L 468 294 L 465 301 L 424 299 Z" />
        <ellipse cx="426" cy="315" rx="12" ry="5" transform="rotate(8 426 315)" />
        <path d="M 476 318 L 514 302 L 518 310 L 480 325 Z" />
      </>
    ),
  },
  {
    id: "kalimantan",
    name: "Kalimantan",
    centroid: { x: 326, y: 148 },
    beacons: [
      { cx: 310, cy: 160 },
      { cx: 345, cy: 130 },
    ],
    shapes: (
      <path d="M 265 152 L 286 122 L 322 110 L 356 80 L 378 94 L 370 126 L 385 150 L 366 176 L 342 208 L 310 212 L 278 198 L 263 174 Z" />
    ),
  },
  {
    id: "sulawesi",
    name: "Sulawesi",
    centroid: { x: 452, y: 176 },
    beacons: [
      { cx: 440, cy: 180 },
      { cx: 460, cy: 145 },
    ],
    shapes: (
      <path d="M 426 144 L 464 128 L 502 122 L 504 131 L 468 139 L 444 155 L 456 168 L 488 164 L 486 174 L 452 180 L 456 202 L 478 232 L 466 236 L 444 208 L 434 214 L 424 240 L 414 236 L 418 202 L 416 174 Z" />
    ),
  },
  {
    id: "maluku-papua",
    name: "Maluku & Papua",
    centroid: { x: 648, y: 202 },
    beacons: [
      { cx: 550, cy: 185 },
      { cx: 650, cy: 195 },
      { cx: 730, cy: 220 },
    ],
    shapes: (
      <>
        <path d="M 532 128 L 548 124 L 544 142 L 558 148 L 542 162 L 534 150 Z" />
        <ellipse cx="520" cy="193" rx="9" ry="5.5" />
        <path d="M 538 188 L 575 192 L 573 200 L 537 196 Z" />
        <circle cx="591" cy="156" r="4.5" />
        <circle cx="598" cy="162" r="3" />
        <path d="M 604 152 L 634 156 L 648 178 L 686 170 L 730 176 L 756 185 L 756 298 L 742 302 L 710 284 L 674 254 L 646 222 L 626 196 L 642 180 L 618 182 Z" />
      </>
    ),
  },
];

// Kategori Jenis Tempat dengan ikon unik & warna aksen tersendiri
const CATEGORY_ITEMS = [
  { id: "all", label: "Semua", icon: Compass, accent: "#0B4F5C" },
  { id: "culinary", label: "Kuliner", icon: Utensils, accent: "#F4A261" },
  { id: "craft", label: "Kerajinan", icon: Palette, accent: "#C8553D" },
  { id: "nature", label: "Alam", icon: Trees, accent: "#5E8C61" },
  { id: "heritage", label: "Sejarah & Budaya", icon: Landmark, accent: "#C9A227" },
  { id: "lodging", label: "Penginapan lokal", icon: Bed, accent: "#2EC4B6" },
];

const SAVED_STORAGE_KEY = "tripin_saved_place_ids";

// Helper highlight teks pencarian
function highlightMatch(text, query) {
  if (!text || !query || !query.trim()) return text;
  const qClean = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = String(text).split(new RegExp(`(${qClean})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.trim().toLowerCase() ? (
      <mark
        key={i}
        className="bg-[#F4A261]/35 text-inherit rounded px-0.5 font-bold"
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

// Penghitung animasi count-up
function AnimatedCount({ value, reduced }) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }
    const start = display;
    const end = value;
    if (start === end) return;
    let startTime = null;
    const duration = 350;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setDisplay(Math.round(start + (end - start) * progress));
      if (progress < 1) requestAnimationFrame(step);
    };
    const reqId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(reqId);
  }, [value, reduced]);

  return <span>{display}</span>;
}

// Tombol simpan dengan animasi partikel meletup (heart burst)
function HeartSaveButton({ isSaved, onToggle, reduced }) {
  const [bursting, setBursting] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    if (!isSaved && !reduced) {
      setBursting(true);
      setTimeout(() => setBursting(false), 600);
    }
    onToggle();
  };

  return (
    <div className="relative">
      <motion.button
        type="button"
        onClick={handleClick}
        aria-label={isSaved ? "Hapus dari Saved Places" : "Simpan ke Saved Places"}
        whileTap={reduced ? {} : { scale: 0.8 }}
        whileHover={reduced ? {} : { scale: 1.1 }}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors shadow-md backdrop-blur-sm ${
          isSaved
            ? "bg-white text-red-500 fill-red-500"
            : "bg-black/40 text-white/90 hover:bg-white hover:text-red-500"
        }`}
      >
        <Heart
          size={16}
          className={isSaved ? "fill-red-500 text-red-500" : ""}
          strokeWidth={2.2}
        />
      </motion.button>

      {/* Partikel Heart Burst */}
      {bursting && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <motion.span
              key={deg}
              initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
              animate={{
                scale: [0, 1.2, 0],
                x: Math.cos((deg * Math.PI) / 180) * 22,
                y: Math.sin((deg * Math.PI) / 180) * 22,
                opacity: [1, 0.8, 0],
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute w-2 h-2 rounded-full bg-red-400"
            />
          ))}
        </span>
      )}
    </div>
  );
}

export default function LocalDiscoveryPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const reduced = useReducedMotion();

  const urlQ = params.get("q") || "";
  const [searchInput, setSearchInput] = useState(urlQ);
  const [activeQuery, setActiveQuery] = useState(urlQ);

  const [region, setRegion] = useState("all");
  const [category, setCategory] = useState("all");
  const [onlyUMKM, setOnlyUMKM] = useState(false);
  const [onlyHiddenGem, setOnlyHiddenGem] = useState(false);

  const [rawItems, setRawItems] = useState([]);
  const [busy, setBusy] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [visibleLimit, setVisibleLimit] = useState(24);
  const [loadingMore, setLoadingMore] = useState(false);

  const [hoveredRegion, setHoveredRegion] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);

  // Saved place IDs dari localStorage
  const [savedIds, setSavedIds] = useState(() => {
    try {
      const raw = localStorage.getItem(SAVED_STORAGE_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Debounce pencarian 150ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setActiveQuery(searchInput.trim());
      setParams(searchInput.trim() ? { q: searchInput.trim() } : {});
    }, 150);
    return () => clearTimeout(handler);
  }, [searchInput, setParams]);

  // Load data tempat dari backend dan curated nationwide catalog
  const loadData = useCallback(() => {
    setBusy(true);
    setErrorMsg("");

    const catalogPromise = searchPlacesAcrossIndonesia({
      query: "",
      category: "all",
      region: "all",
    });
    const serverPromise = listPlaces().catch(() => ({ places: [] }));

    Promise.all([catalogPromise, serverPromise])
      .then(([curatedList, serverData]) => {
        const verifiedIds = new Set(
          (serverData?.places || []).map((p) => p.id),
        );

        // Gabungkan dan beri tanda verifikasi server jika cocok
        const unified = (curatedList || []).map((item) => {
          const isVerifiedServer =
            verifiedIds.has(item.id) ||
            Boolean(item.coordinates || (item.lat && item.lng));
          return {
            ...item,
            isVerified: isVerifiedServer,
          };
        });

        setRawItems(unified);
      })
      .catch(() => {
        setErrorMsg("Katalog sedang beristirahat sebentar");
      })
      .finally(() => {
        setBusy(false);
      });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Hitung jumlah tempat per wilayah untuk tooltip SVG
  const regionCounts = useMemo(() => {
    const map = {};
    ISLAND_REGIONS.forEach((r) => {
      map[r.id] = rawItems.filter((it) => it.region === r.id).length;
    });
    return map;
  }, [rawItems]);

  // Filter tempat sesuai pencarian, wilayah, kategori, dan toggle
  const filteredItems = useMemo(() => {
    const qLower = activeQuery.toLowerCase();

    return rawItems.filter((item) => {
      // 1. Filter Wilayah
      if (region !== "all" && item.region !== region) {
        return false;
      }

      // 2. Filter Kategori Jenis
      if (category !== "all") {
        if (category === "culinary" && item.category !== "Culinary") return false;
        if (category === "craft" && item.category !== "Craft") return false;
        if (
          category === "heritage" &&
          item.category !== "Heritage" &&
          item.category !== "Culture"
        )
          return false;
        if (category === "nature" && item.category !== "Nature") return false;
        if (
          category === "lodging" &&
          item.category !== "Lodging" &&
          item.kind !== "lodging"
        )
          return false;
      }

      // 3. Toggle Hanya UMKM
      if (onlyUMKM && !item.isUMKM) {
        return false;
      }

      // 4. Toggle Hidden Gem
      if (onlyHiddenGem && !item.isHiddenGem) {
        return false;
      }

      // 5. Query Pencarian
      if (qLower) {
        const matchName = item.name?.toLowerCase().includes(qLower);
        const matchCity = item.city?.toLowerCase().includes(qLower);
        const matchProvince = item.province?.toLowerCase().includes(qLower);
        const matchDesc = item.description?.toLowerCase().includes(qLower);
        const matchCategory = item.category?.toLowerCase().includes(qLower);
        const matchTags = (item.tags || []).some((t) =>
          t.toLowerCase().includes(qLower),
        );
        if (
          !matchName &&
          !matchCity &&
          !matchProvince &&
          !matchDesc &&
          !matchCategory &&
          !matchTags
        ) {
          return false;
        }
      }

      return true;
    });
  }, [rawItems, region, category, onlyUMKM, onlyHiddenGem, activeQuery]);

  // Simpan / hapus dari Saved Places
  const toggleSave = (id, name) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast.info(`Dihapus dari Saved Places`);
      } else {
        next.add(id);
        toast.success(`Disimpan ke Saved Places`);
      }
      try {
        localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // Abaikan
      }
      return next;
    });
  };

  const handleResetFilters = () => {
    setRegion("all");
    setCategory("all");
    setOnlyUMKM(false);
    setOnlyHiddenGem(false);
    setSearchInput("");
    setActiveQuery("");
    setVisibleLimit(24);
  };

  const hasActiveFilters =
    region !== "all" ||
    category !== "all" ||
    onlyUMKM ||
    onlyHiddenGem ||
    Boolean(activeQuery);

  // Load more
  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleLimit((prev) => prev + 12);
      setLoadingMore(false);
    }, 300);
  };

  // Navigasi Keyboard di Panel Detail (Escape, ArrowLeft, ArrowRight)
  useEffect(() => {
    if (!selectedPlace) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedPlace(null);
      } else if (e.key === "ArrowLeft") {
        const currentIdx = filteredItems.findIndex(
          (it) => it.id === selectedPlace.id,
        );
        if (currentIdx > 0) {
          setSelectedPlace(filteredItems[currentIdx - 1]);
        }
      } else if (e.key === "ArrowRight") {
        const currentIdx = filteredItems.findIndex(
          (it) => it.id === selectedPlace.id,
        );
        if (currentIdx >= 0 && currentIdx < filteredItems.length - 1) {
          setSelectedPlace(filteredItems[currentIdx + 1]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPlace, filteredItems]);

  const selectedRegionDef = ISLAND_REGIONS.find((r) => r.id === region);

  // SVG Transform zoom halus ke wilayah terpilih
  const mapTransform = useMemo(() => {
    if (reduced || region === "all" || !selectedRegionDef) {
      return { scale: 1, x: 0, y: 0 };
    }
    const targetX = 400 - selectedRegionDef.centroid.x;
    const targetY = 180 - selectedRegionDef.centroid.y;
    return {
      scale: 1.4,
      x: targetX * 0.45,
      y: targetY * 0.45,
    };
  }, [region, selectedRegionDef, reduced]);

  const displayedItems = filteredItems.slice(0, visibleLimit);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 text-[#0A1A1C]">
      {/* ── 1. HEADER PANEL (Deep Teal gelap, tekstur batik tipis, SVG Peta Indonesia) ── */}
      <section
        aria-label="Panel Jelajahi Indonesia"
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B4F5C] via-[#093D47] to-[#072B32] text-[#FBF5E9] p-6 sm:p-8 lg:p-10 shadow-2xl"
      >
        {/* Tekstur Batik Halus (5-7% opacity) */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          aria-hidden="true"
          style={{
            backgroundImage: `radial-gradient(circle at 25px 25px, #FBF5E9 2.5%, transparent 2.5%), radial-gradient(circle at 75px 75px, #2EC4B6 2.5%, transparent 2.5%)`,
            backgroundSize: "100px 100px",
          }}
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Kolom Kiri: Judul, Subtitle (maks 12 kata), & Kolom Pencarian Besar */}
          <div className="lg:col-span-5 space-y-5">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2EC4B6] block">
                Local Discovery TRIPIN
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#FBF5E9] leading-tight">
                Jelajahi Indonesia
              </h1>
              <p className="text-sm sm:text-base text-[#FBF5E9]/80 leading-relaxed max-w-md">
                Temukan pesona autentik dan karya perajin lokal di enam penjuru
                Nusantara.
              </p>
            </div>

            {/* Kolom Pencarian Besar dengan Debounce 150ms */}
            <div className="flex items-center gap-3 px-4 py-3.5 bg-[#FBF5E9] rounded-2xl shadow-lg border-2 border-transparent focus-within:border-[#2EC4B6] transition-all">
              <Search
                size={20}
                className="text-[#0B3B45] flex-shrink-0"
              />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari nama tempat, kota, atau jenis..."
                aria-label="Cari nama tempat, kota, atau kategori"
                className="w-full bg-transparent text-[#0A1A1C] placeholder:text-[#0B3B45]/50 font-semibold text-sm sm:text-base border-0 outline-none focus:outline-none focus:ring-0 p-0"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  aria-label="Hapus teks pencarian"
                  className="p-1 text-[#0B3B45]/70 hover:text-[#0B3B45] flex-shrink-0"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Tombol Cepat Reset Wilayah jika Sedang Terfilter */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setRegion("all")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all min-h-[36px] ${
                  region === "all"
                    ? "bg-[#2EC4B6] text-[#0A1A1C] shadow-md"
                    : "bg-white/10 text-[#FBF5E9] hover:bg-white/20"
                }`}
              >
                Seluruh Indonesia
              </button>
              {selectedRegionDef && (
                <span className="text-xs font-semibold text-[#F4A261] flex items-center gap-1.5 bg-[#F4A261]/15 px-3 py-1.5 rounded-full border border-[#F4A261]/30">
                  <MapPin size={12} />
                  {selectedRegionDef.name} ({regionCounts[region] || 0} tempat)
                </span>
              )}
            </div>
          </div>

          {/* Kolom Kanan: Peta Indonesia SVG Interaktif (6 Wilayah) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="relative w-full aspect-[800/360] max-h-[320px] rounded-2xl bg-[#082930]/80 p-3 sm:p-4 border border-white/10 overflow-hidden select-none">
              <motion.svg
                viewBox="0 0 800 360"
                fill="none"
                className="w-full h-full"
                animate={mapTransform}
                transition={{ duration: reduced ? 0 : 0.6, ease: EASE }}
              >
                {/* 6 Wilayah Pulau */}
                {ISLAND_REGIONS.map((island) => {
                  const isSelected = region === island.id;
                  const isDimmed = region !== "all" && !isSelected;
                  const isHovered = hoveredRegion === island.id;
                  const count = regionCounts[island.id] || 0;

                  return (
                    <motion.g
                      key={island.id}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isSelected}
                      aria-label={`${island.name}, ${count} tempat`}
                      onClick={() =>
                        setRegion((curr) => (curr === island.id ? "all" : island.id))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setRegion((curr) =>
                            curr === island.id ? "all" : island.id,
                          );
                        }
                      }}
                      onMouseEnter={() => setHoveredRegion(island.id)}
                      onMouseLeave={() => setHoveredRegion(null)}
                      className="cursor-pointer focus:outline-none"
                      animate={
                        reduced
                          ? { opacity: isDimmed ? 0.35 : 1 }
                          : {
                              opacity: isDimmed ? 0.35 : 1,
                              y: isHovered ? -2 : 0,
                              fill: isSelected
                                ? "#F4A261"
                                : isHovered
                                ? "#2EC4B6"
                                : "#147282",
                            }
                      }
                      transition={{ duration: 0.25 }}
                      style={{
                        transformOrigin: `${island.centroid.x}px ${island.centroid.y}px`,
                      }}
                    >
                      {island.shapes}

                      {/* Label Pulau */}
                      <text
                        x={island.centroid.x}
                        y={island.centroid.y + (island.id === "jawa" ? 22 : -10)}
                        textAnchor="middle"
                        fill="#FBF5E9"
                        fontSize={isSelected ? "13" : "11"}
                        fontWeight={isSelected ? "800" : "600"}
                        className="pointer-events-none drop-shadow"
                      >
                        {island.name}
                      </text>

                      {/* Titik Kecil Berdenyut Menandai Tempat di Wilayah Terpilih */}
                      {isSelected &&
                        island.beacons.map((b, bIdx) => (
                          <motion.circle
                            key={bIdx}
                            cx={b.cx}
                            cy={b.cy}
                            r="4.5"
                            fill="#FBF5E9"
                            animate={
                              reduced
                                ? {}
                                : { scale: [1, 1.45, 1], opacity: [0.7, 1, 0.7] }
                            }
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              delay: bIdx * 0.4,
                              ease: "easeInOut",
                            }}
                            style={{
                              transformOrigin: `${b.cx}px ${b.cy}px`,
                            }}
                          />
                        ))}
                    </motion.g>
                  );
                })}
              </motion.svg>

              {/* Tooltip Hover Pulau: Nama + Jumlah Tempat */}
              {hoveredRegion && (
                <div
                  className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 px-3 py-1.5 rounded-xl bg-[#0A1A1C]/90 text-[#FBF5E9] text-xs font-bold border border-white/15 shadow-md pointer-events-none flex items-center gap-2"
                  aria-hidden="true"
                >
                  <span className="w-2 h-2 rounded-full bg-[#2EC4B6]" />
                  <span>
                    {ISLAND_REGIONS.find((r) => r.id === hoveredRegion)?.name}
                  </span>
                  <span className="text-[#F4A261]">
                    {regionCounts[hoveredRegion] > 0
                      ? `${regionCounts[hoveredRegion]} tempat`
                      : "Segera hadir"}
                  </span>
                </div>
              )}
            </div>

            {/* Tab Wilayah di Mobile (Kontrol yang sama dengan peta) */}
            <div className="flex lg:hidden overflow-x-auto w-full gap-1.5 pt-3 pb-1 no-scrollbar">
              <button
                type="button"
                onClick={() => setRegion("all")}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold min-h-[36px] ${
                  region === "all"
                    ? "bg-[#F4A261] text-[#0A1A1C]"
                    : "bg-white/10 text-[#FBF5E9]"
                }`}
              >
                Semua
              </button>
              {ISLAND_REGIONS.map((isl) => (
                <button
                  key={isl.id}
                  type="button"
                  onClick={() =>
                    setRegion((c) => (c === isl.id ? "all" : isl.id))
                  }
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold min-h-[36px] ${
                    region === isl.id
                      ? "bg-[#F4A261] text-[#0A1A1C]"
                      : "bg-white/10 text-[#FBF5E9]"
                  }`}
                >
                  {isl.name} ({regionCounts[isl.id] || 0})
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. FILTER BAR (Sticky di Area Cream) ── */}
      <section
        aria-label="Filter dan pengelompokan destinasi"
        className="sticky top-0 z-30 bg-[#FBF5E9]/95 backdrop-blur-md py-3.5 border-b border-gray-200/70 transition-all"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Pilihan Jenis (Semua, Kuliner, Kerajinan, Alam, Sejarah & Budaya, Penginapan lokal) */}
          <div
            role="tablist"
            aria-label="Kategori jenis tempat"
            className="flex flex-wrap items-center gap-1.5"
          >
            {CATEGORY_ITEMS.map((cat) => {
              const isSelected = category === cat.id;
              const IconComp = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setCategory(cat.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] focus:outline-none focus:ring-2 focus:ring-[#0B4F5C] ${
                    isSelected
                      ? "bg-white shadow-sm text-[#0A1A1C] border"
                      : "bg-transparent text-[#0B3B45]/80 hover:text-[#0A1A1C] hover:bg-white/60"
                  }`}
                  style={{
                    borderColor: isSelected ? cat.accent : "transparent",
                  }}
                >
                  {/* Lingkaran Ikon dengan Warna Aksen */}
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: isSelected
                        ? `${cat.accent}25`
                        : "transparent",
                      color: cat.accent,
                    }}
                  >
                    <IconComp size={13} />
                  </span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Dua Toggle Terpisah: Hanya UMKM & Hidden Gem */}
          <div className="flex items-center gap-3">
            {/* Toggle UMKM */}
            <button
              type="button"
              role="switch"
              aria-checked={onlyUMKM}
              onClick={() => setOnlyUMKM((v) => !v)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all min-h-[40px] ${
                onlyUMKM
                  ? "bg-[#0B4F5C] text-white border-[#0B4F5C] shadow-sm"
                  : "bg-white text-[#0B3B45] border-gray-200 hover:border-gray-300"
              }`}
            >
              <Store size={14} className={onlyUMKM ? "text-[#2EC4B6]" : "text-[#0B4F5C]"} />
              <div className="text-left leading-tight">
                <span>Hanya UMKM lokal</span>
              </div>
            </button>

            {/* Toggle Hidden Gem */}
            <button
              type="button"
              role="switch"
              aria-checked={onlyHiddenGem}
              onClick={() => setOnlyHiddenGem((v) => !v)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all min-h-[40px] ${
                onlyHiddenGem
                  ? "bg-[#C9A227] text-[#0A1A1C] border-[#C9A227] shadow-sm"
                  : "bg-white text-[#0B3B45] border-gray-200 hover:border-gray-300"
              }`}
            >
              <Sparkles size={14} className={onlyHiddenGem ? "text-[#0A1A1C]" : "text-[#C9A227]"} />
              <div className="text-left leading-tight">
                <span>Hidden gem</span>
              </div>
            </button>
          </div>
        </div>

        {/* Baris Status Hasil & Tombol Reset */}
        <div className="flex items-center justify-between gap-3 pt-2.5 text-xs text-[#0B3B45]/85">
          <div className="font-semibold flex items-center gap-1.5">
            <span className="font-extrabold text-[#0B4F5C]">
              <AnimatedCount value={filteredItems.length} reduced={reduced} />
            </span>
            <span>
              tempat ditemukan
              {region !== "all" && selectedRegionDef
                ? ` di ${selectedRegionDef.name}`
                : " di seluruh Indonesia"}
            </span>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 font-bold text-xs text-[#C8553D] hover:underline focus:outline-none"
            >
              <RotateCcw size={12} />
              <span>Reset filter</span>
            </button>
          )}
        </div>
      </section>

      {/* ── 3. GRID KARTU EDITORIAL (3 Kolom Seimbang, Sorotan 2 Kolom, Rapi & Selaras) ── */}
      {busy ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-4">
          {[1, 2, 3, 4, 5, 6].map((sk) => (
            <div
              key={sk}
              className={`rounded-3xl bg-gray-200/60 animate-pulse min-h-[360px] ${
                sk === 1 ? "md:col-span-2 lg:col-span-2" : "col-span-1"
              }`}
            />
          ))}
        </div>
      ) : displayedItems.length > 0 ? (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch"
        >
          <AnimatePresence mode="popLayout">
            {displayedItems.map((item, idx) => {
              const isHighlight = idx === 0;
              const isSaved = savedIds.has(item.id);

              const catMeta =
                CATEGORY_ITEMS.find((c) => c.label === item.category) ||
                CATEGORY_ITEMS[0];

              return (
                <motion.article
                  key={item.id}
                  layoutId={reduced ? undefined : `place-card-${item.id}`}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
                  transition={{
                    duration: reduced ? 0.2 : 0.4,
                    delay: reduced ? 0 : Math.min(idx * 0.05, 0.4),
                    ease: EASE,
                  }}
                  onClick={() => setSelectedPlace(item)}
                  tabIndex={0}
                  role="button"
                  aria-label={`Lihat detail ${item.name}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedPlace(item);
                    }
                  }}
                  className={`group relative rounded-3xl overflow-hidden bg-[#0A1A1C] shadow-md hover:shadow-2xl border border-black/10 transition-all cursor-pointer select-none flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-[#0B4F5C] ${
                    isHighlight
                      ? "md:col-span-2 lg:col-span-2 min-h-[380px]"
                      : "col-span-1 min-h-[360px]"
                  }`}
                >
                  {/* Gambar Latar Penuh (Mengisi Seluruh Kartu) */}
                  <div className="absolute inset-0 w-full h-full">
                    <PlaceImage
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />

                    {/* Gradasi Gelap Halus untuk Keterbacaan Teks */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/20" />
                  </div>

                  {/* Header Kartu: Badges (Kiri) & Tombol Simpan Hati (Kanan) */}
                  <div className="relative z-10 p-4 sm:p-5 flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {isHighlight && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-[#0B4F5C] text-[#FBF5E9] px-3 py-1 rounded-full shadow-md border border-[#2EC4B6]/40">
                          Sorotan
                        </span>
                      )}

                      {/* Badge Hidden Gem HANYA jika data menandainya */}
                      {item.isHiddenGem && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#C9A227] text-[#0A1A1C] px-2.5 py-0.5 rounded-full shadow-sm">
                          <Sparkles size={11} /> Hidden Gem
                        </span>
                      )}

                      {/* Ikon Centang Kecil jika Data Terverifikasi */}
                      {item.isVerified && (
                        <span
                          title="Data terverifikasi"
                          className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#2EC4B6] text-[#0A1A1C] px-2.5 py-0.5 rounded-full shadow-sm"
                        >
                          <CheckCircle2 size={11} strokeWidth={2.5} />
                          <span>Terverifikasi</span>
                        </span>
                      )}
                    </div>

                    {/* Tombol Simpan Hati di Pojok Kanan Atas */}
                    <div>
                      <HeartSaveButton
                        isSaved={isSaved}
                        onToggle={() => toggleSave(item.id, item.name)}
                        reduced={reduced}
                      />
                    </div>
                  </div>

                  {/* Konten Teks di Atas Gradasi Bagian Bawah */}
                  <div className="relative z-10 p-4 sm:p-5 flex flex-col justify-end text-[#FBF5E9] space-y-2 mt-auto">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: catMeta.accent }}
                      />
                      <span style={{ color: catMeta.accent }}>
                        {item.category || item.typeLabel || "Wisata Lokal"}
                      </span>
                    </div>

                    <h2
                      className={`font-extrabold tracking-tight text-[#FBF5E9] leading-snug drop-shadow ${
                        isHighlight
                          ? "text-xl sm:text-2xl"
                          : "text-base sm:text-lg"
                      }`}
                    >
                      {highlightMatch(item.name, activeQuery)}
                    </h2>

                    <p className="text-xs text-[#FBF5E9]/80 flex items-center gap-1.5">
                      <MapPin size={13} className="text-[#F4A261] flex-shrink-0" />
                      <span className="truncate">
                        {highlightMatch(item.city, activeQuery)}
                        {item.province ? `, ${item.province}` : ""}
                      </span>
                    </p>

                    {/* Selalu Terlihat: Rentang Harga & Jam Buka */}
                    <div className="pt-2 flex items-center justify-between text-xs border-t border-white/15">
                      <span className="text-[#FBF5E9]/75 flex items-center gap-1.5">
                        <Clock size={12} />
                        <span>{item.openHour || "08:00 - 17:00"}</span>
                      </span>
                      <span className="font-extrabold text-[#F4A261] text-xs sm:text-sm">
                        {item.priceLabel || item.priceRange || "Gratis"}
                      </span>
                    </div>

                    {/* Deskripsi Satu-Dua Baris yang Rapi */}
                    {item.description && (
                      <p className="text-xs text-[#FBF5E9]/75 line-clamp-2 leading-relaxed pt-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </motion.div>
      ) : (
        /* ── 4. EMPTY STATE DENGAN ILUSTRASI LOKAL PHINISI ── */
        <div className="rounded-3xl bg-white p-10 sm:p-14 text-center border border-gray-100 shadow-sm max-w-xl mx-auto space-y-4">
          <svg
            viewBox="0 0 160 100"
            fill="none"
            className="w-32 h-20 mx-auto text-[#0B4F5C]"
            aria-hidden="true"
          >
            {/* Siluet perahu layar Pinisi / rumah adat tradisional garis tipis */}
            <path
              d="M20 70 Q80 82 140 70 L130 84 Q80 92 30 84 Z"
              stroke="#0B4F5C"
              strokeWidth="2"
              fill="none"
            />
            <path d="M80 70 V20 M55 70 V32" stroke="#0B4F5C" strokeWidth="2" />
            <path
              d="M80 24 L120 62 H80 Z M55 36 L75 62 H55 Z"
              stroke="#F4A261"
              strokeWidth="1.8"
              fill="#F4A261"
              fillOpacity="0.15"
            />
          </svg>

          <div className="space-y-1.5">
            <h2 className="text-lg font-extrabold text-[#0A1A1C]">
              Belum ada tempat yang cocok dengan pilihanmu
            </h2>
            <p className="text-xs sm:text-sm text-[#0B3B45]/70 max-w-sm mx-auto">
              Coba sesuaikan kata kunci pencarian, ubah filter kategori, atau pilih
              wilayah pulau lain.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-xs sm:text-sm bg-[#0B4F5C] text-white hover:bg-[#083D47] transition-colors shadow-md min-h-[44px]"
            >
              <RotateCcw size={14} />
              <span>Reset filter</span>
            </button>
          </div>
        </div>
      )}

      {/* ── 5. ERROR STATE (Pesan Ramah Jika Layanan Gagal) ── */}
      {errorMsg && (
        <div
          role="alert"
          className="rounded-3xl bg-[#0B4F5C] text-[#FBF5E9] p-6 text-center space-y-3 shadow-lg max-w-md mx-auto"
        >
          <p className="text-sm font-bold">{errorMsg}</p>
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full font-bold text-xs bg-[#F4A261] text-[#0A1A1C] hover:brightness-95"
          >
            <RotateCcw size={13} />
            <span>Coba lagi</span>
          </button>
        </div>
      )}

      {/* ── 6. LOAD MORE (Jika Tempat > 24) ── */}
      {filteredItems.length > visibleLimit && (
        <div className="flex justify-center pt-6">
          <button
            type="button"
            disabled={loadingMore}
            onClick={handleLoadMore}
            className="inline-flex items-center gap-2.5 px-7 py-3 rounded-full font-bold text-sm bg-white border border-gray-200 text-[#0B4F5C] hover:border-[#0B4F5C] shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#0B4F5C] min-h-[48px]"
          >
            <motion.span
              animate={loadingMore ? { rotate: 360 } : { rotate: 0 }}
              transition={{
                duration: 1,
                repeat: loadingMore ? Infinity : 0,
                ease: "linear",
              }}
            >
              <Compass size={17} className="text-[#F4A261]" />
            </motion.span>
            <span>
              Muat lebih banyak ({filteredItems.length - visibleLimit} tempat lagi)
            </span>
          </button>
        </div>
      )}

      {/* ── 7. PANEL DETAIL (Right Drawer Desktop / Bottom Sheet Mobile, Shared Transition) ── */}
      <AnimatePresence>
        {selectedPlace && (
          <div
            className="fixed inset-0 z-50 flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-title"
          >
            {/* Backdrop Meredupkan Layar Kiri */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setSelectedPlace(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              aria-hidden="true"
            />

            {/* Panel Kanan 480px di Desktop / Bottom Sheet di Mobile */}
            <motion.div
              initial={
                reduced
                  ? { opacity: 0 }
                  : { x: "100%", opacity: 0 }
              }
              animate={{ x: 0, opacity: 1 }}
              exit={
                reduced
                  ? { opacity: 0 }
                  : { x: "100%", opacity: 0 }
              }
              transition={{ duration: reduced ? 0.2 : 0.4, ease: EASE }}
              className="relative z-10 w-full sm:max-w-[480px] h-full bg-[#FBF5E9] text-[#0A1A1C] shadow-2xl flex flex-col justify-between overflow-y-auto"
            >
              <div>
                {/* Header Panel Detail dengan Gambar Penuh */}
                <div className="relative h-64 sm:h-72 overflow-hidden bg-[#0A1A1C]">
                  <PlaceImage
                    src={selectedPlace.image}
                    alt={selectedPlace.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Tombol Tutup Silang */}
                  <button
                    type="button"
                    onClick={() => setSelectedPlace(null)}
                    aria-label="Tutup detail tempat"
                    className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 text-white hover:bg-black/80 flex items-center justify-center transition-colors shadow-md z-20"
                  >
                    <X size={18} />
                  </button>

                  {/* Tombol Simpan Favorit */}
                  <div className="absolute top-4 right-16 z-20">
                    <HeartSaveButton
                      isSaved={savedIds.has(selectedPlace.id)}
                      onToggle={() =>
                        toggleSave(selectedPlace.id, selectedPlace.name)
                      }
                      reduced={reduced}
                    />
                  </div>

                  {/* Info Nama di Bawah Gambar */}
                  <div className="absolute bottom-4 inset-x-4 text-[#FBF5E9] space-y-1 z-10">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#F4A261] bg-black/50 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                        {selectedPlace.category || "Wisata Lokal"}
                      </span>
                      {selectedPlace.isHiddenGem && (
                        <span className="text-xs font-bold text-[#0A1A1C] bg-[#C9A227] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                          <Sparkles size={11} /> Hidden Gem
                        </span>
                      )}
                    </div>
                    <h2
                      id="detail-title"
                      className="text-xl sm:text-2xl font-extrabold text-[#FBF5E9] leading-tight drop-shadow"
                    >
                      {selectedPlace.name}
                    </h2>
                  </div>
                </div>

                {/* Badan Info Detail */}
                <div className="p-5 sm:p-6 space-y-6">
                  {/* Lokasi Lengkap */}
                  <div className="flex items-start gap-2.5 text-sm text-[#0B3B45]/90">
                    <MapPin size={17} className="text-[#C8553D] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[#0A1A1C]">
                        {selectedPlace.city}
                        {selectedPlace.province ? `, ${selectedPlace.province}` : ""}
                      </p>
                      <p className="text-xs text-[#0B3B45]/75">
                        {selectedPlace.area || selectedPlace.address || "Area lokal terkurasi TRIPIN"}
                      </p>
                    </div>
                  </div>

                  {/* Kartu Jam & Harga */}
                  <div className="grid grid-cols-2 gap-3 bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-sm text-xs">
                    <div className="space-y-1">
                      <span className="text-[#0B3B45]/70 block font-semibold">
                        Jam Buka
                      </span>
                      <span className="font-extrabold text-[#0A1A1C] flex items-center gap-1">
                        <Clock size={12} className="text-[#0B4F5C]" />
                        {selectedPlace.openHour
                          ? `${selectedPlace.openHour}`
                          : "Jam buka reguler belum terverifikasi"}
                      </span>
                    </div>
                    <div className="space-y-1 border-l border-gray-100 pl-3">
                      <span className="text-[#0B3B45]/70 block font-semibold">
                        Perkiraan Biaya
                      </span>
                      <span className="font-extrabold text-[#0B4F5C]">
                        {selectedPlace.priceRange ||
                          selectedPlace.priceLabel ||
                          "Gratis"}
                      </span>
                    </div>
                  </div>

                  {/* Status Verifikasi */}
                  <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#0B4F5C]/10 border border-[#0B4F5C]/20 text-xs">
                    <CheckCircle2
                      size={16}
                      className="text-[#0B4F5C] flex-shrink-0"
                    />
                    <p className="text-[#0B4F5C] font-semibold leading-relaxed">
                      {selectedPlace.isVerified
                        ? "Data telah diverifikasi dengan koordinat akurat dan jam operasional reguler."
                        : "Data terdaftar di katalog komunitas TRIPIN Nusantara."}
                    </p>
                  </div>

                  {/* Deskripsi & Cerita Keunikan */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-extrabold text-[#0A1A1C]">
                      Tentang Tempat Ini
                    </h3>
                    <p className="text-sm text-[#0B3B45]/85 leading-relaxed">
                      {selectedPlace.description ||
                        "Destinasi khas yang mencerminkan kekayaan ragam budaya dan kehidupan masyarakat lokal Indonesia."}
                    </p>
                  </div>

                  {/* Tagar & Ciri Khas */}
                  {selectedPlace.tags && selectedPlace.tags.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-[#0B3B45]/70 block">
                        Ciri Khas & Suasana
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedPlace.tags.map((tg, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white border border-gray-200 text-[#0B4F5C]"
                          >
                            #{tg}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tips Lokal */}
                  <div className="p-3.5 rounded-2xl bg-[#F4A261]/15 border border-[#F4A261]/35 text-xs text-[#0B3B45] space-y-1">
                    <span className="font-bold text-[#C8553D] block">
                      💡 Tips Kunjungan Lokal
                    </span>
                    <p className="leading-relaxed">
                      Datang lebih pagi untuk menikmati udara sejuk dan menghindari
                      antrean, serta siapkan uang tunai untuk pembelian karya UMKM.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tombol Aksi Bawah: Rencanakan ke Sini, Maps, & Bagikan */}
              <div className="sticky bottom-0 p-4 sm:p-5 bg-[#FBF5E9]/95 border-t border-gray-200/80 backdrop-blur-md space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    navigate("/create", {
                      state: {
                        destination: selectedPlace.city || selectedPlace.name,
                        promptText: `Perjalanan ke ${selectedPlace.name}`,
                      },
                    });
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-extrabold text-sm sm:text-base bg-[#F4A261] text-[#0A1A1C] hover:brightness-95 shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-[#0B4F5C] min-h-[48px]"
                >
                  <span>Rencanakan ke sini</span>
                  <ArrowRight size={17} />
                </button>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${selectedPlace.name} ${selectedPlace.city || ""}`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-300 bg-white text-xs font-bold text-[#0B4F5C] hover:bg-gray-50 transition-colors min-h-[40px]"
                  >
                    <ExternalLink size={14} />
                    <span>Buka di Maps</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      try {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success("Tautan disalin ke papan klip");
                      } catch {
                        toast.info("Tautan siap dibagikan");
                      }
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-300 bg-white text-xs font-bold text-[#0B4F5C] hover:bg-gray-50 transition-colors min-h-[40px]"
                  >
                    <Share2 size={14} />
                    <span>Bagikan</span>
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
