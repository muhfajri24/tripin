import React, { useState } from 'react';
import {
  Bell, Globe, Moon, Save, Check, RotateCcw, Sparkles
} from 'lucide-react';
import logoFull from '../assets/logo-full.png';

const preferenceSections = [
  {
    title: 'Preferensi Wilayah & Tampilan',
    icon: Globe,
    items: [
      { label: 'Bahasa Aplikasi', type: 'select', key: 'language', options: ['Bahasa Indonesia', 'English'] },
      { label: 'Mata Uang Utama', type: 'select', key: 'currency', options: ['IDR (Rp)', 'USD ($)', 'SGD (S$)'] },
      { label: 'Mode Gelap (Dark Mode)', type: 'toggle', key: 'darkMode' },
    ],
  },
  {
    title: 'Notifikasi & Pengingat',
    icon: Bell,
    items: [
      { label: 'Pengingat Jadwal Itinerary', type: 'toggle', key: 'tripReminders' },
      { label: 'Peringatan Prakiraan Cuaca', type: 'toggle', key: 'weatherAlerts' },
      { label: 'Peringatan Estimasi Budget', type: 'toggle', key: 'budgetAlerts' },
    ],
  },
];

function SettingsPage() {
  const [settings, setSettings] = useState({
    language: 'Bahasa Indonesia',
    currency: 'IDR (Rp)',
    darkMode: false,
    tripReminders: true,
    weatherAlerts: true,
    budgetAlerts: false,
  });
  const [saved, setSaved] = useState(false);
  const [cleared, setCleared] = useState(false);

  const updateSetting = (key, value) => {
    setSettings((s) => ({ ...s, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearStorage = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus seluruh riwayat itinerary dan wishlist lokal?')) {
      try {
        localStorage.removeItem('tripin_user_itineraries');
        localStorage.removeItem('tripin_saved_places');
      } catch (e) {
        // ignore
      }
      setCleared(true);
      setTimeout(() => {
        setCleared(false);
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeInUp pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-charcoal">Pengaturan & Preferensi</h1>
        <p className="text-charcoal-lighter text-sm mt-1">
          Sesuaikan bahasa, mata uang, dan preferensi aplikasi TRIPIN (Open Web tanpa registrasi).
        </p>
      </div>

      {/* Open Web Notice */}
      <div className="bg-white rounded-2xl shadow-soft p-4.5 border border-teal/20 flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-teal/10 flex items-center justify-center flex-shrink-0 text-teal mt-0.5">
          <Globe size={18} />
        </div>
        <div className="text-xs sm:text-sm">
          <p className="font-bold text-charcoal">Platform Terbuka (Tanpa Perlu Login)</p>
          <p className="text-charcoal-lighter mt-1 leading-relaxed text-xs">
            TRIPIN dapat digunakan langsung tanpa perlu membuat akun atau mendaftar. Seluruh itinerary, kalkulasi rute, dan tempat tersimpan disimpan secara aman di peramban (Local Storage) perangkat Anda.
          </p>
        </div>
      </div>

      {/* Settings Sections */}
      {preferenceSections.map((section) => (
        <div key={section.title} className="bg-white rounded-2xl shadow-soft overflow-hidden border border-gray-100">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="w-8 h-8 rounded-xl bg-teal/10 flex items-center justify-center">
              <section.icon size={16} className="text-teal" />
            </div>
            <h3 className="font-bold text-charcoal text-sm">{section.title}</h3>
          </div>
          <div className="p-2 divide-y divide-gray-50">
            {section.items.map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors">
                <label className="text-sm text-charcoal flex-shrink-0">{item.label}</label>
                {item.type === 'select' && (
                  <select
                    value={settings[item.key]}
                    onChange={(e) => updateSetting(item.key, e.target.value)}
                    className="text-sm text-charcoal border border-gray-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-teal bg-white"
                  >
                    {item.options.map((opt) => (
                      <option key={opt}>{opt}</option>
                    ))}
                  </select>
                )}
                {item.type === 'toggle' && (
                  <button
                    onClick={() => updateSetting(item.key, !settings[item.key])}
                    className={`w-11 h-6 rounded-full relative transition-colors ${
                      settings[item.key] ? 'bg-teal' : 'bg-gray-200'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      settings[item.key] ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Local Storage Management */}
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden border border-gray-100">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="w-8 h-8 rounded-xl bg-coral/10 flex items-center justify-center text-coral">
            <RotateCcw size={16} />
          </div>
          <h3 className="font-bold text-charcoal text-sm">Penyimpanan Lokal Browser</h3>
        </div>
        <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-charcoal">Bersihkan Data Tersimpan</p>
            <p className="text-xs text-charcoal-lighter mt-0.5">
              Hapus seluruh riwayat itinerary dan wishlist tempat yang tersimpan di perangkat ini.
            </p>
          </div>
          <button
            onClick={handleClearStorage}
            className="px-4 py-2 rounded-xl text-xs font-bold text-coral border border-coral/30 hover:bg-coral hover:text-white transition-all whitespace-nowrap"
          >
            {cleared ? 'Data Dibersihkan' : 'Reset Data Lokal'}
          </button>
        </div>
      </div>

      {/* About TRIPIN */}
      <div className="bg-white rounded-2xl shadow-soft p-5 border border-gray-100 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
        <div className="bg-charcoal px-3.5 py-2 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
          <img
            src={logoFull}
            alt="TRIPIN"
            className="h-8 w-auto object-contain"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h4 className="font-bold text-charcoal text-sm">TRIPIN Platform</h4>
            <span className="text-[10px] bg-teal/10 text-teal font-extrabold px-2 py-0.5 rounded-full">v2.0 (Nusantara)</span>
          </div>
          <p className="text-charcoal-lighter text-xs mt-1 leading-relaxed">
            Platform AI Travel Planner & Eksplorasi UMKM Terbuka untuk seluruh wilayah Indonesia. Mendorong pariwisata berkelanjutan dan kemandirian ekonomi warga (SDG 8).
          </p>
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
          saved
            ? 'bg-teal text-white'
            : 'bg-gradient-to-r from-coral to-coral-dark text-white hover:shadow-md'
        }`}
      >
        {saved ? <Check size={16} /> : <Save size={16} />}
        {saved ? 'Preferensi Tersimpan!' : 'Simpan Preferensi'}
      </button>
    </div>
  );
}

export default SettingsPage;
