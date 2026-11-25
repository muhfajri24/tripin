import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import CreateItineraryPage from './pages/CreateItineraryPage';
import ItineraryResultPage from './pages/ItineraryResultPage';
import ItineraryEditorPage from './pages/ItineraryEditorPage';
import LocalDiscoveryPage from './pages/LocalDiscoveryPage';
import MyItinerariesPage from './pages/MyItinerariesPage';
import AppLayout from './layouts/AppLayout';

function TripRedirect({ edit = false }) {
  const { id } = useParams();
  return <Navigate replace to={`/itinerary/${id}${edit ? '/edit' : ''}`} />;
}

function TripPage({ edit = false }) {
  const { id } = useParams();
  return edit ? <ItineraryEditorPage key={id} /> : <ItineraryResultPage key={id} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing page - public, full hero */}
        <Route path="/" element={<LandingPage />} />

        {/* Guest pages with sidebar navigation */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Navigate to="/my-itineraries" replace />} />
          <Route path="/discovery" element={<LocalDiscoveryPage />} />
          <Route path="/create" element={<CreateItineraryPage />} />
          <Route path="/my-itineraries" element={<MyItinerariesPage />} />
          <Route path="/itinerary/:id" element={<TripPage />} />
          <Route path="/itinerary/:id/edit" element={<TripPage edit />} />
          <Route path="/saved" element={<Navigate to="/discovery" replace />} />
          <Route path="/settings" element={<Navigate to="/my-itineraries" replace />} />

          {/* Legacy & parameter redirects to prevent 404s */}
          <Route path="/explore" element={<Navigate to="/discovery" replace />} />
          <Route path="/itinerary/:id/reschedule" element={<TripRedirect edit />} />
          <Route path="/itinerary/:id/budget" element={<TripRedirect />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
