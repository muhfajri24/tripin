import {
  loadTrips,
  saveTrip,
  findTrip,
  deleteTrip,
  resolveTrip,
} from "./itineraryStorage";
import { navigationLinks } from "./googleMapsService";
import { api } from "./plannerApi";
import { initialForm, toRequest } from "../components/PreferenceForm";
const fs = require("fs");
const path = require("path");
const fixture = () =>
  JSON.parse(
    fs.readFileSync(
      path.resolve(
        process.cwd(),
        "../contracts/fixtures/valid/itinerary-snapshot.json",
      ),
      "utf8",
    ),
  );
beforeEach(() => localStorage.clear());
afterEach(() => jest.restoreAllMocks());
test("guest storage starts empty, supports multiple trips and deletion", () => {
  expect(loadTrips()).toEqual([]);
  const a = fixture(),
    b = { ...fixture(), id: "another-id" };
  saveTrip(a);
  saveTrip(b);
  expect(loadTrips()).toHaveLength(2);
  expect(findTrip("missing")).toBeNull();
  deleteTrip(a.id);
  expect(findTrip(a.id)).toBeNull();
  expect(findTrip(b.id).id).toBe(b.id);
});
test("storage failure never claims success", () => {
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("quota");
  });
  expect(() => saveTrip(fixture())).toThrow("belum tersimpan");
});
test("corrupt storage is not overwritten", () => {
  localStorage.setItem("tripin_guest_itineraries_v1", "broken");
  expect(() => saveTrip(fixture())).toThrow("tidak dapat dibaca");
  expect(localStorage.getItem("tripin_guest_itineraries_v1")).toBe("broken");
});
test("Maps splits mobile routes, preserving coordinate order and anchors", () => {
  const places = Array.from({ length: 9 }, (_, i) => ({
    id: `p${i}`,
    coordinates: { lat: 0, lng: 110 + i / 100 },
  }));
  const day = {
    startAnchor: { lat: 0, lng: 109 },
    endAnchor: { lat: 0, lng: 111 },
    stops: places.map((p) => ({ placeId: p.id })),
  };
  const links = navigationLinks(day, places);
  expect(links).toHaveLength(3);
  const reconstructed = [];
  links.forEach((link, i) => {
    expect(link.length).toBeLessThanOrEqual(2048);
    const u = new URL(link);
    expect(u.searchParams.get("travelmode")).toBe("driving");
    const mid = (u.searchParams.get("waypoints") || "")
      .split("|")
      .filter(Boolean);
    expect(mid.length).toBeLessThanOrEqual(3);
    const points = [
      u.searchParams.get("origin"),
      ...mid,
      u.searchParams.get("destination"),
    ];
    reconstructed.push(...(i ? points.slice(1) : points));
  });
  expect(reconstructed).toEqual([
    "0,109",
    ...places.map((p) => `0,${p.coordinates.lng}`),
    "0,111",
  ]);
});
test("Maps rejects missing coordinates", () => {
  expect(() =>
    navigationLinks(
      {
        startAnchor: { lat: 0, lng: 0 },
        endAnchor: { lat: 0, lng: 0 },
        stops: [{ placeId: "unknown" }],
      },
      [],
    ),
  ).toThrow("Koordinat");
});
test("review form normalizes per-person budget and 3-day lodging", () => {
  const f = {
    ...initialForm(),
    date: "2026-12-01",
    days: 3,
    adults: 2,
    budget: 500000,
    basis: "person",
    lodging: "hotel",
    rooms: 2,
  };
  const r = toRequest(f);
  expect(r.budget.totalIdr).toBe(1000000);
  expect(r.budget.originalBasis).toBe("person");
  expect(r.lodging.nights).toBe(2);
  expect(r.lodging.rooms).toBe(2);
  expect(r.dayWindows.map((d) => d.date)).toEqual([
    "2026-12-01",
    "2026-12-02",
    "2026-12-03",
  ]);
  expect(r.costAssumptions.foodPersonIdr).toBeNull();
});
test("canonical fixture round-trips through review with group total intact", () => {
  const r = fixture().request;
  const normalized = toRequest(initialForm(r));
  expect(normalized.budget.totalIdr).toBe(r.budget.totalIdr);
  expect(normalized.arrivalAnchor).toEqual(r.arrivalAnchor);
  expect(normalized.dayWindows).toEqual(r.dayWindows);
});
test("API surfaces backend field errors and never substitutes mock", async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    json: async () => ({
      error: { message: "Invalid", fields: { budget: "must be positive" } },
    }),
  });
  await expect(api("/itineraries/plan", {})).rejects.toThrow(
    "must be positive",
  );
});

test("saved revision wins over stale navigation state on reload", () => {
  const old = fixture();
  const latest = { ...fixture(), revision: 5 };
  saveTrip(latest);
  expect(resolveTrip(old.id, old).trip.revision).toBe(5);
  expect(resolveTrip(old.id, { ...latest, revision: 6 }).trip.revision).toBe(6);
});
