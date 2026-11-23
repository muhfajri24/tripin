import React from 'react';

export function CardSkeleton({ className = '' }) {
  return (
    <div className={`bg-white rounded-2xl overflow-hidden shadow-soft ${className}`}>
      <div className="h-44 shimmer" />
      <div className="p-4 space-y-2">
        <div className="h-4 shimmer rounded-lg w-3/4" />
        <div className="h-3 shimmer rounded-lg w-1/2" />
        <div className="flex gap-2 mt-3">
          <div className="h-5 shimmer rounded-full w-16" />
          <div className="h-5 shimmer rounded-full w-12" />
        </div>
        <div className="h-px bg-gray-100 mt-3" />
        <div className="flex justify-between mt-2">
          <div className="h-3 shimmer rounded w-16" />
          <div className="h-3 shimmer rounded w-20" />
        </div>
      </div>
    </div>
  );
}

export function TimelineSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
      <div className="h-16 shimmer" />
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="w-11 h-11 shimmer rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="h-4 shimmer rounded-lg w-3/4" />
              <div className="h-3 shimmer rounded-lg w-1/2" />
              <div className="h-3 shimmer rounded-lg w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageLoader({ message = 'Creating your perfect itinerary...' }) {
  return (
    <div className="fixed inset-0 bg-cream flex flex-col items-center justify-center z-50">
      {/* Animated emblem logo */}
      <div className="relative mb-8">
        <div className="w-24 h-24 bg-white/95 rounded-3xl flex items-center justify-center shadow-soft border border-teal/20 animate-float p-3">
          <img
            src="/logo-icon.png"
            alt="TRIPIN Emblem"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-3 bg-black/10 rounded-full blur-sm" />
      </div>

      {/* Loading dots */}
      <div className="flex gap-2 mb-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 bg-coral rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>

      <p className="text-charcoal font-semibold text-base">{message}</p>
      <p className="text-charcoal-lighter text-sm mt-1 animate-pulse-soft">
        Analyzing destinations & optimizing route...
      </p>

      {/* Progress steps */}
      <div className="mt-8 space-y-2 w-56">
        {[
          { label: 'Finding best routes', done: true },
          { label: 'Calculating travel times', done: true },
          { label: 'Estimating costs', done: false },
          { label: 'Finalizing schedule', done: false },
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
              step.done ? 'bg-teal' : 'bg-gray-200'
            }`}>
              {step.done && <span className="text-white text-xs">✓</span>}
            </div>
            <span className={`text-xs ${step.done ? 'text-charcoal' : 'text-charcoal-lighter'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CardSkeleton;

