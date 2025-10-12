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
  readAt?: string;
  createdAt: string;
}

interface NotificationBannerProps {
  isMobile?: boolean;
}

export default function NotificationBanner({ isMobile = false }: NotificationBannerProps) {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (notifications.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % notifications.length);
      }, 5000); // Rotate every 5 seconds
      return () => clearInterval(interval);
    }
  }, [notifications.length]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications?unreadOnly=true&limit=3`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const unreadNotifications = response.data.notifications || [];
      setNotifications(unreadNotifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (currentIndex >= notifications.length - 1) {
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
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

  const getTypeColor = (type: string, priority: string) => {
    if (priority === 'urgent') return 'bg-red-500 border-red-400';
    if (priority === 'high') return 'bg-orange-500 border-orange-400';
    if (type === 'success') return 'bg-green-500 border-green-400';
    if (type === 'warning') return 'bg-yellow-500 border-yellow-400';
    if (type === 'error') return 'bg-red-500 border-red-400';
    return 'bg-blue-500 border-blue-400';
  };

  if (!isVisible || notifications.length === 0) {
    return null;
  }

  const currentNotification = notifications[currentIndex];

  return (
    <div className={`w-full ${isMobile ? 'px-4' : 'px-6'} py-2 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700`}>
      <div className={`max-w-7xl mx-auto ${isMobile ? 'flex flex-col' : 'flex items-center justify-between'}`}>
        {/* Notification Content */}
        <div className="flex items-center space-x-3 flex-1">
          <span className="text-lg flex-shrink-0">
            {getTypeIcon(currentNotification.type)}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white border ${getTypeColor(currentNotification.type, currentNotification.priority)}`}>
                {currentNotification.priority.toUpperCase()}
              </span>
              <h4 className="text-sm font-semibold text-white truncate">
                {currentNotification.title}
              </h4>
            </div>
            <p className="text-xs text-slate-300 truncate mt-1">
              {currentNotification.message}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
          {notifications.length > 1 && (
            <div className="flex items-center space-x-1">
              {notifications.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-white' : 'bg-slate-500'
                  }`}
                />
              ))}
            </div>
          )}
          
          <button
            onClick={() => markAsRead(currentNotification.id)}
            className="text-slate-400 hover:text-white transition-colors"
            title="Mark as read"
          >
            ✕
          </button>
          
          <button
            onClick={() => setIsVisible(false)}
            className="text-slate-400 hover:text-white transition-colors"
            title="Hide notifications"
          >
            ─
          </button>
        </div>
      </div>
    </div>
  );
}
