import React, { useState } from "react";
import MapView from "./MapView";
import { Notice, rupiah, time } from "./GuestUI";
import { navigationLinks } from "../services/googleMapsService";
export default function TripView({ trip }) {
  const [selected, setSelected] = useState(0);
  const day = trip.days[Math.min(selected, trip.days.length - 1)];
  const byId = Object.fromEntries(trip.places.map((p) => [p.id, p]));
  let links = [],
    mapError = "";
  try {
    links = navigationLinks(day, trip.places);
  } catch (e) {
    mapError = e.message;
  }
  const eligible = trip.places.filter((p) => p.isLocalBusiness === true);
  const localItems = trip.ledger.filter((x) =>
    eligible.some((p) => p.id === x.placeId),
  );
  return (
    <div className="space-y-5">
      <Notice>
        Validasi:{" "}
        {trip.feasibility === "undetermined"
          ? "bersyarat ? ada estimasi atau data belum lengkap"
          : trip.feasibility}
        . Tidak ada jaminan lalu lintas atau ketersediaan aktual.
      </Notice>
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="card">
          <p>Biaya diketahui/diestimasi</p>
          <strong>{rupiah(trip.totals.knownCostIdr)}</strong>
          <p>{trip.totals.unknownCostItems} komponen belum diketahui</p>
        </div>
        <div className="card">
          <p>Budget grup</p>
          <strong>{rupiah(trip.request.budget.totalIdr)}</strong>
          <p>Cadangan {rupiah(trip.request.budget.reserveIdr)}</p>
        </div>
        <div className="card">
          <p>Perjalanan seluruh hari</p>
          <strong>{trip.totals.travelMin} menit</strong>
          <p>
            {(trip.totals.distanceMeters / 1000).toFixed(1)} km garis lurus;
            tanpa buffer
          </p>
        </div>
      </div>
      <div
        className="flex gap-2 flex-wrap"
        role="group"
        aria-label="Pilih hari"
      >
        {trip.days.map((d, i) => (
          <button
            key={d.date}
            className={i === selected ? "btn-primary" : "btn-secondary"}
            onClick={() => setSelected(i)}
          >
            Hari {i + 1} ? {d.date}
          </button>
        ))}
      </div>
      <div className="grid xl:grid-cols-2 gap-5">
        <section className="card space-y-4">
          <h2 className="text-xl font-bold">Jadwal hari {selected + 1}</h2>
          {!day.stops.length && (
            <p>Tidak ada aktivitas terpilih pada hari ini.</p>
          )}
          {day.stops.map((s) => (
            <article
              key={s.id}
              className="border-l-4 border-teal pl-4 space-y-1"
            >
              <p className="text-teal font-bold">
                {time(s.arrivalAt)}?{time(s.departureAt)}
              </p>
              <h3 className="font-bold">
                {byId[s.placeId]?.name || s.placeId}
              </h3>
              <p>
                {s.visitDurationMin} menit kunjungan ?{" "}
                {s.incomingLeg.estimatedDurationMin} menit perjalanan +{" "}
                {s.incomingLeg.schedulingBufferMin} menit buffer
              </p>
              <p className="text-sm">
                {(s.incomingLeg.distanceMeters / 1000).toFixed(1)} km garis
                lurus ?{" "}
                {s.lock.type === "none"
                  ? "Fleksibel"
                  : `Terkunci: ${s.lock.type}`}{" "}
                ? {s.status}
              </p>
              <p className="text-xs">
                Jam {byId[s.placeId]?.openingEvidence.status} ? Biaya{" "}
                {byId[s.placeId]?.prices[0]?.evidence.status}
              </p>
            </article>
          ))}
          <p className="text-sm">
            Ke anchor akhir: {day.finalLeg?.estimatedDurationMin || 0} menit +{" "}
            {day.finalLeg?.schedulingBufferMin || 0} menit buffer.
          </p>
        </section>
        <section className="space-y-3">
          <MapView
            activities={day.stops.map((s) => ({
              id: s.id,
              name: byId[s.placeId]?.name,
              lat: byId[s.placeId]?.coordinates?.lat,
              lng: byId[s.placeId]?.coordinates?.lng,
              time: time(s.arrivalAt),
              duration: `${s.visitDurationMin} menit`,
            }))}
            center={[day.startAnchor.lat, day.startAnchor.lng]}
          />
          <p className="text-sm">
            Garis penghubung menunjukkan urutan, bukan rute jalan. ?
            OpenStreetMap contributors.
          </p>
          <Notice error>{mapError}</Notice>
          <div className="flex flex-wrap gap-2">
            {links.map((url, i) => (
              <a
                className="btn-secondary"
                key={url}
                href={url}
                target="_blank"
                rel="noreferrer"
              >
                Google Maps ? segmen {i + 1}
              </a>
            ))}
          </div>
          <p className="text-xs">
            Maps menerima urutan dan koordinat, bukan jam kunjungan. Rute di
            Maps dapat berbeda.
          </p>
        </section>
      </div>
      <section className="card overflow-x-auto">
        <h2 className="text-xl font-bold mb-3">
          Rincian budget ? {trip.request.travelers.adults} orang
        </h2>
        <table className="w-full text-sm text-left">
          <thead>
            <tr>
              <th>Komponen</th>
              <th>Jumlah</th>
              <th>Tarif satuan</th>
              <th>Total</th>
              <th>Sumber</th>
            </tr>
          </thead>
          <tbody>
            {trip.ledger.map((x) => (
              <tr className="border-t" key={x.id}>
                <td className="py-3 pr-3">
                  {x.category} ? {byId[x.placeId]?.name || "Kendaraan per hari"}
                </td>
                <td>{x.quantity}</td>
                <td>{rupiah(x.unitAmountIdr)}</td>
                <td>{rupiah(x.totalIdr)}</td>
                <td>
                  {x.evidence.status} / {x.evidence.sourceType}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-sm">
          Transport memakai satu estimasi kendaraan/hari. Makanan dihitung pada
          food stops terpilih; konsumsi lain belum termasuk. Hotel dihitung per
          kamar ? malam. Unknown tidak dianggap gratis.
        </p>
      </section>
      <section className="card space-y-3">
        <h2 className="font-bold">Sumber kandidat terpilih</h2>
        {trip.places.map((p) => (
          <details key={p.id}>
            <summary className="cursor-pointer">{p.name}</summary>
            <ul className="text-sm space-y-1 pl-4">
              {[
                ["Identitas", p.identityEvidence],
                ["Lokasi", p.locationEvidence],
                ["Jam buka", p.openingEvidence],
                ["Harga", p.prices[0]?.evidence],
                ["Durasi", p.durationEvidence],
              ].map(([label, e]) => (
                <li key={label}>
                  {label}: {e?.status || "unverified"}{" "}
                  {e?.sourceRef?.startsWith("https://") ? (
                    <a
                      className="underline text-teal"
                      href={e.sourceRef}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Sumber
                    </a>
                  ) : (
                    e?.sourceRef || "?"
                  )}{" "}
                  {e?.checkedAt && `? diperiksa ${e.checkedAt.slice(0, 10)}`}
                </li>
              ))}
            </ul>
          </details>
        ))}
      </section>
      <section className="card">
        <h2 className="font-bold">Data dan asumsi</h2>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          {trip.uncertainties.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
          {trip.violations.map((x, i) => (
            <li key={`v${i}`}>{x.message}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs">
          Dataset {trip.datasetVersion} ? Engine {trip.plannerVersion}
        </p>
        <p className="mt-2">
          {eligible.length} bisnis lokal teridentifikasi. Estimasi alokasi
          diketahui{" "}
          {rupiah(localItems.reduce((s, x) => s + (x.totalIdr || 0), 0))};{" "}
          {localItems.filter((x) => x.totalIdr === null).length} komponen lokal
          belum diketahui. Ini rencana belanja, bukan transaksi atau dampak
          ekonomi terukur.
        </p>
      </section>
    </div>
  );
}
