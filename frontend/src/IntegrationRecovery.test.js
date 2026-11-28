import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { Simulate } from 'react-dom/test-utils';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Create from './pages/CreateItineraryPage';
import Result from './pages/ItineraryResultPage';
import { saveTrip } from './services/itineraryStorage';
jest.mock('./components/TripView', () => () => <p>Canonical trip view</p>);
const fs = require('fs');
const path = require('path');
const fixture = () => JSON.parse(fs.readFileSync(path.resolve(process.cwd(), '../contracts/fixtures/valid/itinerary-snapshot.json'), 'utf8'));
let container, root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); jest.restoreAllMocks(); });
async function render(element, entry = '/create', route = '/create') {
  await act(async () => root.render(<MemoryRouter future={{v7_startTransition:true,v7_relativeSplatPath:true}} initialEntries={[entry]}><Routes><Route path={route} element={element} /></Routes></MemoryRouter>));
}
const button = (name) => [...container.querySelectorAll('button')].find((b) => b.textContent.includes(name));
test('catalog outage keeps review draft and retry restores generation without mock fallback', async () => {
  const trip = fixture();
  global.fetch = jest.fn().mockRejectedValueOnce(new TypeError('offline')).mockResolvedValue({ok:true,json:async()=>({places:trip.places})});
  await render(<Create />);
  for (let i = 0; i < 3; i += 1) {
    const nextBtn = [...container.querySelectorAll('button')].filter((b) => b.textContent.includes('Lanjut')).pop();
    await act(async () => Simulate.click(nextBtn));
  }
  expect(container.querySelector('[role=alert]').textContent).toContain('Layanan perencana');
  await act(async () => Simulate.change(container.querySelector('textarea'), {target:{value:'Yogyakarta 1 hari'}}));
  await act(async () => Simulate.click(button('Coba lagi')));
  expect(container.querySelector('textarea').value).toBe('Yogyakarta 1 hari');
  expect(container.querySelector('[role=alert]')).toBeNull();
  expect(localStorage.length).toBe(0);
  expect(global.fetch.mock.calls.every(([url])=>url.endsWith('/places'))).toBe(true);
});
test('destination passed from landing cannot silently become Yogyakarta', async () => {
  global.fetch = jest.fn()
    .mockResolvedValueOnce({ok:true,json:async()=>({places:fixture().places})})
    .mockResolvedValueOnce({ok:true,json:async()=>({draft:{unsupportedDestination:true,days:null,budgetAmountIdr:null,interests:[],periodPreferences:[]},missingFields:['destinationId'],ambiguities:[],parserSource:'deterministic-id-v1'})});
  await render(<Create />, {pathname:'/create',state:{destination:'Bali'}});
  for (let i = 0; i < 3; i += 1) {
    const nextBtn = [...container.querySelectorAll('button')].filter((b) => b.textContent.includes('Lanjut')).pop();
    await act(async () => Simulate.click(nextBtn));
  }
  await act(async () => Simulate.click(container.querySelector('button[aria-label="Kirim permintaan"]')));
  expect(container.textContent).toContain('Mau ke daerah mana?');
  expect(button('Susun sekarang').disabled).toBe(true);
  expect(global.fetch).toHaveBeenCalledTimes(2);
});
test('national destination lookup replaces the pilot catalog and anchor explicitly', async () => {
  const basePlaces = fixture().places;
  const baliPlaces = basePlaces.slice(0, 2).map((p, i) => ({...p, id:`bali-${i}`, destinationId:'osm--840950_11518890', coordinates:{lat:-8.4095 + i * 0.001,lng:115.1889}}));
  global.fetch = jest.fn()
    .mockResolvedValueOnce({ok:true,json:async()=>({places:basePlaces})})
    .mockResolvedValueOnce({ok:true,json:async()=>({draft:{unsupportedDestination:true,days:1,budgetAmountIdr:500000,budgetBasis:'group',interests:['culture'],periodPreferences:[]},missingFields:[],ambiguities:[],parserSource:'deterministic-id-v1'})})
    .mockResolvedValueOnce({ok:true,json:async()=>({destinationId:'osm--840950_11518890',name:'Bali',center:{lat:-8.4095,lng:115.1889},places:baliPlaces,datasetVersion:'osm_user_query_v1'})});
  await render(<Create />, {pathname:'/create',state:{destination:'Bali'}});
  for (let i = 0; i < 3; i += 1) {
    const nextBtn = [...container.querySelectorAll('button')].filter((b) => b.textContent.includes('Lanjut')).pop();
    await act(async () => Simulate.click(nextBtn));
  }
  await act(async () => Simulate.click(container.querySelector('button[aria-label="Kirim permintaan"]')));
  expect(button('Susun sekarang').disabled).toBe(true);
  await act(async () => Simulate.click(button('Cari daerah')));
  expect(global.fetch.mock.calls[2][0]).toContain('/destinations/lookup?q=Bali');
  expect(container.textContent).toContain('Bali · 1 tempat ditemukan');
  expect(button('Susun sekarang').disabled).toBe(false);
});
test('hotel search result can be selected to unlock a two day trip', async () => {
  const basePlaces = fixture().places;
  const destinationId = 'osm--691750_10761910';
  const museum = {...basePlaces[0], id:'museum-bandung', destinationId,
    coordinates:{lat:-6.9175,lng:107.6191}};
  const hotel = {...basePlaces[0], id:'osm-node-99', name:'Hotel Baru Bandung',
    destinationId, kind:'lodging', categories:['lodging'],
    coordinates:{lat:-6.91,lng:107.62}};
  global.fetch = jest.fn()
    .mockResolvedValueOnce({ok:true,json:async()=>({places:basePlaces})})
    .mockResolvedValueOnce({ok:true,json:async()=>({draft:{unsupportedDestination:true,days:2,budgetAmountIdr:500000,budgetBasis:'group',interests:[],periodPreferences:[]},missingFields:[],ambiguities:[],parserSource:'deterministic-id-v1'})})
    .mockResolvedValueOnce({ok:true,json:async()=>({destinationId,name:'Bandung',center:{lat:-6.9175,lng:107.6191},places:[museum]})})
    .mockResolvedValueOnce({ok:true,json:async()=>({places:[hotel]})});
  await render(<Create />, {pathname:'/create',state:{destination:'Bandung'}});
  for (let i = 0; i < 3; i += 1) {
    const nextBtn = [...container.querySelectorAll('button')].filter((b) => b.textContent.includes('Lanjut')).pop();
    await act(async () => Simulate.click(nextBtn));
  }
  await act(async () => Simulate.click(container.querySelector('button[aria-label="Kirim permintaan"]')));
  await act(async () => Simulate.click(button('Cari daerah')));
  expect(button('Susun sekarang').disabled).toBe(true);
  await act(async () => Simulate.change(container.querySelector('[aria-label="Cari nama hotel"]'), {target:{value:'Hotel Baru'}}));
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 550)); });
  expect(global.fetch.mock.calls[3][0]).toContain('/lodgings?q=Hotel%20Baru');
  await act(async () => Simulate.click(button('Hotel Baru Bandung')));
  expect(container.textContent).toContain('Hotel dipilih: Hotel Baru Bandung');
  expect(button('Susun sekarang').disabled).toBe(false);
});
test('unmatched hotel text still offers area hotels to continue', async () => {
  const basePlaces = fixture().places;
  const destinationId = 'osm--726000_11275000';
  const hotel = {...basePlaces[0], id:'osm-node-88', name:'Hotel Tunjungan',
    destinationId, kind:'lodging', categories:['lodging'],
    coordinates:{lat:-7.26,lng:112.75}};
  const attraction = {...basePlaces[0], id:'surabaya-museum', destinationId,
    coordinates:{lat:-7.265,lng:112.75}};
  global.fetch = jest.fn()
    .mockResolvedValueOnce({ok:true,json:async()=>({places:basePlaces})})
    .mockResolvedValueOnce({ok:true,json:async()=>({draft:{unsupportedDestination:true,days:2,budgetAmountIdr:2000000,budgetBasis:'person',interests:[],periodPreferences:[]},missingFields:[],ambiguities:[],parserSource:'deterministic-id-v1'})})
    .mockResolvedValueOnce({ok:true,json:async()=>({destinationId,name:'Surabaya',center:{lat:-7.26,lng:112.75},places:[attraction,hotel]})});
  await render(<Create />, {pathname:'/create',state:{destination:'Surabaya'}});
  for (let i = 0; i < 3; i += 1) {
    const nextBtn = [...container.querySelectorAll('button')].filter((b) => b.textContent.includes('Lanjut')).pop();
    await act(async () => Simulate.click(nextBtn));
  }
  await act(async () => Simulate.click(container.querySelector('button[aria-label="Kirim permintaan"]')));
  await act(async () => Simulate.click(button('Cari daerah')));
  await act(async () => Simulate.change(container.querySelector('[aria-label="Cari nama hotel"]'), {target:{value:'hotel surabaya jaya'}}));
  expect(container.textContent).toContain('Nama itu belum cocok');
  await act(async () => Simulate.click(button('Hotel Tunjungan')));
  expect(button('Susun sekarang').disabled).toBe(false);
});
test('result uses latest stored revision over stale navigation state', async () => {
  const old = fixture();
  saveTrip({...old,revision:7});
  await render(<Result />, {pathname:`/itinerary/${old.id}`,state:{trip:old}}, '/itinerary/:id');
  expect(container.querySelector('header').textContent).toContain('revisi 7');
});
test('invalid result ID never falls back to a saved trip', async () => {
  const trip = fixture();
  saveTrip(trip);
  await render(<Result />, {pathname:'/itinerary/missing',state:{trip}}, '/itinerary/:id');
  expect(container.textContent).toContain('Trip tidak ditemukan');
  expect(container.textContent).not.toContain('Canonical trip view');
});
