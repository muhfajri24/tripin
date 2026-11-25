import { Link, useLocation, useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import { Search, Menu, X } from 'lucide-react';
import logoIcon from '../assets/logo-icon.png';
const titles = { '/discovery': 'Explore Yogyakarta', '/my-itineraries': 'My Trips', '/create': 'Plan a Trip' };
export default function Navbar({ onMenuToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  return (
    <header className="sticky top-0 z-30 px-4 md:px-6 py-3 flex items-center justify-between gap-3 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="flex items-center gap-3 min-w-0">
        <button aria-label="Buka menu" onClick={onMenuToggle} className="lg:hidden p-2 rounded-lg hover:bg-gray-100"><Menu size={20} /></button>
        <Link to="/" aria-label="Home" className="lg:hidden flex-shrink-0"><img src={logoIcon} alt="TRIPIN" className="w-7 h-7 object-contain" /></Link>
        <p className="hidden lg:block font-extrabold text-charcoal">{titles[location.pathname] || 'Itinerary'}</p>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); navigate(`/discovery?q=${encodeURIComponent(query.trim())}`); }} className="flex items-center gap-2 rounded-xl px-3 py-1.5 bg-gray-50 border border-gray-200 w-48 sm:w-64 max-w-full">
        <Search size={14} className="flex-shrink-0" />
        <input aria-label="Cari katalog" placeholder="Cari tempat Yogyakarta" value={query} onChange={(e) => setQuery(e.target.value)} className="bg-transparent text-xs outline-none w-full min-w-0" />
        {query && <button type="button" aria-label="Hapus pencarian" onClick={() => setQuery('')}><X size={12} /></button>}
      </form>
    </header>
  );
}
