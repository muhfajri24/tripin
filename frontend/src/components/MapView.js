import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { ExternalLink } from "lucide-react";

// Fix default marker icons for Leaflet with CRA
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const createNumberedIcon = (number, color = "#FF6B5E") =>
  L.divIcon({
    className: "",
    html: `<div style="
      background: ${color};
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 13px;
      border: 2px solid white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    ">
      <span style="transform: rotate(45deg)">${number}</span>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -34],
  });

function RecenterMap({ positions, defaultCenter }) {
  const map = useMap();
  useEffect(() => {
    if (positions && positions.length > 0) {
      if (positions.length === 1) {
        map.setView(positions[0], 13);
      } else {
        const bounds = L.latLngBounds(positions);
        map.fitBounds(bounds, { padding: [35, 35], maxZoom: 14 });
      }
    } else if (defaultCenter) {
      map.setView(defaultCenter, 12);
    }
  }, [positions, defaultCenter, map]);
  return null;
}

function MapView({ activities = [], center, zoom = 12, height = "400px" }) {
  const [tileFailed, setTileFailed] = useState(false);
  const validActivities = activities.filter(
    (a) => Number.isFinite(a.lat) && Number.isFinite(a.lng),
  );

  const defaultCenter =
    center ||
    (validActivities.length > 0
      ? [validActivities[0].lat, validActivities[0].lng]
      : [-7.7956, 110.3695]);

  const positions = validActivities.map((a) => [a.lat, a.lng]);

  return (
    <div
      className="relative rounded-2xl overflow-hidden shadow-soft border border-gray-100"
      style={{ height }}
    >
      {tileFailed && (
        <p
          role="status"
          className="absolute top-2 left-2 right-2 z-[1000] bg-white p-2 text-xs rounded shadow"
        >
          Peta dasar belum dapat dimuat. Jadwal dan koordinat tetap tersedia.
        </p>
      )}
      <MapContainer
        center={defaultCenter}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <RecenterMap positions={positions} defaultCenter={defaultCenter} />

        <TileLayer
          eventHandlers={{ tileerror: () => setTileFailed(true) }}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Route line */}
        {positions.length > 1 && (
          <Polyline
            positions={positions}
            color="#176B67"
            weight={3}
            opacity={0.7}
            dashArray="8, 6"
          />
        )}

        {/* Markers */}
        {validActivities.map((activity, idx) => (
          <Marker
            key={activity.id || idx}
            position={[activity.lat, activity.lng]}
            icon={createNumberedIcon(
              idx + 1,
              idx === 0 ? "#FF6B5E" : "#176B67",
            )}
          >
            <Popup>
              <div className="p-1 min-w-[170px] max-w-[220px]">
                <div className="flex items-center gap-1 mb-1">
                  <span className="w-5 h-5 rounded-full bg-teal text-white text-[10px] font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <p className="font-bold text-charcoal text-xs leading-snug">
                    {activity.name}
                  </p>
                </div>
                {activity.city && (
                  <p className="text-[10px] text-charcoal-lighter line-clamp-2">
                    {activity.city}
                  </p>
                )}
                <p className="text-[10px] text-teal font-semibold mt-1">
                  {activity.time} · {activity.duration}
                </p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${activity.name}, ${activity.city || ""}`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-coral hover:text-coral-dark"
                >
                  <ExternalLink size={11} />
                  Buka di Google Maps
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default MapView;
