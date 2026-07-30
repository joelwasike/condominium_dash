import React, { useState, useEffect, useRef } from 'react';
import { Settings, LogOut, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { t, getLanguage } from '../utils/i18n';
import './ProfileDropdown.css';

const ProfileDropdown = ({ userProfile, onLogout, onNavigateToSettings }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState(getLanguage());
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  useEffect(() => {
    const handleLanguageChange = () => {
      setLanguage(getLanguage());
    };
    window.addEventListener('languageChange', handleLanguageChange);
    return () => window.removeEventListener('languageChange', handleLanguageChange);
  }, []);
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
  const profilePicture = userProfile?.profilePictureURL || userProfile?.ProfilePictureURL || userProfile?.profilePicture || userProfile?.profile_picture;
  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return 'U';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    if (parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase();
    return parts[0].charAt(0).toUpperCase() || 'U';
  };

  const initials = getInitials(userName);

  return (
    <div className="profile-dropdown-wrapper" ref={dropdownRef}>
      <button
        className="profile-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('common.profile')}>
        
        {profilePicture ?
        <img
          src={profilePicture}
          alt={userName}
          className="profile-avatar-image" /> :


        <span className="profile-avatar-initials" aria-hidden="true">
            {initials}
          </span>
        }
        <ChevronDown size={16} className="dropdown-chevron" />
      </button>

      {isOpen &&
      <div className="profile-dropdown-menu">
          <div className="profile-dropdown-header">
            <div className="profile-info">
              {profilePicture ?
            <img
              src={profilePicture}
              alt={userName}
              className="profile-avatar-large" /> :


            <div className="profile-avatar-placeholder">
                  {initials}
                </div>
            }
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
            onClick={handleSettingsClick}>
            
              <Settings size={18} />
              <span>{t('common.settings')}</span>
            </button>
          </div>

          <div className="profile-dropdown-divider" />

          <div className="profile-dropdown-items">
            <button
            className="profile-dropdown-item danger"
            onClick={handleLogout}>
            
              <LogOut size={18} />
              <span>{t('common.logout')}</span>
            </button>
          </div>
        </div>
      }
    </div>);

};

export default ProfileDropdown;
