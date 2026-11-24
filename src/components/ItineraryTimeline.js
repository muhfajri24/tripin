import React, { useState } from 'react';
import { Clock, Navigation, DollarSign, ChevronRight, ChevronDown, MapPin, ExternalLink, Info, Sparkles } from 'lucide-react';
import { formatCurrency, getPeriodIcon, getCategoryColor } from '../data/mockData';
import clsx from 'clsx';

// AI reasons for destinations (simulated)
const AI_REASONS = [
  'Destinasi ini menawarkan nilai budaya tinggi & mudah dijangkau dari titik sebelumnya.',
  'Rekomendasi AI: rating ulasan wisatawan sangat baik, cocok untuk waktu yang tersedia.',
  'UMKM lokal terverifikasi dengan pengalaman autentik yang mendukung ekonomi warga.',
  'Waktu tempuh minimal & tiket terjangkau — cocok untuk optimasi budget.',
  'Hidden gem yang jarang diketahui wisatawan umum, namun sangat berkesan.',
];

function ItineraryTimeline({ day, activities, onActivityClick }) {
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const aiReason = (idx) => AI_REASONS[idx % AI_REASONS.length];

  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{ background: 'white', boxShadow: '0 4px 20px rgba(37,50,56,0.08)', border: '1px solid rgba(37,50,56,0.07)' }}
    >
      {/* Day Header */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #176B67 0%, #1E8A85 100%)' }}
      >
        <div>
          <span className="text-white/65 text-xs font-semibold uppercase tracking-widest block mb-0.5">
            {new Date(day.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
          <h3 className="text-white font-extrabold text-base tracking-tight">{day.label}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
          >
            {activities.length} stop{activities.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Activities List */}
      <div className="p-4 space-y-0">
        {activities.map((activity, idx) => {
          const isExpanded = expanded[activity.id];

          return (
            <div key={activity.id} className="relative">
              {/* Timeline connector line */}
              {idx < activities.length - 1 && (
                <div
                  className="absolute z-0"
                  style={{
                    left: 22, top: 56, bottom: 0, width: 2,
                    background: 'linear-gradient(to bottom, rgba(23,107,103,0.3), rgba(23,107,103,0.05))',
                  }}
                />
              )}

              {/* Activity row */}
              <div
                className="relative z-10 flex gap-4 py-3 cursor-pointer group"
                onClick={() => {
                  toggleExpand(activity.id);
                  onActivityClick && onActivityClick(activity);
                }}
              >
                {/* Timeline dot + time */}
                <div className="flex flex-col items-center flex-shrink-0 w-11">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg transition-all group-hover:scale-110"
                    style={{
                      background: isExpanded
                        ? 'linear-gradient(135deg, rgba(255,107,94,0.15), rgba(255,200,87,0.15))'
                        : 'rgba(234,244,244,0.8)',
                      border: isExpanded ? '1.5px solid rgba(255,107,94,0.3)' : '1.5px solid rgba(23,107,103,0.1)',
                    }}
                  >
                    {getPeriodIcon(activity.period)}
                  </div>
                  <span className="text-[10px] text-charcoal-lighter font-bold mt-1 leading-none">{activity.time}</span>
                </div>

                {/* Card */}
                <div
                  className="flex-1 rounded-2xl p-3 transition-all"
                  style={{
                    background: isExpanded
                      ? 'linear-gradient(135deg, rgba(255,107,94,0.04), rgba(255,200,87,0.04))'
                      : 'rgba(37,50,56,0.03)',
                    border: isExpanded ? '1.5px solid rgba(255,107,94,0.15)' : '1.5px solid transparent',
                  }}
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-charcoal text-sm leading-tight">{activity.name}</h4>
                        {activity.isUMKM && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5 flex-shrink-0">
                            🌿 UMKM
                          </span>
                        )}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${getCategoryColor(activity.category)}`}
                        >
                          {activity.category}
                        </span>
                        {activity.rescheduled && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                            Disesuaikan
                          </span>
                        )}
                      </div>

                      {activity.city && (
                        <div className="flex items-center gap-1 text-[11px] text-charcoal-lighter mt-0.5">
                          <MapPin size={10} className="text-teal flex-shrink-0" />
                          <span className="truncate">{activity.city}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <div className="text-[10px] text-charcoal-lighter font-medium">
                        {isExpanded ? <ChevronDown size={14} className="text-coral" /> : <ChevronRight size={14} className="text-gray-300 group-hover:text-teal transition-colors" />}
                      </div>
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2" style={{ borderTop: '1px solid rgba(37,50,56,0.06)' }}>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1 text-[11px] text-charcoal-lighter">
                        <Clock size={10} />
                        <span>{activity.duration}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-teal">
                        <DollarSign size={10} />
                        <span>{activity.cost > 0 ? formatCurrency(activity.cost) : 'Gratis'}</span>
                      </div>
                      {activity.distanceFromPrev && (
                        <div className="flex items-center gap-1 text-[11px] text-charcoal-lighter">
                          <Navigation size={10} />
                          <span>{activity.distanceFromPrev} · {activity.travelTime}</span>
                        </div>
                      )}
                    </div>

                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${activity.name}, ${activity.city || ''}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-lg transition-all hover:scale-105"
                      style={{ color: '#FF6B5E', background: 'rgba(255,107,94,0.1)' }}
                    >
                      <ExternalLink size={10} />
                      Maps
                    </a>
                  </div>

                  {/* Transport badge */}
                  {activity.transport && (
                    <span
                      className="inline-block mt-2 text-[10px] px-2.5 py-0.5 rounded-full font-medium"
                      style={{ background: 'rgba(255,255,255,0.8)', color: '#6B7E85', border: '1px solid rgba(37,50,56,0.1)' }}
                    >
                      🚗 {activity.transport}
                    </span>
                  )}

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-3 space-y-3 animate-fadeInUp">
                      {activity.notes && (
                        <p className="text-xs text-charcoal-lighter leading-relaxed">{activity.notes}</p>
                      )}

                      {/* AI Reason chip */}
                      <div
                        className="flex items-start gap-2 p-3 rounded-2xl"
                        style={{ background: 'rgba(23,107,103,0.06)', border: '1px solid rgba(23,107,103,0.12)' }}
                      >
                        <div className="text-teal mt-0.5 flex-shrink-0">
                          <Sparkles size={13} />
                        </div>
                        <div>
                          <p className="text-[10px] font-extrabold text-teal uppercase tracking-wider mb-0.5">Mengapa tempat ini?</p>
                          <p className="text-xs text-charcoal-lighter leading-relaxed">{aiReason(idx)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ItineraryTimeline;
