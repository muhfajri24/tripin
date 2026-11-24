import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, Star, Trash2, Plus, Store, ArrowRight } from 'lucide-react';
import {
  mockDestinations, mockLocalBusinesses, formatCurrency, getCategoryColor
} from '../data/mockData';
import EmptyState from '../components/EmptyState';

function SavedPlacesPage() {
  const navigate = useNavigate();

  const initialSaved = [
    ...mockDestinations.filter((d) => d.saved).map((d) => ({ ...d, isUMKM: false })),
    ...mockLocalBusinesses.filter((b) => b.saved).map((b) => ({ ...b, isUMKM: true })),
  ];

  const [saved, setSaved] = useState(initialSaved);

  const removeFromSaved = (id) => {
    setSaved((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="space-y-6 animate-fadeInUp pb-16">
      {/* Header */}
      <div
        className="rounded-3xl p-6 md:p-8 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(255,107,94,0.08) 0%, rgba(255,200,87,0.08) 100%)', border: '1.5px solid rgba(255,107,94,0.12)' }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Heart size={18} className="text-coral" />
              <h1 className="text-2xl font-extrabold text-charcoal tracking-tight">Saved Places & UMKM</h1>
            </div>
            <p className="text-charcoal-lighter text-sm">
              {saved.length} destinasi dan UMKM lokal tersimpan dalam wishlist perjalananmu
            </p>
          </div>
          <button
            onClick={() => navigate('/discovery')}
            className="flex items-center gap-2 font-bold text-xs px-4 py-2.5 rounded-xl transition-all hover:scale-[1.02] btn-press"
            style={{ background: '#176B67', color: 'white', boxShadow: '0 6px 20px rgba(23,107,103,0.3)' }}
          >
            <Plus size={14} /> Tambah Tempat
          </button>
        </div>
      </div>

      {saved.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Wishlist Masih Kosong"
          description="Simpan UMKM atau destinasi yang kamu sukai dari katalog Local Discovery agar mudah ditambahkan saat menyusun itinerary."
          action={{ label: 'Eksplorasi Local Discovery', onClick: () => navigate('/discovery') }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {saved.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl overflow-hidden group transition-all duration-300 hover:-translate-y-2 flex flex-col"
              style={{
                background: 'white',
                boxShadow: '0 4px 20px rgba(37,50,56,0.08)',
                border: '1px solid rgba(37,50,56,0.07)',
              }}
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden flex-shrink-0">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65), rgba(0,0,0,0.05))' }} />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                  {item.isUMKM && (
                    <span className="text-[11px] font-extrabold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow">
                      <Store size={10} /> UMKM
                    </span>
                  )}
                  <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow ${getCategoryColor(item.category)}`}>
                    {item.category}
                  </span>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removeFromSaved(item.id)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-sm"
                  style={{ background: 'rgba(255,255,255,0.9)', color: '#ef4444' }}
                  title="Hapus dari tersimpan"
                >
                  <Trash2 size={13} />
                </button>

                {/* Rating */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full px-2.5 py-1" style={{ background: 'rgba(255,255,255,0.95)' }}>
                  <Star size={11} className="text-yellow-trip fill-yellow-trip" />
                  <span className="text-xs font-extrabold text-charcoal">{item.rating}</span>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 flex flex-col p-4">
                <h3 className="font-extrabold text-charcoal text-base leading-tight group-hover:text-teal transition-colors tracking-tight">
                  {item.name}
                </h3>
                <div className="flex items-center gap-1 mt-1 mb-2 text-xs text-charcoal-lighter">
                  <MapPin size={11} className="text-teal flex-shrink-0" />
                  <span className="truncate">{item.city}</span>
                </div>
                <p className="text-xs text-charcoal-lighter leading-relaxed line-clamp-2 flex-1">
                  {item.description}
                </p>

                <button
                  onClick={() => navigate('/create', { state: { destination: item.name } })}
                  className="mt-4 w-full flex items-center justify-center gap-2 font-extrabold text-xs py-2.5 rounded-xl transition-all hover:scale-[1.02] btn-press"
                  style={{ background: 'linear-gradient(135deg, #FF6B5E 0%, #E55A4E 100%)', color: 'white', boxShadow: '0 6px 20px rgba(255,107,94,0.3)' }}
                >
                  <Plus size={13} /> Rencanakan Trip ke Sini
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SavedPlacesPage;
