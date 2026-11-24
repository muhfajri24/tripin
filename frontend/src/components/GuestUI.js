import React from "react";
export const rupiah = (value) =>
  value == null
    ? "Belum diketahui"
    : new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(value);
export const time = (stamp) =>
  stamp
    ? new Date(stamp).toLocaleTimeString("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
export function Notice({ children, error = false }) {
  return children ? (
    <div
      role={error ? "alert" : "status"}
      className={`rounded-xl p-4 text-sm ${error ? "bg-red-50 text-red-800 border border-red-200" : "bg-sky text-teal"}`}
    >
      {children}
    </div>
  ) : null;
}
export function PlaceDetails({ place }) {
  return (
    <div className="text-sm space-y-1 text-charcoal-lighter">
      <p>{place.address || "Alamat rinci belum tersedia"}</p>
      <p>
        Harga: {rupiah(place.prices[0]?.amountIdr)} · Jam:{" "}
        {place.openingWindows === null
          ? "Belum diverifikasi"
          : place.openingWindows.length
            ? "Lihat rentang hari pada sumber"
            : "Tidak ada jam reguler"}
      </p>
      <p>
        Durasi: {place.visitDurationMin} menit ({place.durationEvidence.status})
        · Koordinat: {place.coordinates ? "bersumber" : "belum tersedia"}
      </p>
      {place.identityEvidence.sourceRef?.startsWith("https://") && (
        <a
          className="underline text-teal"
          href={place.identityEvidence.sourceRef}
          target="_blank"
          rel="noreferrer"
        >
          Sumber identitas tempat
        </a>
      )}
      <p>
        Harga/jam dapat berubah. Klasifikasi UMKM:{" "}
        {place.isLocalBusiness === null
          ? "belum diverifikasi"
          : place.isLocalBusiness
            ? "teridentifikasi lokal"
            : "tidak diklasifikasikan lokal"}
        .
      </p>
    </div>
  );
}
