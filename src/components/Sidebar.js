import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Sparkles, Compass, BookOpen, Heart, Settings,
  User, ChevronLeft, ChevronRight, Plane, X, Plus, Leaf
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Local Discovery', icon: Compass, path: '/discovery' },
  { label: 'My Itineraries', icon: BookOpen, path: '/my-itineraries' },
  { label: 'Saved Places', icon: Heart, path: '/saved' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onMobileClose }) {
  const navigate = useNavigate();

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={clsx(
          'hidden lg:flex flex-col bg-charcoal text-white sidebar-transition relative z-10 flex-shrink-0',
          collapsed ? 'w-[72px]' : 'w-[240px]'
        )}
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
          'flex lg:hidden flex-col bg-charcoal text-white fixed left-0 top-0 h-full z-30 w-[280px] sidebar-transition',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
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
      {/* Logo */}
      <div className={clsx(
        'flex items-center px-4 py-5 border-b border-white/10',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        {!collapsed && (
          <button onClick={() => navigate('/')} className="flex items-center gap-2 group text-left">
            <img
              src="/logo-full.png"
              alt="TRIPIN"
              className="h-10 w-auto max-w-[165px] object-contain drop-shadow"
            />
          </button>
        )}
        {collapsed && (
          <button onClick={() => navigate('/')} className="flex items-center justify-center p-1" title="TRIPIN">
            <img
              src="/logo-icon.png"
              alt="TRIPIN"
              className="w-9 h-9 object-contain drop-shadow"
            />
          </button>
        )}
        {!isMobile && (
          <button
            onClick={onToggleCollapse}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}
        {isMobile && (
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* AI Trip Planner button */}
      {!collapsed && (
        <div className="px-4 py-3">
          <button
            onClick={() => navigate('/create')}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-coral to-coral-dark text-white rounded-xl px-4 py-2.5 font-semibold text-sm hover:shadow-coral transition-all hover:scale-[1.02]"
          >
            <Sparkles size={16} />
            AI Trip Planner
          </button>
        </div>
      )}
      {collapsed && (
        <div className="px-3 py-3">
          <button
            onClick={() => navigate('/create')}
            className="w-full flex items-center justify-center bg-coral text-white rounded-xl p-2.5 hover:bg-coral-dark transition-colors"
            title="AI Trip Planner"
          >
            <Plus size={16} />
          </button>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all group',
              collapsed ? 'justify-center' : '',
              isActive
                ? 'bg-teal text-white shadow-teal/30 shadow-md'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            )}
            title={collapsed ? item.label : ''}
          >
            <item.icon size={18} className="flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Profile at bottom */}
      <div className={clsx(
        'border-t border-white/10 p-3',
        collapsed ? 'flex justify-center' : ''
      )}>
        <button
          onClick={() => navigate('/settings')}
          className={clsx(
            'flex items-center gap-3 rounded-xl p-2 hover:bg-white/10 transition-colors w-full',
            collapsed ? 'justify-center' : ''
          )}
          title={collapsed ? 'Profile' : ''}
        >
          <img
            src="https://i.pravatar.cc/150?img=12"
            alt="Profile"
            className="w-8 h-8 rounded-full object-cover ring-2 ring-coral/50"
          />
          {!collapsed && (
            <div className="text-left min-w-0">
              <p className="text-sm font-semibold text-white truncate">Ari Santoso</p>
              <p className="text-xs text-white/50 truncate">SDG 8 Contributor</p>
            </div>
          )}
          {!collapsed && <User size={14} className="text-white/40 ml-auto flex-shrink-0" />}
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
