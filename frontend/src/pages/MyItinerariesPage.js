import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Calendar,
  Users,
  MapPin,
  Trash2,
  ArrowRight,
  Plus,
  Compass,
  AlertTriangle,
  Clock,
  Sparkles,
} from "lucide-react";
import { loadTrips, deleteTrip } from "../services/itineraryStorage";
import { Notice, rupiah } from "../components/GuestUI";
import { toast } from "../motion/Toast";

const EASE = [0.22, 1, 0.36, 1];

function formatTripTitle(trip) {
  if (trip.title && !trip.title.toLowerCase().startsWith("itinerary")) {
    return trip.title;
  }
  const dest = trip.request?.destinationId || "";
  let cityName = "Nusantara";
  if (dest) {
    cityName = dest
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  } else if (trip.places?.[0]?.city) {
    cityName = trip.places[0].city;
  }
  const days = trip.request?.days || (trip.places?.length ? Math.max(1, Math.ceil(trip.places.length / 3)) : 1);
  return `Jelajah ${cityName} (${days} Hari)`;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(`${dateStr}T12:00:00+07:00`);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function MyItinerariesPage() {
  const navigate = useNavigate();
  const reduced = useReducedMotion();

  const [state, setState] = useState(() => {
    try {
      return { trips: loadTrips(), error: "" };
    } catch (e) {
      return { trips: [], error: e.message };
    }
  });

  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const refreshTrips = () => {
    try {
      setState({ trips: loadTrips(), error: "" });
    } catch (e) {
      setState((s) => ({ ...s, error: e.message }));
    }
  };

  useEffect(() => {
    refreshTrips();
    window.addEventListener("tripin:trips-changed", refreshTrips);
    window.addEventListener("storage", refreshTrips);
    return () => {
      window.removeEventListener("tripin:trips-changed", refreshTrips);
      window.removeEventListener("storage", refreshTrips);
    };
  }, []);

  const handleConfirmDelete = (id) => {
    try {
      deleteTrip(id);
      refreshTrips();
      setPendingDeleteId(null);
      window.dispatchEvent(new Event("tripin:trips-changed"));
      toast.info("Perjalanan telah dihapus dari peramban");
    } catch (e) {
      setState((s) => ({ ...s, error: e.message }));
    }
  };

  const tripToDelete = state.trips.find((t) => t.id === pendingDeleteId);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 text-[#0B3B45]">
      {/* ── HEADER HALAMAN ── */}
      <header className="flex flex-wrap items-center justify-between gap-4 pt-2 border-b border-gray-100/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0A1A1C]">
              Rencana Perjalanan
            </h1>
            {state.trips.length > 0 && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#D5F5F1] text-[#0B4F5C]">
                {state.trips.length} tersimpan
              </span>
            )}
          </div>
          <p className="text-sm text-[#0B3B45]/70 mt-1">
            Rencana tersimpan secara lokal pada peramban ini tanpa akun.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/create")}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm bg-[#F4A261] text-[#0B3B45] hover:brightness-95 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#2EC4B6]"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Susun Rencana Baru</span>
        </button>
      </header>

      <Notice error>{state.error}</Notice>

      {/* ── KONDISI KOSONG (EMPTY STATE) ── */}
      {!state.trips.length && !state.error && (
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="bg-white rounded-3xl p-8 sm:p-12 text-center shadow-soft border border-gray-100 max-w-xl mx-auto space-y-4 my-8"
        >
          <div className="w-16 h-16 rounded-full bg-[#D5F5F1] text-[#0B4F5C] flex items-center justify-center mx-auto shadow-inner">
            <Compass size={32} />
          </div>

          <div className="space-y-1.5">
            <h2 className="font-extrabold text-xl text-[#0A1A1C]">
              Belum ada perjalanan
            </h2>
            <p className="text-sm text-[#0B3B45]/70 leading-relaxed max-w-md mx-auto">
              Mulai dari brief atau formulir selera. Rencana perjalanan yang kamu
              susun akan otomatis tersimpan di sini secara aman.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate("/create")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-[#0B4F5C] text-[#FBF5E9] hover:bg-[#083b45] shadow-md transition-all"
            >
              <Sparkles size={16} />
              <span>Susun Perjalanan Pertama</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* ── GRID KARTU PERJALANAN ── */}
      {state.trips.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {state.trips.map((t, idx) => {
            const placesCount = t.places?.length || 0;
            const adults = t.request?.travelers?.adults || 1;
            const days = t.request?.days || 1;
            const startDateFormatted = t.request?.startDate
              ? formatDate(t.request.startDate)
              : "";
            const title = formatTripTitle(t);
            const knownCost = t.totals?.knownCostIdr || 0;
            const unknownCount = t.totals?.unknownCostItems || 0;

            return (
              <motion.article
                key={t.id}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: reduced ? 0 : 0.4,
                  delay: reduced ? 0 : idx * 0.06,
                  ease: EASE,
                }}
                className="bg-white rounded-3xl p-6 sm:p-7 shadow-soft border border-gray-100/90 flex flex-col justify-between hover:border-gray-200 hover:shadow-card transition-all group"
              >
                <div className="space-y-4">
                  {/* Meta Baris Atas: Tanggal & Durasi */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B4F5C] bg-[#D5F5F1]/70 px-3 py-1 rounded-full">
                      <Calendar size={13} />
                      <span>
                        {startDateFormatted ? `${startDateFormatted} · ` : ""}
                        {days} Hari
                      </span>
                    </div>

                    <div className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B3B45]/70">
                      <Users size={13} />
                      <span>{adults} orang</span>
                    </div>
                  </div>

                  {/* Judul Perjalanan */}
                  <div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-[#0A1A1C] leading-snug group-hover:text-[#0B4F5C] transition-colors">
                      {title}
                    </h2>
                    <p className="text-xs text-[#0B3B45]/65 mt-1 flex items-center gap-1.5">
                      <MapPin size={12} className="text-[#F4A261]" />
                      <span>{placesCount} tempat dikunjungi</span>
                    </p>
                  </div>

                  {/* Cuplikan Tempat (Maksimal 3) */}
                  {t.places && t.places.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {t.places.slice(0, 3).map((p) => (
                        <span
                          key={p.id}
                          className="text-[11px] font-semibold bg-[#FBF5E9] text-[#0B3B45]/80 px-2.5 py-1 rounded-lg border border-gray-200/50 truncate max-w-[180px]"
                        >
                          {p.name}
                        </span>
                      ))}
                      {t.places.length > 3 && (
                        <span className="text-[11px] font-bold text-[#0B3B45]/50 px-1 py-1">
                          +{t.places.length - 3} lainnya
                        </span>
                      )}
                    </div>
                  )}

                  {/* Estimasi Biaya Jujur */}
                  <div className="p-3.5 rounded-2xl bg-[#FBF5E9]/70 border border-gray-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[#0B3B45]/60 font-medium block">
                        Perkiraan biaya
                      </span>
                      <span className="font-extrabold text-[#0A1A1C] text-sm">
                        {rupiah(knownCost)}
                      </span>
                    </div>
                    {unknownCount > 0 ? (
                      <span className="text-[11px] font-semibold text-[#0B4F5C] bg-[#D5F5F1] px-2 py-0.5 rounded-full">
                        +{unknownCount} tarif variatif
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        terinci
                      </span>
                    )}
                  </div>
                </div>

                {/* Tombol Aksi */}
                <div className="flex items-center justify-between gap-3 pt-5 mt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setPendingDeleteId(t.id)}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                    title="Hapus perjalanan ini"
                  >
                    <Trash2 size={14} />
                    <span>Hapus</span>
                  </button>

                  <Link
                    to={`/itinerary/${t.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-[#0B4F5C] text-[#FBF5E9] hover:bg-[#083b45] shadow-sm transition-all group-hover:shadow"
                  >
                    <span>Buka Rencana</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      {/* ── MODAL KONFIRMASI HAPUS PERJALANAN ── */}
      <AnimatePresence>
        {pendingDeleteId && (
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
                  Hapus Perjalanan?
                </h3>
                <p className="text-xs text-[#0B3B45]/75 leading-relaxed">
                  Rencana{" "}
                  <strong>
                    {tripToDelete ? formatTripTitle(tripToDelete) : "ini"}
                  </strong>{" "}
                  akan dihapus secara permanen dari peramban ini.
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setPendingDeleteId(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-[#0B3B45] hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmDelete(pendingDeleteId)}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors shadow-sm"
                >
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
