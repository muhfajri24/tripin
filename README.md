# TRIPIN — AI-Powered Travel Itinerary Planner

A modern, premium frontend for an AI travel itinerary planner built with React.js and Tailwind CSS.

## 🚀 Quick Start

```bash
# 1. Masuk folder frontend dan install dependencies
cd frontend
npm ci

# 2. Start development server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
frontend/src/
├── components/          # Reusable UI components
│   ├── Sidebar.js       # Fixed/collapsible navigation sidebar
│   ├── Navbar.js        # Top navigation bar
│   ├── DestinationCard.js
│   ├── ItineraryTimeline.js
│   ├── MapView.js       # Leaflet + OpenStreetMap
│   ├── BudgetCard.js
│   ├── RecommendationCard.js
│   ├── OptimizationSelector.js
│   ├── RescheduleModal.js
│   ├── SearchInput.js
│   ├── EmptyState.js
│   └── LoadingSkeleton.js
│
├── layouts/
│   └── AppLayout.js     # Main layout with sidebar + navbar
│
├── pages/               # Route pages
│   ├── LandingPage.js
│   ├── DashboardPage.js
│   ├── CreateItineraryPage.js
│   ├── ItineraryResultPage.js
│   ├── ItineraryEditorPage.js
│   ├── SmartReschedulerPage.js
│   ├── BudgetOverviewPage.js
│   ├── ExplorePage.js
│   ├── MyItinerariesPage.js
│   ├── SavedPlacesPage.js
│   └── SettingsPage.js
│
├── data/
│   └── mockData.js      # All mock data (replace with API calls)
│
├── App.js               # Router + routes
└── index.css            # Global styles + Tailwind directives
```

## 🎨 Design System

| Color | Hex | Usage |
|-------|-----|-------|
| Warm Coral | `#FF6B5E` | Primary accent, CTAs |
| Sunshine Yellow | `#FFC857` | Highlights, badges |
| Deep Teal | `#176B67` | Navigation, secondary buttons |
| Sky Blue | `#EAF4F4` | Backgrounds, tags |
| Warm Cream | `#FFF9F0` | Main background |
| Charcoal | `#253238` | Main text |

## 🗺️ Pages & Navigation

| Route | Page |
|-------|------|
| `/` | Landing Page |
| `/dashboard` | Dashboard |
| `/explore` | Explore Destinations |
| `/my-itineraries` | My Itineraries |
| `/create` | Create Itinerary |
| `/itinerary/:id` | Itinerary Results |
| `/itinerary/:id/edit` | Itinerary Editor |
| `/itinerary/:id/reschedule` | Smart Rescheduler |
| `/itinerary/:id/budget` | Budget Overview |
| `/saved` | Saved Places |
| `/settings` | Settings |

## 🔌 Connecting to a Real Backend

All mock data is in `frontend/src/data/mockData.js`. To connect to a real API:

1. Replace the mock data exports with API calls
2. Each function returns the same shape as the mock data
3. Add a `.env` file: `REACT_APP_API_URL=https://your-api.com`

## 📦 Dependencies

- `react-router-dom` — Client-side routing
- `react-leaflet` + `leaflet` — Interactive maps (OpenStreetMap)
- `lucide-react` — Icons
- `clsx` — Conditional class names
- `tailwindcss` — Utility-first CSS


## Backend foundation (Phase 1)

FastAPI dan canonical contracts tersedia di [backend/README.md](backend/README.md). Panduan tersebut menjelaskan startup, tests, schema export, dan keterbatasan dataset. Frontend lama belum terintegrasi dengan backend.


## Repository layout

```text
frontend/       React: src/, public/, package.json, Tailwind config
backend/        FastAPI, canonical models, dataset, dan tests
contracts/      JSON schemas dan contract fixtures
```

Jalankan perintah npm dari `frontend/`. Backend tetap dijalankan dari `backend/`;
lihat [panduan backend](backend/README.md). Kedua aplikasi belum terintegrasi.
