import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { Simulate } from "react-dom/test-utils";
import { MemoryRouter } from "react-router-dom";
import LocalDiscoveryPage from "./LocalDiscoveryPage";

test("Jabodetabek demo shows provenance and cannot start planner", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const row = {
    id: "jbd-depok-situ-pengasinan",
    kind: "attraction",
    name: "Situ Pengasinan",
    address: "Sawangan, Kota Depok",
    checked_on: "2026-11-27",
    source_url: "https://example.org/source",
    coordinates: null,
  };
  global.fetch = jest.fn().mockImplementation(async (url) => ({
    ok: true,
    json: async () => ({ places: url.includes("/demo/places") ? [row] : [] }),
  }));
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <LocalDiscoveryPage />
      </MemoryRouter>,
    ));
    await act(async () => Simulate.change(container.querySelector("select"), {
      target: { value: "jabodetabek" },
    }));
    expect(global.fetch.mock.calls.some(([url]) => url.includes("/demo/places?area=Jakarta"))).toBe(true);
    expect(container.textContent).toContain("Situ Pengasinan");
    expect(container.textContent).toContain("Sampel demo belum lengkap");
    expect(container.textContent).toContain("belum diketahui");
    expect(container.querySelector('a[href="https://example.org/source"]')).not.toBeNull();
    expect(container.querySelector('a[href="/create"]')).toBeNull();
  } finally {
    act(() => root.unmount());
    container.remove();
    jest.restoreAllMocks();
  }
});
