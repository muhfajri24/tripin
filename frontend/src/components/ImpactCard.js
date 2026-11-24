import React from 'react';
import { Store, TrendingUp, Sparkles, Award } from 'lucide-react';
import { formatCurrency, mockImpact } from '../data/mockData';

function ImpactCard({ impact = mockImpact, compact = false }) {
  const selectionRate = Math.round((impact.umkmSelected / impact.umkmRecommended) * 100) || 0;

  if (compact) {
    return (
      <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal/20 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-teal font-bold text-xs uppercase tracking-wide">
            <Award size={14} />
            <span>Dampak Ekonomi Lokal</span>
          </div>
          <span className="text-[10px] bg-teal text-white font-semibold px-2 py-0.5 rounded-full">
            SDG 8
          </span>
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <div>
            <p className="text-xl font-extrabold text-charcoal">{impact.umkmSelected} UMKM</p>
            <p className="text-xs text-charcoal-lighter">didukung dalam perjalanan</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-teal">{formatCurrency(impact.estimatedLocalRevenue)}</p>
            <p className="text-[11px] text-charcoal-lighter">est. belanja lokal</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-soft p-5 border border-teal/15 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-teal/10 to-transparent rounded-bl-full pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-teal/10 text-teal flex items-center justify-center">
            <Store size={18} />
          </div>
          <div>
            <h3 className="font-bold text-charcoal text-base">Impact Dashboard (SDG 8)</h3>
            <p className="text-xs text-charcoal-lighter">Statistik Kumulatif Kontribusi Wisata & UMKM Lokal</p>
          </div>
        </div>
        <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
          <Sparkles size={12} />
          SDG 8 Supporter
        </span>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        <div className="bg-sky/60 rounded-xl p-3">
          <p className="text-xs text-charcoal-lighter">UMKM Terpilih</p>
          <p className="text-xl font-extrabold text-teal mt-0.5">{impact.umkmSelected}</p>
          <p className="text-[11px] text-charcoal-lighter mt-1">dari {impact.umkmRecommended} direkomendasikan</p>
        </div>

        <div className="bg-amber-50 rounded-xl p-3">
          <p className="text-xs text-amber-800">Rasio Dukungan</p>
          <p className="text-xl font-extrabold text-amber-700 mt-0.5">{selectionRate}%</p>
          <p className="text-[11px] text-amber-700/80 mt-1">itinerary memilih UMKM</p>
        </div>

        <div className="bg-emerald-50 rounded-xl p-3">
          <p className="text-xs text-emerald-800">Belanja Lokal</p>
          <p className="text-lg font-extrabold text-emerald-700 mt-0.5">{formatCurrency(impact.estimatedLocalRevenue)}</p>
          <p className="text-[11px] text-emerald-700/80 mt-1">masuk ke ekonomi lokal</p>
        </div>

        <div className="bg-purple-50 rounded-xl p-3">
          <p className="text-xs text-purple-800">Hidden Gems</p>
          <p className="text-xl font-extrabold text-purple-700 mt-0.5">{impact.hiddenGemsVisited}</p>
          <p className="text-[11px] text-purple-700/80 mt-1">destinasi lokal autentik</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-charcoal-lighter">Target Pemberdayaan UMKM per Trip</span>
          <span className="font-semibold text-teal">{selectionRate}% tercapai</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-teal to-emerald-500 transition-all duration-500"
            style={{ width: `${Math.min(selectionRate, 100)}%` }}
          />
        </div>
        <p className="text-[11px] text-charcoal-lighter mt-2 flex items-center gap-1">
          <TrendingUp size={12} className="text-teal" />
          Setiap kunjungan ke UMKM mitra TRIPIN menggerakkan roda ekonomi warga lokal secara langsung.
        </p>
      </div>
    </div>
  );
}

export default ImpactCard;

