import React from 'react';
import { MapPin, Compass } from 'lucide-react';

function EmptyState({ icon: Icon = Compass, title = 'Nothing here yet', description = '', action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-20 h-20 bg-sky rounded-3xl flex items-center justify-center mb-4 animate-float">
        <Icon size={36} className="text-teal" />
      </div>
      <h3 className="font-bold text-charcoal text-lg mb-2">{title}</h3>
      {description && (
        <p className="text-charcoal-lighter text-sm max-w-xs leading-relaxed mb-6">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="bg-gradient-to-r from-coral to-coral-dark text-white font-semibold text-sm px-6 py-3 rounded-xl hover:shadow-coral transition-all hover:scale-[1.02]"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export default EmptyState;

