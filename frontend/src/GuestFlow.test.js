import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { Simulate } from "react-dom/test-utils";
import { MemoryRouter } from "react-router-dom";
import Create from "./pages/CreateItineraryPage";
import MyTrips from "./pages/MyItinerariesPage";

jest.mock("./components/MapView", () => () => null);
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
        ? {
            places: [
              {
                id: "p1",
                name: "Candi Prambanan",
                kind: "attraction",
                destinationId: "yogyakarta",
                coordinates: { lat: -7.752, lng: 110.491 },
              },
            ],
          }
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
  for (let i = 0; i < 3; i += 1) {
    const nextBtn = [...container.querySelectorAll("button")]
      .filter((x) => x.textContent.includes("Lanjut"))
      .pop();
    await act(async () => {
      Simulate.click(nextBtn);
    });
  }
  const textarea = container.querySelector("textarea");
  await act(async () => {
    Simulate.change(textarea, {
      target: { value: "Yogyakarta 2 hari budget Rp500.000 per orang" },
    });
  });
  const sendBtn = container.querySelector('button[aria-label="Kirim permintaan"]');
  await act(async () => {
    Simulate.click(sendBtn);
  });
  expect(container.textContent).toContain("Menginap di hotel mana?");
  expect(container.textContent).toContain("Rp\u00a0500.000 per orang");
  expect(container.textContent).toContain("Mau diprioritaskan yang mana?");
  expect(
    [...container.querySelectorAll("button")].find((x) =>
      x.textContent.includes("Susun sekarang"),
    ).disabled,
  ).toBe(true);
});
