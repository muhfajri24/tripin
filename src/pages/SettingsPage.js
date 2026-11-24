import React, { useState, useEffect } from 'react';
import {
  User, Compass, DollarSign, Bell, Palette, Globe,
  Check, Save, RotateCcw, ShieldCheck, Sparkles, AlertCircle
} from 'lucide-react';

const TABS = [
  { id: 'profile', label: 'Profil & Identitas', icon: User },
  { id: 'preferences', label: 'Preferensi Wisata', icon: Compass },
  { id: 'budget', label: 'Anggaran & Budget', icon: DollarSign },
  { id: 'notifications', label: 'Notifikasi', icon: Bell },
  { id: 'appearance', label: 'Tampilan & Data', icon: Palette },
];

const TRAVELER_PERSONAS = [
  { id: 'explorer', label: 'Penikmat Budaya & Adat', emoji: '🏛️' },
  { id: 'backpacker', label: 'Solo Backpacker', emoji: '🎒' },
  { id: 'nature', label: 'Pecinta Alam & Bahari', emoji: '🏖️' },
  { id: 'culinary', label: 'Wisatawan Kuliner Otentik', emoji: '🍜' },
  { id: 'family', label: 'Wisata Keluarga Santai', emoji: '👨‍👩‍👦' },
];

function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  // Loaded from LocalStorage or default
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('tripin_user_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    return {
      // Profile
      displayName: 'Penjelajah Nusantara',
      persona: 'explorer',
      homeCity: 'Jakarta',
      travelBio: 'Suka berpetualang ke destinasi otentik Indonesia dan mendukung UMKM lokal.',
      // Preferences
      travelPace: 'balanced', // relaxed | balanced | fast
      transportPref: 'mobil', // mobil | motor | transit
      priorityInterests: ['budaya', 'kuliner', 'alam'],
      // Budget
      currency: 'IDR (Rp)',
      defaultDailyBudget: '750000',
      budgetAlerts: true,
      umkmPriorityPercent: '60',
      // Notifications
      tripReminders: true,
      weatherAlerts: true,
      weeklyDestinations: false,
      // Appearance & Data
      language: 'Bahasa Indonesia',
      theme: 'light',
    };
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetModal, setResetModal] = useState(false);

  const updateSetting = (key, val) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
    setSavedSuccess(false);
  };

  const handleSave = () => {
    try {
      localStorage.setItem('tripin_user_settings', JSON.stringify(settings));
    } catch (e) {}
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleResetData = () => {
    try {
      localStorage.removeItem('tripin_user_itineraries');
      localStorage.removeItem('tripin_saved_places');
      localStorage.removeItem('tripin_user_settings');
    } catch (e) {}
    setResetModal(false);
    window.location.reload();
  };

  const toggleInterest = (interest) => {
    const current = settings.priorityInterests || [];
    if (current.includes(interest)) {
      updateSetting('priorityInterests', current.filter((x) => x !== interest));
    } else {
      updateSetting('priorityInterests', [...current, interest]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeInUp pb-16">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal tracking-tight">
            Pengaturan & Preferensi
          </h1>
          <p className="text-charcoal-lighter text-xs sm:text-sm mt-1">
            Sesuaikan preferensi petualangan, anggaran default, dan profil penjelajahmu.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 font-extrabold text-xs sm:text-sm px-6 py-3 rounded-2xl text-white transition-all hover:scale-105 active:scale-95 shadow-md btn-press self-start sm:self-auto"
          style={{
            background: savedSuccess ? '#059669' : 'linear-gradient(135deg, #176B67 0%, #1E8A85 100%)',
            boxShadow: '0 6px 20px rgba(23, 107, 103, 0.35)',
          }}
        >
          {savedSuccess ? <Check size={16} /> : <Save size={16} />}
          <span>{savedSuccess ? 'Pengaturan Tersimpan ✓' : 'Simpan Pengaturan'}</span>
        </button>
      </div>

      {/* ── Open Web Platform Notice ── */}
      <div className="bg-white rounded-3xl p-5 shadow-soft border border-teal/15 flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-teal/10 flex items-center justify-center flex-shrink-0 text-teal mt-0.5">
          <ShieldCheck size={20} />
        </div>
        <div className="text-xs sm:text-sm">
          <h4 className="font-extrabold text-charcoal">Platform Terbuka & Terdesentralisasi</h4>
          <p className="text-charcoal-lighter mt-1 leading-relaxed text-xs">
            TRIPIN dirancang ramah privasi tanpa perlu registrasi akun atau login. Seluruh data itinerary, wishlist tempat lokal, dan preferensi perjalanan disimpan secara privat di perangkat Anda.
          </p>
        </div>
      </div>

      {/* ── Main Layout: Tabs + Form Section ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* Tab Selector Column */}
        <div className="space-y-1.5 md:col-span-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold text-left transition-all ${
                  isActive
                    ? 'bg-teal text-white shadow-teal shadow-md'
                    : 'bg-white text-charcoal-lighter hover:text-charcoal hover:bg-gray-50 border border-gray-100'
                }`}
              >
                <tab.icon size={17} className={isActive ? 'text-yellow-trip' : 'text-charcoal-lighter'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body Column */}
        <div className="md:col-span-3 bg-white rounded-3xl p-6 sm:p-7 shadow-soft border border-gray-100 space-y-6">

          {/* ── TAB 1: Profile & Identity ── */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="font-extrabold text-charcoal text-base">Profil & Karakter Penjelajah</h3>
                <p className="text-xs text-charcoal-lighter mt-0.5">
                  Tentukan persona perjalananmu agar AI dapat memberikan rekomendasi yang lebih personal.
                </p>
              </div>

              {/* Display Name & Home City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-charcoal block mb-1.5">
                    Nama / Panggilan Penjelajah
                  </label>
                  <input
                    type="text"
                    value={settings.displayName}
                    onChange={(e) => updateSetting('displayName', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-teal rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-charcoal outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-charcoal block mb-1.5">
                    Kota Asal Keberangkatan
                  </label>
                  <input
                    type="text"
                    value={settings.homeCity}
                    onChange={(e) => updateSetting('homeCity', e.target.value)}
                    placeholder="Contoh: Jakarta, Surabaya, Medan..."
                    className="w-full bg-gray-50 border border-gray-200 focus:border-teal rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-charcoal outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Persona Selector */}
              <div>
                <label className="text-xs font-bold text-charcoal block mb-2">
                  Gaya & Persona Traveler:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {TRAVELER_PERSONAS.map((p) => {
                    const isSelected = settings.persona === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => updateSetting('persona', p.id)}
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                          isSelected
                            ? 'border-teal bg-teal/5 text-teal font-extrabold shadow-sm'
                            : 'border-gray-100 hover:border-gray-200 text-charcoal-lighter'
                        }`}
                      >
                        <span className="text-2xl">{p.emoji}</span>
                        <span className="text-xs sm:text-sm font-bold text-charcoal">{p.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Travel Bio */}
              <div>
                <label className="text-xs font-bold text-charcoal block mb-1.5">
                  Motto / Catatan Petualangan Singkat
                </label>
                <textarea
                  rows={3}
                  value={settings.travelBio}
                  onChange={(e) => updateSetting('travelBio', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-teal rounded-2xl p-4 text-xs sm:text-sm text-charcoal outline-none resize-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* ── TAB 2: Travel Preferences ── */}
          {activeTab === 'preferences' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="font-extrabold text-charcoal text-base">Preferensi Gaya Berwisata</h3>
                <p className="text-xs text-charcoal-lighter mt-0.5">
                  Atur ritme perjalanan, moda transportasi favorit, dan fokus kegiatan.
                </p>
              </div>

              {/* Ritme / Pace Perjalanan */}
              <div>
                <label className="text-xs font-bold text-charcoal block mb-2">
                  Ritme Jadwal Harian:
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'relaxed', label: 'Santai', sub: '2-3 spot/hari' },
                    { id: 'balanced', label: 'Seimbang', sub: '4-5 spot/hari' },
                    { id: 'fast', label: 'Padat & Lengkap', sub: '6+ spot/hari' },
                  ].map((pace) => (
                    <div
                      key={pace.id}
                      onClick={() => updateSetting('travelPace', pace.id)}
                      className={`p-3.5 rounded-2xl border-2 text-center cursor-pointer transition-all ${
                        settings.travelPace === pace.id
                          ? 'border-teal bg-teal/5 text-teal font-extrabold shadow-sm'
                          : 'border-gray-100 hover:border-gray-200 text-charcoal-lighter'
                      }`}
                    >
                      <p className="text-xs sm:text-sm font-bold text-charcoal">{pace.label}</p>
                      <p className="text-[10px] text-charcoal-lighter mt-0.5">{pace.sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Moda Transportasi Utama */}
              <div>
                <label className="text-xs font-bold text-charcoal block mb-2">
                  Transportasi Pilihan Utama:
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'mobil', label: 'Sewa Mobil', emoji: '🚗' },
                    { id: 'motor', label: 'Motor / Skuter', emoji: '🛵' },
                    { id: 'transit', label: 'Campuran / Umum', emoji: '🚶' },
                  ].map((tr) => (
                    <div
                      key={tr.id}
                      onClick={() => updateSetting('transportPref', tr.id)}
                      className={`p-3.5 rounded-2xl border-2 text-center cursor-pointer transition-all ${
                        settings.transportPref === tr.id
                          ? 'border-teal bg-teal/5 text-teal font-extrabold shadow-sm'
                          : 'border-gray-100 hover:border-gray-200 text-charcoal-lighter'
                      }`}
                    >
                      <span className="text-xl block mb-1">{tr.emoji}</span>
                      <span className="text-xs font-bold text-charcoal">{tr.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Minat Wisata */}
              <div>
                <label className="text-xs font-bold text-charcoal block mb-2">
                  Fokus Kegiatan Favorit:
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'budaya', label: '🏛️ Adat & Budaya' },
                    { id: 'kuliner', label: '🍜 Kuliner Nusantara' },
                    { id: 'alam', label: '🌿 Alam & Bahari' },
                    { id: 'umkm', label: '🧵 Sentra Kriya UMKM' },
                    { id: 'hidden', label: '💎 Hidden Gems' },
                  ].map((item) => {
                    const isChecked = settings.priorityInterests?.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleInterest(item.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                          isChecked
                            ? 'bg-teal text-white border-teal shadow-sm'
                            : 'bg-gray-50 text-charcoal-lighter border-gray-200 hover:border-teal'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 3: Budget Preferences ── */}
          {activeTab === 'budget' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="font-extrabold text-charcoal text-base">Pengaturan Budget & Keuangan</h3>
                <p className="text-xs text-charcoal-lighter mt-0.5">
                  Kelola mata uang tampilan dan alokasi dana perjalanan.
                </p>
              </div>

              {/* Mata Uang Utama */}
              <div>
                <label className="text-xs font-bold text-charcoal block mb-1.5">
                  Mata Uang Tampilan Utama
                </label>
                <select
                  value={settings.currency}
                  onChange={(e) => updateSetting('currency', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-teal rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-charcoal outline-none transition-colors"
                >
                  <option value="IDR (Rp)">IDR (Rp) — Rupiah Indonesia</option>
                  <option value="USD ($)">USD ($) — US Dollar</option>
                  <option value="SGD (S$)">SGD (S$) — Singapore Dollar</option>
                  <option value="EUR (€)">EUR (€) — Euro</option>
                </select>
              </div>

              {/* Target Budget Harian */}
              <div>
                <label className="text-xs font-bold text-charcoal block mb-1.5">
                  Estimasi Target Anggaran / Hari / Orang (IDR)
                </label>
                <input
                  type="number"
                  value={settings.defaultDailyBudget}
                  onChange={(e) => updateSetting('defaultDailyBudget', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-teal rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-charcoal outline-none transition-colors"
                />
              </div>

              {/* Budget Alert Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <div>
                  <h5 className="font-extrabold text-charcoal text-xs sm:text-sm">
                    Peringatan Batas Anggaran
                  </h5>
                  <p className="text-xs text-charcoal-lighter mt-0.5">
                    Beri tanda jika total rencana spot melebihi target budget harian.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.budgetAlerts}
                  onChange={(e) => updateSetting('budgetAlerts', e.target.checked)}
                  className="w-5 h-5 accent-teal rounded cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* ── TAB 4: Notifications ── */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="font-extrabold text-charcoal text-base">Notifikasi & Pengingat</h3>
                <p className="text-xs text-charcoal-lighter mt-0.5">
                  Atur jenis pemberitahuan yang ingin kamu dapatkan saat merencanakan trip.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    key: 'tripReminders',
                    title: 'Pengingat Jadwal Harian',
                    desc: 'Notifikasi waktu mulai aktivitas dan rute berikutnya.',
                  },
                  {
                    key: 'weatherAlerts',
                    title: 'Peringatan Cuaca Destinasi',
                    desc: 'Kabar prakiraan cuaca atau ombak laut saat liburan alam.',
                  },
                  {
                    key: 'weeklyDestinations',
                    title: 'Rekomendasi Hidden Gems Mingguan',
                    desc: 'Inspirasi destinasi baru di nusantara setiap awal pekan.',
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100"
                  >
                    <div>
                      <h5 className="font-extrabold text-charcoal text-xs sm:text-sm">
                        {item.title}
                      </h5>
                      <p className="text-xs text-charcoal-lighter mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings[item.key]}
                      onChange={(e) => updateSetting(item.key, e.target.checked)}
                      className="w-5 h-5 accent-teal rounded cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB 5: Appearance & Data ── */}
          {activeTab === 'appearance' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="font-extrabold text-charcoal text-base">Tampilan & Penyimpanan Data</h3>
                <p className="text-xs text-charcoal-lighter mt-0.5">
                  Sesuaikan bahasa antarmuka dan kelola penyimpanan lokal perangkatmu.
                </p>
              </div>

              {/* Language */}
              <div>
                <label className="text-xs font-bold text-charcoal block mb-1.5">
                  Bahasa Antarmuka
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => updateSetting('language', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-teal rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-charcoal outline-none transition-colors"
                >
                  <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                  <option value="English">English (Internasional)</option>
                </select>
              </div>

              {/* Reset Local Storage Danger Zone */}
              <div className="pt-4 border-t border-gray-100">
                <div className="p-4 rounded-2xl border border-red-200 bg-red-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h5 className="font-extrabold text-red-900 text-xs sm:text-sm flex items-center gap-1.5">
                      <AlertCircle size={15} />
                      Hapus Riwayat Data Lokal
                    </h5>
                    <p className="text-xs text-red-700/80 mt-0.5">
                      Menghapus seluruh itinerary buatanmu dan daftar wishlist yang tersimpan di browser ini.
                    </p>
                  </div>
                  <button
                    onClick={() => setResetModal(true)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl transition-all whitespace-nowrap btn-press"
                  >
                    Reset Data
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* ── Reset Confirmation Modal ── */}
      {resetModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-card space-y-4">
            <h3 className="font-extrabold text-charcoal text-base">Hapus Seluruh Data Lokal?</h3>
            <p className="text-xs text-charcoal-lighter leading-relaxed">
              Tindakan ini akan mengosongkan semua rencana perjalanan tersimpan dan bookmark wishlist tempat lokal. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleResetData}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl transition-all"
              >
                Ya, Hapus Semua
              </button>
              <button
                onClick={() => setResetModal(false)}
                className="px-4 py-2.5 border border-gray-200 text-charcoal font-bold text-xs rounded-xl hover:bg-gray-50"
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
