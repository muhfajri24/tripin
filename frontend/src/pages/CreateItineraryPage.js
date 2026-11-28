import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Bookmark, Check, Minus, Plus, RotateCcw, X } from "lucide-react";
import { api, listPlaces } from "../services/plannerApi";
import { saveTrip } from "../services/itineraryStorage";
import { initialForm, toRequest } from "../components/PreferenceForm";
import { rupiah } from "../components/GuestUI";
import TripView from "../components/TripView";
import { extractDestinationFromQuery } from "../services/regionService";

const SESSION_DRAFT_KEY = "tripin_create_session_v1";
const RECENT_RECOMMENDATIONS_KEY = "tripin_recent_recommendations_v1";

function recommendationHistory(destinationId) {
  try {
    const all = JSON.parse(localStorage.getItem(RECENT_RECOMMENDATIONS_KEY) || "{}");
    return Array.isArray(all[destinationId]) ? all[destinationId].slice(0, 24) : [];
  } catch {
    return [];
  }
}

function rememberRecommendations(destinationId, ids, reset = false) {
  try {
    const all = JSON.parse(localStorage.getItem(RECENT_RECOMMENDATIONS_KEY) || "{}");
    all[destinationId] = Array.from(new Set([...ids, ...(reset ? [] : all[destinationId] || [])])).slice(0, 24);
    localStorage.setItem(RECENT_RECOMMENDATIONS_KEY, JSON.stringify(all));
  } catch {
    // Storage is optional; itinerary generation still works.
  }
}

function jakartaDate(offsetDays = 0) {
  const local = new Date(Date.now() + 7 * 60 * 60 * 1000);
  local.setUTCDate(local.getUTCDate() + offsetDays);
  return local.toISOString().slice(0, 10);
}

function suggestedTripDate() {
  const hour = new Date(Date.now() + 7 * 60 * 60 * 1000).getUTCHours();
  return jakartaDate(hour >= 7 ? 1 : 0);
}

const EASE = [0.22, 1, 0.36, 1];

const TASTE_OPTIONS = [
  {
    id: "nature",
    label: "Alam & Pemandangan",
    subtitle: "Gunung, perbukitan hijau, dan udara sejuk",
  },
  {
    id: "culture",
    label: "Budaya & Sejarah",
    subtitle: "Candi, keraton, museum, dan seni tradisi",
  },
  {
    id: "food",
    label: "Kuliner",
    subtitle: "Cita rasa lokal, pasar tradisional, dan jajanan khas",
  },
  {
    id: "craft",
    label: "Kerajinan & Oleh-oleh",
    subtitle: "Sentra batik, kriya lokal, dan karya pengrajin",
  },
  {
    id: "beach",
    label: "Pantai & Pulau",
    subtitle: "Pesisir, deburan ombak, dan senja tepi laut",
  },
  {
    id: "attraction",
    label: "Petualangan",
    subtitle: "Eksplorasi seru, landmark ikonik, dan aktivitas luar ruang",
  },
];

const COMPANION_OPTIONS = [
  { id: "solo", label: "Sendiri", subtitle: "Bebas atur langkah sendiri", adults: 1, count: 1 },
  { id: "couple", label: "Pasangan", subtitle: "Berdua yang hangat & santai", adults: 2, count: 2 },
  { id: "family", label: "Keluarga", subtitle: "Ramah untuk semua usia", adults: 4, count: 4 },
  { id: "friends", label: "Teman-teman", subtitle: "Seru-seruan bareng sahabat", adults: 4, count: 4 },
  { id: "group", label: "Rombongan besar", subtitle: "Perjalanan ramai & kompak", adults: 6, count: 5 },
];

const BUDGET_TIERS = [
  { id: "hemat", label: "Hemat", subtitle: "Cari yang murah dan lokal", amount: 300000, stacks: 1 },
  { id: "secukupnya", label: "Secukupnya", subtitle: "Seimbang & tetap nyaman", amount: 500000, stacks: 2 },
  { id: "nyaman", label: "Nyaman", subtitle: "Boleh agak leluasa memilih", amount: 1000000, stacks: 3 },
  { id: "bebas", label: "Bebas", subtitle: "Yang penting berkesan", amount: 2000000, stacks: 4 },
];

const PLAN_PRIORITIES = [
  { id: "travel_time", label: "Terdekat", detail: "Kurangi perkiraan waktu tempuh antar tempat." },
  { id: "budget", label: "Hemat", detail: "Utamakan tempat dengan biaya yang diketahui lebih rendah." },
  { id: "balanced", label: "Seimbang", detail: "Padukan kategori pilihan dan waktu perjalanan." },
];

const CREATION_STATUSES = [
  "Memahami permintaanmu",
  "Mencari tempat lokal",
  "Menyusun rute",
];

function formatRegionName(id) {
  if (!id) return "";
  return id
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function TasteIllustration({ id, active, reduced }) {
  if (id === "culture") {
    return (
      <svg
        viewBox="0 0 120 84"
        fill="none"
        aria-hidden="true"
        className="w-24 h-16 mx-auto"
      >
        <motion.g
          animate={
            reduced ? {} : active ? { y: [0, -3, 0] } : { y: 0 }
          }
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <path
            d="M20 70 H100 M28 70 V56 H92 V70 M36 56 V42 H84 V56 M46 42 V28 H74 V42 M56 28 L60 14 L64 28 Z"
            stroke={active ? "#F4A261" : "#2EC4B6"}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="60" cy="49" r="3" fill={active ? "#F4A261" : "#FBF5E9"} />
        </motion.g>
      </svg>
    );
  }
  if (id === "nature") {
    return (
      <svg
        viewBox="0 0 120 84"
        fill="none"
        aria-hidden="true"
        className="w-24 h-16 mx-auto"
      >
        <motion.path
          d="M18 66 L44 28 L66 54 L82 36 L102 66 Z"
          stroke={active ? "#F4A261" : "#2EC4B6"}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={reduced ? {} : active ? { y: [0, -2, 0] } : { y: 0 }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <circle cx="86" cy="20" r="6" stroke={active ? "#F4A261" : "#FBF5E9"} strokeWidth="2" />
      </svg>
    );
  }
  if (id === "craft") {
    return (
      <svg
        viewBox="0 0 120 84"
        fill="none"
        aria-hidden="true"
        className="w-24 h-16 mx-auto"
      >
        <motion.g
          animate={reduced ? {} : active ? { rotate: [0, 3, -3, 0] } : { rotate: 0 }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "60px 42px" }}
        >
          <path
            d="M60 14 L84 42 L60 70 L36 42 Z"
            stroke={active ? "#F4A261" : "#2EC4B6"}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle cx="60" cy="42" r="9" stroke={active ? "#F4A261" : "#FBF5E9"} strokeWidth="2.2" />
        </motion.g>
      </svg>
    );
  }
  if (id === "beach") {
    return (
      <svg
        viewBox="0 0 120 84"
        fill="none"
        aria-hidden="true"
        className="w-20 h-14 mx-auto"
      >
        <circle cx="84" cy="24" r="7" stroke={active ? "#F4A261" : "#FBF5E9"} strokeWidth="2.2" />
        <motion.path
          d="M16 50 Q32 42 48 50 T80 50 T106 50 M16 62 Q32 54 48 62 T80 62 T106 62"
          stroke={active ? "#F4A261" : "#2EC4B6"}
          strokeWidth="2.5"
          strokeLinecap="round"
          animate={reduced ? {} : { x: [-3, 3, -3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
    );
  }
  if (id === "attraction") {
    return (
      <svg
        viewBox="0 0 120 84"
        fill="none"
        aria-hidden="true"
        className="w-24 h-16 mx-auto"
      >
        <motion.path
          d="M60 12 L68 32 L90 34 L73 48 L78 69 L60 58 L42 69 L47 48 L30 34 L52 32 Z"
          stroke={active ? "#F4A261" : "#2EC4B6"}
          strokeWidth="2.4"
          strokeLinejoin="round"
          animate={reduced ? {} : active ? { scale: [1, 1.06, 1] } : { scale: 1 }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "60px 42px" }}
        />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 120 84"
      fill="none"
      aria-hidden="true"
      className="w-24 h-16 mx-auto"
    >
      <motion.path
        d="M44 26 C42 18, 48 14, 46 8 M60 24 C58 16, 64 12, 62 6 M76 26 C74 18, 80 14, 78 8"
        stroke={active ? "#F4A261" : "#2EC4B6"}
        strokeWidth="2.2"
        strokeLinecap="round"
        animate={reduced ? {} : { opacity: [0.4, 1, 0.4], y: [2, -3, 2] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      />
      <path
        d="M26 42 H94 C94 60, 78 70, 60 70 C42 70, 26 60, 26 42 Z M44 70 H76"
        stroke={active ? "#F4A261" : "#FBF5E9"}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MistyMountainScene({ reduced }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 22% 18%, rgba(46, 196, 182, 0.24), transparent 55%), linear-gradient(155deg, #136B7A 0%, #0F5562 52%, #0C3F4A 100%)",
        }}
      />
      <motion.svg
        viewBox="0 0 1440 420"
        fill="none"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 w-[112%] h-[46%] opacity-30"
        animate={reduced ? {} : { x: ["0%", "-4%", "0%"] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      >
        <path
          d="M0 320 L210 180 L420 270 L680 130 L940 260 L1180 160 L1440 270 L1440 420 L0 420 Z"
          fill="#0B3B45"
        />
      </motion.svg>
      <motion.svg
        viewBox="0 0 1440 340"
        fill="none"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 w-[112%] h-[34%] opacity-45"
        animate={reduced ? {} : { x: ["-3%", "0%", "-3%"] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      >
        <path
          d="M0 240 Q260 150 520 220 T1060 200 T1440 230 L1440 340 L0 340 Z"
          fill="#093038"
        />
      </motion.svg>
      <div className="absolute inset-0 bg-[#093038]/20" />
    </div>
  );
}

function TravelerPathScene({ count = 2, reduced }) {
  const glowScale = 0.95 + Math.min(4, count) * 0.04;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 78% 20%, rgba(46, 196, 182, 0.24), transparent 55%), linear-gradient(155deg, #116270 0%, #0E4E5A 55%, #0A3842 100%)",
        }}
      />
      {/* Lapisan bukit lembut & kabut bergerak */}
      <motion.svg
        viewBox="0 0 1440 360"
        fill="none"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 w-[112%] h-[42%] opacity-35"
        animate={reduced ? {} : { x: ["0%", "-3.5%", "0%"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      >
        <path
          d="M0 240 Q280 140 600 210 T1160 180 T1440 220 L1440 360 L0 360 Z"
          fill="#0B3B45"
        />
      </motion.svg>
      <motion.svg
        viewBox="0 0 1440 320"
        fill="none"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 w-[112%] h-[30%] opacity-50"
        animate={reduced ? {} : { x: ["-3%", "0%", "-3%"] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      >
        <path
          d="M0 220 Q360 160 720 210 T1440 190 L1440 320 L0 320 Z"
          fill="#093038"
        />
      </motion.svg>
      {/* Cahaya horizon halus yang bereaksi terhadap pilihan */}
      <motion.div
        className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[720px] h-[260px] rounded-full bg-[#2EC4B6]/15 blur-3xl"
        animate={reduced ? {} : { scale: [glowScale, glowScale + 0.06, glowScale], opacity: [0.45, 0.7, 0.45] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function CoinStackScene({ stacks = 2, reduced }) {
  const warmth = 0.14 + Math.min(4, stacks) * 0.03;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 26% 24%, rgba(244, 162, 97, ${warmth}), transparent 55%), linear-gradient(155deg, #126675 0%, #0E515E 55%, #0A3A44 100%)`,
        }}
      />
      {/* Gelombang cahaya aurora halus */}
      <motion.div
        className="absolute -top-24 -right-24 w-[520px] h-[520px] rounded-full bg-[#2EC4B6]/15 blur-3xl"
        animate={reduced ? {} : { x: [0, -24, 0], y: [0, 18, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-28 -left-20 w-[480px] h-[480px] rounded-full bg-[#F4A261]/15 blur-3xl"
        animate={reduced ? {} : { x: [0, 24, 0], y: [0, -16, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.svg
        viewBox="0 0 1440 300"
        fill="none"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 w-[112%] h-[32%] opacity-40"
        animate={reduced ? {} : { x: ["0%", "-3%", "0%"] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      >
        <path
          d="M0 210 Q340 130 700 190 T1440 160 L1440 300 L0 300 Z"
          fill="#093038"
        />
      </motion.svg>
    </div>
  );
}

function ArchipelagoBackdrop({ reduced }) {
  const islands = [
    { d: "M68 65 L125 112 L185 180 L225 250 L205 265 L150 205 L95 140 L52 82 Z", delay: 0 },
    { d: "M235 268 L325 276 L410 288 L435 300 L350 300 L255 288 Z", delay: 0.4 },
    { d: "M310 125 L400 108 L445 158 L420 222 L348 226 L306 182 Z", delay: 0.8 },
    { d: "M500 130 L568 118 L550 164 L580 200 L540 232 L512 195 L492 164 Z", delay: 1.2 },
    { d: "M452 298 L512 300 L585 305 L638 302 L638 316 L552 316 L452 310 Z", delay: 1.6 },
    { d: "M670 150 L765 166 L852 212 L838 260 L752 245 L682 204 Z", delay: 2.0 },
  ];
  const beacons = [
    { cx: 145, cy: 170 },
    { cx: 330, cy: 284 },
    { cx: 375, cy: 165 },
    { cx: 525, cy: 175 },
    { cx: 755, cy: 205 },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 22%, rgba(46, 196, 182, 0.22), transparent 60%), linear-gradient(155deg, #147282 0%, #0F5866 55%, #0C404B 100%)",
        }}
      />
      <motion.svg
        viewBox="0 0 900 360"
        fill="none"
        className="absolute inset-0 w-full h-full object-cover"
        animate={reduced ? {} : { y: [0, -6, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      >
        {islands.map((isl, idx) => (
          <motion.path
            key={idx}
            d={isl.d}
            fill="#2EC4B6"
            initial={reduced ? { opacity: 0.1 } : { opacity: 0.06 }}
            animate={reduced ? { opacity: 0.1 } : { opacity: [0.06, 0.14, 0.06] }}
            transition={{
              duration: 5.5,
              delay: isl.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
        {beacons.map((pt, idx) => (
          <motion.circle
            key={pt.cx}
            cx={pt.cx}
            cy={pt.cy}
            r="3.5"
            fill="#F4A261"
            animate={reduced ? { opacity: 0.35 } : { opacity: [0.15, 0.55, 0.15], scale: [1, 1.35, 1] }}
            transition={{
              duration: 4,
              delay: idx * 0.7,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ transformOrigin: `${pt.cx}px ${pt.cy}px` }}
          />
        ))}
      </motion.svg>
    </div>
  );
}

function ComposingCanvas({
  reduced,
  error,
  emptyResult,
  hasResult,
  onRetry,
  onStartOver,
  headingRef,
}) {
  const [statusIdx, setStatusIdx] = useState(0);

  useEffect(() => {
    if (error || emptyResult || hasResult) return;
    const id = setInterval(() => {
      setStatusIdx((prev) =>
        prev < CREATION_STATUSES.length - 1 ? prev + 1 : prev,
      );
    }, 850);
    return () => clearInterval(id);
  }, [error, emptyResult, hasResult]);

  const pinPoints = [
    { cx: 145, cy: 195, label: "Padang" },
    { cx: 290, cy: 255, label: "Jakarta" },
    { cx: 345, cy: 266, label: "Yogyakarta" },
    { cx: 495, cy: 175, label: "Makassar" },
    { cx: 685, cy: 215, label: "Papua" },
  ];

  const routePins = [
    { cx: 325, cy: 258, num: 1 },
    { cx: 345, cy: 266, num: 2 },
    { cx: 368, cy: 262, num: 3 },
  ];

  return (
    <div className="relative w-full max-w-4xl mx-auto text-center space-y-6 py-4">
      <motion.div
        className="relative overflow-hidden rounded-3xl border border-white/15 bg-[#0A2F37]/85 p-5 sm:p-8 shadow-2xl"
        animate={
          reduced
            ? {}
            : { scale: hasResult ? 1.03 : 1 }
        }
        transition={{ duration: reduced ? 0 : 1.1, ease: EASE }}
      >
        <motion.svg
          viewBox="0 0 820 320"
          fill="none"
          className="w-full h-auto max-h-[300px] mx-auto"
          aria-hidden="true"
          animate={
            reduced
              ? {}
              : hasResult
              ? { scale: 1.12, x: 18, y: -14 }
              : { scale: 1, x: 0, y: 0 }
          }
          transition={{ duration: reduced ? 0 : 1.2, ease: EASE }}
          style={{ transformOrigin: "345px 262px" }}
        >
          {/* Daratan kepulauan teal */}
          <path
            d="M65 80 L118 128 L168 190 L202 248 L184 260 L132 204 L85 144 L50 96 Z"
            fill="#147282"
            fillOpacity="0.65"
          />
          <path
            d="M212 252 L310 258 L398 268 L418 278 L335 278 L235 268 Z"
            fill="#147282"
            fillOpacity="0.8"
          />
          <path
            d="M290 120 L370 106 L412 152 L388 208 L324 212 L286 172 Z"
            fill="#147282"
            fillOpacity="0.65"
          />
          <path
            d="M460 126 L522 115 L505 156 L532 190 L496 218 L470 185 L452 156 Z"
            fill="#147282"
            fillOpacity="0.65"
          />
          <path
            d="M615 146 L702 160 L778 202 L765 246 L688 232 L624 196 Z"
            fill="#147282"
            fillOpacity="0.65"
          />

          {/* Rute putus-putus oranye bergaya landing page */}
          <motion.path
            d="M145 195 Q230 155 345 266 T495 175 T685 215"
            stroke="#F4A261"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="6 6"
            initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: reduced ? 0 : 2.1, ease: EASE }}
          />

          {/* Label kota cream + pin */}
          {pinPoints.map((pt, idx) => (
            <motion.g
              key={pt.label}
              initial={reduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={
                reduced
                  ? { duration: 0 }
                  : {
                      delay: idx * 0.35,
                      type: "spring",
                      stiffness: 340,
                      damping: 16,
                    }
              }
              style={{ transformOrigin: `${pt.cx}px ${pt.cy}px` }}
            >
              <circle cx={pt.cx} cy={pt.cy} r="9" fill="#2EC4B6" fillOpacity="0.22" />
              <circle cx={pt.cx} cy={pt.cy} r="4.5" fill="#F4A261" />
              <text
                x={pt.cx}
                y={pt.cy - 12}
                textAnchor="middle"
                fill="#FBF5E9"
                fontSize="11"
                fontWeight="700"
              >
                {pt.label}
              </text>
            </motion.g>
          ))}

          {/* Setelah data datang: rute lokal & pin bernomor */}
          {hasResult && (
            <>
              <motion.path
                d="M325 258 Q335 263 345 266 T368 262"
                stroke="#2EC4B6"
                strokeWidth="3.5"
                strokeLinecap="round"
                initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: reduced ? 0 : 0.7, ease: EASE }}
              />
              {routePins.map((rp) => (
                <g key={rp.num}>
                  <circle cx={rp.cx} cy={rp.cy} r="8" fill="#F4A261" />
                  <text
                    x={rp.cx}
                    y={rp.cy + 3.5}
                    textAnchor="middle"
                    fill="#0B3B45"
                    fontSize="9.5"
                    fontWeight="800"
                  >
                    {rp.num}
                  </text>
                </g>
              ))}
            </>
          )}
        </motion.svg>
      </motion.div>

      <div className="space-y-3">
        <h2
          ref={headingRef}
          tabIndex={-1}
          style={{ outline: "none" }}
          className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#FBF5E9] outline-none"
        >
          {error
            ? "Layanan perencana belum bisa dihubungi"
            : emptyResult
            ? "Belum ada tempat yang cocok"
            : hasResult
            ? "Rute siap"
            : CREATION_STATUSES[statusIdx]}
        </h2>

        {error && (
          <div className="pt-1">
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm bg-[#F4A261] text-[#0B3B45] min-h-[48px] focus:outline-none focus:ring-2 focus:ring-[#2EC4B6]"
            >
              <RotateCcw size={15} />
              <span>Coba lagi</span>
            </button>
          </div>
        )}

        {emptyResult && (
          <div className="space-y-3">
            <p className="text-sm sm:text-base text-[#FBF5E9]/80 max-w-md mx-auto">
              Belum ditemukan tempat yang sesuai. Coba sesuaikan durasi atau anggaran.
            </p>
            <button
              type="button"
              onClick={onStartOver}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm bg-[#F4A261] text-[#0B3B45] min-h-[48px] focus:outline-none focus:ring-2 focus:ring-[#2EC4B6]"
            >
              <span>Mulai lagi</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function buildResultSummary(trip) {
  if (!trip) return "";
  const daysCount = trip.days?.length || trip.request?.days || 1;
  const destName =
    trip.request?.destinationName || (trip.request?.destinationId === "yogyakarta"
      ? "Yogyakarta"
      : formatRegionName(trip.request?.destinationId || ""));
  const stopsCount = (trip.days || []).reduce(
    (sum, d) => sum + (d.stops?.length || 0),
    0,
  );
  const km = Math.round((trip.totals?.distanceMeters || 0) / 1000);
  const umkmCount = (trip.places || []).filter(
    (p) => p.isLocalBusiness === true,
  ).length;
  const parts = [`${stopsCount} tempat`];
  if (km > 0) parts.push(`sekitar ${km} km`);
  if (umkmCount > 0) parts.push(`dengan ${umkmCount} usaha lokal`);
  return `Perjalanan ${daysCount} hari${destName ? ` di ${destName}` : ""}: ${parts.join(", ")}.`;
}

export default function CreateItineraryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const incomingBrief = location.state?.promptText?.trim() ||
    (location.state?.destination ? `ke ${location.state.destination}` : "");

  const savedSession = useMemo(() => {
    if (incomingBrief) return null;
    try {
      const raw = sessionStorage.getItem(SESSION_DRAFT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [incomingBrief]);

  // Phase: -1 = analisis dashboard, 0 = tujuan, 1 = data kurang, 2 = review/hasil.
  const [phase, setPhase] = useState(
    incomingBrief ? -1 : location.state?.resumePhase === 2 || savedSession?.viewMode === "result"
      ? 2
      : 0,
  );
  const [viewMode, setViewMode] = useState(
    location.state?.resumePhase === 2
      ? "prompt"
      : savedSession?.viewMode === "result" && savedSession?.resultTrip
      ? "result"
      : "prompt",
  );
  const [tasteStep, setTasteStep] = useState(0);
  const [companionId, setCompanionId] = useState(savedSession?.companionId || "");
  const [daysProvided, setDaysProvided] = useState(Boolean(savedSession?.daysProvided));
  const [budgetTierId, setBudgetTierId] = useState(savedSession?.budgetTierId || "");
  const [form, setForm] = useState(() => savedSession?.form || {
    ...initialForm(), date: suggestedTripDate(), destinationId: "", destinationName: "", interests: [], basis: "group",
  });
  const [text, setText] = useState(
    incomingBrief ||
      savedSession?.text || "",
  );
  const [places, setPlaces] = useState([]);
  const [catalogReady, setCatalogReady] = useState(false);
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [emptyResult, setEmptyResult] = useState(false);
  const [resultTrip, setResultTrip] = useState(savedSession?.resultTrip || null);
  const [savedResult, setSavedResult] = useState(Boolean(savedSession?.savedResult));
  const [typedSummary, setTypedSummary] = useState("");
  const [unsupported, setUnsupported] = useState(false);
  const [destinationName, setDestinationName] = useState(location.state?.destination || savedSession?.form?.destinationName || "");
  const [destinationResolved, setDestinationResolved] = useState(Boolean(savedSession?.form?.destinationId && savedSession?.form?.destinationName));
  const [lookupBusy, setLookupBusy] = useState(false);
  const [hotelQuery, setHotelQuery] = useState("");
  const [hotelResults, setHotelResults] = useState([]);
  const [hotelSearching, setHotelSearching] = useState(false);
  const [hotelSearchError, setHotelSearchError] = useState("");

  // Chat-style clarification bubble state when required fields are missing after prompt parse
  const [clarify, setClarify] = useState(null);

  const textareaRef = useRef(null);
  const headingRef = useRef(null);
  const resultHeadingRef = useRef(null);
  const incomingHandledRef = useRef(false);

  const catalogRegions = useMemo(() => {
    const ids = Array.from(
      new Set(places.map((p) => p.destinationId).filter(Boolean)),
    );
    return ids.length ? ids : ["yogyakarta"];
  }, [places]);

  const lodgingPlaces = useMemo(
    () =>
      places.filter(
        (p) =>
          p.kind === "lodging" &&
          p.coordinates &&
          (!p.destinationId || p.destinationId === (form.destinationId || "yogyakarta")),
      ),
    [places, form.destinationId],
  );
  const selectedHotel = lodgingPlaces.find((p) => p.id === form.lodging);
  const matchingHotels = lodgingPlaces.filter((p) =>
    p.name.toLowerCase().includes(hotelQuery.trim().toLowerCase()) || p.id === form.lodging,
  );
  const suggestedHotels = matchingHotels.length || hotelResults.length
    ? [] : lodgingPlaces.slice(0, 12);

  useEffect(() => {
    const query = hotelQuery.trim();
    if (!clarify || Number(form.days) <= 1 || !destinationResolved ||
        query.length < 3 || selectedHotel?.name === query) {
      setHotelSearching(false);
      setHotelResults([]);
      setHotelSearchError("");
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setHotelSearching(true);
      setHotelSearchError("");
      api(`/destinations/${encodeURIComponent(form.destinationId || "yogyakarta")}/lodgings?q=${encodeURIComponent(query)}`,
        undefined, controller.signal)
        .then((result) => {
          if (!controller.signal.aborted) setHotelResults(result.places || []);
        })
        .catch((err) => {
          if (!controller.signal.aborted) setHotelSearchError(err.message);
        })
        .finally(() => {
          if (!controller.signal.aborted) setHotelSearching(false);
        });
    }, 450);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [hotelQuery, form.days, form.destinationId, destinationResolved, clarify, selectedHotel?.name]);

  // Persist active result in sessionStorage so navigating away and returning keeps it
  useEffect(() => {
    try {
      if (phase === 2 && viewMode === "result" && resultTrip) {
        sessionStorage.setItem(
          SESSION_DRAFT_KEY,
          JSON.stringify({
            viewMode: "result",
            resultTrip,
            savedResult,
            text,
            form,
            companionId,
            daysProvided,
            budgetTierId,
          }),
        );
      }
    } catch {
      // Ignore sessionStorage quota issues
    }
  }, [phase, viewMode, resultTrip, savedResult, text, form, companionId, daysProvided, budgetTierId]);

  // Focus heading cleanly on phase/viewMode change
  useEffect(() => {
    const t = setTimeout(() => {
      if (phase === 2 && viewMode === "result") {
        resultHeadingRef.current?.focus({ preventScroll: true });
      } else {
        headingRef.current?.focus({ preventScroll: true });
      }
    }, 60);
    return () => clearTimeout(t);
  }, [phase, viewMode]);

  // Type summary sentence when result opens
  const summarySentence = useMemo(() => buildResultSummary(resultTrip), [resultTrip]);
  useEffect(() => {
    if (viewMode !== "result" || !summarySentence) {
      setTypedSummary("");
      return;
    }
    if (reduced) {
      setTypedSummary(summarySentence);
      return;
    }
    setTypedSummary("");
    let idx = 0;
    const id = setInterval(() => {
      idx += 1;
      setTypedSummary(summarySentence.slice(0, idx));
      if (idx >= summarySentence.length) clearInterval(id);
    }, 25);
    return () => clearInterval(id);
  }, [viewMode, summarySentence, reduced]);

  // Auto-resize textarea height cleanly
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(96, Math.min(el.scrollHeight, 240))}px`;
  }, [text, phase, viewMode]);

  // Load places catalog
  useEffect(() => {
    const controller = new AbortController();
    setCatalogReady(false);
    setError("");
    listPlaces(controller.signal)
      .then((d) => {
        if (controller.signal.aborted) return;
        setPlaces(d.places);
        setCatalogReady(d.places.length > 0);
        if (!d.places.length) {
          setError("Layanan perencana sedang tidak bisa dihubungi. Coba lagi sebentar.");
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError("Layanan perencana sedang tidak bisa dihubungi. Coba lagi sebentar.");
        }
      });
    return () => controller.abort();
  }, [retry]);

  const toggleTaste = (id) => {
    setForm((f) => {
      const exists = f.interests.includes(id);
      return {
        ...f,
        interests: exists
          ? f.interests.filter((x) => x !== id)
          : [...f.interests, id],
      };
    });
  };

  function withDestination(draft, result) {
    return { ...draft, destinationId: result.destinationId, destinationName: result.name, lodging: "",
      lat: result.center.lat, lng: result.center.lng,
      endLat: result.center.lat, endLng: result.center.lng };
  }

  function showNextMissing(draft, who, hasDays) {
    const missingStep = !draft.interests.length ? 0 : !who ? 1 : !(Number(draft.budget) > 0) ? 2 : -1;
    if (missingStep >= 0) {
      setTasteStep(missingStep);
      setPhase(1);
      return;
    }
    const departureReady = Date.parse(`${draft.date}T${draft.start}:00+07:00`) > Date.now() + 30 * 60000;
    setClarify({ needDestination: false, needDays: !hasDays, needBudget: false,
      needLodging: Number(draft.days) > 1 && !draft.lodging });
    setPhase(2);
    if (hasDays && Number(draft.days) === 1 && departureReady) executePlan(draft);
  }

  async function lookupDestination(query, draft) {
    const result = await api(`/destinations/lookup?q=${encodeURIComponent(query.trim())}`);
    if (!result.places?.length) throw new Error("Belum ada tempat untuk daerah ini.");
    const nextForm = withDestination(draft, result);
    setPlaces(result.places);
    setCatalogReady(true);
    setDestinationName(result.name);
    setHotelQuery("");
    setHotelResults([]);
    setForm(nextForm);
    setUnsupported(false);
    setDestinationResolved(true);
    return nextForm;
  }

  async function resolveDestination() {
    if (lookupBusy || !destinationName.trim()) return null;
    setLookupBusy(true);
    setError("");
    try {
      const nextForm = await lookupDestination(destinationName, form);
      if (phase === 0) showNextMissing(nextForm, companionId, daysProvided);
      return nextForm;
    } catch (err) {
      setDestinationResolved(false);
      setError(err.message || "Daerah belum dapat dimuat.");
      return null;
    } finally {
      setLookupBusy(false);
    }
  }

  const performReset = () => {
    setPhase(0);
    setTasteStep(0);
    setViewMode("prompt");
    setClarify(null);
    setDestinationName("");
    setDestinationResolved(false);
    setForm({ ...initialForm(), date: suggestedTripDate(), destinationId: "", destinationName: "", interests: [] });
    setText("");
    setCompanionId("");
    setDaysProvided(false);
    setBudgetTierId("");
    setResultTrip(null);
    setSavedResult(false);
    setEmptyResult(false);
    setError("");
    try {
      sessionStorage.removeItem(SESSION_DRAFT_KEY);
    } catch {
      // Ignore
    }
    navigate("/");
  };

  const handleSaveResult = () => {
    if (!resultTrip) return;
    try {
      saveTrip(resultTrip);
      setSavedResult(true);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  async function executePlan(nextForm) {
    setBusy(true);
    setError("");
    setEmptyResult(false);
    setResultTrip(null);
    setSavedResult(false);
    setViewMode("composing");
    try {
      const minDelay = new Promise((resolve) =>
        setTimeout(resolve, reduced ? 0 : 2500),
      );
      const request = toRequest(nextForm);
      const recent = recommendationHistory(request.destinationId)
        .filter((id) => !request.mustVisitPlaceIds.includes(id));
      const [first] = await Promise.all([
        api("/itineraries/plan", { request: { ...request, excludedPlaceIds: recent } }),
        minDelay,
      ]);
      const countStops = (answer) => (answer.itinerary?.days || []).reduce(
        (sum, d) => sum + (d.stops?.length || 0),
        0,
      );
      let result = first;
      let resetHistory = false;
      if (recent.length && countStops(first) < Math.min(2, Number(nextForm.days))) {
        result = await api("/itineraries/plan", { request });
        resetHistory = true;
      }
      const stopsCount = countStops(result);
      if (!result.itinerary || stopsCount === 0) {
        setEmptyResult(true);
        return;
      }
      rememberRecommendations(request.destinationId,
        result.itinerary.days.flatMap((day) => day.stops.map((stop) => stop.placeId)),
        resetHistory);
      setResultTrip(result.itinerary);
      if (reduced) {
        setViewMode("result");
      } else {
        setTimeout(() => setViewMode("result"), 700);
      }
    } catch (err) {
      setError(err.message || "Layanan perencana belum bisa dihubungi");
    } finally {
      setBusy(false);
    }
  }

  async function intakePrompt(brief) {
    setBusy(true);
    setError("");
    try {
      const parsed = await api("/requests/parse", { text: brief });
      const d = parsed.draft;
      const query = d.destinationName || extractDestinationFromQuery(brief)?.name || "";
      const hasDays = Boolean(d.days);
      const who = d.companionId || "";
      const draft = {
        ...initialForm(), date: d.startDate || suggestedTripDate(),
        destinationId: "", destinationName: "", lodging: "",
        days: d.days || 1, adults: d.adults || 2,
        budget: d.budgetAmountIdr || "", basis: d.budgetBasis || "group",
        interests: d.interests || [], periodPreferences: d.periodPreferences || [],
        objective: d.objective || "balanced",
      };
      setText(brief);
      setForm(draft);
      setCompanionId(who);
      setDaysProvided(hasDays);
      setDestinationName(query);
      setDestinationResolved(false);
      if (!query) {
        setPhase(0);
        setBusy(false);
        return;
      }
      const nextForm = await lookupDestination(query, draft);
      setBusy(false);
      showNextMissing(nextForm, who, hasDays);
    } catch (err) {
      setPhase(0);
      setDestinationResolved(false);
      setError(err.message || "Rencana belum dapat dianalisis. Coba lagi.");
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!incomingBrief || incomingHandledRef.current) return;
    incomingHandledRef.current = true;
    intakePrompt(incomingBrief);
    // Run once for the brief passed from the dashboard.
  }, [incomingBrief]);

  async function submitPrompt() {
    if (busy || !text.trim()) return;
    if ((!catalogReady || !places.length) && /\b(yogyakarta|jogja|yogya)\b/i.test(text)) {
      setError("Layanan perencana belum bisa dihubungi");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const parsed = await api("/requests/parse", { text });
      const d = parsed.draft;
      const mentionedDestination = d.destinationName || extractDestinationFromQuery(text)?.name;
      if (!destinationResolved && mentionedDestination) {
        setDestinationName(mentionedDestination);
        setDestinationResolved(false);
      }
      const merged = {
        ...form,
        destinationId: destinationResolved ? form.destinationId : d.destinationId || form.destinationId,
        days: d.days ?? form.days,
        adults: d.adults ?? form.adults,
        objective: d.objective || form.objective,
        budget: d.budgetAmountIdr ?? form.budget ?? "",
        basis: d.budgetBasis ?? form.basis,
        date: d.startDate ?? form.date,
        interests: Array.from(
          new Set([...(form.interests || []), ...(d.interests || [])]),
        ),
        periodPreferences: d.periodPreferences || form.periodPreferences,
      };
      setForm(merged);
      if (d.companionId) setCompanionId(d.companionId);
      if (d.days) setDaysProvided(true);

      const needDestination = !destinationResolved;
      const needDays = !(d.days || daysProvided);
      const needBudget = !merged.budget || Number(merged.budget) <= 0;
      const needLodging = Number(merged.days || 1) > 1 && !merged.lodging;

      setUnsupported(needDestination);

      setClarify({ needDestination, needDays, needBudget, needLodging });
      setBusy(false);
    } catch (err) {
      setError(err.message || "Layanan perencana belum bisa dihubungi");
      setBusy(false);
    }
  }

  const departureIsFuture = Number.isFinite(Date.parse(`${form.date}T${form.start}:00+07:00`)) &&
    Date.parse(`${form.date}T${form.start}:00+07:00`) > Date.now() + 30 * 60000;
  const clarifyReady =
    !unsupported && destinationResolved &&
    departureIsFuture &&
    daysProvided && form.interests.length > 0 && Boolean(companionId) &&
    Number(form.days) >= 1 &&
    Number(form.budget) > 0 &&
    (Number(form.days) <= 1 || Boolean(form.lodging)) &&
    catalogRegions.includes(form.destinationId || "yogyakarta");

  const activeCompanion = COMPANION_OPTIONS.find((c) => c.id === companionId);
  const activeBudgetTier = BUDGET_TIERS.find((b) => b.id === budgetTierId);
  const tasteTitles = [
    `Tempat seperti apa yang mau kamu kunjungi di ${destinationName}?`,
    "Liburan ini bersama siapa?",
    "Berapa biaya yang ingin kamu keluarkan untuk liburan ini?",
  ];
  const currentTitle = tasteTitles[tasteStep] || tasteTitles[0];
  const currentTitleWords = currentTitle.split(" ");
  const totalResultStops = useMemo(
    () => (resultTrip?.days || []).reduce((sum, d) => sum + (d.stops?.length || 0), 0),
    [resultTrip],
  );
  const progressScale =
    phase === 0
      ? 0.12
      : phase === 1
      ? (tasteStep + 2) * 0.17
      : viewMode === "prompt"
      ? 0.72
      : viewMode === "composing"
      ? 0.88
      : 1;

  return (
    <div className="relative min-h-[100dvh] flex flex-col justify-between text-[#FBF5E9] overflow-x-hidden">
      {/* Live region untuk pembaca layar */}
      <p className="sr-only" aria-live="polite">
        {phase === 1
          ? currentTitle
          : viewMode === "composing"
          ? "Menyusun rute"
          : viewMode === "result"
          ? `Hasil siap: ${totalResultStops} tempat`
          : "Fase tulis permintaan perjalanan"}
      </p>

      {/* Latar sesuai fase & pertanyaan */}
      {phase === 1 ? (
        tasteStep === 0 ? (
          <MistyMountainScene reduced={reduced} />
        ) : tasteStep === 1 ? (
          <TravelerPathScene count={activeCompanion?.count || 2} reduced={reduced} />
        ) : (
          <CoinStackScene stacks={activeBudgetTier?.stacks || 2} reduced={reduced} />
        )
      ) : (
        <ArchipelagoBackdrop reduced={reduced} />
      )}

      {/* Indikator progres tipis di tepi atas */}
      <div className="relative z-20 w-full">
        <div className="h-1 w-full bg-white/10">
          <motion.div
            className="h-full bg-[#2EC4B6] origin-left"
            initial={false}
            animate={{ scaleX: progressScale }}
            transition={{ duration: reduced ? 0 : 0.45, ease: EASE }}
          />
        </div>
        <div className="grid grid-cols-3 items-center px-5 sm:px-8 pt-4">
          <div />
          <div className="flex items-center justify-center gap-2.5">
            {[0, 1, 2, 3, 4].map((dot) => {
              const currentIdx = phase === 0 ? 0 : phase === 1 ? tasteStep + 1 : 4;
              const active = currentIdx === dot;
              const done = currentIdx > dot;
              const clickable = dot < 4 && dot < currentIdx && !busy;
              return (
                <button
                  key={dot}
                  type="button"
                  disabled={!clickable}
                  onClick={() => {
                    if (!clickable) return;
                    if (dot === 0) setPhase(0);
                    else { setPhase(1); setTasteStep(dot - 1); }
                  }}
                  aria-label={`Tahap ${dot + 1}`}
                  className={`h-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-[#2EC4B6] ${
                    active
                      ? "w-7 bg-[#2EC4B6]"
                      : done
                      ? "w-2.5 bg-[#F4A261]"
                      : "w-2.5 bg-white/25"
                  } ${clickable ? "cursor-pointer" : "cursor-default"}`}
                />
              );
            })}
          </div>
          <div className="flex justify-end">
            {phase === 2 && viewMode === "result" && (
              <button
                type="button"
                disabled={savedResult}
                onClick={handleSaveResult}
                className="sticky top-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-bold min-h-[40px] transition-colors focus:outline-none focus:ring-2 focus:ring-[#2EC4B6] disabled:opacity-90 disabled:cursor-default"
                style={{
                  background: savedResult ? "#2EC4B6" : "#F4A261",
                  color: "#0B3B45",
                }}
              >
                {savedResult ? <Check size={14} /> : <Bookmark size={14} />}
                <span>{savedResult ? "Tersimpan" : "Simpan"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Konten Utama */}
      <AnimatePresence mode="popLayout" initial={false}>
        {phase === -1 && (
          <main className="relative z-10 flex-1 flex items-center justify-center px-5 py-12" role="status">
            <div className="w-full max-w-xl rounded-3xl bg-[#0B4F5C]/90 border border-[#2EC4B6]/45 p-8 text-center space-y-3">
              <h1 className="text-2xl font-extrabold">Membaca rencana perjalananmu</h1>
              <p className="text-sm text-[#FBF5E9]/85">Tripin memeriksa tujuan, durasi, kategori, teman perjalanan, dan budget.</p>
            </div>
          </main>
        )}
        {phase === 0 && (
          <motion.main key="destination-first"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -16 }}
            className="relative z-10 flex-1 flex items-center justify-center px-5 py-12">
            <div className="w-full max-w-xl rounded-3xl bg-[#0B4F5C]/90 border border-[#2EC4B6]/45 p-6 sm:p-8 space-y-5 shadow-xl">
              <p className="text-sm font-semibold text-[#2EC4B6]">Mulai dari tujuan perjalananmu</p>
              <h1 ref={headingRef} tabIndex={-1} className="text-3xl sm:text-4xl font-extrabold leading-tight">Mau liburan ke mana?</h1>
              <label htmlFor="first-destination" className="block text-sm font-bold">Kota atau daerah tujuan di Indonesia</label>
              <input id="first-destination" type="search" value={destinationName}
                onChange={(e) => { setDestinationName(e.target.value); setDestinationResolved(false); setError(""); }}
                onKeyDown={async (e) => { if (e.key === "Enter" && destinationName.trim()) { e.preventDefault(); await resolveDestination(); } }}
                placeholder="Contoh: Surabaya" autoComplete="address-level2"
                className="w-full rounded-xl bg-[#FBF5E9] text-[#0A1A1C] px-4 py-3 text-base" />
              <button type="button" disabled={lookupBusy || destinationName.trim().length < 2}
                onClick={resolveDestination}
                className="w-full rounded-xl bg-[#F4A261] text-[#0B3B45] px-5 py-3 font-bold disabled:opacity-50">
                {lookupBusy ? "Mencari tempat..." : "Lanjut pilih kategori"}
              </button>
              {error && <p role="alert" className="text-sm text-[#FBF5E9]">{error}</p>}
              <p className="text-xs text-[#FBF5E9]/75">Setelah tujuan dipilih, Tripin menyesuaikan tempat wisata dan hotel di area itu.</p>
            </div>
          </motion.main>
        )}
        {phase === 1 && (
          <motion.main
            key={`phase-1-step-${tasteStep}`}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -16 }}
            transition={{ duration: reduced ? 0 : 0.38, ease: EASE }}
            className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-6"
          >
            <div className="max-w-4xl w-full text-center space-y-6">
              <div className="space-y-3">
                <p className="text-sm sm:text-base font-semibold tracking-wide text-[#2EC4B6]">
                  {tasteStep === 0
                    ? `Pilih kategori untuk ${destinationName}.`
                    : tasteStep === 1
                    ? "Biar rutenya pas dengan rombonganmu."
                    : "Tetapkan batas biaya untuk perjalanan ini."}
                </p>
                <h1
                  ref={headingRef}
                  tabIndex={-1}
                  style={{ outline: "none" }}
                  className="text-4xl sm:text-5xl lg:text-[50px] font-extrabold leading-[1.12] tracking-tight text-[#FBF5E9] outline-none"
                >
                  {currentTitleWords.map((word, idx) => (
                    <motion.span
                      key={`${tasteStep}-${word}-${idx}`}
                      className="inline-block mr-[0.26em]"
                      initial={reduced ? { opacity: 1 } : { opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: reduced ? 0 : idx * 0.04,
                        duration: reduced ? 0 : 0.3,
                        ease: EASE,
                      }}
                    >
                      {word}
                    </motion.span>
                  ))}
                </h1>
              </div>

              {tasteStep === 0 && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                  {TASTE_OPTIONS.map((opt) => {
                    const active = form.interests.includes(opt.id);
                    return (
                      <motion.button
                        key={opt.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleTaste(opt.id)}
                        whileHover={reduced ? {} : { y: -3 }}
                        whileTap={reduced ? {} : { scale: 0.97 }}
                        animate={reduced ? {} : { scale: active ? 1.02 : 1 }}
                        transition={{ type: "spring", stiffness: 360, damping: 24 }}
                        className={`group relative rounded-3xl p-5 text-center border-2 transition-colors min-h-[48px] focus:outline-none focus:ring-2 focus:ring-[#2EC4B6] ${
                          active
                            ? "bg-[#0B4F5C]/90 border-[#2EC4B6] shadow-[0_0_28px_rgba(46,196,182,0.25)]"
                            : "bg-[#0A1A1C]/55 border-white/15 hover:border-white/35"
                        }`}
                      >
                        <TasteIllustration id={opt.id} active={active} reduced={reduced} />
                        <div className="mt-3 space-y-1">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-xl font-extrabold text-[#FBF5E9]">
                              {opt.label}
                            </span>
                            {active && (
                              <span className="w-5 h-5 rounded-full bg-[#2EC4B6] text-[#0A1A1C] inline-flex items-center justify-center">
                                <Check size={13} strokeWidth={3} />
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-[#FBF5E9]/75">{opt.subtitle}</p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {tasteStep === 1 && (
                <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
                  {COMPANION_OPTIONS.map((opt) => {
                    const active = companionId === opt.id;
                    return (
                      <motion.button
                        key={opt.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => {
                          setCompanionId(opt.id);
                          setForm((f) => ({ ...f, adults: opt.adults }));
                        }}
                        whileHover={reduced ? {} : { y: -3 }}
                        whileTap={reduced ? {} : { scale: 0.97 }}
                        animate={reduced ? {} : { scale: active ? 1.02 : 1 }}
                        transition={{ type: "spring", stiffness: 360, damping: 24 }}
                        className={`w-full sm:w-[250px] rounded-3xl p-5 text-center border-2 transition-colors min-h-[48px] focus:outline-none focus:ring-2 focus:ring-[#2EC4B6] space-y-1.5 ${
                          active
                            ? "bg-[#0B4F5C]/90 border-[#2EC4B6] shadow-[0_0_28px_rgba(46,196,182,0.25)]"
                            : "bg-[#0A1A1C]/55 border-white/15 hover:border-white/35"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xl font-extrabold text-[#FBF5E9]">
                            {opt.label}
                          </span>
                          {active && (
                            <span className="w-5 h-5 rounded-full bg-[#2EC4B6] text-[#0A1A1C] inline-flex items-center justify-center">
                              <Check size={13} strokeWidth={3} />
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[#FBF5E9]/75">{opt.subtitle}</p>
                        <p className="text-xs font-semibold text-[#2EC4B6]">
                          {opt.adults} orang
                        </p>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {tasteStep === 2 && (
                <div className="max-w-xl mx-auto rounded-3xl bg-[#0B4F5C]/90 border border-[#2EC4B6]/45 p-5 sm:p-7 space-y-4 text-left">
                  <label htmlFor="wizard-budget" className="block text-sm font-bold">Biaya yang ingin dikeluarkan (Rp)</label>
                  <input id="wizard-budget" type="number" min="1" inputMode="numeric"
                    value={form.budget} onChange={(e) => { setBudgetTierId(""); setForm((f) => ({ ...f, budget: e.target.value })); }}
                    placeholder="Contoh: 800000"
                    className="w-full rounded-xl bg-[#FBF5E9] text-[#0A1A1C] px-4 py-3 text-lg font-bold" />
                  <div className="flex flex-wrap gap-2" aria-label="Basis biaya">
                    {[{ id: "person", label: "Per orang" }, { id: "group", label: "Total rombongan" }].map((option) => (
                      <button key={option.id} type="button" aria-pressed={form.basis === option.id}
                        onClick={() => setForm((f) => ({ ...f, basis: option.id }))}
                        className={`rounded-full px-4 py-2 text-sm font-bold ${form.basis === option.id ? "bg-[#F4A261] text-[#0B3B45]" : "bg-white/10 text-[#FBF5E9]"}`}>
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {Number(form.budget) > 0 && <p className="text-sm text-[#FBF5E9]/85">Batas biaya: {rupiah(Number(form.budget))} {form.basis === "person" ? `per orang · total ${rupiah(Number(form.budget) * Number(form.adults))}` : "untuk rombongan"}</p>}
                </div>
              )}

            </div>
          </motion.main>
        )}

        {phase === 2 && (
          <motion.main
            key={`phase-2-${viewMode}`}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -14 }}
            transition={{ duration: reduced ? 0 : 0.45, ease: EASE }}
            className={`relative z-10 flex-1 flex flex-col items-center px-4 sm:px-6 ${
              viewMode === "prompt"
                ? "justify-end pt-6 pb-2"
                : viewMode === "composing"
                ? "justify-center py-6"
                : "justify-start py-6 pb-20"
            }`}
          >
            {viewMode === "composing" && (
              <div className="w-full max-w-4xl mx-auto space-y-5">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {text.trim() && (
                    <span
                      title={text}
                      className="inline-flex items-center max-w-[280px] sm:max-w-md truncate px-3.5 py-1.5 rounded-full bg-[#0A2F37]/90 border border-[#F4A261]/45 text-xs sm:text-sm font-semibold text-[#FBF5E9]"
                    >
                      “{text.trim()}”
                    </span>
                  )}
                  {form.interests.map((id) => {
                    const label =
                      TASTE_OPTIONS.find((t) => t.id === id)?.label || id;
                    return (
                      <span
                        key={id}
                        className="px-3 py-1.5 rounded-full bg-[#0B4F5C] border border-[#2EC4B6]/40 text-xs font-bold text-[#FBF5E9]"
                      >
                        {label}
                      </span>
                    );
                  })}
                </div>

                <ComposingCanvas
                  reduced={reduced}
                  error={error}
                  emptyResult={emptyResult}
                  hasResult={Boolean(resultTrip)}
                  onRetry={() => executePlan(form)}
                  onStartOver={performReset}
                  headingRef={headingRef}
                />
              </div>
            )}

            {viewMode === "result" && resultTrip && (
              <div className="w-full max-w-6xl mx-auto space-y-6">
                {/* Konteks prompt + profil selera + kalimat ringkasan diketik */}
                <div className="space-y-3 text-center max-w-3xl mx-auto">
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {text.trim() && (
                      <span
                        title={text}
                        className="inline-flex items-center max-w-[280px] sm:max-w-md truncate px-3.5 py-1.5 rounded-full bg-[#0A2F37]/90 border border-[#F4A261]/45 text-xs sm:text-sm font-semibold text-[#FBF5E9]"
                      >
                        “{text.trim()}”
                      </span>
                    )}
                    {form.interests.map((id) => {
                      const label =
                        TASTE_OPTIONS.find((t) => t.id === id)?.label || id;
                      return (
                        <span
                          key={id}
                          className="px-3 py-1.5 rounded-full bg-[#0B4F5C] border border-[#2EC4B6]/40 text-xs font-bold text-[#FBF5E9]"
                        >
                          {label}
                        </span>
                      );
                    })}
                  </div>

                  <h1
                    ref={resultHeadingRef}
                    tabIndex={-1}
                    style={{ outline: "none" }}
                    className="text-xl sm:text-2xl font-extrabold text-[#FBF5E9] leading-relaxed outline-none min-h-[2rem]"
                  >
                    {typedSummary || summarySentence}
                  </h1>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="rounded-2xl bg-[#0B4F5C]/90 border border-[#F4A261]/50 px-4 py-3 text-sm text-[#FBF5E9]"
                  >
                    {error}
                  </div>
                )}

                <TripView
                  trip={resultTrip}
                  onSave={handleSaveResult}
                  savedSuccess={savedResult}
                />

                <div className="sticky bottom-3 sm:static z-20 flex flex-wrap gap-3 justify-center pt-2">
                  <button type="button" onClick={() => executePlan(form)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm bg-[#F4A261] text-[#0B3B45] shadow-lg min-h-[48px] focus:outline-none focus:ring-2 focus:ring-[#2EC4B6]">
                    <RotateCcw size={15} /> Susun alternatif
                  </button>
                  <button
                    type="button"
                    onClick={performReset}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm bg-[#0A2F37]/95 border border-white/25 text-[#FBF5E9] hover:border-[#2EC4B6] shadow-lg min-h-[48px] focus:outline-none focus:ring-2 focus:ring-[#2EC4B6]"
                  >
                    <RotateCcw size={15} />
                    <span>Mulai lagi</span>
                  </button>
                </div>
              </div>
            )}

            {viewMode === "prompt" && (
              <div className="w-full max-w-[760px] mx-auto flex flex-col gap-6 flex-1 justify-end">
              <h1
                ref={headingRef}
                tabIndex={-1}
                style={{ outline: "none" }}
                className="text-3xl sm:text-4xl font-extrabold tracking-tight text-center text-[#FBF5E9] outline-none"
              >
                Rancang perjalanan di {destinationName}
              </h1>

              {/* Deret chip profil selera */}
              {(form.interests.length > 0 || activeCompanion || activeBudgetTier) && (
                <div
                  className="flex flex-wrap items-center justify-center gap-2"
                  aria-label="Profil selera"
                >
                  {form.interests.map((id) => {
                    const label =
                      TASTE_OPTIONS.find((t) => t.id === id)?.label || id;
                    return (
                      <motion.span
                        key={id}
                        layout={!reduced}
                        initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-1.5 pl-3.5 pr-2 py-1.5 rounded-full bg-[#0B4F5C] border border-[#2EC4B6]/40 text-xs sm:text-sm font-bold text-[#FBF5E9]"
                      >
                        <span>{label}</span>
                        <button
                          type="button"
                          onClick={() => toggleTaste(id)}
                          aria-label={`Hapus ${label}`}
                          className="w-5 h-5 rounded-full hover:bg-white/15 inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#2EC4B6]"
                        >
                          <X size={12} />
                        </button>
                      </motion.span>
                    );
                  })}
                  {activeCompanion && (
                    <span className="inline-flex items-center gap-1.5 pl-3.5 pr-2 py-1.5 rounded-full bg-[#0B4F5C] border border-[#2EC4B6]/40 text-xs sm:text-sm font-bold text-[#FBF5E9]">
                      <span>{activeCompanion.label}</span>
                      <button
                        type="button"
                        onClick={() => setCompanionId("")}
                        aria-label={`Hapus ${activeCompanion.label}`}
                        className="w-5 h-5 rounded-full hover:bg-white/15 inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#2EC4B6]"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  )}
                  {activeBudgetTier && (
                    <span className="inline-flex items-center gap-1.5 pl-3.5 pr-2 py-1.5 rounded-full bg-[#0B4F5C] border border-[#2EC4B6]/40 text-xs sm:text-sm font-bold text-[#FBF5E9]">
                      <span>{activeBudgetTier.label}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setBudgetTierId("");
                        }}
                        aria-label={`Hapus ${activeBudgetTier.label}`}
                        className="w-5 h-5 rounded-full hover:bg-white/15 inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#2EC4B6]"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  )}
                </div>
              )}

              {/* Gelembung klarifikasi AI jika ada data penting yang belum terbaca */}
              <AnimatePresence>
                {clarify && (
                  <motion.div
                    initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-3xl bg-[#0B4F5C]/95 border border-[#2EC4B6]/45 p-5 space-y-4 shadow-xl"
                  >
                    <div className="space-y-2">
                      <label htmlFor="trip-destination" className="text-sm font-bold text-[#FBF5E9] block">Mau ke daerah mana?</label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input id="trip-destination" type="text" value={destinationName}
                          onChange={(e) => { setDestinationName(e.target.value); setDestinationResolved(false); setUnsupported(true); }}
                          placeholder="Kota atau daerah di Indonesia"
                          className="w-full min-w-0 rounded-xl bg-[#FBF5E9] text-[#0A1A1C] px-3 py-2 text-sm" />
                        <button type="button" onClick={resolveDestination} disabled={lookupBusy || !destinationName.trim()}
                          className="shrink-0 rounded-xl bg-[#F4A261] text-[#0B3B45] px-4 py-2 text-sm font-bold disabled:opacity-50">
                          {lookupBusy ? "Mencari..." : "Cari daerah"}
                        </button>
                      </div>
                      {destinationResolved && <p className="text-xs text-[#FBF5E9]/85">{destinationName} · {places.filter((p) => p.kind !== "lodging").length} tempat ditemukan</p>}
                      {form.destinationId?.startsWith("osm-") && <p className="text-xs text-[#FBF5E9]/75">Data © kontributor OpenStreetMap (ODbL). Harga dan jam buka yang belum ada tetap tidak diketahui.</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="text-sm font-bold text-[#FBF5E9] flex flex-col gap-2">
                        Tanggal mulai perjalanan
                        <input type="date" min={jakartaDate()} value={form.date}
                          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                          className="rounded-xl bg-[#FBF5E9] text-[#0A1A1C] px-3 py-2" />
                      </label>
                      <label className="text-sm font-bold text-[#FBF5E9] flex flex-col gap-2">
                        Paling awal berangkat
                        <input type="time" value={form.start}
                          onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))}
                          className="rounded-xl bg-[#FBF5E9] text-[#0A1A1C] px-3 py-2" />
                      </label>
                    </div>
                    {!departureIsFuture && <p className="text-xs text-[#F4A261]">Pilih waktu berangkat setidaknya 30 menit dari sekarang.</p>}

                    {clarify.needDays && (
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-bold text-[#FBF5E9]">
                          Durasinya berapa hari?
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            aria-label="Kurangi durasi"
                            onClick={() => {
                              setDaysProvided(true);
                              setForm((f) => ({
                                ...f,
                                days: Math.max(1, Number(f.days || 1) - 1),
                              }));
                            }}
                            className="w-10 h-10 rounded-full bg-white/10 text-[#FBF5E9] flex items-center justify-center"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="font-extrabold text-base min-w-[4rem] text-center">
                            {form.days || 1} hari
                          </span>
                          <button
                            type="button"
                            aria-label="Tambah durasi"
                            onClick={() => {
                              setDaysProvided(true);
                              setForm((f) => ({
                                ...f,
                                days: Math.min(3, Number(f.days || 1) + 1),
                              }));
                            }}
                            className="w-10 h-10 rounded-full bg-white/10 text-[#FBF5E9] flex items-center justify-center"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                        <label htmlFor="trip-budget" className="text-sm font-bold text-[#FBF5E9] block">
                          Berapa biaya yang ingin dikeluarkan untuk liburan ini?
                        </label>
                        <p className="text-xs text-[#FBF5E9]/75">Nominal ini dipakai sebagai batas anggaran saat menyusun trip.</p>
                        <div className="flex flex-wrap items-center gap-2">
                          {[500000, 1000000, 2000000].map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => {
                                setBudgetTierId("");
                                setForm((f) => ({ ...f, budget: amt }));
                              }}
                              className={`px-3.5 py-2 rounded-full text-xs font-bold min-h-[40px] ${
                                Number(form.budget) === amt
                                  ? "bg-[#F4A261] text-[#0B3B45]"
                                  : "bg-white/10 text-[#FBF5E9] hover:bg-white/20"
                              }`}
                            >
                              {rupiah(amt)}
                            </button>
                          ))}
                          <input
                            id="trip-budget"
                            type="number"
                            min={1}
                            inputMode="numeric"
                            placeholder="Nominal (Rp)"
                            value={form.budget}
                            onChange={(e) => {
                              setBudgetTierId("");
                              setForm((f) => ({ ...f, budget: e.target.value }));
                            }}
                            className="px-3 py-2 rounded-xl bg-[#FBF5E9] text-[#0A1A1C] text-sm font-bold w-full sm:w-40 outline-none"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2" aria-label="Basis budget">
                          {[{ id: "person", label: "Per orang" }, { id: "group", label: "Total rombongan" }].map((option) => (
                            <button key={option.id} type="button" onClick={() => setForm((f) => ({ ...f, basis: option.id }))}
                              aria-pressed={form.basis === option.id}
                              className={`px-3.5 py-2 rounded-full text-xs font-bold min-h-[40px] ${form.basis === option.id ? "bg-[#F4A261] text-[#0B3B45]" : "bg-white/10 text-[#FBF5E9] hover:bg-white/20"}`}>
                              {option.label}
                            </button>
                          ))}
                        </div>
                        {Number(form.budget) > 0 && <p className="text-xs text-[#FBF5E9]/85">Tercatat: {rupiah(Number(form.budget))} {form.basis === "person" ? `per orang · total ${rupiah(Number(form.budget) * Number(form.adults))}` : "untuk rombongan"}</p>}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-bold text-[#FBF5E9]">Mau diprioritaskan yang mana?</p>
                      <div className="flex flex-wrap gap-2" aria-label="Prioritas rekomendasi">
                        {PLAN_PRIORITIES.map((option) => (
                          <button key={option.id} type="button" title={option.detail}
                            onClick={() => setForm((f) => ({ ...f, objective: option.id }))}
                            aria-pressed={(form.objective || "balanced") === option.id}
                            className={`px-3.5 py-2 rounded-full text-xs font-bold min-h-[40px] ${(form.objective || "balanced") === option.id ? "bg-[#F4A261] text-[#0B3B45]" : "bg-white/10 text-[#FBF5E9] hover:bg-white/20"}`}>
                            {option.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-[#FBF5E9]/75">{PLAN_PRIORITIES.find((option) => option.id === (form.objective || "balanced"))?.detail}</p>
                    </div>

                    {Number(form.days) > 1 && (
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-[#FBF5E9]">
                          Menginap di hotel mana?
                        </p>
                        <p className="text-xs text-[#FBF5E9]/75">Hotel menjadi titik awal dan akhir rute, bukan destinasi wisata.</p>
                        <input type="search" value={hotelQuery} onChange={(e) => {
                          setHotelQuery(e.target.value);
                          setHotelResults([]);
                          if (selectedHotel && e.target.value !== selectedHotel.name) {
                            setForm((f) => ({ ...f, lodging: "" }));
                          }
                        }}
                          placeholder="Cari nama hotel" aria-label="Cari nama hotel"
                          className="w-full rounded-xl bg-[#FBF5E9] text-[#0A1A1C] px-3 py-2 text-sm" />
                        <p className="text-xs text-[#FBF5E9]/75">Ketik nama, lalu pilih hotel dari hasil di bawah. Pencarian mencakup area hingga 30 km.</p>
                        {suggestedHotels.length > 0 && hotelQuery.trim() &&
                          <p className="text-xs text-[#FBF5E9]/85">Nama itu belum cocok. Pilih salah satu hotel yang tersedia di {destinationName}:</p>}
                        <div className="max-h-56 overflow-y-auto flex flex-wrap gap-2" aria-label="Pilihan hotel">
                          {Array.from(new Map([...matchingHotels, ...hotelResults, ...suggestedHotels].map((p) => [p.id, p])).values()).slice(0, 20).map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setPlaces((current) => current.some((item) => item.id === p.id) ? current : [...current, p]);
                                setHotelQuery(p.name);
                                setHotelResults([]);
                                setForm((f) => ({ ...f, lodging: p.id,
                                  lat: p.coordinates.lat, lng: p.coordinates.lng,
                                  endLat: p.coordinates.lat, endLng: p.coordinates.lng }));
                              }}
                              aria-pressed={form.lodging === p.id}
                              className={`px-3.5 py-2 rounded-full text-xs font-bold min-h-[40px] ${
                                form.lodging === p.id
                                  ? "bg-[#F4A261] text-[#0B3B45]"
                                  : "bg-white/10 text-[#FBF5E9] hover:bg-white/20"
                              }`}
                            >
                              {p.name}
                            </button>
                          ))}
                        </div>
                        {selectedHotel && <p className="text-xs font-bold text-[#F4A261]" role="status">Hotel dipilih: {selectedHotel.name}. Kamu bisa melanjutkan.</p>}
                        {hotelSearching && <p className="text-xs text-[#FBF5E9]/75" role="status">Mencari hotel di area tujuan...</p>}
                        {hotelSearchError && <p className="text-xs text-[#FBF5E9]/75" role="alert">{hotelSearchError}</p>}
                        {!hotelSearching && hotelQuery.trim().length >= 3 && !matchingHotels.length && !hotelResults.length && !suggestedHotels.length && !hotelSearchError && <p className="text-xs text-[#FBF5E9]/75">Belum ada hotel yang cocok. Coba nama lain atau daerah terdekat.</p>}
                      </div>
                    )}

                    <details className="rounded-2xl border border-white/20 bg-white/5 p-3">
                      <summary className="cursor-pointer text-sm font-bold text-[#FBF5E9]">Lengkapi perkiraan harga lainnya</summary>
                      <p className="text-xs text-[#FBF5E9]/75 mt-2">Angka ini adalah estimasi dari kamu dan akan tercatat di rincian biaya, bukan tarif resmi.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                        {[
                          { key: "food", label: "Makan per orang per kunjungan" },
                          ...(Number(form.days) > 1 ? [{ key: "hotel", label: "Kamar per malam" }] : []),
                          { key: "vehicle", label: "Kendaraan per hari" },
                        ].map(({ key, label }) => (
                          <label key={key} className="text-xs font-semibold text-[#FBF5E9] flex flex-col gap-1">
                            <span>{label} (Rp)</span>
                            <input type="number" min="0" inputMode="numeric" value={form[key]}
                              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                              className="w-full rounded-xl bg-[#FBF5E9] text-[#0A1A1C] px-3 py-2 text-sm" />
                          </label>
                        ))}
                      </div>
                    </details>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        disabled={!clarifyReady || busy}
                        onClick={() => {
                          setClarify(null);
                          executePlan(form);
                        }}
                        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm min-h-[48px] transition-all ${
                          clarifyReady && !busy
                            ? "bg-[#F4A261] text-[#0B3B45] hover:brightness-95"
                            : "bg-white/15 text-white/50 cursor-not-allowed"
                        }`}
                      >
                        <span>Susun sekarang</span>
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Pesan ramah jika layanan gagal */}
              {error && (
                <div
                  role="alert"
                  className="rounded-2xl bg-[#0B4F5C]/90 border border-[#F4A261]/50 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-sm text-[#FBF5E9]"
                >
                  <span>{error}</span>
                  {!catalogReady && (
                    <button
                      type="button"
                      onClick={() => setRetry((n) => n + 1)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F4A261] text-[#0B3B45] text-xs font-bold min-h-[40px]"
                    >
                      <RotateCcw size={13} />
                      <span>Coba lagi</span>
                    </button>
                  )}
                </div>
              )}

              {/* Kolom Ketik Besar */}
              <p className="text-sm text-center text-[#FBF5E9]/85">Opsional: tambahkan durasi atau keinginan khusus, lalu tekan panah. Kamu bisa langsung memilih “Susun sekarang” di atas.</p>
              <div className="relative overflow-hidden rounded-[28px] bg-[#FBF5E9] text-[#0A1A1C] shadow-2xl ring-2 ring-transparent focus-within:ring-[#2EC4B6] transition-all">
                <textarea
                  ref={textareaRef}
                  data-hide-cursor="true"
                  rows={3}
                  disabled={busy}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submitPrompt();
                    }
                  }}
                  placeholder="Contoh: 2 hari, ingin museum dan makan siang khas daerah"
                  aria-label="Ceritakan rencana perjalananmu"
                  style={{ outline: "none", border: "none", boxShadow: "none" }}
                  className="w-full bg-transparent border-0 px-6 pt-5 pb-14 text-base sm:text-lg leading-relaxed text-[#0A1A1C] placeholder:text-[#0B3B45]/50 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none resize-none"
                />
                <button
                  type="button"
                  disabled={busy || !text.trim()}
                  onClick={submitPrompt}
                  aria-label="Kirim permintaan"
                  className={`absolute right-3.5 bottom-3.5 w-12 h-12 rounded-full flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-[#2EC4B6] ${
                    busy || !text.trim()
                      ? "bg-[#E5E0D8] text-[#5C6669] cursor-not-allowed"
                      : "bg-[#F4A261] text-[#0B3B45] hover:brightness-95 shadow-md"
                  }`}
                >
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
            )}
          </motion.main>
        )}
      </AnimatePresence>

      {/* Navigasi bawah: Kembali di kiri bawah, Lanjut di kanan bawah */}
      <div className="relative z-20 w-full px-5 sm:px-8 pb-6 pt-2 flex items-center justify-between">
        <div>
          {((phase === 2 && viewMode === "prompt") || phase === 1) && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (phase === 2) {
                  setPhase(1);
                  setTasteStep(2);
                } else if (tasteStep === 0) {
                  setPhase(0);
                } else {
                  setTasteStep((s) => s - 1);
                }
              }}
              className="text-sm font-semibold text-[#FBF5E9]/85 hover:text-[#FBF5E9] min-h-[48px] px-3 focus:outline-none focus:underline"
            >
              Kembali
            </button>
          )}
        </div>

        <div>
          {phase === 1 && (
            <button
              type="button"
              disabled={tasteStep === 0 ? !form.interests.length : tasteStep === 1 ? !companionId : !(Number(form.budget) > 0)}
              onClick={() => {
                const missingAfter = [!form.interests.length, !companionId, !(Number(form.budget) > 0)]
                  .findIndex((missing, index) => index > tasteStep && missing);
                if (missingAfter >= 0) setTasteStep(missingAfter);
                else showNextMissing(form, companionId, daysProvided);
              }}
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full font-bold text-base bg-[#F4A261] text-[#0B3B45] min-h-[48px] hover:brightness-95 transition-all focus:outline-none focus:ring-2 focus:ring-[#2EC4B6] shadow-md disabled:opacity-50"
            >
              <span>Lanjut</span>
              <ArrowRight size={17} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
