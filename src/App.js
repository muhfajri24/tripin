import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import CreateItineraryPage from './pages/CreateItineraryPage';
import ItineraryResultPage from './pages/ItineraryResultPage';
import ItineraryEditorPage from './pages/ItineraryEditorPage';
import LocalDiscoveryPage from './pages/LocalDiscoveryPage';
import MyItinerariesPage from './pages/MyItinerariesPage';
import SavedPlacesPage from './pages/SavedPlacesPage';
import SettingsPage from './pages/SettingsPage';
import AppLayout from './layouts/AppLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing page - public, full hero */}
        <Route path="/" element={<LandingPage />} />

        {/* Authenticated app pages with sidebar navigation */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/discovery" element={<LocalDiscoveryPage />} />
          <Route path="/create" element={<CreateItineraryPage />} />
          <Route path="/my-itineraries" element={<MyItinerariesPage />} />
          <Route path="/itinerary/:id" element={<ItineraryResultPage />} />
          <Route path="/itinerary/:id/edit" element={<ItineraryEditorPage />} />
          <Route path="/saved" element={<SavedPlacesPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Legacy redirects to prevent 404s */}
          <Route path="/explore" element={<Navigate to="/discovery" replace />} />
          <Route path="/itinerary/:id/reschedule" element={<Navigate to="/itinerary/:id/edit" replace />} />
          <Route path="/itinerary/:id/budget" element={<Navigate to="/itinerary/:id" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
