# Frontend guest MVP

React/CRA, existing TRIPIN palette/layout/Leaflet. Run commands from this directory:

```powershell
npm ci
npm start
npm test -- --runInBand
npm run build
```

Default development URL: http://localhost:3000. `/api/v1` proxies to the FastAPI backend at
http://127.0.0.1:8011. Start backend separately. Optional REACT_APP_API_URL overrides the full
API base; see .env.example. Restart dev server after changing configuration.

Active pages: Landing, Create (parse/review/plan), Result, Editor, My Trips, Explore. Legacy
account/settings/saved routes redirect. Guest state is local, no fictional demo migration.
API data and calculations come from backend; mockData.js remains archival prototype code.

Storage failure/corruption is visible; a failed write is not displayed as success. Navigation
state keeps the current unsaved response available while the SPA remains open. Reload loses
unsaved state. Do not enter sensitive personal information into the brief.

Map is straight-line sequence with OSM attribution, not actual routing. Google Maps links
are split by day/segments. Supabase is never called from React. No paid AI/maps service.
Production hosting needs SPA fallback and HTTPS API/proxy plus matching CORS origin.
