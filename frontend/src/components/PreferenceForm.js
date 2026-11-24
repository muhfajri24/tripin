import React from "react";
import { rupiah } from "./GuestUI";
export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export function initialForm(req) {
  if (req)
    return {
      date: req.startDate,
      days: req.days,
      adults: req.travelers.adults,
      budget: req.budget.totalIdr,
      basis: "group",
      reserve: req.budget.reserveIdr,
      start: req.dayWindows[0].start,
      end: req.dayWindows[0].end,
      lodging: req.lodging?.placeId || "",
      rooms: req.lodging?.rooms || 1,
      checkIn: req.lodging?.checkInAt?.slice(11, 16) || "17:00",
      food: req.costAssumptions?.foodPersonIdr ?? "",
      hotel: req.costAssumptions?.lodgingRoomNightIdr ?? "",
      vehicle: req.costAssumptions?.vehicleDayIdr ?? "",
      allowUnknown: req.allowUnverifiedData,
      interests: req.interests,
      periodPreferences: req.periodPreferences,
      lat: req.arrivalAnchor.lat,
      lng: req.arrivalAnchor.lng,
      endLat: req.departureAnchor.lat,
      endLng: req.departureAnchor.lng,
      mustVisit: req.mustVisitPlaceIds,
    };
  return {
    date: today(),
    days: 1,
    adults: 2,
    budget: "",
    basis: "person",
    reserve: 0,
    start: "08:00",
    end: "20:00",
    lodging: "",
    rooms: 1,
    checkIn: "17:00",
    food: "",
    hotel: "",
    vehicle: "",
    allowUnknown: true,
    interests: ["culture", "food"],
    periodPreferences: [],
    lat: -7.7956,
    lng: 110.3695,
    endLat: -7.7956,
    endLng: 110.3695,
    mustVisit: [],
  };
}
export function toRequest(f) {
  const dates = Array.from({ length: Number(f.days) }, (_, i) => {
    const d = new Date(`${f.date}T12:00:00+07:00`);
    d.setUTCDate(d.getUTCDate() + i);
    return d.toISOString().slice(0, 10);
  });
  const amount = (x) => (x === "" ? null : Number(x));
  return {
    schemaVersion: 1,
    destinationId: "yogyakarta",
    startDate: f.date,
    days: Number(f.days),
    timezone: "Asia/Jakarta",
    travelers: { adults: Number(f.adults) },
    transportMode: "driving",
    budget: {
      totalIdr:
        Number(f.budget) * (f.basis === "person" ? Number(f.adults) : 1),
      originalBasis: f.basis,
      reserveIdr: Number(f.reserve),
    },
    dayWindows: dates.map((date) => ({ date, start: f.start, end: f.end })),
    arrivalAnchor: { lat: Number(f.lat), lng: Number(f.lng) },
    departureAnchor: { lat: Number(f.endLat), lng: Number(f.endLng) },
    lodging:
      Number(f.days) > 1
        ? {
            placeId: f.lodging,
            rooms: Number(f.rooms),
            nights: Number(f.days) - 1,
            checkInAt: `${f.date}T${f.checkIn}:00+07:00`,
          }
        : null,
    interests: f.interests,
    periodPreferences: f.periodPreferences,
    mustVisitPlaceIds: f.mustVisit,
    excludedPlaceIds: [],
    objective: "balanced",
    allowUnverifiedData: f.allowUnknown,
    costAssumptions: {
      foodPersonIdr: amount(f.food),
      lodgingRoomNightIdr: amount(f.hotel),
      vehicleDayIdr: amount(f.vehicle),
    },
  };
}
export default function PreferenceForm({ value: f, onChange, places }) {
  const set = (key, value) => onChange({ ...f, [key]: value });
  const field = (key, label, type = "number", props = {}) => (
    <label className="field" key={key}>
      {label}
      <input
        type={type}
        value={f[key]}
        onChange={(e) => set(key, e.target.value)}
        {...props}
      />
    </label>
  );
  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {field("date", "Tanggal mulai", "date", { required: true })}
        <label className="field">
          Durasi
          <select
            value={f.days}
            onChange={(e) => set("days", Number(e.target.value))}
          >
            {[1, 2, 3].map((n) => (
              <option key={n} value={n}>
                {n} hari
              </option>
            ))}
          </select>
        </label>
        {field("adults", "Wisatawan dewasa domestik", "number", {
          min: 1,
          max: 6,
          required: true,
        })}
        {field("budget", "Budget IDR sesuai basis", "number", {
          min: 1,
          required: true,
        })}
        <label className="field">
          Basis budget
          <select
            value={f.basis}
            onChange={(e) => set("basis", e.target.value)}
          >
            <option value="person">Per orang</option>
            <option value="group">Total grup</option>
          </select>
        </label>
        {field("reserve", "Cadangan grup IDR", "number", {
          min: 0,
          required: true,
        })}
        {field("start", "Mulai aktivitas", "time", { required: true })}
        {field("end", "Batas akhir hari", "time", { required: true })}
        <label className="field">
          Minat
          <select
            multiple
            value={f.interests}
            onChange={(e) =>
              set(
                "interests",
                [...e.target.selectedOptions].map((x) => x.value),
              )
            }
          >
            {[
              ["culture", "Budaya"],
              ["food", "Kuliner"],
              ["nature", "Alam"],
              ["craft", "Kerajinan"],
            ].map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-sm text-teal">
        Yogyakarta ? driving ? budget grup{" "}
        {rupiah(
          Number(f.budget) * (f.basis === "person" ? Number(f.adults) : 1),
        )}
        . Preferensi periode hasil parsing:{" "}
        {f.periodPreferences
          .map((x) => `${x.period}: ${x.categories.join(", ")}`)
          .join(" / ") || "belum ditentukan"}
        .
      </p>
      <div className="grid sm:grid-cols-3 gap-3">
        {["morning", "afternoon", "evening"].map((period) => (
          <label className="field" key={period}>
            {{ morning: "Pagi", afternoon: "Siang", evening: "Sore" }[period]}
            <select
              value={
                f.periodPreferences.find((p) => p.period === period)
                  ?.categories[0] || ""
              }
              onChange={(e) =>
                set("periodPreferences", [
                  ...f.periodPreferences.filter((p) => p.period !== period),
                  ...(e.target.value
                    ? [{ period, categories: [e.target.value] }]
                    : []),
                ])
              }
            >
              <option value="">Fleksibel</option>
              <option value="food">Kuliner</option>
              <option value="culture">Budaya</option>
              <option value="nature">Alam/santai</option>
            </select>
          </label>
        ))}
      </div>
      {Number(f.days) > 1 && (
        <fieldset className="border rounded-xl p-4 space-y-3">
          <legend>Penginapan manual ? tanpa booking</legend>
          <div className="grid sm:grid-cols-3 gap-4">
            <label className="field">
              Lodging anchor
              <select
                required
                value={f.lodging}
                onChange={(e) => set("lodging", e.target.value)}
              >
                <option value="">Pilih penginapan</option>
                {places
                  .filter((p) => p.kind === "lodging" && p.coordinates)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </label>
            {field("rooms", "Jumlah kamar", "number", {
              min: 1,
              required: true,
            })}
            {field("checkIn", "Batas tiba hotel hari pertama", "time", {
              required: true,
            })}
          </div>
          <p className="text-sm">
            {Number(f.days) - 1} malam. Tanggal, jumlah kamar, tarif, dan
            ketersediaan harus Anda konfirmasi; bukan rekomendasi harga hotel.
          </p>
        </fieldset>
      )}
      <fieldset className="border rounded-xl p-4">
        <legend>Estimasi Anda ? kosong berarti unknown, bukan gratis</legend>
        <div className="grid sm:grid-cols-3 gap-4">
          {field("food", "Makanan per orang per food stop", "number", {
            min: 0,
          })}
          {field("hotel", "Kamar per malam IDR", "number", { min: 0 })}
          {field("vehicle", "Kendaraan per hari IDR (all-in)", "number", {
            min: 0,
          })}
        </div>
      </fieldset>
      <details>
        <summary className="cursor-pointer font-semibold">
          Anchor perjalanan dan tempat wajib
        </summary>
        <p className="text-sm my-2">
          Koordinat awal diisi pusat kota sebagai input yang bisa Anda ubah.
          Sesuaikan lokasi tiba/pulang. Belum memakai geolocation.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {field("lat", "Latitude tiba", "number", {
            step: "any",
            min: -90,
            max: 90,
            required: true,
          })}
          {field("lng", "Longitude tiba", "number", {
            step: "any",
            min: -180,
            max: 180,
            required: true,
          })}
          {field("endLat", "Latitude pulang", "number", {
            step: "any",
            min: -90,
            max: 90,
            required: true,
          })}
          {field("endLng", "Longitude pulang", "number", {
            step: "any",
            min: -180,
            max: 180,
            required: true,
          })}
        </div>
        <label className="field mt-3">
          Tempat wajib (pilihan jamak)
          <select
            multiple
            value={f.mustVisit}
            onChange={(e) =>
              set(
                "mustVisit",
                [...e.target.selectedOptions].map((x) => x.value),
              )
            }
          >
            {places
              .filter((p) => p.kind !== "lodging" && p.coordinates)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </label>
      </details>
      <label className="flex gap-2 items-start text-sm">
        <input
          type="checkbox"
          checked={f.allowUnknown}
          onChange={(e) => set("allowUnknown", e.target.checked)}
        />
        Izinkan data belum terverifikasi dan tampilkan hasil bersyarat.
        Harga/jam unknown tidak akan dianggap pasti.
      </label>
    </div>
  );
}
