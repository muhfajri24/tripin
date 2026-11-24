import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { Simulate } from "react-dom/test-utils";
import { MemoryRouter } from "react-router-dom";
import Create from "./pages/CreateItineraryPage";
import MyTrips from "./pages/MyItinerariesPage";
let container, root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  localStorage.clear();
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.restoreAllMocks();
});
test("My Trips does not display fictional user history", async () => {
  await act(async () =>
    root.render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <MyTrips />
      </MemoryRouter>,
    ),
  );
  expect(container.textContent).toContain("Belum ada perjalanan");
  expect(container.textContent).not.toContain("Ari Santoso");
});
test("brief parse is editable and generation requires review", async () => {
  global.fetch = jest.fn().mockImplementation(async (url) => ({
    ok: true,
    json: async () =>
      url.includes("/places")
        ? { places: [] }
        : {
            draft: {
              days: 2,
              adults: 3,
              budgetAmountIdr: 500000,
              budgetBasis: "person",
              interests: ["food"],
              periodPreferences: [],
            },
            missingFields: ["lodging"],
            ambiguities: [],
            parserSource: "deterministic-id-v1",
          },
  }));
  await act(async () =>
    root.render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Create />
      </MemoryRouter>,
    ),
  );
  const textarea = container.querySelector("textarea");
  await act(async () => {
    Simulate.change(textarea, {
      target: { value: "Yogyakarta 2 hari budget Rp500.000 per orang" },
    });
  });
  const parse = [...container.querySelectorAll("button")].find((x) =>
    x.textContent.includes("Baca kebutuhan"),
  );
  await act(async () => {
    Simulate.click(parse);
  });
  expect(container.textContent).toContain("Periksa/lengkapi: lodging");
  expect(container.textContent).toContain("1.500.000");
  expect(
    [...container.querySelectorAll("button")].find((x) =>
      x.textContent.includes("Susun itinerary"),
    ).disabled,
  ).toBe(true);
});
