import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  motion,
  useReducedMotion,
  AnimatePresence,
  useInView,
  useMotionValue,
  animate,
} from 'framer-motion';
import { MapPin, ArrowRight, Store, Banknote } from 'lucide-react';
import { loadTrips } from '../services/itineraryStorage';
import { time } from '../components/GuestUI';
import MapView from '../components/MapView';

// ── Motion constants (hormati prefers-reduced-motion) ────────────────────────
const EASE = [0.22, 1, 0.36, 1];
const DURATION = 0.6;
const STAGGER = 0.08;

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: STAGGER } },
};

function cardVariants(reduced) {
  return {
    hidden: { opacity: 0, y: reduced ? 0 : 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? 0 : DURATION, ease: EASE },
    },
  };
}

// ── 2 Itinerary Contoh (skema kanonik agar bisa dibuka di halaman detail) ────
const ev = { status: 'verified', sourceType: 'curated', sourceRef: null };
const leg = { estimatedDurationMin: 18, schedulingBufferMin: 5, distanceMeters: 4200 };

function makeDayWindows(startDate, count) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return { date: d.toISOString().split('T')[0], start: '08:00', end: '20:00' };
  });
}

function buildDemoItineraries() {
  const padangStart = new Date();
  padangStart.setDate(padangStart.getDate() + 12);
  const padangDate = padangStart.toISOString().split('T')[0];
  const padangWindows = makeDayWindows(padangStart, 3);

  const rajaAmpatStart = new Date();
  rajaAmpatStart.setDate(rajaAmpatStart.getDate() + 34);
  const rajaAmpatDate = rajaAmpatStart.toISOString().split('T')[0];
  const rajaWindows = makeDayWindows(rajaAmpatStart, 3);

  return [
    {
      schemaVersion: 1,
      id: 'demo-padang-3d',
      revision: 1,
      isDemo: true,
      title: 'Jelajah Kuliner & Budaya Padang (3 Hari)',
      request: {
        destinationId: 'yogyakarta',
        days: 3,
        startDate: padangDate,
        travelers: { adults: 2 },
        budget: { totalIdr: 1500000, reserveIdr: 200000 },
        arrivalAnchor: { lat: -0.9471, lng: 100.4172 },
        departureAnchor: { lat: -0.9471, lng: 100.4172 },
        interests: ['food', 'culture'],
        mustVisitPlaceIds: [],
        periodPreferences: [],
        dayWindows: padangWindows,
      },
      places: [
        {
          id: 'demo-pdg-1',
          name: 'Pantai Air Manis & Batu Malin Kundang',
          city: 'Kota Padang',
          categories: ['attraction'],
          isLocalBusiness: false,
          coordinates: { lat: -0.9896, lng: 100.3547 },
          visitDurationMin: 90,
          identityEvidence: ev,
          locationEvidence: ev,
          durationEvidence: ev,
          openingEvidence: ev,
          openingWindows: [],
          prices: [{ amountIdr: 30000, evidence: ev }],
        },
        {
          id: 'demo-pdg-2',
          name: 'Rumah Makan Lamun Ombak',
          city: 'Kota Padang',
          categories: ['food'],
          isLocalBusiness: true,
          coordinates: { lat: -0.9163, lng: 100.3596 },
          visitDurationMin: 75,
          identityEvidence: ev,
          locationEvidence: ev,
          durationEvidence: ev,
          openingEvidence: ev,
          openingWindows: [],
          prices: [{ amountIdr: 185000, evidence: ev }],
        },
        {
          id: 'demo-pdg-3',
          name: 'Sentra Tenun Pandai Sikek',
          city: 'Kabupaten Tanah Datar',
          categories: ['craft'],
          isLocalBusiness: true,
          coordinates: { lat: -0.3711, lng: 100.3867 },
          visitDurationMin: 90,
          identityEvidence: ev,
          locationEvidence: ev,
          durationEvidence: ev,
          openingEvidence: ev,
          openingWindows: [],
          prices: [{ amountIdr: 250000, evidence: ev }],
        },
      ],
      days: padangWindows.map((w, idx) => ({
        date: w.date,
        startAnchor: { lat: -0.9471, lng: 100.4172 },
        endAnchor: { lat: -0.9471, lng: 100.4172 },
        finalLeg: null,
        stops:
          idx === 0
            ? [
                {
                  id: 'stop-pdg-1',
                  placeId: 'demo-pdg-1',
                  arrivalAt: `${padangDate}T08:30:00+07:00`,
                  departureAt: `${padangDate}T10:00:00+07:00`,
                  visitDurationMin: 90,
                  dayIndex: 0,
                  incomingLeg: leg,
                  lock: { type: 'none' },
                  status: 'scheduled',
                },
                {
                  id: 'stop-pdg-2',
                  placeId: 'demo-pdg-2',
                  arrivalAt: `${padangDate}T12:00:00+07:00`,
                  departureAt: `${padangDate}T13:15:00+07:00`,
                  visitDurationMin: 75,
                  dayIndex: 0,
                  incomingLeg: leg,
                  lock: { type: 'none' },
                  status: 'scheduled',
                },
                {
                  id: 'stop-pdg-3',
                  placeId: 'demo-pdg-3',
                  arrivalAt: `${padangDate}T15:00:00+07:00`,
                  departureAt: `${padangDate}T16:30:00+07:00`,
                  visitDurationMin: 90,
                  dayIndex: 0,
                  incomingLeg: leg,
                  lock: { type: 'none' },
                  status: 'scheduled',
                },
              ]
            : [],
      })),
      ledger: [
        { id: 'ldg-1', category: 'admission', quantity: 1, totalIdr: 30000, unitAmountIdr: 30000, evidence: ev },
        { id: 'ldg-2', category: 'food', quantity: 1, totalIdr: 185000, unitAmountIdr: 185000, evidence: ev },
        { id: 'ldg-3', category: 'activity', quantity: 1, totalIdr: 250000, unitAmountIdr: 250000, evidence: ev },
      ],
      uncertainties: [],
      violations: [],
      totals: { knownCostIdr: 465000, unknownCostItems: 0, travelMin: 54, distanceMeters: 12600 },
    },
    {
      schemaVersion: 1,
      id: 'demo-rajaampat-3d',
      revision: 1,
      isDemo: true,
      title: 'Pesona Bahari Raja Ampat (3 Hari)',
      request: {
        destinationId: 'yogyakarta',
        days: 3,
        startDate: rajaAmpatDate,
        travelers: { adults: 2 },
        budget: { totalIdr: 2500000, reserveIdr: 300000 },
        arrivalAnchor: { lat: -0.4333, lng: 130.8167 },
        departureAnchor: { lat: -0.4333, lng: 130.8167 },
        interests: ['nature', 'culture'],
        mustVisitPlaceIds: [],
        periodPreferences: [],
        dayWindows: rajaWindows,
      },
      places: [
        {
          id: 'demo-ra-1',
          name: 'Kepulauan Karst Piaynemo',
          city: 'Kabupaten Raja Ampat',
          categories: ['attraction'],
          isLocalBusiness: false,
          coordinates: { lat: -0.5639, lng: 130.2747 },
          visitDurationMin: 120,
          identityEvidence: ev,
          locationEvidence: ev,
          durationEvidence: ev,
          openingEvidence: ev,
          openingWindows: [],
          prices: [{ amountIdr: 200000, evidence: ev }],
        },
        {
          id: 'demo-ra-2',
          name: 'Noken Anyaman Mama Papua Arborek',
          city: 'Kabupaten Raja Ampat',
          categories: ['craft'],
          isLocalBusiness: true,
          coordinates: { lat: -0.5621, lng: 130.5187 },
          visitDurationMin: 60,
          identityEvidence: ev,
          locationEvidence: ev,
          durationEvidence: ev,
          openingEvidence: ev,
          openingWindows: [],
          prices: [{ amountIdr: 320000, evidence: ev }],
        },
        {
          id: 'demo-ra-3',
          name: 'Homestay & Kuliner Kampung Sauwandarek',
          city: 'Kabupaten Raja Ampat',
          categories: ['food'],
          isLocalBusiness: true,
          coordinates: { lat: -0.5944, lng: 130.6012 },
          visitDurationMin: 90,
          identityEvidence: ev,
          locationEvidence: ev,
          durationEvidence: ev,
          openingEvidence: ev,
          openingWindows: [],
          prices: [{ amountIdr: 450000, evidence: ev }],
        },
      ],
      days: rajaWindows.map((w, idx) => ({
        date: w.date,
        startAnchor: { lat: -0.4333, lng: 130.8167 },
        endAnchor: { lat: -0.4333, lng: 130.8167 },
        finalLeg: null,
        stops:
          idx === 0
            ? [
                {
                  id: 'stop-ra-1',
                  placeId: 'demo-ra-1',
                  arrivalAt: `${rajaAmpatDate}T08:00:00+09:00`,
                  departureAt: `${rajaAmpatDate}T10:00:00+09:00`,
                  visitDurationMin: 120,
                  dayIndex: 0,
                  incomingLeg: leg,
                  lock: { type: 'none' },
                  status: 'scheduled',
                },
                {
                  id: 'stop-ra-2',
                  placeId: 'demo-ra-2',
                  arrivalAt: `${rajaAmpatDate}T11:30:00+09:00`,
                  departureAt: `${rajaAmpatDate}T12:30:00+09:00`,
                  visitDurationMin: 60,
                  dayIndex: 0,
                  incomingLeg: leg,
                  lock: { type: 'none' },
                  status: 'scheduled',
                },
              ]
            : [],
      })),
      ledger: [
        { id: 'ldg-ra-1', category: 'admission', quantity: 1, totalIdr: 200000, unitAmountIdr: 200000, evidence: ev },
        { id: 'ldg-ra-2', category: 'food', quantity: 1, totalIdr: 320000, unitAmountIdr: 320000, evidence: ev },
        { id: 'ldg-ra-3', category: 'activity', quantity: 1, totalIdr: 450000, unitAmountIdr: 450000, evidence: ev },
      ],
      uncertainties: [],
      violations: [],
      totals: { knownCostIdr: 970000, unknownCostItems: 0, travelMin: 40, distanceMeters: 9500 },
    },
  ];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function toTitleCase(str) {
  if (!str) return str;
  return str
    .toLowerCase()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function getGreeting(now = new Date()) {
  const h = now.getHours();
  if (h < 12) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 18) return 'Selamat sore';
  return 'Selamat malam';
}

function daysUntil(dateStr, now = new Date()) {
  if (!dateStr) return null;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatApproxRupiah(amount) {
  if (!amount || amount <= 0) return null;
  if (amount >= 1_000_000) {
    const jt = (amount / 1_000_000).toFixed(1).replace('.', ',').replace(',0', '');
    return `± Rp${jt} juta`;
  }
  if (amount >= 1_000) {
    return `± Rp${Math.round(amount / 1_000)} ribu`;
  }
  return `± Rp${amount.toLocaleString('id-ID')}`;
}

function pickUpcomingTrip(trips, now = new Date()) {
  if (!trips.length) return null;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const upcoming = trips
    .filter((t) => t.request?.startDate)
    .map((t) => ({
      trip: t,
      diff: new Date(t.request.startDate).setHours(0, 0, 0, 0) - today.getTime(),
    }))
    .sort((a, b) => {
      const aFuture = a.diff >= 0;
      const bFuture = b.diff >= 0;
      if (aFuture && !bFuture) return -1;
      if (!aFuture && bFuture) return 1;
      return aFuture ? a.diff - b.diff : b.diff - a.diff;
    });

  return upcoming[0]?.trip || trips[0];
}

function computeImpact(trips) {
  if (!trips.length) return null;
  let umkmCount = 0;
  let estimasiRupiah = 0;
  const daerahSet = new Set();

  for (const trip of trips) {
    for (const place of trip.places || []) {
      if (place.isLocalBusiness === true) umkmCount += 1;
      if (place.city) daerahSet.add(place.city.toLowerCase());
    }
    for (const entry of trip.ledger || []) {
      const isLocal = ['admission', 'food', 'activity'].includes(entry.category);
      if (isLocal && entry.totalIdr != null) estimasiRupiah += entry.totalIdr;
    }
  }
  return { umkmCount, estimasiRupiah, daerahCount: daerahSet.size };
}

// ── Animated count-up hook (tidak animasi ulang saat re-render) ───────────────
function useCountUp(target, shouldAnimate) {
  const motionVal = useMotionValue(0);
  const [display, setDisplay] = useState(0);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!shouldAnimate || hasRun.current) return;
    hasRun.current = true;
    const ctrl = animate(motionVal, target, {
      duration: 1.4,
      ease: EASE,
    });
    const unsub = motionVal.on('change', (v) => setDisplay(Math.round(v)));
    return () => {
      ctrl.stop();
      unsub();
    };
  }, [shouldAnimate, target, motionVal]);

  return shouldAnimate ? display : target;
}

// ── Flip countdown number ────────────────────────────────────────────────────
function FlipNumber({ value, reduced }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={value}
        initial={reduced ? {} : { y: -20, opacity: 0, rotateX: -90 }}
        animate={{ y: 0, opacity: 1, rotateX: 0 }}
        exit={reduced ? {} : { y: 20, opacity: 0, rotateX: 90 }}
        transition={{ duration: 0.35, ease: EASE }}
        style={{ display: 'inline-block', transformOrigin: 'center' }}
      >
        {value}
      </motion.span>
    </AnimatePresence>
  );
}

// ── Tilt card wrapper (desktop saja, hanya transform & opacity) ──────────────
function TiltCard({ children, className, reduced, onClick }) {
  const ref = useRef(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  const handleMove = useCallback(
    (e) => {
      if (reduced || window.matchMedia('(hover: none)').matches) return;
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      rotateY.set(((e.clientX - cx) / (rect.width / 2)) * 5);
      rotateX.set(-((e.clientY - cy) / (rect.height / 2)) * 3.5);
    },
    [reduced, rotateX, rotateY]
  );

  const handleLeave = useCallback(() => {
    animate(rotateX, 0, { duration: 0.4, ease: EASE });
    animate(rotateY, 0, { duration: 0.4, ease: EASE });
  }, [rotateX, rotateY]);

  return (
    <motion.div
      ref={ref}
      onClick={onClick}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      whileHover={{ scale: reduced ? 1 : 1.005 }}
      transition={{ duration: 0.2 }}
      className={`${className} transition-shadow duration-300 hover:shadow-card`}
    >
      {children}
    </motion.div>
  );
}

// ── Dashboard skeleton ───────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-6">
      <div className="space-y-1">
        <div className="h-8 w-36 bg-gradient-to-r from-teal/10 to-teal/5 rounded-xl animate-pulse" />
        <div className="h-4 w-48 bg-gray-100 rounded-xl animate-pulse" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-3xl overflow-hidden shadow-soft border border-gray-100">
          <div className="h-[250px] bg-gradient-to-br from-teal/10 to-sky animate-pulse" />
          <div className="p-5 space-y-3">
            <div className="h-5 w-2/3 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-4 w-1/2 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-10 w-full bg-teal/10 rounded-xl animate-pulse" />
          </div>
        </div>
        <div className="bg-white rounded-3xl shadow-soft border border-gray-100 divide-y divide-gray-100 overflow-hidden">
          <div className="p-5 space-y-1">
            <div className="h-5 w-40 bg-gray-100 rounded-xl animate-pulse" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 space-y-2">
              <div className="h-3 w-24 bg-gray-100 rounded-xl animate-pulse" />
              <div className="h-7 w-20 bg-teal/10 rounded-xl animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Empty state beranimasi (ketika tidak ada itinerary sama sekali) ──────────
function AnimatedEmptyState({ reduced }) {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-3xl shadow-soft border border-gray-100 flex flex-col items-center justify-center gap-5 p-8 text-center h-full min-h-[360px]">
      <svg width="120" height="90" viewBox="0 0 120 90" fill="none" aria-hidden="true">
        <motion.ellipse
          cx="22" cy="62" rx="20" ry="9"
          fill="#D0EDE9"
          animate={reduced ? {} : { y: [0, -3, 0] }}
          transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
        />
        <motion.ellipse
          cx="62" cy="56" rx="30" ry="12"
          fill="#B8E0DB"
          animate={reduced ? {} : { y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut', delay: 0.4 }}
        />
        <motion.ellipse
          cx="100" cy="64" rx="16" ry="7"
          fill="#D0EDE9"
          animate={reduced ? {} : { y: [0, -2, 0] }}
          transition={{ repeat: Infinity, duration: 3.6, ease: 'easeInOut', delay: 0.8 }}
        />
        <motion.path
          d="M22 62 C34 36 52 28 62 32 C72 28 88 42 100 64"
          stroke="#176B67"
          strokeWidth="2"
          fill="none"
          strokeDasharray="6 4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={reduced ? {} : { duration: 1.6, delay: 0.4, ease: EASE }}
        />
        <circle cx="22" cy="62" r="5" fill="#F4A261" />
        <circle cx="62" cy="32" r="4.5" fill="#176B67" />
        <circle cx="100" cy="64" r="5" fill="#F4A261" />
      </svg>

      <div>
        <h2 className="font-extrabold text-charcoal text-lg">Perjalanan Berikutnya</h2>
        <p className="text-xs text-charcoal-lighter mt-1 max-w-[240px] mx-auto leading-relaxed">
          Belum ada itinerary tersimpan. Susun rute pertamamu sekarang agar muncul di sini.
        </p>
      </div>

      <motion.button
        onClick={() => navigate('/create')}
        whileHover={reduced ? {} : { scale: 1.03 }}
        whileTap={reduced ? {} : { scale: 0.97 }}
        className="flex items-center gap-2 py-2.5 px-6 rounded-xl font-bold text-sm text-white"
        style={{ background: '#176B67' }}
      >
        Susun perjalanan pertama
        <ArrowRight size={15} />
      </motion.button>
    </div>
  );
}

// ── Hitung mundur menonjol (48-60px) di kanan atas kartu ─────────────────────
function HeroCountdown({ days, totalDays, reduced }) {
  if (days === null) return null;

  const isOngoing = days <= 0 && totalDays && Math.abs(days) < totalDays;
  if (isOngoing) {
    const currentDay = Math.abs(days) + 1;
    return (
      <div className="text-right flex-shrink-0">
        <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-coral/10 text-coral mb-1">
          Sedang berlangsung
        </span>
        <div className="flex items-baseline justify-end gap-1.5">
          <span className="text-xs font-semibold text-charcoal-lighter">Hari ke-</span>
          <span className="text-5xl sm:text-6xl font-black text-teal leading-none tracking-tight">
            <FlipNumber value={currentDay} reduced={reduced} />
          </span>
        </div>
      </div>
    );
  }

  if (days < 0) {
    return (
      <div className="text-right flex-shrink-0">
        <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-gray-100 text-charcoal-lighter">
          Sudah selesai
        </span>
      </div>
    );
  }

  return (
    <div className="text-right flex-shrink-0">
      <div className="flex items-baseline justify-end gap-1.5">
        <span className="text-5xl sm:text-6xl font-black text-teal leading-none tracking-tight">
          <FlipNumber value={days} reduced={reduced} />
        </span>
        <span className="text-xs font-bold text-charcoal-lighter">hari lagi</span>
      </div>
    </div>
  );
}

// ── Kartu Perjalanan Berikutnya (seluruh kartu bisa diklik) ─────────────────
function NextTripCard({ trip, isDemo, now, reduced }) {
  const navigate = useNavigate();

  const startDate = trip.request?.startDate;
  const days = trip.request?.days;
  const countdown = daysUntil(startDate, now);

  const placeMap = useMemo(() => {
    const m = {};
    for (const p of trip.places || []) m[p.id] = p;
    return m;
  }, [trip.places]);

  const activities = useMemo(() => {
    const result = [];
    for (const day of trip.days || []) {
      for (const stop of day.stops || []) {
        const place = placeMap[stop.placeId];
        if (!place) continue;
        result.push({
          id: stop.id,
          name: toTitleCase(place.name),
          city: place.city ? toTitleCase(place.city) : undefined,
          lat: place.coordinates?.lat,
          lng: place.coordinates?.lng,
          time: time(stop.arrivalAt),
          duration: `${stop.visitDurationMin} mnt`,
        });
      }
    }
    return result;
  }, [trip.days, placeMap]);

  const nextStop = useMemo(() => {
    let fallback = null;
    const nowMs = now.getTime();
    for (const day of trip.days || []) {
      for (const stop of day.stops || []) {
        const place = placeMap[stop.placeId];
        if (!place) continue;
        const item = { name: toTitleCase(place.name), jam: time(stop.arrivalAt) };
        if (!fallback) fallback = item;
        if (stop.arrivalAt && Date.parse(stop.arrivalAt) > nowMs) {
          return item;
        }
      }
    }
    return fallback;
  }, [trip.days, placeMap, now]);

  const tripTitle =
    trip.title ||
    `Yogyakarta · ${trip.request?.travelers?.adults ?? '?'} orang`;

  const openDetail = () => {
    navigate(`/itinerary/${trip.id}`, { state: { trip } });
  };

  const handleCardClick = (e) => {
    if (e.target.closest('.leaflet-control, .leaflet-popup')) return;
    openDetail();
  };

  return (
    <TiltCard
      onClick={handleCardClick}
      className="bg-white rounded-3xl shadow-soft border border-gray-100 flex flex-col h-full overflow-hidden cursor-pointer group"
      reduced={reduced}
    >
      {/* Map mini */}
      <div className="flex-none">
        <MapView activities={activities} height="240px" animateRoute pulseNext />
      </div>

      {/* Info */}
      <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs text-charcoal-lighter font-medium">
                  Perjalanan Berikutnya
                </p>
                {isDemo && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    Contoh
                  </span>
                )}
              </div>
              <h2 className="font-extrabold text-charcoal text-lg sm:text-xl leading-tight mt-1 group-hover:text-teal transition-colors">
                {tripTitle}
              </h2>
              <div className="flex items-center gap-4 text-xs text-charcoal-lighter mt-1.5">
                <span className="flex items-center gap-1">
                  <MapPin size={12} className="text-coral" />
                  {startDate ? formatDate(startDate) : '—'}
                </span>
                <span>{days ? `${days} hari` : '—'}</span>
              </div>
            </div>

            <HeroCountdown days={countdown} totalDays={days} reduced={reduced} />
          </div>

          {nextStop && (
            <p className="text-xs text-charcoal bg-sky rounded-xl px-3.5 py-2.5">
              <span className="font-semibold">Berikutnya:</span>{' '}
              {nextStop.name} pukul {nextStop.jam}
            </p>
          )}
        </div>

        <motion.button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openDetail();
          }}
          whileHover={reduced ? {} : { scale: 1.01 }}
          whileTap={reduced ? {} : { scale: 0.98 }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white mt-auto"
          style={{ background: '#176B67' }}
        >
          Buka itinerary
          <ArrowRight size={15} />
        </motion.button>
      </div>
    </TiltCard>
  );
}

// ── Baris angka dampak rapat & bermakna ───────────────────────────────────────
function ImpactRow({
  icon: Icon,
  label,
  value,
  formatValue,
  hint,
  isEstimate,
  color,
  inView,
  reduced,
}) {
  const numericTarget = typeof value === 'number' ? value : 0;
  const counted = useCountUp(
    numericTarget,
    inView && !reduced && typeof value === 'number'
  );

  const displayVal =
    value == null
      ? null
      : formatValue
      ? formatValue(counted)
      : typeof value === 'number'
      ? counted.toLocaleString('id-ID')
      : value;

  return (
    <div className="px-5 py-3.5 flex flex-col gap-0.5 flex-1 justify-center">
      <p className="text-[11px] font-semibold text-charcoal-lighter uppercase tracking-wide flex items-center gap-1.5">
        <Icon size={13} className="text-teal flex-shrink-0" />
        <span>{label}</span>
        {isEstimate && (
          <span className="normal-case font-normal text-[10px] bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded-full border border-yellow-200">
            estimasi
          </span>
        )}
      </p>
      {displayVal != null ? (
        <>
          <p className={`text-2xl font-black ${color}`}>{displayVal}</p>
          <p className="text-[11px] text-charcoal-lighter/80 leading-snug">{hint}</p>
        </>
      ) : (
        <div>
          <p className="text-sm font-bold text-charcoal-lighter">Belum ada data</p>
          <p className="text-[11px] text-charcoal-lighter/80 mt-0.5 leading-snug">
            {hint}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Blok Dampak Perjalananmu ─────────────────────────────────────────────────
function ImpactBlock({ impact, isDemo, reduced }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  const rows = [
    {
      key: 'umkm',
      icon: Store,
      label: 'UMKM dikunjungi',
      value: impact ? impact.umkmCount : null,
      hint: 'Dari tempat usaha lokal di itinerary-mu.',
      color: 'text-teal',
    },
    {
      key: 'rupiah',
      icon: Banknote,
      label: 'Rupiah ke usaha lokal',
      value: impact && impact.estimasiRupiah > 0 ? impact.estimasiRupiah : null,
      formatValue: (n) => formatApproxRupiah(n),
      hint: 'Perkiraan belanja di tiket, makan, dan aktivitas lokal.',
      isEstimate: true,
      color: 'text-emerald-700',
    },
    {
      key: 'daerah',
      icon: MapPin,
      label: 'Daerah dijelajahi',
      value: impact && impact.daerahCount > 0 ? impact.daerahCount : null,
      hint: 'Jumlah kota atau kabupaten dalam itinerary-mu.',
      color: 'text-charcoal',
    },
  ];

  return (
    <div
      ref={ref}
      className="bg-white rounded-3xl shadow-soft border border-gray-100 flex flex-col divide-y divide-gray-100 overflow-hidden h-full"
    >
      <div className="px-5 py-4 flex items-start justify-between gap-2">
        <div>
          <h2 className="font-extrabold text-charcoal text-base">
            Dampak Perjalananmu
          </h2>
          <p className="text-xs text-charcoal-lighter mt-0.5">
            Dihitung otomatis dari rencana perjalananmu.
          </p>
        </div>
        {isDemo && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
            Contoh
          </span>
        )}
      </div>

      {rows.map((row) => (
        <ImpactRow
          key={row.key}
          icon={row.icon}
          label={row.label}
          value={row.value}
          formatValue={row.formatValue}
          hint={row.hint}
          isEstimate={row.isEstimate}
          color={row.color}
          inView={inView}
          reduced={reduced}
        />
      ))}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
function readTravelerName() {
  try {
    const saved = localStorage.getItem('tripin_user_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.displayName?.trim()) return parsed.displayName.trim();
    }
  } catch {}
  return 'Sahabat TRIPIN';
}

export default function DashboardPage() {
  const [searchParams] = useSearchParams();
  const reduced = useReducedMotion();
  const [loading, setLoading] = useState(true);
  const [userTrips, setUserTrips] = useState([]);
  const [travelerName, setTravelerName] = useState(readTravelerName);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const refresh = () => {
      try {
        setUserTrips(loadTrips());
      } catch {
        setUserTrips([]);
      }
      setTravelerName(readTravelerName());
      setNow(new Date());
      setLoading(false);
    };

    const t = setTimeout(refresh, 100);
    const clock = setInterval(() => setNow(new Date()), 30000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };

    window.addEventListener('tripin:trips-changed', refresh);
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearTimeout(t);
      clearInterval(clock);
      window.removeEventListener('tripin:trips-changed', refresh);
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const forceEmpty = searchParams.get('empty') === '1';
  const isDemo = !forceEmpty && userTrips.length === 0;
  const activeTrips = useMemo(
    () => (forceEmpty ? [] : isDemo ? buildDemoItineraries() : userTrips),
    [forceEmpty, isDemo, userTrips]
  );

  const upcomingTrip = useMemo(
    () => pickUpcomingTrip(activeTrips, now),
    [activeTrips, now]
  );
  const impact = useMemo(() => computeImpact(activeTrips), [activeTrips]);
  const greeting = getGreeting(now);
  const cv = cardVariants(reduced);

  if (loading) return <DashboardSkeleton />;

  return (
    <motion.div
      className="max-w-6xl mx-auto pb-6 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.header variants={cv}>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-charcoal-lighter text-sm mt-0.5">
          {greeting}, {travelerName}! Siap melanjutkan petualanganmu hari ini?
        </p>
      </motion.header>

      {/* Bento grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        <motion.div className="lg:col-span-2 flex flex-col" variants={cv}>
          {upcomingTrip ? (
            <NextTripCard trip={upcomingTrip} isDemo={isDemo} now={now} reduced={reduced} />
          ) : (
            <AnimatedEmptyState reduced={reduced} />
          )}
        </motion.div>

        <motion.div className="lg:col-span-1 flex flex-col" variants={cv}>
          <ImpactBlock impact={impact} isDemo={isDemo} reduced={reduced} />
        </motion.div>
      </div>
    </motion.div>
  );
}
