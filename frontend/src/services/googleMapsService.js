const valid = (p) =>
  p &&
  Number.isFinite(p.lat) &&
  Number.isFinite(p.lng) &&
  Math.abs(p.lat) <= 90 &&
  Math.abs(p.lng) <= 180;
const pair = (p) => `${p.lat},${p.lng}`;
export function navigationLinks(day, places) {
  const byId = Object.fromEntries(places.map((p) => [p.id, p]));
  const points = [
    day.startAnchor,
    ...day.stops.map((s) => byId[s.placeId]?.coordinates),
    day.endAnchor,
  ];
  if (!points.every(valid)) throw new Error("Koordinat rute belum lengkap.");
  const links = [];
  for (let i = 0; i < points.length - 1; ) {
    let end = Math.min(i + 4, points.length - 1),
      url;
    do {
      const params = new URLSearchParams({
        api: "1",
        origin: pair(points[i]),
        destination: pair(points[end]),
        travelmode: "driving",
      });
      if (end - i > 1)
        params.set(
          "waypoints",
          points
            .slice(i + 1, end)
            .map(pair)
            .join("|"),
        );
      url = `https://www.google.com/maps/dir/?${params}`;
      if (url.length <= 2048) break;
      end--;
    } while (end > i);
    if (end <= i) throw new Error("URL navigasi terlalu panjang.");
    links.push(url);
    i = end;
  }
  return links;
}
