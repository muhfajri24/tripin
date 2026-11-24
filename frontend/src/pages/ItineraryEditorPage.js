import React, { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { api, listPlaces } from "../services/plannerApi";
import { resolveTrip, saveTrip } from "../services/itineraryStorage";
import { Notice, rupiah, time } from "../components/GuestUI";
import PreferenceForm, {
  initialForm,
  toRequest,
} from "../components/PreferenceForm";
import TripView from "../components/TripView";
export default function ItineraryEditorPage() {
  const { id } = useParams();
  const location = useLocation();
  const [loaded] = useState(() => {
    const resolved = resolveTrip(id, location.state?.trip);
    return {
      ...resolved,
      error: resolved.error || location.state?.storageError || "",
    };
  });
  const [trip, setTrip] = useState(loaded.trip);
  const [form, setForm] = useState(() =>
    loaded.trip ? initialForm(loaded.trip.request) : initialForm(),
  );
  const [places, setPlaces] = useState([]);
  const [error, setError] = useState(loaded.error);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [before, setBefore] = useState(null);
  const [selected, setSelected] = useState(
    () => loaded.trip?.days.flatMap((d) => d.stops.map((s) => s.placeId)) || [],
  );
  const [locks, setLocks] = useState({});
  const [add, setAdd] = useState("");
  const [closeId, setCloseId] = useState("");
  const [closeDate, setCloseDate] = useState(
    loaded.trip?.request.startDate || "",
  );
  const [effective, setEffective] = useState(
    loaded.trip
      ? loaded.trip.replanState?.progress
          ?.find((p) => p.date === loaded.trip.request.startDate)
          ?.notBefore.slice(0, 16) ||
          `${loaded.trip.request.startDate}T${loaded.trip.request.dayWindows[0].start}`
      : "",
  );
  const [current, setCurrent] = useState("start");
  const [saved, setSaved] = useState("");
  useEffect(() => {
    const c = new AbortController();
    listPlaces(c.signal)
      .then((d) => setPlaces(d.places))
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, []);
  if (!trip)
    return (
      <div className="card">
        <h1 className="page-title">Trip tidak ditemukan</h1>
        <Notice error>{error}</Notice>
        <Link to="/my-itineraries">My Trips</Link>
      </div>
    );
  const stops = trip.days.flatMap((d) => d.stops);
  const byId = Object.fromEntries(places.map((p) => [p.id, p]));
  const name = (pid) =>
    byId[pid]?.name || trip.places.find((p) => p.id === pid)?.name || pid;
  async function recalculate(disruption) {
    setBusy(true);
    setError("");
    setSaved("");
    try {
      const response = await api("/itineraries/replan", {
        itinerary: trip,
        expectedRevision: trip.revision,
        effectiveAt: `${effective}:00+07:00`,
        currentLocation:
          current === "start"
            ? trip.request.arrivalAnchor
            : byId[current]?.coordinates || trip.request.arrivalAnchor,
        disruption,
      });
      setBefore(trip);
      setResult(response);
      if (response.revised) {
        setTrip(response.revised);
        setForm(initialForm(response.revised.request));
        setSelected(
          response.revised.days.flatMap((d) => d.stops.map((s) => s.placeId)),
        );
        const progress = response.revised.replanState?.progress?.find(
          (p) => p.date === effective.slice(0, 10),
        );
        if (progress) setEffective(progress.notBefore.slice(0, 16));
        setLocks({});
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function move(index, offset) {
    const copy = [...selected];
    const target = index + offset;
    if (target < 0 || target >= copy.length) return;
    [copy[index], copy[target]] = [copy[target], copy[index]];
    setSelected(copy);
  }
  function save() {
    try {
      saveTrip(trip);
      setSaved("Revisi tersimpan pada browser ini.");
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap justify-between gap-3">
        <div>
          <p className="eyebrow">Revisi {trip.revision} · validasi backend</p>
          <h1 className="page-title">Edit & reschedule</h1>
        </div>
        <Link
          className="btn-secondary"
          to={`/itinerary/${id}`}
          state={{ trip }}
        >
          Lihat hasil
        </Link>
      </header>
      <Notice>
        Perubahan kontrol belum mengubah hasil sampai Anda menghitung ulang.
        Locked atau completed stops tidak dihapus otomatis. Revisi baru disimpan
        hanya saat tombol Simpan ditekan.
      </Notice>
      <Notice error>{error}</Notice>
      <Notice>{saved}</Notice>
      <section className="card space-y-4">
        <h2 className="text-xl font-bold">Kondisi perjalanan</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="field">
            Waktu efektif perubahan
            <input
              type="datetime-local"
              value={effective}
              onChange={(e) => setEffective(e.target.value)}
              required
            />
          </label>
          <label className="field">
            Lokasi saat ini
            <select
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            >
              <option value="start">Anchor kedatangan</option>
              {places
                .filter((p) => p.coordinates)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </label>
          <button
            type="button"
            className="btn-primary self-end"
            disabled={busy || !effective}
            onClick={() => recalculate({ type: "delay", minutes: 120 })}
          >
            Simulasi terlambat 2 jam
          </button>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <label className="field flex-1">
            Tempat ditutup
            <select
              value={closeId}
              onChange={(e) => setCloseId(e.target.value)}
            >
              <option value="">Pilih stop</option>
              {stops.map((s) => (
                <option value={s.placeId} key={s.id}>
                  {name(s.placeId)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Tanggal penutupan
            <input
              type="date"
              value={closeDate}
              onChange={(e) => setCloseDate(e.target.value)}
            />
          </label>
          <button
            className="btn-secondary"
            disabled={busy || !closeId || !closeDate}
            onClick={() =>
              recalculate({
                type: "closure",
                placeId: closeId,
                date: closeDate,
              })
            }
          >
            Terapkan penutupan
          </button>
        </div>
      </section>
      <form
        className="card space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          recalculate({
            type: "edit",
            selectedPlaceIds: selected,
            request: toRequest(form),
            locks,
          });
        }}
      >
        <h2 className="text-xl font-bold">Aktivitas dan locks</h2>
        <p className="text-sm">
          Urutan diedit dalam hari asal; kandidat baru ditambahkan ke hari
          pertama. Backend menolak urutan yang tidak muat. Tanggal/durasi trip
          harus tetap; buat trip baru untuk mengubahnya.
        </p>
        {selected.map((pid, i) => {
          const stop = stops.find((s) => s.placeId === pid);
          const lock = locks[pid] ||
            stop?.lock || { type: "none", arrivalAt: null };
          return (
            <div className="border rounded-xl p-3 space-y-2" key={pid}>
              <div className="flex flex-wrap gap-2 items-center">
                <strong className="flex-1">
                  {i + 1}. {name(pid)}
                </strong>
                {stop && (
                  <span>
                    Hari {stop.dayIndex + 1} · {time(stop.arrivalAt)}
                  </span>
                )}
                <button
                  type="button"
                  aria-label={`Naik ${name(pid)}`}
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                >
                  Naik
                </button>
                <button
                  type="button"
                  aria-label={`Turun ${name(pid)}`}
                  onClick={() => move(i, 1)}
                  disabled={i === selected.length - 1}
                >
                  Turun
                </button>
                <button
                  type="button"
                  className="text-red-700 underline"
                  onClick={() => setSelected(selected.filter((x) => x !== pid))}
                >
                  Hapus dari draft
                </button>
              </div>
              {stop && (
                <div className="flex flex-wrap gap-3">
                  <label className="field">
                    Lock
                    <select
                      value={lock.type}
                      onChange={(e) =>
                        setLocks({
                          ...locks,
                          [pid]: {
                            type: e.target.value,
                            arrivalAt:
                              e.target.value === "place_time"
                                ? stop.arrivalAt
                                : null,
                          },
                        })
                      }
                    >
                      <option value="none">Fleksibel</option>
                      <option value="place_day">Tempat dan hari</option>
                      <option value="place_time">Tempat dan waktu</option>
                    </select>
                  </label>
                  <label className="field">
                    Ganti dengan
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          setSelected(
                            selected.map((x) =>
                              x === pid ? e.target.value : x,
                            ),
                          );
                        }
                      }}
                    >
                      <option value="">Pilih pengganti</option>
                      {places
                        .filter(
                          (p) =>
                            p.kind !== "lodging" &&
                            p.coordinates &&
                            !selected.includes(p.id),
                        )
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                    </select>
                  </label>
                </div>
              )}
            </div>
          );
        })}
        <div className="flex gap-3">
          <select
            aria-label="Tambah tempat"
            value={add}
            onChange={(e) => setAdd(e.target.value)}
          >
            <option value="">Tambah kandidat</option>
            {places
              .filter(
                (p) =>
                  p.kind !== "lodging" &&
                  p.coordinates &&
                  !selected.includes(p.id),
              )
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
          <button
            type="button"
            className="btn-secondary"
            disabled={!add}
            onClick={() => {
              setSelected([...selected, add]);
              setAdd("");
            }}
          >
            Tambah ke draft
          </button>
        </div>
        <details>
          <summary className="font-bold cursor-pointer">
            Edit preferensi dan budget
          </summary>
          <div className="mt-4">
            <PreferenceForm value={form} onChange={setForm} places={places} />
          </div>
        </details>
        <button className="btn-primary" disabled={busy}>
          {busy ? "Menghitung ulang…" : "Validasi & terapkan draft"}
        </button>
      </form>
      {result && (
        <section className="card space-y-3">
          <h2 className="text-xl font-bold">Perbandingan sebelum / sesudah</h2>
          <Notice error={result.status !== "repaired"}>
            {result.status === "repaired"
              ? "Revisi tersedia; periksa asumsi dan data unknown."
              : "Perlu koreksi atau keputusan pengguna; itinerary tidak diganti."}
          </Notice>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <h3 className="font-bold">Sebelum · revisi {before.revision}</h3>
              <p>
                {before.totals.travelMin} menit ·{" "}
                {rupiah(before.totals.knownCostIdr)} diketahui ·{" "}
                {before.totals.unknownCostItems} unknown
              </p>
            </div>
            <div>
              <h3 className="font-bold">Sesudah</h3>
              {result.revised ? (
                <p>
                  {result.revised.totals.travelMin} menit ·{" "}
                  {rupiah(result.revised.totals.knownCostIdr)} diketahui ·{" "}
                  {result.revised.totals.unknownCostItems} unknown
                </p>
              ) : (
                <p>Tidak ada revisi yang diterapkan.</p>
              )}
            </div>
          </div>
          <p>
            Selisih waktu perjalanan: {result.beforeAfter.travelDeltaMin} menit.
            Selisih biaya lengkap: {rupiah(result.beforeAfter.costDeltaIdr)}.
          </p>
          {result.disruptedOriginalViolations.map((v, i) => (
            <Notice error key={i}>
              {v.message}
            </Notice>
          ))}
          <ul className="space-y-2">
            {result.changes.map((c) => (
              <li key={c.stopId}>
                {name(
                  stops.find((s) => s.id === c.stopId)?.placeId ||
                    c.stopId.replace("stop-", ""),
                )}
                : {c.action} · {c.explanation}
              </li>
            ))}
          </ul>
          <p className="text-sm">
            {['retained', 'moved', 'removed', 'replaced'].map((action) =>
              `${action}: ${result.changes.filter((change) => change.action === action).length}`
            ).join('; ')}. Angka dihitung dari perubahan backend, bukan penghematan terukur.
          </p>
          <details>
            <summary>Jadwal awal sebelum perubahan</summary>
            <div className="mt-4">
              <TripView trip={before} />
            </div>
          </details>
        </section>
      )}
      <button className="btn-primary" onClick={save}>
        Simpan revisi saat ini
      </button>
      <TripView trip={trip} />
    </div>
  );
}
