import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Sparkles, Compass, BookOpen, Heart, Settings,
  ChevronLeft, ChevronRight, Plus, X
} from 'lucide-react';
import clsx from 'clsx';
import logoFull from '../assets/logo-full.png';
import logoIcon from '../assets/logo-icon.png';

const navItems = [
  { label: 'Dashboard',       icon: LayoutDashboard, path: '/dashboard',       emoji: '🏠' },
  { label: 'Local Discovery', icon: Compass,         path: '/discovery',       emoji: '🧭' },
  { label: 'My Itineraries',  icon: BookOpen,        path: '/my-itineraries',  emoji: '📖' },
  { label: 'Saved Places',    icon: Heart,           path: '/saved',           emoji: '❤️' },
  { label: 'Settings',        icon: Settings,        path: '/settings',        emoji: '⚙️' },
];

function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onMobileClose }) {
  const navigate = useNavigate();

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={clsx(
          'hidden lg:flex flex-col text-white sidebar-transition relative z-10 flex-shrink-0',
          collapsed ? 'w-[72px]' : 'w-[240px]'
        )}
        style={{
          background: 'linear-gradient(180deg, #1a2f2d 0%, #0f1e1d 50%, #0a1615 100%)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.25)',
        }}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
          navigate={navigate}
        />
      </aside>

      {/* Mobile drawer */}
      <aside
        className={clsx(
          'flex lg:hidden flex-col text-white fixed left-0 top-0 h-full z-30 w-[280px] sidebar-transition',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{
          background: 'linear-gradient(180deg, #1a2f2d 0%, #0f1e1d 50%, #0a1615 100%)',
          boxShadow: '4px 0 32px rgba(0,0,0,0.4)',
        }}
      >
        <SidebarContent
          collapsed={false}
          onToggleCollapse={onMobileClose}
          navigate={navigate}
          isMobile
          onClose={onMobileClose}
        />
      </aside>
    </>
  );
}

function SidebarContent({ collapsed, onToggleCollapse, navigate, isMobile, onClose }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo area */}
      <div
        className={clsx(
          'flex items-center px-4 py-5 relative',
          collapsed ? 'justify-center' : 'justify-between'
        )}
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        {!collapsed && (
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 group text-left focus:outline-none"
          >
            <img
              src={logoFull}
              alt="TRIPIN"
              className="h-10 w-auto max-w-[160px] object-contain"
              style={{ filter: 'brightness(1.08) drop-shadow(0 2px 8px rgba(255,200,87,0.2))' }}
            />
          </button>
        )}

        {collapsed && (
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center p-1 focus:outline-none"
            title="TRIPIN"
          >
            <img
              src={logoIcon}
              alt="TRIPIN"
              className="w-9 h-9 object-contain"
              style={{ filter: 'drop-shadow(0 2px 8px rgba(255,200,87,0.25))' }}
            />
          </button>
        )}

        {!isMobile && (
          <button
            onClick={onToggleCollapse}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            {collapsed
              ? <ChevronRight size={13} className="text-white/70" />
              : <ChevronLeft size={13} className="text-white/70" />
            }
          </button>
        )}

        {isMobile && (
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            <X size={13} className="text-white/70" />
          </button>
        )}
      </div>

      {/* Tagline (expanded only) */}
      {!collapsed && (
        <div className="px-4 pt-3 pb-1">
          <p className="text-[10px] text-white/35 font-semibold uppercase tracking-widest">
            AI Travel Planner Indonesia
          </p>
        </div>
      )}

      {/* AI Trip Planner CTA */}
      <div className={clsx('px-3 py-3', collapsed ? 'py-3' : 'pt-2')}>
        {!collapsed ? (
          <button
            onClick={() => navigate('/create')}
            className="w-full flex items-center justify-center gap-2 text-white rounded-xl px-4 py-3 font-bold text-sm transition-all hover:scale-[1.02] btn-press"
            style={{
              background: 'linear-gradient(135deg, #FF6B5E 0%, #E55A4E 100%)',
              boxShadow: '0 6px 20px rgba(255,107,94,0.4)',
            }}
          >
            <Sparkles size={16} />
            AI Trip Planner
          </button>
        ) : (
          <button
            onClick={() => navigate('/create')}
            className="w-full flex items-center justify-center rounded-xl p-2.5 transition-all hover:scale-110 btn-press"
            title="AI Trip Planner"
            style={{
              background: 'linear-gradient(135deg, #FF6B5E 0%, #E55A4E 100%)',
              boxShadow: '0 4px 14px rgba(255,107,94,0.35)',
            }}
          >
            <Plus size={16} className="text-white" />
          </button>
        )}
      </div>

      {/* Nav divider */}
      {!collapsed && (
        <div className="mx-4 mb-2" style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />
      )}

      {/* Nav items */}
      <nav className="flex-1 px-2 py-1 space-y-0.5 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={collapsed ? item.label : ''}
            className={({ isActive }) => clsx(
              'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all group',
              collapsed ? 'justify-center' : '',
              isActive
                ? 'text-white'
                : 'text-white/55 hover:text-white/90 hover:bg-white/[0.06]'
            )}
            style={({ isActive }) => isActive ? {
              background: 'linear-gradient(135deg, rgba(23,107,103,0.6) 0%, rgba(30,138,133,0.4) 100%)',
              boxShadow: '0 4px 16px rgba(23,107,103,0.3)',
            } : {}}
          >
            {({ isActive }) => (
              <>
                {isActive && !collapsed && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full"
                    style={{ background: '#FF6B5E' }}
                  />
                )}
                <item.icon
                  size={18}
                  className={clsx(
                    'flex-shrink-0 transition-all',
                    isActive ? 'text-white' : 'text-white/50 group-hover:text-white/80'
                  )}
                />
                {!collapsed && (
                  <span className="font-semibold tracking-tight">{item.label}</span>
                )}
                {!collapsed && isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-coral flex-shrink-0" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: Open Platform badge */}
      {!collapsed && (
        <div
          className="mx-3 mb-4 px-4 py-3 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🌿</span>
            <div>
              <p className="text-[10px] text-white/70 font-bold uppercase tracking-wider">Open Platform</p>
              <p className="text-[9px] text-white/35 mt-0.5">Tanpa login, bebas diakses</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
