import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Sparkles, Compass, BookOpen,
  ChevronLeft, ChevronRight, X
} from 'lucide-react';
import clsx from 'clsx';
import logoFull from '../assets/logo-full.png';
import logoIcon from '../assets/logo-icon.png';
import { loadTrips } from '../services/itineraryStorage';
import { AnimatedIcon, MagneticButton, useReducedMotion } from '../motion';

const navItems = [
  { label: 'Home', icon: Home, path: '/', anim: 'bounce' },
  { label: 'Plan a Trip', icon: Sparkles, path: '/create', anim: 'bounce' },
  { label: 'My Trips', icon: BookOpen, path: '/my-itineraries', dynamicBadge: 'trips', anim: 'scale' },
  { label: 'Explore Yogyakarta', icon: Compass, path: '/discovery', anim: 'rotate' },
];

function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onMobileClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const prefersReduced = useReducedMotion();

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
      {/* Desktop Animated Sidebar */}
      <motion.aside
        layout
        transition={{
          duration: prefersReduced ? 0 : 0.28,
          ease: [0.22, 1, 0.36, 1],
        }}
        className={clsx(
          'hidden lg:flex flex-col text-white relative z-20 flex-shrink-0 select-none border-r',
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
          prefersReduced={prefersReduced}
        />
      </motion.aside>

      {/* Mobile Drawer with Backdrop Slide */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 280,
            }}
            aria-hidden={!mobileOpen}
            className="flex lg:hidden flex-col text-white fixed left-0 top-0 h-full z-40 w-[260px] select-none shadow-2xl"
            style={{ background: '#0d2221' }}
          >
            <SidebarContent
              collapsed={false}
              onToggleCollapse={onMobileClose}
              navigate={navigate}
              isMobile
              onClose={onMobileClose}
              tripCount={tripCount}
              prefersReduced={prefersReduced}
            />
          </motion.aside>
        )}
      </AnimatePresence>
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
  prefersReduced,
}) {
  const [hoveredItem, setHoveredItem] = useState(null);

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
            className="flex items-center focus:outline-none transition-transform active:scale-95"
            aria-label="Kembali ke Beranda"
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
            className="flex items-center justify-center p-1 focus:outline-none transition-transform active:scale-95"
            title="TRIPIN"
            aria-label="Kembali ke Beranda"
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
            className="w-6 h-6 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
            title={collapsed ? 'Perluas Menu' : 'Ciutkan Menu'}
            aria-label={collapsed ? 'Perluas Menu' : 'Ciutkan Menu'}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        ) : (
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 focus:outline-none"
            aria-label="Tutup menu"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Primary CTA: Plan a Trip */}
      <div className="mb-4">
        {!collapsed ? (
          <MagneticButton
            onClick={() => {
              navigate('/create');
              if (isMobile && onClose) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 text-white rounded-xl px-4 py-2.5 font-bold text-xs shadow-md group relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #FF6B5E 0%, #FF8A80 100%)',
            }}
            aria-label="Plan a Trip"
          >
            <AnimatedIcon icon={Sparkles} size={15} animation="bounce" />
            <span className="tracking-wide">Plan a Trip</span>
          </MagneticButton>
        ) : (
          <div className="relative group flex justify-center">
            <MagneticButton
              onClick={() => navigate('/create')}
              className="w-11 h-11 flex items-center justify-center rounded-xl transition-all shadow-md"
              style={{ background: 'linear-gradient(135deg, #FF6B5E 0%, #FF8A80 100%)' }}
              aria-label="Plan a Trip"
            >
              <Sparkles size={16} />
            </MagneticButton>

            {/* Collapsed Tooltip */}
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center px-2.5 py-1.5 rounded-lg bg-[#1a3836] border border-white/15 text-white text-xs font-semibold whitespace-nowrap shadow-xl z-50 pointer-events-none">
              Plan a Trip
            </div>
          </div>
        )}
      </div>

      {/* Nav Items with Shared Layout Pill Transition */}
      <nav className="flex-1 space-y-1 relative">
        {navItems.map((item) => {
          let countBadge = null;
          if (item.dynamicBadge === 'trips' && tripCount > 0) countBadge = tripCount;

          return (
            <div
              key={item.path}
              className="relative"
              onMouseEnter={() => setHoveredItem(item.path)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <NavLink
                to={item.path}
                aria-label={item.label}
                end={item.path === '/'}
                title={collapsed ? item.label : ''}
                onClick={() => {
                  if (isMobile && onClose) onClose();
                }}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold relative transition-colors group z-10',
                    collapsed ? 'justify-center px-2' : '',
                    isActive
                      ? 'text-white font-bold'
                      : 'text-white/60 hover:text-white'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active Sliding Pill (Shared Layout Animation) */}
                    {isActive && (
                      <motion.div
                        layoutId="sidebarActivePill"
                        transition={
                          prefersReduced
                            ? { duration: 0 }
                            : { type: 'spring', stiffness: 350, damping: 28 }
                        }
                        className="absolute inset-0 rounded-xl bg-white/10 border border-white/10 shadow-inner z-[-1]"
                      >
                        {/* Glowing left edge indicator */}
                        <div
                          className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full"
                          style={{
                            background: 'linear-gradient(to bottom, #2EC4B6, #176B67)',
                            boxShadow: '0 0 8px rgba(46, 196, 182, 0.6)',
                          }}
                        />
                      </motion.div>
                    )}

                    <AnimatedIcon
                      icon={item.icon}
                      size={18}
                      animation={item.anim}
                      active={isActive}
                      className={clsx(
                        'flex-shrink-0 transition-colors',
                        isActive
                          ? 'text-turquoise'
                          : 'text-white/50 group-hover:text-white'
                      )}
                    />

                    {!collapsed && (
                      <span className="flex-1 text-left truncate">{item.label}</span>
                    )}

                    {!collapsed && countBadge !== null && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/15 text-white/90">
                        {countBadge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>

              {/* Floating Tooltip in Collapsed Mode */}
              {collapsed && hoveredItem === item.path && (
                <motion.div
                  initial={prefersReduced ? { opacity: 0 } : { opacity: 0, x: -6, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -6, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-full ml-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#143230] border border-white/15 text-white text-xs font-semibold whitespace-nowrap shadow-2xl z-50 pointer-events-none"
                >
                  <span>{item.label}</span>
                  {countBadge !== null && (
                    <span className="bg-white/20 text-[10px] px-1 rounded-full">
                      {countBadge}
                    </span>
                  )}
                </motion.div>
              )}
            </div>
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
