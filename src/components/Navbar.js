import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Search, Menu, ChevronRight, X } from 'lucide-react';
import logoIcon from '../assets/logo-icon.png';
import { mockNotifications } from '../data/mockData';

const breadcrumbMap = {
  '/dashboard': ['Dashboard'],
  '/discovery': ['Local Discovery (UMKM & Hidden Gems)'],
  '/my-itineraries': ['My Itineraries'],
  '/create': ['AI Trip Planner'],
  '/saved': ['Saved Places'],
  '/settings': ['Settings'],
};

function Navbar({ onMenuToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);

  const unread = mockNotifications.filter((n) => !n.read).length;
  const crumbs = breadcrumbMap[location.pathname] || ['Page'];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/discovery?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 px-4 md:px-6 py-3 flex items-center gap-4 sticky top-0 z-10">
      {/* Mobile menu button */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
      >
        <Menu size={20} className="text-charcoal" />
      </button>

      {/* Mobile brand icon */}
      <div className="lg:hidden flex items-center gap-1.5 cursor-pointer" onClick={() => navigate('/dashboard')}>
        <img
          src={logoIcon}
          alt="TRIPIN"
          className="w-7 h-7 object-contain drop-shadow-sm"
        />
        <span className="font-extrabold text-sm text-charcoal tracking-tight">TRIP<span className="text-coral">IN</span></span>
      </div>

      {/* Breadcrumb */}
      <div className="hidden md:flex items-center gap-1.5 text-sm text-charcoal-lighter flex-1 min-w-0">
        <span className="font-medium text-charcoal">{crumbs[0]}</span>
        {crumbs.slice(1).map((crumb, i) => (
          <React.Fragment key={i}>
            <ChevronRight size={14} />
            <span className="text-charcoal">{crumb}</span>
          </React.Fragment>
        ))}
      </div>

      {/* Search bar */}
      <form
        onSubmit={handleSearch}
        className={`flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 transition-all ${
          searchOpen ? 'w-64' : 'w-10 md:w-64'
        }`}
      >
        <button type="submit" className="flex-shrink-0">
          <Search size={16} className="text-charcoal-lighter" />
        </button>
        <input
          type="text"
          placeholder="Cari UMKM, kuliner, hidden gems..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setSearchOpen(true)}
          className="bg-transparent text-sm text-charcoal placeholder:text-gray-400 outline-none flex-1 hidden md:block"
        />
        {searchOpen && searchQuery && (
          <button
            type="button"
            onClick={() => { setSearchQuery(''); setSearchOpen(false); }}
            className="md:hidden"
          >
            <X size={14} className="text-gray-400" />
          </button>
        )}
      </form>

      {/* Notification */}
      <div className="relative">
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
        >
          <Bell size={18} className="text-charcoal" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-coral rounded-full" />
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-card border border-gray-100 z-50 overflow-hidden animate-fadeInUp">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-charcoal text-sm">Notifikasi</h3>
              {unread > 0 && (
                <span className="text-xs bg-coral/10 text-coral font-medium px-2 py-0.5 rounded-full">
                  {unread} baru
                </span>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {mockNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors ${
                    !n.read ? 'bg-coral/5' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      n.type === 'reminder' ? 'bg-coral' :
                      n.type === 'weather' ? 'bg-blue-400' :
                      n.type === 'impact' ? 'bg-emerald-500' : 'bg-teal'
                    }`} />
                    <div className="min-w-0">
                      <p className="text-sm text-charcoal leading-snug">{n.message}</p>
                      <p className="text-xs text-charcoal-lighter mt-0.5">{n.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Avatar */}
      <button
        onClick={() => navigate('/settings')}
        className="flex-shrink-0"
      >
        <img
          src="https://i.pravatar.cc/150?img=12"
          alt="Profile"
          className="w-9 h-9 rounded-full object-cover ring-2 ring-coral/40 hover:ring-coral transition-all"
        />
      </button>
    </header>
  );
}

export default Navbar;
