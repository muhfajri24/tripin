import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { listPlaces, listDemoPlaces } from "../services/plannerApi";
import { Notice, PlaceDetails } from "../components/GuestUI";
export default function LocalDiscoveryPage() {
  const [params, setParams] = useSearchParams();
  const [places, setPlaces] = useState([]);
  const [kind, setKind] = useState("");
  const [source, setSource] = useState("yogyakarta");
  const [area, setArea] = useState("Jakarta");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [retry, setRetry] = useState(0);
  const q = params.get("q") || "";
  useEffect(() => {
    const c = new AbortController();
    setBusy(true);
    setError("");
    setPlaces([]);
    (source === "jabodetabek" ? listDemoPlaces(area, c.signal) : listPlaces(c.signal))
      .then((d) => { if (!c.signal.aborted) setPlaces(d.places); })
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!c.signal.aborted) setBusy(false);
      });
    return () => c.abort();
  }, [retry, source, area]);
  const filtered = places.filter(
    (p) =>
      (!kind || p.kind === kind) &&
      `${p.name} ${p.address || ""} ${(p.categories || []).join(" ")}`
        .toLowerCase()
        .includes(q.toLowerCase()),
  );
  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-12 animate-fadeIn">
      <header>
        <p className="eyebrow">Dataset pilot bersumber</p>
        <h1 className="page-title">Explore {source === "jabodetabek" ? "Jabodetabek" : "Yogyakarta"}</h1>
        <p>
          Periksa kandidat dan kelengkapan data sebelum merencanakan kunjungan.
        </p>
      </header>
      <div className="flex flex-wrap gap-3">
        <label className="field">
          Katalog
          <select value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="yogyakarta">Yogyakarta (planner)</option>
            <option value="jabodetabek">Jabodetabek (sampel demo)</option>
          </select>
        </label>
        {source === "jabodetabek" && (
          <label className="field">
            Area
            <select value={area} onChange={(e) => setArea(e.target.value)}>
              {["Jakarta", "Bogor", "Depok", "Tangerang", "Bekasi"].map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
        )}
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
      {source === "jabodetabek" && (
        <Notice>Sampel demo belum lengkap. Data ini belum dapat dipakai untuk menyusun itinerary.</Notice>
      )}
      {error && (
        <button
          className="btn-secondary"
          onClick={() => setRetry((n) => n + 1)}
        >
          Coba lagi
        </button>
      )}
      {busy ? (
        <Notice>Memuat katalog backend...</Notice>
      ) : (
        <p>{filtered.length} kandidat - tidak semua metadata terverifikasi.</p>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((p) => (
          <article className="bg-white rounded-3xl p-6 sm:p-8 shadow-soft border border-gray-100 space-y-3" key={p.id}>
            <p className="eyebrow">{p.kind}</p>
            <h2 className="text-xl font-bold">{p.name}</h2>
            {source === "jabodetabek" ? (
              <div className="text-sm space-y-2">
                <p>{p.address}</p>
                <p>Harga, jam buka, dan koordinat: belum diketahui.</p>
                <p>Diperiksa: {p.checked_on}</p>
                <a className="underline text-teal" href={p.source_url} target="_blank" rel="noreferrer">Lihat sumber</a>
              </div>
            ) : <PlaceDetails place={p} />}
            {!p.coordinates && (
              <Notice>Belum routable; koordinat perlu diverifikasi.</Notice>
            )}
            {source === "yogyakarta" && <Link className="btn-secondary" to="/create">Rencanakan trip</Link>}
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
