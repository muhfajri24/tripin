import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import CreateItineraryPage from "./pages/CreateItineraryPage";
import ItineraryResultPage from "./pages/ItineraryResultPage";
import ItineraryEditorPage from "./pages/ItineraryEditorPage";
import LocalDiscoveryPage from "./pages/LocalDiscoveryPage";
import MyItinerariesPage from "./pages/MyItinerariesPage";
import AppLayout from "./layouts/AppLayout";
function TripRedirect({ edit = false }) {
  const { id } = useParams();
  return <Navigate replace to={`/itinerary/${id}${edit ? "/edit" : ""}`} />;
}
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<AppLayout />}>
          <Route path="/create" element={<CreateItineraryPage />} />
          <Route path="/my-itineraries" element={<MyItinerariesPage />} />
          <Route path="/discovery" element={<LocalDiscoveryPage />} />
          <Route path="/itinerary/:id" element={<ItineraryResultPage />} />
          <Route path="/itinerary/:id/edit" element={<ItineraryEditorPage />} />
          <Route
            path="/dashboard"
            element={<Navigate replace to="/my-itineraries" />}
          />
          <Route
            path="/settings"
            element={<Navigate replace to="/my-itineraries" />}
          />
          <Route path="/saved" element={<Navigate replace to="/discovery" />} />
          <Route
            path="/explore"
            element={<Navigate replace to="/discovery" />}
          />
          <Route
            path="/itinerary/:id/reschedule"
            element={<TripRedirect edit />}
          />
          <Route path="/itinerary/:id/budget" element={<TripRedirect />} />
        </Route>
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
