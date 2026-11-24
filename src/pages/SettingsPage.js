import React, { useState } from 'react';
import {
  User, Bell, Shield, Globe, Moon, ChevronRight, Camera, Save, Check
} from 'lucide-react';
import { mockUser } from '../data/mockData';

const settingSections = [
  {
    title: 'Profile',
    icon: User,
    items: [
      { label: 'Full Name', type: 'input', key: 'name', value: mockUser.name },
      { label: 'Email', type: 'input', key: 'email', value: mockUser.email },
      { label: 'Phone', type: 'input', key: 'phone', value: '+62 812 3456 7890' },
    ],
  },
  {
    title: 'Preferences',
    icon: Globe,
    items: [
      { label: 'Language', type: 'select', key: 'language', value: 'Bahasa Indonesia', options: ['Bahasa Indonesia', 'English'] },
      { label: 'Currency', type: 'select', key: 'currency', value: 'IDR (Rp)', options: ['IDR (Rp)', 'USD ($)', 'SGD (S$)'] },
      { label: 'Dark Mode', type: 'toggle', key: 'darkMode', value: false },
    ],
  },
  {
    title: 'Notifications',
    icon: Bell,
    items: [
      { label: 'Trip Reminders', type: 'toggle', key: 'tripReminders', value: true },
      { label: 'Weather Alerts', type: 'toggle', key: 'weatherAlerts', value: true },
      { label: 'Budget Alerts', type: 'toggle', key: 'budgetAlerts', value: false },
      { label: 'Weekly Newsletter', type: 'toggle', key: 'newsletter', value: false },
    ],
  },
];

function SettingsPage() {
  const [settings, setSettings] = useState({
    name: mockUser.name,
    email: mockUser.email,
    phone: '+62 812 3456 7890',
    language: 'Bahasa Indonesia',
    currency: 'IDR (Rp)',
    darkMode: false,
    tripReminders: true,
    weatherAlerts: true,
    budgetAlerts: false,
    newsletter: false,
  });
  const [saved, setSaved] = useState(false);

  const updateSetting = (key, value) => {
    setSettings((s) => ({ ...s, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeInUp">
      <div>
        <h1 className="text-2xl font-extrabold text-charcoal">Settings</h1>
        <p className="text-charcoal-lighter text-sm mt-1">Manage your profile and preferences</p>
      </div>

      {/* Avatar section */}
      <div className="bg-white rounded-2xl shadow-soft p-6 flex items-center gap-5">
        <div className="relative">
          <img
            src={mockUser.avatar}
            alt="Profile"
            className="w-20 h-20 rounded-2xl object-cover ring-4 ring-teal/20"
          />
          <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-teal text-white rounded-xl flex items-center justify-center shadow-teal hover:bg-teal-dark transition-colors">
            <Camera size={14} />
          </button>
        </div>
        <div>
          <h2 className="text-lg font-bold text-charcoal">{settings.name}</h2>
          <p className="text-charcoal-lighter text-sm">{settings.email}</p>
          <div className="flex gap-3 mt-2">
            <span className="text-xs bg-sky text-teal px-2 py-0.5 rounded-full font-medium">7 Trips</span>
            <span className="text-xs bg-coral/10 text-coral px-2 py-0.5 rounded-full font-medium">23 Places</span>
            <span className="text-xs bg-yellow-trip/20 text-yellow-dark px-2 py-0.5 rounded-full font-medium">1,480 km</span>
          </div>
        </div>
      </div>

      {/* Settings sections */}
      {settingSections.map((section) => (
        <div key={section.title} className="bg-white rounded-2xl shadow-soft overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="w-8 h-8 rounded-xl bg-teal/10 flex items-center justify-center">
              <section.icon size={16} className="text-teal" />
            </div>
            <h3 className="font-bold text-charcoal text-sm">{section.title}</h3>
          </div>
          <div className="p-2">
            {section.items.map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors">
                <label className="text-sm text-charcoal flex-shrink-0">{item.label}</label>
                {item.type === 'input' && (
                  <input
                    type="text"
                    value={settings[item.key]}
                    onChange={(e) => updateSetting(item.key, e.target.value)}
                    className="text-sm text-charcoal text-right border-b border-transparent hover:border-gray-200 focus:border-teal outline-none bg-transparent max-w-[220px] flex-1"
                  />
                )}
                {item.type === 'select' && (
                  <select
                    value={settings[item.key]}
                    onChange={(e) => updateSetting(item.key, e.target.value)}
                    className="text-sm text-charcoal border border-gray-100 rounded-lg px-2 py-1 focus:outline-none focus:border-teal bg-transparent"
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

      {/* About TRIPIN */}
      <div className="bg-white rounded-2xl shadow-soft p-5 border border-gray-100 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
        <div className="bg-charcoal px-3.5 py-2 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
          <img
            src="/logo-full.png"
            alt="TRIPIN"
            className="h-8 w-auto object-contain"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h4 className="font-bold text-charcoal text-sm">TRIPIN App</h4>
            <span className="text-[10px] bg-teal/10 text-teal font-extrabold px-2 py-0.5 rounded-full">v2.0 (Nusantara)</span>
          </div>
          <p className="text-charcoal-lighter text-xs mt-1 leading-relaxed">
            Mendukung pariwisata berkelanjutan dan kemandirian ekonomi pelaku UMKM lokal (SDG 8) di seluruh penjuru Indonesia.
          </p>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden border border-red-100">
        <div className="px-5 py-4 border-b border-red-50">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-red-400" />
            <h3 className="font-bold text-charcoal text-sm">Account</h3>
          </div>
        </div>
        <div className="p-2">
          {[
            { label: 'Change Password', color: 'text-charcoal' },
            { label: 'Export My Data', color: 'text-charcoal' },
            { label: 'Delete Account', color: 'text-red-500' },
          ].map((item) => (
            <button
              key={item.label}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <span className={`text-sm font-medium ${item.color}`}>{item.label}</span>
              <ChevronRight size={14} className="text-gray-300" />
            </button>
          ))}
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
          saved
            ? 'bg-teal text-white'
            : 'bg-gradient-to-r from-coral to-coral-dark text-white hover:shadow-coral'
        }`}
      >
        {saved ? <Check size={16} /> : <Save size={16} />}
        {saved ? 'Changes Saved!' : 'Save Changes'}
      </button>
    </div>
  );
}

export default SettingsPage;

