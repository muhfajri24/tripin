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
test("destination, category, companions and exact budget lead to trip review", async () => {
  const places = [{id:"p1",name:"Candi Prambanan",kind:"attraction",
    destinationId:"yogyakarta",coordinates:{lat:-7.752,lng:110.491}}];
  global.fetch = jest.fn().mockImplementation(async (url) => ({ok:true,json:async()=>
    url.includes("/destinations/lookup")
      ? {destinationId:"yogyakarta",name:"Yogyakarta",center:{lat:-7.7956,lng:110.3695},places}
      : {places}}));
  await act(async () =>
    root.render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Create />
      </MemoryRouter>,
    ),
  );
  await act(async () => Simulate.change(container.querySelector('#first-destination'), {target:{value:'Yogyakarta'}}));
  await act(async () => Simulate.click([...container.querySelectorAll('button')].find((x)=>x.textContent.includes('Lanjut pilih kategori'))));
  await act(async () => Simulate.click([...container.querySelectorAll('button')].find((x)=>x.textContent.includes('Budaya & Sejarah'))));
  await act(async () => Simulate.click([...container.querySelectorAll('button')].find((x)=>x.textContent === 'Lanjut')));
  await act(async () => Simulate.click([...container.querySelectorAll('button')].find((x)=>x.textContent.includes('Pasangan'))));
  await act(async () => Simulate.click([...container.querySelectorAll('button')].find((x)=>x.textContent === 'Lanjut')));
  await act(async () => Simulate.change(container.querySelector('#wizard-budget'), {target:{value:'500000'}}));
  await act(async () => Simulate.click([...container.querySelectorAll('button')].find((x)=>x.textContent === 'Lanjut')));
  await act(async () => Simulate.click(container.querySelector('[aria-label="Tambah durasi"]')));
  expect(container.textContent).toContain("Menginap di hotel mana?");
  expect(container.textContent).toContain("Rp\u00a0500.000 untuk rombongan");
  expect(container.textContent).toContain("Mau diprioritaskan yang mana?");
  expect(
    [...container.querySelectorAll("button")].find((x) =>
      x.textContent.includes("Susun sekarang"),
    ).disabled,
  ).toBe(true);
});
