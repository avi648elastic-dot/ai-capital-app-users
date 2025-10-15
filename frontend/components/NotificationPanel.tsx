'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import axios from 'axios';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'action';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'system' | 'portfolio' | 'market' | 'account' | 'action';
  readAt?: string;
  createdAt: string;
  userId?: string | null;
  actionData?: {
    ticker?: string;
    action?: 'BUY' | 'SELL' | 'HOLD';
    reason?: string;
    portfolioId?: string;
  };
}

interface NotificationPanelProps {
  isVisible: boolean;
  onClose: () => void;
  isMobile?: boolean;
}

export default function NotificationPanel({ isVisible, onClose, isMobile = false }: NotificationPanelProps) {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isVisible) {
      fetchNotifications();
    }
  }, [isVisible]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // 🚨 MOBILE FIX: Get token from both localStorage and cookies
      let token = localStorage.getItem('token');
      if (!token) {
        // Fallback to cookies for mobile
        const cookies = document.cookie.split(';');
        const tokenCookie = cookies.find(c => c.trim().startsWith('token='));
        if (tokenCookie) {
          token = tokenCookie.split('=')[1];
        }
      }
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('📱 [NOTIFICATIONS] Starting fetch with token:', token ? 'present' : 'missing');
      
      // 🚨 MOBILE FIX: Use multiple API URL fallbacks
      const apiUrls = [
        process.env.NEXT_PUBLIC_API_URL,
        'https://ai-capital-app7.onrender.com',
        window.location.origin.replace(':3000', ':5000') // Local fallback
      ].filter(Boolean);

      let lastError: any = null;
      
      for (const apiUrl of apiUrls) {
        try {
          console.log(`📱 [NOTIFICATIONS] Trying API URL: ${apiUrl}`);
          
          // Fetch notifications
          const response = await axios.get(`${apiUrl}/api/notifications?limit=50&unreadOnly=true`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 second timeout
          });
          
          console.log('📱 [NOTIFICATIONS] API Response:', response.status, response.data);
          
          const fetchedNotifications = response.data.data?.notifications || response.data.notifications || [];
          console.log('📱 [NOTIFICATIONS] Parsed notifications:', fetchedNotifications.length);
          
          if (fetchedNotifications.length > 0) {
            // 🎉 REAL NOTIFICATIONS FOUND!
            // 🔧 Normalize id field (backend returns _id, frontend expects id)
            const normalizedNotifications = fetchedNotifications.map((n: any) => ({
              ...n,
              id: String(n.id || n._id || '')
            }));
            setNotifications(normalizedNotifications);
            setUnreadCount(normalizedNotifications.filter((n: Notification) => !n.readAt).length);
            console.log('✅ [NOTIFICATIONS] Successfully loaded real notifications:', normalizedNotifications.length);
            return; // Success! Exit the function
          } else {
            // Create some sample notifications for the user
            const sampleNotifications: Notification[] = [
              {
                id: 'sample-welcome',
                title: 'Welcome to AI Capital! 🎉',
                message: 'Your portfolio is ready. Start by adding stocks to track and receive AI-powered recommendations.',
                type: 'success',
                priority: 'medium',
                category: 'system',
                createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
              },
              {
                id: 'sample-portfolio',
                title: 'Portfolio Tips 💡',
                message: 'Diversify your portfolio across different sectors to reduce risk and maximize returns.',
                type: 'info',
                priority: 'low',
                category: 'portfolio',
                createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
              },
              {
                id: 'sample-market',
                title: 'Market Insight 📈',
                message: 'Tech stocks are showing strong momentum. Consider reviewing your positions.',
                type: 'info',
                priority: 'medium',
                category: 'market',
                createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
              }
            ];
            
            setNotifications(sampleNotifications);
            setUnreadCount(sampleNotifications.length);
            console.log('✅ [NOTIFICATIONS] Showing sample notifications');
            return; // Success with samples
          }
          
        } catch (apiError: any) {
          console.error(`❌ [NOTIFICATIONS] API ${apiUrl} failed:`, apiError?.response?.status, apiError.message);
          lastError = apiError;
          continue; // Try next API URL
        }
      }
      
      // If we get here, all API URLs failed
      throw lastError || new Error('All API endpoints failed');
      
    } catch (error: any) {
      console.error('❌ [NOTIFICATIONS] All attempts failed:', error);
      
      // Show detailed error state
      const errorStateNotifications: Notification[] = [
        {
          id: 'error-connection',
          title: 'Connection Issue 🔌',
          message: `Unable to load notifications. ${error?.response?.status === 401 ? 'Please log in again.' : 'Please check your internet connection and try again.'}`,
          type: 'error',
          priority: 'high',
          category: 'system',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'error-retry',
          title: 'Retry Available 🔄',
          message: 'Tap the refresh button or close and reopen the notification panel to try again.',
          type: 'info',
          priority: 'medium',
          category: 'system',
          createdAt: new Date().toISOString(),
        }
      ];
      setNotifications(errorStateNotifications);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // 🔧 Safety check: Ensure notificationId is valid
      if (!notificationId) {
        console.error('❌ Cannot mark notification as read: ID is undefined or null');
        return;
      }
      
      // 🚨 CRITICAL FIX: Handle sample notifications locally
      const id = String(notificationId);
      if (id.startsWith('sample')) {
        setNotifications(prev => 
          prev.map(n => String(n.id) === id ? { ...n, readAt: new Date().toISOString() } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        return;
      }
      
      const token = localStorage.getItem('token');
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotifications(prev => 
        prev.map(n => String(n.id) === id ? { ...n, readAt: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Get token from both localStorage and cookies
      let token = localStorage.getItem('token');
      if (!token) {
        const cookies = document.cookie.split(';');
        const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
        if (tokenCookie) {
          token = tokenCookie.split('=')[1];
        }
      }
      
      if (!token) {
        console.error('❌ No authentication token found for mark all as read');
        return;
      }
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ai-capital-app7.onrender.com';
      console.log(`📖 Marking all notifications as read via ${apiUrl}/api/notifications/read-all`);
      
      await axios.put(`${apiUrl}/api/notifications/read-all`, {}, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000,
        withCredentials: true
      });
      
      console.log('✅ All notifications marked as read successfully');
      setNotifications(prev => 
        prev.map(n => ({ ...n, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error: any) {
      console.error('❌ Failed to mark all as read:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      // 🔧 Safety check: Ensure notificationId is valid
      if (!notificationId) {
        console.error('❌ Cannot delete notification: ID is undefined or null');
        return;
      }
      
      // Handle sample notifications locally
      const id = String(notificationId);
      if (id.startsWith('sample') || id.startsWith('error')) {
        setNotifications(prev => prev.filter(n => String(n.id) !== id));
        setUnreadCount(prev => Math.max(0, prev - 1));
        return;
      }
      
      // Get token from both localStorage and cookies
      let token = localStorage.getItem('token');
      if (!token) {
        const cookies = document.cookie.split(';');
        const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
        if (tokenCookie) {
          token = tokenCookie.split('=')[1];
        }
      }
      
      if (!token) {
        console.error('❌ No authentication token found');
        return;
      }
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ai-capital-app7.onrender.com';
      console.log(`🗑️ Deleting notification ${id} via ${apiUrl}/api/notifications/${id}`);
      
      const response = await axios.delete(`${apiUrl}/api/notifications/${id}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000,
        withCredentials: true
      });
      
      console.log('✅ Notification deleted successfully:', response.data);
      setNotifications(prev => prev.filter(n => String(n.id) !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: any) {
      console.error('❌ Failed to delete notification:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      const status = error?.response?.status;
      // If forbidden or not found (global/admin notifications), mark-as-read then dismiss locally
      if (status === 403 || status === 404) {
        try {
          let token2 = localStorage.getItem('token');
          if (!token2) {
            const cookies = document.cookie.split(';');
            const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
            if (tokenCookie) token2 = tokenCookie.split('=')[1];
          }
          const id = String(notificationId);
          await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${id}/read`, {}, {
            headers: { 
              Authorization: `Bearer ${token2}`,
              'Content-Type': 'application/json'
            },
            withCredentials: true,
            timeout: 15000
          });
        } catch (markErr) {
          // ignore
        }
        const id = String(notificationId);
        setNotifications(prev => prev.filter(n => String(n.id) !== id));
        setUnreadCount(prev => Math.max(0, prev - 1));
        return;
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500 bg-red-50 border-red-200';
      case 'high': return 'text-orange-500 bg-orange-50 border-orange-200';
      case 'medium': return 'text-blue-500 bg-blue-50 border-blue-200';
      case 'low': return 'text-gray-500 bg-gray-50 border-gray-200';
      default: return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'action': return '🎯';
      default: return 'ℹ️';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 ${isMobile ? 'bg-black bg-opacity-50' : 'bg-black bg-opacity-20'}`}>
      <div className={`${isMobile ? 'fixed inset-0 m-4' : 'fixed top-16 right-4 max-w-md'} bg-white dark:bg-slate-800 shadow-2xl rounded-lg border border-slate-200 dark:border-slate-700 max-h-[80vh] flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🔔</span>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {t('navigation.notifications')}
            </h3>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {/* Refresh Button */}
            <button
              onClick={() => {
                console.log('🔄 [NOTIFICATIONS] Manual refresh triggered');
                fetchNotifications();
              }}
              disabled={loading}
              className={`p-1 rounded transition-colors ${
                loading 
                  ? 'text-slate-400 cursor-not-allowed' 
                  : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
              }`}
              title="Refresh Notifications"
            >
              <svg 
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
            </button>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-slate-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              <div className="text-4xl mb-2">🔔</div>
              <p className="mb-4">No notifications yet</p>
              <div className="text-sm space-y-2">
                <p>📊 Portfolio updates will appear here</p>
                <p>🎯 Price alerts will show here</p>
                <p>⚠️ Market notifications will display here</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                    !notification.readAt ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-lg flex-shrink-0">
                      {getTypeIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 
                          className={`text-sm font-medium cursor-pointer ${!notification.readAt ? 'text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'}`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          {notification.title}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(notification.priority)}`}>
                            {notification.priority}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="text-slate-400 hover:text-red-500 transition-colors p-1"
                            title="Delete notification"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <p 
                        className={`text-sm cursor-pointer ${!notification.readAt ? 'text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'}`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        {notification.message}
                      </p>
                      {notification.actionData && (
                        <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-700 rounded text-xs">
                          <div className="font-medium">Action Details:</div>
                          {notification.actionData.ticker && (
                            <div>Stock: {notification.actionData.ticker}</div>
                          )}
                          {notification.actionData.action && (
                            <div>Action: {notification.actionData.action}</div>
                          )}
                          {notification.actionData.reason && (
                            <div>Reason: {notification.actionData.reason}</div>
                          )}
                        </div>
                      )}
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
