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
      // 🔧 Safety check: Ensure notificationId is valid
      if (!notificationId) {
        console.error('❌ Cannot mark notification as read: ID is undefined or null');
        return;
      }
      
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
      // 🔧 Safety check: Ensure notificationId is valid
      if (!notificationId) {
        console.error('❌ Cannot delete notification: ID is undefined or null');
        return;
      }
      
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
      case 'info': return <Info className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'success': return <CheckCircle className="w-4 h-4" />;
      case 'error': return <XCircle className="w-4 h-4" />;
      case 'action': return <TrendingUp className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
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

  const handleNotificationClick = () => {
    // VIBRATE on open (Major's requirement!)
    if ('vibrate' in navigator) {
      navigator.vibrate(200); // 200ms buzz, godamt!
    }
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Notification Bell - DESKTOP */}
      <div className="relative hidden sm:block">
        <button
          onClick={handleNotificationClick}
          className="relative p-2 text-slate-300 hover:text-white transition-colors"
        >
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown - DESKTOP */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-[400px] bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[500px] overflow-hidden">
            <div className="p-3 border-b border-gray-200 bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={createTestNotification}
                    disabled={loading}
                    className="text-xs text-green-700 hover:text-green-900 font-medium bg-green-100 hover:bg-green-200 px-2 py-1 rounded transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Test...' : 'Test'}
                  </button>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-blue-700 hover:text-blue-900 font-medium bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded transition-colors"
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 p-1 rounded transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 text-sm font-medium">No notifications yet</p>
                  <p className="text-xs text-gray-500 mt-1">We'll notify you about portfolio updates</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`p-3 hover:bg-gray-50 transition-all duration-200 border-l-3 ${
                        !notification.readAt ? 'bg-blue-50 border-blue-500' : 'bg-white border-transparent hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center ${
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
                          <div className="flex items-center justify-between mb-1">
                            <p className={`text-sm font-semibold ${
                              !notification.readAt ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title || 'System Notification'}
                            </p>
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                {formatTimeAgo(notification.createdAt)}
                              </span>
                              {!notification.readAt && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              )}
                            </div>
                          </div>
                          
                          <div className="mb-2">
                            {notification.message ? (
                              <p className="text-xs text-gray-700 leading-relaxed">
                                {notification.message}
                              </p>
                            ) : (
                              <div className="text-xs text-gray-600">
                                {notification.actionData ? 
                                  `Action: ${notification.actionData.action} ${notification.actionData.ticker}` :
                                  notification.title || 'No details'
                                }
                              </div>
                            )}
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

                          <div className="flex items-center space-x-2 mt-2">
                            {!notification.readAt && (
                              <button
                                onClick={() => markAsRead(notification._id)}
                                className="flex items-center space-x-1 text-xs font-medium text-blue-700 hover:text-blue-800 bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded transition-colors"
                              >
                                <Check className="w-3 h-3" />
                                <span>Read</span>
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification._id)}
                              className="flex items-center space-x-1 text-xs font-medium text-red-700 hover:text-red-800 bg-red-100 hover:bg-red-200 px-2 py-1 rounded transition-colors"
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
              <div className="p-3 border-t border-gray-200 text-center bg-gray-50">
                <a
                  href="/dashboard/notifications"
                  className="inline-flex items-center space-x-1 text-xs text-blue-700 hover:text-blue-900 font-medium bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded transition-colors"
                >
                  <Bell className="w-3 h-3" />
                  <span>View all</span>
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MOBILE FULL SCREEN PANEL - MAJOR'S REQUIREMENT */}
      {isOpen && (
        <div className="block sm:hidden fixed inset-0 z-[9999] bg-slate-900">
          {/* Mobile Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-3">
              <Bell className="w-6 h-6 text-white" />
              <div>
                <h2 className="text-lg font-black text-white">NOTIFICATIONS</h2>
                {unreadCount > 0 && (
                  <p className="text-xs text-white/80">{unreadCount} unread</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white text-xs font-bold"
                >
                  Mark All Read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          {/* Mobile Notifications List */}
          <div className="overflow-y-auto h-[calc(100vh-80px)] p-4">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 rounded-xl border-2 ${
                      notification.readAt 
                        ? 'bg-slate-800/50 border-slate-700' 
                        : 'bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-blue-500 shadow-lg shadow-blue-500/20'
                    }`}
                    onClick={() => {
                      // VIBRATE when tapping notification
                      if ('vibrate' in navigator) {
                        navigator.vibrate([100, 50, 100]); // Pattern: buzz-pause-buzz
                      }
                      if (!notification.readAt) {
                        markAsRead(notification._id);
                      }
                    }}
                  >
                    {/* Icon & Priority */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getNotificationIcon(notification.type)}
                        {notification.priority === 'urgent' && (
                          <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-black rounded-full animate-pulse">
                            URGENT
                          </span>
                        )}
                      </div>
                      {!notification.readAt && (
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                      )}
                    </div>

                    {/* Content */}
                    <h4 className={`text-sm font-bold mb-1 ${
                      notification.readAt ? 'text-slate-400' : 'text-white'
                    }`}>
                      {notification.title}
                    </h4>
                    <p className={`text-xs mb-2 ${
                      notification.readAt ? 'text-slate-500' : 'text-slate-300'
                    }`}>
                      {notification.message}
                    </p>

                    {/* Action Data */}
                    {notification.actionData && (
                      <div className="mt-2 p-2 bg-slate-700/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">
                            {notification.actionData.ticker}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-black ${
                            notification.actionData.action === 'BUY' ? 'bg-emerald-600 text-white' :
                            notification.actionData.action === 'SELL' ? 'bg-red-600 text-white' :
                            'bg-yellow-600 text-white'
                          }`}>
                            {notification.actionData.action}
                          </span>
                        </div>
                        {notification.actionData.reason && (
                          <p className="text-xs text-slate-400 mt-1">
                            {notification.actionData.reason}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-700">
                      <span className="text-xs text-slate-500">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification._id);
                          // VIBRATE on delete
                          if ('vibrate' in navigator) {
                            navigator.vibrate(50);
                          }
                        }}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close - DESKTOP ONLY */}
      {isOpen && (
        <div
          className="hidden sm:block fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
