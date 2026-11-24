const KEY = "tripin_guest_itineraries_v1";
export function isItinerary(value) {
  return (
    value?.schemaVersion === 1 &&
    typeof value.id === "string" &&
    Number.isInteger(value.revision) &&
    value.revision > 0 &&
    Array.isArray(value.days) &&
    value.days.every(
      (d) => typeof d.date === "string" && Array.isArray(d.stops),
    ) &&
    Array.isArray(value.places) &&
    Array.isArray(value.ledger) &&
    value.request?.destinationId === "yogyakarta" &&
    Number.isInteger(value.totals?.knownCostIdr)
  );
}
export function loadTrips() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (
      parsed.version !== 1 ||
      !Array.isArray(parsed.trips) ||
      !parsed.trips.every(isItinerary)
    )
      throw new Error("invalid");
    return parsed.trips;
  } catch (e) {
    throw new Error(
      "Penyimpanan trip tidak dapat dibaca. Data lama tidak ditimpa; periksa izin browser atau ekspor data melalui browser.",
    );
  }
}
function write(trips) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: 1, trips }));
  } catch (e) {
    throw new Error(
      "Trip belum tersimpan: penyimpanan browser tidak tersedia atau penuh. Jadwal tetap dapat dilihat.",
    );
  }
}
export function saveTrip(trip) {
  if (!isItinerary(trip)) throw new Error("Format itinerary tidak valid.");
  const trips = loadTrips();
  write([trip, ...trips.filter((t) => t.id !== trip.id)]);
}
export function deleteTrip(id) {
  write(loadTrips().filter((t) => t.id !== id));
}
export function findTrip(id) {
  return loadTrips().find((t) => t.id === id) || null;
}

// Navigation state may survive reload; never let it hide a newer saved revision.
export function resolveTrip(id, incoming) {
  const candidate =
    isItinerary(incoming) && incoming.id === id ? incoming : null;
  try {
    const stored = findTrip(id);
    return {
      trip:
        stored && (!candidate || stored.revision >= candidate.revision)
          ? stored
          : candidate,
      error: "",
    };
  } catch (e) {
    return { trip: candidate, error: e.message };
  }
}
