'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { User, Mail, CreditCard, Shield, Camera, Upload, X } from 'lucide-react';

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchUser = async () => {
    try {
      const token = Cookies.get('token');
      if (!token) return;

      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const userData = response.data.user;
      console.log('👤 [PROFILE] User data received:', userData);
      console.log('🖼️ [PROFILE] Avatar field:', userData.avatar);
      
      setUser(userData);
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
      });
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (1MB max)
    if (file.size > 1024 * 1024) {
      alert('File size must be less than 1MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a JPEG, PNG, or WebP image');
      return;
    }

    setUploading(true);
    try {
      const token = Cookies.get('token');
      if (!token) return;

      const formData = new FormData();
      formData.append('avatar', file);

      console.log('📤 [PROFILE] Uploading avatar...', file.name);
      
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/user/avatar`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('✅ [PROFILE] Avatar upload response:', response.data);

      if (response.data.success) {
        console.log('🔄 [PROFILE] Updating user state with avatar:', response.data.avatar);
        
        // Update user state with new avatar
        setUser({ ...user, avatar: response.data.avatar });
        
        // Refresh user data to ensure consistency
        await fetchUser();
        
        alert('Avatar updated successfully!');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload avatar. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = Cookies.get('token');
      if (!token) return;

      const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/user/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setUser({ ...user, ...formData });
        alert('Profile updated successfully!');
        
        // If email was changed, remind user to use new email for login
        if (formData.email !== user.email) {
          alert('Email changed successfully! Please use your new email address to log in next time.');
        }
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
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
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Profile</h1>
        <p className="text-lg text-slate-400">Manage your account and subscription</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Profile Picture & Basic Info */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800 rounded-xl p-6 sm:p-8 border border-slate-700">
            <div className="flex flex-col items-center text-center">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 mb-6">
                {(() => {
                  console.log('🖼️ [PROFILE] Current avatar state:', user?.avatar);
                  return user?.avatar;
                })() ? (
                  <img 
                    src={`${process.env.NEXT_PUBLIC_API_URL}${user.avatar}`}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover border-2 border-primary-500"
                    onLoad={() => console.log('✅ [PROFILE] Avatar image loaded successfully')}
                    onError={(e) => console.error('❌ [PROFILE] Avatar image failed to load:', e)}
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-slate-700 flex items-center justify-center border-2 border-primary-500">
                    <User className="w-12 h-12 text-slate-400" />
                  </div>
                )}
                
                <button
                  onClick={handleFileSelect}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 bg-primary-500 hover:bg-primary-600 text-white rounded-full p-2 transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">{user?.name || 'User'}</h2>
              <p className="text-slate-400 mb-4">{user?.email}</p>

              <div className="flex items-center space-x-2 bg-primary-500/10 border border-primary-500/20 rounded-full px-4 py-2">
                <Shield className="w-4 h-4 text-primary-500" />
                <span className="text-primary-500 font-medium capitalize">
                  {user?.subscriptionTier === 'premium' ? 'Premium' : 
                   user?.subscriptionTier === 'premium+' ? 'Premium+' : 'Free'} Plan
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Settings */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          {/* Personal Information */}
          <div className="bg-slate-800 rounded-xl p-6 sm:p-8 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Personal Information
            </h3>
            
            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>
              
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Subscription */}
          <div className="bg-slate-800 rounded-xl p-6 sm:p-8 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Subscription
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">
                  {user?.subscriptionTier === 'premium' ? 'Premium' : 
                   user?.subscriptionTier === 'premium+' ? 'Premium+' : 'Free'} Plan
                </p>
                <p className="text-slate-400 text-sm">
                  {user?.subscriptionTier === 'free' ? 'Limited features' : 'Full access to all features'}
                </p>
              </div>
              <button 
                onClick={() => window.location.href = '/subscription'}
                className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {user?.subscriptionTier === 'free' ? 'Upgrade' : 'Manage'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}