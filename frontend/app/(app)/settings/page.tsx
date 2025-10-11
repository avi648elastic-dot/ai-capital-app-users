'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Palette, Globe, Bell, Shield, Database } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function Settings() {
  const { t, locale, setLocale } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    notifications: true,
    emailUpdates: true,
  });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const fetchUser = async () => {
    try {
      const token = Cookies.get('token');
      if (!token) return;

      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUser(response.data.user);
      // Load user's saved settings
      if (response.data.user) {
        setSettings({
          notifications: response.data.user.notifications ?? true,
          emailUpdates: response.data.user.emailUpdates ?? true,
        });
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');
    
    try {
      const token = Cookies.get('token');
      if (!token) {
        setSaveMessage('❌ Please login to save settings');
        return;
      }

      console.log('💾 Saving settings:', { ...settings, theme, language: locale });

      // Save all settings including theme and language
      const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/user/settings`, {
        ...settings,
        theme,
        language: locale
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Check if response is successful
      if (response.data.success) {
        setSaveMessage('✅ Settings saved successfully!');
        // Refresh user data to get updated settings
        await fetchUser();
      } else {
        setSaveMessage('❌ Failed to save settings. Please try again.');
      }
    } catch (error: any) {
      console.error('Error saving settings:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
      setSaveMessage(`❌ Failed to save settings: ${errorMessage}`);
    } finally {
      setSaving(false);
      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleLogout = () => {
    Cookies.remove('token');
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{t('settings.title')}</h1>
        <p className="text-slate-400">{t('settings.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Appearance Settings */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Palette className="w-5 h-5 mr-2" />
            {t('settings.appearance')}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">{t('settings.theme')}</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="dark">{t('settings.dark')}</option>
                <option value="light">{t('settings.light')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Language Settings */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            {t('settings.language')}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">{t('settings.language')}</label>
                      <select
                        value={locale}
                        onChange={(e) => setLocale(e.target.value as 'en' | 'ar' | 'he')}
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                <option value="en">English</option>
                <option value="ar">العربية</option>
                <option value="he">עברית</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            {t('settings.notifications')}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-medium">{t('settings.pushNotifications')}</div>
                <div className="text-slate-400 text-sm">{t('settings.pushNotificationsDesc')}</div>
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
                <div className="text-white font-medium">{t('settings.emailUpdates')}</div>
                <div className="text-slate-400 text-sm">{t('settings.emailUpdatesDesc')}</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailUpdates}
                  onChange={(e) => setSettings({ ...settings, emailUpdates: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            {t('settings.account')}
          </h3>
          <div className="space-y-4">
            <button 
              onClick={() => window.location.href = '/profile'}
              className="w-full text-left p-4 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              <div className="text-white font-medium">{t('settings.manageProfile')}</div>
              <div className="text-slate-400 text-sm">{t('settings.updatePersonalInfo')}</div>
            </button>
            <button 
              onClick={() => window.location.href = '/subscription'}
              className="w-full text-left p-4 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              <div className="text-white font-medium">{t('settings.subscription')}</div>
              <div className="text-slate-400 text-sm">{t('settings.manageSubscription')}</div>
            </button>
            <button 
              onClick={handleLogout}
              className="w-full text-left p-4 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              <div className="text-white font-medium">{t('settings.signOut')}</div>
              <div className="text-red-200 text-sm">{t('settings.logoutFromAccount')}</div>
            </button>
          </div>
        </div>
      </div>

      {/* Save Button & Message */}
      <div className="mt-8">
        {saveMessage && (
          <div className={`mb-4 p-4 rounded-lg text-center font-medium ${
            saveMessage.includes('✅') 
              ? 'bg-green-900/20 text-green-400 border border-green-500/30' 
              : 'bg-red-900/20 text-red-400 border border-red-500/30'
          }`}>
            {saveMessage}
          </div>
        )}
        <button 
          onClick={handleSave} 
          disabled={saving}
          className={`btn-primary ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {saving ? '💾 Saving...' : `${t('common.save')} ${t('settings.title')}`}
        </button>
      </div>
    </div>
  );
}