// ─── Routing & Distance Engine Service ───────────────────────────────────────
// Sources:
// 1. OSRM Public Routing API (OpenStreetMap network router - 100% Free)
// 2. Localized Haversine Calculation Fallback

import { calculateDistanceKm, calculateTravelTimeMin, formatMinutesToDuration } from '../data/mockData';

/**
 * Fetch driving distance and travel duration between two coordinates using OSRM
 * Fallback to Haversine if network is unavailable
 */
export async function computeRouteDistance(lat1, lon1, lat2, lon2, mode = 'car') {
  if (!lat1 || !lon1 || !lat2 || !lon2) {
    return { distanceKm: 0, durationMin: 0, distanceText: null, durationText: null };
  }

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
        const durationMin = Math.max(5, Math.round(route.duration / 60));
        return {
          distanceKm,
          durationMin,
          distanceText: `${distanceKm} km`,
          durationText: formatMinutesToDuration(durationMin),
        };
      }
    }
  } catch (err) {
    // Graceful fallback to offline Haversine calculation
  }

  // Offline Haversine Fallback
  const distanceKm = calculateDistanceKm(lat1, lon1, lat2, lon2);
  const durationMin = calculateTravelTimeMin(distanceKm, mode);
  return {
    distanceKm,
    durationMin,
    distanceText: `${distanceKm} km`,
    durationText: formatMinutesToDuration(durationMin),
  };
}

