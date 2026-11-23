import React from 'react';
import { Search } from 'lucide-react';

function SearchInput({ value, onChange, onSubmit, placeholder = 'Search...', size = 'default' }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && onSubmit) onSubmit(value);
  };

  return (
    <div className={`relative flex items-center ${size === 'lg' ? 'h-14' : 'h-10'}`}>
      <Search
        size={size === 'lg' ? 20 : 16}
        className="absolute left-4 text-charcoal-lighter pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full border-2 border-gray-100 rounded-xl bg-white text-charcoal placeholder:text-gray-400 focus:outline-none focus:border-teal transition-colors ${
          size === 'lg'
            ? 'pl-12 pr-4 py-3 text-base'
            : 'pl-10 pr-4 py-2 text-sm'
        }`}
      />
      {value && onSubmit && (
        <button
          onClick={() => onSubmit(value)}
          className={`absolute right-3 bg-teal text-white rounded-lg font-semibold text-xs px-3 py-1.5 hover:bg-teal-dark transition-colors`}
        >
          Search
        </button>
      )}
    </div>
  );
}

export default SearchInput;

