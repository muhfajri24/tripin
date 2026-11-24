import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, Star, Trash2, Plus, Store } from 'lucide-react';
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
    <div className="space-y-6 pb-12 animate-fadeIn max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-charcoal tracking-tight">
            Saved Places
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-lighter mt-0.5">
            {saved.length} destinasi dan UMKM lokal favorit tersimpan di wishlist.
          </p>
        </div>

        <button
          onClick={() => navigate('/discovery')}
          className="flex items-center gap-1.5 font-bold text-xs px-4 py-2.5 rounded-xl text-white transition-opacity hover:opacity-95"
          style={{ background: '#176B67' }}
        >
          <Plus size={14} />
          <span>Tambah Tempat</span>
        </button>
      </div>

      {/* Grid of Saved Places */}
      {saved.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Wishlist Masih Kosong"
          description="Simpan tempat dari katalog Local Discovery agar mudah ditambahkan ke itinerary."
          action={{ label: 'Eksplorasi Sekarang', onClick: () => navigate('/discovery') }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {saved.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl overflow-hidden shadow-soft border border-gray-100 flex flex-col justify-between group hover:shadow-card transition-all"
            >
              <div>
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                  <div className="absolute top-2.5 left-2.5 flex gap-1">
                    {item.isUMKM && (
                      <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                        UMKM
                      </span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${getCategoryColor(item.category)}`}>
                      {item.category}
                    </span>
                  </div>

                  <button
                    onClick={() => removeFromSaved(item.id)}
                    className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-white/90 text-red-500 flex items-center justify-center hover:bg-white transition-colors"
                    title="Hapus dari tersimpan"
                  >
                    <Trash2 size={12} />
                  </button>

                  <div className="absolute bottom-2 left-2.5 flex items-center gap-1 text-white text-xs font-bold">
                    <Star size={11} className="text-yellow-trip fill-yellow-trip" />
                    <span>{item.rating}</span>
                  </div>
                </div>

                <div className="p-3.5">
                  <h4 className="font-bold text-charcoal text-sm leading-snug group-hover:text-teal transition-colors">
                    {item.name}
                  </h4>
                  <p className="text-xs text-charcoal-lighter mt-1 flex items-center gap-1">
                    <MapPin size={11} className="text-coral" /> {item.city}
                  </p>
                </div>
              </div>

              <div className="p-3.5 pt-0">
                <button
                  onClick={() => navigate('/create', { state: { destination: item.name } })}
                  className="w-full py-2 bg-gray-50 hover:bg-teal hover:text-white text-charcoal font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1"
                >
                  <Plus size={12} />
                  <span>Rencanakan ke Trip</span>
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
