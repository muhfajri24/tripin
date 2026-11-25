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
  expect(container.querySelector('[role=alert]').textContent).toContain('Backend');
  await act(async () => Simulate.change(container.querySelector('textarea'), {target:{value:'Yogyakarta 1 hari'}}));
  await act(async () => Simulate.click(button('Muat ulang katalog')));
  expect(container.querySelector('textarea').value).toBe('Yogyakarta 1 hari');
  expect(container.querySelector('[role=alert]')).toBeNull();
  expect(button('Susun itinerary').disabled).toBe(true);
  expect(localStorage.length).toBe(0);
  expect(global.fetch.mock.calls.every(([url])=>url.endsWith('/places'))).toBe(true);
});
test('destination passed from landing cannot silently become Yogyakarta', async () => {
  global.fetch = jest.fn().mockResolvedValue({ok:true,json:async()=>({places:fixture().places})});
  await render(<Create />, {pathname:'/create',state:{destination:'Bali'}});
  const reviewed = [...container.querySelectorAll('label')].find(label => label.textContent.includes('Saya sudah memeriksa')).querySelector('input');
  await act(async () => Simulate.change(reviewed, {target:{checked:true}}));
  expect(reviewed.checked).toBe(true);
  expect(container.textContent).toContain('Saya memilih Yogyakarta secara eksplisit');
  expect(button('Susun itinerary').disabled).toBe(true);
  expect(global.fetch).toHaveBeenCalledTimes(1);
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
