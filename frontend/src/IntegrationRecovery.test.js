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
  sessionStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); jest.restoreAllMocks(); });
async function render(element, entry = '/create', route = '/create') {
  await act(async () => root.render(<MemoryRouter future={{v7_startTransition:true,v7_relativeSplatPath:true}} initialEntries={[entry]}><Routes><Route path={route} element={element} /></Routes></MemoryRouter>));
}
const button = (name) => [...container.querySelectorAll('button')].find((b) => b.textContent.includes(name));
const response = (data) => ({ok:true,json:async()=>data});
const cityCatalog = (area, hotel = null) => {
  const id = area === 'Surabaya' ? 'osm--724628_11273777' : 'osm--840950_11518890';
  const center = area === 'Surabaya' ? {lat:-7.24628,lng:112.73777} : {lat:-8.4095,lng:115.1889};
  const museum = {...fixture().places[0], id:'museum-1', kind:'attraction', destinationId:id, coordinates:center};
  return {destinationId:id,name:area,center,places:[museum,...(hotel ? [hotel] : [])]};
};
async function chooseCity(area) {
  const input = container.querySelector('#first-destination');
  await act(async () => Simulate.change(input, {target:{value:area}}));
  await act(async () => Simulate.click(button('Lanjut pilih kategori')));
}
async function reachReview() {
  await act(async () => Simulate.click(button('Budaya & Sejarah')));
  await act(async () => Simulate.click(button('Lanjut')));
  await act(async () => Simulate.click(button('Pasangan')));
  await act(async () => Simulate.click(button('Lanjut')));
  await act(async () => Simulate.change(container.querySelector('#wizard-budget'), {target:{value:'2000000'}}));
  await act(async () => Simulate.click(button('Lanjut')));
}

test('destination lookup failure keeps typed city and can be retried', async () => {
  let failed = false;
  global.fetch = jest.fn(async (url) => {
    if (url.includes('/destinations/lookup')) {
      if (!failed) { failed = true; throw new TypeError('offline'); }
      return response(cityCatalog('Bali'));
    }
    return response({places:fixture().places});
  });
  await render(<Create />);
  expect(container.textContent).toContain('Mau liburan ke mana?');
  await chooseCity('Bali');
  expect(container.querySelector('#first-destination').value).toBe('Bali');
  expect(container.querySelector('[role=alert]').textContent).toContain('Backend belum dapat dihubungi');
  await act(async () => Simulate.click(button('Lanjut pilih kategori')));
  expect(container.textContent).toContain('Tempat seperti apa yang mau kamu kunjungi di Bali?');
});

test('destination passed from landing must resolve before categories', async () => {
  global.fetch = jest.fn(async (url) => url.includes('/destinations/lookup')
    ? {ok:false,json:async()=>({error:{message:'Daerah belum tersedia'}})}
    : response({places:fixture().places}));
  await render(<Create />, {pathname:'/create',state:{destination:'Bali'}});
  expect(container.querySelector('#first-destination').value).toBe('Bali');
  await act(async () => Simulate.click(button('Lanjut pilih kategori')));
  expect(container.textContent).toContain('Daerah belum tersedia');
  expect(container.textContent).not.toContain('Tempat seperti apa');
});

test('city, category, companion and exact budget reach review without a free-text prompt', async () => {
  global.fetch = jest.fn(async (url) => url.includes('/destinations/lookup')
    ? response(cityCatalog('Bali')) : response({places:fixture().places}));
  await render(<Create />);
  await chooseCity('Bali');
  await reachReview();
  expect(container.textContent).toContain('Rancang perjalanan di Bali');
  expect(container.textContent).toContain('Mau diprioritaskan yang mana?');
  expect(container.textContent).toContain('Rp\u00a02.000.000');
  await act(async () => Simulate.click(container.querySelector('[aria-label="Kurangi durasi"]')));
  expect(button('Susun sekarang').disabled).toBe(false);
  expect(global.fetch.mock.calls.some(([url])=>url.includes('/requests/parse'))).toBe(false);
});

test('hotel from live search unlocks a two day trip', async () => {
  const catalog = cityCatalog('Surabaya');
  const hotel = {...fixture().places[0], id:'osm-node-99', name:'Hotel Baru Surabaya',
    destinationId:catalog.destinationId, kind:'lodging', categories:['lodging'], coordinates:catalog.center};
  global.fetch = jest.fn(async (url) => url.includes('/lodgings?') ? response({places:[hotel]})
    : url.includes('/destinations/lookup') ? response(catalog) : response({places:fixture().places}));
  await render(<Create />);
  await chooseCity('Surabaya');
  await reachReview();
  await act(async () => Simulate.click(container.querySelector('[aria-label="Tambah durasi"]')));
  expect(button('Susun sekarang').disabled).toBe(true);
  await act(async () => Simulate.change(container.querySelector('[aria-label="Cari nama hotel"]'), {target:{value:'Hotel Baru'}}));
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 550)); });
  await act(async () => Simulate.click(button('Hotel Baru Surabaya')));
  expect(container.textContent).toContain('Hotel dipilih: Hotel Baru Surabaya');
  expect(button('Susun sekarang').disabled).toBe(false);
});

test('unmatched hotel text still offers area hotels', async () => {
  const catalog = cityCatalog('Surabaya');
  const hotel = {...fixture().places[0], id:'osm-node-88', name:'Hotel Tunjungan',
    destinationId:catalog.destinationId, kind:'lodging', categories:['lodging'], coordinates:catalog.center};
  global.fetch = jest.fn(async (url) => url.includes('/destinations/lookup')
    ? response(cityCatalog('Surabaya', hotel)) : response({places:fixture().places}));
  await render(<Create />);
  await chooseCity('Surabaya');
  await reachReview();
  await act(async () => Simulate.click(container.querySelector('[aria-label="Tambah durasi"]')));
  await act(async () => Simulate.change(container.querySelector('[aria-label="Cari nama hotel"]'), {target:{value:'hotel surabaya jaya'}}));
  expect(container.textContent).toContain('Nama itu belum cocok');
  await act(async () => Simulate.click(button('Hotel Tunjungan')));
  expect(button('Susun sekarang').disabled).toBe(false);
});

test('dashboard brief asks only for budget when other fields are present', async () => {
  global.fetch = jest.fn(async (url) => url.includes('/requests/parse')
    ? response({draft:{destinationName:'Bali', days:1, interests:['culture'],
      companionId:'couple', adults:2, periodPreferences:[]}, missingFields:['budgetAmountIdr'],
      ambiguities:[], parserSource:'deterministic-id-v2'})
    : url.includes('/destinations/lookup') ? response(cityCatalog('Bali'))
    : url.includes('/itineraries/plan') ? response({itinerary:fixture(), conflicts:[]})
    : response({places:fixture().places}));
  await render(<Create />, {pathname:'/create', state:{promptText:'Ke Bali 1 hari bersama pasangan, wisata budaya'}});
  await act(async () => { await Promise.resolve(); });
  expect(container.querySelector('#wizard-budget')).not.toBeNull();
  expect(container.textContent).not.toContain('Liburan ini bersama siapa?');
  await act(async () => Simulate.change(container.querySelector('#wizard-budget'), {target:{value:'800000'}}));
  await act(async () => Simulate.click(button('Lanjut')));
  const request = JSON.parse(global.fetch.mock.calls.find(([url])=>url.includes('/itineraries/plan'))[1].body).request;
  expect(request.destinationName).toBe('Bali');
  expect(request.interests).toEqual(['culture']);
  expect(request.travelers.adults).toBe(2);
  expect(request.budget.totalIdr).toBe(800000);
});

test('Banyuwangi brief routes through only its missing category, companion and budget', async () => {
  global.fetch = jest.fn(async (url) => url.includes('/requests/parse')
    ? response({draft:{destinationName:'Banyuwangi', days:3, interests:[], periodPreferences:[]},
      missingFields:['interests','companionId','budgetAmountIdr'], ambiguities:[], parserSource:'deterministic-id-v2'})
    : url.includes('/destinations/lookup') ? response(cityCatalog('Banyuwangi'))
    : response({places:fixture().places}));
  await render(<Create />, {pathname:'/create', state:{promptText:'Saya mau ke Banyuwangi 3 hari'}});
  await act(async () => { await Promise.resolve(); });
  expect(container.textContent).toContain('Tempat seperti apa yang mau kamu kunjungi di Banyuwangi?');
  await act(async () => Simulate.click(button('Budaya & Sejarah')));
  await act(async () => Simulate.click(button('Lanjut')));
  expect(container.textContent).toContain('Liburan ini bersama siapa?');
  await act(async () => Simulate.click(button('Pasangan')));
  await act(async () => Simulate.click(button('Lanjut')));
  expect(container.querySelector('#wizard-budget')).not.toBeNull();
});

test.each(['Purwakarta', 'Surabaya'])('dashboard sentence with comma resolves %s before missing questions', async (city) => {
  const brief = `saya mau ke ${city.toLowerCase()}, 2 hari`;
  global.fetch = jest.fn(async (url) => url.includes('/requests/parse')
    ? response({draft:{destinationName:brief, days:2, interests:[], periodPreferences:[]},
      missingFields:['interests','companionId','budgetAmountIdr'], ambiguities:[], parserSource:'deterministic-id-v2'})
    : url.includes('/destinations/lookup') ? response(cityCatalog(city))
    : response({places:fixture().places}));
  await render(<Create />, {pathname:'/create', state:{promptText:brief}});
  await act(async () => { await Promise.resolve(); });
  const lookupUrl = global.fetch.mock.calls.find(([url])=>url.includes('/destinations/lookup'))?.[0];
  expect(lookupUrl.toLowerCase()).toContain(`q=${city.toLowerCase()}`);
  expect(container.textContent).toContain(`Tempat seperti apa yang mau kamu kunjungi di ${city}?`);
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
