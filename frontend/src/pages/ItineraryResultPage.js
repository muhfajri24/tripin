import React, { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { resolveTrip, saveTrip } from "../services/itineraryStorage";
import TripView from "../components/TripView";
import { Notice } from "../components/GuestUI";
export default function ItineraryResultPage() {
  const { id } = useParams();
  const location = useLocation();
  const [loaded] = useState(() => {
    const resolved = resolveTrip(id, location.state?.trip);
    return { ...resolved, error: resolved.error || location.state?.storageError || "" };
  });
  const [error, setError] = useState(loaded.error);
  const [saved, setSaved] = useState("");
  const trip = loaded.trip;
  if (!trip)
    return (
      <div className="card space-y-3">
        <h1 className="page-title">Trip tidak ditemukan</h1>
        <Notice error>{error}</Notice>
        <p>
          ID ini tidak tersedia pada browser ini. Trip tidak disinkronkan
          antarperangkat.
        </p>
        <Link className="btn-primary" to="/my-itineraries">
          My Trips
        </Link>
      </div>
    );
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-fadeIn">
      <header className="relative rounded-3xl overflow-hidden shadow-soft bg-charcoal text-white p-6 sm:p-8 min-h-56 flex flex-wrap items-end justify-between gap-4" style={{backgroundImage: "linear-gradient(0deg, rgba(0,0,0,.8), rgba(0,0,0,.5)), url(/images/hero/hero-malioboro.jpg)", backgroundSize: "cover"}}>
        <div>
          <p className="text-xs uppercase tracking-widest font-bold mb-2">Trip tamu - revisi {trip.revision}</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Yogyakarta, {trip.request.days} hari</h1>
        </div>
        <Link
          className="btn-primary"
          to={`/itinerary/${id}/edit`}
          state={{ trip }}
        >
          Edit & reschedule
        </Link>
      </header>
      <Notice error>{error}</Notice>
      <Notice>{saved}</Notice>
      <button
        className="btn-secondary"
        onClick={() => {
          try {
            saveTrip(trip);
            setError("");
            setSaved("Tersimpan pada browser ini.");
          } catch (e) {
            setError(e.message);
          }
        }}
      >
        Simpan ulang
      </button>
      <TripView trip={trip} />
    </div>
  );
}
