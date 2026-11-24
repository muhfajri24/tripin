import React, { useState } from 'react';
import {
  User, Compass, DollarSign, Bell, Palette,
  Check, Save, AlertCircle, ShieldCheck
} from 'lucide-react';

function SettingsPage() {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('tripin_user_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    return {
      // Profile
      displayName: 'Penjelajah Nusantara',
      travelerStyle: 'budaya',
      homeCity: 'Jakarta',
      // Travel Preferences
      travelPace: 'balanced', // relaxed | balanced | fast
      transportPref: 'mobil', // mobil | motor | campuran
      // Budget Preferences
      currency: 'IDR (Rp)',
      dailyTargetBudget: '750000',
      budgetAlerts: true,
      // Notifications
      tripReminders: true,
      weatherAlerts: true,
      // Appearance
      language: 'Bahasa Indonesia',
    };
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const update = (key, val) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
    setSavedSuccess(false);
  };

  const handleSave = () => {
    try {
      localStorage.setItem('tripin_user_settings', JSON.stringify(settings));
    } catch (e) {}
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleResetData = () => {
    try {
      localStorage.removeItem('tripin_user_itineraries');
      localStorage.removeItem('tripin_saved_places');
      localStorage.removeItem('tripin_user_settings');
    } catch (e) {}
    setShowResetModal(false);
    window.location.reload();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 animate-fadeIn">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-charcoal tracking-tight">
            Pengaturan
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-lighter mt-0.5">
            Sesuaikan profil penjelajah, preferensi wisata, dan tampilan aplikasi.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 font-bold text-xs px-4 py-2 rounded-xl text-white transition-opacity hover:opacity-90"
          style={{ background: savedSuccess ? '#059669' : '#176B67' }}
        >
          {savedSuccess ? <Check size={14} /> : <Save size={14} />}
          <span>{savedSuccess ? 'Tersimpan' : 'Simpan'}</span>
        </button>
      </div>

      {/* ── Section 1: Profile ── */}
      <div className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100 space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
          <User size={16} className="text-teal" />
          <h3 className="font-bold text-charcoal text-sm">Profil Penjelajah</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-charcoal block mb-1">Nama Panggilan</label>
            <input
              type="text"
              value={settings.displayName}
              onChange={(e) => update('displayName', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 focus:border-teal rounded-xl px-3 py-2 outline-none font-medium"
            />
          </div>

          <div>
            <label className="font-semibold text-charcoal block mb-1">Kota Asal</label>
            <input
              type="text"
              value={settings.homeCity}
              onChange={(e) => update('homeCity', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 focus:border-teal rounded-xl px-3 py-2 outline-none font-medium"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-charcoal block mb-1.5">Gaya Wisata Utama</label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'budaya', label: '🏛️ Budaya & Adat' },
              { id: 'alam', label: '🌿 Alam & Bahari' },
              { id: 'kuliner', label: '🍜 Kuliner Autentik' },
              { id: 'santai', label: '🏖️ Liburan Santai' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => update('travelerStyle', s.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  settings.travelerStyle === s.id
                    ? 'bg-teal text-white shadow-sm'
                    : 'bg-gray-50 text-charcoal-lighter border border-gray-200 hover:text-charcoal'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section 2: Travel Preferences ── */}
      <div className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100 space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
          <Compass size={16} className="text-teal" />
          <h3 className="font-bold text-charcoal text-sm">Preferensi Perjalanan</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-charcoal block mb-1">Ritme Jadwal Harian</label>
            <select
              value={settings.travelPace}
              onChange={(e) => update('travelPace', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 focus:border-teal rounded-xl px-3 py-2 outline-none font-medium"
            >
              <option value="relaxed">Santai (2-3 spot / hari)</option>
              <option value="balanced">Seimbang (4-5 spot / hari)</option>
              <option value="fast">Padat (6+ spot / hari)</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-charcoal block mb-1">Transportasi Pilihan</label>
            <select
              value={settings.transportPref}
              onChange={(e) => update('transportPref', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 focus:border-teal rounded-xl px-3 py-2 outline-none font-medium"
            >
              <option value="mobil">Sewa Mobil</option>
              <option value="motor">Motor / Skuter</option>
              <option value="campuran">Campuran & Jalan Kaki</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Section 3: Budget Preferences ── */}
      <div className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100 space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
          <DollarSign size={16} className="text-teal" />
          <h3 className="font-bold text-charcoal text-sm">Anggaran & Mata Uang</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-charcoal block mb-1">Mata Uang Utama</label>
            <select
              value={settings.currency}
              onChange={(e) => update('currency', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 focus:border-teal rounded-xl px-3 py-2 outline-none font-medium"
            >
              <option value="IDR (Rp)">IDR (Rp) — Rupiah Indonesia</option>
              <option value="USD ($)">USD ($) — US Dollar</option>
              <option value="SGD (S$)">SGD (S$) — Singapore Dollar</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-charcoal block mb-1">Target Budget / Hari (IDR)</label>
            <input
              type="number"
              value={settings.dailyTargetBudget}
              onChange={(e) => update('dailyTargetBudget', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 focus:border-teal rounded-xl px-3 py-2 outline-none font-medium"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            <span className="font-semibold text-charcoal text-xs block">Peringatan Melebihi Budget</span>
            <span className="text-[11px] text-charcoal-lighter">Beri peringatan jika total jadwal melebihi estimasi biaya</span>
          </div>
          <input
            type="checkbox"
            checked={settings.budgetAlerts}
            onChange={(e) => update('budgetAlerts', e.target.checked)}
            className="w-4 h-4 accent-teal rounded cursor-pointer"
          />
        </div>
      </div>

      {/* ── Section 4: Notifications & Appearance ── */}
      <div className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100 space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
          <Bell size={16} className="text-teal" />
          <h3 className="font-bold text-charcoal text-sm">Notifikasi & Tampilan</h3>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-charcoal block">Pengingat Jadwal Harian</span>
              <span className="text-[11px] text-charcoal-lighter">Notifikasi estimasi jam singgah di tiap spot</span>
            </div>
            <input
              type="checkbox"
              checked={settings.tripReminders}
              onChange={(e) => update('tripReminders', e.target.checked)}
              className="w-4 h-4 accent-teal rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-charcoal block">Prakiraan Cuaca Destinasi</span>
              <span className="text-[11px] text-charcoal-lighter">Peringatan cuaca dan kondisi alam saat berwisata</span>
            </div>
            <input
              type="checkbox"
              checked={settings.weatherAlerts}
              onChange={(e) => update('weatherAlerts', e.target.checked)}
              className="w-4 h-4 accent-teal rounded cursor-pointer"
            />
          </div>

          <div className="pt-2 border-t border-gray-50 flex items-center justify-between">
            <div>
              <span className="font-semibold text-charcoal block">Bahasa Aplikasi</span>
              <span className="text-[11px] text-charcoal-lighter">Bahasa antarmuka TRIPIN</span>
            </div>
            <select
              value={settings.language}
              onChange={(e) => update('language', e.target.value)}
              className="bg-gray-50 border border-gray-200 focus:border-teal rounded-lg px-2.5 py-1 text-xs outline-none font-medium"
            >
              <option value="Bahasa Indonesia">Bahasa Indonesia</option>
              <option value="English">English</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Section 5: Data & Privacy ── */}
      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-4 text-xs">
        <div>
          <span className="font-bold text-charcoal block">Penyimpanan Lokal (Open Web)</span>
          <span className="text-charcoal-lighter text-[11px]">Seluruh data disimpan aman di peramban tanpa perlu akun.</span>
        </div>
        <button
          onClick={() => setShowResetModal(true)}
          className="text-xs font-bold text-red-600 hover:text-red-700 bg-white px-3 py-1.5 rounded-xl border border-red-200 hover:border-red-300 transition-colors whitespace-nowrap"
        >
          Reset Data
        </button>
      </div>

      {/* Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-lg space-y-3">
            <h4 className="font-bold text-charcoal text-sm">Hapus Semua Data Lokal?</h4>
            <p className="text-xs text-charcoal-lighter leading-relaxed">
              Semua itinerary dan wishlist yang tersimpan di browser ini akan dihapus.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleResetData}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl"
              >
                Ya, Hapus
              </button>
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 border border-gray-200 text-charcoal font-bold text-xs rounded-xl"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default SettingsPage;
