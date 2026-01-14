import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Bell, X, Check, Settings } from 'lucide-react';
import { t, getLanguage } from '../utils/i18n';
import { notificationService } from '../services/notificationService';
import './NotificationDropdown.css';

const NotificationDropdown = ({ userId: propUserId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState(getLanguage());
  const dropdownRef = useRef(null);
  
  // Listen for language changes to trigger re-render
  useEffect(() => {
    const handleLanguageChange = () => {
      setLanguage(getLanguage());
    };
    window.addEventListener('languageChange', handleLanguageChange);
    return () => window.removeEventListener('languageChange', handleLanguageChange);
  }, []);

  // Get userId from localStorage if not provided as prop
  const userId = useMemo(() => {
    if (propUserId) return propUserId;
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        return user.id || user.ID;
      }
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
    }
    return null;
  }, [propUserId]);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await notificationService.getNotifications();
      
      // Handle different response formats
      let notificationsList = [];
      if (Array.isArray(response)) {
        notificationsList = response;
      } else if (response && Array.isArray(response.notifications)) {
        notificationsList = response.notifications;
      } else if (response && Array.isArray(response.items)) {
        notificationsList = response.items;
      }
      
      // Normalize notification objects (handle different field name formats)
      const normalizedNotifications = notificationsList.map(notif => ({
        id: notif.id || notif.ID,
        type: notif.type || notif.Type || 'info',
        title: notif.title || notif.Title || 'Notification',
        message: notif.message || notif.Message || notif.content || notif.Content || '',
        read: notif.read || notif.Read || false,
        createdAt: notif.createdAt || notif.CreatedAt || notif.created_at || new Date().toISOString(),
      }));
      
      setNotifications(normalizedNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Set empty array on error instead of crashing
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // Optimistically update UI
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Optionally reload notifications on error
      // loadNotifications();
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      
      // Optimistically update UI
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
      // Optionally reload notifications on error
      // loadNotifications();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      loadNotifications();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, loadNotifications]);

  // Load notifications on mount and when dropdown opens
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const unreadNotifications = notifications.filter(n => !n.read);

  return (
    <div className="notification-dropdown-wrapper" ref={dropdownRef}>
      <button
        className="notification-bell-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('common.notifications')}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>{t('notifications.title')}</h3>
            <div className="notification-actions">
              {unreadCount > 0 && (
                <button
                  className="mark-all-read-button"
                  onClick={markAllAsRead}
                  title={t('notifications.markAllRead')}
                >
                  <Check size={16} />
                </button>
              )}
              <button
                className="close-dropdown-button"
                onClick={() => setIsOpen(false)}
                title={t('common.cancel')}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">{t('common.loading')}</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">{t('notifications.noNotifications')}</div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="notification-icon">
                    {!notification.read && <div className="unread-dot" />}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">
                      {new Date(notification.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="notification-footer">
            <button
              className="notification-preferences-button"
              onClick={() => {
                // Navigate to notification preferences in settings
                window.location.hash = '#notifications';
                setIsOpen(false);
              }}
            >
              <Settings size={16} />
              {t('notifications.preferences')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
