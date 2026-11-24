import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Map, Compass, Route, Menu, X } from "lucide-react";
const items = [
  ["/", "Home", Home],
  ["/create", "Plan a Trip", Route],
  ["/my-itineraries", "My Trips", Map],
  ["/discovery", "Explore Yogyakarta", Compass],
];
export default function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
}) {
  const content = (mobile) => (
    <>
      <div className="p-4 flex items-center justify-between gap-2">
        <NavLink to="/" onClick={onMobileClose}>
          <img
            src={collapsed && !mobile ? "/logo-icon.png" : "/logo-full.png"}
            className="h-9 max-w-[160px] object-contain"
            alt="TRIPIN"
          />
        </NavLink>
        <button
          aria-label={mobile ? "Tutup menu" : "Ubah lebar menu"}
          onClick={mobile ? onMobileClose : onToggleCollapse}
        >
          {mobile ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      <nav className="p-3 space-y-2 flex-1">
        {items.map(([path, label, Icon]) => (
          <NavLink
            end={path === "/"}
            key={path}
            to={path}
            onClick={onMobileClose}
            title={label}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl p-3 ${isActive ? "bg-teal text-white" : "text-white/80 hover:bg-white/10"}`
            }
          >
            <Icon size={20} />
            {(!collapsed || mobile) && label}
          </NavLink>
        ))}
      </nav>
      {(!collapsed || mobile) && (
        <p className="p-5 text-xs text-white/60">
          Guest mode ? tanpa akun
          <br />
          Trip tersimpan di browser Anda.
        </p>
      )}
    </>
  );
  return (
    <>
      <aside
        className={`hidden lg:flex flex-col bg-charcoal text-white flex-shrink-0 ${collapsed ? "w-[88px]" : "w-[240px]"}`}
      >
        {content(false)}
      </aside>
      <aside
        aria-label="Navigasi mobile"
        className={`fixed lg:hidden left-0 top-0 h-full w-[280px] bg-charcoal text-white z-30 flex flex-col ${mobileOpen ? "" : "hidden"}`}
      >
        {content(true)}
      </aside>
    </>
  );
}
