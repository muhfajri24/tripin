import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Calendar, MapPin, Clock, Edit3, Trash2, ChevronRight, Search,
  Store, Award, Sparkles
} from 'lucide-react';
import {
  mockItineraries, formatCurrency, getTripImpactStats, getStoredItineraries
} from '../data/mockData';
import EmptyState from '../components/EmptyState';

const statusLabels = {
  upcoming: { label: 'Terjadwal', class: 'bg-teal/10 text-teal' },
  ongoing: { label: 'Sedang Berjalan', class: 'bg-coral/10 text-coral' },
  completed: { label: 'Selesai', class: 'bg-gray-100 text-charcoal-lighter' },
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
    <div className="space-y-6 animate-fadeInUp pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-charcoal">My Itineraries</h1>
          <p className="text-charcoal-lighter text-xs sm:text-sm mt-1">
            {mockItineraries.length} rencana perjalanan tersimpan
          </p>
        </div>
        <button
          onClick={() => navigate('/create')}
          className="flex items-center gap-2 bg-gradient-to-r from-coral to-coral-dark text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl hover:shadow-coral transition-all self-start sm:self-auto shadow-sm"
        >
          <Plus size={16} />
          Buat Trip Baru
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-lighter"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari rencana perjalanan berdasarkan judul atau kota..."
            className="w-full border-2 border-gray-100 focus:border-teal rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-charcoal outline-none transition-colors"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'Semua Trip' },
            { id: 'upcoming', label: 'Terjadwal' },
            { id: 'completed', label: 'Selesai' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                filter === f.id
                  ? 'bg-teal text-white shadow-teal/30 shadow'
                  : 'bg-white border border-gray-200 text-charcoal-lighter hover:border-teal'
              }`}
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
          action={{
            label: 'Buat Itinerary Sekarang',
            onClick: () => navigate('/create'),
          }}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((it) => {
            const tripImpact = getTripImpactStats(it);
            const statusInfo = statusLabels[it.status] || statusLabels.upcoming;

            return (
              <div
                key={it.id}
                className="bg-white rounded-3xl shadow-soft hover:shadow-card transition-all overflow-hidden group cursor-pointer border border-gray-100"
                onClick={() => navigate(`/itinerary/${it.id}`)}
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Cover */}
                  <div className="sm:w-56 h-40 sm:h-auto relative overflow-hidden flex-shrink-0">
                    <img
                      src={it.coverImage}
                      alt={it.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-black/20" />
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span
                              className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${statusInfo.class}`}
                            >
                              {statusInfo.label}
                            </span>
                            {tripImpact.umkmCount > 0 && (
                              <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Store size={10} />
                                {tripImpact.umkmCount} UMKM Mitra
                              </span>
                            )}
                          </div>

                          <h3 className="font-extrabold text-charcoal text-base sm:text-lg group-hover:text-teal transition-colors">
                            {it.title}
                          </h3>

                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-charcoal-lighter">
                            <span className="flex items-center gap-1">
                              <MapPin size={12} className="text-teal" /> {it.destination}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={12} className="text-coral" />
                              {new Date(it.dates.start).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={12} /> {it.duration}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/itinerary/${it.id}/edit`);
                            }}
                            className="w-8 h-8 rounded-xl bg-sky flex items-center justify-center hover:bg-teal/20 text-teal transition-colors"
                            title="Kelola & Reschedule"
                          >
                            <Edit3 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 text-xs">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-charcoal-lighter text-[11px] block">
                            Total Anggaran:
                          </span>
                          <span className="font-extrabold text-charcoal text-sm">
                            {formatCurrency(it.totalBudget)}
                          </span>
                        </div>
                        {tripImpact.estimatedLocalSpending > 0 && (
                          <div>
                            <span className="text-charcoal-lighter text-[11px] block">
                              Belanja ke UMKM:
                            </span>
                            <span className="font-extrabold text-emerald-700 text-sm">
                              {formatCurrency(tripImpact.estimatedLocalSpending)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-teal font-bold group-hover:translate-x-1 transition-transform">
                        <span>Lihat Rincian</span>
                        <ChevronRight size={14} />
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
