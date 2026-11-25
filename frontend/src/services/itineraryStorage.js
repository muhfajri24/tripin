const KEY = "tripin_guest_itineraries_v1";
// Rendering guard for untrusted device storage; backend remains canonical validator.
export function isItinerary(value) {
  const text = (x) => typeof x === "string";
  const strings = (x) => Array.isArray(x) && x.every(text);
  const integer = (x) => Number.isSafeInteger(x) && x >= 0;
  const coord = (x) => x && Number.isFinite(x.lat) && Math.abs(x.lat) <= 90 && Number.isFinite(x.lng) && Math.abs(x.lng) <= 180;
  const evidence = (x) => x && text(x.status) && text(x.sourceType) && (x.sourceRef == null || text(x.sourceRef));
  const leg = (x) => x && integer(x.estimatedDurationMin) && integer(x.schedulingBufferMin) && integer(x.distanceMeters);
  const stamp = (x) => text(x) && Number.isFinite(Date.parse(x));
  try {
    const r = value.request;
    if (!(value.schemaVersion === 1 && text(value.id) && value.id.length && integer(value.revision) && value.revision > 0 &&
      r.destinationId === "yogyakarta" && integer(r.days) && r.days >= 1 && r.days <= 3 && stamp(r.startDate) &&
      integer(r.travelers.adults) && r.travelers.adults > 0 && integer(r.budget.totalIdr) && integer(r.budget.reserveIdr) &&
      coord(r.arrivalAnchor) && coord(r.departureAnchor) && strings(r.interests) && strings(r.mustVisitPlaceIds) &&
      Array.isArray(r.periodPreferences) && Array.isArray(r.dayWindows) && r.dayWindows.length === r.days &&
      r.dayWindows.every((w) => stamp(w.date) && text(w.start) && text(w.end)) &&
      Array.isArray(value.days) && value.days.length === r.days && Array.isArray(value.places) && Array.isArray(value.ledger) &&
      strings(value.uncertainties) && Array.isArray(value.violations) && value.violations.every((v) => text(v.message)) &&
      integer(value.totals.knownCostIdr) && integer(value.totals.unknownCostItems) && integer(value.totals.travelMin) && integer(value.totals.distanceMeters))) return false;
    if (!value.places.every((p) => text(p.id) && text(p.name) && strings(p.categories) &&
      (p.coordinates === null || coord(p.coordinates)) && evidence(p.identityEvidence) && evidence(p.locationEvidence) &&
      evidence(p.durationEvidence) && evidence(p.openingEvidence) && Array.isArray(p.prices) && p.prices.length &&
      p.prices.every((x) => (x.amountIdr === null || integer(x.amountIdr)) && evidence(x.evidence)))) return false;
    const ids = new Set(value.places.map((p) => p.id));
    if (!value.days.every((d) => stamp(d.date) && coord(d.startAnchor) && coord(d.endAnchor) &&
      (d.finalLeg === null || leg(d.finalLeg)) && Array.isArray(d.stops) && d.stops.every((stop) =>
        text(stop.id) && ids.has(stop.placeId) && stamp(stop.arrivalAt) && stamp(stop.departureAt) &&
        integer(stop.visitDurationMin) && integer(stop.dayIndex) && leg(stop.incomingLeg) &&
        text(stop.lock.type) && text(stop.status)))) return false;
    if (!value.ledger.every((x) => text(x.id) && text(x.category) && integer(x.quantity) &&
      (x.totalIdr === null || integer(x.totalIdr)) && (x.unitAmountIdr === null || integer(x.unitAmountIdr)) && evidence(x.evidence))) return false;
    if (value.replanState && !(Array.isArray(value.replanState.progress) && Array.isArray(value.replanState.closures) &&
      value.replanState.progress.every((p) => stamp(p.date) && stamp(p.notBefore) && coord(p.location)))) return false;
    return true;
  } catch {
    return false;
  }
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
  window.dispatchEvent(new Event("tripin:trips-changed"));
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
