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
    return {
      ...resolved,
      error: resolved.error || location.state?.storageError || "",
    };
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
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Trip tamu · revisi {trip.revision}</p>
          <h1 className="page-title">Yogyakarta, {trip.request.days} hari</h1>
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
