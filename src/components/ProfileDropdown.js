import React, { useState, useEffect, useRef } from 'react';
import { UserCircle, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { t } from '../utils/i18n';
import './ProfileDropdown.css';

const ProfileDropdown = ({ userProfile, onLogout, onNavigateToSettings }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSettingsClick = () => {
    if (onNavigateToSettings) {
      onNavigateToSettings();
    }
    setIsOpen(false);
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    setIsOpen(false);
  };

  const userName = userProfile?.name || userProfile?.username || 'User';
  const userRole = userProfile?.role || '';
  const profilePicture = userProfile?.profilePictureURL || userProfile?.ProfilePictureURL;

  return (
    <div className="profile-dropdown-wrapper" ref={dropdownRef}>
      <button
        className="profile-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('common.profile')}
      >
        {profilePicture ? (
          <img
            src={profilePicture}
            alt={userName}
            className="profile-avatar-image"
          />
        ) : (
          <UserCircle size={28} />
        )}
        <ChevronDown size={16} className="dropdown-chevron" />
      </button>

      {isOpen && (
        <div className="profile-dropdown-menu">
          <div className="profile-dropdown-header">
            <div className="profile-info">
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt={userName}
                  className="profile-avatar-large"
                />
              ) : (
                <div className="profile-avatar-placeholder">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="profile-details-text">
                <div className="profile-name">{userName}</div>
                <div className="profile-role">{userRole}</div>
              </div>
            </div>
          </div>

          <div className="profile-dropdown-divider" />

          <div className="profile-dropdown-items">
            <button
              className="profile-dropdown-item"
              onClick={handleSettingsClick}
            >
              <Settings size={18} />
              <span>{t('common.settings')}</span>
            </button>
          </div>

          <div className="profile-dropdown-divider" />

          <div className="profile-dropdown-items">
            <button
              className="profile-dropdown-item danger"
              onClick={handleLogout}
            >
              <LogOut size={18} />
              <span>{t('common.logout')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
