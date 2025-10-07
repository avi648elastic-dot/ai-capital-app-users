'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { User, Mail, CreditCard, Shield, Camera } from 'lucide-react';

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

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
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
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
      // TODO: implement update profile API
      alert('Profile update not yet implemented');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
+    );
+  }

+  return (
+    <div className="min-h-screen bg-slate-900">
+      <div className="max-w-4xl mx-auto px-4 py-8">
+        <div className="mb-8">
+          <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
+          <p className="text-slate-400">Manage your account and subscription</p>
+        </div>
+
+        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
+          {/* Profile Picture & Basic Info */}
+          <div className="lg:col-span-1">
+            <div className="card p-6">
+              <div className="flex flex-col items-center text-center">
+                <div className="w-24 h-24 bg-slate-700 rounded-full flex items-center justify-center mb-4">
+                  <User className="w-12 h-12 text-slate-400" />
+                </div>
+                <h3 className="text-xl font-semibold text-white mb-2">{user?.name || 'User'}</h3>
+                <p className="text-slate-400 mb-4">{user?.email}</p>
+                <button className="btn-secondary flex items-center space-x-2">
+                  <Camera className="w-4 h-4" />
+                  <span>Change Photo</span>
+                </button>
+              </div>
+            </div>
+          </div>
+
+          {/* Profile Form */}
+          <div className="lg:col-span-2 space-y-6">
+            <div className="card p-6">
+              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
+                <User className="w-5 h-5 mr-2" />
+                Personal Information
+              </h3>
+              <div className="space-y-4">
+                <div>
+                  <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
+                  <input
+                    type="text"
+                    value={formData.name}
+                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
+                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
+                  />
+                </div>
+                <div>
+                  <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
+                  <input
+                    type="email"
+                    value={formData.email}
+                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
+                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
+                  />
+                </div>
+                <button
+                  onClick={handleSave}
+                  disabled={saving}
+                  className="btn-primary"
+                >
+                  {saving ? 'Saving...' : 'Save Changes'}
+                </button>
+              </div>
+            </div>
+
+            {/* Subscription */}
+            <div className="card p-6">
+              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
+                <CreditCard className="w-5 h-5 mr-2" />
+                Subscription
+              </h3>
+              <div className="flex items-center justify-between">
+                <div>
+                  <p className="text-white font-medium">
+                    {user?.subscriptionTier === 'premium' ? 'Premium' : 'Free'} Plan
+                  </p>
+                  <p className="text-slate-400 text-sm">
+                    {user?.subscriptionTier === 'premium' ? 'Full access to all features' : 'Limited features'}
+                  </p>
+                </div>
+                {user?.subscriptionTier === 'free' && (
+                  <button className="btn-primary">Upgrade to Premium</button>
+                )}
+              </div>
+            </div>
+          </div>
+        </div>
+      </div>
+    </div>
+  );
}
