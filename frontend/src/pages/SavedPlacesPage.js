import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, Star, Trash2, Plus, Store } from 'lucide-react';
import {
  mockDestinations, mockLocalBusinesses, formatCurrency, getCategoryColor
} from '../data/mockData';
import EmptyState from '../components/EmptyState';

function SavedPlacesPage() {
  const navigate = useNavigate();

  // Combine saved destinations and saved UMKM
  const initialSaved = [
    ...mockDestinations.filter((d) => d.saved).map((d) => ({ ...d, isUMKM: false })),
    ...mockLocalBusinesses.filter((b) => b.saved).map((b) => ({ ...b, isUMKM: true })),
  ];

  const [saved, setSaved] = useState(initialSaved);

  const removeFromSaved = (id) => {
    setSaved((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="space-y-6 animate-fadeInUp pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-charcoal">Saved Places & UMKM</h1>
        <p className="text-charcoal-lighter text-xs sm:text-sm mt-1">
          {saved.length} destinasi dan UMKM lokal tersimpan dalam wishlist perjalanan Anda
        </p>
      </div>

      {saved.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Wishlist Masih Kosong"
          description="Simpan UMKM atau destinasi yang Anda sukai dari katalog Local Discovery agar mudah ditambahkan saat menyusun itinerary."
          action={{
            label: 'Eksplorasi Local Discovery',
            onClick: () => navigate('/discovery'),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {saved.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl shadow-soft overflow-hidden group card-hover border border-gray-100 flex flex-col justify-between"
            >
              <div>
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                  <div className="absolute top-3 left-3 flex gap-1">
                    {item.isUMKM && (
                      <span className="text-[11px] font-bold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                        <Store size={10} /> UMKM
                      </span>
                    )}
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${getCategoryColor(
                        item.category
                      )}`}
                    >
                      {item.category}
                    </span>
                  </div>

                  <button
                    onClick={() => removeFromSaved(item.id)}
                    className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-red-50 text-red-500 transition-colors shadow-sm"
                    title="Hapus dari tersimpan"
                  >
                    <Trash2 size={13} />
                  </button>

                  <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-white/90 rounded-full px-2.5 py-1">
                    <Star size={11} className="text-yellow-trip fill-yellow-trip" />
                    <span className="text-xs font-bold">{item.rating}</span>
                  </div>
                </div>

                <div className="p-4 sm:p-5">
                  <h3 className="font-extrabold text-charcoal text-base">{item.name}</h3>
                  <div className="flex items-center gap-1 mt-1 text-xs text-charcoal-lighter">
                    <MapPin size={12} className="text-teal" />
                    <span className="truncate">{item.city}</span>
                  </div>
                  <p className="text-xs text-charcoal-lighter mt-2 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0">
                <button
                  onClick={() =>
                    navigate('/create', { state: { destination: item.name } })
                  }
                  className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-coral to-coral-dark text-white text-xs font-bold py-2.5 rounded-xl hover:shadow-coral transition-all"
                >
                  <Plus size={13} />
                  Rencanakan Trip dengan Titik Ini
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
