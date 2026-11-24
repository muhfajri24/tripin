import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, Search } from "lucide-react";
export default function Navbar({ onMenuToggle }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const path = useLocation().pathname;
  const title = path.startsWith("/itinerary/")
    ? "Perjalanan Anda"
    : {
        "/create": "Plan a Trip",
        "/my-itineraries": "My Trips",
        "/discovery": "Explore Yogyakarta",
      }[path] || "TRIPIN";
  return (
    <header className="bg-white border-b px-4 md:px-6 py-3 flex gap-3 items-center">
      <button
        aria-label="Buka menu"
        className="lg:hidden"
        onClick={onMenuToggle}
      >
        <Menu size={22} />
      </button>
      <span className="hidden sm:block font-bold flex-1">{title}</span>
      <form
        className="flex flex-1 sm:flex-initial gap-2 items-center"
        onSubmit={(e) => {
          e.preventDefault();
          navigate(`/discovery?q=${encodeURIComponent(query)}`);
        }}
      >
        <input
          aria-label="Cari tempat Yogyakarta"
          placeholder="Cari tempat Yogyakarta"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-w-0 w-full sm:w-52"
        />
        <button aria-label="Cari" type="submit">
          <Search size={20} />
        </button>
      </form>
    </header>
  );
}
