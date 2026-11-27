import React, { Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import CreateItineraryPage from './pages/CreateItineraryPage';
import ItineraryResultPage from './pages/ItineraryResultPage';
import ItineraryEditorPage from './pages/ItineraryEditorPage';
import LocalDiscoveryPage from './pages/LocalDiscoveryPage';
import MyItinerariesPage from './pages/MyItinerariesPage';
import DashboardPage from './pages/DashboardPage';
import SavedPlacesPage from './pages/SavedPlacesPage';
import SettingsPage from './pages/SettingsPage';
import AppLayout from './layouts/AppLayout';
import { CustomCursor, ToastContainer, SmoothScroll, PageTransition } from './motion';

// Robust Error Boundary to guarantee the screen NEVER goes blank
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('TRIPIN Error Boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-coral/10 text-coral flex items-center justify-center mb-4 text-2xl font-bold">
            !
          </div>
          <h2 className="text-xl font-extrabold text-charcoal mb-2">
            Terjadi kendala saat memuat halaman
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-lighter max-w-md mb-6">
            Data atau tampilan sedang disinkronkan. Silakan muat ulang halaman untuk melanjutkan penjelajahan.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-teal text-white font-bold text-xs shadow-md hover:bg-teal-dark transition-all"
          >
            Muat Ulang Halaman
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
    <ErrorBoundary>
      <BrowserRouter>
        <SmoothScroll>
          {/* Awwwards Custom Dual-Layer Cursor */}
          <CustomCursor />

          {/* Animated Toast System */}
          <ToastContainer />

          {/* App Routes */}
          <Routes>
            {/* Landing page - public, full hero */}
            <Route
              path="/"
              element={
                <PageTransition>
                  <LandingPage />
                </PageTransition>
              }
            />

            {/* Guest pages with sidebar navigation */}
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/discovery" element={<LocalDiscoveryPage />} />
              <Route path="/create" element={<CreateItineraryPage />} />
              <Route path="/my-itineraries" element={<MyItinerariesPage />} />
              <Route path="/itinerary/:id" element={<TripPage />} />
              <Route path="/itinerary/:id/edit" element={<TripPage edit />} />
              <Route path="/saved" element={<SavedPlacesPage />} />
              <Route path="/settings" element={<SettingsPage />} />

              {/* Legacy & parameter redirects to prevent 404s */}
              <Route path="/explore" element={<Navigate to="/discovery" replace />} />
              <Route path="/itinerary/:id/reschedule" element={<TripRedirect edit />} />
              <Route path="/itinerary/:id/budget" element={<TripRedirect />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SmoothScroll>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
