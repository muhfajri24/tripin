import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Calendar, MapPin, Clock, Edit3, Search, Store, Sparkles, ArrowRight, ChevronRight
} from 'lucide-react';
import {
  mockItineraries, formatCurrency, getTripImpactStats, getStoredItineraries
} from '../data/mockData';
import EmptyState from '../components/EmptyState';

const statusConfig = {
  upcoming:  { label: 'Terjadwal',       dot: '#176B67', bg: 'rgba(23,107,103,0.08)',  text: '#176B67' },
  ongoing:   { label: 'Sedang Berjalan', dot: '#FF6B5E', bg: 'rgba(255,107,94,0.08)', text: '#FF6B5E' },
  completed: { label: 'Selesai',         dot: '#94a3b8', bg: 'rgba(148,163,184,0.1)',  text: '#6B7E85' },
};

function MyItinerariesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const allItineraries = getStoredItineraries();

  const filtered = allItineraries.filter((it) => {
    const matchSearch =
      !search ||
      it.title.toLowerCase().includes(search.toLowerCase()) ||
      it.destination.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || it.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6 animate-fadeInUp pb-16">
      {/* Header */}
      <div
        className="rounded-3xl p-6 md:p-8 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #253238 0%, #3D4F57 100%)', boxShadow: '0 12px 40px rgba(37,50,56,0.2)' }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10 rounded-full" style={{ background: 'radial-gradient(circle, #FFC857, transparent)', transform: 'translate(30%, -30%)' }} />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-2 tracking-tight">My Itineraries</h1>
            <p className="text-white/55 text-sm">
              {allItineraries.length} rencana perjalanan tersimpan — dukung UMKM lokal di setiap trip
            </p>
          </div>
          <button
            onClick={() => navigate('/create')}
            className="flex items-center gap-2 font-extrabold text-sm px-5 py-2.5 rounded-2xl transition-all hover:scale-[1.03] btn-press flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #FF6B5E 0%, #E55A4E 100%)', color: 'white', boxShadow: '0 6px 20px rgba(255,107,94,0.4)' }}
          >
            <Plus size={16} /> Buat Trip Baru
          </button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div
          className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: 'white', border: '1.5px solid rgba(37,50,56,0.1)', boxShadow: '0 2px 10px rgba(37,50,56,0.05)' }}
        >
          <Search size={16} className="text-charcoal-lighter flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan judul atau kota..."
            className="w-full text-sm text-charcoal placeholder:text-gray-400 outline-none bg-transparent"
          />
        </div>

        <div className="flex gap-1.5">
          {[
            { id: 'all',       label: 'Semua' },
            { id: 'upcoming',  label: 'Terjadwal' },
            { id: 'completed', label: 'Selesai' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold transition-all btn-press"
              style={
                filter === f.id
                  ? { background: '#176B67', color: 'white', boxShadow: '0 6px 20px rgba(23,107,103,0.3)' }
                  : { background: 'white', color: '#6B7E85', border: '1.5px solid rgba(37,50,56,0.1)' }
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Tidak Ada Itinerary Ditemukan"
          description="Mulai rencanakan liburan impian Anda dengan dukungan UMKM lokal."
          action={{ label: 'Buat Itinerary Sekarang', onClick: () => navigate('/create') }}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((it) => {
            const tripImpact = getTripImpactStats(it);
            const statusInfo = statusConfig[it.status] || statusConfig.upcoming;

            return (
              <div
                key={it.id}
                className="rounded-3xl overflow-hidden group cursor-pointer transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: 'white',
                  boxShadow: '0 4px 20px rgba(37,50,56,0.08)',
                  border: '1px solid rgba(37,50,56,0.07)',
                }}
                onClick={() => navigate(`/itinerary/${it.id}`)}
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Cover image */}
                  <div className="sm:w-52 h-40 sm:h-auto relative overflow-hidden flex-shrink-0">
                    <img
                      src={it.coverImage}
                      alt={it.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, transparent 60%, rgba(37,50,56,0.1))' }} />
                    {/* Status overlay */}
                    <div className="absolute top-3 left-3">
                      <span
                        className="text-[11px] font-extrabold px-2.5 py-1 rounded-full"
                        style={{ background: statusInfo.bg, color: statusInfo.text }}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex-1 p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            {tripImpact.umkmCount > 0 && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Store size={9} /> {tripImpact.umkmCount} UMKM Mitra
                              </span>
                            )}
                          </div>
                          <h3 className="font-extrabold text-charcoal text-base md:text-lg leading-tight group-hover:text-teal transition-colors tracking-tight">
                            {it.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-charcoal-lighter">
                            <span className="flex items-center gap-1">
                              <MapPin size={11} className="text-teal" /> {it.destination}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={11} className="text-coral" />
                              {new Date(it.dates?.start).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={11} /> {it.duration}
                            </span>
                          </div>
                        </div>

                        {/* Edit button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/itinerary/${it.id}/edit`); }}
                          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 flex-shrink-0"
                          style={{ background: 'rgba(23,107,103,0.08)', color: '#176B67' }}
                          title="Kelola & Reschedule"
                        >
                          <Edit3 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Footer */}
                    <div
                      className="flex items-center justify-between mt-4 pt-3"
                      style={{ borderTop: '1px solid rgba(37,50,56,0.06)' }}
                    >
                      <div className="flex items-center gap-4 text-xs">
                        <div>
                          <span className="text-charcoal-lighter text-[10px] block">Total Anggaran</span>
                          <span className="font-extrabold text-charcoal">{formatCurrency(it.totalBudget)}</span>
                        </div>
                        {tripImpact.estimatedLocalSpending > 0 && (
                          <div>
                            <span className="text-charcoal-lighter text-[10px] block">Belanja ke UMKM</span>
                            <span className="font-extrabold text-emerald-700">{formatCurrency(tripImpact.estimatedLocalSpending)}</span>
                          </div>
                        )}
                      </div>
                      <div
                        className="flex items-center gap-1 text-xs font-bold transition-all group-hover:gap-2"
                        style={{ color: '#176B67' }}
                      >
                        Lihat Rincian <ChevronRight size={13} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyItinerariesPage;
