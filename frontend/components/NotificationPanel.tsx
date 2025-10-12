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
      const token = localStorage.getItem('token');
      
      // 🚨 CRITICAL FIX: First try to create real notifications for the user
      try {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/create-test`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ [NOTIFICATIONS] Real notifications created for user');
      } catch (createError) {
        console.log('ℹ️ [NOTIFICATIONS] Could not create test notifications (may already exist):', createError);
      }
      
      // Now fetch all notifications
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications?limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const fetchedNotifications = response.data.data?.notifications || response.data.notifications || [];
      console.log('📱 [NOTIFICATIONS] Fetched notifications:', fetchedNotifications.length);
      
      if (fetchedNotifications.length > 0) {
        // 🎉 REAL NOTIFICATIONS FOUND!
        setNotifications(fetchedNotifications);
        setUnreadCount(fetchedNotifications.filter((n: Notification) => !n.readAt).length);
        console.log('✅ [NOTIFICATIONS] Showing real notifications:', fetchedNotifications.length);
      } else {
        // Show helpful message if no notifications exist
        const emptyStateNotifications: Notification[] = [
          {
            id: 'empty-state-1',
            title: 'No Notifications Yet',
            message: 'You\'ll see portfolio updates, price alerts, and market insights here once you start trading.',
            type: 'info',
            priority: 'low',
            category: 'system',
            createdAt: new Date().toISOString(),
          }
        ];
        
        setNotifications(emptyStateNotifications);
        setUnreadCount(0);
        console.log('ℹ️ [NOTIFICATIONS] No real notifications found, showing empty state');
      }
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Failed to fetch notifications:', error);
      
      // Show error state with helpful message
      const errorStateNotifications: Notification[] = [
        {
          id: 'error-state-1',
          title: 'Connection Issue',
          message: 'Unable to load notifications right now. Please check your internet connection and try again.',
          type: 'error',
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
      // 🚨 CRITICAL FIX: Handle sample notifications locally
      if (notificationId.startsWith('sample')) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        return;
      }
      
      const token = localStorage.getItem('token');
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/mark-all-read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
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
                  className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors ${
                    !notification.readAt ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-lg flex-shrink-0">
                      {getTypeIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`text-sm font-medium ${!notification.readAt ? 'text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'}`}>
                          {notification.title}
                        </h4>
                        <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(notification.priority)}`}>
                          {notification.priority}
                        </span>
                      </div>
                      <p className={`text-sm ${!notification.readAt ? 'text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'}`}>
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
