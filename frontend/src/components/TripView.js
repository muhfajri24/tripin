import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useMotionValue,
  animate,
} from "framer-motion";
import {
  ChevronDown,
  MapPin,
  Store,
  Sparkles,
  ExternalLink,
  Clock,
  Bookmark,
  Check,
  CheckCircle2,
  HelpCircle,
  Info,
  Pencil,
  Copy,
} from "lucide-react";
import MapView from "./MapView";
import { Notice, rupiah } from "./GuestUI";
import { navigationLinks } from "../services/googleMapsService";

const EASE = [0.22, 1, 0.36, 1];

const LEDGER_CATEGORY_LABELS = {
  admission: "Tiket masuk",
  ticket: "Tiket masuk",
  food: "Makan",
  lodging: "Penginapan",
  vehicle: "Transportasi",
  transport: "Transportasi",
  activity: "Aktivitas",
};

function formatJam24(stamp) {
  if (!stamp) return "";
  try {
    const d = new Date(stamp);
    const roundedMs = Math.round(d.getTime() / (5 * 60 * 1000)) * (5 * 60 * 1000);
    return new Date(roundedMs)
      .toLocaleTimeString("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .replace(":", ".");
  } catch {
    return "";
  }
}

function formatDayShort(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(`${dateStr}T12:00:00+07:00`);
    const weekday = d
      .toLocaleDateString("id-ID", { weekday: "short" })
      .replace(".", "");
    const day = d.toLocaleDateString("id-ID", { day: "numeric" });
    const month = d
      .toLocaleDateString("id-ID", { month: "short" })
      .replace(".", "");
    return `${weekday}, ${day} ${month}`;
  } catch {
    return dateStr;
  }
}

function formatDateRangeIndo(days) {
  if (!days || !days.length) return "";
  const first = days[0].date;
  const last = days[days.length - 1].date;
  const year = new Date(`${last}T12:00:00+07:00`).getFullYear();
  if (first === last) return `${formatDayShort(first)} ${year}`;
  return `${formatDayShort(first)} – ${formatDayShort(last)} ${year}`;
}

function formatKm(meters) {
  const km = ((meters || 0) / 1000).toFixed(1).replace(".", ",");
  return `${km} km`;
}

function shiftStamp(stamp, minutes) {
  return new Date(new Date(stamp).getTime() + minutes * 60000).toISOString();
}

function useCountUpOnce(target, reduced) {
  const mv = useMotionValue(0);
  const [val, setVal] = useState(reduced ? target : 0);
  const ran = useRef(false);

  useEffect(() => {
    if (reduced) {
      setVal(target);
      return;
    }
    if (ran.current) {
      setVal(target);
      return;
    }
    ran.current = true;
    const ctrl = animate(mv, target, { duration: 1.1, ease: EASE });
    const unsub = mv.on("change", (v) => setVal(v));
    return () => {
      ctrl.stop();
      unsub();
    };
  }, [target, reduced, mv]);

  return val;
}

function StopReasonAccordion({ place, reduced }) {
  const [open, setOpen] = useState(false);
  if (!place) return null;

  const jamLabel =
    place.openingEvidence?.status === "checked"
      ? "Jam buka terverifikasi"
      : "Jam buka belum terverifikasi";
  const hargaLabel =
    place.prices?.[0]?.evidence?.status === "checked"
      ? "Harga terverifikasi"
      : place.prices?.[0]?.amountIdr == null ? "Harga belum tersedia" : "Harga masih perkiraan";

  return (
    <div className="pt-2 border-t border-gray-100">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal hover:underline"
        aria-expanded={open}
      >
        <span>Mengapa tempat ini dipilih?</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: reduced ? 0 : 0.22, ease: EASE }}
        >
          <ChevronDown size={15} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: reduced ? 0 : 0.22, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
            className="mt-2 text-sm text-charcoal-lighter space-y-1 bg-sky/50 rounded-xl p-3"
          >
            <p>
              {jamLabel} · {hargaLabel}
            </p>
            {place.address && <p>Lokasi: {place.address}</p>}
            {place.identityEvidence?.sourceRef?.startsWith("https://") && (
              <a
                href={place.identityEvidence.sourceRef}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-teal underline font-semibold"
              >
                Sumber informasi <ExternalLink size={12} />
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TripView({
  trip,
  onSave,
  savedSuccess = false,
  editTo,
  editState,
}) {
  const reduced = useReducedMotion();
  const [selected, setSelected] = useState(0);
  const [focusedStopId, setFocusedStopId] = useState(null);
  const [focusPosition, setFocusPosition] = useState(null);
  const [showValidationPopover, setShowValidationPopover] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  const day = trip.days[Math.min(selected, trip.days.length - 1)];
  const byId = useMemo(
    () => Object.fromEntries(trip.places.map((p) => [p.id, p])),
    [trip.places],
  );
  const hotelName = trip.request.lodging
    ? byId[trip.request.lodging.placeId]?.name || "hotel pilihanmu"
    : null;
  const firstStop = day.stops[0];
  const suggestedDeparture = firstStop
    ? shiftStamp(firstStop.arrivalAt, -firstStop.incomingLeg.estimatedDurationMin - firstStop.incomingLeg.schedulingBufferMin)
    : null;
  const lastStop = day.stops[day.stops.length - 1];
  const suggestedReturn = lastStop && day.finalLeg
    ? shiftStamp(lastStop.departureAt, day.finalLeg.estimatedDurationMin + day.finalLeg.schedulingBufferMin)
    : null;
  const hasLunchStop = day.stops.some((stop) =>
    byId[stop.placeId]?.kind === "food" &&
    new Date(stop.arrivalAt).toLocaleTimeString("en-GB", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" }) < "14:00"
  );

  let links = [];
  let mapError = "";
  try {
    links = navigationLinks(day, trip.places);
  } catch (e) {
    mapError = e.message;
  }

  const totalStopsCount = useMemo(
    () => trip.days.reduce((sum, d) => sum + (d.stops?.length || 0), 0),
    [trip.days],
  );

  const eligible = trip.places.filter((p) => p.isLocalBusiness === true);
  const localItems = trip.ledger.filter((x) =>
    eligible.some((p) => p.id === x.placeId),
  );

  // Count-up stats
  const countedCost = Math.round(
    useCountUpOnce(trip.totals.knownCostIdr || 0, reduced),
  );
  const countedPlaces = Math.round(useCountUpOnce(totalStopsCount, reduced));
  const countedTravelMin = Math.round(
    useCountUpOnce(trip.totals.travelMin || 0, reduced),
  );

  // Budget completeness count
  const totalLedgerCount = trip.ledger.length;
  const pricedLedgerCount = trip.ledger.filter((x) => x.totalIdr != null).length;
  const pricedRatio =
    totalLedgerCount > 0 ? (pricedLedgerCount / totalLedgerCount) * 100 : 0;

  // Deduplicated & grouped travel notes
  const groupedNotes = useMemo(() => {
    const items = [];
    const seen = new Set();
    const unverifiedOpeningPlaces = [];
    const estimatedDurationPlaces = [];

    for (const p of trip.places) {
      if (p.openingEvidence?.status !== "verified") {
        unverifiedOpeningPlaces.push(p.name);
      }
      if (p.durationEvidence?.status !== "verified") {
        estimatedDurationPlaces.push(p.name);
      }
    }

    if (estimatedDurationPlaces.length > 0) {
      items.push("Durasi kunjungan di setiap tempat adalah perkiraan.");
    }
    if (unverifiedOpeningPlaces.length > 0) {
      items.push(
        `Jam buka belum terverifikasi untuk: ${unverifiedOpeningPlaces.join(", ")}.`,
      );
    }

    for (const u of trip.uncertainties || []) {
      const clean = u.trim();
      if (clean && !seen.has(clean)) {
        seen.add(clean);
        items.push(clean);
      }
    }
    for (const v of trip.violations || []) {
      const clean = v.message?.trim();
      if (clean && !seen.has(clean)) {
        seen.add(clean);
        items.push(clean);
      }
    }
    return items;
  }, [trip.places, trip.uncertainties, trip.violations]);

  const mapActivities = useMemo(
    () =>
      day.stops.map((s) => ({
        id: s.id,
        name: byId[s.placeId]?.name,
        lat: byId[s.placeId]?.coordinates?.lat,
        lng: byId[s.placeId]?.coordinates?.lng,
        time: formatJam24(s.arrivalAt),
        duration: `${s.visitDurationMin} menit`,
      })),
    [day.stops, byId],
  );

  const handleStopClick = (stop) => {
    const place = byId[stop.placeId];
    setFocusedStopId(stop.id);
    if (
      place?.coordinates &&
      Number.isFinite(place.coordinates.lat) &&
      Number.isFinite(place.coordinates.lng)
    ) {
      setFocusPosition({
        lat: place.coordinates.lat,
        lng: place.coordinates.lng,
        key: `${stop.id}-${Date.now()}`,
      });
    }
  };

  const destName =
    trip.request?.destinationName || (trip.request?.destinationId === "yogyakarta"
      ? "Yogyakarta"
      : trip.request?.destinationId || "Yogyakarta");

  const [copiedRoute, setCopiedRoute] = useState(false);

  const allDayRouteLinks = useMemo(
    () =>
      trip.days.map((d, idx) => {
        try {
          return { dayIndex: idx + 1, urls: navigationLinks(d, trip.places) };
        } catch {
          return { dayIndex: idx + 1, urls: [] };
        }
      }),
    [trip.days, trip.places],
  );

  const handleCopyRoutes = () => {
    const allUrls = allDayRouteLinks.flatMap((d) => d.urls);
    if (!allUrls.length) return;
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(allUrls.join("\n")).catch(() => {});
    }
    setCopiedRoute(true);
    setTimeout(() => setCopiedRoute(false), 2200);
  };

  const costLabel =
    totalLedgerCount > 0 && pricedRatio < 50
      ? "Belum lengkap"
      : totalLedgerCount > 0 && pricedRatio < 100
      ? `${rupiah(countedCost)}+`
      : rupiah(countedCost);

  return (
    <div className="space-y-6 text-[15px]">
      {/* 1. Kartu Ringkasan Bersih Deep Teal */}
      <header
        className="relative rounded-3xl p-6 sm:p-8 text-[#FFF9F0] shadow-card space-y-6"
        style={{
          background:
            "linear-gradient(135deg, #0d2221 0%, #173b39 65%, #1e4a47 100%)",
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-white/70">
              {formatDateRangeIndo(trip.days)} · revisi {trip.revision}
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#FFF9F0]">
              {trip.title || `${destName} · ${trip.request.days} hari`}
            </h1>
          </div>

          {/* Chip Validasi + Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowValidationPopover((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-[#FFF9F0] border border-white/15 transition-colors"
            >
              <Info size={13} className="text-[#2EC4B6]" />
              <span>Data sebagian masih perkiraan</span>
            </button>

            <AnimatePresence>
              {showValidationPopover && (
                <motion.div
                  initial={reduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
                  className="absolute right-0 top-full mt-2 z-30 w-72 bg-white text-charcoal rounded-2xl p-4 shadow-xl border border-gray-200 text-sm space-y-1"
                >
                  <p className="font-bold">Catatan keakuratan data</p>
                  <p className="text-xs text-charcoal-lighter leading-relaxed">
                    Sebagian harga atau jam buka tempat masih berupa perkiraan dan
                    tidak menjamin kondisi lalu lintas maupun ketersediaan di lokasi.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 3 Angka Besar dengan Count-up */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-white/10">
          <div>
            <p className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
              <span>Perkiraan biaya</span>
              <span className="px-1.5 py-0.5 rounded-full bg-white/15 text-[10px] text-[#F4A261]">
                estimasi
              </span>
            </p>
            <p className="text-2xl sm:text-3xl font-black text-[#FFF9F0] mt-1">
              {costLabel}
            </p>
            <p className="text-xs text-white/80 mt-1">
              Budget tercatat: {rupiah(trip.request.budget.totalIdr)} total
              {trip.request.budget.originalBasis === "person" ? " (input per orang)" : " (input rombongan)"}
            </p>
            {totalLedgerCount > 0 && pricedRatio < 100 && (
              <p className="text-xs text-white/75 mt-0.5">
                baru {pricedLedgerCount} dari {totalLedgerCount} komponen berharga
              </p>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-white/70">Jumlah tempat</p>
            <p className="text-2xl sm:text-3xl font-black text-[#FFF9F0] mt-1">
              {countedPlaces} tempat
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-white/70">
              Total waktu di jalan
            </p>
            <p className="text-2xl sm:text-3xl font-black text-[#FFF9F0] mt-1">
              {countedTravelMin} menit
            </p>
          </div>
        </div>

        {/* Aksi: 1 Tombol Oranye Utama + 2 Sekunder Outline */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {onSave && (
            <motion.button
              type="button"
              disabled={savedSuccess}
              onClick={onSave}
              whileTap={reduced || savedSuccess ? {} : { scale: 0.97 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-colors disabled:opacity-90 disabled:cursor-default"
              style={{
                background: savedSuccess ? "#2EC4B6" : "#F4A261",
                color: "#0B3B45",
              }}
            >
              {savedSuccess ? <Check size={16} /> : <Bookmark size={15} />}
              <span>{savedSuccess ? "Tersimpan" : "Simpan itinerary"}</span>
            </motion.button>
          )}

          {savedSuccess && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/15 text-xs font-semibold text-[#FBF5E9]">
              <span>Tersimpan di My Itineraries</span>
              <Link to="/my-itineraries" className="underline text-[#F4A261]">
                Buka
              </Link>
            </span>
          )}

          {links[0] && (
            <a
              href={links[0]}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm border border-white/30 text-[#FFF9F0] hover:bg-white/10 transition-colors"
            >
              <span>Buka di Google Maps</span>
              <ExternalLink size={14} />
            </a>
          )}

          {editTo && (
            <Link
              to={editTo}
              state={editState}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm border border-white/30 text-[#FFF9F0] hover:bg-white/10 transition-colors"
            >
              <Pencil size={14} />
              <span>Ubah jadwal</span>
            </Link>
          )}
        </div>
      </header>

      {/* 2. Tab Hari: hanya tampil jika perjalanan lebih dari 1 hari */}
      {trip.days.length > 1 && (
        <div
          className="inline-flex flex-wrap gap-1 bg-white p-1.5 rounded-2xl shadow-soft border border-gray-100"
          role="group"
          aria-label="Pilih hari"
        >
          {trip.days.map((d, i) => {
            const isActive = i === selected;
            return (
              <button
                key={d.date}
                type="button"
                onClick={() => {
                  setSelected(i);
                  setFocusedStopId(null);
                  setFocusPosition(null);
                }}
                className={`relative px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                  isActive ? "text-white" : "text-charcoal-lighter hover:text-charcoal"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="resultDayPill"
                    transition={
                      reduced
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 380, damping: 30 }
                    }
                    className="absolute inset-0 rounded-xl bg-teal"
                    style={{ zIndex: 0 }}
                  />
                )}
                <span className="relative z-10">
                  Hari {i + 1} · {formatDayShort(d.date)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 3. Rundown lebih dulu, lalu peta pada layar kecil. */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* Kiri: Timeline */}
        <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-soft border border-gray-100 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl font-extrabold text-charcoal">
              Jadwal Hari {selected + 1}
            </h2>
            <span className="text-xs text-charcoal-lighter">
              Klik kartu untuk fokus peta
            </span>
          </div>

          {suggestedDeparture && (
            <div className="rounded-2xl border border-teal/25 bg-sky/40 p-4 space-y-1" role="note">
              <p className="text-sm font-extrabold text-teal">Berangkat {formatJam24(suggestedDeparture)}</p>
              <p className="text-sm text-charcoal">Dari {hotelName || "titik awal perjalanan"} menuju {byId[firstStop.placeId]?.name || "destinasi pertama"}.</p>
              <p className="text-xs text-charcoal-lighter">Waktu jalan sekitar {firstStop.incomingLeg.estimatedDurationMin} menit, ditambah {firstStop.incomingLeg.schedulingBufferMin} menit jeda. Periksa kondisi jalan sebelum berangkat.</p>
            </div>
          )}

          {!hasLunchStop && <p className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-charcoal">Jeda makan siang disarankan sekitar 12.00–13.00. Tempat makan belum dipilih dalam rundown ini.</p>}

          {!day.stops.length && (
            <p className="text-base text-charcoal-lighter">
              Tidak ada aktivitas terpilih pada hari ini.
            </p>
          )}

          {day.stops.length > 0 && (
            <div className="relative pl-6">
              <motion.div
                key={`line-${selected}`}
                initial={{ scaleY: reduced ? 1 : 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: reduced ? 0 : 0.7, ease: EASE }}
                className="absolute left-2 top-2 bottom-2 w-0.5 bg-teal/30 origin-top"
              />

              <motion.div
                key={`stops-${selected}`}
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: {
                    transition: { staggerChildren: reduced ? 0 : 0.08 },
                  },
                }}
                className="space-y-2"
              >
                {day.stops.map((s, idx) => {
                  const place = byId[s.placeId];
                  const isFocused = focusedStopId === s.id;
                  const showUmkm = place?.isLocalBusiness === true;
                  const showHiddenGem = place?.isHiddenGem === true;
                  const visitCost = trip.ledger.find((item) => item.placeId === s.placeId && (item.category === "ticket" || item.category === "food"));

                  return (
                    <React.Fragment key={s.id}>
                      {/* Baris kecil waktu perjalanan di antara kartu */}
                      {idx > 0 && (
                        <p className="text-xs text-charcoal-lighter py-1 pl-1">
                          ↓ {s.incomingLeg.estimatedDurationMin} menit perjalanan
                          {s.incomingLeg.schedulingBufferMin > 0
                            ? ` · +${s.incomingLeg.schedulingBufferMin} menit jeda`
                            : ""}
                        </p>
                      )}

                      <motion.article
                        onClick={() => handleStopClick(s)}
                        variants={{
                          hidden: { opacity: 0, y: reduced ? 0 : 16 },
                          visible: {
                            opacity: 1,
                            y: 0,
                            transition: {
                              duration: reduced ? 0 : 0.4,
                              ease: EASE,
                            },
                          },
                        }}
                        className={`relative rounded-2xl p-4 border transition-colors cursor-pointer space-y-2 ${
                          isFocused
                            ? "border-teal bg-sky/40"
                            : "border-gray-200 bg-gray-50/50 hover:border-teal/60"
                        }`}
                      >
                        <span
                          className="absolute -left-[25px] top-4 w-5 h-5 rounded-full text-[10px] font-extrabold flex items-center justify-center border-2 border-white shadow-sm"
                          style={{ background: "#F4A261", color: "#0B3B45" }}
                        >
                          {idx + 1}
                        </span>

                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm text-teal font-bold flex items-center gap-1.5">
                            <Clock size={13} />
                            {formatJam24(s.arrivalAt)} –{" "}
                            {formatJam24(s.departureAt)}
                          </p>

                          <div className="flex flex-wrap gap-1.5">
                            {showUmkm && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                                <Store size={11} /> UMKM
                              </span>
                            )}
                            {showHiddenGem && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
                                <Sparkles size={11} /> Hidden Gem
                              </span>
                            )}
                          </div>
                        </div>

                        <h3 className="font-bold text-charcoal text-base flex items-center gap-1.5">
                          <MapPin
                            size={15}
                            className="text-coral flex-shrink-0"
                          />
                          <span>{place?.name || s.placeId}</span>
                        </h3>
                        {place?.kind === "food" && <p className="text-xs font-bold text-teal">{formatJam24(s.arrivalAt) < "14.00" ? "Waktu makan siang" : "Waktu makan sore/malam"}</p>}

                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm text-charcoal-lighter">
                            {s.visitDurationMin} menit
                            {s.incomingLeg?.distanceMeters > 0
                              ? ` · ${formatKm(s.incomingLeg.distanceMeters)} ${
                                  idx === 0 ? "dari titik awal" : "dari tempat sebelumnya"
                                }`
                              : ""}
                          </p>
                          {place?.coordinates && (
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${place.coordinates.lat},${place.coordinates.lng}&travelmode=driving`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-xs font-bold text-teal hover:underline"
                            >
                              <span>Petunjuk arah</span>
                              <ExternalLink size={11} />
                            </a>
                          )}
                        </div>

                        <p className="text-xs font-semibold text-charcoal-lighter">
                          {visitCost?.totalIdr == null
                            ? "Harga kunjungan belum tersedia"
                            : `${visitCost.evidence?.sourceType === "user" ? "Estimasi dari kamu" : "Harga katalog"}: ${rupiah(visitCost.totalIdr)} untuk ${visitCost.quantity} unit`}
                        </p>

                        <StopReasonAccordion place={place} reduced={reduced} />
                      </motion.article>
                    </React.Fragment>
                  );
                })}
              </motion.div>
            </div>
          )}
          {suggestedReturn && <p className="rounded-2xl border border-teal/25 bg-sky/40 p-4 text-sm text-charcoal"><strong className="text-teal">Sekitar {formatJam24(suggestedReturn)}</strong> tiba di {hotelName || "titik akhir perjalanan"}. Ini perkiraan, bukan waktu lalu lintas langsung.</p>}
        </section>

        {/* Kanan: Peta Sticky (tampil di atas timeline pada mobile) */}
        <section className="space-y-3 lg:sticky lg:top-6">
          <MapView
            key={`map-${selected}`}
            activities={mapActivities}
            center={[day.startAnchor.lat, day.startAnchor.lng]}
            height="440px"
            animateRoute
            pulseNext
            focusPosition={focusPosition}
          />
          <Notice error>{mapError}</Notice>

          {allDayRouteLinks.some((d) => d.urls.length > 0) && (
            <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-soft border border-gray-100 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-extrabold text-charcoal">
                    Rute perjalanan
                  </h2>
                  <p className="text-xs text-charcoal-lighter">
                    Klik peta untuk zoom gulir · Klik kartu untuk fokus lokasi
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyRoutes}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-gray-200 hover:border-teal text-charcoal transition-colors"
                >
                  {copiedRoute ? <Check size={13} className="text-teal" /> : <Copy size={13} />}
                  <span>{copiedRoute ? "Tersalin" : "Salin tautan rute"}</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {allDayRouteLinks.map((d) =>
                  d.urls.map((url, partIdx) => (
                    <a
                      key={`${d.dayIndex}-${partIdx}`}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-sky text-teal hover:bg-teal hover:text-white transition-colors"
                    >
                      <span>
                        Buka rute Hari {d.dayIndex} di Google Maps
                        {d.urls.length > 1 ? ` · Bagian ${partIdx + 1}` : ""}
                      </span>
                      <ExternalLink size={13} />
                    </a>
                  )),
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* 4. Satu Kartu Ringkas Biaya + Lipatan Rincian */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-soft border border-gray-100 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-charcoal">
                Perkiraan biaya ({trip.request.travelers.adults} orang)
              </h2>
              <span className="text-[11px] font-semibold bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full border border-yellow-200">
                estimasi
              </span>
            </div>
            <p className="text-2xl font-black text-teal">{costLabel}</p>
          </div>

          <div className="w-full sm:w-64 space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-charcoal-lighter">
              <span>Kelengkapan harga</span>
              <span>
                {pricedLedgerCount} dari {totalLedgerCount} komponen
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal rounded-full"
                style={{ width: `${pricedRatio}%` }}
              />
            </div>
            <p className="text-xs text-charcoal-lighter">
              {pricedLedgerCount} dari {totalLedgerCount} komponen sudah ada
              harganya
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setBudgetOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-teal hover:underline"
            aria-expanded={budgetOpen}
          >
            <span>Lihat rincian biaya</span>
            <motion.span
              animate={{ rotate: budgetOpen ? 180 : 0 }}
              transition={{ duration: reduced ? 0 : 0.22, ease: EASE }}
            >
              <ChevronDown size={16} />
            </motion.span>
          </button>

          <AnimatePresence initial={false}>
            {budgetOpen && (
              <motion.div
                initial={reduced ? { opacity: 1 } : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
                transition={{ duration: reduced ? 0 : 0.25, ease: EASE }}
                className="overflow-x-auto pt-4"
              >
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-charcoal-lighter text-xs">
                      <th className="pb-2">Komponen</th>
                      <th className="pb-2">Jumlah</th>
                      <th className="pb-2">Tarif satuan (estimasi)</th>
                      <th className="pb-2">Total (estimasi)</th>
                      <th className="pb-2 text-center">Status data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trip.ledger.map((x) => {
                      const catLabel =
                        LEDGER_CATEGORY_LABELS[x.category] || x.category;
                      const isVerified = x.evidence?.status === "checked";
                      return (
                        <tr className="border-t border-gray-100" key={x.id}>
                          <td className="py-3 pr-3 font-medium text-charcoal">
                            {catLabel} ·{" "}
                            {byId[x.placeId]?.name || "Kendaraan per hari"}
                          </td>
                          <td>{x.quantity}</td>
                          <td>
                            {x.unitAmountIdr == null ? (
                              <span
                                title="Harga belum tersedia dari sumber"
                                className="text-charcoal-lighter cursor-help"
                              >
                                –
                              </span>
                            ) : (
                              rupiah(x.unitAmountIdr)
                            )}
                          </td>
                          <td className="font-semibold">
                            {x.totalIdr == null ? (
                              <span
                                title="Harga belum tersedia dari sumber"
                                className="text-charcoal-lighter cursor-help"
                              >
                                –
                              </span>
                            ) : (
                              rupiah(x.totalIdr)
                            )}
                          </td>
                          <td className="text-center">
                            {isVerified ? (
                              <span
                                title="Data terverifikasi dari sumber"
                                className="inline-flex text-emerald-600"
                              >
                                <CheckCircle2 size={16} />
                              </span>
                            ) : (
                              <span
                                title="Data masih berupa perkiraan atau belum diverifikasi"
                                className="inline-flex text-amber-500"
                              >
                                <HelpCircle size={16} />
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* 5. Catatan Perjalanan (Dikelompokkan & Dideduplikasi) */}
      {groupedNotes.length > 0 && (
        <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-soft border border-gray-100">
          <button
            type="button"
            onClick={() => setNotesOpen((o) => !o)}
            className="w-full flex items-center justify-between gap-3 text-left"
            aria-expanded={notesOpen}
          >
            <span className="font-bold text-base text-charcoal">
              Catatan perjalanan ({groupedNotes.length})
            </span>
            <motion.span
              animate={{ rotate: notesOpen ? 180 : 0 }}
              transition={{ duration: reduced ? 0 : 0.22, ease: EASE }}
              className="text-charcoal-lighter"
            >
              <ChevronDown size={18} />
            </motion.span>
          </button>

          <AnimatePresence initial={false}>
            {notesOpen && (
              <motion.ul
                initial={reduced ? { opacity: 1 } : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
                transition={{ duration: reduced ? 0 : 0.22, ease: EASE }}
                className="list-disc pl-5 pt-3 space-y-1.5 text-sm text-charcoal-lighter"
              >
                {groupedNotes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </section>
      )}

      {/* 6. Dampak Lokal: HANYA tampil jika jumlah UMKM > 0 */}
      {eligible.length > 0 && (
        <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-soft border border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Store size={18} />
            </div>
            <div>
              <h2 className="font-bold text-charcoal text-base">
                Dampak ke usaha lokal
              </h2>
              <p className="text-sm text-charcoal-lighter">
                {eligible.length} UMKM lokal masuk dalam rencanamu
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs text-charcoal-lighter">
              Perkiraan belanja lokal (estimasi)
            </p>
            <p className="text-lg font-black text-emerald-700">
              {rupiah(localItems.reduce((s, x) => s + (x.totalIdr || 0), 0))}
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
