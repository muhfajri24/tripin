import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowRight, Store, Map as MapIcon } from 'lucide-react';
import { loadTrips } from '../services/itineraryStorage';
import { rupiah, time } from '../components/GuestUI';
import MapView from '../components/MapView';

// ── Helpers ─────────────────────────────────────────────────────────────────

function toTitleCase(str) {
  if (!str) return str;
  return str
    .toLowerCase()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 18) return 'Selamat sore';
  return 'Selamat malam';
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
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

// ── Derived impact stats from real trip data ─────────────────────────────────

function computeImpact(trips) {
  if (!trips.length) return null;

  let umkmCount = 0;
  let estimasiRupiah = 0;
  const daerahSet = new Set();

  for (const trip of trips) {
    // Count UMKM places (isLocalBusiness === true)
    for (const place of trip.places || []) {
      const name = toTitleCase(place.name);
      place._displayName = name;

      if (place.isLocalBusiness === true) umkmCount += 1;

      // Collect city/region for daerah count
      if (place.city) daerahSet.add(place.city.toLowerCase());
    }

    // Estimasi rupiah: sum ledger entries where category is local/umkm
    for (const entry of trip.ledger || []) {
      const isLocal =
        entry.category === 'admission' ||
        entry.category === 'food' ||
        entry.category === 'activity';
      if (isLocal && entry.totalIdr != null) {
        estimasiRupiah += entry.totalIdr;
      }
    }
  }

  return {
    umkmCount,
    estimasiRupiah,
    daerahCount: daerahSet.size,
  };
}

// ── Components ───────────────────────────────────────────────────────────────

function CountdownBadge({ days }) {
  if (days === null) return null;
  if (days < 0)
    return (
      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-charcoal-lighter">
        Sudah lewat
      </span>
    );
  if (days === 0)
    return (
      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-coral/10 text-coral">
        Hari ini!
      </span>
    );
  return (
    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-teal/10 text-teal">
      {days} hari lagi
    </span>
  );
}

// Kartu "Perjalanan Berikutnya" ─ ada trip
function NextTripCard({ trip }) {
  const navigate = useNavigate();

  const startDate = trip.request?.startDate;
  const days = trip.request?.days;
  const countdown = daysUntil(startDate);

  // Activities for MapView: flatten stops → join with places coords
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

  // "Berikutnya" = first stop of first day that has an arrivalAt in the future
  const nextStop = useMemo(() => {
    for (const day of trip.days || []) {
      for (const stop of day.stops || []) {
        const place = placeMap[stop.placeId];
        if (!place) continue;
        return {
          name: toTitleCase(place.name),
          jam: time(stop.arrivalAt),
        };
      }
    }
    return null;
  }, [trip.days, placeMap]);

  // Title: "Yogyakarta - N orang" or use a stored title if available
  const tripTitle =
    trip.title ||
    `Yogyakarta · ${trip.request?.travelers?.adults ?? '?'} orang`;

  return (
    <div className="bg-white rounded-3xl shadow-soft border border-gray-100 flex flex-col overflow-hidden">
      {/* Map mini */}
      <div className="flex-none">
        <MapView activities={activities} height="220px" />
      </div>

      {/* Info */}
      <div className="flex-1 p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-charcoal-lighter font-medium">
              Perjalanan Berikutnya
            </p>
            <h2 className="font-extrabold text-charcoal text-lg leading-tight mt-0.5">
              {tripTitle}
            </h2>
          </div>
          <CountdownBadge days={countdown} />
        </div>

        <div className="flex items-center gap-4 text-xs text-charcoal-lighter">
          <span className="flex items-center gap-1">
            <MapPin size={12} className="text-coral" />
            {startDate ? formatDate(startDate) : '—'}
          </span>
          <span>{days ? `${days} hari` : '—'}</span>
        </div>

        {nextStop && (
          <p className="text-xs text-charcoal bg-sky rounded-xl px-3 py-2">
            <span className="font-semibold">Berikutnya:</span>{' '}
            {nextStop.name} pukul {nextStop.jam}
          </p>
        )}

        <button
          onClick={() => navigate(`/itinerary/${trip.id}`)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
          style={{ background: '#176B67' }}
        >
          Buka itinerary
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

// Kartu kosong — belum ada trip
function EmptyTripCard() {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-3xl shadow-soft border border-gray-100 flex flex-col items-center justify-center gap-5 p-8 text-center min-h-[320px]">
      {/* Ilustrasi Nusantara sederhana */}
      <svg
        width="96"
        height="72"
        viewBox="0 0 96 72"
        fill="none"
        aria-hidden="true"
      >
        <ellipse cx="20" cy="48" rx="18" ry="8" fill="#E8F5F4" />
        <ellipse cx="52" cy="44" rx="26" ry="10" fill="#D0EDE9" />
        <ellipse cx="80" cy="50" rx="14" ry="6" fill="#E8F5F4" />
        <path
          d="M24 48 C28 30 44 20 52 24 C60 20 72 32 76 48"
          stroke="#176B67"
          strokeWidth="2"
          fill="none"
          strokeDasharray="5 3"
        />
        <circle cx="24" cy="48" r="4" fill="#FF6B5E" />
        <circle cx="52" cy="24" r="3.5" fill="#176B67" />
        <circle cx="76" cy="48" r="4" fill="#FF6B5E" />
        <MapIcon
          x="43"
          y="10"
          size={12}
          color="#176B67"
          strokeWidth={2.5}
        />
      </svg>

      <div>
        <h2 className="font-extrabold text-charcoal text-lg">
          Perjalanan Berikutnya
        </h2>
        <p className="text-xs text-charcoal-lighter mt-1 max-w-[220px] mx-auto leading-relaxed">
          Belum ada itinerary tersimpan. Susun rute pertamamu bersama AI
          agar muncul di sini.
        </p>
      </div>

      <button
        onClick={() => navigate('/create')}
        className="flex items-center gap-2 py-2.5 px-6 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
        style={{ background: '#176B67' }}
      >
        Susun perjalanan pertama
        <ArrowRight size={15} />
      </button>
    </div>
  );
}

// Blok "Dampak Perjalananmu"
function ImpactBlock({ impact }) {
  const rows = [
    {
      key: 'umkm',
      label: 'UMKM dikunjungi',
      value: impact ? `${impact.umkmCount} tempat` : null,
      hint: 'Hitung dari tempat bertanda isLocalBusiness pada itinerary tersimpan.',
      color: 'text-teal',
    },
    {
      key: 'rupiah',
      label: 'Rupiah ke usaha lokal',
      value:
        impact && impact.estimasiRupiah > 0
          ? rupiah(impact.estimasiRupiah)
          : null,
      hint: 'Estimasi dari entri ledger kategori admission, food, activity.',
      isEstimate: true,
      color: 'text-emerald-700',
    },
    {
      key: 'daerah',
      label: 'Daerah dijelajahi',
      value: impact && impact.daerahCount > 0 ? `${impact.daerahCount} daerah` : null,
      hint: 'Dihitung dari kota unik pada tempat-tempat di itinerary tersimpan.',
      color: 'text-charcoal',
    },
  ];

  return (
    <div className="bg-white rounded-3xl shadow-soft border border-gray-100 flex flex-col divide-y divide-gray-100 overflow-hidden">
      <div className="px-5 py-4">
        <h2 className="font-extrabold text-charcoal text-base">
          Dampak Perjalananmu
        </h2>
        <p className="text-xs text-charcoal-lighter mt-0.5">
          Dihitung dari data itinerary tersimpan di browser ini.
        </p>
      </div>

      {rows.map((row) => (
        <div key={row.key} className="px-5 py-4 flex flex-col gap-0.5">
          <p className="text-[11px] font-semibold text-charcoal-lighter uppercase tracking-wide flex items-center gap-1.5">
            <Store size={11} />
            {row.label}
            {row.isEstimate && (
              <span className="normal-case font-normal text-[10px] bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded-full border border-yellow-200">
                estimasi
              </span>
            )}
          </p>
          {row.value ? (
            <p className={`text-2xl font-black ${row.color}`}>{row.value}</p>
          ) : (
            <div>
              <p className="text-sm font-bold text-charcoal-lighter">
                Belum ada data
              </p>
              <p className="text-[11px] text-charcoal-lighter/70 mt-0.5 leading-snug">
                {row.hint}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const trips = useMemo(() => {
    try {
      return loadTrips();
    } catch {
      return [];
    }
  }, []);

  const upcomingTrip = trips[0] || null;
  const impact = useMemo(() => computeImpact(trips), [trips]);

  // Sapaan: nama dari trip jika ada, fallback generik
  const greeting = getGreeting();

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-fadeIn space-y-6">
      {/* ── Header ── */}
      <header>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-charcoal-lighter text-sm mt-0.5">{greeting}.</p>
      </header>

      {/* ── Bento layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Kartu kiri besar: Perjalanan Berikutnya */}
        <div className="lg:col-span-2">
          {upcomingTrip ? (
            <NextTripCard trip={upcomingTrip} />
          ) : (
            <EmptyTripCard />
          )}
        </div>

        {/* Kolom kanan: Dampak */}
        <div className="lg:col-span-1">
          <ImpactBlock impact={impact} />
        </div>
      </div>
    </div>
  );
}
