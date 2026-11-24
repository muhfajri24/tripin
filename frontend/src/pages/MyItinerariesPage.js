import React, { useState } from "react";
import { Link } from "react-router-dom";
import { loadTrips, deleteTrip } from "../services/itineraryStorage";
import { Notice, rupiah } from "../components/GuestUI";
export default function MyItinerariesPage() {
  const [state, setState] = useState(() => {
    try {
      return { trips: loadTrips(), error: "" };
    } catch (e) {
      return { trips: [], error: e.message };
    }
  });
  const [pending, setPending] = useState(null);
  function remove(id) {
    try {
      deleteTrip(id);
      setState({ trips: loadTrips(), error: "" });
      setPending(null);
    } catch (e) {
      setState((s) => ({ ...s, error: e.message }));
    }
  }
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="page-title">My Trips</h1>
          <p>
            Rencana tersimpan hanya pada browser ini. Tidak ada akun atau
            sinkronisasi.
          </p>
        </div>
        <Link className="btn-primary" to="/create">
          Plan a Trip
        </Link>
      </header>
      <Notice error>{state.error}</Notice>
      {!state.trips.length && !state.error && (
        <div className="card">
          <h2 className="font-bold text-xl">Belum ada perjalanan</h2>
          <p className="mt-2">
            Mulai dari brief atau form. Tidak ada trip contoh yang disimpan
            sebagai data Anda.
          </p>
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        {state.trips.map((t) => (
          <article className="card space-y-3" key={t.id}>
            <p className="eyebrow">
              {t.request.startDate} · {t.request.days} hari
            </p>
            <h2 className="text-xl font-bold">
              Yogyakarta · {t.request.travelers.adults} orang
            </h2>
            <p>
              {rupiah(t.totals.knownCostIdr)} diketahui/estimasi ·{" "}
              {t.totals.unknownCostItems} unknown
            </p>
            <div className="flex gap-3">
              <Link className="btn-secondary" to={`/itinerary/${t.id}`}>
                Buka trip
              </Link>
              <button
                className="text-red-700 underline"
                onClick={() => setPending(t.id)}
              >
                Hapus
              </button>
            </div>
            {pending === t.id && (
              <div role="alert" className="space-x-3">
                <span>Hapus trip dari browser ini·</span>
                <button
                  className="underline text-red-700"
                  onClick={() => remove(t.id)}
                >
                  Ya, hapus
                </button>
                <button className="underline" onClick={() => setPending(null)}>
                  Batal
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
