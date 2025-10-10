'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Bell, X, Check, AlertTriangle, Info, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'action';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'system' | 'portfolio' | 'market' | 'account' | 'action';
  actionData?: {
    ticker?: string;
    action?: 'BUY' | 'SELL' | 'HOLD';
    reason?: string;
    portfolioId?: string;
  };
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  readAt?: string;
  createdAt: string;
}

interface NotificationCenterProps {
  userId: string;
}

export default function NotificationCenter({ userId }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Set up polling for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      const token = Cookies.get('token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 20, unreadOnly: false }
      });
      
      console.log('🔔 [NOTIFICATIONS] API Response:', response.data);
      console.log('🔔 [NOTIFICATIONS] Notifications array:', response.data.data.notifications);
      
      setNotifications(response.data.data.notifications);
      setUnreadCount(response.data.data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = Cookies.get('token');
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n._id === notificationId 
            ? { ...n, readAt: new Date().toISOString(), status: 'read' as const }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = Cookies.get('token');
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, readAt: new Date().toISOString(), status: 'read' as const }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const token = Cookies.get('token');
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const createTestNotification = async () => {
    try {
      setLoading(true);
      const token = Cookies.get('token');
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/test`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh notifications
      await fetchNotifications();
    } catch (error) {
      console.error('Error creating test notification:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'success': return <CheckCircle className="w-5 h-5" />;
      case 'error': return <XCircle className="w-5 h-5" />;
      case 'action': return <TrendingUp className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'urgent') return 'border-red-500 bg-red-50';
    if (priority === 'high') return 'border-orange-500 bg-orange-50';
    
    switch (type) {
      case 'info': return 'border-blue-500 bg-blue-50';
      case 'warning': return 'border-yellow-500 bg-yellow-50';
      case 'success': return 'border-green-500 bg-green-50';
      case 'error': return 'border-red-500 bg-red-50';
      case 'action': return 'border-purple-500 bg-purple-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Notification Bell */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 text-slate-300 hover:text-white transition-colors"
        >
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-[420px] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[500px] overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={createTestNotification}
                    disabled={loading}
                    className="text-xs text-green-700 hover:text-green-900 font-semibold bg-green-100 hover:bg-green-200 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Testing...' : 'Test'}
                  </button>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-blue-700 hover:text-blue-900 font-semibold bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded-lg transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 font-medium">No notifications yet</p>
                  <p className="text-sm text-gray-500 mt-1">We'll notify you about portfolio updates and market changes</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`p-4 hover:bg-gray-50 transition-all duration-200 border-l-4 ${
                        !notification.readAt ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white border-transparent hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                          getNotificationColor(notification.type, notification.priority)
                        }`}>
                          <div className={`${
                            notification.type === 'info' ? 'text-blue-700' :
                            notification.type === 'warning' ? 'text-yellow-700' :
                            notification.type === 'success' ? 'text-green-700' :
                            notification.type === 'error' ? 'text-red-700' :
                            notification.type === 'action' ? 'text-purple-700' :
                            'text-gray-700'
                          }`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <p className={`text-base font-bold ${
                              !notification.readAt ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title || 'System Notification'}
                            </p>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                                {formatTimeAgo(notification.createdAt)}
                              </span>
                              {!notification.readAt && (
                                <div className="w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow-sm"></div>
                              )}
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            {(() => {
                              console.log('🔔 [NOTIFICATION] Rendering notification:', notification);
                              console.log('🔔 [NOTIFICATION] Title:', notification.title);
                              console.log('🔔 [NOTIFICATION] Message:', notification.message);
                              console.log('🔔 [NOTIFICATION] ActionData:', notification.actionData);
                              
                              return notification.message ? (
                                <p className="text-sm font-medium text-gray-800 leading-relaxed">
                                  {notification.message}
                                </p>
                              ) : (
                                <div className="text-sm text-gray-600 italic">
                                  {notification.actionData ? 
                                    `Portfolio action: ${notification.actionData.action} ${notification.actionData.ticker}` :
                                    `Title: ${notification.title || 'No title'}`
                                  }
                                </div>
                              );
                            })()}
                          </div>

                          {notification.actionData && (
                            <div className="mt-2 p-2 bg-purple-50 rounded-md">
                              <div className="flex items-center space-x-2 text-sm">
                                <span className="font-medium text-purple-800">
                                  {notification.actionData.ticker}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  notification.actionData.action === 'BUY' ? 'bg-green-100 text-green-800' :
                                  notification.actionData.action === 'SELL' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {notification.actionData.action}
                                </span>
                              </div>
                              {notification.actionData.reason && (
                                <p className="text-xs text-purple-600 mt-1">
                                  {notification.actionData.reason}
                                </p>
                              )}
                            </div>
                          )}

                          <div className="flex items-center space-x-3 mt-4">
                            {!notification.readAt && (
                              <button
                                onClick={() => markAsRead(notification._id)}
                                className="flex items-center space-x-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-lg transition-colors"
                              >
                                <Check className="w-3 h-3" />
                                <span>Mark read</span>
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification._id)}
                              className="flex items-center space-x-1.5 text-xs font-semibold text-red-700 hover:text-red-800 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <X className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-4 border-t border-gray-200 text-center bg-gradient-to-r from-gray-50 to-blue-50">
                <a
                  href="/dashboard/notifications"
                  className="inline-flex items-center space-x-2 text-sm text-blue-700 hover:text-blue-900 font-semibold bg-blue-100 hover:bg-blue-200 px-4 py-2 rounded-lg transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  <span>View all notifications</span>
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
