import React from 'react';
import { Clock, Navigation, DollarSign, ChevronRight, MapPin, ExternalLink } from 'lucide-react';
import { formatCurrency, getPeriodIcon, getCategoryColor } from '../data/mockData';
import clsx from 'clsx';

function ItineraryTimeline({ day, activities, onActivityClick }) {
  return (
    <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
      {/* Day header */}
      <div className="bg-gradient-to-r from-teal to-teal-light px-5 py-4 flex items-center justify-between">
        <div>
          <span className="text-white/70 text-xs font-medium uppercase tracking-wider">
            {new Date(day.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
          <h3 className="text-white font-bold text-base mt-0.5">{day.label}</h3>
        </div>
        <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full font-medium">
          {activities.length} stops
        </span>
      </div>

      {/* Activities */}
      <div className="p-4 space-y-0">
        {activities.map((activity, idx) => (
          <div key={activity.id} className="relative">
            {/* Timeline connector */}
            {idx < activities.length - 1 && (
              <div className="absolute left-[22px] top-[52px] bottom-0 w-0.5 bg-gradient-to-b from-teal/30 to-transparent z-0" />
            )}

            <div
              className="relative z-10 flex gap-4 py-3 cursor-pointer group"
              onClick={() => onActivityClick && onActivityClick(activity)}
            >
              {/* Time & icon */}
              <div className="flex flex-col items-center flex-shrink-0 w-11">
                <div className="w-11 h-11 rounded-xl bg-sky flex items-center justify-center text-lg group-hover:bg-coral/10 transition-colors">
                  {getPeriodIcon(activity.period)}
                </div>
                <span className="text-xs text-charcoal-lighter font-medium mt-1">{activity.time}</span>
              </div>

              {/* Card */}
              <div className="flex-1 bg-gray-50 rounded-xl p-3 group-hover:bg-coral/5 transition-colors border border-transparent group-hover:border-coral/20">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-charcoal text-sm">{activity.name}</h4>
                      {activity.isUMKM && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          🌿 UMKM
                        </span>
                      )}
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${getCategoryColor(activity.category)}`}>
                        {activity.category}
                      </span>
                      {activity.rescheduled && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-full">
                          Disesuaikan
                        </span>
                      )}
                    </div>
                    {activity.city && (
                      <div className="flex items-center gap-1 text-[11px] text-teal font-medium mt-1">
                        <MapPin size={11} className="flex-shrink-0 text-coral" />
                        <span className="truncate">{activity.city}</span>
                      </div>
                    )}
                    {activity.notes && (
                      <p className="text-xs text-charcoal-lighter mt-1 leading-relaxed">{activity.notes}</p>
                    )}
                  </div>
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-coral flex-shrink-0 mt-0.5 transition-colors" />
                </div>

                {/* Meta info & Google Maps Link */}
                <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 pt-2 border-t border-gray-100">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1 text-xs text-charcoal-lighter">
                      <Clock size={11} />
                      <span>{activity.duration}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-teal font-medium">
                      <DollarSign size={11} />
                      <span>{activity.cost > 0 ? formatCurrency(activity.cost) : 'Gratis'}</span>
                    </div>
                    {activity.distanceFromPrev && (
                      <div className="flex items-center gap-1 text-xs text-charcoal-lighter">
                        <Navigation size={11} />
                        <span>{activity.distanceFromPrev} · {activity.travelTime}</span>
                      </div>
                    )}
                  </div>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${activity.name}, ${activity.city || ''}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-coral hover:text-coral-dark bg-coral/10 hover:bg-coral/20 px-2.5 py-1 rounded-lg transition-colors"
                    title="Buka lokasi pasti tempat ini di Google Maps"
                  >
                    <ExternalLink size={11} />
                    Google Maps
                  </a>
                </div>

                {/* Transport badge */}
                {activity.transport && (
                  <span className="inline-block mt-2 text-xs bg-white border border-gray-200 text-charcoal-lighter px-2 py-0.5 rounded-full">
                    🚗 {activity.transport}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ItineraryTimeline;

