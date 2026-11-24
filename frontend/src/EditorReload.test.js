import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Editor from "./pages/ItineraryEditorPage";
import { saveTrip } from "./services/itineraryStorage";
jest.mock("./components/TripView", () => () => null);
const fs = require("fs");
const path = require("path");
test("editor rehydrates latest saved revision and acknowledged effective time", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  const old = JSON.parse(
    fs.readFileSync(
      path.resolve(
        process.cwd(),
        "../contracts/fixtures/valid/itinerary-snapshot.json",
      ),
      "utf8",
    ),
  );
  const latest = {
    ...old,
    revision: 5,
    replanState: {
      closures: [],
      progress: [
        {
          date: old.request.startDate,
          notBefore: old.request.startDate + "T10:00:00+07:00",
          location: old.request.arrivalAnchor,
        },
      ],
    },
  };
  saveTrip(latest);
  global.fetch = jest
    .fn()
    .mockResolvedValue({
      ok: true,
      json: async () => ({ places: latest.places }),
    });
  const div = document.createElement("div");
  document.body.appendChild(div);
  const root = createRoot(div);
  await act(async () =>
    root.render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        initialEntries={[
          { pathname: "/itinerary/" + old.id + "/edit", state: { trip: old } },
        ]}
      >
        <Routes>
          <Route path="/itinerary/:id/edit" element={<Editor />} />
        </Routes>
      </MemoryRouter>,
    ),
  );
  expect(div.querySelector("input[type=datetime-local]").value).toBe(
    old.request.startDate + "T10:00",
  );
  expect(div.querySelector("header").textContent).toContain("Revisi 5");
  await act(async () => root.unmount());
  div.remove();
  localStorage.clear();
  jest.restoreAllMocks();
});
