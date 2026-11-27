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
  const [savedSuccess, setSavedSuccess] = useState(false);

  const trip = loaded.trip;

  if (!trip)
    return (
      <div className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100 space-y-3">
        <h1 className="page-title">Trip tidak ditemukan</h1>
        <Notice error>{error}</Notice>
        <p className="text-base text-charcoal-lighter">
          ID ini tidak tersedia pada peramban ini. Trip tidak disinkronkan
          antarperangkat.
        </p>
        <Link className="btn-primary inline-block" to="/my-itineraries">
          My Itineraries
        </Link>
      </div>
    );

  const handleSave = () => {
    try {
      saveTrip(trip);
      setError("");
      setSavedSuccess(true);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 text-[15px]">
      <header className="flex flex-wrap items-center justify-between gap-2 text-xs text-charcoal-lighter">
        <span>Hasil Itinerary · revisi {trip.revision ?? 1}</span>
        <Link
          to="/create"
          state={{ resumePhase: 2, promptText: location.state?.promptText || "" }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-charcoal font-semibold transition-colors"
        >
          Mulai lagi
        </Link>
      </header>
      <Notice error>{error}</Notice>
      <TripView
        trip={trip}
        editTo={`/itinerary/${id}/edit`}
        editState={{ trip }}
        onSave={handleSave}
        savedSuccess={savedSuccess}
      />
    </div>
  );
}
