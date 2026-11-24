import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Sparkles, Compass, BookOpen, Heart, Settings,
  ChevronLeft, ChevronRight, Plus, X, Globe, MapPin, Award
} from 'lucide-react';
import clsx from 'clsx';
import logoFull from '../assets/logo-full.png';
import logoIcon from '../assets/logo-icon.png';
import { getStoredItineraries, mockDestinations, mockLocalBusinesses } from '../data/mockData';

const navItems = [
  { label: 'Dashboard',       icon: LayoutDashboard, path: '/dashboard',       badge: null },
  { label: 'Local Discovery', icon: Compass,         path: '/discovery',       badge: 'Nusantara' },
  { label: 'My Itineraries',  icon: BookOpen,        path: '/my-itineraries',  badge: 'dynamic-trips' },
  { label: 'Saved Places',    icon: Heart,           path: '/saved',           badge: 'dynamic-saved' },
  { label: 'Settings',        icon: Settings,        path: '/settings',        badge: null },
];

const INDONESIA_QUOTES = [
  { text: 'Jangan mati sebelum ke Banda Neira.', author: 'Sutan Sjahrir', location: 'Maluku' },
  { text: 'Tanah air yang kaya budaya & keramahan.', author: 'TRIPIN', location: 'Nusantara' },
  { text: 'Setiap sudut Indonesia punya cerita.', author: 'Kembara', location: '38 Provinsi' },
  { text: 'Dukung UMKM lokal di tiap langkahmu.', author: 'SDG 8', location: 'Indonesia' },
];

function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onMobileClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Dynamic counts for badges
  const [tripCount, setTripCount] = useState(3);
  const [savedCount, setSavedCount] = useState(5);
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    try {
      const trips = getStoredItineraries();
      setTripCount(trips ? trips.length : 3);
      
      const savedDests = mockDestinations.filter(d => d.saved).length;
      const savedUMKM = mockLocalBusinesses.filter(b => b.saved).length;
      setSavedCount(savedDests + savedUMKM);
    } catch (e) {
      // fallback
    }
  }, [location.pathname]);

  const rotateQuote = (e) => {
    e.stopPropagation();
    setQuoteIdx((prev) => (prev + 1) % INDONESIA_QUOTES.length);
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={clsx(
          'hidden lg:flex flex-col text-white sidebar-transition relative z-20 flex-shrink-0 select-none',
          collapsed ? 'w-[76px]' : 'w-[252px]'
        )}
        style={{
          background: 'linear-gradient(185deg, #0e2726 0%, #0a1c1b 50%, #061413 100%)',
          boxShadow: '4px 0 28px rgba(0, 0, 0, 0.35)',
          borderRight: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
          navigate={navigate}
          tripCount={tripCount}
          savedCount={savedCount}
          currentQuote={INDONESIA_QUOTES[quoteIdx]}
          onRotateQuote={rotateQuote}
        />
      </aside>

      {/* Mobile drawer */}
      <aside
        className={clsx(
          'flex lg:hidden flex-col text-white fixed left-0 top-0 h-full z-40 w-[285px] sidebar-transition select-none',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{
          background: 'linear-gradient(185deg, #0e2726 0%, #0a1c1b 50%, #061413 100%)',
          boxShadow: '6px 0 36px rgba(0, 0, 0, 0.55)',
        }}
      >
        <SidebarContent
          collapsed={false}
          onToggleCollapse={onMobileClose}
          navigate={navigate}
          isMobile
          onClose={onMobileClose}
          tripCount={tripCount}
          savedCount={savedCount}
          currentQuote={INDONESIA_QUOTES[quoteIdx]}
          onRotateQuote={rotateQuote}
        />
      </aside>
    </>
  );
}

function SidebarContent({
  collapsed,
  onToggleCollapse,
  navigate,
  isMobile,
  onClose,
  tripCount,
  savedCount,
  currentQuote,
  onRotateQuote
}) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Brand Header ── */}
      <div
        className={clsx(
          'flex items-center px-4 py-4.5 relative transition-all',
          collapsed ? 'justify-center' : 'justify-between'
        )}
        style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}
      >
        {!collapsed ? (
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 group text-left focus:outline-none transition-transform hover:scale-[1.02]"
          >
            <img
              src={logoFull}
              alt="TRIPIN"
              className="h-10 w-auto max-w-[165px] object-contain drop-shadow"
              style={{ filter: 'brightness(1.1) drop-shadow(0 2px 10px rgba(255,200,87,0.25))' }}
            />
          </button>
        ) : (
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center p-1.5 focus:outline-none hover:scale-110 transition-transform"
            title="TRIPIN Home"
          >
            <img
              src={logoIcon}
              alt="TRIPIN"
              className="w-9 h-9 object-contain"
              style={{ filter: 'drop-shadow(0 2px 8px rgba(255,200,87,0.3))' }}
            />
          </button>
        )}

        {!isMobile ? (
          <button
            onClick={onToggleCollapse}
            className="w-7 h-7 rounded-xl flex items-center justify-center transition-all hover:scale-110 hover:bg-white/15"
            style={{
              background: 'rgba(255, 255, 255, 0.07)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
            title={collapsed ? 'Perluas Menu' : 'Ciutkan Menu'}
          >
            {collapsed
              ? <ChevronRight size={13} className="text-white/80" />
              : <ChevronLeft size={13} className="text-white/80" />
            }
          </button>
        ) : (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-white/15"
            style={{ background: 'rgba(255, 255, 255, 0.08)' }}
          >
            <X size={15} className="text-white/80" />
          </button>
        )}
      </div>

      {/* ── Action: AI Trip Planner CTA ── */}
      <div className={clsx('px-3.5 pt-3.5 pb-2', collapsed ? 'px-2.5' : '')}>
        {!collapsed ? (
          <button
            onClick={() => {
              navigate('/create');
              if (isMobile && onClose) onClose();
            }}
            className="w-full flex items-center justify-center gap-2.5 text-white rounded-2xl px-4 py-3 font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] group relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #FF6B5E 0%, #E55A4E 50%, #FFC857 100%)',
              backgroundSize: '200% 200%',
              boxShadow: '0 8px 24px rgba(255, 107, 94, 0.35)',
            }}
          >
            <Sparkles size={16} className="text-yellow-trip animate-spin-slow flex-shrink-0" />
            <span className="tracking-tight text-white font-extrabold drop-shadow">AI Trip Planner</span>
            <span className="text-[10px] bg-white/25 px-1.5 py-0.5 rounded-full font-bold ml-auto">
              Cerdas
            </span>
          </button>
        ) : (
          <button
            onClick={() => navigate('/create')}
            className="w-full flex items-center justify-center rounded-2xl p-3 transition-all hover:scale-110 active:scale-95 group"
            title="AI Trip Planner Cerdas"
            style={{
              background: 'linear-gradient(135deg, #FF6B5E 0%, #E55A4E 100%)',
              boxShadow: '0 6px 18px rgba(255, 107, 94, 0.4)',
            }}
          >
            <Sparkles size={18} className="text-white animate-spin-slow" />
          </button>
        )}
      </div>

      {/* ── Subtitle / Navigation Section ── */}
      {!collapsed && (
        <div className="px-5 pt-2 pb-1 flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-light/80">
            Jelajah Aplikasi
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-soft" />
        </div>
      )}

      {/* ── Navigation Links ── */}
      <nav className="flex-1 px-2.5 py-1.5 space-y-1.5 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          let badgeText = item.badge;
          if (item.badge === 'dynamic-trips') badgeText = tripCount > 0 ? `${tripCount}` : null;
          if (item.badge === 'dynamic-saved') badgeText = savedCount > 0 ? `${savedCount}` : null;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : ''}
              onClick={() => {
                if (isMobile && onClose) onClose();
              }}
              className={({ isActive }) => clsx(
                'relative flex items-center gap-3.5 rounded-2xl px-3.5 py-3 text-sm font-semibold transition-all group',
                collapsed ? 'justify-center px-2 py-3' : '',
                isActive
                  ? 'text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
              )}
              style={({ isActive }) => isActive ? {
                background: 'linear-gradient(135deg, rgba(23, 107, 103, 0.85) 0%, rgba(30, 138, 133, 0.65) 100%)',
                boxShadow: '0 6px 20px rgba(23, 107, 103, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              } : {}}
            >
              {({ isActive }) => (
                <>
                  {/* Glowing active indicator bar on the left */}
                  {isActive && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 rounded-r-full"
                      style={{
                        background: 'linear-gradient(180deg, #FFC857 0%, #FF6B5E 100%)',
                        boxShadow: '0 0 10px rgba(255, 107, 94, 0.8)',
                      }}
                    />
                  )}

                  <item.icon
                    size={20}
                    className={clsx(
                      'flex-shrink-0 transition-transform duration-300 group-hover:scale-110',
                      isActive ? 'text-yellow-trip drop-shadow' : 'text-white/60 group-hover:text-white'
                    )}
                  />

                  {!collapsed && (
                    <span className="font-bold tracking-tight text-sm">
                      {item.label}
                    </span>
                  )}

                  {!collapsed && badgeText && (
                    <span
                      className={clsx(
                        'ml-auto text-[10px] font-extrabold px-2 py-0.5 rounded-full transition-all',
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-white/10 text-white/70 group-hover:bg-white/15 group-hover:text-white'
                      )}
                    >
                      {badgeText}
                    </span>
                  )}

                  {/* Dot when collapsed and active */}
                  {collapsed && isActive && (
                    <span className="absolute right-1.5 top-2 w-2 h-2 rounded-full bg-yellow-trip" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ── Footer: Travel Inspiration Snippet ── */}
      {!collapsed && (
        <div className="p-3 mt-auto">
          <div
            onClick={onRotateQuote}
            className="p-3.5 rounded-2xl cursor-pointer transition-all hover:bg-white/[0.08] active:scale-[0.99] border relative group"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              borderColor: 'rgba(255, 255, 255, 0.08)',
            }}
            title="Klik untuk melihat kutipan perjalanan lainnya"
          >
            <div className="flex items-center justify-between text-[10px] text-teal-light font-bold mb-1.5">
              <span className="flex items-center gap-1 text-yellow-trip">
                <Globe size={11} /> {currentQuote.location}
              </span>
              <span className="text-white/40 group-hover:text-white/80 transition-colors">
                Ganti ↻
              </span>
            </div>
            <p className="text-xs text-white/85 font-medium leading-snug italic">
              "{currentQuote.text}"
            </p>
            <p className="text-[10px] text-white/45 mt-1 font-semibold text-right">
              — {currentQuote.author}
            </p>
          </div>

          {/* Open Platform Tag */}
          <div className="flex items-center justify-center gap-1.5 mt-2.5 text-[10px] text-white/40 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Open Travel Platform · Tanpa Login</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
