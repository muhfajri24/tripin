import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import App from './App';

jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map">{children}</div>,
  TileLayer: () => null,
  Marker: ({ children }) => <div>{children}</div>,
  Popup: ({ children }) => <div>{children}</div>,
  Polyline: () => null,
  useMap: () => ({ fitBounds: jest.fn(), setView: jest.fn() }),
}));

jest.mock('leaflet', () => ({
  Icon: { Default: { prototype: {}, mergeOptions: jest.fn() } },
  icon: jest.fn(() => ({})),
  divIcon: jest.fn(() => ({})),
  latLngBounds: jest.fn(() => ({ extend: jest.fn() })),
}));

test('App mounts and renders without blank crash', async () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  try {
    await act(async () => {
      root.render(<App />);
    });
    console.log('App root HTML length:', container.innerHTML.length);
    if (container.innerHTML.length < 200) {
      console.log('App root content:', container.innerHTML);
    }
    expect(container.innerHTML.length).toBeGreaterThan(2000);
    expect(container.textContent).not.toContain('Terjadi kendala');
    expect(container.textContent).toContain('Rencanakan perjalanan.');
  } finally {
    act(() => root.unmount());
    container.remove();
  }
});
