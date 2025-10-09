'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { User, Mail, CreditCard, Shield, Camera, Upload, X } from 'lucide-react';
import ResponsiveNavigation from '@/components/ResponsiveNavigation';

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

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      window.location.href = '/';
      return;
    }
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` }
      });
      setUser(response.data.user);
      setFormData({
        name: response.data.user.name || '',
        email: response.data.user.email || '',
      });
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Check if email is being changed
      const emailChanged = formData.email !== user?.email;
      
      const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/user/profile`, formData, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` }
      });
      
      if (response.data.success) {
        setUser(response.data.user);
        
        if (emailChanged) {
          alert('✅ Profile updated successfully!\n\n⚠️ IMPORTANT: Your email has been changed.\nPlease use your new email (' + formData.email + ') to log in next time.');
        } else {
          alert('✅ Profile updated successfully!');
        }
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data?.error || 'Error updating profile';
      alert('❌ ' + errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
      return;
    }

    // Validate file size (1MB = 1024 * 1024 bytes)
    if (file.size > 1024 * 1024) {
      alert('File size too large. Maximum size is 1MB.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/user/avatar`, formData, {
        headers: {
          Authorization: `Bearer ${Cookies.get('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setUser(response.data.user);
        alert('Avatar updated successfully!');
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      const errorMessage = error.response?.data?.error || 'Error uploading avatar';
      alert(errorMessage);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleLogout = () => {
    Cookies.remove('token');
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <ResponsiveNavigation 
        userName={user?.name || 'User'} 
        subscriptionTier={user?.subscriptionTier || 'free'}
        userAvatar={user?.avatarUrl}
        onLogout={handleLogout}
      />
      
      <div className="flex-1 flex flex-col px-4 sm:px-6 lg:px-8 pt-20 lg:pt-8 pb-6 sm:pb-8">
        <div className="max-w-4xl mx-auto w-full">
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
                    {user?.avatarUrl ? (
                      <img 
                        src={`${process.env.NEXT_PUBLIC_API_URL}${user.avatarUrl}`}
                        alt="Profile"
                        className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-2 border-slate-600"
                      />
                    ) : (
                      <div className="w-28 h-28 sm:w-32 sm:h-32 bg-slate-700 rounded-full flex items-center justify-center border-2 border-slate-600">
                        <User className="w-14 h-14 sm:w-16 sm:h-16 text-slate-400" />
                      </div>
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                      </div>
                    )}
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-3">{user?.name || 'User'}</h3>
                  <p className="text-lg text-slate-400 mb-6">{user?.email}</p>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  
                  <button 
                    onClick={handleFileSelect}
                    disabled={uploading}
                    className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed text-base font-medium"
                  >
                    {uploading ? (
                      <>
                        <Upload className="w-5 h-5 animate-pulse" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-5 h-5" />
                        <span>Change Photo</span>
                      </>
                    )}
                  </button>
                  
                  <p className="text-sm text-slate-500 mt-3">
                    Max 1MB • JPEG, PNG, WebP
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Personal Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>

              {/* Subscription */}
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
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
                  {user?.subscriptionTier === 'free' && (
                    <button 
                      onClick={() => window.location.href = '/subscription'}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Upgrade to Premium
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}