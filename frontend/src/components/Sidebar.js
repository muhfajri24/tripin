import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Home, Sparkles, Compass, BookOpen,
  ChevronLeft, ChevronRight, X
} from 'lucide-react';
import clsx from 'clsx';
import logoFull from '../assets/logo-full.png';
import logoIcon from '../assets/logo-icon.png';
import { loadTrips } from '../services/itineraryStorage';

const navItems = [
  { label: 'Home', icon: Home, path: '/' },
  { label: 'Plan a Trip', icon: Sparkles, path: '/create' },
  { label: 'My Trips', icon: BookOpen, path: '/my-itineraries', dynamicBadge: 'trips' },
  { label: 'Explore Yogyakarta', icon: Compass, path: '/discovery' },
];

function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onMobileClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [tripCount, setTripCount] = useState(0);

  useEffect(() => {
    const refresh = () => {
      try {
        setTripCount(loadTrips().length);
      } catch (e) {
        setTripCount(0);
      }
    };
    refresh();
    window.addEventListener('tripin:trips-changed', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('tripin:trips-changed', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [location.pathname]);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={clsx(
          'hidden lg:flex flex-col text-white sidebar-transition relative z-20 flex-shrink-0 select-none border-r',
          collapsed ? 'w-[72px]' : 'w-[240px]'
        )}
        style={{
          background: '#0d2221',
          borderColor: 'rgba(255, 255, 255, 0.06)',
        }}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
          navigate={navigate}
          tripCount={tripCount}
        />
      </aside>

      {/* Mobile Drawer */}
      <aside
        className={clsx(
          'flex lg:hidden flex-col text-white fixed left-0 top-0 h-full z-40 w-[260px] sidebar-transition select-none shadow-2xl',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        inert={mobileOpen ? undefined : ""}
        aria-hidden={!mobileOpen}
        style={{ background: '#0d2221' }}
      >
        <SidebarContent
          collapsed={false}
          onToggleCollapse={onMobileClose}
          navigate={navigate}
          isMobile
          onClose={onMobileClose}
          tripCount={tripCount}
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
}) {
  return (
    <div className="flex flex-col h-full py-4 px-3">
      {/* Brand Header */}
      <div
        className={clsx(
          'flex items-center pb-4 mb-3 border-b',
          collapsed ? 'justify-center' : 'justify-between px-2'
        )}
        style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
      >
        {!collapsed ? (
          <button
            onClick={() => navigate('/')}
            className="flex items-center focus:outline-none"
          >
            <img
              src={logoFull}
              alt="TRIPIN"
              className="h-8 w-auto object-contain"
            />
          </button>
        ) : (
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center p-1 focus:outline-none"
            title="TRIPIN"
          >
            <img
              src={logoIcon}
              alt="TRIPIN"
              className="w-8 h-8 object-contain"
            />
          </button>
        )}

        {!isMobile ? (
          <button
            onClick={onToggleCollapse}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            title={collapsed ? 'Perluas Menu' : 'Ciutkan Menu'}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        ) : (
          <button
            aria-label="Tutup menu"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Primary CTA: Buat Trip */}
      <div className="mb-4">
        {!collapsed ? (
          <button
            onClick={() => {
              navigate('/create');
              if (isMobile && onClose) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 text-white rounded-xl px-4 py-2.5 font-bold text-xs transition-all hover:opacity-95 active:scale-[0.98] shadow-sm"
            style={{
              background: '#FF6B5E',
            }}
          >
            <Sparkles size={14} />
            <span>Plan a Trip</span>
          </button>
        ) : (
          <button
            onClick={() => navigate('/create')}
            className="w-full flex items-center justify-center rounded-xl p-2.5 transition-all hover:opacity-95"
            title="Plan a Trip"
            style={{ background: '#FF6B5E' }}
          >
            <Sparkles size={16} />
          </button>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          let countBadge = null;
          if (item.dynamicBadge === 'trips' && tripCount > 0) countBadge = tripCount;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              aria-label={item.label}
              end={item.path === "/"}
              title={collapsed ? item.label : ''}
              onClick={() => {
                if (isMobile && onClose) onClose();
              }}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors group relative',
                collapsed ? 'justify-center px-2' : '',
                isActive
                  ? 'bg-white/10 text-white font-bold'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              )}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full"
                      style={{ background: '#176B67' }}
                    />
                  )}

                  <item.icon
                    size={18}
                    className={clsx(
                      'flex-shrink-0 transition-colors',
                      isActive ? 'text-teal-light' : 'text-white/50 group-hover:text-white'
                    )}
                  />

                  {!collapsed && (
                    <span className="flex-1 text-left truncate">{item.label}</span>
                  )}

                  {!collapsed && countBadge !== null && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-white/70">
                      {countBadge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Minimal Footer */}
      {!collapsed && (
        <div className="pt-3 border-t border-white/5 text-[11px] text-white/40 px-2 flex items-center justify-between">
          <span>TRIPIN v1.2</span>
          <span>Open Web</span>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
