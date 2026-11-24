import React from 'react';
import { Wallet, Zap, Compass } from 'lucide-react';
import clsx from 'clsx';

const options = [
  {
    id: 'budget',
    label: 'Budget Friendly',
    description: 'Maximize experiences at minimum cost',
    icon: Wallet,
    color: 'from-green-400 to-teal',
    activeClass: 'border-teal bg-teal/5',
    iconColor: 'text-teal bg-teal/10',
    badge: 'Save up to 40%',
  },
  {
    id: 'efficient',
    label: 'Time Efficient',
    description: 'Optimized route to visit more in less time',
    icon: Zap,
    color: 'from-yellow-trip to-orange-400',
    activeClass: 'border-yellow-trip bg-yellow-trip/5',
    iconColor: 'text-yellow-dark bg-yellow-trip/20',
    badge: 'Save 2+ hours',
  },
  {
    id: 'explore',
    label: 'Explore More',
    description: 'Discover hidden gems and local experiences',
    icon: Compass,
    color: 'from-coral to-pink-500',
    activeClass: 'border-coral bg-coral/5',
    iconColor: 'text-coral bg-coral/10',
    badge: '+5 more spots',
  },
];

function OptimizationSelector({ selected, onChange }) {
  return (
    <div className="bg-white rounded-2xl shadow-soft p-5">
      <h3 className="font-bold text-charcoal text-base mb-4">Optimize Your Trip</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {options.map((opt) => {
          const isActive = selected === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onChange(opt.id)}
              className={clsx(
                'relative text-left p-4 rounded-xl border-2 transition-all',
                isActive ? opt.activeClass : 'border-gray-100 hover:border-gray-200 bg-white'
              )}
            >
              {isActive && (
                <div className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-xl bg-gradient-to-r ${opt.color}`} />
              )}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${
                isActive ? opt.iconColor : 'text-charcoal-lighter bg-gray-100'
              }`}>
                <opt.icon size={18} />
              </div>
              <p className={clsx('font-semibold text-sm', isActive ? 'text-charcoal' : 'text-charcoal-lighter')}>
                {opt.label}
              </p>
              <p className="text-xs text-charcoal-lighter mt-1 leading-relaxed">{opt.description}</p>
              {isActive && (
                <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-semibold bg-gradient-to-r ${opt.color} text-white`}>
                  {opt.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default OptimizationSelector;

