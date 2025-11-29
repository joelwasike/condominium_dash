import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PencilLine, Bell, ShieldCheck, ToggleLeft, ToggleRight, Lock, Mail, Upload, Camera, X } from 'lucide-react';
import './SettingsPage.css';
import { profileService } from '../services/profileService';
import { cloudinaryService } from '../services/cloudinaryService';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [userId, setUserId] = useState(null);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    company: '',
    role: '',
    status: '',
    profilePicture: ''
  });
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const fileInputRef = useRef(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [preferences, setPreferences] = useState({
    emailUpdates: true,
    smsAlerts: false,
    pushNotifications: true,
    weeklySummary: true,
    darkMode: false
  });

  const addNotification = (message, type = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  // Load profile data (uses token to identify user, no userId needed)
  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const profile = await profileService.getProfile();
      setProfileForm({
        name: profile.name || '',
        email: profile.email || '',
        company: profile.company || '',
        role: profile.role || '',
        status: profile.status || '',
        profilePicture: profile.profilePicture || profile.profile_picture || ''
      });
      // Store user ID for potential future use
      if (profile.id) {
        setUserId(profile.id);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      addNotification('Failed to load profile data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load profile data on mount
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handlePasswordChange = (field, value) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
  };

  const handlePreferenceToggle = (field) => {
    setPreferences(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handlePictureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      addNotification('Please upload a valid image file (JPEG, PNG, or GIF)', 'error');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      addNotification('Image size must be less than 5MB', 'error');
      return;
    }

    setUploadingPicture(true);
    try {
      // Upload to Cloudinary
      const result = await cloudinaryService.uploadFile(file, 'profile-pictures');
      
      if (result.success) {
        // Update profile with the new picture URL
        const updatedProfile = await profileService.updateProfile({
          profilePicture: result.url
        });
        
        setProfileForm(prev => ({
          ...prev,
          profilePicture: result.url
        }));
        
        addNotification('Profile picture updated successfully', 'success');
      } else {
        addNotification(result.error || 'Failed to upload picture', 'error');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      addNotification('Failed to upload profile picture', 'error');
    } finally {
      setUploadingPicture(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addNotification('New passwords do not match', 'error');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      addNotification('Password must be at least 6 characters', 'error');
      return;
    }

    setSaving(true);
    try {
      await profileService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      addNotification('Password changed successfully', 'success');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      addNotification('Failed to change password. Please check your current password.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const renderTabs = () => (
    <div className="settings-tabs">
      <button
        type="button"
        className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
        onClick={() => setActiveTab('profile')}
      >
        Profile
      </button>
      <button
        type="button"
        className={`settings-tab ${activeTab === 'preferences' ? 'active' : ''}`}
        onClick={() => setActiveTab('preferences')}
      >
        Preferences
      </button>
      <button
        type="button"
        className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
        onClick={() => setActiveTab('security')}
      >
        Security
      </button>
    </div>
  );

  const renderProfileForm = () => (
    <div className="settings-card">
      <div className="settings-card-header">
        <div className="settings-avatar" style={{ position: 'relative' }}>
          {profileForm.profilePicture ? (
            <img 
              src={profileForm.profilePicture} 
              alt="Profile" 
              style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%', 
                objectFit: 'cover',
                border: '3px solid #fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }} 
            />
          ) : (
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #f97316 0%, #f43f5e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '2rem', fontWeight: 'bold' }}>
              {profileForm.name ? profileForm.name.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
          <button
            type="button"
            onClick={handlePictureClick}
            disabled={uploadingPicture}
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: '#3b82f6',
              border: '2px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: uploadingPicture ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              padding: 0
            }}
            title="Upload profile picture"
          >
            {uploadingPicture ? (
              <div style={{ width: '14px', height: '14px', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            ) : (
              <Camera size={14} color="white" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif"
            onChange={handlePictureUpload}
            style={{ display: 'none' }}
          />
        </div>
        <div className="settings-card-title">
          <h2>Profile</h2>
          <p>View your personal information and account details</p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>Loading profile...</div>
      ) : (
        <div className="settings-form">
          <div className="form-grid">
            <div className="form-field">
              <label>Full Name</label>
              <input
                type="text"
                value={profileForm.name || 'N/A'}
                disabled
                style={{ background: '#f3f4f6', cursor: 'not-allowed' }}
              />
            </div>
            <div className="form-field">
              <label>Email</label>
              <input
                type="email"
                value={profileForm.email || 'N/A'}
                disabled
                style={{ background: '#f3f4f6', cursor: 'not-allowed' }}
              />
            </div>
            <div className="form-field">
              <label>Company</label>
              <input
                type="text"
                value={profileForm.company || 'N/A'}
                disabled
                style={{ background: '#f3f4f6', cursor: 'not-allowed' }}
              />
            </div>
            <div className="form-field">
              <label>Role</label>
              <input
                type="text"
                value={profileForm.role || 'N/A'}
                disabled
                style={{ background: '#f3f4f6', cursor: 'not-allowed' }}
              />
            </div>
            <div className="form-field">
              <label>Status</label>
              <input
                type="text"
                value={profileForm.status || 'N/A'}
                disabled
                style={{ background: '#f3f4f6', cursor: 'not-allowed' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderPreferences = () => (
    <div className="settings-card">
      <div className="settings-card-header compact">
        <div className="settings-card-title">
          <h2>Notification Preferences</h2>
          <p>Choose what updates you want to receive</p>
        </div>
      </div>

      <div className="preferences-list">
        <div className="preference-item">
          <div className="preference-icon email">
            <Mail size={18} />
          </div>
          <div>
            <h3>Email Notifications</h3>
            <p>Receive updates and announcements via email.</p>
          </div>
          <button type="button" className="toggle-button" onClick={() => handlePreferenceToggle('emailUpdates')}>
            {preferences.emailUpdates ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
          </button>
        </div>
        <div className="preference-item">
          <div className="preference-icon sms">
            <Bell size={18} />
          </div>
          <div>
            <h3>SMS Alerts</h3>
            <p>Get instant alerts for important account activity.</p>
          </div>
          <button type="button" className="toggle-button" onClick={() => handlePreferenceToggle('smsAlerts')}>
            {preferences.smsAlerts ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
          </button>
        </div>
        <div className="preference-item">
          <div className="preference-icon push">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h3>Push Notifications</h3>
            <p>Allow notifications when you're working in the app.</p>
          </div>
          <button type="button" className="toggle-button" onClick={() => handlePreferenceToggle('pushNotifications')}>
            {preferences.pushNotifications ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
          </button>
        </div>
        <div className="preference-item">
          <div className="preference-icon summary">
            <Bell size={18} />
          </div>
          <div>
            <h3>Weekly Summary</h3>
            <p>Receive a summary of your activity every Monday.</p>
          </div>
          <button type="button" className="toggle-button" onClick={() => handlePreferenceToggle('weeklySummary')}>
            {preferences.weeklySummary ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
          </button>
        </div>
        <div className="preference-item">
          <div className="preference-icon theme">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h3>Dark Mode</h3>
            <p>Reduce eye strain with a dark color palette.</p>
          </div>
          <button type="button" className="toggle-button" onClick={() => handlePreferenceToggle('darkMode')}>
            {preferences.darkMode ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
          </button>
        </div>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="settings-card">
      <div className="settings-card-header compact">
        <div className="settings-card-title">
          <h2>Security Settings</h2>
          <p>Manage your password, authentication and sessions</p>
        </div>
      </div>

      <form className="settings-form" onSubmit={handlePasswordSubmit}>
        <div className="form-grid">
          <div className="form-field">
            <label>Current Password</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={e => handlePasswordChange('currentPassword', e.target.value)}
              required
              disabled={saving}
              placeholder="Enter your current password"
            />
          </div>
          <div className="form-field">
            <label>New Password</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={e => handlePasswordChange('newPassword', e.target.value)}
              required
              disabled={saving}
              placeholder="Enter your new password"
              minLength={6}
            />
          </div>
          <div className="form-field">
            <label>Confirm New Password</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={e => handlePasswordChange('confirmPassword', e.target.value)}
              required
              disabled={saving}
              placeholder="Confirm your new password"
              minLength={6}
            />
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Changing Password...' : 'Change Password'}
          </button>
        </div>
      </form>

      <div className="security-list" style={{ marginTop: '40px' }}>
        <div className="security-item">
          <div className="security-icon">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h3>Two-factor Authentication</h3>
            <p>Add an extra layer of security to your account.</p>
          </div>
          <button type="button" className="btn-primary ghost">Enable</button>
        </div>
        <div className="security-item">
          <div className="security-icon">
            <Bell size={18} />
          </div>
          <div>
            <h3>Login Alerts</h3>
            <p>Receive a notification when a new device signs in.</p>
          </div>
          <button type="button" className="btn-secondary">Manage</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="settings-page">
      {notifications.length > 0 && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
          {notifications.map(notification => (
            <div
              key={notification.id}
              style={{
                padding: '12px 20px',
                marginBottom: '10px',
                borderRadius: '8px',
                background: notification.type === 'success' ? '#10b981' : notification.type === 'error' ? '#ef4444' : '#3b82f6',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                minWidth: '300px'
              }}
            >
              {notification.message}
            </div>
          ))}
        </div>
      )}
      {renderTabs()}
      {activeTab === 'profile' && renderProfileForm()}
      {activeTab === 'preferences' && renderPreferences()}
      {activeTab === 'security' && renderSecurity()}
    </div>
  );
};

export default SettingsPage;
