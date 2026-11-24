import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
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
import { CustomCursor, ToastContainer, SmoothScroll, PageTransition } from './motion';

function TripRedirect({ edit = false }) {
  const { id } = useParams();
  return <Navigate replace to={`/itinerary/${id}${edit ? '/edit' : ''}`} />;
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname.startsWith('/itinerary/') ? '/itinerary' : location.pathname}>
        {/* Landing page - public, full hero */}
        <Route
          path="/"
          element={
            <PageTransition>
              <LandingPage />
            </PageTransition>
          }
        />

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

          {/* Legacy & parameter redirects to prevent 404s */}
          <Route path="/explore" element={<Navigate to="/discovery" replace />} />
          <Route path="/itinerary/:id/reschedule" element={<TripRedirect edit />} />
          <Route path="/itinerary/:id/budget" element={<TripRedirect />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SmoothScroll>
        {/* Awwwards Custom Dual-Layer Cursor */}
        <CustomCursor />

        {/* Animated Toast System */}
        <ToastContainer />

        {/* Motion Routed Views */}
        <AnimatedRoutes />
      </SmoothScroll>
    </BrowserRouter>
  );
}
