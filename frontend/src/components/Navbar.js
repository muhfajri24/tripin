import { Link } from 'react-router-dom';
import React from 'react';
import { Menu } from 'lucide-react';
import logoIcon from '../assets/logo-icon.png';

export default function Navbar({ onMenuToggle }) {
  return (
    <header className="sticky top-0 z-30 px-4 md:px-6 py-2.5 flex items-center justify-between gap-3 bg-white/80 backdrop-blur-md border-b border-gray-100 lg:hidden">
      <div className="flex items-center gap-3 min-w-0">
        <button
          aria-label="Buka menu"
          onClick={onMenuToggle}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <Menu size={20} />
        </button>
        <Link to="/" aria-label="Beranda TRIPIN" className="flex-shrink-0">
          <img src={logoIcon} alt="TRIPIN" className="w-7 h-7 object-contain" />
        </Link>
      </div>
    </header>
  );
}
