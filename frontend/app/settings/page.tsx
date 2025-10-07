'use client';

import { useState, useEffect } from 'react';
import { Palette, Globe, Bell, Shield, Database } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState({
    theme: 'dark',
    language: 'en',
    notifications: true,
    autoRefresh: true,
  });

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'he', name: 'עברית', flag: '🇮🇱' },
  ];

  const themes = [
    { id: 'dark', name: 'Dark', description: 'Default dark theme' },
    { id: 'light', name: 'Light', description: 'Clean light theme' },
    { id: 'auto', name: 'Auto', description: 'Follow system preference' },
  ];

  const handleSave = () => {
    // TODO: implement settings save
    alert('Settings saved!');
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-slate-400">Customize your experience</p>
        </div>

        <div className="space-y-6">
          {/* Theme Settings */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Palette className="w-5 h-5 mr-2" />
              Appearance
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">Theme</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {themes.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setSettings({ ...settings, theme: theme.id })}
                      className={`p-4 rounded-lg border text-left transition-colors ${
                        settings.theme === theme.id
                          ? 'border-primary-500 bg-primary-500/10'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="font-medium text-white">{theme.name}</div>
                      <div className="text-sm text-slate-400">{theme.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Language Settings */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Globe className="w-5 h-5 mr-2" />
              Language
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">Select Language</label>
                <div className="space-y-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setSettings({ ...settings, language: lang.code })}
                      className={`w-full p-3 rounded-lg border text-left transition-colors flex items-center space-x-3 ${
                        settings.language === lang.code
                          ? 'border-primary-500 bg-primary-500/10'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-2xl">{lang.flag}</span>
                      <span className="text-white">{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Notifications
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">Push Notifications</div>
                  <div className="text-sm text-slate-400">Receive alerts for important updates</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">Auto Refresh</div>
                  <div className="text-sm text-slate-400">Automatically update portfolio data</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoRefresh}
                    onChange={(e) => setSettings({ ...settings, autoRefresh: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button onClick={handleSave} className="btn-primary">
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
