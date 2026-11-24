import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Search, Menu, ChevronRight, X, Settings } from 'lucide-react';
import logoIcon from '../assets/logo-icon.png';
import { mockNotifications } from '../data/mockData';

const breadcrumbMap = {
  '/dashboard':       { label: 'Dashboard',              sub: 'Jelajahi Nusantara' },
  '/discovery':       { label: 'Local Discovery',        sub: 'UMKM & Hidden Gems' },
  '/my-itineraries':  { label: 'My Itineraries',         sub: 'Rencana Perjalananmu' },
  '/create':          { label: 'AI Trip Planner',        sub: 'Susun Itinerary Cerdas' },
  '/saved':           { label: 'Saved Places',           sub: 'Wishlist Destinasi' },
  '/settings':        { label: 'Settings',               sub: 'Preferensi & Pengaturan' },
};

function Navbar({ onMenuToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const unread = mockNotifications.filter((n) => !n.read).length;
  const pageInfo = breadcrumbMap[location.pathname] || { label: 'TRIPIN', sub: '' };

  useEffect(() => {
    const handleScroll = (e) => {
      setScrolled(e.target.scrollTop > 20);
    };
    const main = document.querySelector('main');
    if (main) {
      main.addEventListener('scroll', handleScroll);
      return () => main.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Close notif on outside click
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
      className="sticky top-0 z-10 px-4 md:px-6 py-3 flex items-center gap-3 transition-all duration-300"
      style={{
        background: scrolled
          ? 'rgba(255,249,240,0.92)'
          : 'rgba(255,249,240,0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: scrolled
          ? '1px solid rgba(23,107,103,0.1)'
          : '1px solid rgba(255,255,255,0.4)',
        boxShadow: scrolled ? '0 4px 20px rgba(37,50,56,0.06)' : 'none',
      }}
    >
      {/* Mobile hamburger */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-teal/10 transition-colors btn-press"
      >
        <Menu size={20} className="text-charcoal" />
      </button>

      {/* Mobile brand */}
      <div
        className="lg:hidden flex items-center gap-2 cursor-pointer"
        onClick={() => navigate('/dashboard')}
      >
        <img src={logoIcon} alt="TRIPIN" className="w-7 h-7 object-contain" />
        <span className="font-extrabold text-sm text-charcoal tracking-tight">
          TRIP<span className="text-coral">IN</span>
        </span>
      </div>

      {/* Page breadcrumb - desktop */}
      <div className="hidden md:flex flex-col flex-1 min-w-0">
        <span className="font-extrabold text-charcoal text-base leading-tight tracking-tight">
          {pageInfo.label}
        </span>
        {pageInfo.sub && (
          <span className="text-charcoal-lighter text-xs font-medium leading-tight">
            {pageInfo.sub}
          </span>
        )}
      </div>

      {/* Search bar */}
      <form
        onSubmit={handleSearch}
        className={`flex items-center gap-2 rounded-xl px-3 py-2 transition-all duration-300 ${
          searchOpen ? 'w-72' : 'w-10 md:w-56'
        }`}
        style={{
          background: 'rgba(37,50,56,0.06)',
          border: searchOpen ? '1.5px solid rgba(23,107,103,0.3)' : '1.5px solid transparent',
        }}
      >
        <button type="submit" className="flex-shrink-0">
          <Search size={15} className="text-charcoal-lighter" />
        </button>
        <input
          type="text"
          placeholder="Cari destinasi, UMKM, hidden gems..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setSearchOpen(true)}
          onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
          className="bg-transparent text-sm text-charcoal placeholder:text-gray-400 outline-none flex-1 hidden md:block"
        />
        {searchOpen && searchQuery && (
          <button
            type="button"
            onClick={() => { setSearchQuery(''); setSearchOpen(false); }}
            className="text-gray-400 hover:text-charcoal transition-colors"
          >
            <X size={13} />
          </button>
        )}
      </form>

      {/* Notification */}
      <div className="relative notif-dropdown">
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-teal/10 transition-colors btn-press"
        >
          <Bell size={18} className="text-charcoal" />
          {unread > 0 && (
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-coral"
              style={{ boxShadow: '0 0 0 2px #FFF9F0' }}
            />
          )}
        </button>

        {notifOpen && (
          <div
            className="absolute right-0 top-12 w-80 rounded-2xl shadow-card border border-gray-100 z-50 overflow-hidden animate-scaleIn"
            style={{ background: 'white' }}
          >
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid rgba(37,50,56,0.06)' }}
            >
              <h3 className="font-bold text-charcoal text-sm">Notifikasi</h3>
              {unread > 0 && (
                <span className="text-xs bg-coral/10 text-coral font-bold px-2 py-0.5 rounded-full">
                  {unread} baru
                </span>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {mockNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !n.read ? 'bg-teal/[0.03]' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        n.type === 'reminder' ? 'bg-coral' :
                        n.type === 'weather'  ? 'bg-blue-400' :
                        n.type === 'impact'   ? 'bg-emerald-500' : 'bg-teal'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-xs text-charcoal leading-snug font-medium">{n.message}</p>
                      <p className="text-[10px] text-charcoal-lighter mt-0.5">{n.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Settings shortcut */}
      <button
        onClick={() => navigate('/settings')}
        className="w-9 h-9 rounded-xl flex items-center justify-center text-charcoal-lighter hover:text-teal hover:bg-teal/10 transition-all flex-shrink-0 btn-press"
        title="Pengaturan"
      >
        <Settings size={18} />
      </button>
    </header>
  );
}

export default Navbar;
