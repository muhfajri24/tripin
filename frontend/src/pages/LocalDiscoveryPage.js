import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { listPlaces } from "../services/plannerApi";
import { Notice, PlaceDetails } from "../components/GuestUI";
export default function LocalDiscoveryPage() {
  const [params, setParams] = useSearchParams();
  const [places, setPlaces] = useState([]);
  const [kind, setKind] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [retry, setRetry] = useState(0);
  const q = params.get("q") || "";
  useEffect(() => {
    const c = new AbortController();
    setBusy(true);
    setError("");
    listPlaces(c.signal)
      .then((d) => setPlaces(d.places))
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!c.signal.aborted) setBusy(false);
      });
    return () => c.abort();
  }, [retry]);
  const filtered = places.filter(
    (p) =>
      (!kind || p.kind === kind) &&
      `${p.name} ${p.address || ""} ${p.categories.join(" ")}`
        .toLowerCase()
        .includes(q.toLowerCase()),
  );
  return (
    <div className="space-y-5">
      <header>
        <p className="eyebrow">Dataset pilot bersumber</p>
        <h1 className="page-title">Explore Yogyakarta</h1>
        <p>
          Periksa kandidat dan kelengkapan data sebelum merencanakan kunjungan.
        </p>
      </header>
      <div className="flex flex-wrap gap-3">
        <label className="field flex-1">
          Cari tempat
          <input
            value={q}
            onChange={(e) =>
              setParams(e.target.value ? { q: e.target.value } : {})
            }
            placeholder="Nama, kategori, alamat"
          />
        </label>
        <label className="field">
          Kategori
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="">Semua</option>
            <option value="attraction">Wisata/budaya</option>
            <option value="food">Kuliner</option>
            <option value="lodging">Penginapan</option>
          </select>
        </label>
      </div>
      <Notice error>{error}</Notice>
      {error && (
        <button
          className="btn-secondary"
          onClick={() => setRetry((n) => n + 1)}
        >
          Coba lagi
        </button>
      )}
      {busy ? (
        <Notice>Memuat katalog backend?</Notice>
      ) : (
        <p>{filtered.length} kandidat ? tidak semua metadata terverifikasi.</p>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((p) => (
          <article className="card space-y-3" key={p.id}>
            <p className="eyebrow">{p.kind}</p>
            <h2 className="text-xl font-bold">{p.name}</h2>
            <PlaceDetails place={p} />
            {!p.coordinates && (
              <Notice>Belum routable; koordinat perlu diverifikasi.</Notice>
            )}
            <Link className="btn-secondary" to="/create">
              Rencanakan trip
            </Link>
          </article>
        ))}
      </div>
      {!busy && !error && !filtered.length && (
        <Notice>
          Tidak ada kandidat yang cocok. Ubah pencarian atau kategori.
        </Notice>
      )}
    </div>
  );
}
