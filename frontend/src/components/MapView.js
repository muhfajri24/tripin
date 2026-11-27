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

const createNumberedIcon = (number, color = "#F4A261", pulse = false) =>
  L.divIcon({
    className: "",
    html: `<div style="position:relative;width:24px;height:24px;">
      ${pulse
        ? `<div class="tripin-marker-pulse" style="
              position:absolute;inset:0;border-radius:50%;
              background:${color};pointer-events:none;
            "></div>`
        : ""
      }
      <div style="
        position:relative;
        background: ${color};
        color: #0B3B45;
        width: 24px;
        height: 24px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 11px;
        border: 2px solid white;
        box-shadow: 0 3px 8px rgba(0,0,0,0.25);
      ">
        <span style="transform: rotate(45deg)">${number}</span>
      </div>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -26],
  });

function spreadNearbyPositions(activities) {
  const seen = [];
  return activities.map((act) => {
    let lat = act.lat;
    let lng = act.lng;
    const nearbyCount = seen.filter(
      (p) => Math.abs(p.lat - lat) < 0.004 && Math.abs(p.lng - lng) < 0.004,
    ).length;
    if (nearbyCount > 0) {
      const angle = (nearbyCount * 2 * Math.PI) / 6;
      lat += Math.sin(angle) * 0.0035;
      lng += Math.cos(angle) * 0.0035;
    }
    seen.push({ lat, lng });
    return { ...act, lat, lng };
  });
}

function RecenterMap({ positions, defaultCenter, focusPosition }) {
  const map = useMap();
  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (
      focusPosition &&
      Number.isFinite(focusPosition.lat) &&
      Number.isFinite(focusPosition.lng)
    ) {
      if (prefersReduced || typeof map.flyTo !== "function") {
        map.setView([focusPosition.lat, focusPosition.lng], 15, { animate: false });
      } else {
        map.flyTo([focusPosition.lat, focusPosition.lng], 15, { duration: 0.85 });
      }
      return;
    }
    if (positions && positions.length > 0) {
      if (positions.length === 1) {
        map.setView(positions[0], 13, { animate: false });
      } else {
        const bounds = L.latLngBounds(positions);
        map.fitBounds(bounds, { padding: [48, 48], maxZoom: 13, animate: false });
      }
    } else if (defaultCenter) {
      map.setView(defaultCenter, 12, { animate: false });
    }
  }, [positions, defaultCenter, focusPosition, map]);
  return null;
}

function ClickToEnableScrollZoom() {
  const map = useMap();
  useEffect(() => {
    if (!map || typeof map.on !== "function") return;
    const enable = () => {
      if (map.scrollWheelZoom && typeof map.scrollWheelZoom.enable === "function") {
        map.scrollWheelZoom.enable();
      }
    };
    map.on("click", enable);
    return () => {
      if (typeof map.off === "function") map.off("click", enable);
    };
  }, [map]);
  return null;
}

function MapView({
  activities = [],
  center,
  zoom = 12,
  height = "400px",
  animateRoute = false,
  pulseNext = false,
  focusPosition = null,
}) {
  const [tileFailed, setTileFailed] = useState(false);
  const validActivities = React.useMemo(
    () =>
      spreadNearbyPositions(
        activities.filter(
          (a) => Number.isFinite(a.lat) && Number.isFinite(a.lng),
        ),
      ),
    [activities],
  );

  const defaultCenter =
    center ||
    (validActivities.length > 0
      ? [validActivities[0].lat, validActivities[0].lng]
      : [-7.7956, 110.3695]);

  const positions = React.useMemo(
    () => validActivities.map((a) => [a.lat, a.lng]),
    [validActivities],
  );
  const [drawnPositions, setDrawnPositions] = useState(() =>
    animateRoute ? positions.slice(0, 1) : positions,
  );

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!animateRoute || prefersReduced || positions.length <= 1) {
      setDrawnPositions(positions);
      return;
    }

    let rafId;
    const totalSegments = positions.length - 1;
    const duration = 1100;
    const start = performance.now();

    const step = (now) => {
      const rawT = Math.max(0, Math.min(1, (now - start) / duration));
      // cubic-bezier(0.22, 1, 0.36, 1) approximation: easeOutCubic
      const t = 1 - Math.pow(1 - rawT, 3);
      const progress = t * totalSegments;
      const completedSegs = Math.min(totalSegments, Math.max(0, Math.floor(progress)));
      const segFrac = progress - completedSegs;

      const pts = positions.slice(0, completedSegs + 1);
      if (completedSegs < totalSegments && positions[completedSegs] && positions[completedSegs + 1]) {
        const [lat1, lng1] = positions[completedSegs];
        const [lat2, lng2] = positions[completedSegs + 1];
        pts.push([lat1 + (lat2 - lat1) * segFrac, lng1 + (lng2 - lng1) * segFrac]);
      }
      setDrawnPositions(pts);

      if (rawT < 1) {
        rafId = requestAnimationFrame(step);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [animateRoute, positions]);

  return (
    <div
      className="tripin-soft-map relative rounded-2xl overflow-hidden shadow-soft border border-gray-100"
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
        zoomAnimation={false}
        fadeAnimation={false}
        markerZoomAnimation={false}
      >
        <RecenterMap
          positions={positions}
          defaultCenter={defaultCenter}
          focusPosition={focusPosition}
        />
        <ClickToEnableScrollZoom />

        <TileLayer
          eventHandlers={{ tileerror: () => setTileFailed(true) }}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Route line */}
        {drawnPositions.length > 1 && (
          <Polyline
            positions={drawnPositions}
            color="#176B67"
            weight={3}
            opacity={0.85}
            dashArray="7, 5"
          />
        )}

        {/* Markers */}
        {validActivities.map((activity, idx) => (
          <Marker
            key={activity.id || idx}
            position={[activity.lat, activity.lng]}
            icon={createNumberedIcon(
              idx + 1,
              "#F4A261",
              pulseNext && idx === 0,
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
