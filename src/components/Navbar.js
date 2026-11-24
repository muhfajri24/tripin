import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Search, Menu, ChevronRight, X, Settings, Sparkles, MapPin } from 'lucide-react';
import logoIcon from '../assets/logo-icon.png';
import { mockNotifications } from '../data/mockData';

const breadcrumbMap = {
  '/dashboard':       { label: 'Dashboard',              sub: 'Inspirasi Perjalanan & Tren Wisata Nusantara' },
  '/discovery':       { label: 'Local Discovery',        sub: 'Eksplorasi Budaya, Adat & UMKM Seluruh Indonesia' },
  '/my-itineraries':  { label: 'My Itineraries',         sub: 'Kelola & Pantau Rencana Perjalananmu' },
  '/create':          { label: 'AI Trip Planner',        sub: 'Penyusun Rute Otomatis Berbasis Kecerdasan Buatan' },
  '/saved':           { label: 'Saved Places',           sub: 'Koleksi Destinasi & UMKM Favorit' },
  '/settings':        { label: 'Settings',               sub: 'Preferensi Wisata, Budget & Tampilan' },
};

function Navbar({ onMenuToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const unread = mockNotifications.filter((n) => !n.read).length;
  const pageInfo = breadcrumbMap[location.pathname] || {
    label: location.pathname.includes('/itinerary/') ? 'Hasil Rekomendasi AI' : 'TRIPIN',
    sub: 'Rencana Perjalanan Interaktif'
  };

  useEffect(() => {
    const handleScroll = (e) => {
      setScrolled(e.target.scrollTop > 15);
    };
    const main = document.querySelector('main');
    if (main) {
      main.addEventListener('scroll', handleScroll);
      return () => main.removeEventListener('scroll', handleScroll);
    }
  }, []);

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
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header
      className="sticky top-0 z-30 px-4 md:px-6 py-3 flex items-center gap-3.5 transition-all duration-300"
      style={{
        background: scrolled
          ? 'rgba(255, 249, 240, 0.94)'
          : 'rgba(255, 249, 240, 0.82)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: scrolled
          ? '1px solid rgba(23, 107, 103, 0.12)'
          : '1px solid rgba(37, 50, 56, 0.06)',
        boxShadow: scrolled ? '0 6px 24px rgba(37, 50, 56, 0.06)' : 'none',
      }}
    >
      {/* Mobile drawer toggle */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-teal/10 transition-colors btn-press text-charcoal"
        title="Buka Menu"
      >
        <Menu size={22} />
      </button>

      {/* Mobile brand emblem */}
      <div
        className="lg:hidden flex items-center gap-2 cursor-pointer"
        onClick={() => navigate('/dashboard')}
      >
        <img src={logoIcon} alt="TRIPIN" className="w-8 h-8 object-contain" />
        <span className="font-extrabold text-base text-charcoal tracking-tight">
          TRIP<span className="text-coral">IN</span>
        </span>
      </div>

      {/* Page Title & Subtitle (Desktop) */}
      <div className="hidden md:flex flex-col flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-charcoal text-base md:text-lg leading-tight tracking-tight">
            {pageInfo.label}
          </span>
          <span className="text-[10px] font-extrabold bg-teal/10 text-teal px-2 py-0.5 rounded-full flex items-center gap-1">
            🇮🇩 Indonesia
          </span>
        </div>
        {pageInfo.sub && (
          <span className="text-charcoal-lighter text-xs font-medium leading-tight mt-0.5 truncate">
            {pageInfo.sub}
          </span>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2.5 ml-auto">
        {/* Search bar */}
        <form
          onSubmit={handleSearch}
          className={`flex items-center gap-2 rounded-2xl px-3.5 py-2 transition-all duration-300 ${
            searchOpen ? 'w-64 sm:w-80' : 'w-10 md:w-60'
          }`}
          style={{
            background: 'rgba(37, 50, 56, 0.05)',
            border: searchOpen
              ? '1.5px solid rgba(23, 107, 103, 0.4)'
              : '1.5px solid rgba(37, 50, 56, 0.08)',
          }}
        >
          <button type="submit" className="flex-shrink-0 text-charcoal-lighter hover:text-teal transition-colors">
            <Search size={16} />
          </button>
          <input
            type="text"
            placeholder="Cari destinasi, budaya, UMKM..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
            className="bg-transparent text-xs sm:text-sm text-charcoal placeholder:text-gray-400 outline-none flex-1 hidden md:block"
          />
          {searchOpen && searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setSearchOpen(false); }}
              className="text-gray-400 hover:text-charcoal transition-colors flex-shrink-0"
            >
              <X size={13} />
            </button>
          )}
        </form>

        {/* AI Quick Button on desktop */}
        <button
          onClick={() => navigate('/create')}
          className="hidden sm:flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-2 rounded-xl text-white transition-all hover:scale-105 active:scale-95 btn-press"
          style={{
            background: 'linear-gradient(135deg, #176B67 0%, #1E8A85 100%)',
            boxShadow: '0 4px 14px rgba(23, 107, 103, 0.25)',
          }}
        >
          <Sparkles size={14} className="text-yellow-trip" />
          <span>Buat Trip</span>
        </button>

        {/* Notifications */}
        <div className="relative notif-dropdown">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-teal/10 transition-colors btn-press text-charcoal"
            title="Notifikasi"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span
                className="absolute top-2 right-2 w-2 h-2 rounded-full bg-coral animate-ping"
              />
            )}
            {unread > 0 && (
              <span
                className="absolute top-2 right-2 w-2 h-2 rounded-full bg-coral"
              />
            )}
          </button>

          {notifOpen && (
            <div
              className="absolute right-0 top-12 w-80 rounded-3xl shadow-card border border-gray-100 z-50 overflow-hidden animate-scaleIn bg-white"
            >
              <div
                className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-gray-100"
              >
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-charcoal text-sm">Notifikasi</h3>
                  {unread > 0 && (
                    <span className="text-[10px] bg-coral text-white font-extrabold px-2 py-0.5 rounded-full">
                      {unread} baru
                    </span>
                  )}
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {mockNotifications.map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 hover:bg-gray-50/80 transition-colors cursor-pointer ${
                      !n.read ? 'bg-teal/[0.04]' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div
                        className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                          n.type === 'reminder' ? 'bg-coral' :
                          n.type === 'weather'  ? 'bg-blue-400' :
                          n.type === 'impact'   ? 'bg-emerald-500' : 'bg-teal'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-charcoal leading-snug font-semibold">{n.message}</p>
                        <p className="text-[10px] text-charcoal-lighter mt-1">{n.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Settings button */}
        <button
          onClick={() => navigate('/settings')}
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-charcoal-lighter hover:text-teal hover:bg-teal/10 transition-all flex-shrink-0 btn-press"
          title="Pengaturan"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}

export default Navbar;
