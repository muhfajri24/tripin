import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Search, Menu, X, Settings } from 'lucide-react';
import logoIcon from '../assets/logo-icon.png';
import { mockNotifications } from '../data/mockData';

const breadcrumbMap = {
  '/dashboard':       { label: 'Dashboard' },
  '/discovery':       { label: 'Local Discovery' },
  '/my-itineraries':  { label: 'My Itineraries' },
  '/create':          { label: 'AI Trip Planner' },
  '/saved':           { label: 'Saved Places' },
  '/settings':        { label: 'Settings' },
};

function Navbar({ onMenuToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);

  const unread = mockNotifications.filter((n) => !n.read).length;
  const pageInfo = breadcrumbMap[location.pathname] || {
    label: location.pathname.includes('/itinerary/') ? 'Hasil Itinerary AI' : 'TRIPIN',
  };

  // Close notif dropdown on outside click
  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e) => {
      if (!e.target.closest('.notif-dropdown')) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/discovery?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-30 px-4 md:px-6 py-3 flex items-center justify-between gap-4 bg-white/80 backdrop-blur-md border-b border-gray-100">
      {/* Mobile drawer toggle & Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-charcoal transition-colors"
          title="Buka Menu"
        >
          <Menu size={20} />
        </button>

        <div
          className="lg:hidden flex items-center gap-1.5 cursor-pointer"
          onClick={() => navigate('/dashboard')}
        >
          <img src={logoIcon} alt="TRIPIN" className="w-7 h-7 object-contain" />
          <span className="font-extrabold text-sm text-charcoal tracking-tight">TRIPIN</span>
        </div>

        {/* Page Title (Desktop) */}
        <div className="hidden lg:block">
          <h1 className="font-extrabold text-charcoal text-base tracking-tight">
            {pageInfo.label}
          </h1>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2.5">
        {/* Global Search Bar */}
        <form
          onSubmit={handleSearch}
          className="flex items-center gap-2 rounded-xl px-3 py-1.5 bg-gray-50 border border-gray-200 focus-within:border-teal focus-within:bg-white transition-all w-44 sm:w-64"
        >
          <Search size={14} className="text-charcoal-lighter flex-shrink-0" />
          <input
            type="text"
            placeholder="Cari destinasi atau UMKM..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-charcoal placeholder:text-gray-400 outline-none w-full"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-gray-400 hover:text-charcoal"
            >
              <X size={12} />
            </button>
          )}
        </form>

        {/* Notifications */}
        <div className="relative notif-dropdown">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 text-charcoal transition-colors relative"
            title="Notifikasi"
          >
            <Bell size={17} />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-coral" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-10 w-80 rounded-2xl shadow-lg border border-gray-100 z-50 overflow-hidden bg-white animate-fadeIn">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="font-bold text-xs text-charcoal">Notifikasi</span>
                {unread > 0 && (
                  <span className="text-[10px] bg-coral/10 text-coral font-bold px-2 py-0.5 rounded-full">
                    {unread} baru
                  </span>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                {mockNotifications.map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-2.5 hover:bg-gray-50 transition-colors text-xs ${
                      !n.read ? 'bg-teal/[0.02]' : ''
                    }`}
                  >
                    <p className="text-charcoal font-medium leading-snug">{n.message}</p>
                    <p className="text-[10px] text-charcoal-lighter mt-1">{n.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Settings button */}
        <button
          onClick={() => navigate('/settings')}
          className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 text-charcoal-lighter hover:text-charcoal transition-colors"
          title="Pengaturan"
        >
          <Settings size={17} />
        </button>
      </div>
    </header>
  );
}

export default Navbar;
