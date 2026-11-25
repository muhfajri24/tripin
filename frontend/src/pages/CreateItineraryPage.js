import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api, listPlaces } from "../services/plannerApi";
import { saveTrip } from "../services/itineraryStorage";
import PreferenceForm, {
  initialForm,
  toRequest,
} from "../components/PreferenceForm";
import { Notice } from "../components/GuestUI";
export default function CreateItineraryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [text, setText] = useState(location.state?.destination ? `Perjalanan ke ${location.state.destination}` : "");
  const [form, setForm] = useState(initialForm);
  const [places, setPlaces] = useState([]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [unsupported, setUnsupported] = useState(Boolean(location.state?.destination && !/^(yogyakarta|jogja|yogya)$/i.test(location.state.destination)));
  const [catalogReady, setCatalogReady] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setCatalogReady(false);
    setError("");
    listPlaces(controller.signal)
      .then((d) => {
        if (controller.signal.aborted) return;
        setPlaces(d.places);
        setCatalogReady(d.places.length > 0);
        if (!d.places.length) setError("Katalog kosong. Muat ulang sebelum menyusun perjalanan.");
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, [retry]);
  async function parse() {
    setBusy(true);
    setError("");
    setReviewed(false);
    try {
      const result = await api("/requests/parse", { text });
      const d = result.draft;
      setUnsupported(Boolean(d.unsupportedDestination));
      setForm((f) => ({
        ...f,
        days: d.days ?? f.days,
        adults: d.adults ?? f.adults,
        budget: d.budgetAmountIdr ?? f.budget,
        basis: d.budgetBasis ?? f.basis,
        date: d.startDate ?? f.date,
        interests: d.interests.length ? d.interests : f.interests,
        periodPreferences: d.periodPreferences,
      }));
      setInfo(
        [
          ...result.ambiguities,
          `Periksa/lengkapi: ${result.missingFields.join(", ") || "semua field hasil ekstraksi"}. Parser berbasis aturan, tanpa LLM.`,
        ].join(" "),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function plan(e) {
    e.preventDefault();
    if (busy || !reviewed || unsupported || !catalogReady || !places.length) return;
    setBusy(true);
    setError("");
    try {
      const result = await api("/itineraries/plan", {
        request: toRequest(form),
      });
      if (!result.itinerary) {
        setError(
          result.conflicts.join(" - ") +
            " Heuristic belum menemukan jadwal; coba kurangi constraint.",
        );
        return;
      }
      let storageError = "";
      try {
        saveTrip(result.itinerary);
      } catch (e) {
        storageError = e.message;
      }
      navigate(`/itinerary/${result.itinerary.id}`, {
        state: { trip: result.itinerary, storageError },
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-fadeIn">
      <header>
        <p className="eyebrow">Yogyakarta - 1-3 hari - tanpa akun</p>
        <h1 className="page-title">Rencanakan perjalanan Anda</h1>
        <p>
          Ubah brief menjadi kebutuhan yang dapat diperiksa, lalu susun jadwal
          dengan backend.
        </p>
      </header>
      <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-soft border border-gray-100 space-y-3">
        <label className="field">
          Ceritakan rencana Anda
          <textarea
            disabled={busy}
            rows={4}
            value={text}
            onChange={(e) => { setText(e.target.value); setReviewed(false); }}
            placeholder="2 hari di Yogyakarta, 2 orang, pagi kuliner, siang budaya, budget Rp500.000 per orang, mobil"
          />
        </label>
        <button
          type="button"
          className="btn-secondary"
          disabled={busy || !text.trim()}
          onClick={parse}
        >
          {busy ? "Memproses..." : "Baca kebutuhan dari teks"}
        </button>
        <p className="text-sm">
          Atau isi form di bawah langsung. Tidak ada panggilan AI berbayar.
        </p>
      </section>
      <Notice>{info}</Notice>
      <Notice error>{error}</Notice>
      {!catalogReady && <button type="button" className="btn-secondary" disabled={busy} onClick={() => setRetry((n) => n + 1)}>Muat ulang katalog</button>}
      {unsupported && (
        <Notice error>
          Tujuan teks tidak didukung. Tidak akan diganti otomatis.{" "}
          <button
            className="underline"
            onClick={() => {
              setUnsupported(false);
              setReviewed(false);
            }}
          >
            Saya memilih Yogyakarta secara eksplisit
          </button>
        </Notice>
      )}
      <form onSubmit={plan} className="bg-white rounded-3xl p-6 sm:p-8 shadow-soft border border-gray-100 space-y-5">
        <h2 className="text-xl font-bold">Review kebutuhan terstruktur</h2>
        <fieldset disabled={busy}>
        <PreferenceForm
          value={form}
          places={places}
          onChange={(v) => {
            setForm(v);
            setReviewed(false);
          }}
        />
        </fieldset>
        <label className="flex gap-2">
          <input
            type="checkbox"
            disabled={busy}
            checked={reviewed}
            onChange={(e) => setReviewed(e.target.checked)}
          />
          Saya sudah memeriksa tujuan, tanggal, budget, anchor, dan asumsi di
          atas.
        </label>
        <button
          className="btn-primary"
          disabled={busy || !reviewed || unsupported || !catalogReady || !places.length}
        >
          {busy ? "Menghitung jadwal..." : "Susun itinerary"}
        </button>
      </form>
    </div>
  );
}
