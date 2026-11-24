import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Calendar, MapPin, Clock, Edit3, Search, Store, ChevronRight, X
} from 'lucide-react';
import {
  formatCurrency, getTripImpactStats, getStoredItineraries
} from '../data/mockData';
import EmptyState from '../components/EmptyState';

const STATUS_CONFIG = {
  upcoming:  { label: 'Terjadwal',       color: 'bg-teal/10 text-teal' },
  ongoing:   { label: 'Sedang Berjalan', color: 'bg-coral/10 text-coral' },
  completed: { label: 'Selesai',         color: 'bg-gray-100 text-charcoal-lighter' },
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
    <div className="space-y-6 pb-12 animate-fadeIn max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-charcoal tracking-tight">
            My Itineraries
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-lighter mt-0.5">
            Daftar seluruh rencana perjalanan yang tersimpan di perangkatmu.
          </p>
        </div>

        <button
          onClick={() => navigate('/create')}
          className="flex items-center gap-1.5 font-bold text-xs px-4 py-2.5 rounded-xl text-white transition-opacity hover:opacity-95 self-start sm:self-auto"
          style={{ background: '#FF6B5E' }}
        >
          <Plus size={15} />
          <span>Buat Trip Baru</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 px-3.5 py-2 bg-white rounded-xl border border-gray-200 focus-within:border-teal shadow-sm">
          <Search size={15} className="text-charcoal-lighter flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan judul atau kota..."
            className="w-full text-xs text-charcoal placeholder:text-gray-400 outline-none bg-transparent"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-gray-400 hover:text-charcoal">
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex gap-1">
          {[
            { id: 'all',       label: 'Semua' },
            { id: 'upcoming',  label: 'Terjadwal' },
            { id: 'completed', label: 'Selesai' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === f.id
                  ? 'bg-teal text-white shadow-sm'
                  : 'bg-white text-charcoal-lighter border border-gray-200 hover:text-charcoal'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List Cards */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Belum ada perjalanan"
          description="Mulai susun liburan impianmu dengan panduan kecerdasan buatan TRIPIN."
          action={{ label: 'Buat Itinerary Sekarang', onClick: () => navigate('/create') }}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((it) => {
            const tripImpact = getTripImpactStats(it);
            const status = STATUS_CONFIG[it.status] || STATUS_CONFIG.upcoming;

            return (
              <div
                key={it.id}
                onClick={() => navigate(`/itinerary/${it.id}`)}
                className="bg-white rounded-2xl border border-gray-100 p-4 shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                    <img
                      src={it.coverImage || '/images/hero/hero-bromo.jpg'}
                      alt={it.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                      {tripImpact.umkmCount > 0 && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Store size={9} /> {tripImpact.umkmCount} UMKM
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-charcoal text-sm sm:text-base leading-tight">
                      {it.title}
                    </h3>

                    <div className="flex items-center gap-3 text-xs text-charcoal-lighter mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin size={11} className="text-teal" /> {it.destination}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {it.duration}
                      </span>
                      <span>·</span>
                      <span className="font-bold text-charcoal">
                        {formatCurrency(it.totalBudget)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/itinerary/${it.id}/edit`);
                    }}
                    className="w-8 h-8 rounded-lg text-charcoal-lighter hover:text-teal hover:bg-gray-100 flex items-center justify-center transition-colors"
                    title="Edit Jadwal"
                  >
                    <Edit3 size={14} />
                  </button>

                  <span className="text-xs font-bold text-teal flex items-center gap-0.5 pl-2">
                    Lihat <ChevronRight size={13} />
                  </span>
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
